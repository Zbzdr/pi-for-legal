# Upstream adaptation map

Packages are adapted from Anthropic's `claude-for-legal` revision `4a6c651889c97cc9140580363c73e0eb17379c2b` (2026-07-23).

## Package boundary

Only `@zbzdr/pi-legal-suite` is maintained and published. Its `skills/` directory contains the shared, commercial, privacy, regulatory, AI governance, employment, corporate, litigation, IP, and product workflows; its `extensions/` directory contains the single lifecycle extension.

The former core and domain directories remain private historical snapshots during the transition. They are not npm workspaces, test inputs, build inputs, or publish targets. Each imported domain omits its duplicate `cold-start-interview`, `customize`, and `matter-workspace`; those workflows are centralized in the suite.

## Preserved design

- profile/playbook-based work instead of invented house positions;
- source manifests, exact quotations, pinpoints, coverage notes, and explicit missing materials;
- separate legal rule, company policy, negotiation preference, business impact, and open fact;
- source currency checks, adverse authority, uncertainty, and professional-judgment gates;
- project-local trackers and isolated matter state;
- recoverable drafts before consequential actions;
- provisional/fallback workflows when an external system is absent.

## Pi-specific changes

- Claude commands are Agent Skills commands (`/skill:<domain-prefixed-name>`).
- Claude global profile paths resolve through project `.pi/legal-workbench/config.json`.
- Pi-standard frontmatter is retained; upstream internal workers use `disable-model-invocation: true` for progressive disclosure and are read by their public router or mode Skill;
- MCP declarations, hooks, agents, scheduled tasks, and vendor integrations are not packaged;
- skills use visible capabilities, but never infer that a connector works without a successful call;
- file writes are previewed and external sends, filings, signatures, legal-hold changes, risk acceptance, and system-of-record changes require explicit confirmation;
- jurisdiction-specific workflows and knowledge are preserved across US, UK, EEA/EU, and cross-border areas; every workflow identifies the applicable legal system and uses its authority hierarchy without silently applying US doctrine elsewhere;
- references needed by one workflow are copied inside that skill and checked for missing or orphaned links;
- duplicate domain setup/customize/matter workflows are centralized in the suite, and every domain uses the shared `<dataDir>/matters/` contract.

## Workspace and session lifecycle

Upstream Claude for Legal provides the component concepts used here: a cold-start interview, shared practice profile, matter folders, active-matter context, history/notes/outputs, and cross-matter isolation. It does not provide Pi session lifecycle hooks, a one-time first-turn matter gate, session-to-matter binding, a project `APPEND_SYSTEM.md`, metadata-only candidate matching, or a visible-outside-`.pi` storage boundary.

The suite adds those Pi-specific behaviors through one extension and one deterministic setup script:

- setup creates reusable state under `.pi/legal-workbench/` and visible data under the confirmed `dataDir`;
- Pi retains raw JSONL sessions in its default location; setup does not change session settings or copy session files;
- a new session compares only explicit first-prompt metadata with `.pi/legal-workbench/matter-index.json` and never reads unmatched matter contents;
- `legal_matter_session` creates or binds a visible matter and records associated session IDs in its README;
- the built-in write/edit guard keeps legal file writes under the active matter or approved practice/state paths. Shell commands remain subject to the same prompt-level rule and are not an operating-system sandbox.

Pi owns the raw session lifecycle. The legal workspace records only session IDs and never moves or duplicates session files.

## Skill and tool boundary

The suite exposes legal judgment workflows as Agent Skills rather than custom Pi tools. Skill descriptions provide automatic routing metadata, while full instructions and references load only when relevant. Registering every workflow as a tool would keep dozens of schemas in the model context and would turn open-ended legal judgment into misleadingly rigid parameter contracts.

Deterministic operations remain bundled scripts invoked under their governing Skill. This includes workspace initialization, DOCX mutation, and the project-local Python environment bootstrap. The core extension registers only `legal_matter_session`, where structured file and session-state changes benefit from a narrow schema. Stateful playbook learning remains a Skill because comparability, reuse, and policy changes require legal judgment and explicit confirmation. Future tools should remain narrowly scoped and should not replace review Skills.

## Excluded upstream areas

- `law-student`: educational rather than lawyer/legal-team workflow;
- `legal-clinic`: clinic pedagogy and supervision workflow;
- `legal-builder-hub`: Claude package lifecycle tooling rather than legal substance;
- `managed-agent-cookbooks`: scheduled/subagent orchestration, outside this pure-skills layer;
- third-party `external_plugins`: only general research guardrails were incorporated into core; no vendor connector is bundled.

The reproducible adapter is `scripts/import-upstream-domains.mjs`. Generated output must still pass package, reference, RPC, installation, and behavior tests before release. The original commercial `review-proposals` loop is represented by the on-demand core `legal-playbook-learning` Skill; the scheduled agents remain outside the pure-Skills package.
