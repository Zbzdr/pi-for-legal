import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import legalWorkbench from "../packages/pi-legal-suite/extensions/legal-workbench.ts";

const git = (root, ...args) => execFileSync("git", ["-C", root, ...args], { encoding: "utf8" }).trim();

function fixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), "pi-legal-document-git-"));
  const config = join(cwd, "test.gitconfig");
  writeFileSync(config, "[user]\n name = Document Test\n email = document@example.invalid\n[commit]\n gpgsign = false\n");
  const original = process.env.GIT_CONFIG_GLOBAL;
  process.env.GIT_CONFIG_GLOBAL = config;
  t.after(() => { if (original === undefined) delete process.env.GIT_CONFIG_GLOBAL; else process.env.GIT_CONFIG_GLOBAL = original; rmSync(cwd, { recursive: true, force: true }); });
  execFileSync(process.execPath, ["packages/pi-legal-suite/skills/legal-setup/scripts/init_workspace.mjs", "--workspace", cwd, "--data-dir", ".", "--phase", "complete", "--document-git", "manual"]);
  let sequence = 0;
  function session(entries = []) {
    let branch = [...entries];
    const handlers = new Map(); const tools = new Map();
    legalWorkbench({ on: (name, fn) => handlers.set(name, fn), registerTool: (tool) => tools.set(tool.name, tool), appendEntry: (customType, data) => branch.push({ type: "custom", customType, data }), setSessionName() {} });
    const ctx = { cwd, executeTool() {}, sessionManager: { getEntries: () => branch, getBranch: () => branch, getSessionId: () => "document-test" } };
    handlers.get("session_start")({}, ctx);
    const s = {
      ctx, handlers, tools,
      entries: () => [...branch],
      switch: (entries) => { branch = [...entries]; handlers.get("session_tree")({}, ctx); },
      matter: (params) => tools.get("legal_matter_session").execute("matter", params, undefined, undefined, ctx),
      control: (params) => tools.get("legal_document_revision").execute("control", params, undefined, undefined, ctx),
      prompt: (prompt) => handlers.get("before_agent_start")({ prompt, systemPrompt: "BASE" }, ctx),
      before: (event) => handlers.get("tool_call")(event, ctx),
      after: (event) => handlers.get("tool_result")({ content: [{ type: "text", text: "Original tool result" }], details: { kept: true }, isError: false, ...event }, ctx),
      async mutate(toolName, input, run, failed = false) {
        const event = { toolName, input, toolCallId: `tool-${++sequence}` };
        const guard = s.before(event);
        if (guard?.block) return guard;
        run();
        return s.after({ ...event, isError: failed });
      },
      async begin(branch = "first", mode = "alternative", base) {
        const r = await s.control({ action: "begin", branch, mode, base, confirmed: true });
        assert.equal(r.isError, undefined, r.content[0].text);
        return r.details;
      },
    };
    return s;
  }
  const first = session();
  return { cwd, session, first, async ready() {
    await first.matter({ action: "create", slug: "document-matter", name: "Document Matter", confirmed: true });
    const matter = join(cwd, "matters/document-matter");
    writeFileSync(join(matter, "notes.md"), "# Liability\n\nThe liability cap is one year of fees.\n");
    writeFileSync(join(matter, "outputs/source.docx"), "original binary placeholder");
    const enabled = await first.control({ action: "enable", confirmed: true });
    assert.equal(enabled.isError, undefined, enabled.content[0].text);
    return { matter, baseline: enabled.details.baseline, ...await first.begin() };
  } };
}

test("enrollment is confirmed, Markdown-only, and independent from a parent repository", async (t) => {
  const f = fixture(t);
  git(f.cwd, "init", "-b", "main");
  writeFileSync(join(f.cwd, "parent.md"), "Human work\n");
  git(f.cwd, "add", "parent.md");
  const staged = git(f.cwd, "diff", "--cached");
  await f.first.matter({ action: "create", slug: "separate", name: "Separate", confirmed: true });
  assert.equal((await f.first.control({ action: "enable" })).isError, true);
  assert.equal(existsSync(join(f.cwd, "matters/separate/.git")), false);
  const enabled = await f.first.control({ action: "enable", confirmed: true });
  assert.equal(enabled.isError, undefined);
  const tracked = git(join(f.cwd, "matters/separate"), "ls-files");
  assert.equal(tracked, ".gitignore\nnotes.md");
  assert.equal(git(f.cwd, "diff", "--cached"), staged);
});

