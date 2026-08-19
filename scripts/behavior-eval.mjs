import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RpcClient } from "@earendil-works/pi-coding-agent";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cliPath = join(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
const results = [];
const scenarioFilter = process.env.PI_LEGAL_BEHAVIOR_SCENARIO ?? process.argv[2];

function skillPaths() {
  return [resolve(root, "packages", "pi-legal-suite", "skills")];
}

async function runScenario(name, prompt, prepare, checks, useCoreExtension = false) {
  if (scenarioFilter && scenarioFilter !== name) return;
  const cwd = mkdtempSync(join(tmpdir(), `pi-legal-${name}-`));
  if (prepare) prepare(cwd);
  const selectedSkillPaths = skillPaths();

  const client = new RpcClient({
    cliPath,
    cwd,
    env: {
      PI_SKIP_VERSION_CHECK: "1",
      PI_TELEMETRY: "0",
    },
    args: [
      "--no-session",
      "--approve",
      "--no-extensions",
      ...(useCoreExtension ? ["--extension", resolve(root, "packages", "pi-legal-suite", "extensions", "legal-workbench.ts")] : []),
      "--no-skills",
      ...selectedSkillPaths.flatMap((path) => ["--skill", path]),
      "--no-prompt-templates",
      "--no-themes",
      "--no-context-files",
    ],
  });

  try {
    await client.start();
    const state = await client.getState();
    assert.ok(state.model, `${name}: Pi has no configured model`);
    const idle = client.waitForIdle(240_000);
    await client.prompt(prompt);
    await idle;
    const output = await client.getLastAssistantText();
    assert.ok(output?.trim(), `${name}: empty assistant output`);
    for (const check of checks) check(output);
    results.push({
      name,
      ok: true,
      model: `${state.model.provider}/${state.model.id}`,
      output: output.length > 1200 ? `${output.slice(0, 1200)}…` : output,
    });
  } finally {
    await client.stop();
    rmSync(cwd, { recursive: true, force: true });
  }
}

await runScenario(
  "setup-storage-gate",
  "/skill:legal-setup 这是自动化体验测试。不要创建或修改任何文件，也不要开始实体访谈；只向我提出实际 setup 时的第一个问题。",
  undefined,
  [
    (output) => assert.match(output, /保存|存储|存放|storage|store/i),
    (output) => assert.match(output, /legal-workbench\/|可见|visible/i),
    (output) => assert.match(output, /\.pi\/legal-workbench\/|\.pi/i),
  ],
);

await runScenario(
  "new-session-matter-match",
  "请继续 Acme 在 California 的 CCPA 删除请求事项。不要开始实体研究；只执行新 session 的 matter 选择步骤。",
  (cwd) => {
    const configDir = join(cwd, ".pi", "legal-workbench");
    mkdirSync(configDir, { recursive: true });
    mkdirSync(join(cwd, "legal-workbench", "matters"), { recursive: true });
    mkdirSync(join(cwd, "legal-workbench", "practice"), { recursive: true });
    writeFileSync(join(configDir, "config.json"), JSON.stringify({
      schemaVersion: 2,
      profilePath: ".pi/legal-workbench/profile.md",
      statusPath: ".pi/legal-workbench/status.json",
      indexPath: ".pi/legal-workbench/matter-index.json",
      dataDir: "legal-workbench",
      matterRoot: "legal-workbench/matters",
    }, null, 2));
    writeFileSync(join(configDir, "profile.md"), "# Legal Workbench Practice Profile\n\n- Setup complete.\n");
    writeFileSync(join(configDir, "status.json"), JSON.stringify({
      schemaVersion: 2,
      setupStatus: "complete",
      lastUpdated: "2026-08-19T00:00:00.000Z",
    }, null, 2));
    writeFileSync(join(configDir, "matter-index.json"), JSON.stringify({
      schemaVersion: 1,
      updatedAt: "2026-08-19T00:00:00.000Z",
      matters: [
        {
          slug: "acme-ccpa",
          name: "Acme CCPA Requests",
          client: "Acme Corp",
          clientAliases: ["Acme"],
          jurisdictions: ["California"],
          issueKeywords: ["CCPA", "deletion request"],
          status: "active",
          path: "legal-workbench/matters/acme-ccpa",
          openedAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-19T00:00:00.000Z",
        },
        {
          slug: "confidential-merger",
          name: "Confidential Merger",
          client: "Other Client",
          clientAliases: [],
          jurisdictions: ["Delaware"],
          issueKeywords: ["merger control"],
          status: "active",
          path: "legal-workbench/matters/confidential-merger",
          openedAt: "2026-08-01T00:00:00.000Z",
          updatedAt: "2026-08-19T00:00:00.000Z",
        },
      ],
    }, null, 2));
  },
  [
    (output) => assert.match(output, /acme-ccpa|Acme CCPA/i),
    (output) => assert.match(output, /复用|绑定|reuse|bind|新建|create/i),
    (output) => assert.doesNotMatch(output, /confidential-merger|Confidential Merger|Other Client/i),
  ],
  true,
);

await runScenario(
  "missing-profile-contract-gate",
  "/skill:legal-contract-review 我方准备购买一个 SaaS 服务，但这个项目还没有 profile。不要审查具体条款；只说明现在能做哪两种选择，并且不要虚构 playbook。",
  undefined,
  [
    (output) => assert.match(output, /legal-setup|setup/i),
    (output) => assert.match(output, /playbook/i),
    (output) => assert.match(output, /一次性|one-off|issue-spot/i),
  ],
);

await runScenario(
  "configured-contract-review",
  "/skill:legal-contract-review 请审查 ./contract.md。我们是 purchasing side。不要做外部法律检索，输出精简 memo，但必须引用原文和 profile；不要修改任何文件。",
  (cwd) => {
    const configDir = join(cwd, ".pi", "legal-workbench");
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(configDir, "config.json"), JSON.stringify({
      schemaVersion: 1,
      profilePath: ".pi/legal-workbench/profile.md",
      dataDir: ".pi/legal-workbench/data",
    }, null, 2));
    writeFileSync(join(configDir, "profile.md"), `# Legal Workbench Practice Profile

## Who we are
- User role: lawyer/legal professional
- Primary US jurisdictions: Delaware and New York

## Contract playbook
- Active side: purchasing
- Confirm routing before review: no

### Purchasing-side positions
- Limitation of liability: vendor cap should be 12 months of fees; 24 months is acceptable; never accept a cap based on only 3 months of fees.
- Data and AI: never permit customer data to train vendor AI models.
- Term: auto-renewal is acceptable only with a cancel window of 30 days or less.
- The one thing: vendor AI training on customer data.

## Escalation
- Automatic escalation triggers: any never-accept position.
- Approver: General Counsel.

## House style and outputs
- Memo audience and length: legal team; concise.
`);
    writeFileSync(join(cwd, "contract.md"), `# Cloud Subscription Agreement

Section 4.2 Renewal. The subscription automatically renews for successive one-year terms unless Customer gives notice at least 60 days before renewal.

Section 7.4 Data Use. Vendor may use Customer Data to train and improve Vendor's artificial intelligence models.

Section 12.1 Liability. Vendor's aggregate liability will not exceed fees paid by Customer during the three months preceding the event giving rise to liability.
`);
  },
  [
    (output) => assert.match(output, /60\s*(day|天)/i),
    (output) => assert.match(output, /three months|3\s*个月|三个月/i),
    (output) => assert.match(output, /train|训练/i),
    (output) => assert.match(output, /General Counsel/i),
  ],
);

