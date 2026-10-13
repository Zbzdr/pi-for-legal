import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { LEAVE_AGENT_PATH, LEAVE_OVERRIDE_SKILLS, renderLeaveKnowhow } from "../scripts/leave-knowhow.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const names = [...LEAVE_OVERRIDE_SKILLS];
const domains = ["privacy-legal", "regulatory-legal", "ai-governance-legal", "employment-legal", "corporate-legal", "litigation-legal", "ip-legal", "product-legal"];
const skillPath = (name) => join(root, "packages/pi-legal-suite/skills", name, "SKILL.md");
const fixture = `---\nname: leave-tracker\ndescription: Upstream test fixture\n---\n# Leave Tracker Agent\n\nResearch actual normal schedule, concurrent state leave, and clock ownership.\n\nNext scheduled check: [date]\n\n### Step 6 — Update the register\n\n## Leave register format\n\n\`~/.claude/plugins/config/claude-for-legal/employment-legal/leave-register.yaml\`:\n\n\`\`\`yaml\n- employee_id: [ID]\n  last_updated: [ISO date]\n\`\`\`\n\n## What this agent does NOT do\n\nNever replace researched current rules with model memory.\n`;

function git(cwd, ...args) {
  return execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}

test("protected-leave Skills retain on-demand work without background promises", () => {
  for (const name of names) {
    const text = readFileSync(skillPath(name), "utf8");
    assert.doesNotMatch(text, /^disable-model-invocation: true$|## Status: deferred/m);
    assert.match(text, /## Pi on-demand workflow/);
    assert.match(text, /<matter>\/outputs\/employment\/leave-register\.yaml/);
    assert.match(text, /confirmation|confirm/i);
    assert.doesNotMatch(text, /Leave tracker will alert automatically|Load the `leave-tracker` agent|5 business days from leave start/);
  }
  const tracker = readFileSync(skillPath("legal-employment-leave-tracker"), "utf8");
  assert.match(tracker, /Default to a read-only check/);
  assert.match(tracker, /Incomplete review must not be summarized as "no action needed"/);
});

test("the upstream agent is mapped into reusable knowhow, not a required agent process", () => {
  const result = renderLeaveKnowhow(fixture, "a".repeat(40));
  assert.match(result.workflow, /actual normal schedule, concurrent state leave, and clock ownership/);
  assert.match(result.workflow, /Suggested next review: .*not scheduled/);
  assert.doesNotMatch(result.workflow, /Next scheduled check:|~\/\.claude/);
  assert.match(result.register, /<matter>\/outputs\/employment\/leave-register.yaml/);
  assert.match(result.register, /last_checked/);
  assert.match(result.register, /clock belongs to the employee or employer/);
  assert.throws(() => renderLeaveKnowhow(fixture, "main"), /full upstream commit/);
  assert.throws(() => renderLeaveKnowhow("not an agent", "a".repeat(40)), /frontmatter/);
  assert.throws(() => renderLeaveKnowhow(fixture.replace("## Leave register format", "## Renamed section"), "a".repeat(40)), /section changed/);
});

test("checked-in knowhow retains the substantive leave framework and verification gaps", () => {
  const text = readFileSync(join(root, "packages/pi-legal-suite/skills/legal-employment-leave-tracker/references/leave-workflow.md"), "utf8");
  for (const term of ["actual normal", "concurrent", "USERRA", "application-for-reemployment", "accommodation", "medical", "controlling", "unchecked record"]) assert.ok(text.includes(term), term);
  assert.doesNotMatch(text, /Next scheduled check:|~\/\.claude/);
});

test("upstream import refreshes knowhow but preserves Pi storage and approval wrappers", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-leave-import-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const repository = join(temporary, "repository");
  const upstream = join(temporary, "upstream");
  mkdirSync(join(repository, "scripts"), { recursive: true });
  mkdirSync(upstream, { recursive: true });
  const importer = join(repository, "scripts/import-upstream-domains.mjs");
  for (const script of ["import-upstream-domains.mjs", "leave-knowhow.mjs"]) copyFileSync(join(root, "scripts", script), join(repository, "scripts", script));
  for (const domain of domains) mkdirSync(join(upstream, domain, "skills"), { recursive: true });
  mkdirSync(join(upstream, "employment-legal/agents"), { recursive: true });
  writeFileSync(join(upstream, LEAVE_AGENT_PATH), fixture);
  for (const name of names) {
    const sourceName = name.replace("legal-employment-", "");
    const sourceDir = join(upstream, "employment-legal/skills", sourceName);
    const destinationDir = join(repository, "packages/pi-legal-suite/skills", name);
    mkdirSync(sourceDir, { recursive: true });
    mkdirSync(destinationDir, { recursive: true });
    writeFileSync(join(sourceDir, "SKILL.md"), `---\nname: ${sourceName}\ndescription: Old launcher\n---\n# Old workflow\n\nLoad the leave-tracker agent.\n`);
    copyFileSync(skillPath(name), join(destinationDir, "SKILL.md"));
  }
  git(upstream, "init", "-q");
  git(upstream, "add", ".");
  git(upstream, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", "Fixture");
  const revision = git(upstream, "rev-parse", "HEAD");
  const manifest = join(repository, "packages/pi-legal-suite/package.json");
  writeFileSync(manifest, JSON.stringify({ piLegal: { upstreamRevision: revision } }));
  execFileSync(process.execPath, [importer, upstream], { stdio: "pipe" });
  for (const name of names) {
    const destination = join(repository, "packages/pi-legal-suite/skills", name, "SKILL.md");
    assert.equal(readFileSync(destination, "utf8"), readFileSync(skillPath(name), "utf8"));
  }
  const generated = join(repository, "packages/pi-legal-suite/skills/legal-employment-leave-tracker/references/leave-workflow.md");
  assert.equal(readFileSync(generated, "utf8"), renderLeaveKnowhow(fixture, revision).workflow);
  writeFileSync(join(upstream, LEAVE_AGENT_PATH), `${fixture}\nChanged source\n`);
  assert.throws(() => execFileSync(process.execPath, [importer, upstream], { stdio: "pipe" }), /checkout must be clean/);
  git(upstream, "checkout", "--", LEAVE_AGENT_PATH);
  writeFileSync(manifest, JSON.stringify({ piLegal: { upstreamRevision: "a".repeat(40) } }));
  assert.throws(() => execFileSync(process.execPath, [importer, upstream], { stdio: "pipe" }), /differs from reviewed revision/);
  writeFileSync(manifest, JSON.stringify({ piLegal: { upstreamRevision: revision } }));
  rmSync(join(repository, "packages/pi-legal-suite/skills", names[0], "SKILL.md"));
  assert.throws(() => execFileSync(process.execPath, [importer, upstream], { stdio: "pipe" }), /restore the checked-in Pi on-demand wrapper/);
});
