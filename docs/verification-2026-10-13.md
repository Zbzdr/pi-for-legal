# Workflow mapping verification — 2026-10-13

## Scope

Unreleased changes on `feat/upstream-workflow-sync`; suite remains version 0.5.1. No npm publication, remote Git push, scheduler installation, or existing personnel-record migration was performed.

- DOCX: replace the narrow fixed engine with capability discovery, model-directed execution and legal approval/verification gates.
- Protected leave: retain the upstream agent's substantive knowhow as Pi references; enable on-demand registration and checking separately from optional external automation.
- Upstream: preserve the initial mapping and reviewed pin; record a fresh remote comparison and repeatable manual review process.
- Matter state: retain session/branch revalidation and project operation serialization; fix a lock-release race exposed by repeated tests.

## Results

Local environment: Node v24.15.0 on macOS. Development integration tests use lockfile-pinned Pi 0.84.1; a separate loader check uses the installed Pi 1.1.0.

| Check | Result | What it establishes |
|---|---|---|
| `npm ci --ignore-scripts --no-audit --no-fund` | Pass | Reproducible development dependency installation without dependency lifecycle scripts |
| `npm run check` | Pass | One maintained package, 88 Skills, one extension; package structure and attribution validation |
| `npm test` | 30 passed | Workflow contracts, importer provenance/cleanliness, source adaptation, state and concurrency regressions, upstream comparison fixtures |
| `npm run test:rpc` | Pass | Pi 0.84.1 offline command discovery and both legal extension tools |
| `npm run test:package` | Pass | Tarball creation, extraction, project-local installation, offline command discovery; DOCX and leave references shipped; removed DOCX scripts absent |
| Pi 1.1.0 loader | Pass | Extension and 88 Skills load without errors/diagnostics; both leave Skills are available for automatic model selection |
| Actual leave-reference regeneration | Exact match | Checked-in workflow/register references reproduce from the reviewed upstream agent |
| Fresh legal-upstream fetch | Zero diff | Remote `origin/main` equals initial/reviewed revision `4a6c651889c97cc9140580363c73e0eb17379c2b`; zero newer commits/files |
| Repeated independent-process regression | 30 runs passed | Three contending processes preserve all ten matter records and shared-matter session rows each run |
| Negative lock regression | Expected failure confirmed | Restoring the former transient-leaf resolver in a disposable fixture reproduces `ENOENT`; the corrected resolver passes |
| `git diff --check` | Pass | No whitespace errors |

The repeated full test initially found a release-time lock-path race. This was fixed rather than ignored/retried until green. The new deterministic test removes a test-owned lock at validation time; another test verifies existing and dangling lock symlinks are not followed or silently ignored. These changes do not harden every initializer/output symlink case.

## Live model checks

The configured `deepseek/deepseek-flash` passed three focused, synthetic scenarios:

```bash
npm run test:behavior -- docx-capability-mapping
npm run test:behavior -- leave-on-demand-intake
npm run test:behavior -- leave-on-demand-no-scheduler
```

The final forms of these scenarios advertise only the `read` tool. They use empty disposable workspaces and no client/personnel documents. They test workflow comprehension and honest limitations, not mutations:

- Do not assume a general DOCX Skill is installed; offer approved alternatives, preserve originals and require verification.
- Missing leave jurisdiction/coverage/eligibility/events/sources remain unknown/pending, not invented statutory dates; writing requires an authorized matter and confirmation.
- A missing scheduler does not prohibit on-demand checking; checks default to read-only; suggested review dates are not scheduled reminders.

Live model assertions are opt-in, model-dependent smoke checks, not deterministic legal-accuracy tests. They are not enabled in credential-free CI. The rest of the older behavior suite was not rerun in this change's final validation.

## CI and limitations

`.github/workflows/ci.yml` runs the check/unit/RPC/package sequence with Node 24 on macOS and Linux, pinned actions and read-only repository permissions. Its GitHub-hosted execution remains to be observed after a push; only the local equivalent was run here.

No actual Word file was edited/rendered in these checks, and no Word GUI accept/reject validation or legal currentness evaluation was performed. Complex redline fidelity depends on the selected capability, model, source document and completed verification evidence; an instruction mapping is not a certified document engine.

The pre-call write guards and lock are workflow controls, not OS isolation, shell-write enforcement, or multi-file transactions. Unifying all legacy domain storage paths, project-shared registry policy, and initializer symlink containment remains separate work. No general DOCX Skill from `anthropics/skills` was installed or redistributed; its license remains separate.
