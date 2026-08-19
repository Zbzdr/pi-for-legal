import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import {
	existsSync,
	mkdirSync,
	readFileSync,
	realpathSync,
	renameSync,
	writeFileSync,
} from "node:fs";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

const CONFIG_PATH = ".pi/legal-workbench/config.json";
const BINDING_ENTRY = "pi-legal-matter-binding";
const GENERIC_ISSUES = new Set([
	"agreement",
	"contract",
	"legal",
	"matter",
	"memo",
	"research",
	"review",
	"合同",
	"审查",
	"法律",
	"事务",
	"研究",
]);

interface WorkbenchConfig {
	schemaVersion: 2;
	profilePath: string;
	statusPath: string;
	indexPath: string;
	dataDir: string;
	matterRoot: string;
}

interface MatterRecord {
	slug: string;
	name: string;
	client: string;
	clientAliases: string[];
	jurisdictions: string[];
	issueKeywords: string[];
	status: "active" | "closed";
	path: string;
	openedAt: string;
	updatedAt: string;
}

interface MatterIndex {
	schemaVersion: 1;
	updatedAt: string;
	matters: MatterRecord[];
}

interface WorkbenchStatus {
	schemaVersion: 2;
	setupStatus: "not-started" | "in-progress" | "complete";
	lastUpdated: string;
}

interface MatterBinding {
	slug: string;
	path: string;
	name: string;
	boundAt: string;
}

function jsonResult(text: string, details: Record<string, unknown> = {}) {
	return { content: [{ type: "text" as const, text }], details };
}

function readJson<T>(path: string): T {
	return JSON.parse(readFileSync(path, "utf8")) as T;
}

function writeJsonAtomic(path: string, value: unknown): void {
	mkdirSync(dirname(path), { recursive: true });
	const temporary = `${path}.tmp-${process.pid}-${Date.now()}`;
	writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
	renameSync(temporary, path);
}

function isWithin(parent: string, child: string): boolean {
	const rel = relative(parent, child);
	return rel === "" || (!rel.startsWith(`..${sep}`) && rel !== ".." && !isAbsolute(rel));
}

function workspaceRelative(cwd: string, path: string): string {
	return relative(realpathSync(cwd), path).split(sep).join("/");
}

function resolveWorkspacePath(cwd: string, input: string, label: string, visible = false): string {
	if (!input?.trim()) throw new Error(`${label} is required`);
	const workspace = realpathSync(cwd);
	const target = isAbsolute(input) ? resolve(input) : resolve(workspace, input);

	let existing = target;
	while (!existsSync(existing) && existing !== dirname(existing)) existing = dirname(existing);
	const resolvedExisting = realpathSync(existing);
	const resolvedTarget = resolve(resolvedExisting, relative(existing, target));
	if (!isWithin(workspace, resolvedTarget) || resolvedTarget === workspace) {
		throw new Error(`${label} must stay inside the current workspace`);
	}
	const rel = relative(workspace, resolvedTarget);
	if (visible && rel.split(sep)[0]?.startsWith(".")) {
		throw new Error(`${label} must use a visible workspace directory, not a dot-directory`);
	}
	return resolvedTarget;
}

function loadConfig(cwd: string): WorkbenchConfig | undefined {
	const path = resolve(cwd, CONFIG_PATH);
	if (!existsSync(path)) return undefined;
	const config = readJson<WorkbenchConfig>(path);
	if (config.schemaVersion !== 2) throw new Error("Legal workbench config needs migration through /skill:legal-setup");
	for (const key of ["profilePath", "statusPath", "indexPath", "dataDir", "matterRoot"] as const) {
		if (typeof config[key] !== "string" || !config[key]) throw new Error(`Invalid legal workbench config field: ${key}`);
	}
	resolveWorkspacePath(cwd, config.profilePath, "profilePath");
	resolveWorkspacePath(cwd, config.statusPath, "statusPath");
	resolveWorkspacePath(cwd, config.indexPath, "indexPath");
	resolveWorkspacePath(cwd, config.dataDir, "dataDir", true);
	resolveWorkspacePath(cwd, config.matterRoot, "matterRoot", true);
	return config;
}

function loadStatus(cwd: string, config: WorkbenchConfig): WorkbenchStatus {
	const path = resolveWorkspacePath(cwd, config.statusPath, "statusPath");
	return existsSync(path)
		? readJson<WorkbenchStatus>(path)
		: { schemaVersion: 2, setupStatus: "not-started", lastUpdated: new Date().toISOString() };
}

