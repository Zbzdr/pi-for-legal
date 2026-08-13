import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const upstreamRoot = process.argv[2];
const revision = "4a6c651889c97cc9140580363c73e0eb17379c2b";
const workspaceVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;

if (!upstreamRoot || !existsSync(join(upstreamRoot, ".git"))) {
  console.error("Usage: node scripts/import-upstream-domains.mjs /path/to/claude-for-legal");
  process.exit(2);
}

const sharedSkills = new Set(["cold-start-interview", "customize", "matter-workspace"]);

const domains = [
  {
    upstream: "privacy-legal",
    packageName: "@zbzdr/pi-privacy-legal",
    alias: "privacy",
    prefix: "legal-privacy-",
    title: "Privacy & Data Protection",
    summary: "DPA、DSAR、PIA、隐私政策漂移、监管差距与数据使用场景分流",
  },
  {
    upstream: "regulatory-legal",
    packageName: "@zbzdr/pi-regulatory-legal",
    alias: "regulatory",
    prefix: "legal-regulatory-",
    title: "Regulatory",
    summary: "监管动态、政策差异、整改缺口、征求意见期和政策改写",
    skip: new Set(["gaps"]),
    overrides: {
      "gap-surfacer": "legal-regulatory-gaps",
      "reg-feed-watcher": "legal-regulatory-feed-watcher",
    },
  },
  {
    upstream: "ai-governance-legal",
    packageName: "@zbzdr/pi-ai-governance-legal",
    alias: "ai-governance",
    prefix: "legal-ai-",
    title: "AI Governance",
    summary: "AI 清单、使用场景分流、影响评估、供应商审查、政策与监管差距",
    overrides: {
      "ai-inventory": "legal-ai-inventory",
      "aia-generation": "legal-ai-impact-assessment",
      "vendor-ai-review": "legal-ai-vendor-review",
    },
  },
  {
    upstream: "employment-legal",
    packageName: "@zbzdr/pi-employment-legal",
    alias: "employment",
    prefix: "legal-employment-",
    title: "Employment",
    summary: "招聘、解雇、用工分类、工资工时、休假、政策、调查与国际扩张",
  },
  {
    upstream: "corporate-legal",
    packageName: "@zbzdr/pi-corporate-legal",
    alias: "corporate",
    prefix: "legal-corporate-",
    title: "Corporate",
    summary: "M&A 尽调、交割、董事会、书面同意、实体合规与并购后整合",
  },
  {
    upstream: "litigation-legal",
    packageName: "@zbzdr/pi-litigation-legal",
    alias: "litigation",
    prefix: "legal-litigation-",
    title: "Litigation",
    summary: "争议事项、传票、保全、时间线、诉求图、函件、特权日志与案件组合",
  },
  {
    upstream: "ip-legal",
    packageName: "@zbzdr/pi-ip-legal",
    alias: "ip",
    prefix: "legal-ip-",
    title: "Intellectual Property",
    summary: "商标检索、FTO 初筛、侵权、发明、开源、IP 条款、下架与权利组合",
    overrides: { "ip-clause-review": "legal-ip-clause-review" },
  },
  {
    upstream: "product-legal",
    packageName: "@zbzdr/pi-product-legal",
    alias: "product",
    prefix: "legal-product-",
    title: "Product",
    summary: "产品发布、功能风险、营销声明和快速问题分流",
    overrides: { "is-this-a-problem": "legal-product-problem-triage" },
  },
];

