import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildSuite } from "./build-suite.mjs";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = process.cwd();

if (process.argv.includes("--suite")) buildSuite();

copyFileSync(join(root, "LICENSE"), join(packageRoot, "LICENSE"));
copyFileSync(join(root, "NOTICE"), join(packageRoot, "NOTICE"));
