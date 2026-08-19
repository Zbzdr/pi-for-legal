import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, "packages", "pi-legal-suite");
const skillsRoot = join(packageRoot, "skills");
const extensionPath = join(packageRoot, "extensions", "legal-workbench.ts");
const setupScript = join(skillsRoot, "legal-setup", "scripts", "init_workspace.mjs");

function skillNames() {
  return readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

test("workspace exposes one publishable suite with 88 Skills and one extension", () => {
  const workspace = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const suite = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  assert.equal(workspace.private, true);
  assert.deepEqual(workspace.workspaces, ["packages/pi-legal-suite"]);
  assert.equal(suite.name, "@zbzdr/pi-legal-suite");
  assert.equal(suite.private, undefined);
  assert.deepEqual(suite.pi, { extensions: ["./extensions"], skills: ["./skills"] });
  assert.equal(skillNames().length, 88);
  assert.equal(existsSync(extensionPath), true);

  for (const entry of readdirSync(join(root, "packages"), { withFileTypes: true })) {
    if (!entry.isDirectory() || entry.name === "pi-legal-suite") continue;
    const manifestPath = join(root, "packages", entry.name, "package.json");
    assert.equal(JSON.parse(readFileSync(manifestPath, "utf8")).private, true, `${entry.name} must be an archived private snapshot`);
  }
});

test("workspace validator accepts the single-package boundary", () => {
  const output = execFileSync(process.execPath, [join(root, "scripts", "validate-package.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(output, /88 Skills, 1 extension, single publishable package/);
});

test("upstream internal workers retain Pi progressive disclosure", () => {
  for (const skill of [
    "legal-nda-review",
    "legal-saas-review",
    "legal-vendor-review",
    "legal-employment-internal-investigation",
    "legal-employment-international-expansion",
  ]) {
    const text = readFileSync(join(skillsRoot, skill, "SKILL.md"), "utf8");
    assert.match(text, /^disable-model-invocation:\s*true$/m, `${skill} must stay out of automatic model selection`);
  }
});

test("workspace initializer preserves settings and leaves Pi session storage unchanged", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-workspace-init-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const piDirectory = join(temporary, ".pi");
  mkdirSync(piDirectory, { recursive: true });
  const originalSettings = {
    packages: ["npm:@example/existing-package"],
    enableSkillCommands: false,
  };
  writeFileSync(join(piDirectory, "settings.json"), `${JSON.stringify(originalSettings, null, 2)}\n`);
  writeFileSync(join(piDirectory, "APPEND_SYSTEM.md"), "# Existing Project Rule\n\nKeep this text.\n");

  const run = (phase) => execFileSync(process.execPath, [
    setupScript,
    "--workspace", temporary,
    "--data-dir", "legal-workbench",
    "--phase", phase,
  ], { encoding: "utf8" });

  const initialized = JSON.parse(run("initialize"));
  assert.equal(initialized.ok, true);
  assert.equal(initialized.paths.sessionDir, undefined);
  assert.deepEqual(JSON.parse(readFileSync(join(piDirectory, "settings.json"), "utf8")), originalSettings);
  const config = JSON.parse(readFileSync(join(piDirectory, "legal-workbench", "config.json"), "utf8"));
  assert.deepEqual(config, {
    schemaVersion: 2,
    profilePath: ".pi/legal-workbench/profile.md",
    statusPath: ".pi/legal-workbench/status.json",
    indexPath: ".pi/legal-workbench/matter-index.json",
    dataDir: "legal-workbench",
    matterRoot: "legal-workbench/matters",
  });
  assert.equal(existsSync(join(temporary, "legal-workbench", "matters")), true);
  assert.equal(existsSync(join(temporary, "legal-workbench", "sessions")), false);
  const appendSystem = readFileSync(join(piDirectory, "APPEND_SYSTEM.md"), "utf8");
  assert.match(appendSystem, /Existing Project Rule/);
  assert.equal((appendSystem.match(/pi-legal-workbench:start/g) ?? []).length, 1);

  const profilePath = join(piDirectory, "legal-workbench", "profile.md");
  writeFileSync(profilePath, "# User Profile\n\nDo not overwrite.\n");
  JSON.parse(run("complete"));
  assert.match(readFileSync(profilePath, "utf8"), /Do not overwrite/);
  assert.equal(JSON.parse(readFileSync(join(piDirectory, "legal-workbench", "status.json"), "utf8")).setupStatus, "complete");
});

test("workspace initializer migrates its draft sessionDir config without changing Pi settings", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-workspace-migrate-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const stateDirectory = join(temporary, ".pi", "legal-workbench");
  mkdirSync(stateDirectory, { recursive: true });
  writeFileSync(join(stateDirectory, "config.json"), JSON.stringify({
    schemaVersion: 2,
    profilePath: ".pi/legal-workbench/profile.md",
    statusPath: ".pi/legal-workbench/status.json",
    indexPath: ".pi/legal-workbench/matter-index.json",
    dataDir: "legal-workbench",
    matterRoot: "legal-workbench/matters",
    sessionDir: "legal-workbench/sessions",
  }, null, 2));
  writeFileSync(join(temporary, ".pi", "settings.json"), JSON.stringify({ sessionDir: "custom-user-session-location" }, null, 2));

  execFileSync(process.execPath, [setupScript, "--workspace", temporary, "--data-dir", "legal-workbench"]);
  const config = JSON.parse(readFileSync(join(stateDirectory, "config.json"), "utf8"));
  assert.equal(config.sessionDir, undefined);
  const settings = JSON.parse(readFileSync(join(temporary, ".pi", "settings.json"), "utf8"));
  assert.equal(settings.sessionDir, "custom-user-session-location");
});

test("workspace initializer removes only its legacy managed sessionDir setting", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-session-migrate-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  mkdirSync(join(temporary, ".pi"), { recursive: true });
  writeFileSync(join(temporary, ".pi", "settings.json"), JSON.stringify({
    sessionDir: "legal-workbench/sessions",
    packages: ["npm:@zbzdr/pi-legal-suite"],
  }, null, 2));

  const result = JSON.parse(execFileSync(process.execPath, [
    setupScript,
    "--workspace", temporary,
    "--data-dir", "legal-workbench",
  ], { encoding: "utf8" }));
  const settings = JSON.parse(readFileSync(join(temporary, ".pi", "settings.json"), "utf8"));
  assert.equal(settings.sessionDir, undefined);
  assert.deepEqual(settings.packages, ["npm:@zbzdr/pi-legal-suite"]);
  assert.equal(result.sessionSettingMigration, "removed-legacy-managed-value");
});

test("workspace initializer rejects hidden or escaping data roots", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-workspace-paths-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  for (const dataDir of [".pi/legal-data", "../outside"]) {
    assert.throws(() => execFileSync(process.execPath, [
      setupScript,
      "--workspace", temporary,
      "--data-dir", dataDir,
    ], { stdio: "pipe" }));
  }
});

