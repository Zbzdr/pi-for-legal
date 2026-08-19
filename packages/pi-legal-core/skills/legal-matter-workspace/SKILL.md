---
name: legal-matter-workspace
description: Create, list, bind, update, and close isolated project-local legal matter workspaces and associate Pi session IDs with them. Use when starting or resuming legal work, separating clients or matters, or maintaining a matter README and history.
---

# Legal matter workspace

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

Resolve schema-v2 project config, profile, and `matterRoot`. Matter workspaces live in a visible directory outside `.pi/`. The metadata-only index lives at `.pi/legal-workbench/matter-index.json`; never use it as a substitute for matter files.

For `new`, `bind`, `close`, `status`, and explicit `list` operations, use `legal_matter_session`. The tool performs deterministic file and session-state changes. Do not recreate those operations with ad hoc shell commands.

## Commands by intent

- **new:** collect matter name, lowercase kebab-case slug, client/organization, client aliases, jurisdictions/forums, specific legal-issue keywords, scope, responsible lawyers, confidentiality constraints, sources, deadlines, and matter-specific overrides. Show the path and metadata, obtain confirmation, then call `legal_matter_session` with `action: create` and `confirmed: true`.
- **list:** only when the user explicitly asks to see matters, call `legal_matter_session` with `action: list`. A new-session match must rely on the extension's metadata-only candidates and must not list unrelated matters.
- **bind/switch:** obtain the user's choice, then call `legal_matter_session` with `action: bind` and `confirmed: true`. The binding belongs to the current Pi session; do not store a global active matter in the practice profile.
- **status:** call `legal_matter_session` with `action: status`.
- **update:** edit only the active matter `README.md`, `history.md`, `notes.md`, or files below its source, research, work-product, and session directories. Keep README current-state notes concise.
- **close:** show the named matter and obtain confirmation, then call `legal_matter_session` with `action: close` and `confirmed: true`. Closing updates README, compatibility `matter.md`, history, and the metadata index. It preserves all files in place and clears the in-memory active binding.

Use `references/matter-template.md` to understand the generated matter structure and required metadata.

## Isolation rule

Never read or search another matter's files while working in the active matter. Practice-level playbook rules may be shared; client facts, documents, notes, research, and outputs may not. If cross-matter access is requested, surface the confidentiality issue and require explicit confirmation for each named matter and purpose.

Do not infer that binding a session authorizes moving documents or copying work product. One matter may have multiple associated Pi session IDs in its README. Pi retains the raw session files in its default location.

Domain Skills may organize files under `<matter>/research/<domain>/` and `<matter>/work-product/<domain>/`. They must use the same `README.md`, `history.md`, and `notes.md`; do not create parallel domain matter trees.

Pi's built-in write/edit guard blocks paths outside the active matter and approved reusable state/practice locations after setup. Shell commands are not an operating-system sandbox, so apply the same boundary to scripts and commands that write files.