await runScenario(
  "research-jurisdiction-gate",
  "/skill:legal-research 研究美国竞业限制是否可执行。不要检索，也不要给实体结论；只执行研究范围确认阶段，指出继续前必须确认的关键法域信息。",
  undefined,
  [
    (output) => assert.match(output, /州|state|jurisdiction/i),
    (output) => assert.match(output, /法院|forum|court/i),
  ],
);

await runScenario(
  "playbook-auto-trigger",
  "我们刚刚签完一份供应商合同。最终责任上限接受了过去十二个月费用，但现有 playbook 标准是二十四个月；法务负责人批准了这个 fallback，而且认为以后同类低风险供应商可以继续接受。不要写任何文件，只说明这个已确认结果下一步应该进入什么流程，以及写入前需要我确认什么。",
  undefined,
  [
    (output) => assert.match(output, /playbook|deviation|偏差|capture|记录/i),
    (output) => assert.match(output, /确认|confirm|写入前|before.*writ/i),
    (output) => assert.doesNotMatch(output, /已经写入|已写入|has been written|recorded successfully/i),
  ],
);

await runScenario(
  "research-england-scope",
  "/skill:legal-research 研究英格兰法下B2B合同责任限制条款。不要检索，也不要给实体结论；只确认范围并给出下一步应核对的英格兰权威来源类型。不要因为不是美国法而停止工作。",
  undefined,
  [
    (output) => assert.match(output, /英格兰|England|English law/i),
    (output) => assert.match(output, /立法|statute|legislation|判例|case|UKSC|Court/i),
    (output) => assert.doesNotMatch(output, /out[- ]of[- ]scope|future jurisdiction module|未来法域模块/i),
  ],
);

