# 0.10.16-beta plan

## Goal
Rework the actual public `/auth/login.html` entry and the in-app `#account` form using the user's two layout references. Keep the form inside the horizontal device, place signup below the primary full-width login action, and retain the File Island pixel font and world identity.

## Scope
- Existing File Island island artwork, coastal scenery and partners; animated clouds, water and digital lights behind the device.
- Keyboard-accessible password visibility controls, visible labels, 16px inputs and 44px controls.
- Mobile/low landscape scrolling, reduced motion, hidden-tab and low-power pause.
- Verify remember-login behavior. The public gate previously exposed the option without checking server capability; add the same explicit capability guard used by the in-app form. Do not enable backend retention or change cookie/security settings.

## Acceptance
- Isolated Chromium and WebKit functional, regression and visual checks at 320/390/1440px and 844×390.
- Preserve API payloads, membership approval, CSRF header, cookie coordination, return hash and credential non-persistence.
- Test supported and unsupported capability responses and manual fallback; no silent auth retries.
- Generate public HTML from its source template; only presentation assets are inlined because `/media` remains member protected.
- Commit, verify static artifact/CI and confirm exact SHA on production before reporting deployment complete.
