# Markdown-first legal document versioning: research and revised design

This note records source-backed findings and the design rationale. Implementation now lives in `packages/pi-legal-suite/lib/document-history.ts` with `legal-document-edit`; see [the revised decision](adr/0002-incremental-drafts-and-logic-origins.md). Research began at repository baseline `78e5fede848cab7adc59a07675aaaffe0cc6456b`; the feature is not yet published to npm.

## Findings

### Pi has executable event handlers

Pi extensions register lifecycle and tool handlers with `pi.on()`. `tool_call` runs before execution and can block it; `tool_result` runs after execution and can augment the model-visible result. This is the appropriate enforcement seam; a Skill alone is instructions that the model can forget. See the [official extension documentation](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/docs/extensions.md) and [event/context types](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/src/core/extensions/types.ts).

The installed Pi 1.1.0 documentation and declarations explicitly say that tools invoked through `ctx.executeTool()` also pass through `tool_call` and `tool_result`, with `parentToolCallId`. This covers built-in codemode calls to `tools.edit`, `tools.write`, and `tools.bash`. At the start of this work the repository pinned the older Pi 0.84.1 for development; its declarations lack `executeTool` and `parentToolCallId`. Development now pins Pi 1.1.0 and the same-version Pi dependency family, because allowing 1.2 transitive exports broke the 1.1 codemode loader. Test the actual supported runtime rather than assuming the new nested-call contract exists in the old one.

A post-tool scan of the enrolled Markdown paths can detect changes made by a completed shell/script/custom tool even when that tool is not named `edit` or `write`. It cannot recover each intermediate filesystem save within one shell command, attribute a simultaneous human edit with certainty, or run after a process is forcibly killed. Filesystem watchers do not solve attribution and can observe partially written content. Automatic versioning is a workflow guardrail, not an OS sandbox.

Pi ships [git-checkpoint](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/git-checkpoint.ts) and [auto-commit-on-exit](https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/extensions/auto-commit-on-exit.ts) examples. The former illustrates reversible session-associated checkpoints; the latter demonstrates lifecycle-triggered commits but stages everything on shutdown. Neither should be copied as-is for confidential matter documents: shutdown is too late, and broad staging can absorb unrelated files.

### Borrow Aider's integration, not all its defaults

