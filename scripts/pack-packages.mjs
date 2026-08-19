import { execFileSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const destination = join(root, "dist");
const cache = join(root, "node_modules", ".cache", "pi-legal-npm");
mkdirSync(destination, { recursive: true });

execFileSync("npm", [
  "pack",
  join(root, "packages", "pi-legal-suite"),
  "--pack-destination",
  destination,
  "--cache",
  cache,
], { cwd: root, stdio: "inherit" });
