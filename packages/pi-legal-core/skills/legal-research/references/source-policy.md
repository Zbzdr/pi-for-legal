> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

# Multi-jurisdiction legal research source policy

## Authority hierarchy

1. The jurisdiction's constitution, foundational or treaty texts, and current enacted legislation.
2. Current regulations, delegated legislation, and controlling official administrative materials.
3. Binding judgments or decisions from the controlling court, tribunal, or authority, classified under that legal system's own hierarchy and precedent rules.
4. Persuasive judgments, decisions, preparatory works, guidance, or comparative authority where recognized.
5. Jurisdiction-appropriate citators, legislation-status services, and professional research databases.
6. Treatises, restatements, practice guides, law reviews, bar/law-society materials, and law-firm commentary.
7. Model knowledge only as a search lead.

Secondary authority may orient the search but should not replace available primary law for a material proposition.

## Provenance labels

Use a label that describes what actually happened in this session:

- `[official source]`
- `[Westlaw]`, `[CourtListener]`, `[Trellis]`, `[Descrybe]`, or another named successful research source
- `[user provided]`
- `[web — verify]`
- `[model knowledge — verify]`

Do not strip `verify` labels in later drafts unless the proposition was actually checked.

## Required authority fields

For each material authority capture:

- title/case name;
- issuing body or court;
- date;
- reporter, docket, code, CFR, or other citation;
- stable URL or database locator;
- binding/persuasive/official-guidance/not-applicable status under the relevant legal system;
- current/historical/proposed/unclear status;
- negative-treatment or citator status;
- proposition supported;
- provenance.

## Stop conditions

Research is ready for synthesis when:

- every material issue has controlling or best-available support;
- contrary authority and splits have been searched;
- currentness and treatment are checked or expressly limited;
- unsupported factual assumptions are visible;
- remaining gaps are specific enough for a lawyer to decide whether to continue.

Retrievability alone never establishes that a case is still good law.
