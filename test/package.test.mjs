import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const sourcePackageDirectories = JSON.parse(readFileSync(join(root, "suite-packages.json"), "utf8")).packages;
const packageDirectories = [...sourcePackageDirectories, "pi-legal-suite"];

function manifest(name) {
  return JSON.parse(readFileSync(join(root, "packages", name, "package.json"), "utf8"));
}

function skillNames(name) {
  return readdirSync(join(root, "packages", name, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

test("workspace validator accepts all package boundaries and the suite union", () => {
  const output = execFileSync(process.execPath, [join(root, "scripts", "validate-package.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
  assert.match(output, /11 packages, 88 unique source skills, suite union verified/);
});

test("root is private and leaf workspaces are publishable skill-only Pi packages", () => {
  const rootManifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
  assert.equal(rootManifest.private, true);
  assert.deepEqual(rootManifest.workspaces, ["packages/*"]);

  for (const directory of packageDirectories) {
    const packageJson = manifest(directory);
    assert.equal(packageJson.private, undefined);
    assert.deepEqual(packageJson.pi, { skills: ["./skills"] });
    assert.equal(packageJson.dependencies, undefined);
    assert.ok(packageJson.keywords.includes("pi-package"));
    assert.match(packageJson.name, /^@zbzdr\/pi-[a-z-]+$/);
    assert.deepEqual(packageJson.publishConfig, { access: "public", registry: "https://registry.npmjs.org/" });
    if (directory !== "pi-legal-core" && directory !== "pi-legal-suite") {
      assert.deepEqual(packageJson.piLegal.companionPackages, ["@zbzdr/pi-legal-core"]);
    }
  }
});

test("source packages are disjoint and suite is their exact union", () => {
  const sourceSkills = sourcePackageDirectories.flatMap(skillNames);
  assert.equal(sourceSkills.length, 88);
  assert.equal(new Set(sourceSkills).size, 88);
  assert.deepEqual(skillNames("pi-legal-suite"), [...sourceSkills].sort());
});

test("upstream internal workers use Pi progressive disclosure", () => {
  const workers = [
    ["pi-commercial-legal", "legal-nda-review"],
    ["pi-commercial-legal", "legal-saas-review"],
    ["pi-commercial-legal", "legal-vendor-review"],
    ["pi-employment-legal", "legal-employment-internal-investigation"],
    ["pi-employment-legal", "legal-employment-international-expansion"],
  ];
  for (const [packageDirectory, skill] of workers) {
    const text = readFileSync(join(root, "packages", packageDirectory, "skills", skill, "SKILL.md"), "utf8");
    assert.match(text, /^disable-model-invocation:\s*true$/m, `${skill} must stay out of automatic model selection`);
  }
});

test("all domain matter references use the shared dataDir contract", () => {
  for (const directory of sourcePackageDirectories) {
    for (const skill of skillNames(directory)) {
      const text = readFileSync(join(root, "packages", directory, "skills", skill, "SKILL.md"), "utf8");
      assert.doesNotMatch(text, /<dataDir>\/[a-z-]+-legal\/matters\//, `${skill} uses a parallel domain matter tree`);
    }
  }
});

test("lightweight DOCX redline writes tracked changes and preserves the source", (t) => {
  const temporary = mkdtempSync(join(tmpdir(), "pi-legal-docx-test-"));
  t.after(() => rmSync(temporary, { recursive: true, force: true }));
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
    join(root, "packages", "pi-commercial-legal", "skills", "legal-docx-redline", "scripts", "docx_redline.py"),
    source,
    "--edits", edits,
    "--output", output,
    "--workspace", temporary,
    "--allow-stdlib-fallback",
  ]);
  const originalXml = execFileSync("unzip", ["-p", source, "word/document.xml"], { encoding: "utf8" });
  const redlineXml = execFileSync("unzip", ["-p", output, "word/document.xml"], { encoding: "utf8" });
  const settingsXml = execFileSync("unzip", ["-p", output, "word/settings.xml"], { encoding: "utf8" });
  assert.equal(originalXml, documentXml);
  assert.match(redlineXml, /<w:del\b/);
  assert.match(redlineXml, /<w:delText>three months<\/w:delText>/);
  assert.match(redlineXml, /<w:delText>Liability<\/w:delText>/);
  assert.match(redlineXml, /<w:ins\b/);
  assert.match(redlineXml, /<w:t>twelve months<\/w:t>/);
  assert.match(redlineXml, /<w:t>Aggregate liability<\/w:t>/);
  assert.match(settingsXml, /<w:trackRevisions\s*\/>/);
  const backupRoot = join(temporary, ".pi", "legal-workbench", "backups", "docx-redline");
  assert.equal(readdirSync(backupRoot).length, 1);
});

test("DOCX redline defaults to a pinned workspace-local Python runtime", () => {
  const skillRoot = join(root, "packages", "pi-commercial-legal", "skills", "legal-docx-redline");
  const skill = readFileSync(join(skillRoot, "SKILL.md"), "utf8");
  const requirements = readFileSync(join(skillRoot, "scripts", "requirements.txt"), "utf8");
  const setup = readFileSync(join(skillRoot, "scripts", "setup_docx_env.py"), "utf8");
  assert.match(skill, /\.pi\/legal-workbench\/venvs\/docx-redline/);
  assert.match(skill, /python-docx.*lxml/s);
  assert.match(requirements, /^python-docx==1\.2\.0$/m);
  assert.match(requirements, /^lxml==6\.1\.1$/m);
  assert.match(setup, /venv\.EnvBuilder/);
  assert.doesNotMatch(setup, /--user|site-packages/);
});

test("every imported domain package exposes at least one substantive skill", () => {
  for (const directory of sourcePackageDirectories.filter((directory) => !["pi-legal-core", "pi-commercial-legal"].includes(directory))) {
    assert.ok(skillNames(directory).length > 0, `${directory} is an empty shell`);
  }
});
