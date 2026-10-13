#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const mappedDomains = new Set(["commercial-legal", "privacy-legal", "regulatory-legal", "ai-governance-legal", "employment-legal", "corporate-legal", "litigation-legal", "ip-legal", "product-legal"]);

function git(repo, ...args) {
  return execFileSync("git", ["-C", repo, ...args], {
    encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 8 * 1024 * 1024,
  }).trimEnd();
}

function optionalGit(repo, ...args) {
  try { return git(repo, ...args); } catch { return null; }
}

function commit(repo, ref) {
  return git(repo, "rev-parse", "--verify", "--end-of-options", `${ref}^{commit}`).trim();
}

function disposition(path) {
  const [domain] = path.split("/");
  if (path === "employment-legal/agents/leave-tracker.md") return "mapped-knowhow-review";
  if (!mappedDomains.has(domain)) return "outside-maintained-domains-review";
  if (path.includes("/agents/") || path.includes("/hooks/") || path.endsWith("/.mcp.json")) return "unbundled-integration-review";
  if (/\/skills\/(cold-start-interview|customize|matter-workspace)\//.test(path)) return "shared-core-review";
  if (path.includes("/skills/")) return "skill-review";
  return "profile-reference-or-documentation-review";
}

export function collectUpstreamStatus({ repo, initialRevision, reviewedRevision, target = "HEAD", sourcePaths = [], checkedAt = new Date().toISOString(), networkFetch = false }) {
  const initial = commit(repo, initialRevision);
  const reviewed = commit(repo, reviewedRevision);
  const observed = commit(repo, target);
  const [aheadBy, behindBy] = [
    Number(git(repo, "rev-list", "--count", `${initial}..${observed}`)),
    Number(git(repo, "rev-list", "--count", `${observed}..${initial}`)),
  ];
  const rawChanges = git(repo, "diff", "--no-renames", "--name-status", "-z", initial, observed, "--");
  const tokens = rawChanges ? rawChanges.split("\0").filter(Boolean) : [];
  if (tokens.length % 2 !== 0) throw new Error("Unexpected Git name/status framing");
  const changes = [];
  for (let i = 0; i < tokens.length; i += 2) {
    changes.push({ status: tokens[i], path: tokens[i + 1], disposition: disposition(tokens[i + 1]) });
  }
  const log = git(repo, "log", "--reverse", "--max-count=100", "--format=%H%x09%cI%x09%s", `${initial}..${observed}`);
  const commits = log ? log.split("\n").map((line) => {
    const [revision, committedAt, ...subject] = line.split("\t");
    return { revision, committedAt, subject: subject.join("\t") };
  }) : [];
  return {
    schemaVersion: 1,
    checkedAt,
    remoteUrl: optionalGit(repo, "remote", "get-url", "origin"),
    networkFetch,
    targetRef: target,
    initialRevision: initial,
    reviewedRevision: reviewed,
    observedRevision: observed,
    relationToInitial: aheadBy === 0 && behindBy === 0 ? "same" : aheadBy === 0 ? "behind" : behindBy === 0 ? "ahead" : "diverged",
    aheadBy,
    behindBy,
    changedFileCount: changes.length,
    commits,
    commitsTruncated: aheadBy > commits.length,
    changes,
    sourceBlobs: sourcePaths.map((path) => ({
      path,
      initial: optionalGit(repo, "rev-parse", "--verify", `${initial}:${path}`),
      reviewed: optionalGit(repo, "rev-parse", "--verify", `${reviewed}:${path}`),
      observed: optionalGit(repo, "rev-parse", "--verify", `${observed}:${path}`),
    })),
    policy: "Comparison only. No checkout, import, installation, or modification of Skills. All upstream changes require review before advancing the manifest pin; retain Pi local overrides and external licenses.",
  };
}

function parseArguments(argv) {
  const options = { fetch: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--fetch") options.fetch = true;
    else if (["--target", "--output"].includes(arg)) {
      const value = argv[++i];
      if (!value || value.startsWith("--")) throw new Error(`Missing value for ${arg}`);
      options[arg.slice(2)] = value;
    } else if (!arg.startsWith("-") && !options.repo) options.repo = arg;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!options.repo) throw new Error("Usage: node scripts/track-upstream.mjs <upstream-checkout> [--fetch] [--target <ref>] [--output <json-path>]");
  return options;
}

export function main(argv = process.argv.slice(2)) {
  const options = parseArguments(argv);
  const tracking = JSON.parse(readFileSync(resolve(root, "docs/upstream-tracking.json"), "utf8"));
  const manifest = JSON.parse(readFileSync(resolve(root, "packages/pi-legal-suite/package.json"), "utf8"));
  const repo = resolve(options.repo);
  const remoteUrl = git(repo, "remote", "get-url", "origin").trim();
  if (remoteUrl.replace(/\.git$/, "") !== tracking.repositoryUrl.replace(/\.git$/, "")) {
    throw new Error("Origin does not match the declared Claude for Legal upstream; refusing to label this checkout as that source");
  }
  if (options.fetch) git(repo, "fetch", "--quiet", "origin");
  const report = collectUpstreamStatus({
    repo,
    initialRevision: tracking.initialMapping.upstreamRevision,
    reviewedRevision: manifest.piLegal.upstreamRevision,
    target: options.target ?? (options.fetch ? `origin/${tracking.defaultBranch}` : "HEAD"),
    sourcePaths: tracking.sourcePaths,
    networkFetch: options.fetch,
  });
  const text = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) {
    const path = resolve(options.output);
    // Source checks and all Git comparisons finish before writing any report.
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text, "utf8");
  }
  process.stdout.write(text);
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
