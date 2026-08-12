import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
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
  assert.match(output, /11 packages, 86 unique source skills, suite union verified/);
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
  assert.equal(sourceSkills.length, 86);
  assert.equal(new Set(sourceSkills).size, 86);
  assert.deepEqual(skillNames("pi-legal-suite"), [...sourceSkills].sort());
});

test("every imported domain package exposes at least one substantive skill", () => {
  for (const directory of sourcePackageDirectories.filter((directory) => !["pi-legal-core", "pi-commercial-legal"].includes(directory))) {
    assert.ok(skillNames(directory).length > 0, `${directory} is an empty shell`);
  }
});
