import assert from "node:assert/strict";
import { execFileSync, spawn } from "node:child_process";
import fs, { existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { syncBuiltinESMExports } from "node:module";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import legalWorkbench from "../packages/pi-legal-suite/extensions/legal-workbench.ts";

const setupScript = fileURLToPath(new URL("../packages/pi-legal-suite/skills/legal-setup/scripts/init_workspace.mjs", import.meta.url));

function workspace(t) {
  const cwd = mkdtempSync(join(tmpdir(), "pi-legal-state-test-"));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  execFileSync(process.execPath, [setupScript, "--workspace", cwd, "--data-dir", ".", "--phase", "complete", "--document-git", "manual"]);
  return {
    cwd,
    indexPath: join(cwd, ".pi/legal-workbench/matter-index.json"),
    lockPath: join(cwd, ".pi/legal-workbench/matter-operation.lock"),
  };
}

function session(cwd, id, initialEntries = []) {
  let branch = [...initialEntries];
  const handlers = new Map();
  const tools = new Map();
  legalWorkbench({
    on: (event, handler) => handlers.set(event, handler),
    registerTool: (tool) => tools.set(tool.name, tool),
    appendEntry: (customType, data) => branch.push({ type: "custom", customType, data }),
    setSessionName() {},
  });
  const ctx = {
    cwd,
    sessionManager: {
      getEntries: () => branch,
      getBranch: () => branch,
      getSessionId: () => id,
    },
  };
  handlers.get("session_start")({ reason: "startup" }, ctx);
  return {
    call: (params) => tools.get("legal_matter_session").execute("test", params, undefined, undefined, ctx),
    before: (prompt = "Continue the current matter.") => handlers.get("before_agent_start")({ prompt, systemPrompt: "BASE" }, ctx),
    guard: (path, toolName = "write") => handlers.get("tool_call")({ toolName, input: { path } }, ctx),
    snapshot: () => [...branch],
    switchBranch(entries) {
      branch = [...entries];
      handlers.get("session_tree")?.({}, ctx);
    },
  };
}

async function create(s, slug = "shared-matter") {
  const result = await s.call({ action: "create", slug, name: slug, confirmed: true });
  assert.match(result.content[0].text, /Session bound to/);
}

async function bind(s, slug = "shared-matter") {
  const result = await s.call({ action: "bind", slug, confirmed: true });
  assert.match(result.content[0].text, /Session bound to/);
}

test("another session closing a matter invalidates status, writes, and resumed branches", async (t) => {
  const { cwd } = workspace(t);
  const a = session(cwd, "a");
  const b = session(cwd, "b");
  await create(a);
  await bind(b);
  b.before(); // Consume the first-turn gate before the external close.
  const oldBranch = b.snapshot();
  assert.equal(b.guard("matters/shared-matter/outputs/report.md"), undefined);

  await a.call({ action: "close", slug: "shared-matter", confirmed: true });
  // Check the guard first: it must not require a status call or a new user turn.
  for (const tool of ["write", "edit"]) {
    assert.equal(b.guard("matters/shared-matter/outputs/report.md", tool)?.block, true);
  }
  assert.equal((await b.call({ action: "status" })).details.activeMatter, null);
  assert.match(b.before().systemPrompt, /no longer active|no longer valid/i);
  const resumed = session(cwd, "resumed", [
    ...oldBranch, { type: "message", message: { role: "user", content: "Earlier work" } },
  ]);
  assert.equal((await resumed.call({ action: "status" })).details.activeMatter, null);
  assert.match(resumed.before().systemPrompt, /no longer active|no longer valid/i);
  const rejected = await b.call({ action: "bind", slug: "shared-matter", confirmed: true });
  assert.equal(rejected.isError, true);

  await create(a, "next-matter");
  await bind(b, "next-matter");
  assert.equal(b.guard("matters/next-matter/outputs/report.md"), undefined);
  assert.equal(b.guard("matters/shared-matter/outputs/report.md")?.block, true);
  b.switchBranch(oldBranch);
  assert.equal(b.guard("matters/shared-matter/outputs/report.md")?.block, true);
});

test("binding follows the selected branch and refreshed matter metadata", async (t) => {
  const { cwd, indexPath } = workspace(t);
  const s = session(cwd, "branching");
  await create(s, "first-matter");
  const firstBranch = s.snapshot();
  await create(s, "second-matter");
  s.switchBranch(firstBranch);
  assert.equal((await s.call({ action: "status" })).details.activeMatter.slug, "first-matter");
  assert.equal(s.guard("matters/first-matter/outputs/report.md"), undefined);
  assert.equal(s.guard("matters/second-matter/outputs/report.md")?.block, true);
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  index.matters[0].name = "Renamed matter";
  writeFileSync(indexPath, JSON.stringify(index));
  assert.equal((await s.call({ action: "status" })).details.activeMatter.name, "Renamed matter");
});

test("missing, corrupt, or relocated index records never authorize stale writes", async (t) => {
  for (const scenario of ["removed-record", "moved-record", "missing-index", "corrupt-index", "missing-config"]) {
    await t.test(scenario, async (t) => {
      const { cwd, indexPath } = workspace(t);
      const s = session(cwd, scenario);
      await create(s);
      s.before();
      const index = JSON.parse(readFileSync(indexPath, "utf8"));
      if (scenario === "removed-record") {
        index.matters = [];
        writeFileSync(indexPath, JSON.stringify(index));
      } else if (scenario === "moved-record") {
        index.matters[0].path = "matters/moved-matter";
        writeFileSync(indexPath, JSON.stringify(index));
      } else if (scenario === "missing-index") {
        rmSync(indexPath);
      } else if (scenario === "corrupt-index") {
        writeFileSync(indexPath, "not JSON");
      } else {
        rmSync(join(cwd, ".pi/legal-workbench/config.json"));
      }
      assert.equal(s.guard("matters/shared-matter/outputs/report.md")?.block, true);
      const status = await s.call({ action: "status" });
      assert.ok(status.isError || status.details.activeMatter === null);
      assert.ok(s.before()?.systemPrompt, "The model must be told to stop or repair the invalid binding");
    });
  }
});

test("the project lock rejects contending operations without writes or stealing the lock", async (t) => {
  const { cwd, indexPath, lockPath } = workspace(t);
  const s = session(cwd, "locked");
  await create(s);
  const originalIndex = readFileSync(indexPath, "utf8");
  const lockOwner = JSON.stringify({ pid: process.pid, note: "another operation owns this lock" });
  writeFileSync(lockPath, lockOwner);
  for (const params of [
    { action: "create", slug: "other-matter", name: "Other", confirmed: true },
    { action: "bind", slug: "shared-matter", confirmed: true },
    { action: "close", slug: "shared-matter", confirmed: true },
    { action: "status" },
  ]) {
    const result = await s.call(params);
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /another legal matter operation/i);
    assert.equal(readFileSync(lockPath, "utf8"), lockOwner);
    assert.equal(readFileSync(indexPath, "utf8"), originalIndex);
  }
  assert.equal(existsSync(join(cwd, "matters/other-matter")), false);
  assert.equal(s.guard("matters/shared-matter/outputs/report.md")?.block, true);
  assert.equal(s.guard(".pi/legal-workbench/matter-index.json")?.block, true);
  rmSync(lockPath); // Test-owned lock, not a real running operation.
  assert.equal(s.guard("matters/shared-matter/outputs/report.md"), undefined);
  await create(s, "other-matter");
  assert.equal(existsSync(lockPath), false);
});

