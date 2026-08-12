import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const aliases = {
  core: "pi-legal-core",
  commercial: "pi-commercial-legal",
  privacy: "pi-privacy-legal",
  regulatory: "pi-regulatory-legal",
  "ai-governance": "pi-ai-governance-legal",
  ai: "pi-ai-governance-legal",
  employment: "pi-employment-legal",
  corporate: "pi-corporate-legal",
  litigation: "pi-litigation-legal",
  ip: "pi-ip-legal",
  product: "pi-product-legal",
  suite: "pi-legal-suite",
};
const requested = process.argv.slice(2);

if (!requested.length) {
  console.error(`Choose one or more packages: ${Object.keys(aliases).join(", ")}`);
  process.exit(2);
}

const unknown = requested.filter((name) => !aliases[name]);
if (unknown.length) {
  console.error(`Unknown package alias: ${unknown.join(", ")}`);
  process.exit(2);
}

const destination = join(root, "dist");
const cache = join(root, "node_modules", ".cache", "pi-legal-npm");
mkdirSync(destination, { recursive: true });

for (const packageDirectory of [...new Set(requested.map((alias) => aliases[alias]))]) {
  execFileSync("npm", [
    "pack",
    join(root, "packages", packageDirectory),
    "--pack-destination",
    destination,
    "--cache",
    cache,
  ], { cwd: root, stdio: "inherit" });
}
