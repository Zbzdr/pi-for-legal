---
name: legal-customize
description: Safely inspect and update one part of an existing pi-legal-workbench project profile. Use when the user changes a playbook position, approver, jurisdiction, output preference, integration status, or profile storage location.
---

# Customize the legal profile

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

## Resolve the profile

1. Read `.pi/legal-workbench/config.json` from the current project.
2. Resolve relative `profilePath` and `dataDir` from the project root.
3. Read the current profile before proposing any change.

If config or profile is absent, route to `/skill:legal-setup`. Do not guess a global location.

## Change protocol

1. Restate the requested change and identify the exact profile section affected.
2. Show a small before/after diff. Preserve unrelated content and user wording.
3. Ask for confirmation before changing legal positions, escalation authority, privilege markings, matter isolation, or storage paths. Simple spelling/name fixes can be applied directly when unambiguous.
4. Make the smallest edit and update `Last updated`.
5. Re-read the edited section and report the path changed.

Do not turn a single observed negotiation outcome into policy. If the user says a deal closed on a nonstandard term, record it as an observation unless they expressly approve a playbook change.

## Legal facts and integrations

- Label an unverified user-stated rule, threshold, deadline, or citation `[user stated — verify]`.
- Mark an integration `connected` only after a harmless call succeeds in the current session.
- Never save credentials or tokens.
- Moving storage does not authorize deleting the old files. Copy only after confirmation and leave cleanup to the user unless they explicitly request it.

End with the exact changed section and one sentence about which future skills will use it.
