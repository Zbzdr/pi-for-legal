---
name: legal-playbook-learning
description: Proactively capture confirmed completed-matter outcomes and deviations, detect repeated outcomes, and review proposed changes to the project legal profile without scheduled agents. Use when the conversation establishes that a contract was signed, a fallback or exception was finally approved or rejected, a matter closed, the user wants to learn from prior outcomes, or pending playbook proposals should be accepted, edited, rejected, or deferred.
---

# Playbook learning

> **Attribution:** Adapted from Anthropic's claude-for-legal deal-debrief, playbook-monitor, and review-proposals workflows at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package NOTICE.

Run an on-demand learning loop using project-local files. This Skill replaces the original scheduled agents with explicit `capture`, `propose`, and `review` modes. It never changes policy merely because a deal closed on a nonstandard term.

## Resolve storage

Read `.pi/legal-workbench/config.json`, resolve the project-root `AGENTS.md` profile and visible `dataDir`, and use the approved project-level log area:

```text
<dataDir>/logs/learning/deviations.jsonl
<dataDir>/logs/learning/pending-playbook-proposals.md
<dataDir>/logs/learning/decisions.jsonl
```

Show exact paths before the first write and confirm that the user wants the normalized result promoted from the active matter into reusable practice data. Never copy contract text, personal data, client confidences, or privileged analysis into the learning log unless necessary; prefer a clause category, normalized outcome, source matter slug, and source-file anchor.

## Capture mode

Use when the user reports a signed agreement, closed matter, approved exception, rejected position, or other final outcome.

1. Read the relevant profile position and final user-provided outcome.
2. Ask for any missing final facts: side, jurisdiction, clause/category, final position, approver, rationale, and whether the result is reusable precedent or a one-off exception.
3. Show one proposed JSON record before appending it to `deviations.jsonl`.
4. Require confirmation before writing.
5. Record provenance and confidence. Never infer that silence or an unsigned draft is a final outcome.

Each line must contain: `recordedAt`, `domain`, `matter`, `jurisdiction`, `side`, `category`, `playbookPosition`, `finalOutcome`, `decision`, `approver`, `rationale`, `reusable`, `source`, and `notes`. Use `null` rather than invented values.

## Propose mode

1. Read the current profile and deviation log.
2. Group only genuinely comparable records by domain, jurisdiction, side, and category.
3. Surface a proposal when at least three confirmed reusable outcomes show a consistent position, or when the user explicitly asks to consider fewer records.
4. Exclude one-off exceptions, unresolved matters, materially different jurisdictions/sides, and records with uncertain approval.
5. For each proposal show supporting record identifiers, conflicting outcomes, current profile text, proposed text, operational effect, and reasons not to change.
6. Write proposals only after confirmation. A proposal is not policy.

## Review mode

Present pending proposals one at a time with four choices: Accept, Edit, Reject, or Defer.

- Accept/Edit: show the exact profile diff and obtain explicit confirmation before writing. Then append the decision to `decisions.jsonl` and remove or mark the proposal resolved.
- Reject: record the reason and resolve the proposal without changing the profile.
- Defer: keep it pending and record the next review trigger or date if supplied.

After any accepted change, re-read the edited profile section and identify which Skills will use it. Do not update historical records. Do not send notifications or modify an external system.
