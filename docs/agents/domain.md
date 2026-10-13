# Domain Docs

This repo uses a **single-context** layout: root `GLOSSARY.md` and `docs/adr/`.

## Before exploring

- Read `GLOSSARY.md` at the repo root for domain vocabulary.
- Read ADRs in `docs/adr/` that touch the area you are about to work in.

If these files do not exist, proceed silently. Do not flag their absence or suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## Use the glossary's vocabulary

When naming a domain concept in an issue title, refactor proposal, hypothesis, or test name, use the term defined in `GLOSSARY.md`, rather than synonyms it explicitly avoids.

If a concept is missing, reconsider whether the project uses it; note genuine gaps for `/domain-modeling`.

## Flag ADR conflicts

If your output contradicts an existing ADR, surface the conflict explicitly rather than silently overriding it:

> Contradicts ADR-0007, but worth reopening because ...
