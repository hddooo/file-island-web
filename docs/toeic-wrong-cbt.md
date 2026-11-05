# Private TOEIC wrong-question replay

This is separate from the Korean history CBT and the TOEIC vocabulary/phrase notebook. It reuses the existing live-session guard, owner-first transaction lock, validation/filter and idempotent checkpoint/submission patterns; it does not generalize or rewrite the history engine.

## Source and readiness

`toeic_cbt_collections` is a private, owner-bound, immutable source version. No shared seed, startup import, public upload or HTTP source-writing endpoint exists. `prepareToeicCollection` prepares a bundle without binding an account or writing a DB. `storePrivateToeicCollection` is an internal explicit-owner storage helper; invoking it with real user material requires the separate account verification/import authorization. It is used only with synthetic sources in these tests.

A source lists the user's exact wrong question numbers and separate audio/passage groups. Sibling context questions do not become wrong questions. A valid group can include 35–37 while only37 is in questions/wrongNumbers; 38–40 stays a different group. Unicode asset URL strings are validated but retained exactly; no normalization is performed.

Every target must have the correct number/group, verified original question, required choice count (Part2 A–C, others A–D), explicit verified answer key, and required verified audio (LC) / photo (Part1) / passage (Part6/7). Missing material prevents create/start/checkpoint/submit. ASR, removed warning markers, plausible inferred answers and successful HTTP HEAD do not set verification flags. HTTPS asset URLs have no credentials or fragment; the server does not fetch arbitrary source URLs.

The current real 22-item private bundle remains account-unbound and ungradeable. Its source, choices/keys/Part1 photo are not fabricated or runtime seeded. Its 21 derived remote audio URLs and all real-audio browser playback remain unverified; one URL has audio-thread reported checks only. Synthetic data lives only in `test/helpers/toeic-fixture.ts` and is imported by tests, never by runtime/seeding.

## API (all require JwtAuthGuard)

- GET `/api/v1/toeic-cbt/collections`: latest private source versions by source key, readiness/missing-material summaries only. No choices, scripts or answers.
- GET `/api/v1/toeic-cbt/runs`: caller's latest100 per-round attempts.
- POST `/runs`: `{collectionId,idempotencyKey}`. Creates a ready attempt only for a complete owned source. Equal retries return the same attempt.
- GET `/runs/:id`: owned run. Ready/paused responses have no items; active responses omit scripts, explanations and correct answers. Part1/2 show letter choices only; their spoken choices/question text are disclosed after grading.
- POST `/runs/:id/start`: start an untimed wrong-question practice. No history80-minute/50-question/score rules are applied.
- PUT `/runs/:id/checkpoint`: `{revision,cursor,paused,answers:[{position,optionId}]}`. Whole ordered snapshot, null for unanswered. Same snapshot retry is harmless; stale different snapshots409. Owner then run lock serializes races.
- POST `/runs/:id/resume`: `{revision}`.
- POST `/runs/:id/submit`: `{revision,cursor,submissionKey,answers}`. Revalidates source, owner and every option, grades only against verified source keys, records correct/wrong/unanswered counts. Equal final retries return the immutable result; conflicting retries409.

Correctness here is multiple-choice grading from a verified key, distinct from the wordbook's self-assessment. TOEIC attempts never touch history questions/attempts/CBT results/growth or vocabulary progress. Each replay is a new run; previous source versions/final runs/items cannot be rewritten. Explanations/scripts are shown only after grading; missing explanation is explicitly pending, ASR script is labelled unverified.

## Tests and deployment

`test/unit/toeic-cbt.test.ts`: readiness fail-closed, source import verification flags and DTO bounds. `test/integration/toeic-cbt.test.ts`: real temporary PostgreSQL/auth/HTTP, incomplete rejection, owner isolation, create/checkpoint/submit races/retries, pause/relogin, final/source immutability and separation from history/vocabulary.

`../front/scripts/qa-toeic-cbt-postgres.cjs`: actual browser → local API → disposable PostgreSQL, with intercepted synthetic image/WAV only, at390/1440px. Never run against production; existing helpers reject non-loopback/non-*_test DBs.

Migration021 is additive (three tables and immutability triggers). Not applied to production. It must deploy with the API before the frontend; actual owner binding/import and operating deployment remain separately unapproved.

## Paper-exam preparation

`replayNumbers` expands the exact printed group membership for Parts3/4/6/7. `wrongNumbers` remains the original mistakes; sibling questions are marked separately. Create accepts optional unique integer `parts` (1–7); only that selected material must be ready, so a verified RC part may run while LC is pending. Immutable run items define the selected question set across pause/reload/grading. Reusing a creation key for another part returns409.

