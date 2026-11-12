# 0.10.21-beta report

The latest manual pacing request supersedes the 0.10.20 five-second wrong-answer timer. No timer changes the question now. Both correct and wrong answers stay visible until another distinct Enter or explicit navigation. The one-second O/X animation, Korean composition handling, compact two-column list, animated counters and explicit saved final submission remain. API grading, account records and security controls are unchanged. Physical mobile keyboards remain untested.

On narrow viewports (up to 760px), the number sheet uses four top-to-bottom columns and 44px touch targets. Wide viewports retain two columns. Three-digit numbers and state labels stay unwrapped.

The latest correction places Previous / current question index and total / Next at the bottom left / center / right. The top solved fraction is removed, leaving centered accuracy only. The bottom number tracks the current question index, never the solved count, and animates for 320ms while its accessible label remains exact. Final submission remains explicit.

Both grading overlay marks are red per the latest request; number-sheet result colors and accuracy/text colors are unchanged.

Verification: 121 functional assertions, 128 Chromium/WebKit quiz cases, 24 actual-reader layouts, 697 source questions / 2,837 assertions and three reader-entry integrations passed. An independent reviewer verified four additional 320px/172-question/company-mode/engine cases, including 20-second stationary correct and wrong results, the four-column order and distinct current-index/accuracy values. Holding Enter cannot spill from the last question into final submission. No production account was mutated by tests.
