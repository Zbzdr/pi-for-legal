#!/usr/bin/env python3
"""Create a narrow DOCX tracked-change redline from exact replacements.

Adapted for Pi for Legal from the contract-redline workflow in Anthropic's
claude-for-legal revision 4a6c651889c97cc9140580363c73e0eb17379c2b.
Distributed under Apache-2.0; see the package NOTICE.
"""

from __future__ import annotations

import argparse
import copy
import datetime as dt
import io
import json
import os
from pathlib import Path
import re
import shutil
import sys
import tempfile
import zipfile

try:
    from docx import Document
    from lxml import etree as ET
    USING_LXML = True
except ImportError:
    Document = None
    from xml.etree import ElementTree as ET
    USING_LXML = False


W_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
XML_NS = "http://www.w3.org/XML/1998/namespace"
CT_NS = "http://schemas.openxmlformats.org/package/2006/content-types"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
MC_NS = "http://schemas.openxmlformats.org/markup-compatibility/2006"
W = f"{{{W_NS}}}"
ET.register_namespace("w", W_NS)


def namespaced_root(local_name: str, namespace: str, prefix: str | None = None):
    tag = f"{{{namespace}}}{local_name}"
    if USING_LXML:
        return ET.Element(tag, nsmap={prefix: namespace})
    ET.register_namespace(prefix or "", namespace)
    return ET.Element(tag)


