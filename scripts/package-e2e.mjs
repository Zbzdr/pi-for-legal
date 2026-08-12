import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { RpcClient } from "@earendil-works/pi-coding-agent";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cliPath = join(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "cli.js");
const temporaryRoot = mkdtempSync(join(tmpdir(), "pi-legal-packages-e2e-"));
const version = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).version;
const sourcePackageDirectories = JSON.parse(readFileSync(join(root, "suite-packages.json"), "utf8")).packages;
const aliasByPackageDirectory = {
  "pi-legal-core": "core",
  "pi-commercial-legal": "commercial",
  "pi-privacy-legal": "privacy",
  "pi-regulatory-legal": "regulatory",
  "pi-ai-governance-legal": "ai-governance",
  "pi-employment-legal": "employment",
  "pi-corporate-legal": "corporate",
  "pi-litigation-legal": "litigation",
  "pi-ip-legal": "ip",
  "pi-product-legal": "product",
};

function manifest(packageDirectory) {
  return JSON.parse(readFileSync(join(root, "packages", packageDirectory, "package.json"), "utf8"));
}

function tarballBase(packageDirectory) {
  return manifest(packageDirectory).name.replace(/^@/, "").replaceAll("/", "-");
}

function expectedSkills(packageDirectories) {
  return new Set(packageDirectories.flatMap((packageDirectory) =>
    readdirSync(join(root, "packages", packageDirectory, "skills"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => `skill:${entry.name}`),
  ));
}

function unpack(packageDirectory) {
  const tarball = join(root, "dist", `${tarballBase(packageDirectory)}-${version}.tgz`);
  const unpackRoot = join(temporaryRoot, "unpacked", packageDirectory);
  mkdirSync(unpackRoot, { recursive: true });
  execFileSync("tar", ["-xzf", tarball, "-C", unpackRoot]);
  return join(unpackRoot, "package");
}

async function verifyProject(label, packagePaths, expected) {
  const projectRoot = join(temporaryRoot, "projects", label);
  const agentRoot = join(temporaryRoot, "agents", label);
  mkdirSync(projectRoot, { recursive: true });
  const environment = {
    ...process.env,
    PI_CODING_AGENT_DIR: agentRoot,
    PI_SKIP_VERSION_CHECK: "1",
    PI_TELEMETRY: "0",
  };

  for (const packagePath of packagePaths) {
    execFileSync(process.execPath, [cliPath, "install", "-l", packagePath, "--approve"], {
      cwd: projectRoot,
      env: environment,
      stdio: "ignore",
    });
  }

  const client = new RpcClient({
    cliPath,
    cwd: projectRoot,
    env: environment,
    args: ["--no-session", "--approve", "--offline", "--no-prompt-templates", "--no-themes", "--no-context-files"],
  });

  try {
    await client.start();
    const commands = await client.getCommands();
    const packageCommands = commands.filter((command) =>
      command.source === "skill" && packagePaths.some((path) => command.sourceInfo?.path?.startsWith(path)),
    );
    const names = new Set(packageCommands.map((command) => command.name));
    assert.deepEqual(names, expected, `${label}: unexpected skill set`);
    const unexpectedLegalSkills = commands.filter((command) =>
      command.source === "skill" && command.name.startsWith("skill:legal-") && !names.has(command.name),
    );
    assert.equal(unexpectedLegalSkills.length, 0, `${label}: unexpected legal skills from another source`);
    assert.equal(commands.filter((command) => command.source === "prompt").length, 0);
    assert.equal(
      commands.filter((command) => command.source === "extension" && command.sourceInfo?.source !== "inline").length,
      0,
    );
    return { label, packageCount: packagePaths.length, skillCount: names.size };
  } finally {
    await client.stop();
  }
}

async function verifyGlobal(label, packagePaths, expected) {
  const installRoot = join(temporaryRoot, "global-installers", label);
  const consumerRoot = join(temporaryRoot, "global-consumers", label);
  const agentRoot = join(temporaryRoot, "global-agents", label);
  mkdirSync(installRoot, { recursive: true });
  mkdirSync(consumerRoot, { recursive: true });
  const environment = {
    ...process.env,
    PI_CODING_AGENT_DIR: agentRoot,
    PI_SKIP_VERSION_CHECK: "1",
    PI_TELEMETRY: "0",
  };

  for (const packagePath of packagePaths) {
    execFileSync(process.execPath, [cliPath, "install", packagePath, "--approve"], {
      cwd: installRoot,
      env: environment,
      stdio: "ignore",
    });
  }
  assert.equal(existsSync(join(consumerRoot, ".pi", "settings.json")), false, `${label}: consumer must not need project settings`);

  const client = new RpcClient({
    cliPath,
    cwd: consumerRoot,
    env: environment,
    args: ["--no-session", "--approve", "--offline", "--no-prompt-templates", "--no-themes", "--no-context-files"],
  });

  try {
    await client.start();
    const commands = await client.getCommands();
    const names = new Set(commands
      .filter((command) => command.source === "skill" && command.name.startsWith("skill:legal-"))
      .map((command) => command.name));
    assert.deepEqual(names, expected, `${label}: global package was not available in a separate project`);
    return { label, scope: "global", packageCount: packagePaths.length, skillCount: names.size };
  } finally {
    await client.stop();
  }
}

try {
  const aliases = [...sourcePackageDirectories.map((directory) => aliasByPackageDirectory[directory]), "suite"];
  execFileSync(process.execPath, [join(root, "scripts", "pack-packages.mjs"), ...aliases], {
    cwd: root,
    stdio: "ignore",
  });

  const unpacked = Object.fromEntries(
    [...sourcePackageDirectories, "pi-legal-suite"].map((directory) => [directory, unpack(directory)]),
  );
  const results = [];
  for (const packageDirectory of sourcePackageDirectories) {
    results.push(await verifyProject(
      `${manifest(packageDirectory).name}-only`,
      [unpacked[packageDirectory]],
      expectedSkills([packageDirectory]),
    ));
  }

  const selected = ["pi-legal-core", "pi-privacy-legal", "pi-ai-governance-legal", "pi-product-legal"];
  results.push(await verifyProject(
    "selected-combination",
    selected.map((name) => unpacked[name]),
    expectedSkills(selected),
  ));
  results.push(await verifyProject(
    "suite-only",
    [unpacked["pi-legal-suite"]],
    expectedSkills(sourcePackageDirectories),
  ));
  const globalSelected = ["pi-legal-core", "pi-privacy-legal"];
  results.push(await verifyGlobal(
    "global-selected-combination",
    globalSelected.map((directory) => unpacked[directory]),
    expectedSkills(globalSelected),
  ));
  results.push(await verifyGlobal(
    "global-suite",
    [unpacked["pi-legal-suite"]],
    expectedSkills(sourcePackageDirectories),
  ));

  console.log(JSON.stringify({ ok: true, version, results }, null, 2));
} finally {
  rmSync(temporaryRoot, { recursive: true, force: true });
}
