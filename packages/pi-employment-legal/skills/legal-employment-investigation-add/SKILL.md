---
name: legal-employment-investigation-add
description: "Add data to an open investigation — documents, interview notes, or observations. Processes batches against the documented pull criteria, surfaces significant items, and logs everything reviewed for coverage verification. Use when new evidence, interview notes, or document productions come in for an open investigation."
---
# /skill:legal-employment-investigation-add

> **Attribution:** Adapted from Anthropic's `claude-for-legal/employment-legal` at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package `NOTICE`.
Adds data to an open investigation log. Processes document batches using
documented pull criteria, surfaces significant items, logs everything
reviewed for coverage verification.

## Instructions

1. Load the project legal profile.
2. Load `../legal-employment-internal-investigation/SKILL.md` and run Mode 2 (Add data).
3. After processing, show the surface ratio and list of surfaced items.
4. Prompt to update the sources checklist if the data covers a checklist item.

## Examples

```
/skill:legal-employment-investigation-add [matter name]
[paste interview notes]
```

```
/skill:legal-employment-investigation-add [matter name]
[attach email export]
```

> Detailed needle-finding process, log entry format, surface-ratio rules, and
> sources-checklist tracking live in `../legal-employment-internal-investigation/SKILL.md`
> skill — load it before doing substantive work.
