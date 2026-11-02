# Private textbook learning and subject navigation

## Local implementation status

Based on HanQ dev bf136e9b259e926adc8be4db857d97d3a8a1df04 and hanq_api dev 4207e6ff920d00767a486a13930f398b392e826f. Code has not been pushed, deployed, or activated. No production account configuration or database data was changed.

- Top-level subjects: Korean history and TOEIC. Existing history routes, question IDs, exam page, and storage records remain.
- Era story/culture entry points now open the private textbook reader. Legacy culture URLs continue to resolve. Existing summary, quiz, and era problem tabs remain separate.
- Eight textbook era ranges and four appendix/front/back sections preserve PDF order. Changing era updates the host chapter and quiz route. Appendices have their own routes without a mismatched era quiz.
- Source PDF pages and printed page numbers are displayed separately. Reading position is local, per account and source checksum; no page images or extracted text are persisted in browser storage by this implementation.
- The reader uses original full-page raster geometry and conservative horizontal source regions, with controlled pan, fit-width and enlargement. Default scaling gives source spans of 6–24 PDF points at least 16 CSS pixels within each region (image-baked text cannot be measured this way). Region mode trims only proven exactly-white side margins using all original PNG pixels plus 4pt padding. Common page-wide horizontal bounds preserve column alignment; the original full-page view retains margins. Cropped regions keep the original full-page-derived scale rather than enlarging to a new width floor. It does NOT claim semantic HTML reflow or human verification of all 144 pages. Automatic regions are explicitly labelled unverified.
- Enhanced blue source-bold text is the default, but used only if the page's pixelPreservationVerified flag is true; otherwise the reader explicitly falls back to original. Original source view is always available.
- Logging out immediately removes local auth and private blobs, before the revocation request completes. Other same-origin tabs receive non-secret invalidation messages through storage/BroadcastChannel; focus/pageshow rechecks the live session. Tokens and account IDs are never broadcast. Each cookie-mutating auth operation immediately requests the shared `hanq:auth:cookie` Web Lock, so an active refresh cannot make a queued logout join the shared FIFO after a later signin in another tab. The per-tab fallback queue is used only without Web Locks; cross-tab cookie ordering is not guaranteed in that case. A failed server logout remains separately reported. The existing ten-second network deadline aborts fetch and rejects late JavaScript results, but if a transport ignores abort, an eventual HTTP response may still mutate cookies; client-side state guards cannot guarantee cookie ordering for that unsupported transport behavior.
- Shared-lock acquisition itself has no timeout: a suspended tab holding the lock can delay queued auth operations, even though local logout clears the visible session immediately. A future bounded wait must abort only queued lock acquisition and stop that timer as soon as the callback acquires the lock; racing the whole operation against a timeout must not release an active cookie request early.
- TOEIC LC Part1–4 are empty preparation entries. RC Part5–7 provide manual four-option grading, grouped passages, explanations, stars/wrong review and isolated local state. Only five original demo questions are included, clearly labelled non-official. External ETS/YBM links do not copy their question corpus. No official scores or complete mock-test coverage are claimed.

## Private data boundary

Textbook source, renders, enhanced images, extracted data and visual fixtures are not static frontend assets. Generated data is in a sibling private data directory; evidence and test-tool directories are ignored by Git and Vercel. Do not commit/upload those directories or put them behind client-side login alone.

The paired Nest API applies existing JWT/live-session authentication plus an exact configured owner UUID on every manifest/page/image endpoint. A registered member or premium user is not automatically a textbook owner. Missing configuration fails closed. Routes return private, no-store responses and never public signed URLs.

Deployment requires explicit authorization, a verified owner UUID configured server-side, a private persistent data volume outside BOTH frontend and backend repositories/static roots, and supported API hosting access. No owner value, secret or data volume has been configured. PostgreSQL-backed production integration and mobile/desktop browser rendering remain to be verified before release.

## Verification

Run from this frontend checkout. DOM tests require jsdom (`npm install --prefix .test-tools jsdom`). Extractor tests require PyMuPDF, Pillow and NumPy, plus the original private source data. No dependency directories belong in the code patch:

- node scripts/test-private-textbook-dom.cjs (DOM routing/lifecycle only)
- node scripts/test-private-auth.cjs (synthetic shared FIFO across two tabs, signin/signup following logout/logoutAll, invalidation and same-tab fallback)
- node scripts/test-toeic-practice.cjs --dom
- node scripts/test-api-timeout-10s.cjs
- node scripts/test-cbt-binary-client.cjs
- node scripts/test-account-sync.cjs
- node scripts/test-learning-progress.cjs
- node scripts/test-run-controller.cjs
- node scripts/test-quiz-progress.cjs
- python -m unittest discover -s scripts -p 'test_textbook*.py' -v (requires sibling private source data)

The optional browser script requires Playwright and a usable Chromium. Browser checks were not completed here: Chromium launch is blocked by runtime socket restrictions; supported cloud browser could not reach loopback and rejects file URLs. Do not report the browser assertions or screenshot cases as passed. The DOM tests do not establish responsive layout quality.

Full existing aggregate front-end verification is not yet a pass. Some historical UI tests assert the replaced story/culture tabs and require updates; 61 original textual dependencies were restored from the pinned commit, but the aggregate stops at missing media/joseon-story-grid.png and reports other missing historical comic images. The cloud checkout omits that unrelated binary corpus. The API unit suite passed separately; real PostgreSQL integration was not run.

## Local verification record

- Reader DOM: 50 assertions, including source-scale floor, lifecycle cleanup, era/quiz routing and Back/Forward behavior.
- Private auth: 42 synthetic assertions, including shared FIFO cookie ordering; not a live-browser cookie-jar proof.
- TOEIC: 54 controller assertions plus 5 JSDOM assertions.
- Private extraction/enhancement: 13 Python tests; 144 page records and original renders; 293 automatically selected regions after conservative table-envelope protection. Pixel preservation checks cover every page, but semantic region review and complete human transcription/layout verification remain outstanding.
- Adjacent regressions: learning progress 67, run controller 125, quiz progress 15, timeout 22, authenticated binary client 6, account sync 16, auth restoration 28, CBT auth transitions 11.
- Backend: 118 unit tests (including 5 focused textbook HTTP tests using stubbed authentication), typecheck, lint and build passed. No live PostgreSQL or real session-revocation integration was exercised.
- Private source comparisons visually sampled 10 pages across all eight eras; these are raster/source audits, not browser screenshots.

These are separately scoped suite results, not a claim that the legacy aggregate or a production release passed.

Additional recovered-fixture check: CBT explanations passed 6,568 assertions covering 500 questions. Older ResourceLoader-based browser harnesses are incompatible with the installed jsdom version and were not counted as UI passes.

## Table context correction

An independent audit found 117 row-interior intersections across 53 pages in the initial 531-region segmentation. The revised segmentation protects complete detected table envelopes, including all row/cell bounds and merged-label extents. Unknown or unreliable table geometry uses a whole-page fallback. The resulting 293 regions trade smaller sections for intact context; they do not establish semantic table detection completeness. Original and enhanced page images are unchanged.

The verified padded horizontal viewport reduces source width by median 26.95% across the 144 pages, at unchanged source scale. This is a blank-margin/panning improvement, not a browser-measured usability result or text reflow.
