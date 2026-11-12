# 0.10.28-beta report

The current API only keeps the latest workspace. This release surfaces that existing completed result without writing, regrading or replacing the active draft. The sidebar shows its full-denominator integer score and actual server updatedAt, explicitly labelled recent save time in Korean time. A missing timestamp is not replaced with the browser clock. No prior attempts are fabricated. The separately authorized API archive will retain future submitted rounds.

Saved statistics use server correct flags and recorded values; the current source's canonical blanks provide the review layout. Back restores the current in-memory question without importing old answers. Full quiz exit discards unfinished answers, including scoped authentication-recovery drafts, while already submitted data remains untouched. Explicit submission with the existing unanswered confirmation remains a submission, not an abandoned draft.


## Verified locally

1. Functional: 58 history checks cover recorded correctness (including server/local disagreement), whole-exam floored score, real/missing timestamps, fresh input isolation, readonly history/PDF, failure/retry, late account response, scoped auth draft disposal and unchanged non-sequential recovery. Sequential 152, manual save 61 and PDF integration 25 checks also passed.
2. Regression: 4,421 statistics assertions across all 697 actual questions; all 6,970 legacy grading variants unchanged. Eight-era final wrong-note tests passed. No grader or API contract changes in this release.
3. Independent UI review: Chromium/WebKit at 320px and 1440px, normal/company modes, eight combinations passed. Actual Korean question screens and history PDFs inspected; three-digit navigation, scrolling, 44px history target and no horizontal overflow confirmed. Small history-caption contrast was corrected to #536371 normally and #8b949e in company mode, with computed text-fill verified. No unresolved P1/P2 findings.

The old API retains only its latest completed row. This is not a multi-attempt archive. It cannot reconstruct overwritten prior rounds. All fresh sequential edits, checks, navigation and leaving remain local; only explicit final submission writes. A submitted round with confirmed unanswered questions is still retained. Existing background-capable non-sequential textbook mode is unchanged. No private source material or account answers are included in committed test fixtures. No user Chrome, live account writes or production API changes were used for QA.

Official deployment and live hashes will be recorded after CI/CD completes, not asserted by this document.
