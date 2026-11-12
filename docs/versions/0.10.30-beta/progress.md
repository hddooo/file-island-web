# 0.10.30-beta progress

- [x] Reproduced the production Express Content-Type / Blob mismatch independently using the actual read-only Opening services and 118-question source.
- [x] Normalize only the media type before the first semicolon in two existing transport checks.
- [x] JSON parameters accepted; non-JSON and JSON-like MIME, byte/digest/projection tampering, auth and abort rejected.
- [x] Opening app 21 checks and route regression passed.
- [x] Native fetch/Blob tests passed in Chromium and WebKit at 320px and 1440px, with no external requests.
- [ ] Official exact-commit CI/CD and production asset verification follow this commit.