Photo/diagram sources may use `private-image:<sha256>`. Migration025 adds owner+collection-bound image bytes (8MiB limit) with no PUBLIC privileges. GET `/collections/:id/images/:key` reuses the live JWT guard, checks the owner and returns `private, no-store`; the client obtains an authenticated image blob and revokes its object URL on navigation. Do not place original paper images or import JSON in the frontend repository. Existing authorized HTTPS audio URLs are unchanged.

PendingManifest groups now accept `passage`, `passageVerified`, `scriptVerified`. Every question still requires verified original choices and keys. The source-review package and verified asset bytes are required before real import. No real data import or production deployment is claimed by the implementation tests.

User scope clarification: RC101–108,135–138,143–150,153–154 are intentionally omitted correct ranges, not missing material. Do not request them or show an incomplete warning. Keep122 replay questions and57 original mistakes distinct. Only a genuinely cut-off required passage/choice in an included group blocks readiness; none is currently identified.

## Structured tutoring explanations (local, deployment pending)

Questions optionally include `tutorExplanation`: `{answerReason, reading:[{chunk,translation}], steps:[string], options:[{id,explanation}], traps:[string], checklist:[string]}`. Every choice needs its own rationale. This supplements the existing explanation text; original questions, answer keys and original-wrong flags stay unchanged. Catalog validation rejects malformed optional tutoring data. The collection list and active run do not expose any tutoring fields. Only an owned final run returns it under `review.tutorExplanation`.

The final-review UI shows the core answer reason immediately. A native keyboard-accessible details panel separates reading/translation, reasoning steps, choices, traps and the next-question checklist. Long legacy explanations remain available in a collapsed full-text panel. All teaching text uses textContent.

## Repeated practice numbering and unverified proposals

`sourceIdentity` optionally preserves `{key,unit,page,questionNumber}` independently of the internal numeric item number. Unknown Unit remains null. Keys must be unique within a collection; repeated printed numbers on distinct source pages remain distinct, and the UI displays the page plus original printed number. Practice collections can omit cumulative book-round metadata.

`answerStatus: assistant_inferred_not_officially_verified` preserves an independent proposed answer. It always blocks grading readiness as `official_answer_key`, even if an erroneous import flag sets answerVerified=true. It must never be silently promoted from a photo tick or confidence score. Full original source payload and observed marks are preserved in the local preparation package; an uncertain marked choice is not a confirmed original answer.

## Recovery completion

Cumulative mistake counts are computed from immutable final run items, grouped by source key and stable question identity. An imported original mistake contributes once across source versions. Sibling questions start at zero; correct replays do not clear prior mistakes; idempotent submit retries reuse the same final run. Two verified mistakes display a repeat badge.

Optional `checkQuestions` are authored practice, separately labelled from publisher questions and disclosed with the post-submit tutor explanation. ETS proposed-answer collections remain grading-disabled. Their owner can use `GET /collections/:id/study` to read the original questions and explicitly unofficial explanations without creating a graded run or changing mistake counts. The route rejects other owners and verified exam collections.

## Deployment verification records

Migration026 stores owner-bound annotations separately from immutable runs and items. Annotated checks are labelled `verification: true` in run summaries, shown as deployment checks in history, and excluded from cumulative mistake queries. They cannot start, resume, checkpoint or submit as real study; the owner starts a new regular run. Annotating a check never rewrites or deletes its original answers/results. The two operational checks are annotated by explicit owner-verified, idempotent operational INSERT, with no public write route.


## Per-question Practice readiness (0.2.4-beta)

The current `#toeic/wrongnotes` Practice screen uses authenticated `GET /api/v1/toeic-cbt/practice`. Each item’s server `available` flag gates grading; publisher attribution (`officiallyVerified`) is not an additional readiness decision made by the frontend.

Parts3/4/6/7 keep all supplied context siblings and shared audio/passage visible. An exact, unique membership and matching nonempty shared material are required before either submission path is enabled. When every member is available, the existing atomic `/collections/:id/group-answer` path remains unchanged. When only some members are available, each ready member uses the existing `/collections/:id/answer` endpoint with only its own number, selected option and request key. Unavailable context remains read-only; it receives no invented answer, history or award. Inconsistent/missing/duplicate membership or mismatched shared material stays read-only until refreshed.

Choosing an option does not grade or submit. Local choices and saved-but-unconfirmed requests have separate labels. Pending requests retain the same owner-scoped request key and choice on unknown-outcome retry, back/reopen and status refresh. Refresh is GET-only, bypasses prefetched material and preserves valid same-collection/group selections; pending selections take precedence. A material-pending server rejection disables the stale-ready control and offers refresh. Late responses from a previous screen/account are ignored. The backend remains authoritative for correctness, history, XP and idempotency.

