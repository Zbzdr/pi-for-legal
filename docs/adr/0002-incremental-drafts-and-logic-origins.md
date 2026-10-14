# Separate incremental history from drafting references

Configure matter-local document Git during workspace setup; ordinary drafting and corrections edit the current file and produce incremental checkpoints without a new branch, worktree, or per-edit confirmation. A change of chapter drafting logic must consult the chapter's pre-drafting Git text rather than carry forward the previous logic, unless the user explicitly requests that; this textual reference is independent of the new commit's parent, so other chapters retain their latest edits.

Chapter origins are recorded before substantive drafting and retrieved by file/section. Optional worktrees preserve genuinely parallel proposals, but are not the default for small changes. The model asks about material uncertainty, not permission to create a reversible local checkpoint; hooks, dirty/staged human edits, locks, source preservation, and the prohibition on automatic push remain in force.
