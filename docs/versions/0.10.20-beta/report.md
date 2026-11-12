# 0.10.20-beta report

## Corrections
The number sheet inherited leaf typography and allowed wrapping inside flex children. The current patch explicitly sizes and keeps number/state spans on one line without shrinking the touch target. The title is 문제 and the visible legend is removed; aria state labels remain.

Previously, an Enter used to commit Korean composition was ignored, and a 100ms post-composition guard could ignore the next key. The sequential player now records an explicit Enter intent, waits for the committed input event turn, and grades exactly once. Chrome-style composing keydown, Safari-style compositionend-before-229 and mobile completion keyup are covered. Composition end without Enter does not submit. The grade button is removed.

Wrong answers stay in the question with their red inline correct answer. No modal or focus trap is created. A five-second timer can be paused, or a separate nonrepeating Enter immediately advances, including during the wrong mark. Navigation and cleanup cancel pending keyboard/flow timers. Final submission and account persistence are unchanged.

Company-mode CSS previously hid history SVGs and suppressed animations. Only the quiz grading SVG now overrides that policy. Its large, translucent overlay does not receive pointer events. It draws for one second unless reduced motion is requested. The rest of company-mode media and animation policy is untouched.

The persistent goal and dirty-change text are removed. The 80% result goal, explicit submit, failure/retry messages and unsaved-leave confirmation remain. Grading extensions are still deferred; the production grader/API are unchanged.

## Evidence and limits
The supplied screenshot and new visual evidence stay local. Tests use isolated Chromium/WebKit and synthetic or authorized local source fixtures, never the user's Chrome or production answer mutations. Physical Korean keyboard/mobile IME behavior is represented by browser event sequences, not claimed as a physical-device test. Exact CI/CD and live identity remain release gates.

## Latest requested layout
The question list is text-only, in two top-to-bottom columns separated by a center rule. It keeps source order and keyboard order, uses 28px desktop rows and 44px small-screen/coarse-pointer rows, and preserves selected/result labels. Accuracy is centered and larger; the fraction sits right without solved/unsolved wording. Both values tween for 320ms upward or downward; assistive text always contains the exact current value and reduced motion renders immediately.

## Verification
112 functional assertions passed, including composition orders, one-press commit, wrong skip, stale timers, count increases/decreases, reduced motion, explicit submit and account cleanup. All 697 local source questions (2,837 assertions), 6,970 old-production grading comparisons and three actual reader-entry integrations passed. The current browser matrix covers 128 combinations, including 1–172 labels, transparent large marks in ordinary/company modes, no popup/button and exact statistics. Actual reader structure passed 24 layouts. Independent review found and fixed a legacy enterKeyHint override; the sequential field now retains done. Production grading extensions remain deferred.
