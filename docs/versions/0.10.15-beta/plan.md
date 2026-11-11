# 0.10.15-beta plan

Base: 4365a869919cebf818f00e6804c7acaf55109231.

The previous release improved automatic grading but incorrectly retained the manual grade buttons. The user's follow-up explicitly requests removing them.

- [x] Remove the era wrong-answer manual grade controls from DOM and CSS.
- [x] Preserve keyboard/IME grading, mobile blur behavior and accessible result announcements.
- [x] Verify first/last-field focus, modal closing, interrupted inputs and owner/data isolation.
- [ ] Publish the reviewed change and verify exact-commit CI/CD and both production version endpoints.

No saved record, API, route, artwork, other learning screen or security changes. The user's browser is not accessed; the known local browser restriction is not retried.
