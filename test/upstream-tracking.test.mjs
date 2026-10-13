import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { collectUpstreamStatus } from "../scripts/track-upstream.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const checkedAt = "2026-10-13T00:00:00.000Z";
function git(repo, ...args) {
  return execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
}
function fixture(t) {
  const repo = mkdtempSync(join(tmpdir(), "pi-legal-upstream-test-"));
  t.after(() => rmSync(repo, { recursive: true, force: true }));
  git(repo, "init", "-q");
  const put = (path, content) => {
    mkdirSync(dirname(join(repo, path)), { recursive: true });
    writeFileSync(join(repo, path), content);
  };
  const commit = (message) => {
    git(repo, "add", ".");
    git(repo, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-qm", message);
    return git(repo, "rev-parse", "HEAD");
  };
  put("employment-legal/agents/leave-tracker.md", "Original knowhow\n");
  put("commercial-legal/skills/review/SKILL.md", "Original review\n");
  const initial = commit("Initial mapping fixture");
  return { repo, put, commit, initial };
}

test("tracking identical revisions reports no upstream changes and stable source blobs", (t) => {
  const { repo, initial } = fixture(t);
  const sourcePaths = ["employment-legal/agents/leave-tracker.md"];
  const before = git(repo, "status", "--porcelain");
  const report = collectUpstreamStatus({ repo, initialRevision: initial, reviewedRevision: initial, sourcePaths, checkedAt });
  assert.equal(report.relationToInitial, "same");
  assert.equal(report.aheadBy, 0);
  assert.equal(report.changedFileCount, 0);
  assert.deepEqual(report.commits, []);
  assert.equal(report.sourceBlobs[0].initial, report.sourceBlobs[0].observed);
  assert.equal(report.checkedAt, checkedAt);
  assert.equal(report.networkFetch, false);
  assert.equal(git(repo, "status", "--porcelain"), before);
});

test("tracking records additions, removals, knowhow and shared-core updates without importing", (t) => {
  const { repo, put, commit, initial } = fixture(t);
  put("employment-legal/agents/leave-tracker.md", "Updated knowhow\n");
  put("employment-legal/skills/new-leave/SKILL.md", "New workflow\n");
  put("commercial-legal/skills/cold-start-interview/SKILL.md", "Changed setup\n");
  put("commercial-legal/skills/spaced name/SKILL.md", "Filename framing\n");
  put("employment-legal/.mcp.json", "{}\n");
  put("README.md", "Upstream docs\n");
  rmSync(join(repo, "commercial-legal/skills/review/SKILL.md"));
  const latest = commit("Update skills and agent knowhow");
  const report = collectUpstreamStatus({ repo, initialRevision: initial, reviewedRevision: initial, sourcePaths: ["employment-legal/agents/leave-tracker.md", "commercial-legal/skills/review/SKILL.md"], checkedAt });
  assert.equal(report.observedRevision, latest);
  assert.equal(report.reviewedRevision, initial, "Observation must not imply synchronization");
  assert.equal(report.relationToInitial, "ahead");
  assert.equal(report.aheadBy, 1);
  assert.equal(report.changedFileCount, 7);
  assert.equal(report.commits[0].subject, "Update skills and agent knowhow");
  const changes = new Map(report.changes.map((entry) => [entry.path, entry]));
  assert.equal(changes.get("employment-legal/agents/leave-tracker.md").disposition, "mapped-knowhow-review");
  assert.equal(changes.get("commercial-legal/skills/cold-start-interview/SKILL.md").disposition, "shared-core-review");
  assert.equal(changes.get("employment-legal/.mcp.json").disposition, "unbundled-integration-review");
  assert.equal(changes.get("commercial-legal/skills/spaced name/SKILL.md").status, "A");
  assert.equal(changes.get("commercial-legal/skills/review/SKILL.md").status, "D");
  assert.notEqual(report.sourceBlobs[0].initial, report.sourceBlobs[0].observed);
  assert.equal(report.sourceBlobs[1].observed, null);
  assert.equal(git(repo, "status", "--porcelain"), "");
});

test("older and divergent targets are not mislabeled as forward updates", (t) => {
  const { repo, put, commit, initial } = fixture(t);
  put("README.md", "Later\n");
  const later = commit("Later update");
  assert.equal(collectUpstreamStatus({ repo, initialRevision: later, reviewedRevision: later, target: initial }).relationToInitial, "behind");
  git(repo, "checkout", "--detach", initial);
  put("other.md", "Different history\n");
  commit("Divergent update");
  const report = collectUpstreamStatus({ repo, initialRevision: later, reviewedRevision: later });
  assert.equal(report.relationToInitial, "diverged");
  assert.equal(report.aheadBy, 1);
  assert.equal(report.behindBy, 1);
  assert.throws(() => collectUpstreamStatus({ repo, initialRevision: later, reviewedRevision: later, target: "missing-ref" }));
});

test("CLI rejects a wrong origin before writing a report", (t) => {
  const { repo } = fixture(t);
  git(repo, "remote", "add", "origin", "https://example.invalid/not-the-upstream.git");
  const output = join(repo, "must-not-exist.json");
  assert.throws(() => execFileSync(process.execPath, [join(root, "scripts/track-upstream.mjs"), repo, "--output", output], { stdio: "pipe" }), /Origin does not match/);
  assert.equal(existsSync(output), false);
});

test("checked-in report distinguishes the initial mapping, reviewed pin and observation", () => {
  const tracking = JSON.parse(readFileSync(join(root, "docs/upstream-tracking.json"), "utf8"));
  const report = JSON.parse(readFileSync(join(root, "docs/upstream-status.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(join(root, "packages/pi-legal-suite/package.json"), "utf8"));
  assert.equal(report.initialRevision, tracking.initialMapping.upstreamRevision);
  assert.equal(report.reviewedRevision, manifest.piLegal.upstreamRevision);
  assert.equal(report.changedFileCount, report.changes.length);
  assert.equal(report.networkFetch, true, "A committed remote status report must document a fresh fetch");
  assert.equal(report.sourceBlobs.length, tracking.sourcePaths.length);
  if (report.relationToInitial === "same") {
    assert.equal(report.observedRevision, report.initialRevision);
    assert.equal(report.changedFileCount, 0);
    assert.equal(report.aheadBy, 0);
    assert.equal(report.behindBy, 0);
    for (const source of report.sourceBlobs) assert.equal(source.initial, source.observed);
  }
});
