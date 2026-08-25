> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

# Legal Workbench Practice Profile

*Created on [date]. Edit this file directly or use `/skill:legal-customize`.*

## Profile status

- Setup mode: quick | full
- Last updated: [date]
- Incomplete sections: none | [list]

## Who we are

- Organization/client: [name and short description]
- Practice setting: in-house | firm/solo | government/legal aid/clinic
- User role: lawyer/legal professional | legal operations | supervised non-lawyer
- Attorney/supervisor: [name or role, if applicable]
- Jurisdictions and forums: [countries, states/provinces, courts, regulators, arbitral or administrative forums]
- The thing that hurts: [in the user's words]

## Available integrations

| Capability | Status | Last tested | Fallback |
|---|---|---|---|
| Legal research | connected / available, unverified / not available | [date or never] | user-provided and official sources |
| Document storage | connected / available, unverified / not available | [date or never] | local files |
| CLM | connected / available, unverified / not available | [date or never] | local register |
| E-signature | connected / available, unverified / not available | [date or never] | manual routing |

## Contract playbook

- Active side: sales | purchasing | both
- Confirm routing before review: yes | no

### Sales-side positions

#### Limitation of liability

- Direct cap:
- Consequential damages:
- Carveouts:
- Cap base definition:
- Acceptable fallbacks:
- Never accept:

#### Indemnification

- Standard:
- Acceptable fallbacks:
- Never accept:

#### Data protection and security

- Standard:
- Requirements:
- Acceptable fallbacks:

#### Term and termination

- Standard:
- Auto-renewal/cancel window:
- Acceptable fallbacks:
- Never accept:

#### Governing law and disputes

- Preferred:
- Acceptable:
- Escalate:
- Never accept:

#### The one thing

[deal-breaker]

### Purchasing-side positions

[Repeat the same subsections from the customer's perspective. Do not copy the sales-side answers automatically.]

## NDA triage positions

- GREEN criteria:
- YELLOW criteria:
- RED criteria:
- Required carveouts:
- Residuals:
- Confidentiality term and trade-secret survival:
- Restrictive covenants:
- Remedies and fee shifting:
- Closing action:

## SaaS positions

- Renewal and price increases:
- SLA/service credits:
- Suspension:
- Security standard and breach notice:
- Subprocessors:
- Data export, deletion, and retention:
- AI/model training and derivative data:
- Audit/assurance:

## Escalation

| Reviewer/role | May approve | Escalates to | Channel |
|---|---|---|---|
| [role] | [threshold] | [name/role] | [method] |

- Dollar thresholds:
- Automatic escalation triggers:
- Expected turnaround:

## House style and outputs

- Redline tone:
- Memo audience and length:
- Stakeholder summary audience and length:
- Work-product convention: active matter `outputs/` directory
- Renewal owner and alert destination:
- Privilege/confidentiality marking approved by counsel:

## Research preferences

- Default depth: quick | standard | deep
- Preferred databases/connectors:
- Official-source requirements:
- Citator/negative-treatment source:
- Default as-of rule:

## Enabled practice modules

- Commercial: enabled | not configured
- Privacy: enabled | not configured
- Regulatory: enabled | not configured
- AI governance: enabled | not configured
- Employment: enabled | not configured
- Corporate: enabled | not configured
- Litigation: enabled | not configured
- IP: enabled | not configured
- Product: enabled | not configured

## Practice-module profiles

[Insert only the selected module sections from `references/domain-modules.md`. Do not infer positions for unconfigured modules.]

## Matter workspaces

- Visible data directory: . | [confirmed relative path]
- Matter root: [data directory]/matters
- Enabled: yes | no
- Matter required before substantive work: yes
- Active matter: none (session-bound through `legal_matter_session`, not stored in this shared profile)
- Cross-matter access: off | on with explicit approval
- Matter slug and metadata conventions: [rules]

## Seed documents reviewed

| Document | Date/version | What it established | Source location |
|---|---|---|---|
| [name] | [date] | [positions] | [path/link] |

## Open configuration questions

- [Not configured — ask at use time]

## Default provenance

- Any value labeled `[DEFAULT — generic starting point]` came from the package quick-start profile, not from the organization or client.
- Replace defaults with approved playbooks, policies, templates, authority matrices, and jurisdiction-specific instructions as they become available.
