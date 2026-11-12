# 0.10.23-beta report

Correct answers now advance after the existing one-second O animation. Enter during this drawing cannot shorten it or trigger a second advance. Wrong answers retain inline feedback and wait for Enter. Number-sheet navigation and cleanup cancel the pending timer; the final correct answer focuses Submit without saving automatically. Existing API grading, data, answer styling, accuracy colors and section headings are unchanged.

Local verification: 152 functional assertions and 697 actual source questions / 2,837 assertions passed. Independent Chromium/WebKit × company mode × reduced motion (8 combinations at 320px) confirmed 999ms/1000ms timing, repeated Enter, 20-second wrong-answer pause, number-sheet/cleanup cancellation, IME event simulation and final Submit focus with no writes. All 128 Chromium/WebKit browser regression cases passed. Physical keyboard/device IME was not tested.

Official CI/CD and production verification remain pending at commit time; implementation alone is not a deployment claim.