Regression commands: `node scripts/test-toeic-partial-readiness.cjs`, `node scripts/test-toeic-practice-client.cjs`, `node scripts/test-toeic-script-status.cjs`, `node scripts/qa-toeic-grading-no-spinner.cjs`, and `node scripts/qa-toeic-partial-readiness.cjs` (Playwright Chromium/WebKit with the existing static-app synthetic fixture). The browser suite covers320/390/900px, partial and complete groups, unavailable single questions, GET refresh, retry identity, explanation/Script attribution, picker dismissal and the deliberately parked continuous Listening player. All API submissions are synthetic; these checks do not write real learner records or establish physical iPhone playback success. Candidate/CI/operating status must be verified separately.



## Part-by-part Practice PDF export (implementation candidate)

`media/toeic-practice-pdf.js` and `.css` add a PDF button for each numeric part to the existing Practice part menu. Combined menu rows retain separate Part 3/4 and Part 5/6 exports. The screen's stable routes, source/display numbers, answer selection, grading, attempts and completion counts are unchanged. `toeic-cbt.js` supplies its current authenticated item snapshot and disposes the export controls on every screen/account transition. No original question corpus, images or exported PDFs are published with the frontend.

The PDF includes wrong questions plus their supplied shared-passage siblings, preserves source text and images, and labels context-only questions separately. It does not classify context siblings as additional mistakes. Missing passages/photos are labeled when absent in the source. If a supplied required image cannot be fetched/decoded, generation fails rather than silently dropping it. Part 1/2 spoken choices remain letter placeholders unless an existing readable review includes the original text.

Existing read-only APIs supply optional review material: `/collections` and eligible `/collections/:id/study`, already-final non-verification `/runs/:id` entries from the existing bounded run history (newest first, stopping once the selected questions have reviews), and `/player` for LC scripts. Reviews must match the current collection, question, part, group, prompt and choices when supplied. No answer/run is created, started or submitted to obtain a solution. Not all individually graded Practice explanations are currently available over GET; missing-review counts appear in the file and download status. Unverified answers and automatic transcripts retain their attribution.

Generation happens entirely in the browser. A single high-resolution A4 canvas is reused, images are decoded sequentially and their object URLs revoked, generation is limited to one job across all part rows, and generated output is capped at 64 MiB/150 pages. The PDF uses JPEG visual pages plus Unicode ToUnicode/ActualText layers for source copying/extraction. It is not a fully tagged accessible PDF. Native browser fonts preserve Korean rendering without a remote conversion service or uploaded learner content. The download link remains visible when automatic download is unavailable. Replacing a file, canceling, leaving the screen, changing accounts or the document receiving `pagehide` releases/cancels the corresponding resources. A persisted bfcache departure retains disabled controls without private output; `pageshow` re-enables them only after the current account and screen are revalidated. Saved files remain private to the user's chosen download destination; they are not stored in app storage or uploaded.

Checks for this candidate:
- `node scripts/test-toeic-practice-pdf.cjs` uses JSDOM and `@napi-rs/canvas`; the `JSDOM_PATH` and `CANVAS_PATH` environment variables can select installed dependencies. It tests source filtering, real PDF bytes, private-image decoding/failure, matching/mismatched existing reviews, long passage pagination, direct-download link creation, cancellation/account isolation, persisted pagehide/pageshow restoration and URL cleanup, using synthetic fixtures only. Set `PDFJS_PATH` to the installed PDF.js `legacy/build/pdf.mjs` to additionally verify Korean source extraction in a second PDF engine.
- `node scripts/qa-toeic-practice-pdf.cjs` is the synthetic Chromium browser suite for 320/390/1440 px, download events and navigation. `PLAYWRIGHT_PATH` and `CHROMIUM_PATH` can select installed tools. Browser execution in the current cloud executor is blocked at process startup by `socket() Operation not permitted`; it has **not passed** here. JSDOM and Skia are not substitutes for browser UI or physical iPhone checks.
- The existing `test-toeic-partial-readiness.cjs` (345 assertions), `test-toeic-practice-client.cjs`, and `test-toeic-script-status.cjs` passed against the changed Practice integration. Poppler parsed the generated A4 PDFs, extracted Korean/English text and rendered sample pages. The 100-line passage fixture retains its last line and both questions across three pages.

This section records local candidate implementation and checks only. Exact-commit CI, publication and operating-domain verification are separate integration steps.
