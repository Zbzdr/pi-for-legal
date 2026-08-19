<!-- pi-legal-workbench:start -->
> **Attribution:** Uses matter-isolation and profile concepts adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

# Pi Legal Workspace

This trusted project uses Pi for Legal. Treat `.pi/legal-workbench/config.json` as the path source of truth and `.pi/legal-workbench/profile.md` as reusable practice context. Use applicable legal Skills for research, commercial, privacy, regulatory, AI governance, employment, corporate, litigation, IP, product, escalation, playbook learning, and stakeholder summaries.

## Session And Matter Gate

The core extension handles the first-turn workspace check. In a new session, do not begin substantive legal work until the user has chosen a new or existing matter and `legal_matter_session` has bound the session. Do not repeat this gate in later turns or resumed sessions when a binding exists.

Candidate matching is metadata-only. Never open, summarize, name, or search unmatched matters to infer relevance. A client match is sufficient; otherwise require both an explicit jurisdiction/forum match and a specific legal-issue match. Generic words such as `contract`, `review`, `legal`, or `matter` are not matching signals.

## Storage Boundary

- Keep reusable configuration, profile, status, and the metadata-only matter index under `.pi/legal-workbench/`.
- Let Pi keep raw session files in its default session location. Do not copy or move them into the legal workspace.
- Keep client facts, source documents, downloads, fetched data, research, notes, drafts, redlines, memos, and deliverables inside the active visible matter directory.
- Keep genuinely reusable, non-client-specific practice materials under the configured visible `practice/` directory only with user approval.
- Do not place substantive matter material under `.pi/` or in an unmatched matter.
- Do not overwrite source documents. Make a backup before an approved modification and write the result as a new file in the active matter.

After material work, update the active matter `README.md` current state and work-product index concisely, and append significant events to `history.md`. A matter may bind several Pi sessions; record only their session IDs in the matter README. Raw session files remain in Pi's default location.

Some adapted Skills still express paths using the upstream `<dataDir>/domain/...` convention or ask for an `Active matter` field in the profile. Under schema version 2, the current session binding is the active-matter source of truth. Redirect matter-specific legacy paths into the bound matter's `research/` or `work-product/` subtree, and read the matter's compatibility `matter.md` when a Skill requests it. Do not write a session-specific active slug into the shared practice profile.

The extension blocks out-of-matter paths for Pi's built-in `write` and `edit` tools. This is a workflow guardrail, not an operating-system sandbox. Apply the same boundary to shell commands and scripts that can create or modify files.

All legal outputs are working drafts for review by a qualified legal professional and do not constitute legal advice. Fully verify material current-law, authority, deadline, citator, and regulatory-status claims using suitable current sources.
<!-- pi-legal-workbench:end -->
