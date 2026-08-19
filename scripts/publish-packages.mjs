import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const arguments_ = new Set(process.argv.slice(2));
const isDryRun = arguments_.has("--dry-run");
const isPublish = arguments_.has("--publish");

if (isDryRun === isPublish) {
  console.error("Choose exactly one mode: --dry-run or --publish");
  process.exit(2);
}

const packageDirectory = "pi-legal-suite";
const cache = join(root, "node_modules", ".cache", "pi-legal-npm");

const manifest = JSON.parse(readFileSync(join(root, "packages", packageDirectory, "package.json"), "utf8"));
if (manifest.name !== "@zbzdr/pi-legal-suite") throw new Error(`Refusing to publish unexpected package: ${manifest.name}`);
if (manifest.publishConfig?.access !== "public") throw new Error(`Package is not configured public: ${manifest.name}`);

const tarballBase = manifest.name.replace(/^@/, "").replaceAll("/", "-");
const tarball = join(root, "dist", `${tarballBase}-${manifest.version}.tgz`);
if (!existsSync(tarball)) throw new Error(`Missing tarball; run npm run pack first: ${tarball}`);

const args = [
  "publish",
  tarball,
  "--access",
  "public",
  "--registry",
  "https://registry.npmjs.org/",
  "--cache",
  cache,
];
if (isDryRun) args.push("--dry-run");
console.log(`${isDryRun ? "Checking" : "Publishing"} ${manifest.name}@${manifest.version}`);
execFileSync("npm", args, { cwd: root, stdio: "inherit" });
