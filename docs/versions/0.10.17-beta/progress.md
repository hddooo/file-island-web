# 0.10.17-beta progress

- [x] Registered both additional user requests in the November 12 work log.
- [x] Implemented complete-line emphasis in the existing public rendering layer without private source text.
- [x] 32 focused cases, 61 supplement cases, 36 royal-note cases, 451 term forms, and tooltip-interaction regression passed.
- [x] Six synthetic WebKit views passed at 320/390/1440px across two themes; both requested lines use weight 750 and preserve tooltips.
- [x] Exact changed-file verification on the actual private bundle: 165 assertions across 20 views, plus 8 concept/exam teardown views.
- [x] Only two requested list items gain full emphasis; all other DOM/text/TOC/IDs remain baseline-equivalent after removing those wrappers. Tooltip and exact node restoration pass; private bundle hash unchanged.
- [x] 36 deployment/recovery tests, source syntax, standalone-auth freshness and whitespace checks pass.
- [x] Separate commit `4b344fcba14f38cd3f40c68089a3f933c357f493`, validated static artifact, successful CI/CD and matching live app-version.
- [x] Installed deployment controller reported 1,727 verified files and the exact local manifest hash. Protected history asset remains 401 without a member session.
