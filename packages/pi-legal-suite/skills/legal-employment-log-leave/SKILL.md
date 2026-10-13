---
name: legal-employment-log-leave
description: Record an employee's protected leave in the active project-local matter with explicit intake, source provenance, and verified or pending deadline fields. Use when the user wants to add or update a protected-leave record; this is on-demand work, not a background reminder service.
---

# Protected-leave intake and registration

> **Attribution:** Adapted from Anthropic's claude-for-legal/employment-legal log-leave Skill and leave-tracker agent at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package NOTICE.

## Pi on-demand workflow

Preserve the upstream intake knowhow without a scheduler. Read `references/leave-register.md` for the register format, verification fields, and separation of statutory clocks from internal reminder preferences. This workflow runs only for the current request.

1. Resolve the project config/profile and call `legal_matter_session` with `action: status`. Bind an authorized matter before writing. Default to `<matter>/outputs/employment/leave-register.yaml`; keep any approved report, source manifest, and backup in that same matter. Do not silently read a legacy/global register, inspect other matters, or migrate existing personnel records.
2. Use only authorized current-session intake and explicitly provided records. Prefer an anonymized employee ID; avoid unnecessary medical details. Establish jurisdiction, employer coverage, employee eligibility, leave regime(s), actual normal work schedule, start/event dates, time used and units, intermittent status, expected return, and designation/certification/accommodation status. Ask material missing questions together; preserve unknowns rather than infer them.
3. Registration does not require inventing a legal deadline. Record unverified user information as user-provided intake with its source. If rules, coverage, eligibility, trigger dates, or calendars are not verified, keep `entitlement` and affected due dates null/pending and list the verification gaps. Do not copy generic numbers from a profile or model memory into statutory fields.
4. For each material calculation, use current controlling sources and the applicable calendar/measurement method. Record the trigger event, clock owner, rule and pinpoint, verification/as-of date, exceptions, time zone/calendar basis, and calculation assumptions. Distinguish statutory duties from internal review thresholds. Use `legal_time` for system recording dates or to resolve an explicitly user-stated "today", never to invent the event date.
5. Preview the exact record and local path. Obtain confirmation before adding/updating it; preserve existing notes, source provenance, and unrelated records. Do not change HRIS records, send notices, decide adverse action, or start a scheduler as a side effect. Report what was actually recorded, which calculations remain pending, and that no background monitoring is enabled by this operation.

Offer `/skill:legal-employment-leave-tracker` for an on-demand check of the authorized register. A separate optional scheduler can invoke Pi later, but it must be explicitly configured and verified before claiming that any future check or reminder is scheduled.
