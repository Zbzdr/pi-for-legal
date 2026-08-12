import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));

export function buildSuite() {
  const config = JSON.parse(readFileSync(join(root, "suite-packages.json"), "utf8"));
  const destination = join(root, "packages", "pi-legal-suite", "skills");
  const names = new Set();

  rmSync(destination, { recursive: true, force: true });
  mkdirSync(destination, { recursive: true });

  for (const packageDirectory of config.packages) {
    const source = join(root, "packages", packageDirectory, "skills");
    if (!existsSync(source)) throw new Error(`Suite source has no skills directory: ${packageDirectory}`);

    for (const entry of readdirSync(source, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (names.has(entry.name)) throw new Error(`Duplicate suite skill name: ${entry.name}`);
      names.add(entry.name);
      cpSync(join(source, entry.name), join(destination, entry.name), { recursive: true });
    }
  }

  return { packageCount: config.packages.length, skillCount: names.size, packages: config.packages };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const result = buildSuite();
  console.log(`Built @zbzdr/pi-legal-suite from ${result.packageCount} packages with ${result.skillCount} skills.`);
}
