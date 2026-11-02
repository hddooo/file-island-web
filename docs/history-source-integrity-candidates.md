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
