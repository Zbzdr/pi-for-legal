> **Attribution:** Legal approval, surgical-edit, and document-capability delegation concepts are adapted from Anthropic's claude-for-legal/commercial-legal at revision `4a6c651889c97cc9140580363c73e0eb17379c2b` under Apache-2.0 and modified for Pi. The verification contract below is Pi-specific; no third-party DOCX helper implementation is bundled. See the package NOTICE.

# Model-directed DOCX workflow and verification contract

## Capability mapping

The legal upstream's `commercial-legal/skills/vendor-agreement-review/SKILL.md` delegates tracked Word changes to a general `docx` Skill. That document Skill is a separate capability, not an implementation in Claude for Legal. Pi can load an independently configured document Skill, use a suitable tool, or execute an approved model-planned local procedure.

A reference implementation of the general workflow is documented at https://github.com/anthropics/skills/tree/main/skills/docx. Its license is separate from Claude for Legal's Apache-2.0 license. This link is for discovery and comparison, not an installation instruction, a claim of availability, or permission to copy its code into this suite. Prefer an already available capability and use its currently loaded documentation.

## Planning

A Word deliverable requires an explicit user request; ordinary text revision remains Markdown work. Default to character, word, phrase, then sentence edits in that order when each smaller edit suffices. DOCX/Markdown lossless round-tripping is not available: comments, existing tracked changes, fields, anchors, and layout require separate preservation and verification.

1. Inventory paragraphs, tables, fields, hyperlinks, text boxes, headers/footers, numbering, bookmarks/comments, and existing revisions relevant to each approved edit.
2. Anchor edits to actual source clauses and exact text or verified structural locations. Visible text can be split across runs; tabs, line breaks, field boundaries, revision wrappers, and different stories must not disappear from the matching model.
3. Preserve run properties and structural anchors. Merging adjacent runs is safe only when their properties and structural context are compatible; do not join text across meaningful boundaries just to make a string match.
4. Separate preparation from mutation. Read or render only what the user authorized; generate proposed language without changing the source. Obtain approval for the final plan and output location.
5. Back up the source into a unique run directory and work on a separate copy. Keep intermediate files and any model-generated code in the same active matter. Do not overwrite previous output without explicit approval and a backup.

## Execution

The execution method is not fixed. A general DOCX Skill may unpack/edit/repack OOXML; another capability may expose a tracked-change API. The selected method must preserve the source, unrelated content, formatting, relationships, and prior revisions. It must not normalize the entire document unnecessarily.

For OOXML changes, use namespace-aware operations. Do not assemble XML by naïve insertion into serialized opening tags: self-closing nodes, existing attributes, escaping, namespace declarations, and schema order matter. Insertions/deletions must be represented as genuine tracked changes with the approved author and valid metadata; comments, if requested, need correctly linked parts and anchors. A visual strike-through is not a tracked deletion.

Do not invent success when a capability refuses a structural case. Offer a narrower edit or a Word-ready change table. Do not silently accept prior changes, remove fields/comments, or flatten formatting to make an edit succeed.

## Verification gates

A ZIP integrity check or the presence of `w:ins`/`w:del` alone is insufficient.

- **Package/structure:** verify ZIP integrity and all changed XML parts, including settings, content types, and relationships. Check root/namespace validity, referenced parts, unique required identifiers, and applicable schema/order constraints when a validator is available.
- **Change coverage:** every approved text change must be tracked. Detect untracked text edits and unintended changes outside the approved scope; check anchors and comments when used.
- **Original view:** rejecting only this operation's revisions should reconstruct the relevant original content/structure. Preserve pre-existing revisions separately; do not reject everything indiscriminately.
- **Accepted view:** accepting only this operation's revisions should produce the approved new text at the intended locations. Handle paragraph marks, tabs, fields, numbering, and table structure rather than comparing flattened strings alone.
- **Preservation:** compare unmodified parts/content and verify the original source itself is unchanged. Record any unavoidable metadata/serialization differences rather than calling them substantive edits.
- **Application/rendering:** when a renderer or Word-compatible application is available, open/render and inspect the affected pages (all pages if layout may change globally). Check pagination, tables, numbering, fields, comments, and revision display.

Choose available validators and comparison tools, or plan a reviewable local validation procedure. Record which checks actually ran, their results, and any limitations. Do not claim XSD validation, visual review, formatting fidelity, or Word compatibility without performing the corresponding check. If critical structural or change-coverage verification cannot be completed, provide a provisional artifact or change table with explicit limitations, not a verified redline.

## Delivery

Report the source, unique backup and output paths, approved change list, author, actual verification evidence, and unresolved limitations. Update the active matter's work-product index only for a real deliverable. Sending/uploading, signing, replacing the source, and accepting legal positions remain separate consequential actions.
