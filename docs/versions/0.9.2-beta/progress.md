# 0.9.2-beta progress

Base: main bb51b9bc9f298c834f9e05ac3ed18d68c8c00cd3. Isolated branch/worktree for the menu-only change.

## Local verification, 2026-11-10

- Removed era-complete node creation/painting and its unused CSS. Removed only the check glyph from the legacy read badge, retaining its text and data.
- New no-checkmark suite: 40 cases (8 eras x 5 completion states), immutable stored model/workspace fixtures, preserved completion summaries and original menu nodes, no production writes.
- Passed existing era progress (21 checks), canonical ancient binding, explicit partial/empty completion, era review (14,533 checks), re-practice grading (17), account/session isolation (13), read progress (59), and explicit save/complete (53) suites.
- Isolated headless Edge: 20 all-era menu cases at 320/390/768/1024/1440px, default/company modes and repeated mode switches. No checkmarks, overflow, card replacement or route changes; review controls remain at least 44px high.
- Headless Edge wrong-answer review: 6 viewport/company cases, grade/reopen/Escape/focus/account-safe read behavior. Full-app unsaved navigation: 22 checks for cancel/discard and explicitly saved navigation.
- Inspected rendered 390px default and 1440px company menu screenshots. The user's Chrome profile/session was not opened or controlled; fixtures made no real-account writes.
- JavaScript syntax and git diff whitespace checks passed. The full private-source suite requires an explicit local fixture directory; an invocation without it stopped before tests and is not counted as a pass. No source data or quiz grading implementation changed.

Exact-commit static build, remote publication, CI/CD and live assets are checked after commit. Screenshots and raw logs remain excluded from Git. Physical iPhone testing is not claimed.
