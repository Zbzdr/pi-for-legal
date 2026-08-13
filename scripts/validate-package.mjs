import { existsSync, lstatSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesRoot = join(root, "packages");
const errors = [];

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

const packageDirectories = readdirSync(packagesRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => join(packagesRoot, entry.name));
const suiteConfig = JSON.parse(readFileSync(join(root, "suite-packages.json"), "utf8"));
const sourcePackageDirectories = new Set(suiteConfig.packages);
const allSourceSkills = new Map();
const suiteSkills = new Set();
const workspaceVersion = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const internalWorkers = new Set([
  "legal-nda-review",
  "legal-saas-review",
  "legal-vendor-review",
  "legal-employment-internal-investigation",
  "legal-employment-international-expansion",
]);

for (const packageRoot of packageDirectories) {
  const packageRelative = relative(root, packageRoot);
  const packageJsonPath = join(packageRoot, "package.json");
  if (!existsSync(packageJsonPath)) {
    fail(`${packageRelative}: missing package.json`);
    continue;
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
  const isSuite = packageJson.name === "@zbzdr/pi-legal-suite";
  const expectedRepository = {
    type: "git",
    url: "git+https://github.com/Zbzdr/pi-for-legal.git",
    directory: packageRelative,
  };
  if (packageJson.version !== workspaceVersion) fail(`${packageJson.name}: version must match workspace ${workspaceVersion}`);
  if (!packageJson.keywords?.includes("pi-package")) fail(`${packageJson.name}: missing pi-package keyword`);
  if (packageJson.private === true) fail(`${packageJson.name}: publishable package must not be private`);
  if (JSON.stringify(packageJson.pi) !== JSON.stringify({ skills: ["./skills"] })) {
    fail(`${packageJson.name}: pi manifest must expose only ./skills`);
  }
  if (packageJson.dependencies && Object.keys(packageJson.dependencies).length) {
    fail(`${packageJson.name}: legal skill packages must not have runtime dependencies`);
  }
  if (!packageJson.name.startsWith("@zbzdr/")) fail(`${packageJson.name}: package must use the @zbzdr scope`);
  if (JSON.stringify(packageJson.repository) !== JSON.stringify(expectedRepository)) {
    fail(`${packageJson.name}: repository metadata must identify ${packageRelative}`);
  }
  if (packageJson.homepage !== "https://github.com/Zbzdr/pi-for-legal#readme") {
    fail(`${packageJson.name}: incorrect homepage`);
  }
  if (packageJson.bugs?.url !== "https://github.com/Zbzdr/pi-for-legal/issues") {
    fail(`${packageJson.name}: incorrect bugs URL`);
  }
  if (JSON.stringify(packageJson.publishConfig) !== JSON.stringify({ access: "public", registry: "https://registry.npmjs.org/" })) {
    fail(`${packageJson.name}: publishConfig must target the public npm registry`);
  }
  if (!isSuite && packageJson.name !== "@zbzdr/pi-legal-core" &&
      JSON.stringify(packageJson.piLegal?.companionPackages) !== JSON.stringify(["@zbzdr/pi-legal-core"])) {
    fail(`${packageJson.name} must declare @zbzdr/pi-legal-core as its companion package`);
  }

  for (const forbidden of [".mcp.json", ".pi", "extensions", "connectors", "bin"] ) {
    if (existsSync(join(packageRoot, forbidden))) fail(`${packageJson.name}: forbidden path exists: ${forbidden}`);
  }
  for (const required of ["README.md", "LICENSE", "NOTICE", "skills"]) {
    if (!existsSync(join(packageRoot, required))) fail(`${packageJson.name}: missing ${required}`);
  }

  const localNames = new Set();
  const skillFiles = walk(join(packageRoot, "skills")).filter((path) => path.endsWith(`${sep}SKILL.md`));
  for (const skillFile of skillFiles) {
    const skillRoot = dirname(skillFile);
    const skillRelative = relative(packageRoot, skillFile);
    const text = readFileSync(skillFile, "utf8");
    const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);

    if (!frontmatter) {
      fail(`${packageJson.name}/${skillRelative}: missing YAML frontmatter`);
      continue;
    }

    const name = frontmatter[1].match(/^name:\s*([^\r\n]+)$/m)?.[1]?.trim();
    const description = frontmatter[1].match(/^description:\s*([^\r\n]+)$/m)?.[1]?.trim();
    const frontmatterKeys = [...frontmatter[1].matchAll(/^([A-Za-z0-9_-]+):/gm)].map((match) => match[1]).sort();
    const allowedFrontmatterKeys = new Set(["name", "description", "disable-model-invocation"]);
    if (frontmatterKeys.some((key) => !allowedFrontmatterKeys.has(key))) {
      fail(`${packageJson.name}/${skillRelative}: unsupported frontmatter field`);
    }
    if (!name) fail(`${packageJson.name}/${skillRelative}: missing name`);
    if (!description) fail(`${packageJson.name}/${skillRelative}: missing single-line description`);
    if (name && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name)) fail(`${packageJson.name}: invalid skill name ${name}`);
    if (name && name !== skillRoot.split(sep).at(-1)) fail(`${packageJson.name}: skill name must match directory: ${name}`);
    if (name && localNames.has(name)) fail(`${packageJson.name}: duplicate skill name ${name}`);
    if (name) localNames.add(name);
    if (description && description.length > 1024) fail(`${packageJson.name}/${name}: description exceeds 1024 characters`);
    const hiddenFromAutomaticSelection = /^disable-model-invocation:\s*true\s*$/m.test(frontmatter[1]);
    if (name && internalWorkers.has(name) !== hiddenFromAutomaticSelection) {
      fail(`${packageJson.name}/${name}: internal-worker progressive-disclosure flag is incorrect`);
    }

    if (name && isSuite) suiteSkills.add(name);
    if (name && sourcePackageDirectories.has(basename(packageRoot))) {
      if (allSourceSkills.has(name)) fail(`source packages duplicate skill ${name}`);
      allSourceSkills.set(name, packageJson.name);
    }

    for (const path of walk(skillRoot)) {
      if (lstatSync(path).isSymbolicLink()) fail(`${packageJson.name}/${relative(packageRoot, path)}: symlink not allowed`);
      const content = readFileSync(path, "utf8");
      if (/\.(?:md|ya?ml)$/.test(path) &&
          (!content.includes("Attribution:") || !content.includes("modified for Pi"))) {
        fail(`${packageJson.name}/${relative(packageRoot, path)}: missing standardized attribution and modification notice`);
      }
      if (!path.endsWith(".md")) continue;
      if (/~\/\.claude|\/commercial-legal:|\/legal-clinic:|\.claude-plugin|\.mcp\.json/.test(content)) {
        fail(`${packageJson.name}/${relative(packageRoot, path)}: contains Claude-specific content`);
      }
      if (/`\/(?:skills|references|scripts|assets)\//.test(content)) {
        fail(`${packageJson.name}/${relative(packageRoot, path)}: package-root absolute resource reference`);
      }

      const pattern = /[\s(`'"]((?:references|scripts|assets)\/[A-Za-z0-9._@/-]+)/g;
      for (const match of content.matchAll(pattern)) {
        const resource = match[1].replace(/[.,;:]+$/, "");
        const target = resolve(skillRoot, resource);
        if (!target.startsWith(`${skillRoot}${sep}`)) fail(`${packageJson.name}/${name}: resource escapes skill: ${resource}`);
        else if (!existsSync(target)) fail(`${packageJson.name}/${name}: missing resource ${resource}`);
      }
    }

    const linked = new Set(
      [...text.matchAll(/[\s(`'"]((?:references|scripts|assets)\/[A-Za-z0-9._@/-]+)/g)]
        .map((match) => match[1].replace(/[.,;:]+$/, "")),
    );
    for (const resource of walk(join(skillRoot, "references"))) {
      const resourceRelative = relative(skillRoot, resource);
      if (!linked.has(resourceRelative)) fail(`${packageJson.name}/${relative(packageRoot, resource)}: unlinked reference`);
    }
  }

  if (packageJson.piLegal?.skillCount !== undefined && packageJson.piLegal.skillCount !== skillFiles.length) {
    fail(`${packageJson.name}: piLegal.skillCount must equal ${skillFiles.length}`);
  }

  console.log(`Checked ${packageJson.name}: ${skillFiles.length} skills.`);
}

const sourceNames = [...allSourceSkills.keys()].sort();
const builtSuiteNames = [...suiteSkills].sort();
if (JSON.stringify(sourceNames) !== JSON.stringify(builtSuiteNames)) {
  fail(`pi-legal-suite skills do not match source package union: expected ${sourceNames.join(", ")}; got ${builtSuiteNames.join(", ")}`);
}

for (const packageDirectory of sourcePackageDirectories) {
  if (!existsSync(join(packagesRoot, packageDirectory, "package.json"))) fail(`suite source package does not exist: ${packageDirectory}`);
}

if (errors.length) {
  console.error(errors.map((error) => `ERROR: ${error}`).join("\n"));
  process.exit(1);
}

console.log(`Pi workspace checks passed: ${packageDirectories.length} packages, ${allSourceSkills.size} unique source skills, suite union verified.`);