test("native mutations checkpoint actual diffs and user context, with no-op and binary edits excluded", async (t) => {
  const f = fixture(t); const original = await f.ready();
  let summaryInput;
  f.first.ctx.model = { id: "fixture" };
  f.first.ctx.modelRegistry = { streamSimple(_model, context) { summaryInput = JSON.parse(context.messages[0].content); return { result: async () => ({ content: [{ type: "text", text: "docs: 将责任上限改为两年费用" }], stopReason: "stop", usage: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0, totalTokens: 3, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } }) }; } };
  assert.match(f.first.prompt("将责任上限改为两年费用，不要生成 DOCX。").systemPrompt, /Selected worktree/);
  const r = { ...original, ...await f.first.begin("context-selected") };
  const path = join(r.worktree, "notes.md");
  const changed = await f.first.mutate("edit", { path }, () => writeFileSync(path, "# Liability\n\nThe liability cap is two years of fees.\n"));
  assert.match(changed.content.at(-1).text, /Markdown Git checkpoint/);
  assert.equal(changed.details.original.kept, true);
  assert.match(summaryInput.userRequest, /不要生成 DOCX/);
  assert.match(summaryInput.diff, /two years/);
  assert.equal(summaryInput.base, r.baseline);
  assert.match(git(r.worktree, "log", "-1", "--format=%s"), /两年/);
  assert.equal(changed.usage.totalTokens, 3);
  const head = git(r.worktree, "rev-parse", "HEAD");
  assert.equal(await f.first.mutate("write", { path }, () => writeFileSync(path, readFileSync(path))), undefined);
  assert.equal(await f.first.mutate("bash", { command: "create requested delivery" }, () => writeFileSync(join(r.worktree, "delivery.docx"), "delivery")), undefined);
  assert.equal(git(r.worktree, "rev-parse", "HEAD"), head);
  assert.match(readFileSync(join(r.matter, "notes.md"), "utf8"), /one year/);
  assert.equal(git(r.worktree, "status", "--porcelain"), "");
});

test("rejected attempts branch from A, refinement branches from A prime, and acceptance advances the anchor", async (t) => {
  const f = fixture(t); const r = await f.ready();
  await f.first.mutate("write", { path: join(r.worktree, "notes.md") }, () => writeFileSync(join(r.worktree, "notes.md"), "Proposal A prime\n"));
  const firstHead = git(r.worktree, "rev-parse", "HEAD");
  const oldEntries = f.first.entries();
  const second = await f.first.begin("second", "alternative", r.baseline);
  assert.equal(second.base, r.baseline);
  assert.match(readFileSync(join(second.worktree, "notes.md"), "utf8"), /one year/);
  assert.equal(git(r.matter, "rev-parse", "revision/first"), firstHead);
  f.first.switch(oldEntries);
  const refined = await f.first.begin("refined", "refine");
  assert.equal(refined.base, firstHead);
  assert.equal(refined.anchor, r.baseline);
  await f.first.mutate("write", { path: join(refined.worktree, "notes.md") }, () => writeFileSync(join(refined.worktree, "notes.md"), "Refined proposal\n"));
  const another = await f.first.begin("another", "alternative", r.baseline);
  assert.equal(another.base, r.baseline, "a rejected refinement is not a new original baseline");
  const adopted = await f.first.control({ action: "accept", confirmed: true });
  const next = await f.first.begin("after-accept");
  assert.equal(next.base, adopted.details.accepted);
});

