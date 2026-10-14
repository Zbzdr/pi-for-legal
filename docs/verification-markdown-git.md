# Incremental Markdown document Git verification

Implementation developed on `feat/markdown-document-history`; not published to npm. This records local macOS verification; the macOS/Linux GitHub workflow runs the offline checks on push, and its result must be checked separately. This is not Word-fidelity or legal-correctness verification. A subsequent real-model evaluation is recorded separately in [DeepSeek acceptance](document-behavior-deepseek.md).

## Commands and results

- `npm ci --ignore-scripts --no-audit --no-fund`: successful with the lockfile and Pi 1.1.0 dependency family.
- `npm run check`: 89 Skills, one discovered extension, implementation packaged under `lib/`.
- `npm test`: 52 tests passed, including 20 document-history cases and 32 other cases.
- `npm run test:rpc`: all 89 Skills and the extension load offline; `legal_time` absent, `legal_document_revision` present.
- `npm run test:package`: packed/installable suite includes the deep module and loads offline.
- `git diff --check`: passed.

## User-clarification regression cases

1. Setup configures automatic future matter enrollment and a confirmed local Git author, without creating a shared workspace repository. Same-path schema-4 setup adds this policy without overwriting populated profiles/materials, tolerates reordered JSON keys, and preserves the identity on resume. Missing identity fails before workspace writes.
2. A small correction edits the canonical current Markdown, automatically initializes the matter repository, and commits without calling enrollment/proposal tools. A subsequent turn continues that file: no new branch, worktree, or repeated confirmation. A preexisting enrollment lock is not stolen; the original file remains untouched.
3. Before liability drafting under logic a, the controller records the file/heading pre-a commit. Later logic b retrieves that original, not a's argument text. An explicit intermediate continuation of a remains possible; a separate Payment edit is preserved when b replaces Liability. The b commit's parent is the latest state, while its drafting reference is the earlier recorded origin. This tests history and in-place patch semantics with deterministic text, not a live model's legal reasoning.
4. Original lookup does not restore files or redefine the source as the latest draft. New-file absence and missing exact heading keys are disclosed; longer originals can be paged. An expressly supplied full commit can start another source series or be used as a readonly diff reference.

## Pipeline and failure coverage

The actual Pi 1.1 SDK/codemode executor runs native write/edit through the real nested pipeline, automatically enrolling the configured matter at the generic pre-tool hook. One script produces two clean checkpoints with no enrollment, proposal-preparation, or commit Tool calls. The controller stays model-only for history/fork/recovery access in codemode-only sessions.

Real temporary repositories also cover optional explicit worktree alternatives, refinement, adoption and protection of other adopted documents; parent repository index isolation; actual diff/current-request summary inputs and usage; no-op and binary exclusions; creation/rename/deletion; Unicode/space filenames; failed-tool partial changes; nested custom mutation tools and opaque provider IDs; parallel siblings; preexisting staged/human edits; symlinks, invalid bindings and another instance's lock; hooks, index locks, failed enrollment/retry, external HEAD changes and recovery. Authorized profile/lifecycle/structured records and bare Unix date reads remain separate from drafting transactions.

## Limits

- The 52 automated tests use a deterministic summary-runtime fixture. Subsequently, DeepSeek V4.1 Flash passed an eight-turn actual RPC workflow with real semantic commit subjects and no fallback; this is one limited run, not broad provider/cancellation or statistical accuracy coverage.
- The model/Skill identifies substantive logic changes and chooses chapter keys. The extension records/retrieves declared origins but cannot prove natural-language interpretation, heading identity, legal reasoning, or that a retrieved reference was actually used. Native hooks retain a first-edit file fallback; they cannot independently infer every chapter's meaning.
- One shell/script call is one transaction. Intermediate saves, arbitrary external editors, force-killed processes and malicious extensions are not individually intercepted. End reconciliation reports pending edits without attributing them automatically; simultaneous human modifications cannot be distinguished with certainty.
- Lifecycle Markdown, structured registers, profile/log/state maintenance, source binaries and DOCX are outside proposal-Git scope. This is not whole-workspace versioning or an OS sandbox.
- History retains sensitive/deleted text. Setup authorizes local scope; remote sharing is separate and never automatic. Git timestamps are recording metadata, not legal-event evidence.
- DOCX rules are instruction/verification contracts, not a new editing engine. Native comments, revisions, fields, rendering and lossless Markdown/DOCX synchronization have not been tested here.
- Legacy/manual workspaces still need individual enrollment until the user approves setup's auto policy. Unmarked repositories, missing identity, hooks, pending human/staged edits or crashed locks require explicit resolution, not reset, deletion or takeover.
