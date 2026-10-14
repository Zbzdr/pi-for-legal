---
name: legal-document-edit
description: Draft and correct legal text in Markdown with incremental local Git history. Use for ordinary edits, changing a chapter's drafting logic, comparing prior versions, or parallel proposals; create DOCX only on express request.
---

# Incremental drafting and original-text references

> **Attribution:** Original Pi workflow, maintained alongside Anthropic-derived legal workflows modified for Pi, informed by Aider's automatic Git commits and Manubot's Markdown-source practices. No third-party implementation is copied. See the package NOTICE.

## Bind the matter and use setup's Git policy

Read the profile and bind the user's chosen active matter with `legal_matter_session`. Workspace setup normally authorizes automatic local Git for subsequent matters and configures the commit identity. The extension initializes the bound matter's document repository when needed; do not ask for another enrollment or per-edit commit approval. For a legacy/manual-policy workspace, use `legal_document_revision status`, explain the local scope/retained history/no automatic upload, and obtain the one-time enrollment approval before `enable`.

Visible Markdown drafts and notes are versioned. Lifecycle `matter.md`/`history.md`, hidden state, structured machine records, source binaries, and DOCX are excluded. Preserve supplied sources; extracted Markdown is not an authoritative replacement. Do not change global Git identity, take over an unmarked repository, install Git or add remotes silently.

## Ordinary edits: continue the current text

For corrections, small wording changes, and routine continuation, read and edit the current file in place. No new branch/worktree, baseline ceremony, or repeated confirmation is needed. Before any first commit, choosing between competing historic baselines is not a user-facing issue. Use the smallest justified change: character before word, word before phrase, phrase before sentence. Do not broaden a request to change three months to twelve months into a chapter rewrite.

The extension commits actual Markdown differences after completed tools, including native and nested codemode calls. Sequential writes within codemode are separate checkpoints; intermediate filesystem saves inside one shell/script call are not. Run mutation calls sequentially. Do not manually stage/commit, amend, reset, delete branches, or push.

Use judgement: ask when missing facts, materially different legal positions, unclear scope, or an ambiguous source affect the text. Otherwise implement the requested change and let Git save it. A reversible draft checkpoint is not adoption, legal approval, sending, signing, or permission to invent facts. Do not seek approval merely to record an incremental change. If clarification is still needed after producing a clearly marked draft, preserve that draft before asking; the next correction is another increment.

## Substantive drafting: record the chapter's original

Before drafting a chapter under a new substantive logic, call `legal_document_revision` with `action: draft`, `file: <relative Markdown path>`, and `section: <exact heading>`. This records the current pre-drafting commit and returns original text for reference; it neither restores files nor creates a worktree. For whole-document drafting omit `section`. For a new file, no prior text may exist: use only authorized sources, not invented original language.

The original is retained across subsequent requests. `base: <full commit ID>` starts an expressly selected new source series; do not silently redefine the original as the latest drafted result. A file-level first-edit fallback is also recorded by native write/edit hooks, but a missing exact chapter origin must be disclosed and checked against file history and authorized sources.

## Switching logic: read Git first, do not inherit the old reasoning

Example: the user requested a chapter under logic a, it was committed, then asks for logic b. Call `history` for that file/section and read its recorded original and relevant commits. Reconstruct that chapter under b from the original source, not by layering b onto a's argument structure. Preserve the current document's other chapters, verified facts, and unrelated corrections. If the user explicitly says "on logic a", "on the current version", or otherwise asks to continue a, use that version instead.

The **drafting reference is not the Git parent**. The b revision can be an incremental child of the latest commit while deriving its target chapter from pre-a text. Do not restore an old whole document/repository to obtain a chapter: that could undo unrelated work. When the historic origin cannot be established, inspect the available history/sources and ask only if the uncertainty materially affects drafting. Do not fabricate an origin or claim that a file existed before it was created.

A rejected proposal is retained in Git. Use `begin` only for genuinely parallel alternatives or an expressly requested isolated worktree. Forking defaults to the current complete state, then rewrite the requested chapter using the retrieved original; pass an older `base` only when that whole-version starting point was actually chosen. Existing worktrees can continue through multiple user turns without another `begin`.

## Verify and report

Review actual changes, the returned commit ID, and unresolved substantive issues. `diff` inspects committed changes (optionally filtered by `file`, with `base` for the consulted original commit); `history` retrieves originals and file history, with `offset` for longer originals. Pending edits and truncated output are distinct from the committed comparison. Compare the chapter's original with the new chapter where the drafting logic changed, not merely the last text increment.

Summary generation uses actual diff plus the current request and reference; a labeled mechanical fallback preserves edits when unavailable. Pre-existing human/staged edits, failed hooks, locks, conflicts, unexpected HEAD changes, or invalid bindings require explicit resolution without losing files. Use confirmed `recover` only after review authorizes preserving pending Markdown; never steal a lock merely because it is old.

Report the current document path, checkpoint, substantive changes, and any consulted original/source commit. Branch/worktree identifiers matter only if an isolated proposal was actually used. Git dates are recording metadata, not legal-event evidence.

## DOCX is delivery, not routine drafting

Text editing does not request another DOCX. Keep working in Markdown unless the user expressly requests a Word deliverable. For that request, read `../legal-docx-redline/SKILL.md` and apply source preservation, minimum-granularity changes, tracked-change/comment, structural and visual verification gates.

Record the Markdown source path/commit and deliverable hash when available. This establishes provenance, not lossless correspondence. Do not automatically round-trip Word, accept/reject existing revisions, flatten comments, or claim rendering fidelity without verification. Preserve original Word sources and disclose extraction limitations.
