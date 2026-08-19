import { copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = process.cwd();

copyFileSync(join(root, "LICENSE"), join(packageRoot, "LICENSE"));
copyFileSync(join(root, "NOTICE"), join(packageRoot, "NOTICE"));
