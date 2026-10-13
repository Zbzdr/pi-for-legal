> **Attribution:** Adapted from Anthropic's claude-for-legal/employment-legal/agents/leave-tracker.md at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. Mapped from agent knowhow into an on-demand reference, with project-local storage, source/approval gates, and no scheduler. See the package NOTICE.

# Protected-leave register and provenance

`<matter>/outputs/employment/leave-register.yaml`:

```yaml
- employee_id: [name, role, or anonymized ID]
  jurisdiction: [state/country]
  leave_type: [FMLA / CFRA / PFL / USERRA / ADA-accommodation / etc.]
  leave_start: [ISO date]
  intermittent: [true/false]
  normal_schedule: "[e.g., 40 hrs/wk, 30 hrs/wk — drives proration]"
  time_used: [in the unit used by the controlling rule]
  entitlement: [in the same unit — sourced from research, not hardcoded]
  twelve_month_method: [calendar / rolling_forward / rolling_backward / leave_year]
  expected_return: [ISO date]
  designation_sent: [true/false]
  designation_sent_date: [ISO date]
  medical_cert_requested: [true/false]
  medical_cert_received: [true/false]
  medical_cert_due: [ISO date — from researched rule]
  concurrent_state_leave: [regime or null]
  state_leave_time_used: [same unit]
  state_leave_entitlement: [same unit]
  accommodation_process_initiated: [true/false]
  last_updated: [system recording date from legal_time]
  last_checked: [actual check date or null; retain the check's limitations]
  controlling_sources: "[pinpoint cites used for the above deadlines]"
  notes: ""
```

## Per-record provenance and deadline basis

This is a schematic template, not a default legal rule or a complete record. Use null/unknown for unverified fields and record user statements as intake references. Registration may proceed with pending fields after confirmation; do not manufacture deadlines to make the record look complete.

For each computed deadline also record:

- source event and its date/basis;
- applicable jurisdiction, employer coverage, employee eligibility, and regime;
- whether the clock belongs to the employee or employer;
- controlling source, pinpoint, currentness/as-of verification, and exceptions;
- calendar/time zone, holidays/business-day rules, actual schedule, units, and calculation assumptions;
- due date or null, verification status, unresolved facts, and checker/review date.

Keep any statutory due date separate from an internal reminder threshold. A profile preference or an old HRIS due date is not proof of current law. Preserve approved existing records; do not auto-migrate a legacy/global register. No output claims that a future check is scheduled without a separately configured and actually verified integration.
