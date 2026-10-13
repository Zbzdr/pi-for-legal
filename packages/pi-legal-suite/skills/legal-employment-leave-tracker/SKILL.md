---
name: legal-employment-leave-tracker
description: Check an authorized project-local protected-leave register on demand, verify applicable rules and calendars, and identify decisions or verification gaps. Use when the user asks about open leaves, designation/certification/exhaustion clocks, or leave-related accommodation; it does not self-schedule.
---

# On-demand protected-leave check

> **Attribution:** Adapted from Anthropic's claude-for-legal/employment-legal leave-tracker Skill and agent at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package NOTICE.

## Pi on-demand workflow

Read `references/leave-workflow.md` fully. It carries the upstream agent's research, clock ownership, schedule/proration, accommodation, decision-point, and register knowhow as a reference executed by the current model, not a required subagent or background service.

- Resolve the project config/profile and call `legal_matter_session` with `action: status`. Use only an authorized active matter. The default register is `<matter>/outputs/employment/leave-register.yaml`; reports, backups, and source manifests also stay under that matter.
- If no register or approved source is provided, ask for one or offer `/skill:legal-employment-log-leave`. Do not scan other matters, home directories, historical sessions, or a global HR portfolio to guess context. An organizational leave-tracking matter may contain multiple employees only when that scope is expressly authorized.
- Default to a read-only check. Query HRIS only through visibly available, successfully verified, authorized read access and only for this matter's scope. Do not assume an integration exists, install one, or upload employee information without approval.
- Identify jurisdiction, employer coverage, employee eligibility, normal schedule and units, event dates, measurement method, and controlling sources before relying on a clock. Calculate only supported deadlines; show unverified records in a separate `verification pending` group. Incomplete review must not be summarized as "no action needed".
- Use `legal_time` for the recording/as-of date. Distinguish employee obligations, employer obligations, statutory deadlines, and internal reminder preferences. Do not convert an internal alert threshold into law or infer entitlement from a 40-hour week.
- Report required decisions and open evidence gaps with source anchors. Preserve uncertainty; do not make termination decisions, send notices, certify eligibility, or issue legal conclusions on missing authority.
- Offer a register update or saved report only when appropriate. Preview the exact path/changes and obtain confirmation before writing; preserve existing notes, provenance, and unrelated rows. Update `last_checked` only for records actually checked, with limitations alongside it.

## Optional automation, not a prerequisite

This workflow runs when requested. Pi can be invoked by an external job through its print/JSON CLI, RPC, or SDK, but this package installs no scheduler, recurring task, notification channel, or credentials. Do not show `Next scheduled check` unless a separately approved integration has actually been configured and verified.

A suggested next review date is only a recommendation, not a scheduled reminder. Automation must additionally specify the workspace and authorized register scope, read-only/write permissions, source access, failure handling, and notification destination. Never bypass the matter/approval gates to make a headless run work.