test("shell creation, rename, deletion and failed partial writes produce recoverable exact checkpoints", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const path = join(r.worktree, "条款 方案.MD");
  const saved = await f.first.mutate("bash", { command: "scripted changes" }, () => writeFileSync(path, "Alternative wording\n"), true);
  assert.match(saved.content.at(-1).text, /Mechanical fallback/);
  assert.match(git(r.worktree, "log", "-1", "--format=%B"), /failed; partial changes/);
  await f.first.mutate("bash", {}, () => renameSync(path, join(r.worktree, "renamed.md")));
  assert.equal(existsSync(join(r.worktree, "renamed.md")), true);
  await f.first.mutate("bash", {}, () => rmSync(join(r.worktree, "renamed.md")));
  assert.equal(git(r.worktree, "status", "--porcelain"), "");
  assert.equal(git(r.worktree, "rev-list", "--count", `${r.baseline}..HEAD`), "3");
});

test("nested codemode writes checkpoint separately and parallel mutation attempts are refused", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const outer = { toolName: "codemode", toolCallId: "root/opaque-provider-id", input: {} };
  assert.equal(f.first.before(outer), undefined);
  const a = { toolName: "custom_document_service", toolCallId: "root/opaque-provider-id/1", parentToolCallId: "root/opaque-provider-id", input: { path: join(r.worktree, "a.md") } };
  assert.equal(f.first.before(a), undefined);
  assert.equal(f.first.before({ ...a, toolCallId: "root/opaque-provider-id/2" })?.block, true);
  writeFileSync(a.input.path, "A\n");
  await f.first.after(a);
  const b = { ...a, toolCallId: "root/opaque-provider-id/3", input: { path: join(r.worktree, "b.md") } };
  assert.equal(f.first.before(b), undefined);
  writeFileSync(b.input.path, "B\n");
  await f.first.after(b); await f.first.after(outer);
  assert.equal(git(r.worktree, "rev-list", "--count", `${r.baseline}..HEAD`), "2");
  assert.equal(existsSync(join(r.matter, ".git/pi-legal-documents.lock")), false);
});

test("pre-existing dirty and staged edits are never adopted automatically", async (t) => {
  const f = fixture(t); const r = await f.ready();
  writeFileSync(join(r.worktree, "notes.md"), "Human changes\n");
  git(r.worktree, "add", "notes.md");
  const staged = git(r.worktree, "diff", "--cached");
  assert.equal(f.first.before({ toolName: "bash", toolCallId: "manual", input: {} })?.block, true);
  assert.equal(git(r.worktree, "diff", "--cached"), staged);
  const recovered = await f.first.control({ action: "recover", confirmed: true });
  assert.equal(recovered.isError, undefined);
  assert.match(git(r.worktree, "show", "HEAD:notes.md"), /Human changes/);
});

test("commit hooks are respected, failures block editing, and confirmed recovery preserves files", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const hook = join(r.matter, ".git/hooks/pre-commit");
  writeFileSync(hook, "#!/bin/sh\nexit 1\n"); chmodSync(hook, 0o755);
  const path = join(r.worktree, "notes.md");
  const failed = await f.first.mutate("write", { path }, () => writeFileSync(path, "Pending reviewed wording\n"));
  assert.equal(failed.isError, true);
  assert.match(failed.content.at(-1).text, /checkpoint FAILED/);
  assert.match(readFileSync(path, "utf8"), /Pending/);
  const entries = f.first.entries(); const resumed = f.session(entries);
  assert.equal(resumed.before({ toolName: "write", toolCallId: "blocked", input: { path } })?.block, true);
  writeFileSync(hook, "#!/bin/sh\nexit 0\n");
  assert.equal((await resumed.control({ action: "recover", confirmed: true })).isError, undefined);
  assert.equal(git(r.worktree, "status", "--porcelain"), "");
});

test("scope escapes, symlinks, stale bindings, and another session's operation lock are refused", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const b = f.session(f.first.entries());
  assert.equal(f.first.before({ toolName: "write", toolCallId: "outside", input: { path: join(r.matter, "outputs/outside.md") } })?.block, true);
  symlinkSync(f.cwd, join(r.worktree, "escape"));
  assert.equal(f.first.before({ toolName: "write", toolCallId: "symlink", input: { path: join(r.worktree, "escape/stolen.md") } })?.block, true);
  rmSync(join(r.worktree, "escape"));
  const event = { toolName: "bash", toolCallId: "held", input: {} };
  assert.equal(f.first.before(event), undefined);
  assert.equal(b.before({ ...event, toolCallId: "other" })?.block, true);
  await f.first.after(event);
  await b.matter({ action: "close", slug: "document-matter", confirmed: true });
  assert.equal(f.first.before({ ...event, toolCallId: "stale" })?.block, true);
});

