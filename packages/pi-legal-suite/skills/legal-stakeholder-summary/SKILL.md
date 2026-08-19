---
name: legal-stakeholder-summary
description: Translate a legal review or research result into a short, decision-oriented summary for business stakeholders while protecting privilege and preserving material caveats. Use for executives, sales, procurement, product, finance, or other non-legal readers.
---

# Stakeholder summary

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

## Destination gate

Resolve the profile and identify the audience, channel, and whether the destination is inside the privilege/confidentiality circle. If unclear, ask. For counterparties, public channels, company-wide lists, or clients receiving work product, offer a sanitized external version rather than silently attaching a privileged header.

## Translation rules

- Lead with the decision, deadline, owner, and commercial effect.
- Use plain language; avoid doctrine and clause-by-clause narration.
- Preserve material uncertainty and conditions.
- Do not call a legal recommendation "approved" or "safe" unless the authorized lawyer made that decision.
- Do not disclose unnecessary legal strategy, mental impressions, adverse authority, or sensitive negotiation thresholds.
- Keep exact numbers, dates, and obligations tied to their source.

## Default format

```markdown
**Decision needed:** [what and by when]

**Bottom line:** [two or three sentences]

**What changes for the business**
- [cost/timing/operational obligation]
- [owner/dependency]

**Main risks or tradeoffs**
- [plain-language risk and mitigation]

**Recommended next step:** [action and owner]
**Open question:** [only if decision-relevant]
```

Use the profile's preferred length and tone. Drafting does not authorize posting or sending.
