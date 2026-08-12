---
name: legal-employment-investigation-open
description: "Open a new internal investigation matter — runs intake, generates the sources checklist, and creates the persistent investigation log. Use when a complaint or allegation comes in and the attorney needs to stand up a privileged investigation workspace."
---

# /skill:legal-employment-investigation-open

> **Attribution:** Adapted from Anthropic's `claude-for-legal/employment-legal` at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package `NOTICE`.
Opens a new investigation matter — runs intake, generates the sources
checklist, and creates the persistent investigation log.

## Instructions

1. Load the project legal profile.
2. Load the `internal-investigation` reference skill and run Mode 1 (Open).
3. If a matter with the same slug already exists, warn before overwriting.

## Examples

```
/skill:legal-employment-investigation-open
Harassment complaint filed against a manager in the Austin office.
```

```
/skill:legal-employment-investigation-open
(skill will ask for details)
```

> Detailed intake, privilege-formation requirements, sources checklist, and log
> templates live in the `internal-investigation` reference skill — load it
> before doing substantive work.
