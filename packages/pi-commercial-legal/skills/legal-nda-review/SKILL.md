---
name: legal-nda-review
description: Triage and review a standalone NDA or confidentiality agreement against the project's configured US contract playbook, producing GREEN, YELLOW, or RED with exact quotes and next actions. Use directly or when routed by legal-contract-review.
---

# NDA review

> **Attribution:** Adapted from Anthropic's claude-for-legal/commercial-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

## Profile first

Resolve `.pi/legal-workbench/config.json`, read the profile, identify the user's side as discloser, recipient, or mutual, and load the NDA triage positions.

The profile decides what GREEN, YELLOW, and RED mean. This skill supplies categories to inspect, not hardcoded negotiation outcomes. If a material position is missing, ask one focused question or classify it YELLOW with `No playbook position — lawyer judgment required`.

## Intake

Confirm the NDA is the main agreement. If confidentiality terms sit inside an MSA, route to `/skill:legal-vendor-review`. Read the whole NDA, attachments, and referenced policies. Record missing or unread material.

## Review

Apply `references/nda-checklist.md` and the configured side-specific positions. For each failed or uncertain check provide the exact quote, source anchor, profile position, practical effect, recommendation, and proposed language if useful.

Assign one overall result:

- **GREEN:** every configured required position passes and no escalation trigger appears;
- **YELLOW:** a negotiable deviation, missing fact, or unconfigured position needs lawyer/business judgment;
- **RED:** a configured never-accept position or automatic escalation trigger appears.

Do not call an NDA GREEN merely because it looks short or familiar. Do not call a provision illegal or unenforceable without current jurisdiction-specific support.

## Output

Start with the reviewer note, then:

```markdown
# NDA Triage — [counterparty]

**Result:** GREEN | YELLOW | RED
**Our role:** discloser | recipient | mutual
**Decision owner:** [profile]

## Why
[Two or three sentences.]

## Checks
| Topic | Result | Contract language/source | Playbook position | Action |
|---|---|---|---|---|

## Required edits or escalation
[Only material items.]

## Open facts

## Next action
[Profile's configured closing action, subject to approval.]
```

For GREEN, still show the checks performed. Before signature or external transmission, apply the profile's authority gate. A non-lawyer's GREEN is a routing recommendation, not approval to sign.
