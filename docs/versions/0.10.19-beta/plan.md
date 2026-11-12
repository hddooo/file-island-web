# 0.10.19-beta plan

## Requested scope
- Renew all era blank quizzes as a single-question player with a question-number and O/X sheet, compact prompt/input, and smaller feedback below.
- Enter or a touch button grades the whole current question. Draw O/X for one second; advance correct answers, and show wrong-answer review for five seconds with immediate Enter/touch skip and a pause control.
- Show completed/total and integer accuracy. Explicit submission on the last question opens statistics and all wrong questions.
- Aim for 80% and offer the next era without locking lower scores out. A new era-quiz entry starts a blank local run; only a successful explicit submission replaces the latest saved result. The account wrong-answer view uses that latest submission, separated by era.
- Remove the white-sheet recall tab and normalize its old links without deleting saved data.
- Accept two required parenthetical answer terms separated by comma or slash, and either complete term of an explicit (=) alias. Keep canonical answers and ordered-list grading intact.
- Safely display small source-emphasis tags, including the three reported Joseon items, without arbitrary HTML or source mutations.

## Boundaries
Preserve the existing answer-box design, source text/IDs, account identity and CAS/retry safeguards. Do not use the user's Chrome or publish private fixtures. Historical submissions are not an archive: the current API stores one latest workspace per user/quiz/source version. Entry and drafting do not change it; final submission replaces the whole run to prevent old/new answer mixing.

## Release gate
Release the reviewed UI with the exact existing production grading rules. Defer comma/slash parenthetical alternatives and explicit-alias acceptance until the API can be deployed through its verified path. The UI explains this limitation. Do not bypass or modify deployment hash/provenance controls. Run functional, regression and visual checks, then verify the exact frontend commit's CI/CD and live identity.
