---
status: superseded by ADR-0002
---

# Isolate matter document proposals in Git worktrees

The mandatory per-turn worktree policy below was rejected after user clarification; see [ADR-0002](0002-incremental-drafts-and-logic-origins.md). Existing worktrees remain valid and are never deleted automatically.

Use an explicitly enrolled local Git repository per matter and a separate worktree per proposal. The user selected matter-level isolation over a shared legal-workspace repository; worktrees preserve rejected alternatives and concurrent sessions without checking out older text over the canonical matter or another client's files.

An alternative starts from its drafting anchor A; an explicit refinement starts from its proposal parent A′ but retains A as the anchor for later alternatives. Each new user turn must select the mode before mutation. The extension, not a remembered Skill or a commit Tool call, checkpoints actual Markdown changes and summarizes their diff with the current request; a failed summary produces a clearly labeled mechanical checkpoint.

## Consequences

- `matter.md` and `history.md` remain authoritative lifecycle records outside drafting branches. They and YAML/JSON machine registers are not automatic document-Git targets; rolling back wording must not roll back a matter's status or session associations.
- Draft worktrees are visible under the active matter's `outputs/revisions/`, while Git internals remain under that matter's `.git/`. No confidential data is copied into project `.pi/` or pushed automatically.
- Pi conversation branches restore selection intent, not files. Each worktree keeps its own files and Git branch. Existing/staged human edits and operation locks require explicit resolution. Adoption refuses rollback of other adopted documents and updates the accepted reference with an expected-old-value check.
- The baseline control Tool stays model-only, so it remains reachable when codemode hides other direct declarations. Nested mutation calls still cross Pi's event pipeline; arbitrary shell saves or external editors are not separate event transactions.
- DOCX is an explicitly requested delivery artifact. Lossless Markdown/DOCX synchronization, comment/revision reconstruction, automatic remote sharing, and OS-level containment are not promised.
