---
name: legal-matter-workspace
description: Create, list, switch, and archive isolated project-local legal matter workspaces for firm, solo, or multi-client use. Use when work must stay separated by client or matter.
---

# Legal matter workspace

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

Resolve the project config, profile, and `dataDir`. Matter workspaces live under `<dataDir>/matters/`. This shared path is the single matter source of truth for every installed legal domain.

If matter isolation is disabled in the profile, explain that practice-level context is active and offer `/skill:legal-customize` to enable it. Do not create hidden matter state.

## Commands by intent

- **new:** collect client/matter name, slug, scope, lawyers, jurisdiction, confidentiality constraints, sources, deadlines, and profile overrides; create `<dataDir>/matters/<slug>/matter.md`, `history.md`, `notes.md`, and `outputs/`; show paths before writing.
- **list:** read only each matter's `matter.md`; return slug, client, status, owner, and active marker.
- **switch:** confirm the target exists, then update only `Active matter` in the profile.
- **none:** set `Active matter` to `none` and return to practice-level context.
- **close:** show the target and obtain confirmation, then move it to `<dataDir>/matters/_archived/`; never delete.

Use `references/matter-template.md` for new matters.

## Isolation rule

When cross-matter access is off, never read or search another matter's files while working in the active matter. Practice-level playbook rules may be shared; client facts, documents, notes, research, and outputs may not. If cross-matter access is requested, surface the confidentiality issue and require explicit confirmation for the named matters.

Do not infer that changing the active matter authorizes moving documents or copying work product.

Domain Skills may organize outputs beneath `<dataDir>/matters/<slug>/outputs/<domain>/`, but they must read the same shared `matter.md` and `history.md`. Do not create parallel `<dataDir>/<domain>/matters/` trees.
