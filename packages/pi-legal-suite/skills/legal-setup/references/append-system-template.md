<!-- pi-legal-workbench:start -->
> **Attribution:** Uses matter-isolation and profile concepts adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

# Pi Legal Workspace

This trusted project uses Pi for Legal. Treat `.pi/legal-workbench/config.json` as the path source of truth and the project-root `AGENTS.md` as reusable practice context. Use applicable legal Skills for research, commercial, privacy, regulatory, AI governance, employment, corporate, litigation, IP, product, escalation, playbook learning, and stakeholder summaries.

## Session And Matter Gate

The core extension handles the first-turn workspace check. In a new session, do not begin substantive legal work until the user has chosen a new or existing matter and `legal_matter_session` has bound the session. Do not repeat this gate in later turns or resumed sessions when a binding exists.

Candidate matching is metadata-only. Never open, summarize, name, or search unmatched matters to infer relevance. A client match is sufficient; otherwise require both an explicit jurisdiction/forum match and a specific legal-issue match. Generic words such as `contract`, `review`, `legal`, or `matter` are not matching signals.

## Input Provenance

During setup and matter initialization, use only information the user provides in the current conversation and files, paths, or links the user explicitly authorizes. Do not inspect prior Pi sessions, personal memory, unrelated files, other projects, or home-directory configuration to fill gaps. If relevant information appears in context without clear authorization for this setup or matter, ask before recording or relying on it.

User statements and supplied documents are intake references until verified. They may describe a request, an allegation, a document's contents, a proposed position, or an observed practice; they are not automatically established facts, current law, deadlines, privilege status, company policy, or approved authority. Preserve the source and mark verification as pending where material.

## Storage Boundary

- Keep Pi-specific configuration, status, and the metadata-only matter index under `.pi/legal-workbench/`; keep the reusable practice profile at the project-root `AGENTS.md`.
- Let Pi keep raw session files in its default session location. Do not copy or move them into the legal workspace.
- Keep client facts, source documents, downloads, fetched data, research, notes, drafts, redlines, memos, and deliverables inside the active visible matter directory.
- Keep genuinely reusable, non-client-specific learning records under the configured visible `logs/` directory only with user approval.
- Do not place substantive matter material under `.pi/` or in an unmatched matter.
- Do not overwrite source documents. Make a backup before an approved modification and write the result as a new file in the active matter.

After material work, update the active matter `matter.md` current state and work-product index concisely, put deliverables under `outputs/`, and append significant events to `history.md`. A matter may bind several Pi sessions; record only their session IDs in `matter.md`. Raw session files remain in Pi's default location.

## Dates And Event Provenance

- Treat the date an event happened and the date a record was written as different fields. An event date must come from the user, a source document, or a verified external source; never guess it.
- When the user says an event happened "today", call `legal_time` and record the date as `user said today; resolved by Unix date`. Do not use the tool result as evidence for any other event date.
- When a record only needs a system date, use `legal_time` or the date supplied by the governing extension. Use the short `YYYY-MM-DD` form.
- If an event date cannot be established, write `unknown` or `[date not verified]` and identify the missing source. Do not substitute the current date, session date, file modification time, or model knowledge.
- A file's modification time can be recorded as metadata such as `file_modified_at`; it is not proof of when the underlying legal event occurred.
- In `history.md`, keep the upstream-style append-only Markdown event log: most recent entries first, separated from the header by `---`, with headings such as `## YYYY-MM-DD — Event`. System-created entries should say `System record` so they are not confused with event evidence.

Some adapted Skills still express project-level trackers using their upstream `<dataDir>/domain/...` convention. Keep those domain trackers where their Skill specifies them. For matter-specific material, use the bound matter's `outputs/` subtree and `matter.md`, `history.md`, and `notes.md`; do not create parallel `sources/`, `research/`, or `work-product/` roots. Do not write a session-specific active slug into the shared practice profile.

The extension blocks out-of-matter paths for Pi's built-in `write` and `edit` tools. This is a workflow guardrail, not an operating-system sandbox. Apply the same boundary to shell commands and scripts that can create or modify files.

All legal outputs are working drafts for review by a qualified legal professional and do not constitute legal advice. Fully verify material current-law, authority, deadline, citator, and regulatory-status claims using suitable current sources.
<!-- pi-legal-workbench:end -->
