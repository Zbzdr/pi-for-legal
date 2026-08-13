---
name: legal-employment-investigation-memo
description: "Draft or update the privileged investigation memo from the investigation log. Use when an investigation is far enough along to write the first memo cut, or when new data has been added and the existing draft needs updating."
---
# /skill:legal-employment-investigation-memo

> **Attribution:** Adapted from Anthropic's `claude-for-legal/employment-legal` at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package `NOTICE`.
Drafts the first cut of the privileged investigation memo from the log,
or updates an existing draft when new data has been added.

## Instructions

1. Load `../legal-employment-internal-investigation/SKILL.md` and run Mode 4 (Draft or update memo).
2. If drafting for the first time, warn if high-priority sources are still
   open on the checklist.
3. If updating, show what changed before rewriting.
4. All output is marked PRIVILEGED AND CONFIDENTIAL — ATTORNEY WORK PRODUCT.

## Examples

```
/skill:legal-employment-investigation-memo [matter name]
```

```
/skill:legal-employment-investigation-memo [matter name]
(updates existing memo if one exists)
```

> Detailed memo structure, credibility-assessment framework, and update rules
> live in `../legal-employment-internal-investigation/SKILL.md` — load it before doing
> substantive work.