test("shell changes outside a selected worktree are surfaced, not silently adopted", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const failed = await f.first.mutate("bash", {}, () => writeFileSync(join(r.matter, "notes.md"), "Outside change\n"));
  assert.equal(failed.isError, true);
  assert.match(failed.content.at(-1).text, /outside the selected worktree/);
  assert.equal(git(r.worktree, "rev-parse", "HEAD"), r.baseline);
});

test("new editing and DOCX instructions keep Markdown authoritative and Word delivery explicit", () => {
  const skill = readFileSync("packages/pi-legal-suite/skills/legal-document-edit/SKILL.md", "utf8");
  assert.match(skill, /drafting reference is not the Git parent/);
  assert.match(skill, /expressly requests a Word deliverable/);
  assert.match(skill, /character before word/);
  assert.doesNotMatch(readFileSync("packages/pi-legal-suite/skills/legal-setup/references/append-system-template.md", "utf8"), /legal_time/);
});

test("ordinary edits continue the current draft across turns without a new baseline or worktree", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const branches = git(r.matter, "branch", "--list");
  f.first.prompt("Change one year to twelve months, nothing else.");
  await f.first.mutate("write", { path: join(r.worktree, "notes.md") }, () => writeFileSync(join(r.worktree, "notes.md"), "The liability cap is twelve months of fees.\n"));
  f.first.prompt("Change twelve months to twenty-four months.");
  const saved = await f.first.mutate("write", { path: join(r.worktree, "notes.md") }, () => writeFileSync(join(r.worktree, "notes.md"), "The liability cap is twenty-four months of fees.\n"));
  assert.match(saved.content.at(-1).text, /Markdown Git checkpoint/);
  assert.equal(git(r.matter, "branch", "--list"), branches);
  assert.equal(git(r.worktree, "rev-list", "--count", `${r.baseline}..HEAD`), "2");
});

