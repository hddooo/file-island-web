# 0.10.14-beta plan

Base: 4eb254b661db5c1aa4e5772b7a250cd328b34770.

- [x] Reproduce the missed grading after an IME Tab commit without user account writes.
- [x] Grade the current blank on Tab/Enter, retain native composition, and preserve focus after pointer interruption.
- [x] Rename the existing wrong-answer destination to exactly 의금부; keep routes, API names and saved records.
- [x] Simplify only the requested 정도전 presentation and match existing royal-name styling.
- [x] Integrate and inspect the separate, localized left-pavilion artwork candidate.
- [x] Run isolated grading, owner/lifecycle and display-name regressions.
- [ ] Commit the reviewed changes, run the clean-tree static build, and verify exact-commit CI/CD and production metadata.

The user's browser, operating account writes, source material publication, unrelated prior candidates and security/permission changes remain out of scope. Existing build-only CI stays unchanged. Local browser startup is blocked by the previously confirmed socket restriction and is not retried.
