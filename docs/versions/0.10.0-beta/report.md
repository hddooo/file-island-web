# 0.10.0-beta report

Retry clears only the current page draft, grading and score, then focuses the first answer. It does not call a reset/delete API. Navigating away without saving restores the previous saved answers on reentry. A later explicit Save / Complete updates only the current era's intended response edits; untouched questions and concurrent unrelated answers remain preserved.

Era checkboxes, checked-question filter/count and checking guidance are removed. Saved review selections are not erased. Existing O/X feedback, wrong-answer practice, XP, other eras and account boundaries are preserved. Reset is disabled during IME composition or an unresolved/in-flight save.

See progress.md for the executed integration checks. Only the requested independent commit is included; concurrent Goryeo/Joseon alignment and English-island changes remain outside this release. Exact CI/CD and live SHA evidence are reported after publication.