test("real Pi codemode nested edit/write events create two commits without a commit tool", async (t) => {
  const f = fixture(t);
  const configPath = join(f.cwd, ".pi/legal-workbench/config.json");
  const config = JSON.parse(readFileSync(configPath, "utf8"));
  config.documentGit = { mode: "auto", authorName: "Setup Author", authorEmail: "setup@example.invalid" };
  writeFileSync(configPath, JSON.stringify(config));
  const { createAgentSession, createCodemodeExtension, DefaultResourceLoader, SessionManager } = await import("@earendil-works/pi-coding-agent");
  const agentDir = join(f.cwd, "isolated-agent");
  const loader = new DefaultResourceLoader({ cwd: f.cwd, agentDir, noExtensions: true, noSkills: true, noContextFiles: true, extensionFactories: [legalWorkbench, createCodemodeExtension({ mode: "on" })] });
  await loader.reload();
  const manager = SessionManager.inMemory();
  manager.appendMessage({ role: "assistant", content: [{ type: "toolCall", id: "sdk-test", name: "legal_matter_session", arguments: {} }, { type: "toolCall", id: "script", name: "codemode", arguments: {} }], api: "openai-completions", provider: "fixture", model: "fixture", stopReason: "toolUse", timestamp: Date.now(), usage: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } });
  const { session } = await createAgentSession({ cwd: f.cwd, agentDir, resourceLoader: loader, sessionManager: manager, model: { provider: "fixture", id: "fixture", name: "Fixture", api: "openai-completions", contextWindow: 32000, maxTokens: 1000, input: ["text"], reasoning: false, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 } } });
  t.after(() => session.dispose());
  await session.bindExtensions({});
  const runner = session.extensionRunner;
  runner.getModelRegistry().streamSimple = () => ({ result: async () => ({ content: [{ type: "text", text: "docs: checkpoint exact fixture wording" }], stopReason: "stop", usage: { input: 1, output: 1, cacheRead: 0, cacheWrite: 0, totalTokens: 2, cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 } } }) });
  const ctx = runner.createToolContext("sdk-test", undefined);
  const call = async (name, args) => {
    if (name === "legal_document_revision") {
      const tool = runner.getToolDefinition(name);
      assert.equal(tool.exposure, "model-only");
      const result = await tool.execute("direct-control", args, undefined, undefined, runner.createToolContext("direct-control", undefined));
      assert.equal(result.isError, undefined, JSON.stringify(result));
      return result;
    }
    const outcome = await ctx.executeTool(name, args);
    assert.equal(outcome.isError, false, JSON.stringify(outcome));
    return outcome.result ?? outcome;
  };
  await call("legal_matter_session", { action: "create", slug: "runtime", name: "Runtime", confirmed: true });
  assert.equal(runner.getToolDefinition("legal_document_revision").exposure, "model-only");
  const r = { worktree: join(f.cwd, "matters/runtime") };
  const path = join(r.worktree, "runtime.md");
  const code = `await tools.write({ path: ${JSON.stringify(path)}, content: "Original wording\\n" }); await tools.edit({ path: ${JSON.stringify(path)}, edits: [{ oldText: "Original", newText: "Revised" }] }); text("done");`;
  const event = { type: "tool_call", toolName: "codemode", toolCallId: "script", input: { code } };
  const guard = await runner.emitToolCall(event);
  assert.equal(guard?.block, undefined, JSON.stringify(guard));
  const executed = await runner.getToolDefinition("codemode").execute("script", { code }, undefined, undefined, runner.createToolContext("script", undefined));
  await runner.emitToolResult({ ...event, type: "tool_result", ...executed, isError: Boolean(executed.isError) });
  assert.equal(executed.isError, undefined, JSON.stringify(executed));
  assert.match(readFileSync(path, "utf8"), /Revised wording/);
  assert.equal(git(r.worktree, "rev-list", "--count", `${JSON.parse(readFileSync(join(r.worktree, ".git/pi-legal-documents.json"), "utf8")).baseline}..HEAD`), "2");
  assert.equal(git(r.worktree, "status", "--porcelain"), "");
});

test("failed initial enrollment can be resumed without taking over an unrelated repository", async (t) => {
  const f = fixture(t);
  await f.first.matter({ action: "create", slug: "pending", name: "Pending", confirmed: true });
  const hooks = join(f.cwd, "test-hooks"); mkdirSync(hooks);
  const hook = join(hooks, "pre-commit"); writeFileSync(hook, "#!/bin/sh\nexit 1\n"); chmodSync(hook, 0o755);
  const config = join(f.cwd, "test.gitconfig");
  writeFileSync(config, `${readFileSync(config, "utf8")}\n[core]\n hooksPath = ${hooks}\n`);
  assert.equal((await f.first.control({ action: "enable", confirmed: true })).isError, true);
  const status = JSON.parse((await f.first.control({ action: "status" })).content[0].text);
  assert.equal(status.enabled, false); assert.equal(status.enrollmentPending, true);
  writeFileSync(hook, "#!/bin/sh\nexit 0\n");
  assert.equal((await f.first.control({ action: "enable", confirmed: true })).isError, undefined);
  assert.equal(JSON.parse((await f.first.control({ action: "status" })).content[0].text).enabled, true);
  await f.first.matter({ action: "create", slug: "unrelated", name: "Unrelated", confirmed: true });
  const unrelated = join(f.cwd, "matters/unrelated");
  git(unrelated, "init", "-b", "main");
  // Existing unmarked repositories are never silently enrolled, even on a confirmed retry.
  writeFileSync(join(unrelated, "notes.md"), "Human repository\n");
  const refused = await f.first.control({ action: "enable", confirmed: true });
  assert.equal(refused.isError, true);
  assert.match(refused.content[0].text, /not enrolled/);
  assert.equal(existsSync(join(unrelated, ".git/pi-legal-documents.json")), false);
});

