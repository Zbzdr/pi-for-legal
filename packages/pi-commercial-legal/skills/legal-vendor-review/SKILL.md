---
name: legal-vendor-review
description: Review a US commercial vendor, customer, services, consulting, supply, licensing, MSA, or SOW agreement against the project's sales-side or purchasing-side playbook. Use directly or when routed by legal-contract-review.
---

# Vendor and services agreement review

> **Attribution:** Adapted from Anthropic's claude-for-legal/commercial-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

## Preconditions

Resolve `.pi/legal-workbench/config.json` and read the configured profile. Determine the transaction side. If the profile or matching side is not configured, ask whether to collect the missing position or continue with findings labeled `No playbook position — lawyer judgment required`.

Read all supplied agreement components and create a source manifest. Missing incorporated terms, exhibits, policies, URL terms, order forms, or amendments are findings, not details to ignore.

## Review method

1. Extract parties, roles, effective date, term, scope, fees, and precedence.
2. Check the active playbook's "one thing" before spending time on the full review.
3. Work through `references/vendor-checklist.md`; add deal-specific issues rather than treating it as exhaustive.
4. Compare contract language to the exact profile position. Keep stated legal risk separate from negotiation preference and business friction.
5. Quote the language and anchor it by file, section, page, or paragraph. If pagination is unreliable, say so and use section plus a distinctive phrase.
6. Reconcile internal conflicts and terms changed by an exhibit, order form, or amendment.
7. Identify favorable terms and concessions already obtained.

## Findings discipline

- A deviation is not automatically a legal violation.
- A clause is not automatically enforceable because it is written.
- Do not invent a fallback when the playbook is silent. Ask or flag for judgment.
- Proposed language must fit the deal and the user's side; avoid generic clause dumps.
- When current law controls, use `/skill:legal-research` or an available verified research source. Tag the source actually used.
- If a research source returns thin coverage, report it and ask before supplementing with a lower-confidence source.

## Authority and output

Apply the profile's escalation matrix. Draft recommendations and fallback language, but do not accept terms, transmit redlines, update a CLM, or route signature without explicit authorization and an actual tool capable of doing so.

Return findings in the integrated format from the routing skill when called as part of `/skill:legal-contract-review`. When called directly, use the same core sections: reviewer note, bottom line, risk overview, detailed findings, favorable terms, missing/conflicting terms, business dates, open questions, and next-step options.
