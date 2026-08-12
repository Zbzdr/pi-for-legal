---
name: legal-employment-leave-tracker
description: "Check open leaves for deadline alerts and required decisions. Surfaces only the leaves that require an action and explains why — not a status board. Use weekly, or whenever the attorney needs to know which leaves have upcoming designation, certification, or exhaustion deadlines."
---

# /skill:legal-employment-leave-tracker

> **Attribution:** Adapted from Anthropic's `claude-for-legal/employment-legal` at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. See the package `NOTICE`.
Checks all open leaves with hard legal deadlines and surfaces only the ones
requiring a decision or action. Not a status board — tells you what you need
to do and why.

## Instructions

1. Load the `leave-tracker` agent and run the full workflow.

2. If no HRIS is connected and no `<dataDir>/employment-legal/leave-register.yaml` exists, prompt
   the attorney to upload a leave spreadsheet or use
   `/skill:legal-employment-log-leave` to add entries.

3. Alerts only for leaves requiring action. Clean leaves summarized one line each.

## Examples

```
/skill:legal-employment-leave-tracker
```

Run this weekly — set a Monday-morning reminder to invoke
`/skill:legal-employment-leave-tracker`. Automated scheduling requires a separate
integration (calendar reminder, cron job, etc.); Pi agents do not
self-schedule.
