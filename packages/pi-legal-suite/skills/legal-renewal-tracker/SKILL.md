---
name: legal-renewal-tracker
description: Create, update, query, and audit a project-local contract renewal register using dates extracted from reviewed agreements. Use for renewals, expirations, notice windows, cancel-by dates, price changes, or recurring contract obligations.
---

# Renewal tracker

> **Attribution:** Adapted from Anthropic's claude-for-legal/commercial-legal at revision 4a6c651889c97cc9140580363c73e0eb17379c2b under Apache-2.0 and modified for Pi. See the package NOTICE.

## Resolve storage

Read `.pi/legal-workbench/config.json` and resolve `dataDir`. The default register is `<dataDir>/renewals.yaml`. If config is absent, route to `/skill:legal-setup`; never choose a global path.

## Modes

- **add/update:** extract and propose a register entry;
- **upcoming:** report entries in a requested window;
- **audit:** check missing fields, conflicting dates, stale owners, and source coverage;
- **remove/archive:** consequential data change; show the exact target and obtain confirmation first. Prefer an archived status over deletion.

## Add or update

1. Read the governing document chain, not only the order form.
2. Extract term, renewal cadence, non-renewal notice period, notice method/address, price-change notice, owner, and source anchor.
3. Calculate a cancel-by date only when the trigger and arithmetic are clear. Show the calculation.
4. Mark uncertain dates `needs_verification`; never invent a deadline.
5. Check for an existing record by stable ID and agreement/counterparty.
6. Show the proposed change and ask for confirmation before writing.
7. Preserve unknown fields and unrelated records. Re-read the saved record.

Use `references/renewal-register.yaml` as the schema.

## Upcoming report

Sort by the earlier of cancel-by date and renewal date. Separate overdue, due within 30 days, 31–60, 61–90, and later. Include source and verification status. A calendar reminder or external alert is not created unless an available tool actually creates it with the user's authorization.

For more than ten entries, offer a dashboard or spreadsheet but do not require one.
