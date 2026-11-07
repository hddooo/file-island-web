# Private question request staging

User path: /inquiries/question-requests.html (MY PAGE link). ADMIN: question review section in /ops/.

TOEIC and Korean history requests keep manually entered answers. Part2 takes audio with ABC, Part1 image/audio with ABCD. Part3–7/history offer OCR stem/choice candidates. The part is selected by the user; if empty, consistent TOEIC numbers may populate a labelled part candidate that must be verified. OCR does not assert part correctness. Highlighted candidates fill editable fields, no-highlight cases require manual selection. Same-origin Tesseract.js worker/models process images in browser memory only. No external OCR/image transfer or localStorage of source images.

Owner-authenticated JSON request API and bounded binary upload API store private staging assets; the frontend never puts images in Git or public static media. Text and answer are not published on submit. ADMIN content review requires original comparison and per-question explanation; second review requires a normal image (or audio-only Part2 confirmation). Backend owns all role/owner/revision/state decisions.

Current scope ends at ready_for_publish. No actual publisher, automatic dot invocation, or promised background explanation generator is implemented. Existing learning collections/attempts remain unchanged. Do not describe this as a fully automatic problem-registration pipeline.

Safety: user/account epoch checks, byte limits, same-origin OCR models, textContent rendering, protected blob asset access, manual answers, no deletion endpoints. Photo OCR is heuristic and must be checked against the original. Genuine textbook camera images and mobile Safari remain unverified; synthetic Chrome OCR/desktop+phone layout passed.

Tests: scripts/test-question-requests.cjs and test-question-request-flow.cjs; existing private auth42/session33/inquiry23 checks passed. Backend has separate isolated PostgreSQL HTTP integration checks. Code must not be published to production until matching staging API/migration and boot checksum manifest pass preflight.
