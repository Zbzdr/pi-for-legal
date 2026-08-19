import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverAndLoadExtensions, RpcClient } from "@earendil-works/pi-coding-agent";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, "packages", "pi-legal-suite");
const cliPath = join(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
const temporaryRoot = mkdtempSync(join(tmpdir(), "pi-legal-rpc-smoke-"));
const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
const skillPath = resolve(packageRoot, "skills");
const extensionPath = resolve(packageRoot, "extensions", "legal-workbench.ts");
const expected = readdirSync(skillPath, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => `skill:${entry.name}`)
  .sort();

const client = new RpcClient({
  cliPath,
  cwd: temporaryRoot,
  env: {
    PI_CODING_AGENT_DIR: join(temporaryRoot, "agent"),
    PI_SKIP_VERSION_CHECK: "1",
    PI_TELEMETRY: "0",
  },
  args: [
    "--no-session",
    "--approve",
    "--offline",
    "--no-extensions",
    "--extension", extensionPath,
    "--no-skills",
    "--skill", skillPath,
    "--no-prompt-templates",
    "--no-themes",
    "--no-context-files",
  ],
});

try {
  const loaded = await discoverAndLoadExtensions([extensionPath], temporaryRoot, join(temporaryRoot, "loader-agent"));
  assert.deepEqual(loaded.errors, []);
  assert.equal(loaded.extensions.length, 1);
  assert.equal(loaded.extensions[0].tools.has("legal_matter_session"), true);

  await client.start();
  const commands = await client.getCommands();
  const names = commands.filter((command) => command.source === "skill").map((command) => command.name).sort();
  assert.deepEqual(names, expected);
  assert.equal(names.length, 88);
  assert.doesNotMatch(client.getStderr(), /Failed to load extension|extension load error/i);

  console.log(JSON.stringify({
    ok: true,
    mode: "rpc",
    package: manifest.name,
    skillCount: names.length,
    extensionCount: loaded.extensions.length,
    tools: [...loaded.extensions[0].tools.keys()],
  }, null, 2));
} finally {
  await client.stop();
  rmSync(temporaryRoot, { recursive: true, force: true });
}
