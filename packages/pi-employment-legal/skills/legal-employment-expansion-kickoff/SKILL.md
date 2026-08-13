---
name: legal-employment-expansion-kickoff
description: "Kick off international expansion planning for a new country — gathers intake, runs EOR vs. entity framing, drafts cross-functional questions, surfaces country-specific flags, and creates a persistent tracker. Use when someone says \"we're hiring in [country]\", \"expansion to [country]\", or \"first hire in [country]\"."
---
# /skill:legal-employment-expansion-kickoff

> **Attribution:** Adapted from Anthropic's `claude-for-legal/employment-legal` at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package `NOTICE`.
Starts an international expansion project for a new country — gathers intake,
runs EOR vs. entity framing, drafts cross-functional questions, surfaces
country-specific flags, and creates a persistent tracker.

## Instructions

1. Load the project legal profile → jurisdictional footprint, escalation table.
2. Load `../legal-employment-international-expansion/SKILL.md` and run the full workflow.
3. If a tracker file already exists for this country (`<dataDir>/employment-legal/expansion-[slug].yaml`),
   flag it: "An expansion tracker for [country] already exists. Use
   `/skill:legal-employment-expansion-update [country]` to update it, or confirm
   you want to start over."
4. Create `<dataDir>/employment-legal/expansion-[slug].yaml` on completion.

## Examples

```
/skill:legal-employment-expansion-kickoff Germany
```

```
/skill:legal-employment-expansion-kickoff
(skill will ask which country)
```

> Detailed EOR vs. entity framework, cross-functional questions, briefing
> templates, and tracker schema live in the `international-expansion`
> reference skill — load it before doing substantive work.
