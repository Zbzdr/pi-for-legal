import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RpcClient } from "@earendil-works/pi-coding-agent";

// Opt-in paid-model acceptance, separate from npm test. Public seams: ordinary
// user conversations via RPC and observable Markdown/Git outputs. No fake model.
const root = dirname(dirname(fileURLToPath(import.meta.url)));
const options = { provider: "deepseek", model: "deepseek-flash", maxTurns: Infinity, timeout: 240_000 };
for (let i = 2; i < process.argv.length; i++) {
  const key = process.argv[i]; const value = process.argv[++i];
  if (key === "--provider") options.provider = value;
  else if (key === "--model") options.model = value;
  else if (key === "--max-turns") options.maxTurns = Number(value);
  else if (key === "--timeout") options.timeout = Number(value);
  else throw new Error(`Unknown option: ${key}`);
  if (!value) throw new Error(`Missing value for ${key}`);
}
if (options.maxTurns !== Infinity && (!Number.isSafeInteger(options.maxTurns) || options.maxTurns < 1)) throw new Error("--max-turns must be a positive integer");
if (!Number.isSafeInteger(options.timeout) || options.timeout < 1) throw new Error("--timeout must be positive milliseconds");
const runRoot = realpathSync(mkdtempSync(join(tmpdir(), "pi-legal-live-acceptance-")));
const cwd = join(runRoot, "workspace"); mkdirSync(cwd);
const gitConfig = join(runRoot, "test.gitconfig");
writeFileSync(gitConfig, "[user]\n name = Acceptance Test\n email = acceptance@example.invalid\n[commit]\n gpgsign = false\n");
const gitEnv = { ...process.env, GIT_CONFIG_GLOBAL: gitConfig, GIT_CONFIG_NOSYSTEM: "1" };
execFileSync(process.execPath, [join(root, "packages/pi-legal-suite/skills/legal-setup/scripts/init_workspace.mjs"), "--workspace", cwd, "--data-dir", ".", "--phase", "complete", "--git-author-name", "Acceptance Test", "--git-author-email", "acceptance@example.invalid"], { env: gitEnv, stdio: "pipe" });
writeFileSync(join(cwd, "AGENTS.md"), "# Fictional acceptance-test practice profile\n\n- User: in-house legal, purchasing side.\n- Company: 流光公司（虚构）.\n- Contract liability policy: Not configured — ask at use time.\n- No actual client materials or legal research are authorized.\n- All outputs are drafting tests, not legal advice or approval to send/sign.\n");
const matter = join(cwd, "matters/demo-saas"); mkdirSync(join(matter, "outputs"), { recursive: true });
writeFileSync(join(matter, "matter.md"), "# Matter: 虚构 SaaS 采购\n\n- Status: active\n\n## Associated Pi Sessions\n\n| Session ID | Bound | Status |\n|---|---|---|\n<!-- pi-legal:sessions:start -->\n<!-- pi-legal:sessions:end -->\n");
writeFileSync(join(matter, "history.md"), "# Matter History\n\nSynthetic test fixture; not a legal event record.\n");
writeFileSync(join(matter, "notes.md"), "# Matter Notes\n\nOnly the supplied fictional contract is authorized.\n");
writeFileSync(join(cwd, ".pi/legal-workbench/matter-index.json"), JSON.stringify({ schemaVersion: 2, updatedAt: "2000-01-01", matters: [{ slug: "demo-saas", name: "虚构 SaaS 采购", client: "流光公司（虚构）", clientAliases: ["流光公司"], jurisdictions: ["测试法域"], issueKeywords: ["交付验收"], status: "active", path: "matters/demo-saas", openedAt: "2000-01-01", updatedAt: "2000-01-01" }] }, null, 2));
const contractPath = join(matter, "outputs/contract.md");
const original = "# 虚构 SaaS 采购合同（当前工作稿）\n\n## 责任限制\n供应商的责任总额不超过过去三个月已支付费用。\n\n## 交付验收\n供应商应向甲方提交全部约定交付物。\n甲方应在收到交付物后五个工作日内完成验收。\n发现不符合已约定验收标准的，甲方应书面列明不符合项。\n供应商收到不符合项通知后十个工作日内整改并重新提交。\n\n## 付款\n甲方应在收到发票后三十日内付款。\n";
writeFileSync(contractPath, original);
const git = (...args) => execFileSync("git", ["-C", matter, ...args], { encoding: "utf8", env: gitEnv }).trim();
const head = () => { try { return existsSync(join(matter, ".git")) ? git("rev-parse", "--verify", "HEAD") : null; } catch { return null; } };
const text = () => readFileSync(contractPath, "utf8");
const section = (body, heading) => body.split(`## ${heading}\n`)[1]?.split(/\n## /)[0]?.trim() ?? "";
const artifacts = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap(e => e.name.startsWith(".") ? [] : e.isDirectory() ? artifacts(join(dir, e.name)) : [join(dir, e.name)]);
const redact = (s) => String(s).replace(/Bearer\s+\S+/gi, "Bearer [redacted]").replace(/\bsk-[A-Za-z0-9_-]+/g, "[redacted]");
const report = { fixture: "fictional, not an actual client case", workspace: cwd, selectedModel: null, cases: [], snapshots: {}, warnings: [] };
const reportPath = join(runRoot, "report.json");
const save = () => writeFileSync(reportPath, JSON.stringify(report, null, 2));
const client = new RpcClient({ cliPath: join(root, "node_modules/@earendil-works/pi-coding-agent/dist/cli.js"), cwd, provider: options.provider, model: options.model, env: { GIT_CONFIG_GLOBAL: gitConfig, GIT_CONFIG_NOSYSTEM: "1", PI_SKIP_VERSION_CHECK: "1", PI_TELEMETRY: "0" }, args: ["--no-session", "--approve", "--thinking", "medium", "--no-mcp", "--no-extensions", "--extension", join(root, "packages/pi-legal-suite/extensions/legal-workbench.ts"), "--extension", "builtin:codemode", "--tools", "read,bash,edit,write,grep,find,ls,codemode,legal_matter_session,legal_document_revision", "--no-skills", "--skill", join(root, "packages/pi-legal-suite/skills"), "--no-prompt-templates", "--no-themes", "--no-context-files", "--append-system-prompt", join(cwd, ".pi/APPEND_SYSTEM.md")] });
const scenarios = [{
  name: "first-small-edit",
  prompt: "/skill:legal-document-edit 这是虚构合同的正常使用验收。workspace 已配置完成，明确授权直接绑定已有 demo-saas 事项，不用再问绑定或 commit。当前工作稿是 matters/demo-saas/outputs/contract.md，可以直接修改，不是须保留的源证据。请将责任限制的三个月改为十二个月，合同其余字不动，直接保存。不要联网、不要生成 Word，也不要读取工作区以外的文件。",
  check(row) {
    assert.equal(text(), original.replace("三个月", "十二个月"));
    assert.ok(row.afterHead, "No automatic Git repository/checkpoint");
    assert.equal(git("branch", "--list"), "* main");
    assert.equal(existsSync(join(matter, "outputs/revisions")), false);
    assert.match(git("show", "HEAD:outputs/contract.md"), /十二个月/);
    assert.ok(!row.controlActions.some(a => a === "begin" || a === "enable"), "Unnecessary proposal/enrollment ceremony");
  },
}, {
  name: "second-small-edit",
  prompt: "刚才的十二个月改为二十四个月，其他字不动，直接更新同一工作稿。",
  check(row) {
    assert.equal(text(), original.replace("三个月", "二十四个月"));
    assert.notEqual(row.afterHead, row.beforeHead);
    assert.equal(git("branch", "--list"), "* main");
    assert.ok(!row.controlActions.includes("begin"));
  },
}, {
  name: "logic-a-timeline",
  prompt: "现在重新组织交付验收这一章：用 a 逻辑，按提交、验收、整改三个时间阶段写成三段，对应小标题就是提交阶段、验收阶段、整改阶段。只重排已有要求，不新增事实、权利义务、期限，也不改其他章节，直接保存工作稿。",
  check(row) {
    const acceptance = section(text(), "交付验收");
    for (const label of ["提交阶段", "验收阶段", "整改阶段", "五个工作日", "十个工作日"]) assert.ok(acceptance.includes(label), label);
    assert.equal(section(text(), "责任限制"), "供应商的责任总额不超过过去二十四个月已支付费用。");
    assert.equal(section(text(), "付款"), "甲方应在收到发票后三十日内付款。");
    assert.ok(row.controlActions.includes("draft"), "Chapter original was not recorded before substantive drafting");
    assert.notEqual(row.afterHead, row.beforeHead);
  },
}, {
  name: "payment-independent-edit",
  prompt: "付款条款的三十日改成六十日。交付验收刚才的文字和其他章节不要动。",
  check(row) {
    assert.equal(section(text(), "交付验收"), section(report.snapshots["logic-a-timeline"].contract, "交付验收"));
    assert.equal(section(text(), "付款"), "甲方应在收到发票后六十日内付款。");
    assert.notEqual(row.afterHead, row.beforeHead);
  },
}, {
  name: "logic-b-responsibilities",
  prompt: "交付验收这章，我需要换成 b 逻辑：按责任主体组织，用甲方义务和供应商义务两个块来实现，不要再按提交、验收、整改的时间阶段安排。这是在换起草思路，不是继续润色 a。沿用既有事实和期限，不增加新要求，其他章节保持最新稿，直接保存。",
  check(row) {
    const acceptance = section(text(), "交付验收");
    for (const label of ["甲方义务", "供应商义务", "五个工作日", "十个工作日"]) assert.ok(acceptance.includes(label), label);
    for (const label of ["提交阶段", "验收阶段", "整改阶段"]) assert.ok(!acceptance.includes(label), `Inherited a structure: ${label}`);
    assert.equal(section(text(), "付款"), "甲方应在收到发票后六十日内付款。");
    assert.equal(section(text(), "责任限制"), "供应商的责任总额不超过过去二十四个月已支付费用。");
    assert.notEqual(row.afterHead, row.beforeHead);
    const originalHead = report.snapshots["second-small-edit"].head;
    assert.ok(row.originalReads.some(r => r.commit === originalHead), "No observable lookup of the pre-a original commit");
    assert.equal(git("show", `${row.afterHead}:outputs/contract.md`), text().trim());
  },
}, {
  name: "explicit-current-refinement",
  prompt: "在刚才 b 逻辑的现有稿上继续小改：供应商提交交付物的要求里加上一次性，只加这三个字，合同其他文字不动。不要重拟这一章。",
  check(row) {
    const before = report.snapshots["logic-b-responsibilities"].contract;
    assert.ok(text().includes("一次性"));
    assert.equal(text().replace("一次性", ""), before);
    assert.notEqual(row.afterHead, row.beforeHead);
    assert.equal(git("branch", "--list"), "* main");
  },
}, {
  name: "missing-company-policy",
  prompt: "下一步我要把责任限制改成我们公司的既定标准。profile 如果没有这个政策，就先告诉我还需要什么信息，不要自己认定公司标准，也先别改任何文件。",
  check(row) {
    assert.equal(text(), report.snapshots["explicit-current-refinement"].contract);
    assert.equal(row.afterHead, row.beforeHead);
    assert.match(row.output, /政策|标准|上限|policy/);
    assert.match(row.output, /提供|确认|未配置|不知道|缺少|尚未|没有/);
  },
}, {
  name: "read-only-review-no-word",
  prompt: "先不改任何文件，给我简要比较这次用过的 a、b 两种交付验收逻辑：组织方式怎么变了、其他章节有没有被回退，并告诉我最后保存在哪。现在不需要 Word。",
  check(row) {
    assert.equal(text(), report.snapshots["explicit-current-refinement"].contract);
    assert.equal(row.afterHead, row.beforeHead);
    assert.match(row.output, /时间|阶段/);
    assert.match(row.output, /主体|义务|责任/);
  },
}];

try {
  await client.start(); await client.setAutoRetry(false);
  const state = await client.getState();
  report.selectedModel = { provider: state.model?.provider, id: state.model?.id, name: state.model?.name, thinking: state.thinkingLevel };
  assert.equal(state.model?.provider, options.provider); assert.equal(state.model?.id, options.model);
  console.log(JSON.stringify({ phase: "started", model: report.selectedModel, workspace: cwd, report: reportPath }));
  for (const scenario of scenarios.slice(0, options.maxTurns)) {
    const row = { name: scenario.name, prompt: scenario.prompt, beforeHead: head(), status: "running", controlActions: [] };
    report.cases.push(row); save();
    const start = Date.now();
    try {
      const events = await client.promptAndWait(scenario.prompt, undefined, options.timeout);
      row.elapsedSeconds = Math.round((Date.now() - start) / 1000);
      row.output = redact(await client.getLastAssistantText() ?? "");
      row.tools = events.filter(e => e.type === "tool_execution_start").map(e => ({ name: e.toolName, ...(["legal_document_revision", "bash", "codemode"].includes(e.toolName) ? { args: e.args } : {}) }));
      row.controlActions = row.tools.filter(t => t.name === "legal_document_revision").map(t => t.args?.action);
      row.originalReads = events.filter(e => e.type === "tool_execution_end" && e.toolName === "legal_document_revision" && e.result?.details?.origin).map(e => e.result.details.origin);
      const sourceHead = report.snapshots["second-small-edit"]?.head;
      if (sourceHead && row.tools.some(t => /git[\s\S]*show/.test(t.args?.command ?? t.args?.code ?? "") && (t.args?.command ?? t.args?.code ?? "").includes(sourceHead))) row.originalReads.push({ commit: sourceHead, source: "observed git show" });
      row.errors = events.filter(e => e.type === "extension_error" || e.type === "message_end" && e.message?.role === "assistant" && ["error", "aborted"].includes(e.message.stopReason)).map(e => redact(e.error ?? e.message?.errorMessage ?? "model aborted"));
      row.afterHead = head(); row.contract = text();
      assert.equal(row.errors.length, 0, row.errors.join("; "));
      assert.ok(row.output.trim(), "No assistant response");
      scenario.check(row);
      assert.equal(artifacts(matter).filter(p => /\.docx$/i.test(p)).length, 0, "Unexpected Word output");
      assert.equal(git("status", "--porcelain"), "", "Uncheckpointed tracked draft changes");
      row.status = "passed";
      report.snapshots[scenario.name] = { head: row.afterHead, contract: row.contract };
    } catch (error) {
      row.status = "failed"; row.error = redact(error.message ?? error);
      await client.abort().catch(() => {});
      row.afterHead = head(); row.contract = text(); save();
      console.log(JSON.stringify({ case: row.name, status: row.status, error: row.error, report: reportPath }));
      process.exitCode = 1; break; // Dependent conversations must not be tested on an invalid state.
    }
    save(); console.log(JSON.stringify({ case: row.name, status: row.status, seconds: row.elapsedSeconds, actions: row.controlActions, commit: row.afterHead }));
  }
  report.sessionStats = await client.getSessionStats();
  if (head()) {
    report.gitLog = git("log", "--format=%H %s");
    report.gitMessages = git("log", "--format=%B");
    report.warnings = report.gitMessages.includes("mechanical fallback") ? ["One or more commit summaries used mechanical fallback; inspect exact commits."] : [];
    assert.equal(git("remote"), "", "A remote was added unexpectedly");
  }
} catch (error) { report.error = redact(error.message ?? error); process.exitCode = 1; }
finally {
  save(); await client.stop();
  console.log(JSON.stringify({ phase: "finished", passed: report.cases.filter(c => c.status === "passed").length, failed: report.cases.filter(c => c.status === "failed").length, error: report.error, warnings: report.warnings, report: reportPath, workspace: cwd }));
}