[Aider's Git documentation](https://aider.chat/docs/git.html) describes automatic commits after editing, descriptive commit messages generated from actual diffs and chat context, and explicit history/diff/undo operations. These are useful patterns for a deterministic integration rather than a reminder-only Skill.

Aider also commits pre-existing dirty edits by default and skips commit hooks by default. Those choices are not recommended here. Preserve human edits and staged content; if their ownership cannot be separated, stop and ask rather than silently adopting them. Respect configured Git hooks and surface failures. Keep local versioning separate from remote upload.

### Markdown as source, delivery formats as builds

[Manubot](https://manubot.org/) and its [rootstock template](https://github.com/manubot/rootstock) use Markdown source, Git history, and generated publication outputs. Borrow source-versus-deliverable separation and reproducible provenance, not automatic public deployment or its entire toolchain.

Record a Markdown source commit, source path, and delivery-file hash when a DOCX is explicitly requested. Those identifiers establish which source/version was used; they do not prove that the DOCX is textually or structurally equivalent to it.

### Claude for Legal is not the enforcement layer

The upstream [CLAUDE.md](https://github.com/anthropics/claude-for-legal/blob/main/CLAUDE.md) describes optional plugin hooks, most as empty stubs. The inspected guidance does not supply an end-to-end automatic document-commit contract. This is a scoped observation, not a claim that every upstream workflow was audited. The local suite already delegates DOCX manipulation to an available general document capability; retain that separation.

### DOCX round-tripping is not a solved guarantee

The [Pandoc manual](https://pandoc.org/MANUAL.html) says `--track-changes=all` includes insertions, deletions, and comments as classified spans when reading DOCX; the option only affects the DOCX reader. `--reference-doc` supplies styles and document properties, not the original document content. The manual explicitly warns that conversions from formats more expressive than Pandoc Markdown can be lossy.

Consequently, neither conversion nor a matching plain-text comparison proves preservation of native Word comments, revision identity, fields, formatting, anchors, or layout. Defer lossless Markdown/DOCX synchronization. Do not silently accept/reject existing revisions while importing. Preserve the supplied DOCX and disclose extraction limitations.

## Implemented workflow contract

### Responsibilities

- The document-editing Skill governs editing intent, the chosen baseline, alternative-versus-refinement decisions, minimum-change drafting, review, and explicit delivery requests.
- The existing legal extension owns automatic Git enforcement. Its implementation can be a separate deep module without loading a second extension or adding a new time tool.
- Workspace setup normally authorizes local Git scope and identity for subsequent bound matters; legacy/manual-policy workspaces retain individual enrollment. Ordinary edits require no separate baseline ceremony or commit approval. Subsequent local commits in that scope are automatic; initialization is not permission to push, install software, execute newly downloaded code, or rewrite shared history.
- Git timestamps are recording metadata, not evidence of an underlying legal event. Remove `legal_time` without weakening event-date provenance. Use ordinary system date facilities only when an explicit calendar date is actually required.

### Baselines and alternatives

Ordinary corrections continue the current file and commit incrementally. Before substantive chapter drafting, record its file/heading original; a change from logic a to logic b retrieves that original and file history, then rewrites the chapter without inheriting a's structure unless explicitly requested. The drafting reference is not the commit's parent: the new commit can follow the latest state while preserving edits elsewhere. The initially proposed per-turn worktree policy was rejected as overdesign; ADR-0001 is superseded by ADR-0002.

Use explicit branch creation from a verified commit, not destructive reset or overwriting an existing branch. [Git worktrees](https://git-scm.com/docs/git-worktree) remain an optional way to isolate genuinely parallel proposals and concurrent sessions, not a prerequisite for each small edit. A Pi conversation branch and a Git branch are different objects; switching one must not silently switch or reset the other. Lifecycle metadata must not be rolled back when trying an alternative document version.

### Automatic commits

- Before mutation: validate the current active matter and enrolled real paths, selected branch/base, repository identity, Git author identity, pre-existing dirty/staged files, and operation ownership. Serialise overlapping mutations or refuse them; do not attribute another process's edits to this tool.
- After each completed mutation tool call: inspect actual enrolled Markdown changes, including creation, edits, renames, and deletion where approved. Commit only those paths; unchanged content creates no empty commit. A failed tool can leave partial changes, so failure results still need inspection and truthful checkpoint labeling.
- For supported nested calls, checkpoint each nested write/edit. A shell command is one tool transaction; intermediate saves inside it are not separate commits. An end-of-run reconciliation is a safety check, not the primary trigger.
- Generate a concise message from the real diff, not merely the last assistant sentence. Automated summary failure must not lose the checkpoint or fabricate a semantic description: use an explicitly mechanical fallback and report the limitation.
- Report the commit ID and paths in the tool result. A commit failure is a visible incomplete operation: retain the files, stop additional mutations until recovery, and never claim that the change is safely versioned.
- Preserve unrelated staged changes. Avoid `git add -A`, automatic amend/rebase/reset/clean, automatic push, and silent hook bypass. Missing identity, index locks, conflicts, symlink escapes, stale matter bindings, and concurrent sessions are explicit failure cases.

### Markdown and DOCX

Substantive drafting and revision take place in Markdown. Structured machine records such as YAML/JSON remain structured data rather than being mechanically flattened into prose.

A DOCX is an explicitly requested deliverable, not an automatic side effect of every Markdown edit. Default to the smallest justified change: character before word, word before phrase, phrase before sentence. Preserve unrelated favourable language, formatting, comments, and existing revisions. Show a reviewable plan before producing a Word revision, and use the existing DOCX verification contract.

## Resolved decisions

1. The user selected an independent repository per matter. Workspace setup configures automatic enrollment/identity, while worktrees are optional for parallel proposals; canonical lifecycle metadata is excluded so experiments cannot roll back status/session associations. Existing repositories are not taken over automatically.
2. Automatic summaries use the actual staged diff plus the current user request and baseline. They use the existing Pi model/runtime, no separate model install or mandatory per-edit commit Tool; summary output is bounded and a mechanical fallback is explicit.
3. Development tests now exercise Pi 1.1.0's actual codemode and nested event pipeline. The controller checks modern Tool-context execution support; generic pre-tool hooks identify modern model-runtime support because they do not expose `executeTool` themselves. The real SDK test verifies automatic enrollment through those hooks, not only mocks. The control Tool is model-only so codemode-only sessions can inspect history or explicitly fork/recover.
4. New user turns do not invalidate ordinary editing. The model judges whether content uncertainty calls for a question; otherwise it applies the request and the extension commits. Draft checkpoints are not legal approval. A recorded chapter original is not silently redefined as the a draft; missing/exactness-limited references are disclosed rather than fabricated.

## Verification targets

Exercise real temporary Git repositories and extension events without model credentials: native edit/write, nested codemode calls, shell-created Markdown, no-op calls, partial failures, new/renamed/deleted paths, spaces/Unicode filenames, preserved staged/human changes, author/hook/index errors, symlink escapes, concurrent sessions, stale/closed matters, process restart recovery, and baseline A versus proposals A'/A''. Packaging must include the implementation and new Skill, exclude client materials and tooling state, and no longer register or instruct calls to `legal_time`.
