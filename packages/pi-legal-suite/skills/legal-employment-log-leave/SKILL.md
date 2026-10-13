---
name: legal-employment-log-leave
description: "Deferred protected-leave workflow. Explicit invocation explains why employee leave registration, deadline calculation, and monitoring are not enabled in this release."
disable-model-invocation: true
---

# /skill:legal-employment-log-leave

> **Attribution:** Adapted from Anthropic's `claude-for-legal/employment-legal` at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package `NOTICE`.

## Status: deferred

Employee protected-leave registration and monitoring are not enabled in this release. This command is retained only to explain the limitation and preserve compatibility; do not execute the old workflow.

The upstream `log-leave` Skill adds an employee's protected-leave record. Its companion `leave-tracker` agent researches jurisdiction-specific rules, reads the register or an authorized HRIS, and identifies required decisions when invoked. That complete agent workflow is not bundled here. Neither this package nor the upstream agent self-schedules; background reminders require a separate configured and verified integration.

## Instructions on explicit invocation

1. Tell the user this feature is deferred, not operating.
2. Do not create or update a leave register, calculate or certify a deadline, claim a completed leave check, or promise automatic alerts.
3. Do not load an absent agent, silently substitute model memory for researched rules, or recreate this feature through shell commands or another Skill.
4. Preserve existing leave registers and personnel records unchanged. Do not inspect sensitive employee records merely to explain the paused feature.
5. Recommend the user's established HR/legal tracking process. A separate substantive legal question may be scoped and routed to `/skill:legal-research` with appropriate source verification, but that does not enable this tracker.

## Requirements before re-enabling

- A complete project-local register format and clearly authorized storage/access boundary.
- Jurisdiction, employer coverage, employee eligibility, actual work schedule, relevant event dates, and current controlling sources for each calculated deadline.
- Tested deadline calculations and explicit separation of statutory obligations from internal reminder thresholds.
- A complete on-demand checking workflow; any optional scheduling or HRIS integration must be configured and actually verified before describing it as available.
