---
name: legal-escalation
description: Determine the correct approver for a contract or research issue under the project profile and draft a concise escalation request. Use when a finding exceeds authority, hits a never-accept position, or needs business or specialist judgment.
---

# Legal escalation

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

Resolve the project profile and read its escalation matrix, active transaction side, and house style. If the relevant authority or approver is not configured, say so and ask rather than inventing one.

## Build the escalation

1. Identify the decision required, deadline, deal context, and current owner.
2. Quote the relevant contract language or research proposition with source anchor.
3. Name the playbook deviation or automatic trigger.
4. Separate legal risk, business impact, negotiation friction, and open facts.
5. Identify the smallest decision the approver must make and viable options.
6. Route to the named role/person and channel in the profile.

Draft only. Do not send a message or update a workflow unless the user explicitly asks and a suitable tool is available.

## Format

```markdown
**Decision needed:** [one sentence]
**By:** [date/time and why]
**Approver:** [profile source]

**Context:** [deal/value/stage]
**Clause or issue:** "[quote]" — [source]
**Playbook/authority:** [position and threshold]
**Risk if accepted:** [legal and business]
**Options:**
1. [recommended recoverable option]
2. [alternative]
3. [walk away/defer/get facts, when applicable]
**Recommendation:** [draft recommendation, not a hidden decision]
**Open facts:** [only material unknowns]
```

Remove privilege markings for a destination outside the privilege circle and ask whether a sanitized version is needed.
