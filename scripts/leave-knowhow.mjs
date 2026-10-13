// Pure adaptation of Apache-2.0 upstream knowhow, shared by import and tests.
export const LEAVE_AGENT_PATH = "employment-legal/agents/leave-tracker.md";
export const LEAVE_OVERRIDE_SKILLS = new Set(["legal-employment-log-leave", "legal-employment-leave-tracker"]);

export function renderLeaveKnowhow(source, revision) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error("A full upstream commit is required for leave provenance");
  const parsed = source.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/);
  if (!parsed) throw new Error("Upstream leave-tracker agent has no valid frontmatter boundary");
  const notice = `> **Attribution:** Adapted from Anthropic's claude-for-legal/${LEAVE_AGENT_PATH} at revision \`${revision}\` under Apache-2.0 and modified for Pi. Mapped from agent knowhow into an on-demand reference, with project-local storage, source/approval gates, and no scheduler. See the package NOTICE.\n\n`;
  let body = parsed[1]
    .replaceAll("~/.claude/plugins/config/claude-for-legal/employment-legal/CLAUDE.md", "the project legal profile")
    .replaceAll("~/.claude/plugins/config/claude-for-legal/employment-legal/leave-register.yaml", "<matter>/outputs/employment/leave-register.yaml")
    .replaceAll("/employment-legal:leave-tracker", "/skill:legal-employment-leave-tracker")
    .replaceAll("/employment-legal:log-leave", "/skill:legal-employment-log-leave")
    .replaceAll("Claude Code agents", "Pi sessions")
    .replaceAll("CLAUDE.md", "the project legal profile")
    .replaceAll("# Leave Tracker Agent", "# On-demand protected-leave knowhow")
    .replaceAll("This agent", "This workflow")
    .replaceAll("this agent", "this workflow")
    .replaceAll("agent-level defaults", "internal-review preferences, not statutory rules")
    .replaceAll("Next scheduled check: [date]", "Suggested next review: [date or not set; not scheduled]")
    .replaceAll("Query for all employees with active leave status.", "Query only explicitly authorized employees with active leave status within the bound matter's scope.")
    .replaceAll("### Step 6 — Update the register\n", "### Step 6 — Optional confirmed register update\n\nDefault to read-only. Preview record changes and obtain confirmation before saving any update; do not interpret completing a check as permission to write.\n")
    .replaceAll("  last_updated: [ISO date]\n", "  last_updated: [system recording date from legal_time]\n  last_checked: [actual check date or null; retain the check's limitations]\n")
    .trim();
  const schema = body.match(/## Leave register format\n([\s\S]*?)(?=\n## What this workflow does NOT do)/)?.[1];
  if (!schema) throw new Error("Upstream leave register section changed; review the adapter before importing");
  const gates = `## Pi execution boundary\n\nRun this knowhow in the current requested task; no agent instance or scheduler is required. Read the bound matter and approved profile, not a global employee portfolio. The default register and all outputs remain under the active matter. Unknown coverage, eligibility, event dates, calendars, or rules stay pending; an unchecked record is not a clean record. Numeric law-based deadlines require current controlling sources, clock ownership, and a documented calculation basis. Internal alert tiers below are preferences, not law. Use legal_time for recording dates, not evidence of an event. Preview and confirm writes; preserve existing notes. Report a suggested next review separately from any actually verified external schedule.\n\n`;
  const verification = `## Per-record provenance and deadline basis\n\nThis is a schematic template, not a default legal rule or a complete record. Use null/unknown for unverified fields and record user statements as intake references. Registration may proceed with pending fields after confirmation; do not manufacture deadlines to make the record look complete.\n\nFor each computed deadline also record:\n\n- source event and its date/basis;\n- applicable jurisdiction, employer coverage, employee eligibility, and regime;\n- whether the clock belongs to the employee or employer;\n- controlling source, pinpoint, currentness/as-of verification, and exceptions;\n- calendar/time zone, holidays/business-day rules, actual schedule, units, and calculation assumptions;\n- due date or null, verification status, unresolved facts, and checker/review date.\n\nKeep any statutory due date separate from an internal reminder threshold. A profile preference or an old HRIS due date is not proof of current law. Preserve approved existing records; do not auto-migrate a legacy/global register. No output claims that a future check is scheduled without a separately configured and actually verified integration.\n`;
  return {
    workflow: `${notice}${gates}${body}\n`,
    register: `${notice}# Protected-leave register and provenance\n\n${schema.trim()}\n\n${verification}`,
  };
}
