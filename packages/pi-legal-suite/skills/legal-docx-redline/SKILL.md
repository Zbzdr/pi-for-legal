---
name: legal-docx-redline
description: Apply an approved set of exact clause replacements to a DOCX as lightweight Word tracked changes, with automatic project-local backup and structural verification. Use after legal review when the user asks for a redline, tracked changes, markup, or a revised Word contract.
---

# Lightweight DOCX redline

> **Attribution:** Adapted from Anthropic's claude-for-legal contract-redline workflow at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package NOTICE.

Create a recoverable tracked-changes draft from a reviewed `.docx`. This is a narrow execution Skill, not a substitute for contract review. Run `/skill:legal-contract-review` first unless the user has already supplied an approved change list.

## Preconditions

1. Resolve the project profile, active side, authority matrix, and matter context.
2. Confirm the source DOCX and intended output path.
3. Build an edit list from exact source text. Each edit needs `match`, `replacement`, and optionally `occurrence`, `reason`, and `source`.
4. Show the user the exact old/new text and affected clause anchors. Obtain confirmation before applying edits.
5. Refuse to describe proposed language as approved unless the authorized reviewer approved it.

Default to surgical edits. Do not replace a whole clause when a word, phrase, sentence, or subclause will achieve the approved position.

## Project-local execution

Use the workspace-local Python environment at `.pi/legal-workbench/venvs/docx-redline/`. The pinned runtime contains `python-docx` for package/structure handling and `lxml` for the OOXML tracked-change layer. `python-docx` does not expose a first-class tracked-changes API, so the bundled script deliberately combines both layers.

Before the first DOCX operation, resolve `scripts/setup_docx_env.py` relative to this Skill and run:

```bash
python3 <resolved-setup-script> --workspace .
```

This may download the pinned packages in `scripts/requirements.txt`. Tell the user what will be installed and obtain confirmation before the first networked installation. Reuse the environment on later runs; `--check` verifies it without changing anything. Never install DOCX dependencies into the system or user-global Python environment.

## Edit file

Write the confirmed list to a project-local temporary JSON file such as `.pi/legal-workbench/tmp/docx-redline-edits.json`:

```json
{
  "edits": [
    {
      "match": "fees paid during the three months preceding the claim",
      "replacement": "fees paid or payable during the twelve months preceding the claim",
      "reason": "Approved liability-cap fallback",
      "source": "Section 12.1"
    }
  ]
}
```

Omit `occurrence` when the match is unique. If the same text appears more than once, set a one-based `occurrence` only after identifying the correct clause. The script fails closed on missing or ambiguous text.

## Apply

Resolve the bundled script as `<this-skill-directory>/scripts/docx_redline.py`, then from the project root run:

```bash
.pi/legal-workbench/venvs/docx-redline/bin/python <resolved-script-path> \
  contract.docx \
  --edits .pi/legal-workbench/tmp/docx-redline-edits.json \
  --workspace . \
  --author "Pi for Legal"
```

The script always:

- keeps the input DOCX unchanged;
- writes a backup under `.pi/legal-workbench/backups/docx-redline/<timestamp>/` before producing output;
- defaults to `<source>.redline.docx`;
- refuses to overwrite an existing output unless `--overwrite` is explicitly supplied after confirmation;
- writes `<w:del>` and `<w:ins>` tracked-change markup; and
- verifies the source with `python-docx`, then verifies the output ZIP and OOXML structure before reporting success.

## Limits and fallback

The lightweight engine handles exact text within a single Word paragraph, including text split across ordinary runs. It intentionally refuses:

- matches spanning paragraphs or table cells;
- text inside fields, hyperlinks, text boxes, headers, footers, footnotes, or existing tracked-change wrappers;
- formatting-heavy or structurally ambiguous replacements;
- approximate or semantic matching.

When an edit is refused, leave the document unchanged and report the exact reason. Offer either a smaller exact replacement, a Word-ready change table, or an available full DOCX editing capability.

## Verification and delivery

After the script succeeds:

1. verify the reported backup and output paths;
2. inspect the output structurally and, when LibreOffice or another renderer is available, render and visually inspect every page;
3. report any formatting or pagination change;
4. deliver the redline as a draft for lawyer review; and
5. never send, upload, sign, or replace the source without separate authorization.
