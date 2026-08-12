> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

# US legal research source policy

## Authority hierarchy

1. US and state constitutions; current enacted statutes.
2. Current regulations and controlling official agency materials.
3. Binding opinions from the controlling US Supreme Court, federal circuit, or state courts, with district-court posture handled accurately.
4. Persuasive opinions from other courts.
5. Approved citators and professional research databases.
6. Treatises, restatements, practice guides, law reviews, bar and law-firm materials.
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
- binding/persuasive/not-applicable status;
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
