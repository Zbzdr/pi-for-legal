# Upstream adaptation map

Packages are adapted from Anthropic's `claude-for-legal` revision `4a6c651889c97cc9140580363c73e0eb17379c2b` (2026-07-23).

## Package boundaries

- `@zbzdr/pi-legal-core`: shared project profile, research, matter isolation, escalation, and stakeholder-output guardrails.
- `@zbzdr/pi-commercial-legal`: `commercial-legal` contract workflows.
- `@zbzdr/pi-privacy-legal`: `privacy-legal` substantive workflows.
- `@zbzdr/pi-regulatory-legal`: `regulatory-legal`; the non-invocable upstream gap engine and thin `/gaps` wrapper are combined into one exposed Pi skill.
- `@zbzdr/pi-ai-governance-legal`: `ai-governance-legal` substantive workflows.
- `@zbzdr/pi-employment-legal`: `employment-legal` substantive workflows.
- `@zbzdr/pi-corporate-legal`: `corporate-legal` substantive workflows.
- `@zbzdr/pi-litigation-legal`: `litigation-legal` substantive workflows.
- `@zbzdr/pi-ip-legal`: `ip-legal` substantive workflows.
- `@zbzdr/pi-product-legal`: `product-legal` substantive workflows, added after discovering it was omitted from the initial package sketch.
- `@zbzdr/pi-legal-suite`: build-time union of every source package above.

Each domain omits its duplicate `cold-start-interview`, `customize`, and `matter-workspace`; those are centralized in core. All other source workflows remain distinct and use domain-prefixed Pi skill names.

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
- duplicate domain setup/customize/matter workflows are centralized in core, and every domain uses the shared `<dataDir>/matters/` contract.

## Skill and tool boundary

The current packages intentionally expose legal judgment workflows as Agent Skills rather than custom Pi tools. Skill descriptions provide automatic routing metadata, while full instructions and references load only when relevant. Registering every workflow as a tool would keep dozens of schemas in the model context and would turn open-ended legal judgment into misleadingly rigid parameter contracts.

Deterministic operations remain bundled scripts invoked under their governing Skill. This includes DOCX mutation and the project-local Python environment bootstrap. Stateful playbook learning remains a Skill because comparability, reuse, and policy changes require legal judgment and explicit confirmation. A future all-in-one extension may register narrowly scoped tools for deterministic capture, validation, or file mutation, but should not replace the review Skills themselves.

## Excluded upstream areas

- `law-student`: educational rather than lawyer/legal-team workflow;
- `legal-clinic`: clinic pedagogy and supervision workflow;
- `legal-builder-hub`: Claude package lifecycle tooling rather than legal substance;
- `managed-agent-cookbooks`: scheduled/subagent orchestration, outside this pure-skills layer;
- third-party `external_plugins`: only general research guardrails were incorporated into core; no vendor connector is bundled.

The reproducible adapter is `scripts/import-upstream-domains.mjs`. Generated output must still pass package, reference, RPC, installation, and behavior tests before release. The original commercial `review-proposals` loop is represented by the on-demand core `legal-playbook-learning` Skill; the scheduled agents remain outside the pure-Skills package.
