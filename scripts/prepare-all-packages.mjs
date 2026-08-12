import { copyFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSuite } from "./build-suite.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packagesRoot = join(root, "packages");

const suite = buildSuite();
for (const entry of readdirSync(packagesRoot, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const packageRoot = join(packagesRoot, entry.name);
  copyFileSync(join(root, "LICENSE"), join(packageRoot, "LICENSE"));
  copyFileSync(join(root, "NOTICE"), join(packageRoot, "NOTICE"));
}

console.log(`Prepared ${readdirSync(packagesRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).length} packages; suite has ${suite.skillCount} skills.`);
