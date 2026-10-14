# Pi for Legal

> **Other languages / 其他语言**: [简体中文](README.zh.md)

Pi for Legal is an independent port of [Anthropic Claude for Legal](https://github.com/anthropics/claude-for-legal) to Pi. The primary development work on this project was done by ChatGPT5.6-sol.

The project is workspace-first by default: the package is installed in the current project, and practice profiles, matters, and working materials are also kept in the project directory. External retrieval and collaboration tools are configured by the user on demand.

## What it can do today

- Multi-jurisdiction legal research: identifies applicable law and hierarchies of authority, checks whether authorities are current and how they have been treated subsequently, and produces memos with source attribution;
- Commercial contracts: routes and reviews MSA, SaaS, NDA, vendor agreement, amendment, and renewal matters;
- Legal workflows: privacy, regulatory, AI governance, employment, corporate, litigation, IP, and product;
- Project-level setup, quick defaults, practice profiles, matter isolation, playbook learning, upgrade decisions, and business summaries;
- Approved DOCX tracked redlines through an available general document capability, with matter-local backups and verification requirements;
- Explicitly flags verification gaps when no reliable external source is available, rather than dressing up model memory as completed legal research.

The only maintained and published all-in-one package ships 89 skills and a project-level extension. It does not bundle MCP, web access, email, Slack, todo, or other Pi extensions.

Protected-leave registration and checking run on demand through `legal-employment-log-leave` and `legal-employment-leave-tracker`. The upstream agent's knowhow is bundled as a reference, not a required subagent. Records stay in the authorized active matter; unsupported deadlines remain pending. No scheduler or reminder service is installed. External automation can invoke Pi's CLI/RPC/SDK only after separately approved configuration.

DOCX redline follows the legal upstream's delegation model: the model reads an available general `docx` Skill or equivalent capability, plans surgical changes, and applies source-preservation and verification gates. This package does not bundle that external Skill, a mandatory redline engine, or a fixed Python runtime. If no suitable capability is available, it offers an approved local implementation plan or a Word-ready change table; it never installs dependencies silently.

## Quick start

Currently supported environments are macOS/Linux with `bash` and Unix `date`. Markdown document Git requires Git and Pi 1.1 or newer (Node.js 22.19+); Windows/PowerShell is not yet supported.

Install the package in the project directory where you want to use the legal workflows:

```bash
pi install -l npm:@zbzdr/pi-legal-suite
```

After starting Pi, run:

```text
/skill:legal-setup
```

Setup asks about your practice type, jurisdiction, review preferences, and data directory, and shows the exact paths before writing anything.

After completing setup as prompted, restart Pi or reload in the current Pi session:

```text
/reload
```

Then describe your task in the same or a new session; follow the prompts to select or create a matter, and begin research, review, or drafting.

## Markdown document Git (unreleased development workflow)

Use `/skill:legal-document-edit` for drafting and corrections. Workspace setup normally authorizes local Git for subsequent bound matters and records a confirmed author identity; repositories are created per matter when needed, not as one shared workspace repository. Legacy/manual-policy workspaces can still enroll individually. No per-edit commit approval is required.

Ordinary edits continue the current file in place, without a new branch/worktree every turn. Before substantive chapter drafting, record its file/heading original. When switching that chapter from logic a to logic b, retrieve the Git original/history and redraft from the source, rather than layering b onto a, unless explicitly asked to continue a. The drafting reference is independent of the new commit's parent, so other chapters retain their latest edits. Optional worktrees under `<matter>/outputs/revisions/<proposal>/` are for genuinely parallel proposals.

The existing extension checkpoints actual Markdown differences after native tools, nested codemode calls, and completed shell/script tools. Subjects use the staged diff and current request, with a labeled mechanical fallback. Ask about material uncertainty, not permission to save a reversible draft. Existing proposals and human/staged changes are preserved; nothing is automatically pushed. Lifecycle `matter.md`/`history.md`, structured records, profile/log/state maintenance, and binaries are outside document-Git scope.

DOCX is an expressly requested delivery artifact, not an automatic result of text editing. Prefer character, word, phrase, then sentence changes; lossless Markdown/DOCX round-tripping remains deferred. One shell/script tool call is one transaction; intermediate saves and arbitrary external editors are not individually checkpointed.

This workflow is not yet published to npm. Use a reviewed development checkout of `packages/pi-legal-suite`. Existing schema-4 workspaces with unchanged paths can add the Git policy and refresh managed `.pi/APPEND_SYSTEM.md` using the current [setup initializer](packages/pi-legal-suite/skills/legal-setup/SKILL.md), preserving populated profiles and matter files. Review setup's identity/scope authorization; Git retains deleted sensitive content and remote sharing remains separately authorized.

## What happens after setup

- An `AGENTS.md` is created at the project root and auto-loaded by Pi to hold your legal practice profile;
- `.pi/APPEND_SYSTEM.md` gets the fixed rules for the legal workspace appended, preserving any existing project rules;
- `matters/` and `logs/` are initialized at the project root, but no specific matter is created automatically; the visible `legal-workbench/` wrapper directory is no longer created;
- Each new session first asks whether to reuse or create a matter; materials and outputs then go under that matter's `outputs/`, while raw Pi sessions keep using the default location;
- Calendar dates, when genuinely needed, use the ordinary Unix `date` command; there is no dedicated time tool. Recording/commit dates never prove the date of an underlying legal event.

Since 0.5.0, the default visible directories have moved to `matters/` and `logs/` at the project root; old `legal-workbench/` visible directories are not migrated automatically.

From here you can describe a task directly, or invoke a skill explicitly:

```text
/skill:legal-research Compare the enforceability of this indemnity clause under New York and English law
/skill:legal-contract-review review ./contracts/vendor-msa.pdf
/skill:legal-docx-redline ./contracts/inbound-nda.docx
/skill:legal-litigation-matter-intake
/skill:legal-playbook-learning capture
/skill:legal-customize
```

All output is working draft material for review by a legal professional and does not constitute legal advice. Verify current law, case validity, and regulatory status thoroughly where relevant.

## Updates

In the project directory where the package is installed, run:

```bash
pi update npm:@zbzdr/pi-legal-suite
```

Or update all Pi packages installed in the current project at once:

```bash
pi update --extensions
```

(That command also updates any other Pi packages already installed in the project; it does not install packages that are not yet installed.)

After updating, type `/reload` in a running Pi, or restart Pi.

Versioned installs pin the version. For example, `npm:@zbzdr/pi-legal-suite@0.4.0` will not be auto-upgraded by the commands above; install the new version number instead:

```bash
pi install -l npm:@zbzdr/pi-legal-suite@<new-version>
```

Local project installs take precedence. Global installs without `-l` are a secondary support mode that makes the suite available in all of a user's Pi projects; setup, profiles, and matters are still maintained per current workspace.

## Upstream tracking

The latest recorded legal-upstream check found no changes since the initial mapping. To repeat it with a separate upstream checkout, run `npm run track:upstream -- <checkout> --fetch`. This reports changes without importing or merging them. See [the review process](docs/upstream-sync.md), [the recorded status](docs/upstream-status.json), and [verification scope and results](docs/verification-2026-10-13.md).

## Sources and license

This project is adapted from `claude-for-legal` revision `4a6c651899c97cc9140580363c73e0eb17379c2b`. Where skills, prompts, and reference templates contain upstream material, provenance and modification notes are preserved; see [docs/upstream-map.md](docs/upstream-map.md) for the detailed mapping. The current port is primarily Markdown/JSON workflows and does not bundle upstream third-party plugins or MCP connector implementations.

Upstream material is provided by Anthropic PBC under the Apache License 2.0; this project is likewise licensed under Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Pi for Legal has no affiliation with or endorsement from Anthropic; Claude, Anthropic, and third-party product names remain the property of their respective owners.

## Roadmap

- Optimize the strategy for isolating task context per session within the workspace;
- Deepen localized materials, source strategies, and specialized templates for CN and other jurisdictions;
- Improve DOCX capability mappings and validation evidence for complex tracked changes, comments, and format fidelity;
- Implement legal-research MCP integration and configuration, relying on third-party MCP adapters where necessary;
- Combine commonly used capabilities such as MCP, web access, todo, and ask-user-question into a single integrated package, so users can install one package per workspace and handle the main legal tasks.

These features will be implemented in stages.
