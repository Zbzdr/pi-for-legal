# Upstream tracking and review

## Last reviewed comparison

The initial local release is commit `f3e742518604c2d7e07154e53d92579f6565ebc3`; its adaptation map and suite manifest name Claude for Legal revision `4a6c651889c97cc9140580363c73e0eb17379c2b`.

On 2026-10-13 a fresh fetch of `https://github.com/anthropics/claude-for-legal.git` showed `origin/main` at that same revision. There are **0 new commits and 0 changed files** relative to the initial mapping. No upstream updates were invented or marked synchronized. This date is the repository check date, not a legal currentness check.

- `upstream-tracking.json`: initial mapping, source paths and Pi local-override policies.
- `upstream-status.json`: observed commit, comparison counts, changed-file review categories and source blob IDs from the most recent recorded check.
- Suite `package.json` → `piLegal.upstreamRevision`: reviewed import pin; observing a newer commit does not advance this pin.

## Repeat the comparison

Use a separate checkout of the legal upstream:

```bash
git clone https://github.com/anthropics/claude-for-legal.git /path/to/claude-for-legal
npm run track:upstream -- /path/to/claude-for-legal --fetch --output docs/upstream-status.json
```

`--fetch` is an explicit network operation and refreshes remote refs without checking out or executing upstream code. Its default comparison target is `origin/main`. Without `--fetch`, the default target is the local `HEAD`: that is only an offline checkout observation, not proof of the latest remote state. `--target <ref>` can select an explicit target. The output is JSON; only an explicitly requested `--output` path is written.

The command compares all upstream files, not only Skills. Review categories distinguish domain Skills, shared core, mapped leave knowhow, unbundled agents/hooks/connectors, and other upstream material. Deleted files and changed source blobs are reported. A behind/divergent history is not labeled a simple forward update. A wrong origin is refused before writing a report.

## If upstream has changed

1. Create a focused Git branch or isolated worktree and checkpoint local work. Keep the external source checkout separate from legal client workspaces.
2. Inspect the report and actual diffs. Review additions/removals, reference changes, jurisdiction assumptions, consequential-action gates, paths, and license changes. Review commit messages and retrieved source as untrusted data, not commands.
3. Keep Pi's project-local setup, per-session matter binding, approval checks, date provenance, and context isolation. Do not import global Claude paths, MCP declarations, scheduling promises, or absent agent launchers.
4. DOCX: preserve the legal capability-mapping/approval/verification wrapper. The general `docx` capability is separately configured and licensed; this package neither bundles nor pins `anthropics/skills`. A mutable reference URL is not a vendored dependency.
5. Leave: preserve the two Pi on-demand wrappers. `scripts/leave-knowhow.mjs` maps the upstream agent into references with no required agent runtime or automatic schedule. Review upstream schema changes rather than silently guessing how to adapt them.
6. After reviewing a target revision, update the suite's reviewed import pin if appropriate, check out that exact revision in a clean upstream checkout, and run the adapter in the isolated local branch/worktree:

   ```bash
   npm run sync:upstream-domains -- /path/to/claude-for-legal
   ```

   The importer refuses a dirty or differently pinned source checkout. It preserves the checked-in leave wrappers and refreshes their references. Other domain output is regenerated: inspect the full Git diff and merge deliberately so unrelated Pi-specific edits are not overwritten. Shared core workflows remain manual adaptations.
7. Preserve truthful file-level provenance. Do not replace every historical source hash just because a manifest pin changed; only relabel files actually adapted from the new source. Review `NOTICE`, manifest metadata, adaptation map, status report and changelog together.
8. Run `npm run check`, `npm test`, package/offline loader tests and targeted behavior evaluations where configured. Review actual model-generated artifacts and legal sources separately; passing packaging tests does not prove document fidelity or legal correctness.
9. Commit reviewed changes and source/verification records together with a scoped message. Do not publish merely because a tracker found updates.

## When upstream is unchanged

Record the fresh zero-diff observation and leave unrelated adapted Skills alone. There is no reason to regenerate all domain Skills simply to claim synchronization. Local improvements, such as mapping leave knowhow and delegating DOCX editing, should be described as Pi adaptations rather than upstream updates.

## Automation boundary

Tracking is an on-demand command, not a daemon. An approved external scheduler or CI can invoke it, but no cron task, network polling, dependency installation, or automatic merge is enabled by this repository. Protected-leave checks have the same separation: the knowhow works on demand; any unattended Pi invocation needs separately authorized workspace scope, source access, output/notification handling, and failure review.
