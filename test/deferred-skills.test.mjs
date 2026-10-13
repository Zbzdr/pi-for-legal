import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const deferredNames = ["legal-employment-log-leave", "legal-employment-leave-tracker"];
const domains = ["privacy-legal", "regulatory-legal", "ai-governance-legal", "employment-legal", "corporate-legal", "litigation-legal", "ip-legal", "product-legal"];
const skillPath = (name) => join(root, "packages/pi-legal-suite/skills", name, "SKILL.md");

test("deferred leave commands remain explicit-only explanatory stubs, not trackers", () => {
  for (const name of deferredNames) {
    const text = readFileSync(skillPath(name), "utf8");
    assert.match(text, /^disable-model-invocation: true$/m);
    assert.match(text, /## Status: deferred/);
    assert.match(text, /Do not create or update a leave register, calculate or certify a deadline/);
    assert.match(text, /Preserve existing leave registers and personnel records unchanged/);
    assert.doesNotMatch(text, /Leave tracker will alert automatically|Load the `leave-tracker` agent|5 business days from leave start/);
  }
});

test("syncing upstream preserves deferred stubs instead of re-enabling incomplete launchers", (t) => {
  // Run a copied importer in a disposable repository, never against the real Skills.
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-deferred-import-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const repository = join(temporary, "repository");
  const upstream = join(temporary, "upstream");
  mkdirSync(join(repository, "scripts"), { recursive: true });
  mkdirSync(join(upstream, ".git"), { recursive: true });
  const importer = join(repository, "scripts/import-upstream-domains.mjs");
  copyFileSync(join(root, "scripts/import-upstream-domains.mjs"), importer);
  for (const domain of domains) mkdirSync(join(upstream, domain, "skills"), { recursive: true });
  for (const name of deferredNames) {
    const sourceName = name.replace("legal-employment-", "");
    const sourceDir = join(upstream, "employment-legal/skills", sourceName);
    const destinationDir = join(repository, "packages/pi-legal-suite/skills", name);
    mkdirSync(sourceDir, { recursive: true });
    mkdirSync(destinationDir, { recursive: true });
    writeFileSync(join(sourceDir, "SKILL.md"), `---\nname: ${sourceName}\ndescription: Old tracker launcher\n---\n# Old workflow\n\nLoad the leave-tracker agent and promise automatic alerts.\n`);
    copyFileSync(skillPath(name), join(destinationDir, "SKILL.md"));
  }
  execFileSync(process.execPath, [importer, upstream], { stdio: "pipe" });
  for (const name of deferredNames) {
    const destination = join(repository, "packages/pi-legal-suite/skills", name, "SKILL.md");
    assert.equal(readFileSync(destination, "utf8"), readFileSync(skillPath(name), "utf8"));
  }
  const stub = join(repository, "packages/pi-legal-suite/skills", deferredNames[0], "SKILL.md");
  rmSync(stub);
  assert.throws(() => execFileSync(process.execPath, [importer, upstream], { stdio: "pipe" }), /restore the checked-in deferred Skill/);
});
