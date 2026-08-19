---
name: legal-setup
description: Initialize, migrate, complete, or update the project-local Pi Legal workspace and practice profile. Use after installation, when setup is incomplete, when a review lacks a playbook, when the user asks to configure legal workflows, or when visible matter storage must change.
---

# Legal workbench setup

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

Initialize the workspace boundary, then build a useful practice profile through conversation. Ask one coherent question at a time, use documents the user supplies, and do not re-ask facts already known.

## Storage gate — always first

Look for `.pi/legal-workbench/config.json` in the current workspace.

If it does not exist, ask where the user wants visible legal work stored before asking substantive profile questions:

1. project-local default: reusable state in `.pi/legal-workbench/`, substantive data in `legal-workbench/`, and matters in `legal-workbench/matters/`; or
2. another visible project-relative data directory supplied by the user.

Explain that `.pi/` contains only reusable configuration, the profile, status, and a metadata-only matter index. Client facts, downloads, research, drafts, redlines, and work product stay in visible matter directories outside `.pi/`. Project-local material travels with the project if committed, so confidential paths should normally remain gitignored. Never choose a global path or write to `~/.pi` by default.

Before the first write, show all exact paths and ask for confirmation. After confirmation, run `scripts/init_workspace.mjs` with the current workspace and chosen visible data directory. The script installs `references/append-system-template.md` as a managed section while preserving other `.pi/APPEND_SYSTEM.md` content, creates the profile and state files, and initializes visible practice and matter roots. It does not change Pi's session settings or create a client matter.

Default command:

```bash
node <skill-root>/scripts/init_workspace.mjs --workspace <workspace-absolute-path> --data-dir legal-workbench --phase initialize
```

The resulting config is:

```json
{
  "schemaVersion": 2,
  "profilePath": ".pi/legal-workbench/profile.md",
  "statusPath": ".pi/legal-workbench/status.json",
  "indexPath": ".pi/legal-workbench/matter-index.json",
  "dataDir": "legal-workbench",
  "matterRoot": "legal-workbench/matters"
}
```

The data directory must be visible, project-relative, and inside the workspace. Do not store credentials, tokens, client secrets, or private keys.

If schema version 1 exists, explain the proposed migration before changing anything. Moving existing substantive data out of `.pi/` requires a separate, confirmed file plan; never delete or silently relocate it. The deterministic initializer intentionally refuses to overwrite a different config.

## Resume and update

- If config, status, and profile exist, read them before asking anything.
- If the profile contains `SETUP PAUSED AT`, offer to resume there or start over.
- If setup is complete, ask whether the user wants to update one section, check integrations, change storage, or redo the interview. Do not overwrite a populated profile without explicit confirmation.
- On pause, save answered sections and add `<!-- SETUP PAUSED AT: section -->`. Mark unanswered fields `Not configured — ask at use time`, not invented defaults.

## Interview mode

Offer a quick setup (about five minutes for core, plus selected practice modules) or full setup. Inspect the installed legal skill names when Pi exposes them; otherwise ask which practice modules the user wants to configure. Do not interview the user for an unselected field merely because its package is installed.

### Quick setup

Capture the minimum needed for reliable contract work:

1. user role: lawyer/legal professional, legal operations or supervised non-lawyer;
2. practice setting: in-house, firm/solo, government/legal aid/clinic;
3. organization or client context, governing-law footprint, courts, regulators, and other relevant forums;
4. contract side: sales, purchasing, or both;
5. an existing playbook, clause matrix, delegation-of-authority document, or representative agreements, if available;
6. the "one thing" that blocks a deal on each active side;
7. core positions for liability, indemnity, data protection, term/termination, and governing law;
8. escalation owner and automatic escalation triggers;
9. whether routing should be confirmed before review; and
10. preferred memo audience and tone. Matter work product always goes under the active visible matter directory.

When an existing team document answers a question, extract the answer, quote or anchor its source, and ask only about gaps. Keep sales-side and purchasing-side positions separate.

### Practice-module setup

After the shared questions, offer only the modules relevant to the user's work: commercial, privacy, regulatory, AI governance, employment, corporate, litigation, IP, and product. Read `references/domain-modules.md` and run each selected module as a short, resumable interview. Prefer the user's playbooks, policies, templates, prior work product, and delegation documents over generic defaults. Keep each module under its own heading in the same project profile so separately installed packages can share one source of truth.

When a field is unknown in full setup, write `Not configured — ask at use time`. Do not turn an industry practice, model assumption, or stale legal threshold into company policy. Capture every jurisdiction the user actually works in, including cross-border privacy, AI, employment, commercial, corporate, IP, regulatory, and disputes work.

### Quick defaults

For quick setup, read `references/quick-defaults.md`. Ask the minimum identity, practice-setting, jurisdiction, active-side, and module questions, then offer the generic defaults as a visible package:

1. show the defaults that will materially affect work;
2. let the user accept all, edit selected defaults, or leave selected fields unconfigured;
3. write each accepted item with a `[DEFAULT — generic starting point]` label;
4. never describe a default as the user's policy, settled legal conclusion, delegated authority, or accepted market position;
5. require matter-specific facts and current jurisdiction-specific authority before relying on a default for a consequential decision.

Quick setup should make the package usable immediately. Full setup replaces defaults with the user's documents, playbook, thresholds, templates, and instructions. `/skill:legal-customize` may replace one default at a time.

### Full setup

Add team composition, volume, contract systems, detailed fallback positions, NDA triage rules, SaaS/data/AI positions, matter naming and metadata conventions, renewal ownership, research subscriptions, source preferences, and representative executed agreements. Distinguish stated policy from terms the team actually accepts.

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

After the interview is complete, update the profile, remove any pause marker, and run:

```bash
node <skill-root>/scripts/init_workspace.mjs --workspace <workspace-absolute-path> --data-dir <confirmed-data-dir> --phase complete
```

This marks setup complete without overwriting a populated profile. Then:

1. summarize the config, profile, visible data, and matter paths plus the decisions that materially change future output;
2. state which sections remain `Not configured — ask at use time`;
3. explain that the newly created `.pi/APPEND_SYSTEM.md` takes effect after `/reload` or a Pi restart;
4. explain that the next new session will ask to create or reuse a matter before substantive work;
5. remind the user that `/skill:legal-customize` can update one section later.

Do not create MCP configuration, global Pi settings, scheduled tasks, or redline tooling during setup.
