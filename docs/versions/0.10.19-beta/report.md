# 0.10.19-beta report

## Changes
All era blank quizzes use a single-question player. The desktop number sheet sits to the right; mobile keeps a bounded, scrollable number sheet below the question. Existing answer boxes retain their design. Each question is graded as a whole with Enter or a touch button, with a small hand-drawn O/X beside the number. Correct answers advance after one second; wrong answers show a five-second review that can be skipped immediately or paused. Reduced motion and company-mode animation policy are respected.

A successful final submission opens full-denominator integer statistics and every submitted wrong question. The account wrong-answer screen offers eight era selectors and reads only a completed final workspace (or an older fully completed workspace). Partial active/paused records are marked as having no final submission. The goal is 80%, with a next-era link but no lock. New entries start blank locally. Previously saved final results remain unchanged until an explicit new submission succeeds; all rows, including unanswered rows, are submitted together so attempts cannot mix. The existing backend does not archive every historical attempt.

The source-emphasis renderer builds only safe formatting nodes, strips attributes, and excludes executable/embedded content. Canonical source objects and answer display text are unchanged. A targeted Joseon society-comparison heading supplies the missing era instruction. The requested comma/slash parenthetical alternatives and explicit (=) alias acceptance are deferred. This release keeps the exact existing production grading rules and shows a short notice. The earlier implementation is preserved in Git history for a later matching API release.

White-sheet recall entry points are removed. Legacy links resolve to concept reading. No saved records, private source files, authentication or access settings are deleted or changed.

## Completed local verification
- Sequential functional tests: 86 assertions cover full-row grading, IME, one/five-second timing, stale timers, navigation, popup focus and pause, save/retry/conflict, account cleanup, fresh entry and whole-run submission.
- 128 Chromium/WebKit combinations cover eight eras, 320×780, 390×844, 1440×900 and 844×320, ordinary/company modes and reduced motion. Screenshots exposed a global-theme popup-background conflict; it was fixed and an opaque-background assertion added.
- The existing local private 81-edition fixture has 697 questions. Sequential checks: 2,837 assertions. Existing renderer checks: 1,661 assertions. The fixture includes the reported late-Joseon 36 and three culture examples; this is a regression fixture, not a claim to have read current authenticated production data.
- Safe emphasis: 208 assertions. Initial answer notation: 65; the split release verifies 67 existing-rule cases. Source-style metadata: 48. Existing manual save: 61. Restart: 60. IME: 75. Source-workspace binding and history/account-session tests pass.
- Removed-tab checks cover 12 legacy era routes, three readers/sessions, 144 renderer screens and 24 isolated Chromium/WebKit layouts. Existing semantic-library checks: 85. Affected older private-fixture browser checks are separately identified where only syntax was checked.
- Fresh-entry integration covers all three script readers plus six Chromium/WebKit native Back/Forward flows, including cancellation and failed-save protection. Final-wrong DOM regression covers 697 questions and 702 input slots, with zero writes; its final UI/keyboard pass covers 20 isolated Chromium/WebKit cases.
- Full-run submissions exceeding the API 256KiB JSON limit are rejected before network I/O; inputs and the previous final record stay intact. Network 413 responses can be corrected and submitted with a new mutation.
- Deployment health, CI and artifact guards: 36 tests. Syntax and whitespace checks pass. Independent review found and verified fixes for multi-slot feedback labels and repeated-popup keyboard handlers.

## Additional UI/UX review
The later independent review used the actual Joseon/Goryeo/Opening reader hierarchy with local full-era source fixtures, rather than only a minimal quiz host. It found and verified fixes for:
- The desktop reading-column limit made the question pane only 436px wide. Quiz practice now uses the available 1,080px shell and a 796px question pane at 1,440px; ordinary prose-reading widths and mode tabs remain intact.
- On a 844×320 viewport, focusing the popup skip button initially scrolled its title and question start out of view. The popup now starts on keyboard-scrollable question content, while its title, countdown, pause and skip controls remain visible. PageDown, Tab/Shift+Tab, immediate Enter skip and paused reading remain available.
- The light study-page next-era link inherited a low-contrast game color (1.15:1). Explicit normal/focus/hover colors and distinct check/submit buttons prevent that palette collision.

The final actual-reader pass covers 24 Chromium/WebKit combinations (three readers, four viewport sizes), including real 172-item navigation, classification response slots, long source questions, pause/skip and final-submit access. The updated 128-combination quiz pass and six native Back/Forward lifecycle flows also pass. These are isolated desktop-engine tests, not physical mobile-device or authenticated production-account verification. Screenshot evidence stays private and outside the artifact.

## API and split release
The matching API sourceGrade extension is on API main 3da478930ceae4ce06a764f6aa664f1bbaf18ab5 and is not deployed. Its deployment remains blocked by qualification/provenance requirements. No guard is bypassed.

For the requested immediate UI deployment, the frontend now restores the exact grading functions of the existing production FE aba1d25. Independent read-only comparison confirms these match the live API sourceGrade, classification slots, sequence and unordered-list helpers. Live grading module SHA256 is 77016748222bcd42ebe040bf236b15f03627ff9a2057316b185f06da80d5dd16. The live completion contract already supports explicit completed submissions. The live JSON limit was directly verified as 256kb. No API or DB change is needed for this split.

The split regression compares 6,970 answer variants across all 697 local questions with the previous production grader, plus exact helper-function equality. The source objects are unchanged. Existing final submission, empty-answer, retry/conflict and account-isolation tests still apply. The pending answer expansion is not advertised as complete.

## Verification limits
No user Chrome control, real account answer mutation, physical iPhone test or authenticated production quiz end-to-end test was performed. Local private data and screenshots are not committed or deployed. All latest-scope local checks and the candidate artifact build passed. Production completion is not claimed until the exact split frontend main CI/CD and live identity are verified. The API remains unchanged; answer-notation expansion stays pending.

## Split-release recheck
After restoring old grading, the 86 sequential assertions, three real-reader fresh-entry integrations, 2,837 assertions across all 697 source questions, 6,970 old/new answer comparisons, 67 notation checks, account review/grading checks and 36 deployment guards passed. All 24 actual-reader Chromium/WebKit layouts passed with the new grading notice. The screenshot harness now pauses its virtual clock so screenshot duration cannot consume the five-second review timer; product timing is unchanged. Earlier 128-case breadth and six lifecycle runs apply to the unchanged flow implementation.
