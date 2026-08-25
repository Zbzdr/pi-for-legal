import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { discoverAndLoadExtensions, RpcClient } from "@earendil-works/pi-coding-agent";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const packageRoot = join(root, "packages", "pi-legal-suite");
const cliPath = join(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
const temporaryRoot = mkdtempSync(join(tmpdir(), "pi-legal-package-e2e-"));
const manifest = JSON.parse(readFileSync(join(packageRoot, "package.json"), "utf8"));
const tarballBase = manifest.name.replace(/^@/, "").replaceAll("/", "-");

try {
  execFileSync(process.execPath, [join(root, "scripts", "pack-packages.mjs")], { cwd: root, stdio: "ignore" });
  const tarball = join(root, "dist", `${tarballBase}-${manifest.version}.tgz`);
  assert.equal(existsSync(tarball), true);

  const unpackRoot = join(temporaryRoot, "unpacked");
  mkdirSync(unpackRoot, { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", unpackRoot]);
  const unpacked = join(unpackRoot, "package");
  const extensionPath = join(unpacked, "extensions", "legal-workbench.ts");
  const skillsRoot = join(unpacked, "skills");
  assert.equal(existsSync(extensionPath), true);
  assert.equal(existsSync(join(skillsRoot, "legal-setup", "scripts", "init_workspace.mjs")), true);
  assert.equal(existsSync(join(skillsRoot, "legal-setup", "references", "append-system-template.md")), true);
  const expected = new Set(readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => `skill:${entry.name}`));
  assert.equal(expected.size, 88);

  const projectRoot = join(temporaryRoot, "project");
  const agentRoot = join(temporaryRoot, "agent");
  mkdirSync(projectRoot, { recursive: true });
  const environment = {
    ...process.env,
    PI_CODING_AGENT_DIR: agentRoot,
    PI_SKIP_VERSION_CHECK: "1",
    PI_TELEMETRY: "0",
  };
  execFileSync(process.execPath, [cliPath, "install", "-l", unpacked, "--approve"], {
    cwd: projectRoot,
    env: environment,
    stdio: "ignore",
  });

  const loaded = await discoverAndLoadExtensions([extensionPath], projectRoot, join(agentRoot, "loader"));
  assert.deepEqual(loaded.errors, []);
  assert.equal(loaded.extensions[0].tools.has("legal_matter_session"), true);
  assert.equal(loaded.extensions[0].tools.has("legal_time"), true);

  const client = new RpcClient({
    cliPath,
    cwd: projectRoot,
    env: environment,
    args: ["--no-session", "--approve", "--offline", "--no-prompt-templates", "--no-themes", "--no-context-files"],
  });
  try {
    await client.start();
    const commands = await client.getCommands();
    const names = new Set(commands
      .filter((command) => command.source === "skill" && command.sourceInfo?.path?.startsWith(unpacked))
      .map((command) => command.name));
    assert.deepEqual(names, expected);
    const unexpectedLegalSkills = commands.filter((command) =>
      command.source === "skill" && command.name.startsWith("skill:legal-") && !names.has(command.name),
    );
    assert.equal(unexpectedLegalSkills.length, 0);
    assert.doesNotMatch(client.getStderr(), /Failed to load extension|extension load error/i);
  } finally {
    await client.stop();
  }

  console.log(JSON.stringify({ ok: true, package: manifest.name, version: manifest.version, skillCount: expected.size, extensionCount: 1 }, null, 2));
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
