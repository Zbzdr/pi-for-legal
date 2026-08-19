---
name: legal-amendment-history
description: Reconstruct how clauses and business terms changed across a base agreement, amendments, addenda, orders, renewals, and side letters. Use before review when multiple contract versions govern or when the user asks what the current term is.
---

# Amendment history

> **Attribution:** Adapted from Anthropic's claude-for-legal/commercial-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

## Intake

Collect the base agreement and every potentially modifying document. Build a manifest with filename, title, date, effective date, parties, signatures, and read status. Ask for missing documents when a later instrument refers to one not supplied.

Treat filename order as a clue, not legal precedence. Determine sequence from the documents' own dates, amendment clauses, recitals, and order-of-precedence language.

## Reconstruct the chain

1. Identify the base agreement and its amendment mechanics.
2. For each later document, locate provisions that amend, replace, delete, waive, extend, revive, or leave terms unchanged.
3. Quote the operative language and anchor it.
4. Build the table in `references/amendment-table.md`.
5. Resolve the current text only when the chain supports it. Mark ambiguity rather than choosing silently.
6. Check whether expired terms were revived, whether an order changes only one transaction, and whether signatures/effective dates differ.

## Guardrails

- Do not infer that Amendment 3 supersedes Amendments 1 and 2 wholesale.
- Distinguish changed language from interpretation of unchanged language.
- Preserve conflicts and drafting gaps.
- A "current term" conclusion must identify every instrument relied on.
- Do not overwrite source files. Produce a memo or consolidated working text only when requested, clearly labeled non-executed.

If the chain feeds a substantive review, hand the resolved provisions and unresolved conflicts to `/skill:legal-contract-review`.
