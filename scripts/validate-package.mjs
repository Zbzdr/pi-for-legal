import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, "packages", "pi-legal-suite");
const errors = [];
const allowedFrontmatterKeys = new Set(["name", "description", "disable-model-invocation"]);
const internalWorkers = new Set([
  "legal-nda-review",
  "legal-saas-review",
  "legal-vendor-review",
  "legal-employment-internal-investigation",
  "legal-employment-international-expansion",
]);

function walk(directory) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function fail(message) {
  errors.push(message);
}

const workspace = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
const expectedRepository = {
  type: "git",
  url: "git+https://github.com/Zbzdr/pi-for-legal.git",
  directory: "packages/pi-legal-suite",
};

if (JSON.stringify(workspace.workspaces) !== JSON.stringify(["packages/pi-legal-suite"])) {
  fail("root workspaces must contain only packages/pi-legal-suite");
}
if (manifest.name !== "@zbzdr/pi-legal-suite") fail("unexpected publishable package name");
if (manifest.version !== workspace.version) fail(`suite version must match workspace ${workspace.version}`);
if (manifest.private === true) fail("suite must remain publishable");
if (!manifest.keywords?.includes("pi-package")) fail("suite is missing the pi-package keyword");
if (JSON.stringify(manifest.pi) !== JSON.stringify({ extensions: ["./extensions"], skills: ["./skills"] })) {
  fail("suite must expose ./extensions and ./skills");
}
if (manifest.dependencies && Object.keys(manifest.dependencies).length) fail("suite must not have runtime dependencies");
if (JSON.stringify(manifest.peerDependencies) !== JSON.stringify({ "@earendil-works/pi-coding-agent": "*" })) {
  fail("suite has incorrect peerDependencies");
}
if (JSON.stringify(manifest.repository) !== JSON.stringify(expectedRepository)) fail("suite repository metadata is incorrect");
if (manifest.homepage !== "https://github.com/Zbzdr/pi-for-legal#readme") fail("suite homepage is incorrect");
if (manifest.bugs?.url !== "https://github.com/Zbzdr/pi-for-legal/issues") fail("suite bugs URL is incorrect");
if (JSON.stringify(manifest.publishConfig) !== JSON.stringify({ access: "public", registry: "https://registry.npmjs.org/" })) {
  fail("suite publishConfig must target the public npm registry");
}

for (const required of ["README.md", "LICENSE", "NOTICE", "skills", "extensions"]) {
  if (!existsSync(join(packageRoot, required))) fail(`suite is missing ${required}`);
}
for (const forbidden of [".mcp.json", ".pi", "connectors", "bin"]) {
  if (existsSync(join(packageRoot, forbidden))) fail(`suite contains forbidden path: ${forbidden}`);
}

const extensionFiles = walk(join(packageRoot, "extensions")).filter((path) => /\.[cm]?[jt]s$/.test(path));
if (extensionFiles.length !== 1) fail(`suite must expose exactly one extension; found ${extensionFiles.length}`);
if (manifest.piLegal?.extensionCount !== extensionFiles.length) fail("piLegal.extensionCount is incorrect");

const names = new Set();
const skillFiles = walk(join(packageRoot, "skills")).filter((path) => path.endsWith(`${sep}SKILL.md`));
for (const skillFile of skillFiles) {
  const skillRoot = dirname(skillFile);
  const skillRelative = relative(packageRoot, skillFile);
  const text = readFileSync(skillFile, "utf8");
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) {
    fail(`${skillRelative}: missing YAML frontmatter`);
    continue;
  }

  const name = frontmatter[1].match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim();
  const description = frontmatter[1].match(/^description:\s*([^\r\n]+)$/m)?.[1]?.trim();
  const keys = [...frontmatter[1].matchAll(/^([A-Za-z0-9_-]+):/gm)].map((match) => match[1]);
  if (keys.some((key) => !allowedFrontmatterKeys.has(key))) fail(`${skillRelative}: unsupported frontmatter field`);
  if (!name || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) fail(`${skillRelative}: invalid or missing name`);
  if (!description) fail(`${skillRelative}: missing single-line description`);
  if (description && description.length > 1024) fail(`${skillRelative}: description exceeds 1024 characters`);
  if (name && name !== skillRoot.split(sep).at(-1)) fail(`${skillRelative}: name must match directory`);
  if (name && names.has(name)) fail(`duplicate skill name: ${name}`);
  if (name) names.add(name);

  const hidden = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter[1]);
  if (name && internalWorkers.has(name) !== hidden) fail(`${name}: progressive-disclosure flag is incorrect`);

  for (const path of walk(skillRoot)) {
    if (lstatSync(path).isSymbolicLink()) fail(`${relative(packageRoot, path)}: symlink not allowed`);
    const content = readFileSync(path, "utf8");
    if (/\.(?:md|ya?ml)$/.test(path) && (!content.includes("Attribution:") || !content.includes("modified for Pi"))) {
      fail(`${relative(packageRoot, path)}: missing attribution and Pi modification notice`);
    }
    if (!path.endsWith(".md")) continue;
    if (/~\/\.claude|\/commercial-legal:|\/legal-clinic:|\.claude-plugin|\.mcp\.json/.test(content)) {
      fail(`${relative(packageRoot, path)}: contains Claude-specific content`);
    }
    const pattern = /[\s(`'"]((?:references|scripts|assets)\/[A-Za-z0-9._@/-]+)/g;
    for (const match of content.matchAll(pattern)) {
      const resource = match[1].replace(/[.,;:]+$/, "");
      const target = resolve(skillRoot, resource);
      if (!target.startsWith(`${skillRoot}${sep}`)) fail(`${name}: resource escapes skill: ${resource}`);
      else if (!existsSync(target)) fail(`${name}: missing resource ${resource}`);
    }
  }

  const linked = new Set(
    [...text.matchAll(/[\s(`'"]((?:references|scripts|assets)\/[A-Za-z0-9._@/-]+)/g)]
      .map((match) => match[1].replace(/[.,;:]+$/, "")),
  );
  for (const resource of walk(join(skillRoot, "references"))) {
    const resourceRelative = relative(skillRoot, resource);
    if (!linked.has(resourceRelative)) fail(`${relative(packageRoot, resource)}: unlinked reference`);
  }
}

if (skillFiles.length !== 88) fail(`suite must contain 88 Skills; found ${skillFiles.length}`);
if (manifest.piLegal?.skillCount !== skillFiles.length) fail("piLegal.skillCount is incorrect");

for (const entry of readdirSync(join(root, "packages"), { withFileTypes: true })) {
  if (!entry.isDirectory() || entry.name === "pi-legal-suite") continue;
  const legacyManifestPath = join(root, "packages", entry.name, "package.json");
  if (existsSync(legacyManifestPath) && JSON.parse(readFileSync(legacyManifestPath, "utf8")).private !== true) {
    fail(`${entry.name}: legacy source snapshot must be private`);
  }
}

if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Checked @zbzdr/pi-legal-suite: ${skillFiles.length} Skills, ${extensionFiles.length} extension, single publishable package.`);
