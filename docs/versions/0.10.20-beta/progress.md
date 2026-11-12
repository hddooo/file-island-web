# 0.10.20-beta progress

- [x] Inspect the supplied screenshot. Two-digit numbers wrapped in the company-mode number sheet.
- [x] Explicit 12px number / 10px state typography and nonwrapping spans, with 44px targets.
- [x] Remove the grade button and requested notices; use title 문제.
- [x] Defer only an explicit Enter intent until composition commits, then grade once. Ordinary composition end alone does not grade.
- [x] Replace the wrong-answer popup with the existing inline answer and a pausable five-second timer; Enter can skip immediately.
- [x] Scope large translucent O/X display and animation to quiz marks in company mode; keep reduced motion.
- [x] Functional regression: 112 assertions.
- [x] Source regression: 697 questions / 2,837 assertions; old-grading parity: 6,970 answer variants.
- [x] Chromium/WebKit: 128 quiz cases and 24 actual-reader cases; independent review corrected the mobile Enter hint override.
- [ ] Exact build and official CI/CD/live release verification.

## Latest requested layout
The question list is text-only, in two top-to-bottom columns separated by a center rule. It keeps source order and keyboard order, uses 28px desktop rows and 44px small-screen/coarse-pointer rows, and preserves selected/result labels. Accuracy is centered and larger; the fraction sits right without solved/unsolved wording. Both values tween for 320ms upward or downward; assistive text always contains the exact current value and reduced motion renders immediately.
