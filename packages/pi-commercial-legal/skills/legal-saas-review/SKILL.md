---
name: legal-saas-review
description: Apply a SaaS, cloud, data, security, subscription, and renewal overlay to a commercial agreement after the general vendor review. Use for SaaS MSAs, cloud subscriptions, recurring software orders, SLAs, DPAs, and AI-enabled services.
disable-model-invocation: true
---

# SaaS agreement overlay

> **Attribution:** Adapted from Anthropic's claude-for-legal/commercial-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

This is an overlay worker normally loaded by `/skill:legal-contract-review`. Pi still permits explicit `/skill:legal-saas-review` invocation. On direct invocation, first perform the router's profile, source-manifest, document-structure, side, amendment, and routing checks, then read and apply `../legal-vendor-review/SKILL.md` before this overlay. Do not issue a SaaS-only memo that omits the base agreement review.

## Context

Resolve the project profile, identify the transaction side, and read the SaaS positions plus the general contract playbook. Inventory the MSA, order form, SLA, DPA, security terms, support policy, acceptable-use policy, and incorporated URLs. Record missing pieces and the order of precedence.

If a SaaS-specific position is not configured, ask only when it is outcome-determinative; otherwise flag `No SaaS playbook position — lawyer judgment required`.

## Overlay review

Use `references/saas-checklist.md`. For each material point, compare what the documents collectively say against the profile. Reconcile contradictions between the order form, MSA, DPA, SLA, and URL terms.

Keep three questions separate:

1. What does the contract require?
2. What does the team's playbook prefer?
3. What does applicable law require?

Research the third only when material, using current jurisdiction-specific sources and honest provenance.

## Output

Merge findings into the contract review memo. Include a compact SaaS summary:

- economic commitment and renewal mechanics;
- service level and remedy reality;
- suspension/termination and exit feasibility;
- security and incident obligations;
- data use, retention, deletion, subprocessors, and transfers;
- AI/model training and derivative-data rights;
- highest operational dependency and owner.

Extract every renewal, notice, price-change, data-return, deletion, and transition deadline with its source and confidence. Offer `/skill:legal-renewal-tracker`; do not update the register without user approval.