class RedlineError(RuntimeError):
    pass


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Apply exact replacements to a DOCX as Word tracked changes."
    )
    parser.add_argument("input", type=Path, help="Source DOCX; never modified")
    parser.add_argument("--edits", required=True, type=Path, help="JSON edit list")
    parser.add_argument("--output", type=Path, help="Output DOCX path")
    parser.add_argument("--workspace", type=Path, default=Path.cwd())
    parser.add_argument("--author", default="Pi for Legal")
    parser.add_argument("--overwrite", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument(
        "--allow-stdlib-fallback",
        action="store_true",
        help=argparse.SUPPRESS,
    )
    return parser.parse_args()


def load_edits(path: Path) -> list[dict[str, object]]:
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise RedlineError(f"Cannot read edit JSON: {exc}") from exc
    edits = payload.get("edits") if isinstance(payload, dict) else payload
    if not isinstance(edits, list) or not edits:
        raise RedlineError("Edit JSON must contain a non-empty edits array")
    normalized: list[dict[str, object]] = []
    for index, edit in enumerate(edits, start=1):
        if not isinstance(edit, dict):
            raise RedlineError(f"Edit {index} must be an object")
        match = edit.get("match")
        replacement = edit.get("replacement")
        occurrence = edit.get("occurrence")
        if not isinstance(match, str) or not match:
            raise RedlineError(f"Edit {index} needs a non-empty string match")
        if not isinstance(replacement, str):
            raise RedlineError(f"Edit {index} needs a string replacement")
        if "\n" in match or "\n" in replacement or "\r" in match or "\r" in replacement:
            raise RedlineError(f"Edit {index} cannot span paragraphs")
        if occurrence is not None and (not isinstance(occurrence, int) or occurrence < 1):
            raise RedlineError(f"Edit {index} occurrence must be a positive integer")
        normalized.append({**edit, "match": match, "replacement": replacement})
    return normalized


def run_text(run: ET.Element) -> str:
    allowed = {f"{W}rPr", f"{W}t"}
    if any(child.tag not in allowed for child in list(run)):
        return ""
    return "".join(node.text or "" for node in run.findall(f"{W}t"))


def paragraph_map(paragraph: ET.Element) -> tuple[str, list[tuple[ET.Element, int, int]]]:
    text_parts: list[str] = []
    mapping: list[tuple[ET.Element, int, int]] = []
    cursor = 0
    for child in list(paragraph):
        if child.tag != f"{W}r":
            continue
        text = run_text(child)
        if not text:
            continue
        start = cursor
        cursor += len(text)
        text_parts.append(text)
        mapping.append((child, start, cursor))
    return "".join(text_parts), mapping


def paragraph_is_supported(paragraph: ET.Element) -> bool:
    unsupported = {
        f"{W}ins",
        f"{W}del",
        f"{W}moveFrom",
        f"{W}moveTo",
        f"{W}hyperlink",
        f"{W}fldSimple",
        f"{W}sdt",
        f"{W}smartTag",
    }
    return not any(node.tag in unsupported for node in paragraph.iter())


def occurrences(text: str, needle: str) -> list[int]:
    found: list[int] = []
    cursor = 0
    while True:
        index = text.find(needle, cursor)
        if index < 0:
            return found
        found.append(index)
        cursor = index + max(1, len(needle))


def find_matches(root: ET.Element, needle: str) -> list[tuple[ET.Element, int, int]]:
    matches: list[tuple[ET.Element, int, int]] = []
    for paragraph in root.iter(f"{W}p"):
        if not paragraph_is_supported(paragraph):
            continue
        text, _ = paragraph_map(paragraph)
        for start in occurrences(text, needle):
            matches.append((paragraph, start, start + len(needle)))
    return matches


def text_run_like(source: ET.Element, text: str, *, deleted: bool = False) -> ET.Element:
    run = ET.Element(f"{W}r")
    properties = source.find(f"{W}rPr")
    if properties is not None:
        run.append(copy.deepcopy(properties))
    text_node = ET.SubElement(run, f"{W}{'delText' if deleted else 't'}")
    if text[:1].isspace() or text[-1:].isspace():
        text_node.set(f"{{{XML_NS}}}space", "preserve")
    text_node.text = text
    return run


def tracked_wrapper(
    kind: str,
    source_run: ET.Element,
    text: str,
    change_id: int,
    author: str,
    timestamp: str,
) -> ET.Element:
    wrapper = ET.Element(f"{W}{kind}")
    wrapper.set(f"{W}id", str(change_id))
    wrapper.set(f"{W}author", author)
    wrapper.set(f"{W}date", timestamp)
    wrapper.append(text_run_like(source_run, text, deleted=(kind == "del")))
    return wrapper


def replace_match(
    paragraph: ET.Element,
    start: int,
    end: int,
    old: str,
    new: str,
    next_id: int,
    author: str,
    timestamp: str,
) -> int:
    _, mapping = paragraph_map(paragraph)
    affected = [entry for entry in mapping if entry[1] < end and entry[2] > start]
    if not affected:
        raise RedlineError("Matched text is not represented by ordinary paragraph runs")
    first_run, first_start, first_end = affected[0]
    last_run, last_start, last_end = affected[-1]
    first_text = run_text(first_run)
    last_text = run_text(last_run)
    prefix = first_text[: max(0, start - first_start)]
    suffix = last_text[max(0, end - last_start) :]

    children = list(paragraph)
    insertion_index = children.index(first_run)
    for run, _, _ in affected:
        paragraph.remove(run)

    replacements: list[ET.Element] = []
    if prefix:
        replacements.append(text_run_like(first_run, prefix))
    replacements.append(tracked_wrapper("del", first_run, old, next_id, author, timestamp))
    if new:
        replacements.append(tracked_wrapper("ins", first_run, new, next_id + 1, author, timestamp))
        next_id += 1
    if suffix:
        replacements.append(text_run_like(last_run, suffix))

    for offset, element in enumerate(replacements):
        paragraph.insert(insertion_index + offset, element)
    return next_id + 1


def next_change_id(root: ET.Element) -> int:
    ids: list[int] = []
    for tag in (f"{W}ins", f"{W}del"):
        for node in root.iter(tag):
            raw = node.get(f"{W}id")
            if raw and raw.isdigit():
                ids.append(int(raw))
    return max(ids, default=0) + 1


def backup_files(source: Path, output: Path, workspace: Path) -> tuple[Path, Path | None]:
    stamp = dt.datetime.now(dt.timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    backup_dir = workspace / ".pi" / "legal-workbench" / "backups" / "docx-redline" / stamp
    backup_dir.mkdir(parents=True, exist_ok=False)
    source_backup = backup_dir / source.name
    shutil.copy2(source, source_backup)
    output_backup: Path | None = None
    if output.exists():
        output_backup = backup_dir / f"existing-output-{output.name}"
        shutil.copy2(output, output_backup)
    return source_backup, output_backup


def namespace_map(xml: bytes) -> dict[str, str]:
    namespaces: dict[str, str] = {}
    for _, pair in ET.iterparse(io.BytesIO(xml), events=("start-ns",)):
        prefix, uri = pair
        namespaces[prefix or ""] = uri
        if prefix not in {"xml"} and not re.fullmatch(r"ns\d+", prefix or ""):
            if prefix or not USING_LXML:
                ET.register_namespace(prefix or "", uri)
    return namespaces


def ignorable_namespaces(xml: bytes, root: ET.Element) -> dict[str, str]:
    namespaces = namespace_map(xml)
    tokens = (root.get(f"{{{MC_NS}}}Ignorable") or "").split()
    return {prefix: namespaces[prefix] for prefix in tokens if prefix in namespaces}


def xml_bytes(root: ET.Element, required_root_namespaces: dict[str, str] | None = None) -> bytes:
    serialized = ET.tostring(root, encoding="utf-8", xml_declaration=True)
    for prefix, uri in (required_root_namespaces or {}).items():
        declaration = f'xmlns:{prefix}="'.encode()
        if declaration in serialized:
            continue
        root_start = serialized.find(b"<", serialized.find(b"?>") + 2)
        root_end = serialized.find(b">", root_start)
        insertion = f' xmlns:{prefix}="{uri}"'.encode("utf-8")
        serialized = serialized[:root_end] + insertion + serialized[root_end:]
    return serialized


def enable_track_revisions(entries: dict[str, bytes]) -> None:
    settings_path = "word/settings.xml"
    if settings_path in entries:
        try:
            original_settings = entries[settings_path]
            settings_namespaces = namespace_map(original_settings)
            settings = ET.fromstring(original_settings)
        except ET.ParseError as exc:
            raise RedlineError(f"Invalid Word settings XML: {exc}") from exc
        if settings.find(f"{W}trackRevisions") is None:
            word_prefix = next((prefix for prefix, uri in settings_namespaces.items() if uri == W_NS), "w")
            element = f"<{word_prefix}:trackRevisions/>" if word_prefix else f'<trackRevisions xmlns="{W_NS}"/>'
            root_start = original_settings.find(b"<", original_settings.find(b"?>") + 2)
            root_end = original_settings.find(b">", root_start)
            entries[settings_path] = (
                original_settings[: root_end + 1]
                + element.encode("utf-8")
                + original_settings[root_end + 1 :]
            )
    else:
        settings = namespaced_root("settings", W_NS, "w")
        settings.append(ET.Element(f"{W}trackRevisions"))
        entries[settings_path] = xml_bytes(settings)

    try:
        content_types = ET.fromstring(entries["[Content_Types].xml"])
    except (KeyError, ET.ParseError) as exc:
        raise RedlineError(f"Cannot wire Word settings content type: {exc}") from exc
    override_tag = f"{{{CT_NS}}}Override"
    if not any(node.get("PartName") == "/word/settings.xml" for node in content_types.findall(override_tag)):
        ET.SubElement(
            content_types,
            override_tag,
            {
                "PartName": "/word/settings.xml",
                "ContentType": "application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml",
            },
        )
    entries["[Content_Types].xml"] = xml_bytes(content_types)

    rels_path = "word/_rels/document.xml.rels"
    if rels_path not in entries:
        relationships = namespaced_root("Relationships", REL_NS)
    else:
        try:
            relationships = ET.fromstring(entries[rels_path])
        except ET.ParseError as exc:
            raise RedlineError(f"Invalid document relationships XML: {exc}") from exc
    relationship_tag = f"{{{REL_NS}}}Relationship"
    settings_type = "http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings"
    if not any(node.get("Type") == settings_type for node in relationships.findall(relationship_tag)):
        used_ids = {node.get("Id") for node in relationships.findall(relationship_tag)}
        candidate = 1
        while f"rId{candidate}" in used_ids:
            candidate += 1
        ET.SubElement(
            relationships,
            relationship_tag,
            {"Id": f"rId{candidate}", "Type": settings_type, "Target": "settings.xml"},
        )
    entries[rels_path] = xml_bytes(relationships)


def write_docx(entries: dict[str, bytes], output: Path) -> None:
    output.parent.mkdir(parents=True, exist_ok=True)
    handle, temporary_name = tempfile.mkstemp(prefix=f".{output.name}.", suffix=".tmp", dir=output.parent)
    os.close(handle)
    temporary = Path(temporary_name)
    try:
        with zipfile.ZipFile(temporary, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for name, content in entries.items():
                archive.writestr(name, content)
        with zipfile.ZipFile(temporary) as archive:
            bad_file = archive.testzip()
            if bad_file:
                raise RedlineError(f"Output ZIP verification failed at {bad_file}")
            ET.fromstring(archive.read("word/document.xml"))
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)


def main() -> int:
    args = parse_args()
    source = args.input.expanduser().resolve()
    edits_path = args.edits.expanduser().resolve()
    workspace = args.workspace.expanduser().resolve()
    output = (
        args.output.expanduser().resolve()
        if args.output
        else source.with_name(f"{source.stem}.redline.docx")
    )
    if source.suffix.lower() != ".docx" or not source.is_file():
        raise RedlineError(f"Input is not a readable DOCX: {source}")
    if output == source:
        raise RedlineError("In-place modification is not supported; choose a separate output")
    if output.exists() and not args.overwrite:
        raise RedlineError(f"Output exists; confirm and rerun with --overwrite: {output}")
    if Document is None and not args.allow_stdlib_fallback:
        raise RedlineError(
            "The workspace DOCX runtime is not active. Run setup_docx_env.py, then invoke "
            "this script with .pi/legal-workbench/venvs/docx-redline/bin/python."
        )
    edits = load_edits(edits_path)

    if Document is not None:
        try:
            Document(str(source))
        except Exception as exc:
            raise RedlineError(f"python-docx could not open the source package: {exc}") from exc

    try:
        with zipfile.ZipFile(source) as archive:
            if archive.testzip():
                raise RedlineError("Input DOCX ZIP is corrupt")
            entries = {name: archive.read(name) for name in archive.namelist()}
    except (OSError, zipfile.BadZipFile, KeyError) as exc:
        raise RedlineError(f"Cannot read DOCX package: {exc}") from exc
    if "word/document.xml" not in entries:
        raise RedlineError("DOCX has no word/document.xml")
    try:
        namespace_map(entries["word/document.xml"])
        root = ET.fromstring(entries["word/document.xml"])
    except ET.ParseError as exc:
        raise RedlineError(f"Invalid Word document XML: {exc}") from exc

    planned: list[tuple[ET.Element, int, int, int, dict[str, object], int, int]] = []
    for index, edit in enumerate(edits, start=1):
        old = str(edit["match"])
        matches = find_matches(root, old)
        requested = edit.get("occurrence")
        if requested is None and len(matches) != 1:
            raise RedlineError(
                f"Edit {index} expected one exact match but found {len(matches)}; "
                "supply a verified one-based occurrence when appropriate"
            )
        occurrence = int(requested) if requested is not None else 1
        if occurrence > len(matches):
            raise RedlineError(f"Edit {index} occurrence {occurrence} exceeds {len(matches)} matches")
        paragraph, start, end = matches[occurrence - 1]
        planned.append((paragraph, start, end, index, edit, occurrence, len(matches)))

    by_paragraph: dict[int, list[tuple[ET.Element, int, int, int, dict[str, object], int, int]]] = {}
    for plan in planned:
        by_paragraph.setdefault(id(plan[0]), []).append(plan)
    for plans in by_paragraph.values():
        ordered = sorted(plans, key=lambda item: (item[1], item[2]))
        for previous, current in zip(ordered, ordered[1:]):
            if current[1] < previous[2]:
                raise RedlineError(f"Edits {previous[3]} and {current[3]} overlap in one paragraph")

    change_id = next_change_id(root)
    timestamp = dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    applied: list[dict[str, object]] = []
    for paragraph_plans in by_paragraph.values():
        for paragraph, start, end, index, edit, occurrence, match_count in sorted(
            paragraph_plans, key=lambda item: item[1], reverse=True
        ):
            old = str(edit["match"])
            new = str(edit["replacement"])
            change_id = replace_match(
                paragraph, start, end, old, new, change_id, args.author, timestamp
            )
            applied.append(
                {
                    "edit": index,
                    "occurrence": occurrence,
                    "matchCountAtApply": match_count,
                    "source": edit.get("source"),
                    "reason": edit.get("reason"),
                }
            )
    applied.sort(key=lambda item: int(item["edit"]))

    result: dict[str, object] = {
        "ok": True,
        "dryRun": bool(args.dry_run),
        "input": str(source),
        "output": str(output),
        "editCount": len(applied),
        "applied": applied,
        "runtime": "python-docx+lxml" if Document is not None else "stdlib-test-fallback",
    }
    if args.dry_run:
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0

    source_backup, output_backup = backup_files(source, output, workspace)
    entries["word/document.xml"] = xml_bytes(
        root,
        ignorable_namespaces(entries["word/document.xml"], root),
    )
    enable_track_revisions(entries)
    write_docx(entries, output)
    result["backup"] = str(source_backup)
    result["previousOutputBackup"] = str(output_backup) if output_backup else None
    with zipfile.ZipFile(output) as archive:
        verified_root = ET.fromstring(archive.read("word/document.xml"))
    result["trackedInsertions"] = len(list(verified_root.iter(f"{W}ins")))
    result["trackedDeletions"] = len(list(verified_root.iter(f"{W}del")))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except RedlineError as exc:
        print(json.dumps({"ok": False, "error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise SystemExit(2)
