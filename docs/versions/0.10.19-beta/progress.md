# 0.10.19-beta progress

- [x] Single-question player, number sheet, 1-second O/X, 5-second wrong review, Enter/touch skip and pause.
- [x] Final submission, integer statistics, complete wrong-question review and safe emphasis rendering.
- [x] Compound separators and explicit aliases with matching API grading tests.
- [x] 80% goal and next-era link without a lock; fresh local runs and explicit whole-run snapshot submission.
- [x] Removed white-sheet recall navigation; old links fall back to concept reading without data deletion.
- [x] First functional, regression and mobile passes completed, including all 697 local source-fixture questions and 128 isolated browser combinations.
- [x] Complete final fresh-entry lifecycle and era-specific final-wrong review checks after the latest requirements: 86 sequential assertions, three integrated readers, six native Back/Forward browser flows, and 697 final-wrong questions/702 inputs.
- [ ] Deploy matching API through the authorized, verified deployment path.
- [ ] Commit the frontend candidate and build its exact artifact.
- [ ] Verify authorized main CI/CD and live release identity after the API gate is resolved.

API source main 3da478930ceae4ce06a764f6aa664f1bbaf18ab5 passed typecheck, build, lint, 325 unit tests and the exact-SHA build workflow. It is not yet deployed. The installed deployment controller identity/provenance and the workflow expectations differ; no guard was bypassed and no deployment/security setting was changed.
