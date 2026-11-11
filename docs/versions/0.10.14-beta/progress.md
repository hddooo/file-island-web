# 0.10.14-beta progress

Implemented the IME keyboard fix and exact 의금부 display name. The original key handler discarded composing events and post-composition Enter, while no blur/composition completion path graded the committed answer. The updated temporary practice waits for the final input, grades only that slot and advances once. Native Tab movement, pointer interruption, new composition, keyup and account/dialog invalidation are handled without writing saved records.

Local synthetic checks passed: 57 IME assertions, 17 grading checks, 13 session checks, 20 progress checks, progress binding, explicit completion, wrong-answer module and synthetic PDF tests. Display-label checks cover the existing native control, accessible name, routes and other destinations. The 531 Joseon exam-layout and 61 tooltip-supplement regressions passed before the additional name edit.

Build metadata checks passed. The static-site build intentionally rejects uncommitted runtime changes; rerun after the final commit. Exact CI, deployment and live version checks have not yet run. Browser visual and physical-device verification are unperformed; existing CI intentionally does not install or run browsers.

The requested naming change is limited to the authenticated Table 23 subordinate label. It now uses an h4 like the surrounding royal names, so normal/company styling follows the same rules. It is excluded from numbered TOC generation to retain all existing heading IDs. Forty-six synthetic checks confirm exact label, source/other-mode preservation, repeated rendering and unknown/source guards. The original two-line source structure was independently read from the private bundle; the bundle itself was not copied into the repository.

The session-wrapper and transport regressions passed. The legacy test-joseon-script-reader test fails its old literal blank-space expectation at line 18 on both this candidate and the unchanged 4eb254b baseline. It is not counted as a pass and was not weakened. The focused person-label test compares full other-mode DOM with that baseline instead.