test("index locks and external Git commits are surfaced without losing edits or rewriting history", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const indexLock = join(r.matter, ".git/worktrees/first/index.lock");
  const failed = await f.first.mutate("write", { path: join(r.worktree, "notes.md") }, () => {
    writeFileSync(join(r.worktree, "notes.md"), "Pending index-lock revision\n"); writeFileSync(indexLock, "locked");
  });
  assert.equal(failed.isError, true);
  assert.match(readFileSync(join(r.worktree, "notes.md"), "utf8"), /Pending/);
  rmSync(indexLock);
  assert.equal((await f.first.control({ action: "recover", confirmed: true })).isError, undefined);
  const saved = git(r.worktree, "rev-parse", "HEAD");
  const external = await f.first.mutate("bash", {}, () => {
    writeFileSync(join(r.worktree, "notes.md"), "External commit\n"); git(r.worktree, "add", "notes.md"); git(r.worktree, "commit", "-m", "manual commit");
  });
  assert.equal(external.isError, true);
  assert.match(external.content.at(-1).text, /HEAD changed/);
  assert.notEqual(git(r.worktree, "rev-parse", "HEAD"), saved);
});

test("enrollment requires modern nested-tool support and a real Git author identity", async (t) => {
  const f = fixture(t);
  await f.first.matter({ action: "create", slug: "requirements", name: "Requirements", confirmed: true });
  const matter = join(f.cwd, "matters/requirements");
  delete f.first.ctx.executeTool;
  assert.match((await f.first.control({ action: "enable", confirmed: true })).content[0].text, /Pi 1.1/);
  assert.equal(existsSync(join(matter, ".git")), false);
  f.first.ctx.executeTool = () => {};
  writeFileSync(join(f.cwd, "test.gitconfig"), "[user]\n name =\n email =\n");
  assert.equal((await f.first.control({ action: "enable", confirmed: true })).isError, true);
  assert.equal(existsSync(join(matter, ".git")), false);
});

test("adopting an alternative never silently rolls back another adopted document", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const b = f.session(f.first.entries()); const other = await b.begin("other-document");
  await b.mutate("write", { path: join(other.worktree, "other.md") }, () => writeFileSync(join(other.worktree, "other.md"), "Adopted second document\n"));
  const adopted = await b.control({ action: "accept", confirmed: true });
  assert.equal(adopted.isError, undefined);
  await f.first.mutate("write", { path: join(r.worktree, "notes.md") }, () => writeFileSync(join(r.worktree, "notes.md"), "Selected first document\n"));
  const refused = await f.first.control({ action: "accept", confirmed: true });
  assert.equal(refused.isError, true); assert.match(refused.content[0].text, /other adopted documents/);
  assert.equal(git(r.matter, "rev-parse", "refs/pi-legal/accepted"), adopted.details.accepted);
  const integrated = await f.first.begin("reconciled", "alternative", adopted.details.accepted);
  await f.first.mutate("write", { path: join(integrated.worktree, "notes.md") }, () => writeFileSync(join(integrated.worktree, "notes.md"), "Selected first document\n"));
  assert.equal((await f.first.control({ action: "accept", confirmed: true })).isError, undefined);
  assert.match(readFileSync(join(integrated.worktree, "other.md"), "utf8"), /Adopted second document/);
});

