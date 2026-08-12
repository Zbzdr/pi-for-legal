---
name: legal-employment-investigation-query
description: "Ask questions against an open investigation log — what witnesses said, where accounts conflict, what gaps exist, what the strongest evidence is on each issue. Use when the attorney needs to query the investigation record without re-reading every entry."
---

# /skill:legal-employment-investigation-query

> **Attribution:** Adapted from Anthropic's `claude-for-legal/employment-legal` at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package `NOTICE`.
Answers questions against the investigation log — what witnesses said,
where accounts conflict, what gaps exist, what the strongest evidence is
on each issue.

## Instructions

1. Load the `internal-investigation` reference skill and run Mode 3 (Query).
2. Always cite log entry IDs in the answer.
3. If the log contains nothing relevant to the question, say so explicitly —
   "I have not seen any information on [topic] in this investigation log
   ([N] entries reviewed)" — and offer to flag it as a gap.

## Examples

```
/skill:legal-employment-investigation-query [matter name]
What did the respondent say about the December team dinner?
```

```
/skill:legal-employment-investigation-query [matter name]
Where do the complainant's and respondent's accounts conflict?
```

```
/skill:legal-employment-investigation-query [matter name]
What do we still need?
```

> Detailed log-query process, citation rules, and gap-flagging templates live
> in the `internal-investigation` reference skill — load it before doing
> substantive work.
