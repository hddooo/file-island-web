# 0.10.16-beta progress

## Current state
- [x] Inspected both user-provided login/signup reference images.
- [x] Registered the request in the November 12 KST work log before implementation.
- [x] Isolated worktree from `346fbf04e1cf4840ef8c6d25f3a616560f1dd1ea`; existing work preserved.
- [x] Implemented public gate and in-app auth presentation.
- [x] Confirmed production `premium/plan` omits `auth.rememberMe`; 90-day retention is not currently advertised/supported.
- [x] Added public gate capability guard and manual unsupported-option fallback.
- [x] Final Chromium/WebKit: 16 in-app cases and 80 public-gate cases passed, including screenshots.
- [x] 225 authentication/account unit assertions, 36 deployment/recovery tests, and member-access harness passed.
- [x] Generated public HTML freshness, JavaScript syntax and whitespace checks passed.
- [x] Exact commit build, push, CI/CD and production SHA verification: `4635ef7951951db99d4cfc0cb22af356f2cbc047`.
- [x] Live public gate: Chromium/WebKit × desktop/mobile, 4/4 views passed; no unexpected request failures or page errors.

## Decisions
- The actual unauthenticated entry is `/auth/login.html`; styling only `#account` would not meet the request.
- Keep nginx access rules intact. `scripts/auth-login.template.html` and `build-auth-login.cjs` generate the standalone gate with existing public art/font bytes inlined. No protected learning content is embedded.
- `media/auth-digivice.css` is shared with that generated page. Presentation observers do not read or write account state.
- Actual rendering revealed the terminal theme's global animation reset; auth scenery explicitly overrides it while preserving reduced-motion/paused behavior.
- The early low-landscape font test failed before fonts/styles settled. QA now waits for splash removal, font readiness and image decode; all 16 final cases passed with those readiness checks.