test("draft preparation does not block authorized profile, lifecycle or structured-record maintenance", async (t) => {
  const f = fixture(t); const r = await f.ready();
  f.first.prompt("Update the practice profile and a structured tracker, not the draft.");
  for (const path of [join(f.cwd, "AGENTS.md"), join(r.matter, "matter.md"), join(r.matter, "outputs/tracker.yaml")]) {
    assert.equal(f.first.before({ toolName: "write", toolCallId: "maintenance", input: { path } }), undefined, path);
  }
  assert.equal(f.first.before({ toolName: "write", toolCallId: "git-config", input: { path: join(r.matter, ".git/config") } })?.block, true);
  assert.equal(f.first.before({ toolName: "write", toolCallId: "git-file", input: { path: join(r.worktree, ".git") } })?.block, true);
  assert.equal(f.first.before({ toolName: "bash", toolCallId: "date", input: { command: "date +%Y-%m-%d" } }), undefined);
  const dateWrite = { toolName: "bash", toolCallId: "not-readonly", input: { command: "date +%Y-%m-%d > notes.md" } };
  assert.equal(f.first.before(dateWrite), undefined);
  await f.first.after(dateWrite);
  const readContainer = { toolName: "codemode", toolCallId: "inspect", input: {} };
  assert.equal(f.first.before(readContainer), undefined);
  assert.equal(f.first.before({ toolName: "read", toolCallId: "inspect/1", parentToolCallId: "inspect", input: { path: join(r.worktree, "notes.md") } }), undefined);
  const nested = { toolName: "write", toolCallId: "inspect/2", parentToolCallId: "inspect", input: { path: join(r.worktree, "notes.md") } };
  assert.equal(f.first.before(nested), undefined);
  await f.first.after(nested);
  await f.first.after(readContainer);
});

test("setup auto policy initializes the matter and commits small corrections without enrollment or proposal tools", async (t) => {
  const f = fixture(t);
  execFileSync(process.execPath, ["packages/pi-legal-suite/skills/legal-setup/scripts/init_workspace.mjs", "--workspace", f.cwd, "--data-dir", ".", "--phase", "complete", "--document-git", "auto", "--git-author-name", "Setup Author", "--git-author-email", "setup@example.invalid"]);
  writeFileSync(join(f.cwd, "test.gitconfig"), "[user]\n name =\n email =\n[commit]\n gpgsign = false\n");
  await f.first.matter({ action: "create", slug: "automatic", name: "Automatic", confirmed: true });
  const matter = join(f.cwd, "matters/automatic"), path = join(matter, "outputs/contract.md");
  writeFileSync(path, "The liability cap is three months of fees.\n");
  f.first.prompt("Change three months to twelve months, nothing else.");
  const enrollmentLock = join(matter, ".pi-legal-document-enrollment.lock");
  writeFileSync(enrollmentLock, JSON.stringify({ pid: process.pid }));
  assert.equal(f.first.before({ toolName: "write", toolCallId: "enrollment-contention", input: { path } })?.block, true);
  assert.equal(existsSync(join(matter, ".git")), false);
  assert.match(readFileSync(path, "utf8"), /three months/);
  rmSync(enrollmentLock);
  const first = await f.first.mutate("write", { path }, () => writeFileSync(path, "The liability cap is twelve months of fees.\n"));
  assert.match(first.content.at(-1).text, /Markdown Git checkpoint/);
  assert.equal(git(matter, "config", "user.name"), "Setup Author");
  assert.equal(git(matter, "config", "user.email"), "setup@example.invalid");
  const baseline = JSON.parse(readFileSync(join(matter, ".git/pi-legal-documents.json"), "utf8")).baseline;
  assert.match(git(matter, "show", `${baseline}:outputs/contract.md`), /three months/);
  f.first.prompt("Actually change twelve months to twenty-four.");
  const second = await f.first.mutate("write", { path }, () => writeFileSync(path, "The liability cap is twenty-four months of fees.\n"));
  assert.equal(second.details.documentGit.parent, first.details.documentGit.commit);
  assert.equal(git(matter, "branch", "--list"), "* main");
  assert.equal(existsSync(join(matter, "outputs/revisions")), false);
  assert.equal(git(matter, "status", "--porcelain"), "");
});

