# 0.10.0-beta progress

Integrated f794a57c0fd7542c4efa2d3b16b56ad2626aeed1 without conflicts on main 3518020418e5cc45951764597f27034cb8b11730 in an isolated worktree. Runtime changes are only textbook-source-quiz.js and .css. No API, database, credentials, access rules, source data or concurrent alignment changes are included.

Integration checks passed:
- Restart: 58 assertions. Manual save: 56 assertions. Covered local-only clearing, no reset request/autosave, sparse explicit save, saved selection preservation, IME, repeated reset, in-flight/uncertain save protection, same-mutation retry, 409 merge, draft recovery, discard/reentry, owner isolation and multi-slot reset.
- Current Goryeo/Joseon adapter capability fixtures, completion/owner binding, 40 menu-checkmark cases, practice session/grading, semantic-library lifecycle, Hongmungwan/PDF, and all 697 current source questions passed.
- Legacy checked-review compatibility passed separately with the existing 79-edition Goryeo/Joseon fixtures. This does not replace the current 81-edition adapter tests.
- Isolated headless Edge passed 32 normal/company/host/viewport combinations, 22 application-navigation checks and 8 keyboard/re-practice combinations. Verified adjacent 44px Save / Complete and Retry controls, no retired check UI, focus return, no server write on reset, explicit later save and 320/390/1440/low-landscape layouts.
- Inspected the 320px and low-landscape save/retry screenshots. User Chrome and production accounts were not used. Physical Safari/iPhone testing is not claimed.

The exact release commit is then checked with the static build and version suite, published through the existing build/CD workflow, and verified through the deployment result plus active version/asset hashes. Local checks alone are not production completion.