test("a released lock is never realpathed as a transient leaf", async (t) => {
  const { cwd, lockPath } = workspace(t);
  const s = session(cwd, "release-race");
  await create(s);
  const originalRealpath = fs.realpathSync;
  let releases = 0;
  t.after(() => { t.mock.restoreAll(); syncBuiltinESMExports(); });
  t.mock.method(fs, "realpathSync", (path, ...args) => {
    // Deterministically release our test-owned lock at path-validation time.
    // The old leaf resolver then throws ENOENT; directory-only resolution works.
    if (/[/\\]\.pi[/\\]legal-workbench(?:[/\\]matter-operation\.lock)?$/.test(String(path)) && existsSync(lockPath)) {
      rmSync(lockPath);
      releases++;
    }
    return originalRealpath(path, ...args);
  });
  syncBuiltinESMExports();
  writeFileSync(lockPath, "test-owned lock about to be released");
  const result = await s.call({ action: "status" });
  assert.notEqual(result.isError, true, result.content[0].text);
  assert.equal(result.details.activeMatter.slug, "shared-matter");
  assert.equal(releases, 1);
  writeFileSync(lockPath, "test-owned lock about to be released");
  assert.equal(s.guard("matters/shared-matter/outputs/report.md"), undefined);
  assert.equal(releases, 2);
});

