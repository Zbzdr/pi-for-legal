#!/usr/bin/env node

import {
	existsSync,
	mkdirSync,
	readFileSync,
	realpathSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

function usage(message) {
	if (message) console.error(message);
	console.error("Usage: node init_workspace.mjs --workspace <path> --data-dir <visible-relative-path> [--phase initialize|complete] [--force-system] [--force-profile]");
	process.exit(2);
}

function parseArguments(argv) {
	const values = { phase: "initialize", forceSystem: false, forceProfile: false };
	for (let index = 0; index < argv.length; index += 1) {
		const argument = argv[index];
		if (argument === "--force-system") values.forceSystem = true;
		else if (argument === "--force-profile") values.forceProfile = true;
		else if (["--workspace", "--data-dir", "--phase"].includes(argument)) {
			const value = argv[index + 1];
			if (!value) usage(`Missing value for ${argument}`);
			values[argument.slice(2).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
			index += 1;
		} else usage(`Unknown argument: ${argument}`);
	}
	if (!values.workspace || !values.dataDir) usage("--workspace and --data-dir are required");
	if (!["initialize", "complete"].includes(values.phase)) usage("--phase must be initialize or complete");
	return values;
}

function isWithin(parent, child) {
	const rel = relative(parent, child);
	return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

function visibleWorkspacePath(workspace, input, label) {
	if (isAbsolute(input)) throw new Error(`${label} must be relative to the workspace`);
	const target = resolve(workspace, input);
	if (!isWithin(workspace, target) || target === workspace) throw new Error(`${label} must stay inside the workspace`);
	const rel = relative(workspace, target);
	if (rel.split(sep)[0]?.startsWith(".")) throw new Error(`${label} must be visible and cannot start with a dot-directory`);
	return { absolute: target, relative: rel.split(sep).join("/") };
}

function writeJsonAtomic(path, value) {
	mkdirSync(dirname(path), { recursive: true });
	const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
	writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
	renameSync(temporary, path);
}

function createOrConfirm(path, content, force, label) {
	if (!existsSync(path)) {
		writeFileSync(path, content, "utf8");
		return "created";
	}
	if (readFileSync(path, "utf8") === content) return "unchanged";
	if (!force) return "preserved";
	writeFileSync(path, content, "utf8");
	return "replaced";
}

function mergeManagedSystem(path, template) {
	const start = "<!-- pi-legal-workbench:start -->";
	const end = "<!-- pi-legal-workbench:end -->";
	if (!existsSync(path)) {
		writeFileSync(path, template, "utf8");
		return "created";
	}
	const existing = readFileSync(path, "utf8");
	const startIndex = existing.indexOf(start);
	const endIndex = existing.indexOf(end);
	if (startIndex >= 0 && endIndex > startIndex) {
		const next = `${existing.slice(0, startIndex)}${template}${existing.slice(endIndex + end.length)}`;
		if (next !== existing) writeFileSync(path, next, "utf8");
		return next === existing ? "unchanged" : "updated-managed-section";
	}
	writeFileSync(path, `${existing.trimEnd()}\n\n${template}`, "utf8");
	return "appended-managed-section";
}

const options = parseArguments(process.argv.slice(2));
if (!existsSync(options.workspace)) throw new Error(`Workspace does not exist: ${options.workspace}`);
const workspace = realpathSync(options.workspace);
const data = visibleWorkspacePath(workspace, options.dataDir, "dataDir");
const matterRoot = `${data.relative}/matters`;
const stateDir = join(workspace, ".pi", "legal-workbench");
const configPath = join(stateDir, "config.json");
const settingsPath = join(workspace, ".pi", "settings.json");
const systemPath = join(workspace, ".pi", "APPEND_SYSTEM.md");
const profilePath = join(stateDir, "profile.md");
const statusPath = join(stateDir, "status.json");
const indexPath = join(stateDir, "matter-index.json");
const scriptDir = dirname(fileURLToPath(import.meta.url));
const referencesDir = resolve(scriptDir, "..", "references");

mkdirSync(stateDir, { recursive: true });
for (const directory of [data.absolute, join(data.absolute, "practice"), join(data.absolute, "matters")]) {
	mkdirSync(directory, { recursive: true });
}

const config = {
	schemaVersion: 2,
	profilePath: ".pi/legal-workbench/profile.md",
	statusPath: ".pi/legal-workbench/status.json",
	indexPath: ".pi/legal-workbench/matter-index.json",
	dataDir: data.relative,
	matterRoot,
};

if (existsSync(configPath)) {
	const existing = JSON.parse(readFileSync(configPath, "utf8"));
	const { sessionDir: _legacySessionDir, ...existingWithoutSessionDir } = existing;
	if (JSON.stringify(existingWithoutSessionDir) !== JSON.stringify(config)) {
		throw new Error("config.json already exists with different paths or schema; migrate it explicitly instead of overwriting it");
	}
	if (_legacySessionDir !== undefined) writeJsonAtomic(configPath, config);
} else {
	writeJsonAtomic(configPath, config);
}

let sessionSettingMigration = "unchanged";
if (existsSync(settingsPath)) {
	const settings = JSON.parse(readFileSync(settingsPath, "utf8"));
	if (settings.sessionDir === `${data.relative}/sessions`) {
		delete settings.sessionDir;
		writeJsonAtomic(settingsPath, settings);
		sessionSettingMigration = "removed-legacy-managed-value";
	}
}

const systemTemplate = readFileSync(join(referencesDir, "append-system-template.md"), "utf8");
const systemResult = options.forceSystem
	? createOrConfirm(systemPath, systemTemplate, true, ".pi/APPEND_SYSTEM.md")
	: mergeManagedSystem(systemPath, systemTemplate);

const today = new Date().toISOString().slice(0, 10);
const profileTemplate = readFileSync(join(referencesDir, "profile-template.md"), "utf8").replaceAll("[date]", today);
const profileResult = createOrConfirm(profilePath, profileTemplate, options.forceProfile, "practice profile");

if (!existsSync(indexPath)) {
	writeJsonAtomic(indexPath, { schemaVersion: 1, updatedAt: new Date().toISOString(), matters: [] });
}

const setupStatus = options.phase === "complete" ? "complete" : "in-progress";
writeJsonAtomic(statusPath, { schemaVersion: 2, setupStatus, lastUpdated: new Date().toISOString() });

const workspaceReadme = join(data.absolute, "README.md");
if (!existsSync(workspaceReadme)) {
	writeFileSync(workspaceReadme, `# Legal Workbench\n\n- \`matters/\`: substantive files separated by matter\n- \`practice/\`: approved reusable, non-client-specific material\n\nConfiguration and the metadata-only matter index are stored under \`.pi/legal-workbench/\`. Pi stores raw sessions in its default session location.\n`, "utf8");
}

console.log(JSON.stringify({
	ok: true,
	phase: options.phase,
	paths: config,
	sessionSettingMigration,
	systemPrompt: systemResult,
	profile: profileResult,
}, null, 2));
