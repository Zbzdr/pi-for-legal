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

test("workspace exposes one publishable suite with 89 Skills and one extension", () => {
  const workspace = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  const suite = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
  assert.equal(workspace.private, true);
  assert.deepEqual(workspace.workspaces, ["packages/pi-legal-suite"]);
  assert.equal(suite.name, "@zbzdr/pi-legal-suite");
  assert.equal(suite.private, undefined);
  assert.deepEqual(suite.pi, { extensions: ["./extensions"], skills: ["./skills"] });
  assert.equal(skillNames().length, 89);
  assert.equal(existsSync(extensionPath), true);

  const extraPackageDirectories = readdirSync(join(root, "packages"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== "pi-legal-suite")
    .map((entry) => entry.name);
  assert.deepEqual(
    extraPackageDirectories,
    [],
    "packages/ must contain only the published suite; former private snapshots are recovered from git history",
  );
});

test("workspace validator accepts the single-package boundary", () => {
  const output = execFileSync(process.execPath, [join(root, "scripts", "validate-package.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(output, /89 Skills, 1 extension, single publishable package/);
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
    "--document-git", "auto",
    "--git-author-name", "Setup Test",
    "--git-author-email", "setup@example.invalid",
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
    documentGit: { mode: "auto", authorName: "Setup Test", authorEmail: "setup@example.invalid" },
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

test("schema-4 Git policy setup is additive and preserves existing profiles, data and identity on resume", (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "pi-legal-git-policy-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const run = (...flags) => JSON.parse(execFileSync(process.execPath, [setupScript, "--workspace", cwd, "--data-dir", ".", ...flags], { encoding: "utf8" }));
  run("--document-git", "manual");
  const configPath = join(cwd, ".pi/legal-workbench/config.json");
  const original = JSON.parse(readFileSync(configPath, "utf8"));
  delete original.documentGit;
  writeFileSync(configPath, JSON.stringify(Object.fromEntries(Object.entries(original).reverse())));
  writeFileSync(join(cwd, "AGENTS.md"), "# Filled profile\n\nExisting user choices.\n");
  writeFileSync(join(cwd, "matters/keep.md"), "Preserve source material.\n");
  const added = run("--git-author-name", "Chosen Author", "--git-author-email", "chosen@example.invalid");
  assert.equal(added.paths.documentGit.mode, "auto");
  assert.match(readFileSync(join(cwd, "AGENTS.md"), "utf8"), /Existing user choices/);
  assert.equal(readFileSync(join(cwd, "matters/keep.md"), "utf8"), "Preserve source material.\n");
  const resumed = run("--phase", "complete");
  assert.deepEqual(resumed.paths.documentGit, added.paths.documentGit);
  assert.equal(existsSync(join(cwd, ".git")), false, "setup configures future matter repositories, not a shared repository");
});

test("automatic Git setup requires an explicit or configured author before writing workspace files", (t) => {
  const cwd = mkdtempSync(join(tmpdir(), "pi-legal-no-git-author-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const config = join(cwd, "empty.gitconfig");
  writeFileSync(config, "[user]\n useConfigOnly = true\n");
  const env = { ...process.env, GIT_CONFIG_GLOBAL: config, GIT_CONFIG_NOSYSTEM: "1" };
  delete env.GIT_AUTHOR_NAME; delete env.GIT_AUTHOR_EMAIL; delete env.EMAIL;
  assert.throws(() => execFileSync(process.execPath, [setupScript, "--workspace", cwd, "--data-dir", "."], { env, stdio: "pipe" }), /author name\/email/);
  assert.equal(existsSync(join(cwd, ".pi")), false);
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
    "--document-git", "manual",
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
  assert.ok(matterTool);
  assert.equal(tools.has("legal_time"), false);
  assert.ok(tools.has("legal_document_revision"));
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

test("DOCX redline maps an available capability instead of shipping a fixed engine", () => {
  const skillRoot = join(skillsRoot, "legal-docx-redline");
  const text = readFileSync(join(skillRoot, "SKILL.md"), "utf8");
  assert.match(text, /read its instructions from the advertised path/i);
  assert.match(text, /Model-written scripts are allowed/);
  assert.equal(existsSync(join(skillRoot, "scripts")), false);
  assert.equal(existsSync(join(skillRoot, "references", "docx-workflow.md")), true);
});