test("legal workbench bootstraps once, binds session IDs, and guards matter writes", async (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-extension-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  execFileSync(process.execPath, [
    setupScript,
    "--workspace", temporary,
    "--data-dir", "legal-workbench",
    "--phase", "complete",
  ]);

  const indexPath = join(temporary, ".pi", "legal-workbench", "matter-index.json");
  writeFileSync(indexPath, `${JSON.stringify({
    schemaVersion: 1,
    updatedAt: "2026-08-19T00:00:00.000Z",
    matters: [
      {
        slug: "acme-privacy",
        name: "Acme Privacy Review",
        client: "Acme Corp",
        clientAliases: ["Acme"],
        jurisdictions: ["California"],
        issueKeywords: ["CCPA"],
        status: "active",
        path: "legal-workbench/matters/acme-privacy",
        openedAt: "2026-08-19T00:00:00.000Z",
        updatedAt: "2026-08-19T00:00:00.000Z"
      },
      {
        slug: "secret-merger",
        name: "Secret Merger",
        client: "Other Client",
        clientAliases: [],
        jurisdictions: ["Delaware"],
        issueKeywords: ["merger control"],
        status: "active",
        path: "legal-workbench/matters/secret-merger",
        openedAt: "2026-08-19T00:00:00.000Z",
        updatedAt: "2026-08-19T00:00:00.000Z"
      }
    ]
  }, null, 2)}\n`);

  const entries = [];
  const handlers = new Map();
  let matterTool;
  let sessionName;
  const pi = {
    on(event, handler) { handlers.set(event, handler); },
    registerTool(tool) { matterTool = tool; },
    appendEntry(customType, data) { entries.push({ type: "custom", customType, data }); },
    setSessionName(name) { sessionName = name; },
  };
  const context = {
    cwd: temporary,
    sessionManager: {
      getEntries: () => entries,
      getBranch: () => entries,
      getSessionId: () => "session-test",
    },
  };

  const extension = await import(`../packages/pi-legal-suite/extensions/legal-workbench.ts?test=${Date.now()}`);
  extension.default(pi);
  handlers.get("session_start")({ reason: "startup" }, context);
  const bootstrap = handlers.get("before_agent_start")({
    prompt: "Please review Acme's California CCPA issue.",
    systemPrompt: "BASE",
  }, context);
  assert.match(bootstrap.systemPrompt, /acme-privacy/);
  assert.doesNotMatch(bootstrap.systemPrompt, /secret-merger|Other Client/);
  assert.equal(handlers.get("before_agent_start")({ prompt: "again", systemPrompt: "BASE" }, context), undefined);

  const createResult = await matterTool.execute("call-1", {
    action: "create",
    slug: "new-york-nda",
    name: "New York NDA",
    client: "Example Co",
    clientAliases: ["Example"],
    jurisdictions: ["New York"],
    issueKeywords: ["trade secrets"],
    scope: "Review and negotiate mutual NDA",
    confirmed: true,
  }, undefined, undefined, context);
  assert.match(createResult.content[0].text, /Session bound to new-york-nda/);
  const matterPath = join(temporary, "legal-workbench", "matters", "new-york-nda");
  for (const path of ["README.md", "matter.md", "history.md", "notes.md", "sources", "research", "work-product"]) {
    assert.equal(existsSync(join(matterPath, path)), true, `missing matter path: ${path}`);
  }
  assert.equal(existsSync(join(matterPath, "sessions")), false);
  const matterReadme = readFileSync(join(matterPath, "README.md"), "utf8");
  assert.match(matterReadme, /session-test/);
  assert.doesNotMatch(matterReadme, /Raw session/);
  assert.match(sessionName, /new-york-nda/);

  const blocked = handlers.get("tool_call")({ toolName: "write", input: { path: "outside-matter.md" } }, context);
  assert.equal(blocked.block, true);
  const allowed = handlers.get("tool_call")({
    toolName: "edit",
    input: { path: "legal-workbench/matters/new-york-nda/README.md" },
  }, context);
  assert.equal(allowed, undefined);

  const closeResult = await matterTool.execute("call-2", {
    action: "close",
    slug: "new-york-nda",
    confirmed: true,
  }, undefined, undefined, context);
  assert.match(closeResult.content[0].text, /Matter closed/);
  assert.match(readFileSync(join(matterPath, "README.md"), "utf8"), /- Status: closed/);
});

