# Verification

Baseline: 34286466664550a7fe38b49cc1290dcc42347d67. Rules: hanq-collaboration-2026-11-01-v5.

1. Functional review: isolated Chrome with production formal-exams.js and synthetic API. 320/390/430 px images occupy 312/382/422 px. No horizontal overflow; aspect ratio intact. Desktop 1440 px retains 422 px height cap.
2. Regression: test-cbt-uninterrupted passes (checkpoint, continuous timer, reload position). final-submit and stars tests fail on baseline as well (stale fixtures); not weakened. Source change only touches modal gesture handler and mobile CSS.
3. Visual review: Chrome mobile emulation screenshot at 390 px inspected. Synthetic pinch/tap suppression and later tap close pass; attempt remains active. This is not physical iPhone Safari testing.

Build requires clean committed runtime; CI and production checks pending at commit time.