function sourceSkillNames(domain) {
  return readdirSync(join(upstreamRoot, domain.upstream, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

function destinationName(domain, sourceName) {
  if (sourceName === "cold-start-interview") return "legal-setup";
  if (sourceName === "customize") return "legal-customize";
  if (sourceName === "matter-workspace") return "legal-matter-workspace";
  if (sourceName === "gap-surfacer" && domain.upstream === "regulatory-legal") {
    return "legal-regulatory-gaps";
  }
  return domain.overrides?.[sourceName] ?? `${domain.prefix}${sourceName}`;
}

const commandMap = new Map();
for (const domain of domains) {
  for (const sourceName of sourceSkillNames(domain)) {
    commandMap.set(`/${domain.upstream}:${sourceName}`, `/skill:${destinationName(domain, sourceName)}`);
  }
}
for (const [source, destination] of Object.entries({
  "/commercial-legal:cold-start-interview": "/skill:legal-setup",
  "/commercial-legal:customize": "/skill:legal-customize",
  "/commercial-legal:matter-workspace": "/skill:legal-matter-workspace",
  "/commercial-legal:review": "/skill:legal-contract-review",
  "/commercial-legal:vendor-agreement-review": "/skill:legal-vendor-review",
  "/commercial-legal:saas-msa-review": "/skill:legal-saas-review",
  "/commercial-legal:nda-review": "/skill:legal-nda-review",
  "/commercial-legal:amendment-history": "/skill:legal-amendment-history",
  "/commercial-legal:renewal-tracker": "/skill:legal-renewal-tracker",
  "/commercial-legal:escalation-flagger": "/skill:legal-escalation",
  "/commercial-legal:stakeholder-summary": "/skill:legal-stakeholder-summary",
  "/external_plugins/cocounsel-legal:deep-research": "/skill:legal-research",
})) commandMap.set(source, destination);

const referenceInstructions = new Map([
  ["regulatory-legal/gap-surfacer", "Before creating or changing tracker data, read `references/gap-tracker.yaml` and `references/comment-tracker.yaml` for the project-local schemas."],
  ["corporate-legal/tabular-review", "When `--template ma-diligence` is requested, read `references/ma-diligence-columns.md`; also load the output-format reference selected by the user."],
  ["product-legal/launch-review", "If the profile has no configured launch framework, read `references/seven-category-framework.md` before performing the category walk."],
]);

function parseSkill(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Missing frontmatter");
  const lines = match[1].split(/\r?\n/);
  const start = lines.findIndex((line) => line.startsWith("description:"));
  if (start < 0) throw new Error("Missing description");
  let description = lines[start].slice("description:".length).trim();
  if (description === ">" || description === "|" || description === ">-" || description === "|-") {
    const parts = [];
    for (let index = start + 1; index < lines.length; index += 1) {
      if (!/^\s+/.test(lines[index])) break;
      parts.push(lines[index].trim());
    }
    description = parts.join(" ");
  }
  return {
    description: description.replace(/\s+/g, " ").trim(),
    body: match[2],
    internalWorker: /^user-invocable:\s*false\s*$/m.test(match[1]),
  };
}

function adaptText(text, domain) {
  let output = text;
  for (const [source, destination] of [...commandMap.entries()].sort((a, b) => b[0].length - a[0].length)) {
    output = output.replaceAll(source, destination);
  }

  output = output
    .replaceAll("/legal-builder-hub:related-skills-surfacer", "an appropriate installed legal skill")
    .replaceAll("/legal-builder-hub:registry-browser", "the installed legal skill list")
    .replaceAll("~/.claude/plugins/config/claude-for-legal/company-profile.md", "the project legal profile")
    .replaceAll(`~/.claude/plugins/config/claude-for-legal/${domain.upstream}/CLAUDE.md`, "the project legal profile")
    .replaceAll(`~/.claude/plugins/config/claude-for-legal/${domain.upstream}/`, `<dataDir>/${domain.upstream}/`)
    .replace(/~\/\.claude\/plugins\/cache\/claude-for-legal\/[A-Za-z0-9_/*.-]+/g, "a legacy Claude package path")
    .replace(/~\/\.claude\/[A-Za-z0-9_/*.-]+/g, "a legacy Claude path")
    .replaceAll("CLAUDE.md", "project legal profile")
    .replaceAll("Claude Code", "Pi")
    .replaceAll("Claude", "Pi")
    .replaceAll("plugin", "package")
    .replaceAll("Plugin", "Package")
    .replaceAll("Task tool", "an available subagent tool")
    .replaceAll("AskUserQuestion", "the current conversation")
    .replaceAll("WebSearch", "an available web-search capability")
    .replaceAll("WebFetch", "an available web-fetch capability");

  output = output
    .replaceAll(`<dataDir>/${domain.upstream}/matters/`, "<dataDir>/matters/")
    .replaceAll(`<dataDir>/${domain.upstream}/matters`, "<dataDir>/matters")
    .replaceAll("generic defaults — US jurisdiction,", "generic defaults — governing jurisdiction from the task/profile,")
    .replaceAll("middle risk appetite, lawyer role, US jurisdiction (CCPA + common federal sectoral baselines),", "middle risk appetite, lawyer role, governing jurisdiction from the task/profile,")
    .replaceAll("middle risk appetite, lawyer role, US jurisdiction (USPTO + common-law),", "middle risk appetite, lawyer role, governing jurisdiction from the task/profile,")
    .replaceAll("middle risk appetite, lawyer role, US jurisdiction,", "middle risk appetite, lawyer role, governing jurisdiction from the task/profile,")
    .replace(/(?:the\s+)?`internal-investigation`\s+reference skill/g, "`../legal-employment-internal-investigation/SKILL.md`")
    .replace(/(?:the\s+)?`international-expansion`\s+reference skill/g, "`../legal-employment-international-expansion/SKILL.md`")
    .replace(/(?:in|from)\s+the\s+`internal-investigation`\s+reference/g, "in `../legal-employment-internal-investigation/SKILL.md`")
    .replace(/(?:in|from)\s+the\s+`international-expansion`\s+reference/g, "in `../legal-employment-international-expansion/SKILL.md`")
    .replace(/(?:in|from)\s+`internal-investigation`\s+reference/g, "in `../legal-employment-internal-investigation/SKILL.md`")
    .replace(/(?:in|from)\s+`international-expansion`\s+reference/g, "in `../legal-employment-international-expansion/SKILL.md`");

  return output;
}

function adaptationNotice(domain) {
  return `> **Attribution:** Adapted from Anthropic's \`claude-for-legal/${domain.upstream}\` at revision \`${revision}\` under Apache-2.0 and modified for Pi. See the package \`NOTICE\`.\n`;
}

function addReferenceNotice(text, domain, path) {
  const source = `Anthropic's claude-for-legal/${domain.upstream}`;
  const normalized = `${text.trim()}\n`;
  if (path.endsWith(".md")) {
    return `> **Attribution:** Adapted from ${source} at revision \`${revision}\` under Apache-2.0 and modified for Pi. See the package \`NOTICE\`.\n\n${normalized.replace(/^\s+/, "")}`;
  }
  if (path.endsWith(".yaml") || path.endsWith(".yml")) {
    return `# Attribution: Adapted from ${source} at revision ${revision} under Apache-2.0 and modified for Pi. See the package NOTICE.\n${normalized.replace(/^\s+/, "")}`;
  }
  return text;
}

function copyReferences(sourceSkillRoot, destinationSkillRoot, body, domain) {
  const sourceReferences = join(sourceSkillRoot, "references");
  if (existsSync(sourceReferences)) {
    cpSync(sourceReferences, join(destinationSkillRoot, "references"), { recursive: true });
  }

  const rootReferencePattern = /references\/([A-Za-z0-9._-]+)/g;
  for (const match of body.matchAll(rootReferencePattern)) {
    const destination = join(destinationSkillRoot, "references", match[1]);
    if (existsSync(destination)) continue;
    const source = join(upstreamRoot, domain.upstream, "references", match[1]);
    if (existsSync(source)) {
      mkdirSync(dirname(destination), { recursive: true });
      cpSync(source, destination);
    }
  }
}

function packageManifest(domain, skillCount) {
  const packageDirectory = domain.packageName.slice(domain.packageName.indexOf("/") + 1);
  return {
    name: domain.packageName,
    version: workspaceVersion,
    description: `Pi legal skills for ${domain.title.toLowerCase()} workflows, adapted from claude-for-legal.`,
    type: "module",
    license: "Apache-2.0",
    repository: {
      type: "git",
      url: "git+https://github.com/Zbzdr/pi-for-legal.git",
      directory: `packages/${packageDirectory}`,
    },
    homepage: "https://github.com/Zbzdr/pi-for-legal#readme",
    bugs: { url: "https://github.com/Zbzdr/pi-for-legal/issues" },
    engines: { node: ">=20" },
    keywords: ["pi-package", "pi", "agent-skills", "legal", domain.alias],
    files: ["skills", "README.md", "LICENSE", "NOTICE"],
    scripts: { prepack: "node ../../scripts/prepare-package.mjs" },
    publishConfig: {
      access: "public",
      registry: "https://registry.npmjs.org/",
    },
    pi: { skills: ["./skills"] },
    piLegal: {
      companionPackages: ["@zbzdr/pi-legal-core"],
      upstreamRevision: revision,
      skillCount,
    },
  };
}

function packageReadme(domain, names) {
  return `# ${domain.packageName}\n\n${domain.summary}。这是一个纯 Pi Agent Skills package，不内置 MCP、connector、extension 或运行时依赖。\n\n## 安装\n\n推荐安装到当前项目（\`-l\`），并同时安装共享 setup、profile、法律研究与 matter 能力：\n\n\`\`\`bash\npi install -l npm:@zbzdr/pi-legal-core@${workspaceVersion}\npi install -l npm:${domain.packageName}@${workspaceVersion}\n\`\`\`\n\n不带 \`-l\` 的用户全局安装属于次要支持模式，会让该 package 出现在该用户的所有 Pi 项目中；仍需在每个项目单独运行 setup，并避免与项目中重复安装 suite/领域包。\n\n## Skills（${names.length}）\n\n${names.map((name) => `- \`/skill:${name}\``).join("\n")}\n\n首次使用先运行 \`/skill:legal-setup\`。本包保留上游工作流覆盖的美国、英国、EEA/EU 及跨境法律框架；处理任何法域时均应识别适用法、使用相应权威来源，并标明未完成的核实。所有实质输出均需合格律师复核。\n`;
}

for (const domain of domains) {
  const packageDirectory = domain.packageName.slice(domain.packageName.indexOf("/") + 1);
  const packageRoot = join(root, "packages", packageDirectory);
  const destinationSkills = join(packageRoot, "skills");
  rmSync(destinationSkills, { recursive: true, force: true });
  mkdirSync(destinationSkills, { recursive: true });
  const names = [];

  for (const sourceName of sourceSkillNames(domain).sort()) {
    if (sharedSkills.has(sourceName) || domain.skip?.has(sourceName)) continue;
    const sourceSkillRoot = join(upstreamRoot, domain.upstream, "skills", sourceName);
    const { description, body, internalWorker } = parseSkill(readFileSync(join(sourceSkillRoot, "SKILL.md"), "utf8"));
    const name = destinationName(domain, sourceName);
    const destinationSkillRoot = join(destinationSkills, name);
    mkdirSync(destinationSkillRoot, { recursive: true });

    const adaptedDescription = adaptText(description, domain)
      .replace(/^Reference:\s*/i, "")
      .replace(/\s+/g, " ")
      .trim();
    let adaptedBody = adaptText(body, domain)
      .replaceAll("`the project legal profile`", "the project legal profile");
    const bareCommand = new RegExp(`/${sourceName}(?=\\s|$|\\x60|\\[|\\n)`, "gm");
    adaptedBody = adaptedBody.replace(bareCommand, `/skill:${name}`);
    const firstHeading = adaptedBody.match(/^# .+$/m);
    const insertAt = firstHeading ? firstHeading.index + firstHeading[0].length : 0;
    const referenceInstruction = referenceInstructions.get(`${domain.upstream}/${sourceName}`);
    const hideFromAutomaticModelSelection = internalWorker && !(domain.upstream === "regulatory-legal" && sourceName === "gap-surfacer");
    const workerInstruction = hideFromAutomaticModelSelection
      ? "This is an internal worker in the upstream workflow. Pi hides it from automatic model selection with `disable-model-invocation`, while explicit `/skill:*` invocation remains possible. On direct invocation, preserve every intake, profile, matter, authority, and approval gate and route to the corresponding public mode command when one exists.\n\n"
      : "";
    const bodyWithNotice = `${adaptedBody.slice(0, insertAt)}\n\n${adaptationNotice(domain)}${workerInstruction}${referenceInstruction ? `${referenceInstruction}\n\n` : ""}${adaptedBody.slice(insertAt).replace(/^\n+/, "")}`;
    const frontmatter = [
      "---",
      `name: ${name}`,
      `description: ${JSON.stringify(adaptedDescription)}`,
      ...(hideFromAutomaticModelSelection ? ["disable-model-invocation: true"] : []),
      "---",
      "",
    ].join("\n");
    writeFileSync(
      join(destinationSkillRoot, "SKILL.md"),
      `${frontmatter}${bodyWithNotice.trim()}\n`,
    );
    copyReferences(sourceSkillRoot, destinationSkillRoot, bodyWithNotice, domain);

    for (const path of walkFiles(join(destinationSkillRoot, "references"))) {
      const adaptedReference = adaptText(readFileSync(path, "utf8"), domain);
      writeFileSync(path, addReferenceNotice(adaptedReference, domain, path));
    }
    names.push(name);
  }

  mkdirSync(packageRoot, { recursive: true });
  writeFileSync(join(packageRoot, "package.json"), `${JSON.stringify(packageManifest(domain, names.length), null, 2)}\n`);
  writeFileSync(join(packageRoot, "README.md"), packageReadme(domain, names.sort()));
  console.log(`Imported ${domain.packageName}: ${names.length} skills from ${relative(upstreamRoot, join(upstreamRoot, domain.upstream))}.`);
}

function walkFiles(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walkFiles(path) : [path];
  });
}
