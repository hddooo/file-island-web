# 0.10.19-beta progress

- [x] Single-question player, number sheet, 1-second O/X, 5-second wrong review, Enter/touch skip and pause.
- [x] Final submission, integer statistics, complete wrong-question review and safe emphasis rendering.
- [x] Compound separators and explicit aliases with matching API grading tests.
- [x] 80% goal and next-era link without a lock; fresh local runs and explicit whole-run snapshot submission.
- [x] Removed white-sheet recall navigation; old links fall back to concept reading without data deletion.
- [x] First functional, regression and mobile passes completed, including all 697 local source-fixture questions and 128 isolated browser combinations.
- [x] Complete final fresh-entry lifecycle and era-specific final-wrong review checks after the latest requirements: 86 sequential assertions, three integrated readers, six native Back/Forward browser flows, and 697 final-wrong questions/702 inputs.
- [x] Complete an additional independent UI/UX pass using actual reader structure: wide desktop question pane, readable link/action contrast, low-viewport popup title/controls, keyboard-scrollable body and preserved mode navigation. Re-run 24 actual-reader, 128 quiz and six lifecycle browser cases.
- [ ] Deploy matching API through the authorized, verified deployment path.
- [x] Commit and push the frontend candidate branch; build the exact artifact and verify all 1,726 public-file checksums. Feature branches do not trigger this repository's main-only CI/CD.
- [ ] Verify authorized main CI/CD and live release identity after the API gate is resolved.

API source main 3da478930ceae4ce06a764f6aa664f1bbaf18ab5 passed typecheck, build, lint, 325 unit tests and the exact-SHA build workflow. It is not yet deployed. The installed deployment controller identity/provenance and the workflow expectations differ; no guard was bypassed and no deployment/security setting was changed.
