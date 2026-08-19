import { execFileSync } from "node:child_process";

const apply = process.argv.includes("--apply");
const message = "This package is no longer maintained. Install @zbzdr/pi-legal-suite instead.";
const packages = [
  "@zbzdr/pi-legal-core",
  "@zbzdr/pi-commercial-legal",
  "@zbzdr/pi-privacy-legal",
  "@zbzdr/pi-regulatory-legal",
  "@zbzdr/pi-ai-governance-legal",
  "@zbzdr/pi-employment-legal",
  "@zbzdr/pi-corporate-legal",
  "@zbzdr/pi-litigation-legal",
  "@zbzdr/pi-ip-legal",
  "@zbzdr/pi-product-legal",
];

for (const packageName of packages) {
  const spec = `${packageName}@*`;
  if (!apply) {
    console.log(`npm deprecate ${JSON.stringify(spec)} ${JSON.stringify(message)}`);
    continue;
  }
  console.log(`Deprecating ${spec}`);
  execFileSync("npm", [
    "deprecate",
    spec,
    message,
    "--registry",
    "https://registry.npmjs.org/",
  ], { stdio: "inherit" });
}

if (!apply) console.log("Dry run only. Re-run with --apply after publishing @zbzdr/pi-legal-suite@0.3.0.");