function loadIndex(cwd: string, config: WorkbenchConfig): MatterIndex {
	const path = resolveWorkspacePath(cwd, config.indexPath, "indexPath");
	if (!existsSync(path)) return { schemaVersion: 1, updatedAt: new Date().toISOString(), matters: [] };
	const index = readJson<MatterIndex>(path);
	if (index.schemaVersion !== 1 || !Array.isArray(index.matters)) throw new Error("Invalid legal matter index");
	return index;
}

function normalize(value: string): string {
	return value.normalize("NFKC").toLocaleLowerCase().replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function explicitlyContains(prompt: string, term: string): boolean {
	const needle = normalize(term);
	if (!needle) return false;
	if (/^[a-z0-9][a-z0-9 .&'/-]*$/i.test(needle)) {
		return new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(needle)}($|[^\\p{L}\\p{N}])`, "iu").test(prompt);
	}
	return prompt.includes(needle);
}

function matchingMatters(promptText: string, index: MatterIndex): Array<MatterRecord & { matchedOn: string[] }> {
	const prompt = normalize(promptText);
	return index.matters
		.filter((matter) => matter.status === "active")
		.map((matter) => {
			const identityTerms = [matter.slug, matter.name].filter((term) => explicitlyContains(prompt, term));
			const clientTerms = [matter.client, ...matter.clientAliases].filter((term) => explicitlyContains(prompt, term));
			const jurisdictions = matter.jurisdictions.filter((term) => explicitlyContains(prompt, term));
			const issues = matter.issueKeywords.filter((term) =>
				!GENERIC_ISSUES.has(normalize(term)) && explicitlyContains(prompt, term),
			);
			const matchedOn = [...identityTerms, ...clientTerms, ...jurisdictions, ...issues];
			const sufficientlySpecific = identityTerms.length > 0 || clientTerms.length > 0 ||
				(jurisdictions.length > 0 && issues.length > 0);
			return sufficientlySpecific ? { ...matter, matchedOn } : undefined;
		})
		.filter((matter): matter is MatterRecord & { matchedOn: string[] } => matter !== undefined)
		.slice(0, 5);
}

function sessionBinding(ctx: ExtensionContext): MatterBinding | undefined {
	let binding: MatterBinding | undefined;
	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type === "custom" && entry.customType === BINDING_ENTRY) {
			binding = entry.data === null ? undefined : entry.data as MatterBinding;
		}
	}
	return binding;
}

function validatedSessionBinding(ctx: ExtensionContext): MatterBinding | undefined {
	const binding = sessionBinding(ctx);
	if (!binding) return undefined;
	try {
		const config = loadConfig(ctx.cwd);
		if (!config) return undefined;
		const record = loadIndex(ctx.cwd, config).matters.find((matter) =>
			matter.slug === binding.slug && matter.path === binding.path && matter.status === "active",
		);
		return record ? binding : undefined;
	} catch {
		return undefined;
	}
}

function appendSessionToReadme(readmePath: string, sessionId: string, boundAt: string): void {
	let content = readFileSync(readmePath, "utf8");
	if (content.includes(`| ${sessionId} |`)) return;
	const marker = "<!-- pi-legal:sessions:end -->";
	const row = `| ${sessionId} | ${boundAt.slice(0, 10)} | active |\n`;
	if (!content.includes(marker)) throw new Error(`Matter README is missing session marker: ${readmePath}`);
	content = content.replace(marker, `${row}${marker}`);
	writeFileSync(readmePath, content, "utf8");
}

function matterReadme(record: MatterRecord, scope: string): string {
	return `# Matter: ${record.name}\n\n` +
		`- Slug: ${record.slug}\n` +
		`- Client/organization: ${record.client || "Not specified"}\n` +
		`- Status: ${record.status}\n` +
		`- Opened: ${record.openedAt.slice(0, 10)}\n` +
		`- Jurisdictions/forums: ${record.jurisdictions.join(", ") || "Not specified"}\n` +
		`- Legal issues: ${record.issueKeywords.join(", ") || "Not specified"}\n` +
		`- Scope: ${scope || "Not specified"}\n\n` +
		`## Current State\n\n- Objectives:\n- Material facts:\n- Open questions:\n- Deadlines:\n- Next action:\n\n` +
		`## Working Directories\n\n` +
		`- \`sources/\`: source documents and fetched material\n` +
		`- \`research/\`: research notes and authorities\n` +
		`- \`work-product/\`: memos, reviews, drafts, redlines, and deliverables\n` +
		`## Associated Pi Sessions\n\n| Session ID | Bound | Status |\n|---|---|---|\n` +
		`<!-- pi-legal:sessions:start -->\n<!-- pi-legal:sessions:end -->\n\n` +
		`## Work Product Index\n\n| Date | Deliverable | Path | Status |\n|---|---|---|---|\n`;
}

function replaceMatterStatus(path: string, status: MatterRecord["status"]): void {
	const content = readFileSync(path, "utf8");
	if (!/^- Status: (?:active|closed)$/m.test(content)) throw new Error(`Matter file has no managed status line: ${path}`);
	writeFileSync(path, content.replace(/^- Status: (?:active|closed)$/m, `- Status: ${status}`), "utf8");
}

function bindMatter(pi: ExtensionAPI, ctx: ExtensionContext, config: WorkbenchConfig, record: MatterRecord): MatterBinding {
	const matterPath = resolveWorkspacePath(ctx.cwd, record.path, "matter path", true);
	const matterRoot = resolveWorkspacePath(ctx.cwd, config.matterRoot, "matterRoot", true);
	if (!isWithin(matterRoot, matterPath)) throw new Error("Indexed matter path is outside matterRoot");
	if (!existsSync(matterPath)) throw new Error(`Matter directory does not exist: ${record.path}`);
	const readmePath = join(matterPath, "README.md");
	if (!existsSync(readmePath)) throw new Error(`Matter README does not exist: ${record.path}/README.md`);

	const boundAt = new Date().toISOString();
	const sessionId = ctx.sessionManager.getSessionId();
	appendSessionToReadme(readmePath, sessionId, boundAt);

	const binding = { slug: record.slug, path: record.path, name: record.name, boundAt };
	pi.appendEntry(BINDING_ENTRY, binding);
	pi.setSessionName(`${record.slug}: ${record.name}`.slice(0, 80));
	return binding;
}

const matterParameters = {
	type: "object",
	additionalProperties: false,
	required: ["action"],
	properties: {
		action: { type: "string", enum: ["status", "list", "create", "bind", "close"] },
		slug: { type: "string", description: "Lowercase kebab-case matter slug for create or bind" },
		name: { type: "string", description: "Human-readable matter name for create" },
		client: { type: "string", description: "Client or internal organization name for create" },
		clientAliases: {
			type: "array",
			items: { type: "string" },
			description: "Explicit client aliases used for future metadata-only matching",
		},
		jurisdictions: { type: "array", items: { type: "string" }, description: "Matter jurisdictions or forums" },
		issueKeywords: {
			type: "array",
			items: { type: "string" },
			description: "Specific legal issues; avoid generic words such as contract or review",
		},
		scope: { type: "string", description: "Short engagement or internal matter scope" },
		confirmed: { type: "boolean", description: "Must be true after the user expressly chooses create or bind" },
	},
} as any;

export default function legalWorkbench(pi: ExtensionAPI): void {
	let bootstrapPending = false;
	let activeBinding: MatterBinding | undefined;

	pi.on("session_start", (_event, ctx) => {
		activeBinding = validatedSessionBinding(ctx);
		bootstrapPending = !ctx.sessionManager.getEntries().some((entry) =>
			entry.type === "message" && (entry.message.role === "user" || entry.message.role === "assistant"),
		);
	});

	pi.on("session_tree", (_event, ctx) => {
		activeBinding = validatedSessionBinding(ctx);
	});

	pi.on("before_agent_start", (event, ctx) => {
		if (!bootstrapPending) return;
		bootstrapPending = false;

		try {
			const config = loadConfig(ctx.cwd);
			if (!config) {
				return {
					systemPrompt: `${event.systemPrompt}\n\n## Pi Legal Session Bootstrap\nThis workspace has no project-local legal setup. Route the user to /skill:legal-setup before creating a matter or doing substantive legal work. Do not choose storage paths silently.`,
				};
			}
			const status = loadStatus(ctx.cwd, config);
			if (status.setupStatus !== "complete") {
				return {
					systemPrompt: `${event.systemPrompt}\n\n## Pi Legal Session Bootstrap\nLegal setup status is ${status.setupStatus}. Continue /skill:legal-setup before substantive legal work.`,
				};
			}
			if (activeBinding) return;

			const candidates = matchingMatters(event.prompt, loadIndex(ctx.cwd, config));
			const candidateText = candidates.length
				? `Only these indexed matters matched explicit metadata in the first prompt:\n${candidates.map((matter) =>
					`- ${matter.slug}: ${matter.name}; client ${matter.client || "not specified"}; matched ${matter.matchedOn.join(", ")}`,
				).join("\n")}\nAsk whether to bind this session to one of them or create a new matter.`
				: "No indexed matter matched sufficiently specific metadata in the first prompt. Do not reveal or inspect unrelated matters. Ask whether to create a new matter or let the user identify an existing matter by slug.";

			return {
				systemPrompt: `${event.systemPrompt}\n\n## Pi Legal Session Bootstrap\nThis is the first user turn of a new, unbound legal session. Before substantive work, ask one concise matter-selection question. ${candidateText} Use legal_matter_session only after the user chooses.`,
			};
		} catch (error) {
			return {
				systemPrompt: `${event.systemPrompt}\n\n## Pi Legal Session Bootstrap\nLegal workbench state could not be loaded: ${error instanceof Error ? error.message : String(error)}. Stop substantive work and route to /skill:legal-setup for repair.`,
			};
		}
	});

	pi.registerTool({
		name: "legal_matter_session",
		label: "Legal matter session",
		description: "Inspect legal workspace status, list matter metadata on explicit request, or create, bind, and close a visible matter. Creation, binding, and closing require confirmed=true after the user chooses.",
		promptSnippet: "Create or bind the current session to a project-local legal matter after user confirmation.",
		promptGuidelines: [
			"Before substantive legal work in a configured workspace, bind the session to a matter with legal_matter_session.",
			"Do not list or inspect unrelated matters merely to guess context; use candidates injected on the first turn or an explicit user request.",
		],
		parameters: matterParameters,
		executionMode: "sequential",

		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			try {
				const config = loadConfig(ctx.cwd);
				if (!config) return jsonResult("Legal workbench is not initialized. Run /skill:legal-setup.", { error: true });
				const status = loadStatus(ctx.cwd, config);
				const index = loadIndex(ctx.cwd, config);

				if (params.action === "status") {
					return jsonResult(JSON.stringify({ setupStatus: status.setupStatus, activeMatter: activeBinding ?? null }, null, 2), {
						setupStatus: status.setupStatus,
						activeMatter: activeBinding ?? null,
					});
				}
				if (status.setupStatus !== "complete") {
					return jsonResult(`Legal setup is ${status.setupStatus}. Complete /skill:legal-setup first.`, { error: true });
				}
				if (params.action === "list") {
					const matters = index.matters.map(({ slug, name, client, jurisdictions, issueKeywords, status: matterStatus, path }) => ({
						slug, name, client, jurisdictions, issueKeywords, status: matterStatus, path,
					}));
					return jsonResult(matters.length ? JSON.stringify(matters, null, 2) : "No indexed matters.", { matters });
				}
				if (!params.confirmed) return jsonResult("User confirmation is required before creating or binding a matter.", { error: true });
				if (!params.slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(params.slug)) {
					return jsonResult("A lowercase kebab-case slug is required.", { error: true });
				}

				let record = index.matters.find((matter) => matter.slug === params.slug);
				if (params.action === "close") {
					if (!record || record.status !== "active") return jsonResult(`Active matter not found: ${params.slug}`, { error: true });
					const matterPath = resolveWorkspacePath(ctx.cwd, record.path, "matter path", true);
					const matterRoot = resolveWorkspacePath(ctx.cwd, config.matterRoot, "matterRoot", true);
					if (!isWithin(matterRoot, matterPath)) throw new Error("Indexed matter path is outside matterRoot");
					const now = new Date().toISOString();
					record.status = "closed";
					record.updatedAt = now;
					for (const filename of ["README.md", "matter.md"]) replaceMatterStatus(join(matterPath, filename), "closed");
					const historyPath = join(matterPath, "history.md");
					writeFileSync(historyPath, `${readFileSync(historyPath, "utf8").trimEnd()}\n- ${now} Matter closed; files retained in place.\n`, "utf8");
					index.updatedAt = now;
					writeJsonAtomic(resolveWorkspacePath(ctx.cwd, config.indexPath, "indexPath"), index);
					if (activeBinding?.slug === record.slug) {
						activeBinding = undefined;
						pi.appendEntry(BINDING_ENTRY, null);
					}
					return jsonResult(`Matter closed: ${record.slug}. All files remain at ${record.path}. Start or bind another matter before further substantive writes.`, {
						closedMatter: record.slug,
					});
				}
				if (params.action === "create") {
					if (record) return jsonResult(`Matter already exists: ${params.slug}. Bind it instead.`, { error: true });
					if (!params.name?.trim()) return jsonResult("Matter name is required for create.", { error: true });
					const matterRoot = resolveWorkspacePath(ctx.cwd, config.matterRoot, "matterRoot", true);
					const matterPath = resolveWorkspacePath(ctx.cwd, join(config.matterRoot, params.slug), "matter path", true);
					if (!isWithin(matterRoot, matterPath)) throw new Error("Matter path escapes matterRoot");
					if (existsSync(matterPath)) return jsonResult(`Matter directory already exists but is not indexed: ${relative(ctx.cwd, matterPath)}. Resolve it manually.`, { error: true });

					const now = new Date().toISOString();
					record = {
						slug: params.slug,
						name: params.name.trim(),
						client: params.client?.trim() ?? "",
						clientAliases: [...new Set((params.clientAliases ?? []).map((value) => value.trim()).filter(Boolean))],
						jurisdictions: [...new Set((params.jurisdictions ?? []).map((value) => value.trim()).filter(Boolean))],
						issueKeywords: [...new Set((params.issueKeywords ?? []).map((value) => value.trim()).filter(Boolean))],
						status: "active",
						path: workspaceRelative(ctx.cwd, matterPath),
						openedAt: now,
						updatedAt: now,
					};
					for (const directory of ["sources", "research", "work-product"]) {
						mkdirSync(join(matterPath, directory), { recursive: true });
					}
					writeFileSync(join(matterPath, "README.md"), matterReadme(record, params.scope?.trim() ?? ""), "utf8");
					writeFileSync(join(matterPath, "matter.md"), matterReadme(record, params.scope?.trim() ?? ""), "utf8");
					writeFileSync(join(matterPath, "history.md"), `# Matter History\n\n- ${now} Matter created.\n`, "utf8");
					writeFileSync(join(matterPath, "notes.md"), "# Matter Notes\n\n", "utf8");
					index.matters.push(record);
					index.updatedAt = now;
					writeJsonAtomic(resolveWorkspacePath(ctx.cwd, config.indexPath, "indexPath"), index);
				}

				if (!record || record.status !== "active") return jsonResult(`Active matter not found: ${params.slug}`, { error: true });
				activeBinding = bindMatter(pi, ctx, config, record);
				return jsonResult(`Session bound to ${record.slug}. Keep substantive legal files under ${record.path}.`, {
					activeMatter: activeBinding,
				});
			} catch (error) {
				return jsonResult(`Legal matter operation failed: ${error instanceof Error ? error.message : String(error)}`, { error: true });
			}
		},
	});

	pi.on("tool_call", (event, ctx) => {
		if (event.toolName !== "write" && event.toolName !== "edit") return;
		try {
			const config = loadConfig(ctx.cwd);
			if (!config || loadStatus(ctx.cwd, config).setupStatus !== "complete") return;
			const inputPath = typeof event.input.path === "string" ? event.input.path : "";
			if (!inputPath) return { block: true, reason: "Legal workspace write/edit call has no path" };
			const target = resolveWorkspacePath(ctx.cwd, inputPath, "write path");
			const allowedControlFiles = [CONFIG_PATH, config.profilePath, config.statusPath, config.indexPath, ".pi/APPEND_SYSTEM.md", ".pi/settings.json"]
				.map((path) => resolveWorkspacePath(ctx.cwd, path, "control path"));
			const practiceRoot = resolveWorkspacePath(ctx.cwd, join(config.dataDir, "practice"), "practice directory", true);
			const matterRoot = activeBinding
				? resolveWorkspacePath(ctx.cwd, activeBinding.path, "active matter path", true)
				: undefined;
			if (allowedControlFiles.includes(target) || isWithin(practiceRoot, target) || (matterRoot && isWithin(matterRoot, target))) return;
			return {
				block: true,
				reason: activeBinding
					? `Substantive legal writes must stay under the active matter: ${activeBinding.path}`
					: "Bind this session to a legal matter before writing substantive files",
			};
		} catch (error) {
			return { block: true, reason: `Legal workspace path guard failed: ${error instanceof Error ? error.message : String(error)}` };
		}
	});
}
