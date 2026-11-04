# Mobile login asset failure review

Baseline: production/main eb4a033238b683dc69bc0287e55fcdf3862bad7f. No production authentication requests were made for this investigation.

Isolated actual-index Chromium at 320/390px reproduces the reported 512px Koromon and broken Greymon when file-island.css and world-immersion.css fail together and greymon-scene.webp fails. account-ui.css failure alone does not reproduce the oversized image; each layout stylesheet alone retains a bounded image. This demonstrates the failure mode, not the user's actual network cause.

Minimum recovery: login HTML image dimensions are 124x124 rather than natural 512x512. Each login image gets a once-only error handler that switches its WebP to the existing PNG. Normal loaded CSS keeps the existing 80px mobile rendering. No character asset, authentication policy, data, session, cache storage or production service is changed. No whole-page reload or retry loop is introduced.

Old/new login CSS, account JS and both WebPs have no diff between 431463ab and eb4a033. The installed deploy controller prepares a complete release directory and swaps its current symlink using mv -Tf. Current old-build CSS and new-build image requests both return200 with public,max-age=0,must-revalidate. No serviceWorker registration was found in index or media JS. These checks do not rule out transient client/network failures during the incident.

Validation: scripts/qa-login-assets.cjs uses only local files and mocked API responses, with isolated Chromium/WebKit and widths320/390. QA_BASELINE=1 reads baseline HTML from git; ASSERT_FIXED=1 requires bounded, decoded images in normal/individual CSS failure/combined CSS+WebP failure scenarios. Evidence is ignored under evidence/login-assets. WebKit is not a physical Safari/iPhone test. Server connection/remember-me diagnosis remains with the API worker; this visual patch does not claim to fix it.

Existing offline connection retry is retained: the signed-out renderMain path requests public premium/plan via GET only. The regression harness injects an initial GET network failure, clicks the explicit retry, requires exactly one additional plan GET after the explicit click and no POST, verifies email/password field usability without submitting, and preserves synthetic local/session storage markers. Account UI45, account synchronization16, timeout22, and version-build checks passed. No new authentication retry or connectivity success assumption is introduced.

Infrastructure incident-window evidence supplied by parent: 1047 NPM requests during14:50–15:05UTC, no429/499/502/503/504 and no upstream-connect failures. Logged account CSS and character200 responses had exact expected byte lengths. Requests were not attributed to the user's phone. Client cache/rendering and pre-server network failures remain unconfirmed; this patch does not attribute the incident to missing deployment files.