test("existing lock symlinks, including dangling ones, are neither followed nor ignored", async (t) => {
  const { cwd, lockPath } = workspace(t);
  const s = session(cwd, "symlink-lock");
  await create(s);
  const target = join(cwd, "test-lock-target.txt");
  writeFileSync(target, "preserve target");
  symlinkSync(target, lockPath);
  assert.equal((await s.call({ action: "status" })).isError, true);
  assert.equal(s.guard("matters/shared-matter/outputs/report.md")?.block, true);
  assert.equal(readFileSync(target, "utf8"), "preserve target");
  rmSync(target); // Keep the test-owned lock as a dangling symlink.
  assert.equal((await s.call({ action: "status" })).isError, true);
  assert.equal(s.guard("matters/shared-matter/outputs/report.md")?.block, true);
  rmSync(lockPath);
  assert.notEqual((await s.call({ action: "status" })).isError, true);
});

test("independent Pi processes preserve all index records and session associations", async (t) => {
  const { cwd, indexPath, lockPath } = workspace(t);
  await create(session(cwd, "initial"));
  const extensionUrl = new URL("../packages/pi-legal-suite/extensions/legal-workbench.ts", import.meta.url).href;
  const children = [];
  const ready = [];
  const finished = [];
  for (let worker = 0; worker < 3; worker++) {
    const code = `
      import legalWorkbench from ${JSON.stringify(extensionUrl)};
      let matterTool;
      const entries = [];
      const id = 'worker-${worker}';
      legalWorkbench({
        on() {},
        registerTool(tool) { if (tool.name === 'legal_matter_session') matterTool = tool; },
        appendEntry(customType, data) { entries.push({ type: 'custom', customType, data }); },
        setSessionName() {},
      });
      const ctx = { cwd: ${JSON.stringify(cwd)}, sessionManager: {
        getEntries: () => entries, getBranch: () => entries, getSessionId: () => id,
      }};
      const started = new Promise(resolve => process.once('message', resolve));
      process.send('ready');
      await started;
      async function call(params) {
        for (let attempt = 0; attempt < 250; attempt++) {
          const result = await matterTool.execute('test', params, undefined, undefined, ctx);
          if (!result.isError) return;
          if (!/Another legal matter operation holds/.test(result.content[0].text)) {
            throw new Error(result.content[0].text);
          }
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        throw new Error('Timed out waiting for the matter operation lock');
      }
      for (let n = 0; n < 3; n++) {
        const slug = id + '-' + n;
        await call({ action: 'create', slug, name: slug, confirmed: true });
      }
      await call({ action: 'bind', slug: 'shared-matter', confirmed: true });
      process.disconnect();
    `;
    const child = spawn(process.execPath, ["--input-type=module", "--eval", code], {
      stdio: ["ignore", "ignore", "pipe", "ipc"],
    });
    children.push(child);
    t.after(() => { if (child.exitCode === null) child.kill(); });
    let stderr = "";
    child.stderr.on("data", (data) => { stderr += data; });
    ready.push(new Promise((resolve, reject) => {
      child.once("message", resolve);
      child.once("error", reject);
      child.once("exit", (code) => reject(new Error(`Worker exited before ready: ${code}: ${stderr}`)));
    }));
    finished.push(new Promise((resolve, reject) => {
      child.once("error", reject);
      child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`Worker failed: ${code}: ${stderr}`)));
    }));
  }
  // Attach completion handlers immediately so early worker failures are handled.
  const done = Promise.all(finished);
  const start = Promise.all(ready).then(() => children.forEach((child) => child.send("start")));
  await Promise.all([start, done]);
  const index = JSON.parse(readFileSync(indexPath, "utf8"));
  assert.equal(index.matters.length, 10);
  assert.equal(new Set(index.matters.map((matter) => matter.slug)).size, 10);
  const shared = readFileSync(join(cwd, "matters/shared-matter/matter.md"), "utf8");
  for (let worker = 0; worker < 3; worker++) {
    assert.equal(shared.split(`| worker-${worker} |`).length - 1, 1);
  }
  assert.equal(existsSync(lockPath), false);
});

test("operation locks are released after validation errors and thrown I/O errors", async (t) => {
  const { cwd, lockPath } = workspace(t);
  const s = session(cwd, "errors");
  await create(s);
  const missing = await s.call({ action: "bind", slug: "unknown-matter", confirmed: true });
  assert.equal(missing.isError, true);
  assert.equal(existsSync(lockPath), false);
  const matterPath = join(cwd, "matters/shared-matter/matter.md");
  const original = readFileSync(matterPath, "utf8");
  writeFileSync(matterPath, "# Broken matter template\n");
  const broken = await s.call({ action: "close", slug: "shared-matter", confirmed: true });
  assert.equal(broken.isError, true);
  assert.equal(existsSync(lockPath), false);
  writeFileSync(matterPath, original);
  assert.match((await s.call({ action: "close", slug: "shared-matter", confirmed: true })).content[0].text, /Matter closed/);
  assert.equal(existsSync(lockPath), false);
});
