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

test("workspace initializer creates the project workspace and leaves Pi settings unchanged", (t) => {
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
  writeFileSync(join(temporary, "AGENTS.md"), "# Existing Agent Rule\n\nKeep this text too.\n");

  const run = (phase) => execFileSync(process.execPath, [
    setupScript,
    "--workspace", temporary,
    "--data-dir", ".",
    "--phase", phase,
  ], { encoding: "utf8" });

  const initialized = JSON.parse(run("initialize"));
  assert.equal(initialized.ok, true);
  assert.deepEqual(JSON.parse(readFileSync(join(piDirectory, "settings.json"), "utf8")), originalSettings);
  const config = JSON.parse(readFileSync(join(piDirectory, "legal-workbench", "config.json"), "utf8"));
  assert.deepEqual(config, {
    schemaVersion: 4,
    profilePath: "AGENTS.md",
    statusPath: ".pi/legal-workbench/status.json",
    indexPath: ".pi/legal-workbench/matter-index.json",
    dataDir: ".",
    matterRoot: "matters",
  });
  assert.equal(existsSync(join(temporary, "AGENTS.md")), true);
  assert.equal(existsSync(join(temporary, "legal-workbench", "AGENTS.md")), false);
  assert.match(readFileSync(join(temporary, "AGENTS.md"), "utf8"), /Existing Agent Rule/);
  assert.match(readFileSync(join(temporary, "AGENTS.md"), "utf8"), /Legal Workbench Practice Profile/);
  assert.equal(existsSync(join(temporary, "matters")), true);
  assert.equal(existsSync(join(temporary, "logs")), true);
  assert.equal(existsSync(join(temporary, "legal-workbench")), false);
  assert.equal(existsSync(join(temporary, "README.md")), false);
  const appendSystem = readFileSync(join(piDirectory, "APPEND_SYSTEM.md"), "utf8");
  assert.match(appendSystem, /Existing Project Rule/);
  assert.equal((appendSystem.match(/pi-legal-workbench:start/g) ?? []).length, 1);

  const profilePath = join(temporary, "AGENTS.md");
  writeFileSync(profilePath, "# User Profile\n\nDo not overwrite.\n");
  JSON.parse(run("complete"));
  assert.match(readFileSync(profilePath, "utf8"), /Do not overwrite/);
  assert.equal(JSON.parse(readFileSync(join(piDirectory, "legal-workbench", "status.json"), "utf8")).setupStatus, "complete");
});

