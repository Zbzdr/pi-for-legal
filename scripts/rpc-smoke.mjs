import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { RpcClient } from "@earendil-works/pi-coding-agent";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cliPath = join(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
const temporaryRoot = mkdtempSync(join(tmpdir(), "pi-legal-rpc-smoke-"));
const packageDirectories = JSON.parse(readFileSync(join(root, "suite-packages.json"), "utf8")).packages;
const packageNames = packageDirectories.map((directory) =>
  JSON.parse(readFileSync(join(root, "packages", directory, "package.json"), "utf8")).name,
);
const skillPaths = packageDirectories.map((directory) => resolve(root, "packages", directory, "skills"));
const expected = packageDirectories.flatMap((packageDirectory) =>
  readdirSync(join(root, "packages", packageDirectory, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `skill:${entry.name}`),
).sort();

const args = [
  "--no-session",
  "--approve",
  "--offline",
  "--no-extensions",
  "--no-skills",
  ...skillPaths.flatMap((path) => ["--skill", path]),
  "--no-prompt-templates",
  "--no-themes",
  "--no-context-files",
];

const client = new RpcClient({
  cliPath,
  cwd: temporaryRoot,
  env: {
    PI_CODING_AGENT_DIR: join(temporaryRoot, "agent"),
    PI_SKIP_VERSION_CHECK: "1",
    PI_TELEMETRY: "0",
  },
  args,
});

try {
  await client.start();
  const commands = await client.getCommands();
  const skillCommands = commands.filter((command) => command.source === "skill");
  const names = skillCommands.map((command) => command.name).sort();

  assert.deepEqual(names, expected, "RPC discovery must expose the exact source-package union");
  const nonSkillCommands = commands.filter((command) => command.source !== "skill");
  assert.ok(
    nonSkillCommands.every((command) => command.sourceInfo?.source === "inline" && command.sourceInfo?.path?.startsWith("<inline:")),
    `isolated Pi must not expose external extension or prompt commands: ${JSON.stringify(nonSkillCommands)}`,
  );
  assert.ok(
    skillCommands.every((command) => command.sourceInfo?.source === "local" && command.sourceInfo?.scope === "temporary"),
    `skills must come from explicit CLI paths: ${JSON.stringify(skillCommands)}`,
  );
  assert.ok(
    skillCommands.every((command) => skillPaths.some((path) => command.sourceInfo?.path?.startsWith(path))),
    "RPC source paths must resolve inside a declared source package",
  );

  const state = await client.getState();
  assert.equal(state.isStreaming, false);

  console.log(JSON.stringify({
    ok: true,
    mode: "rpc",
    isolated: true,
    packages: packageNames,
    packageCount: packageNames.length,
    skillCount: names.length,
    commands: names,
    builtinCommands: nonSkillCommands.map((command) => command.name),
  }, null, 2));
} finally {
  await client.stop();
  rmSync(temporaryRoot, { recursive: true, force: true });
}