test("a to b logic uses the chapter's Git original while preserving other chapters and an incremental parent", async (t) => {
  const f = fixture(t);
  await f.first.matter({ action: "create", slug: "logic", name: "Logic", confirmed: true });
  const matter = join(f.cwd, "matters/logic"), path = join(matter, "outputs/agreement.md");
  const original = "# Agreement\n\n## Liability\nOriginal liability source.\n\n## Payment\nPayment within 30 days.\n";
  writeFileSync(path, original);
  await f.first.control({ action: "enable", confirmed: true });
  await f.first.mutate("write", { path }, () => writeFileSync(path, original.replace("30 days", "45 days")));
  const sourceCommit = git(matter, "rev-parse", "HEAD");
  f.first.prompt("Draft the Liability chapter using logic a.");
  const origin = await f.first.control({ action: "draft", file: "outputs/agreement.md", section: "## Liability" });
  assert.equal(origin.isError, undefined);
  assert.equal(origin.details.origin.commit, sourceCommit);
  assert.equal(origin.details.exact, true);
  await f.first.mutate("write", { path }, () => writeFileSync(path, readFileSync(path, "utf8").replace("Original liability source.", "Drafted argument under logic a.")));
  const a = git(matter, "rev-parse", "HEAD");
  f.first.prompt("On the existing a version, just add an exception.");
  await f.first.mutate("write", { path }, () => writeFileSync(path, readFileSync(path, "utf8").replace("logic a.", "logic a, with an explicit exception.")));
  assert.match(readFileSync(path, "utf8"), /logic a, with an explicit exception/);
  f.first.prompt("For Payment change 45 days to 60 days.");
  await f.first.mutate("write", { path }, () => writeFileSync(path, readFileSync(path, "utf8").replace("45 days", "60 days")));
  const parent = git(matter, "rev-parse", "HEAD");
  f.first.prompt("Now implement Liability under logic b, not by modifying logic a.");
  const history = await f.first.control({ action: "history", file: "outputs/agreement.md", section: "Liability" });
  assert.equal(history.details.origin.commit, sourceCommit);
  assert.match(history.content[0].text, /Original liability source/);
  assert.doesNotMatch(history.content[0].text, /Drafted argument under logic a/);
  const repeated = await f.first.control({ action: "draft", file: "outputs/agreement.md", section: "Liability" });
  assert.equal(repeated.details.origin.commit, sourceCommit, "logic b must not silently redefine the original as logic a");
  const current = readFileSync(path, "utf8");
  const bText = current.replace("Drafted argument under logic a, with an explicit exception.", "Independent drafting under logic b, derived from original liability source.");
  const saved = await f.first.mutate("write", { path }, () => writeFileSync(path, bText));
  assert.equal(saved.details.documentGit.parent, parent);
  const comparison = await f.first.control({ action: "diff", file: "outputs/agreement.md", base: history.details.origin.commit });
  assert.equal(comparison.isError, undefined);
  assert.equal(comparison.details.base, sourceCommit);
  assert.match(comparison.content[0].text, /Independent drafting under logic b/);
  assert.match(git(matter, "show", `${a}:outputs/agreement.md`), /logic a/);
  assert.match(readFileSync(path, "utf8"), /Payment within 60 days/);
  assert.doesNotMatch(readFileSync(path, "utf8"), /logic a/);
  assert.equal(git(matter, "branch", "--list"), "* main");
  assert.equal(existsSync(join(matter, "outputs/revisions")), false);
});

test("original lookup discloses new files and ambiguous chapter fallbacks, without restoring working files", async (t) => {
  const f = fixture(t); const r = await f.ready();
  const before = git(r.worktree, "rev-parse", "HEAD");
  const recorded = await f.first.control({ action: "draft", file: "outputs/new.md", section: "New chapter" });
  assert.equal(recorded.details.present, false);
  assert.match(recorded.content[0].text, /No file at this pre-drafting commit/);
  await f.first.mutate("write", { path: join(r.worktree, "notes.md") }, () => writeFileSync(join(r.worktree, "notes.md"), "Current draft\n"));
  const checkpoint = git(r.worktree, "rev-parse", "HEAD");
  const fallback = await f.first.control({ action: "history", file: "notes.md", section: "Unknown heading" });
  assert.equal(fallback.details.exact, false);
  assert.match(fallback.content[0].text, /No exact chapter origin/);
  assert.equal(git(r.worktree, "rev-parse", "HEAD"), checkpoint);
  assert.equal(fallback.details.origin.commit, before);
  assert.equal(readFileSync(join(r.worktree, "notes.md"), "utf8"), "Current draft\n");
  const reset = await f.first.control({ action: "draft", file: "notes.md", section: "Unknown heading", base: checkpoint });
  assert.equal(reset.details.origin.commit, checkpoint);
});
