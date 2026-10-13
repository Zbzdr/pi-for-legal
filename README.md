# Pi for Legal

> **Other languages / 其他语言**: [简体中文](README.zh.md)

Pi for Legal is an independent port of [Anthropic Claude for Legal](https://github.com/anthropics/claude-for-legal) to Pi. The primary development work on this project was done by ChatGPT5.6-sol.

The project is workspace-first by default: the package is installed in the current project, and practice profiles, matters, and working materials are also kept in the project directory. External retrieval and collaboration tools are configured by the user on demand.

## What it can do today

- Multi-jurisdiction legal research: identifies applicable law and hierarchies of authority, checks whether authorities are current and how they have been treated subsequently, and produces memos with source attribution;
- Commercial contracts: routes and reviews MSA, SaaS, NDA, vendor agreement, amendment, and renewal matters;
- Legal workflows: privacy, regulatory, AI governance, employment, corporate, litigation, IP, and product;
- Project-level setup, quick defaults, practice profiles, matter isolation, playbook learning, upgrade decisions, and business summaries;
- Lightweight DOCX tracked redlines with automatic backup, generated after confirmation;
- Explicitly flags verification gaps when no reliable external source is available, rather than dressing up model memory as completed legal research.

The only maintained and published all-in-one package ships 88 skills and a project-level extension. It does not bundle MCP, web access, email, Slack, todo, or other Pi extensions.

Two of those 88 skills, `legal-employment-log-leave` and `legal-employment-leave-tracker`, are currently deferred: explicit invocation explains the limitation without registering leave, calculating deadlines, or promising reminders. They are excluded from automatic model selection; existing personnel records are not changed.

The first time DOCX redline is used, a Python virtual environment is created at `.pi/legal-workbench/venvs/docx-redline/` in the current project and, after user confirmation, pinned versions of `python-docx` and `lxml` are installed; the system Python is never modified.

## Quick start

Currently supported environments include macOS and Linux — anything with `bash` and the Unix `date` command. Setup, the matter extension, and the date utilities get the local calendar date via `bash date`; Windows/PowerShell is not yet in scope and will be added later.

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

## What happens after setup

- An `AGENTS.md` is created at the project root and auto-loaded by Pi to hold your legal practice profile;
- `.pi/APPEND_SYSTEM.md` gets the fixed rules for the legal workspace appended, preserving any existing project rules;
- `matters/` and `logs/` are initialized at the project root, but no specific matter is created automatically; the visible `legal-workbench/` wrapper directory is no longer created;
- Each new session first asks whether to reuse or create a matter; materials and outputs then go under that matter's `outputs/`, while raw Pi sessions keep using the default location;
- When "today" must be recorded or report dates generated, the extension provides `legal_time`, which reads the short `YYYY-MM-DD` format from Unix `date`; it only reflects the system-recorded date and does not establish that the underlying legal event occurred on that day.

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

## Sources and license

This project is adapted from `claude-for-legal` revision `4a6c651889c97cc9140580363c73e0eb17379c2b`. Where skills, prompts, and reference templates contain upstream material, provenance and modification notes are preserved; see [docs/upstream-map.md](docs/upstream-map.md) for the detailed mapping. The current port is primarily Markdown/JSON workflows and does not bundle upstream third-party plugins or MCP connector implementations.

Upstream material is provided by Anthropic PBC under the Apache License 2.0; this project is likewise licensed under Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE). Pi for Legal has no affiliation with or endorsement from Anthropic; Claude, Anthropic, and third-party product names remain the property of their respective owners.

## Roadmap

- Optimize the strategy for isolating task context per session within the workspace;
- Deepen localized materials, source strategies, and specialized templates for CN and other jurisdictions;
- Move from lightweight precise replacement to complex DOCX redlines, comments, and format fidelity;
- Implement legal-research MCP integration and configuration, relying on third-party MCP adapters where necessary;
- Combine commonly used capabilities such as MCP, web access, todo, and ask-user-question into a single integrated package, so users can install one package per workspace and handle the main legal tasks.

These features will be implemented in stages.
