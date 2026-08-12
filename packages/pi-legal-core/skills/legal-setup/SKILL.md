---
name: legal-setup
description: Set up or resume the project-local legal practice profile used by pi-legal-workbench. Use after installation, when a review lacks a playbook, when the user asks to configure the legal package, or when profile storage must be changed.
---

# Legal workbench setup

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

Build a useful practice profile through conversation. This is an interview, not a configuration dump. Ask one coherent question at a time, use documents the user supplies, and do not re-ask facts already known.

## Storage gate — always first

Look for `.pi/legal-workbench/config.json` in the current project.

If it does not exist, ask where the user wants this project's legal profile stored before asking substantive questions:

1. project-local (recommended): `.pi/legal-workbench/profile.md` with data in `.pi/legal-workbench/data/`; or
2. a custom path supplied by the user.

Explain that project-local storage travels with the project if committed, so confidential profile/data files should normally remain gitignored. Never silently choose a global path and never write to `~/.pi` by default.

Before the first write, show the exact config, profile, and data paths and ask for confirmation. Then write `.pi/legal-workbench/config.json`:

```json
{
  "schemaVersion": 1,
  "profilePath": ".pi/legal-workbench/profile.md",
  "dataDir": ".pi/legal-workbench/data"
}
```

Relative paths resolve from the current project. For custom storage, record the chosen absolute or project-relative paths. Do not store credentials, tokens, client secrets, or private keys.

## Resume and update

- If config and profile exist, read both before asking anything.
- If the profile contains `SETUP PAUSED AT`, offer to resume there or start over.
- If setup is complete, ask whether the user wants to update one section, check integrations, or redo the interview. Do not overwrite a populated profile without explicit confirmation.
- On pause, save answered sections and add `<!-- SETUP PAUSED AT: section -->`. Mark unanswered fields `Not configured — ask at use time`, not invented defaults.

## Interview mode

Offer a quick setup (about five minutes for core, plus selected practice modules) or full setup. Inspect the installed legal skill names when Pi exposes them; otherwise ask which practice modules the user wants to configure. Do not interview the user for an unselected field merely because its package is installed.

### Quick setup

Capture the minimum needed for reliable contract work:

1. user role: lawyer/legal professional, legal operations or supervised non-lawyer;
2. practice setting: in-house, firm/solo, government/legal aid/clinic;
3. organization or client context and primary US jurisdictions;
4. contract side: sales, purchasing, or both;
5. an existing playbook, clause matrix, delegation-of-authority document, or representative agreements, if available;
6. the "one thing" that blocks a deal on each active side;
7. core positions for liability, indemnity, data protection, term/termination, and governing law;
8. escalation owner and automatic escalation triggers;
9. whether routing should be confirmed before review; and
10. preferred memo audience, tone, and output location.

When an existing team document answers a question, extract the answer, quote or anchor its source, and ask only about gaps. Keep sales-side and purchasing-side positions separate.

### Practice-module setup

After the shared questions, offer only the modules relevant to the user's work: commercial, privacy, regulatory, AI governance, employment, corporate, litigation, IP, and product. Read `references/domain-modules.md` and run each selected module as a short, resumable interview. Prefer the user's playbooks, policies, templates, prior work product, and delegation documents over generic defaults. Keep each module under its own heading in the same project profile so separately installed packages can share one source of truth.

When a field is unknown, write `Not configured — ask at use time`. Do not turn an industry practice, model assumption, or stale legal threshold into company policy. Cross-border privacy and AI questions may be captured as operational facts, but non-US legal conclusions require current jurisdiction-specific research.

### Full setup

Add team composition, volume, contract systems, detailed fallback positions, NDA triage rules, SaaS/data/AI positions, matter isolation for firm users, renewal ownership, research subscriptions, source preferences, and representative executed agreements. Distinguish stated policy from terms the team actually accepts.

Use `references/profile-template.md` as the profile structure and `references/domain-modules.md` for selected domain sections. Preserve the user's language where possible. A profile is prose a lawyer can edit, not an opaque schema.

## Integration check

Only check integrations the user asks about or that are visibly available in this Pi session.

- `connected` means a harmless read-only probe succeeded during this session.
- `available, unverified` means a relevant tool is exposed but was not called successfully.
- `not available` means no relevant tool is exposed.

Configuration declarations alone are never proof of connection. Do not install, authenticate, edit MCP files, or run OAuth from this core package. Record no secrets in the profile.

## Legal-fact hygiene

If the user supplies a statute, deadline, threshold, case, or jurisdiction-specific rule, distinguish team policy from legal fact. Verify material legal facts with an available approved source before recording them as law. If verification is unavailable, record `[user stated — verify]`.

## Completion

After writing:

1. summarize the paths and the five or six decisions that will materially change future output;
2. state which sections remain `Not configured — ask at use time`;
3. offer a first run: contract review or legal research;
4. remind the user that `/skill:legal-customize` can update one section later.

Do not create MCP configuration, global Pi settings, scheduled tasks, or redline tooling.
