# 0.10.19-beta report

## Changes
All era blank quizzes use a single-question player. The desktop number sheet sits to the right; mobile keeps a bounded, scrollable number sheet below the question. Existing answer boxes retain their design. Each question is graded as a whole with Enter or a touch button, with a small hand-drawn O/X beside the number. Correct answers advance after one second; wrong answers show a five-second review that can be skipped immediately or paused. Reduced motion and company-mode animation policy are respected.

A successful final submission opens full-denominator integer statistics and every submitted wrong question. The account wrong-answer screen offers eight era selectors and reads only a completed final workspace (or an older fully completed workspace). Partial active/paused records are marked as having no final submission. The goal is 80%, with a next-era link but no lock. New entries start blank locally. Previously saved final results remain unchanged until an explicit new submission succeeds; all rows, including unanswered rows, are submitted together so attempts cannot mix. The existing backend does not archive every historical attempt.

The source-emphasis renderer builds only safe formatting nodes, strips attributes, and excludes executable/embedded content. Canonical source objects and answer display text are unchanged. A targeted Joseon society-comparison heading supplies the missing era instruction. Parenthetical required terms accept comma/slash separators; explicit (=) aliases accept either full name without accepting partial, extra or reversed required terms.

White-sheet recall entry points are removed. Legacy links resolve to concept reading. No saved records, private source files, authentication or access settings are deleted or changed.

## Completed local verification
- Sequential functional tests: 86 assertions cover full-row grading, IME, one/five-second timing, stale timers, navigation, popup focus and pause, save/retry/conflict, account cleanup, fresh entry and whole-run submission.
- 128 Chromium/WebKit combinations cover eight eras, 320×780, 390×844, 1440×900 and 844×320, ordinary/company modes and reduced motion. Screenshots exposed a global-theme popup-background conflict; it was fixed and an opaque-background assertion added.
- The existing local private 81-edition fixture has 697 questions. Sequential checks: 2,837 assertions. Existing renderer checks: 1,661 assertions. The fixture includes the reported late-Joseon 36 and three culture examples; this is a regression fixture, not a claim to have read current authenticated production data.
- Safe emphasis: 208 assertions. Answer notation: 65. Source-style metadata: 48. Existing manual save: 61. Restart: 60. IME: 75. Source-workspace binding and history/account-session tests pass.
- Removed-tab checks cover 12 legacy era routes, three readers/sessions, 144 renderer screens and 24 isolated Chromium/WebKit layouts. Existing semantic-library checks: 85. Affected older private-fixture browser checks are separately identified where only syntax was checked.
- Fresh-entry integration covers all three script readers plus six Chromium/WebKit native Back/Forward flows, including cancellation and failed-save protection. Final-wrong DOM regression covers 697 questions and 702 input slots, with zero writes; its final UI/keyboard pass covers 20 isolated Chromium/WebKit cases.
- Full-run submissions exceeding the API 256KiB JSON limit are rejected before network I/O; inputs and the previous final record stay intact. Network 413 responses can be corrected and submitted with a new mutation.
- Deployment health, CI and artifact guards: 36 tests. Syntax and whitespace checks pass. Independent review found and verified fixes for multi-slot feedback labels and repeated-popup keyboard handlers.

## API and release gate
The matching API sourceGrade change is on API main 3da478930ceae4ce06a764f6aa664f1bbaf18ab5. Typecheck/build/lint and 325 unit tests passed; exact-SHA build run 43148624263 succeeded. Production deployment remains blocked by controller identity/provenance differences and the absence of a matching approved image manifest. Frontend production deployment is withheld to avoid storing grades inconsistent with its display. No ad-hoc route is used to bypass these controls.

## Verification limits
No user Chrome control, real account answer mutation, physical iPhone test or authenticated production quiz end-to-end test was performed. Local private data and screenshots are not committed or deployed. All latest-scope local checks and the candidate artifact build passed. Production completion is not claimed until authorized API deployment and exact frontend main CI/CD/live verification succeed. The feature branch is pushed; main remains unchanged.