test("workspace initializer rejects an older layout instead of migrating it", (t) => {
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
  assert.throws(() => execFileSync(process.execPath, [setupScript, "--workspace", temporary, "--data-dir", "."], { stdio: "pipe" }));
  assert.equal(JSON.parse(readFileSync(join(stateDirectory, "config.json"), "utf8")).schemaVersion, 2);
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
    "--data-dir", ".",
    "--phase", "complete",
  ]);

  const indexPath = join(temporary, ".pi", "legal-workbench", "matter-index.json");
  writeFileSync(indexPath, `${JSON.stringify({
    schemaVersion: 2,
    updatedAt: "2026-08-19",
    matters: [
      {
        slug: "acme-privacy",
        name: "Acme Privacy Review",
        client: "Acme Corp",
        clientAliases: ["Acme"],
        jurisdictions: ["California"],
        issueKeywords: ["CCPA"],
        status: "active",
        path: "matters/acme-privacy",
        openedAt: "2026-08-19",
        updatedAt: "2026-08-19"
      },
      {
        slug: "secret-merger",
        name: "Secret Merger",
        client: "Other Client",
        clientAliases: [],
        jurisdictions: ["Delaware"],
        issueKeywords: ["merger control"],
        status: "active",
        path: "matters/secret-merger",
        openedAt: "2026-08-19",
        updatedAt: "2026-08-19"
      }
    ]
  }, null, 2)}\n`);

  const entries = [];
  const handlers = new Map();
  const tools = new Map();
  let sessionName;
  const pi = {
    on(event, handler) { handlers.set(event, handler); },
    registerTool(tool) { tools.set(tool.name, tool); },
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
  const matterTool = tools.get("legal_matter_session");
  const timeTool = tools.get("legal_time");
  assert.ok(matterTool);
  assert.ok(timeTool);
  handlers.get("session_start")({ reason: "startup" }, context);
  const bootstrap = handlers.get("before_agent_start")({
    prompt: "Please review Acme's California CCPA issue.",
    systemPrompt: "BASE",
  }, context);
  assert.match(bootstrap.systemPrompt, /acme-privacy/);
  assert.doesNotMatch(bootstrap.systemPrompt, /secret-merger|Other Client/);
  assert.equal(handlers.get("before_agent_start")({ prompt: "again", systemPrompt: "BASE" }, context), undefined);

  const blockedList = await matterTool.execute("list-1", { action: "list" }, undefined, undefined, context);
  assert.match(blockedList.content[0].text, /explicit user request/i);
  handlers.get("before_agent_start")({ prompt: "/skill:legal-matter-workspace list", systemPrompt: "BASE" }, context);
  const explicitList = await matterTool.execute("list-2", { action: "list" }, undefined, undefined, context);
  assert.match(explicitList.content[0].text, /secret-merger/);

  const createResult = await matterTool.execute("call-1", {
    action: "create",
    slug: "new-york-nda",
    name: "New York NDA",
    client: "Example Co",
    clientAliases: ["Example"],
    jurisdictions: ["New York"],
    issueKeywords: ["trade secrets"],
    scope: "Review and negotiate mutual NDA",
    intakeRequest: "Please initialize a matter for the proposed mutual NDA review.",
    providedFiles: ["inputs/requested-nda.docx"],
    confirmed: true,
  }, undefined, undefined, context);
  assert.match(createResult.content[0].text, /Session bound to new-york-nda/);
  const matterPath = join(temporary, "matters", "new-york-nda");
  for (const path of ["matter.md", "history.md", "notes.md", "outputs"]) {
    assert.equal(existsSync(join(matterPath, path)), true, `missing matter path: ${path}`);
  }
  for (const path of ["README.md", "sources", "research", "work-product"]) {
    assert.equal(existsSync(join(matterPath, path)), false, `legacy matter path should not exist: ${path}`);
  }
  assert.equal(existsSync(join(matterPath, "sessions")), false);
  const matterFile = readFileSync(join(matterPath, "matter.md"), "utf8");
  assert.match(matterFile, /session-test/);
  assert.doesNotMatch(matterFile, /Raw session/);
  assert.match(matterFile, /Intake status: initialization only; verification pending/);
  assert.match(matterFile, /Please initialize a matter for the proposed mutual NDA review/);
  assert.match(matterFile, /inputs\/requested-nda\.docx/);
  assert.match(matterFile, /not verified facts, legal conclusions, deadlines/);
  assert.match(sessionName, /new-york-nda/);
  const timeResult = await timeTool.execute("time-1", {}, undefined, undefined, context);
  assert.match(timeResult.content[0].text, /System date: \d{4}-\d{2}-\d{2}/);
  assert.match(timeResult.content[0].text, /Unix date command/);
  assert.match(readFileSync(join(matterPath, "history.md"), "utf8"), /## \d{4}-\d{2}-\d{2} — Matter opened/);
  assert.match(readFileSync(join(matterPath, "history.md"), "utf8"), /System record: matter created/);

  const blocked = handlers.get("tool_call")({ toolName: "write", input: { path: "outside-matter.md" } }, context);
  assert.equal(blocked.block, true);
  const allowed = handlers.get("tool_call")({
    toolName: "edit",
    input: { path: "matters/new-york-nda/matter.md" },
  }, context);
  assert.equal(allowed, undefined);

  const closeResult = await matterTool.execute("call-2", {
    action: "close",
    slug: "new-york-nda",
    confirmed: true,
  }, undefined, undefined, context);
  assert.match(closeResult.content[0].text, /Matter closed/);
  assert.match(readFileSync(join(matterPath, "matter.md"), "utf8"), /- Status: closed/);
  assert.match(readFileSync(join(matterPath, "history.md"), "utf8"), /## \d{4}-\d{2}-\d{2} — Matter closed/);
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