test("DOCX redline writes tracked changes, preserves source, and uses a pinned local runtime", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-docx-test-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
  const skillRoot = join(skillsRoot, "legal-docx-redline");
  const source = join(temporary, "contract.docx");
  const edits = join(temporary, "edits.json");
  const output = join(temporary, "contract.redline.docx");
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>Liability is limited to three </w:t></w:r><w:r><w:t>months of fees.</w:t></w:r></w:p><w:sectPr/></w:body></w:document>`;
  mkdirSync(join(temporary, "docx", "word"), { recursive: true });
  writeFileSync(join(temporary, "docx", "[Content_Types].xml"), `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>`);
  writeFileSync(join(temporary, "docx", "word", "document.xml"), documentXml);
  execFileSync("zip", ["-q", "-r", source, "."], { cwd: join(temporary, "docx") });
  writeFileSync(edits, JSON.stringify({ edits: [
    { match: "Liability", replacement: "Aggregate liability" },
    { match: "three months", replacement: "twelve months" },
  ] }));
  execFileSync("python3", [
    join(skillRoot, "scripts", "docx_redline.py"), source,
    "--edits", edits,
    "--output", output,
    "--workspace", temporary,
    "--allow-stdlib-fallback",
  ]);
  const redlineXml = execFileSync("unzip", ["-p", output, "word/document.xml"], { encoding: "utf8" });
  assert.match(redlineXml, /<w:del\b/);
  assert.match(redlineXml, /<w:ins\b/);
  assert.match(redlineXml, /twelve months/);
  assert.equal(execFileSync("unzip", ["-p", source, "word/document.xml"], { encoding: "utf8" }), documentXml);

  const requirements = readFileSync(join(skillRoot, "scripts", "requirements.txt"), "utf8");
  assert.match(requirements, /^python-docx==1\.2\.0$/m);
  assert.match(requirements, /^lxml==6\.1\.1$/m);
});
