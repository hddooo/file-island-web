# Local source relationship corrections

`apply-history-known-integrity.py` applies pinned private page reviews to a separate
`private-data/correction-candidates/known-integrity-*` candidate. Preserve the previous
candidate and its evidence. Review inputs contain source material and stay outside Git.
No API, DB, remote upload or deployment is part of this operation.

The review pins the original PDF SHA, each baseline page SHA and original render SHA.
Application verifies native character ID/text pairs and leaves quiz bytes unchanged.
The API revision remains the full PDF SHA. Semantic bundle content needs its separate
file inventory/tree pin; quiz `source_version` and numeric progress CAS are distinct.

After copying the frozen candidate to a new private correction directory:

```sh
python scripts/apply-history-known-integrity.py "$NEW_REVISION" "$PRIVATE_REVIEW"
python scripts/verify-history-semantic-coverage.py "$NEW_REVISION"
python scripts/verify-history-revision.py "$NEW_REVISIONS_ROOT"
node scripts/qa-history-known-integrity.cjs "$BASE_REVISIONS_ROOT" "$NEW_REVISIONS_ROOT" "$EVIDENCE/source-regression.json"
python scripts/test-history-known-integrity.py
```

The source regression checks all 147 page schemas, exact bounded changed-file scope,
private reviewed subheading/figure/answer-display relations, all eight quiz bytes and
versions, and the immutable 298-file legacy snapshot. Run the reading and retained
relation browser suites with the candidate, then compare affected regions with the
original PDF. Reproduction and automatic identity checks do not establish a complete
human audit. Save commands, final commit/tree, per-file bundle hashes, visual coverage,
failed/not-checked items and unreviewed scope in private evidence. Keep renderer-only
width/emphasis findings separate. Do not mark a candidate active or release-ready on
these source checks alone.

`apply-history-source-styles.py` supports a separate `style-integrity-*` candidate
for the agreed reviewed per-span style union. Its character-level normalization
permits span splitting and the two style/audit fields only; text, order, original
properties, manifest, quiz and asset bytes remain identical. Unknown colors,
yellow backgrounds, false emphasis flags and missing/wrong source audits fail.
Private style reviews and original pixels remain outside Git. The source worker's
unchanged renderer smoke does not prove that a later FE applies these styles.

## Recovered review inputs and branch diagrams (2026-11-03)

The four private review inputs are retained under each complete candidate's
`validation/` directory: `quiz-review-map.json`, `reviewed-diagram-overrides.json`,
`reviewed-page-overrides.json`, and `reviewed-image-classifications.json`.
`verify-history-review-inputs.py <revision> <report>` checks their source/count/hash
binding without printing textbook prose. The complete rebuild still needs all
seven inputs listed in `rebuild-history-revision.py`; locating an old review does
not add human-reviewed coverage.

The semantic reader now renders verified raster-transcription branch relations
as nested lists with connector lines. It requires the matching PDF SHA/page,
verified image audit, unique source tokens and an acyclic, single-parent graph.
Ambiguous metadata keeps the complete original text. The full transcription is
also available in a native keyboard-accessible disclosure. Only eligible two-column
branch diagrams receive narrower label columns; merged tables and comparison
matrices retain their topology. The existing verified 79th-edition diagram works
without changing any of its immutable source files. New 81st-edition activation
still belongs to the separately verified source/API release.

```sh
node scripts/test-textbook-source-branches.cjs
node scripts/qa-history-source-branches.cjs "$QA_OUTPUT" "$PRIVATE_REVISION" 65
# For the unchanged 79th edition, pass its private revision and PDF page 63.
```
