---
name: legal-setup
description: Initialize, complete, or update the project-local Pi Legal workspace and practice profile. Use after installation, when setup is incomplete, when a review lacks a playbook, when the user asks to configure legal workflows, or when visible matter storage must change.
---

# Legal workbench setup

> **Attribution:** Adapted from Anthropic's claude-for-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

Initialize the workspace boundary, then build a useful practice profile through conversation. Ask one coherent question at a time, use documents the user supplies, and do not re-ask facts already known.

## Input boundary and provenance

During setup, use only:

- answers the user gives in the current setup conversation; and
- files, paths, or links the user explicitly provides and authorizes for setup.

Do not inspect prior Pi sessions, personal memory, unrelated workspace files, other projects, home-directory legal configuration, or ambient context to fill gaps. If relevant information appears in the current context but the user has not clearly offered it as setup input, ask whether it should be used before recording it in the project profile. Do not proceed on an implied approval.

Treat user-provided documents as intake references. Distinguish what a document says from a verified legal fact, current authority, company policy, or approved negotiation position. Do not silently infer missing facts, promote an example or observed outcome into policy, or treat a cited deadline, threshold, jurisdiction, or legal conclusion as verified merely because it came from a user or document.

## Storage gate — always first

Look for `.pi/legal-workbench/config.json` in the current workspace.

If it does not exist, ask where the user wants visible legal work stored before asking substantive profile questions:

1. project-local default: reusable state in `.pi/legal-workbench/`, substantive data in the project root, and matters in `matters/`; or
2. another visible project-relative data directory supplied by the user.

Explain that `.pi/` contains Pi-specific configuration, status, and a metadata-only matter index. The reusable practice profile is the project-root `AGENTS.md`, which Pi loads as a context file; client facts, downloads, research, drafts, redlines, and work product stay in visible matter directories outside `.pi/`. Project-local material travels with the project if committed, so confidential paths should normally remain gitignored. Never choose a global path or write to `~/.pi` by default.

Before the first write, show all exact paths and ask for confirmation. After confirmation, run `scripts/init_workspace.mjs` with the current workspace and chosen visible data directory. The script installs `references/append-system-template.md` as a managed section while preserving other `.pi/APPEND_SYSTEM.md` content, creates the project-root `AGENTS.md`, and initializes `matters/` and `logs/`. It does not create a client matter and does not change Pi's session settings.

Default command:

```bash
node <skill-root>/scripts/init_workspace.mjs --workspace <workspace-absolute-path> --data-dir . --phase initialize
```

The resulting config is:

```json
{
  "schemaVersion": 4,
  "profilePath": "AGENTS.md",
  "statusPath": ".pi/legal-workbench/status.json",
  "indexPath": ".pi/legal-workbench/matter-index.json",
  "dataDir": ".",
  "matterRoot": "matters"
}
```

The default setup creates `matters/` and `logs/` at the project root. It does not create a visible `legal-workbench/` wrapper directory. `.pi/legal-workbench/` remains the Pi state directory. If the project already contains `matters/` or `logs/`, confirm that those directories belong to this workspace before proceeding; setup does not delete or overwrite their existing files.

The data directory must be visible, project-relative, and inside the workspace. Do not store credentials, tokens, client secrets, or private keys.

If an older or different config exists, stop and ask the user to back it up and rerun setup after deciding what to retain. This release does not migrate or delete old configuration or matter files, and the deterministic initializer refuses to overwrite a different config. It does not migrate the prior visible `legal-workbench/` layout; back up any existing matter files and move them manually if needed.

## Resume and update

- If config, status, and profile exist, read them before asking anything.
- If the profile contains `SETUP PAUSED AT`, offer to resume there or start over.
- If setup is complete, ask whether the user wants to update one section, check integrations, change storage, or redo the interview. Do not overwrite a populated profile without explicit confirmation.
- On pause, save answered sections and add `<!-- SETUP PAUSED AT: section -->`. Mark unanswered fields `Not configured — ask at use time`, not invented defaults.

## Interview mode

Offer a quick setup (about five minutes for shared questions, plus selected practice modules) or full setup. Ask which suite modules the user wants to configure. Do not interview the user for an unselected field merely because its Skill is available.

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
10. preferred memo audience and tone. Matter work product always goes under the active visible matter's `outputs/` directory.

When an existing team document answers a question, extract the answer, quote or anchor its source, and ask only about gaps. Keep sales-side and purchasing-side positions separate.

### Practice-module setup

After the shared questions, offer only the modules relevant to the user's work: commercial, privacy, regulatory, AI governance, employment, corporate, litigation, IP, and product. Read `references/domain-modules.md` and run each selected module as a short, resumable interview. Prefer the user's playbooks, policies, templates, prior work product, and delegation documents over generic defaults. Keep each module under its own heading in the same project profile so every suite workflow uses one source of truth.

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