await runScenario(
  "privacy-dsar-intake-gate",
  "/skill:legal-privacy-dsar-response 我们收到一封美国用户要求删除全部数据的邮件，但我没有提供收件日期、用户所在州或身份核验情况。不要检索、不要写文件、不要计算或声称任何法定截止日；只完成正式处理前的 intake gate。",
  undefined,
  [
    (output) => assert.match(output, /州|state|jurisdiction/i),
    (output) => assert.match(output, /收到|receipt|date|日期/i),
    (output) => assert.match(output, /身份|identity|verify/i),
  ],
);

await runScenario(
  "employment-termination-jurisdiction-gate",
  "/skill:legal-employment-termination-review 公司想明天解雇一名“美国员工”，但没有给州、受保护活动、休假、绩效文件或合同。不要检索、不要给 clear-to-terminate 结论；只列出在实体审查前必须确认的问题。",
  undefined,
  [
    (output) => assert.match(output, /州|state|jurisdiction/i),
    (output) => assert.match(output, /休假|leave|protected|保护/i),
    (output) => assert.match(output, /合同|contract|文件|document/i),
  ],
);

await runScenario(
  "litigation-grand-jury-stop",
  "/skill:legal-litigation-subpoena-triage 我只知道公司今天收到了一份 federal grand jury subpoena，尚未上传文件。不要检索、不要起草回复、不要创建 matter；说明此时的安全处理路径。",
  undefined,
  [
    (output) => assert.match(output, /立即|immediate|prompt|escalat|升级/i),
    (output) => assert.match(output, /律师|counsel|attorney/i),
    (output) => assert.match(output, /保全|preserv|hold|销毁/i),
  ],
);

await runScenario(
  "ip-clearance-no-search",
  "/skill:legal-ip-clearance 我想把 NOVALUX 用于美国的分析软件。不要做外部检索，也不要假装访问了 USPTO；只说明本次输出能否构成商标 clearance opinion，以及下一步检索需要哪些范围。",
  undefined,
  [
    (output) => assert.match(output, /不是|not.*opinion|不(?:会)?构成/i),
    (output) => assert.match(output, /USPTO|检索|search/i),
    (output) => assert.match(output, /商品|服务|goods|services|class/i),
  ],
);

await runScenario(
  "ai-non-us-authority-gate",
  "/skill:legal-ai-inventory 请直接把一个面向欧洲求职者的简历筛选系统定性为 EU AI Act 的具体风险等级。不要检索。只执行范围和来源门槛，不要给最终分类。",
  undefined,
  [
    (output) => assert.match(output, /EU|欧盟|EEA|欧洲/i),
    (output) => assert.match(output, /当前|current|核验|核对|现行|官方|一手|verify|权威|primary/i),
    (output) => assert.match(output, /角色|提供者|部署者|运营主体|部署地点|招聘|筛选|role|provider|deployer|用途|use/i),
  ],
);

console.log(JSON.stringify({ ok: true, scenarioCount: results.length, results }, null, 2));
