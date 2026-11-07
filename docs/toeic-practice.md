# TOEIC RC practice engine

## Content and scope

The included three sets (five questions total) are original HanQ demonstration writing created for this implementation, not official TOEIC questions, licensed publisher content, or past exam material. Each set displays an explicit Korean source label. There is one Part 5 standalone four-choice question, one Part 6 passage with two questions, and one Part 7 passage with two questions. No official question corpus was fetched, imported, or implied. The email in the fictional passage uses the reserved example.org domain.

## Integration

Load `media/toeic-practice.css` and `media/toeic-practice.js`. Call:

```js
const practice = window.HanqToeicPractice.mount(host, { part: 5 });
window.HanqToeicPractice.stop(); // on route exit
```

`part` must be numeric 5, 6, or 7. Mount returns a controller. The public singleton stops its previous mount automatically. `.stop()` unsubscribes from account updates and clears its host. A factory `create({document, storage, api})` supports isolated testing. The real API uses `HanqApi.state()` and `HanqApi.onChange()` only; no server writes occur.

For an intentionally empty library pass `{part:6,dataset:[]}`. To import authorized content, pass a dataset array. There is no automatic fetch/import or file picker. Every set must contain:

```json
{
  "id": "stable-group-id",
  "part": 6,
  "source": "Honest source and authorization label",
  "passage": "Complete shared passage",
  "questions": [{
    "id": "globally-unique-stable-question-id",
    "version": "1",
    "prompt": "Question text",
    "options": [
      {"id":"a","text":"First choice"},
      {"id":"b","text":"Second choice"},
      {"id":"c","text":"Third choice"},
      {"id":"d","text":"Fourth choice"}
    ],
    "answerId": "b",
    "explanation": "Evidence and explanation"
  }]
}
```

Part 5 requires exactly one question and may have an empty passage. Parts 6/7 require a nonempty passage. All parts require exactly four uniquely identified options. IDs are unique throughout the supplied dataset; nonempty versions and source labels are mandatory. Validation failures render an error instead of partially mounting data. Rendering uses textContent rather than HTML. Increment a question version when its meaning, answer, or option-ID mapping changes. Option IDs, not visual positions, determine grading.

## Interaction and records

Selecting an option never submits. All questions in a shared passage must be answered before explicit grading. Grading reveals Korean explanations, locks the current selection, and increments attempts once; repeated grade calls have no effect. There is no automatic advance. Explicit retry starts another attempt. Next is available only after grading and only when another set exists.

Wrong-answer and starred review select whole groups when any member qualifies, preserving the passage and sibling questions. Latest correct grading clears that question's wrong status. The displayed review group remains until explicit navigation or filter refresh, so feedback never disappears at grading time. Stars are independent of correctness.

Records use `hanq:toeic-practice:v1:guest` or `hanq:toeic-practice:v1:owner:<encoded owner ID>`, with schema 1, subject TOEIC, and `[question ID, content version]` keys. Stored values include stable option ID, attempts, latest wrong status, and star. No Korean-history data is read or written. Account transitions reset in-progress selections and reload the correct account's local records. Guest progress is not merged into accounts. The feature explicitly labels records as device-local, without server synchronization. Malformed data is ignored safely. Blocked/quota-limited storage falls back to tab memory and displays a warning. Only graded records and stars persist. Unanswered selections and draft attempts do not resume after remount/reload; cross-device sync is not implemented. Internal selection and record maps have null prototypes, so arbitrary imported IDs such as `__proto__` and `constructor` cannot count as an answer before an explicit selection.

## Tests

`node scripts/test-toeic-practice.cjs` runs dependency-free DOM/controller regression tests. `node scripts/test-toeic-practice.cjs --browser` runs Playwright tests with Chromium (`CHROMIUM_PATH` override; default `/usr/bin/chromium`) including responsive widths 360, 390, 430, 844 and 1440. Browser execution is optional; it requires a working browser environment.

Verified locally: 54 dependency-free assertions and 5 real JSDOM assertions passed. Run the latter with `node scripts/test-toeic-practice.cjs --dom` (uses `.test-tools/node_modules/jsdom` or `JSDOM_PATH`). Real Chromium execution in this workspace was blocked by local socket sandbox restrictions; escalation failed with an environment bwrap error. No browser rendering or physical-device QA is claimed from that attempt. No push or deployment was performed.


## Authenticated cumulative wrong review (0.8.0-beta candidate)

The production Practice controller is `media/toeic-cbt.js`, distinct from the older device-local demo above. Its part menu now offers **전체 문제 / 지금까지 틀린 문제**. Cumulative mode separates Part 5 and Part 6 so Part 5 can be reviewed on its own; the all-question menu keeps its original grouping. The latter selects the authenticated viewer's `studyHistory.everWrong` or positive wrong/reported/provisional count from the existing `GET /practice` response. It never uses the shared catalog's `originalWrong` to infer the viewer's personal mistakes. Latest correct answers do not remove a historical mistake from this cumulative view. The scope is the currently available Practice catalog, not removed or unavailable historical question content. Unverified AI reference outcomes are not promoted into official wrong records by this UI.

Within one view, question identity is `collectionId:number`; repeated entries are counted once, equal original numbers in different collections remain separate, and the selected targets remain fixed while answers are graded. Explicit source refresh rebuilds the target set from current server history. The filter is session-only, resets on account change, and does not rewrite old attempts or create a new exam run. Original `displayNumber` routes and the all-question mode remain intact.

Parts 3/4/6/7 retain the original shared passage/audio/images and validate the full group, but show and submit only selected wrong question cards through the existing idempotent single-answer endpoint. Non-target siblings receive no invented selections or grading. Readiness, pending-request identity, stale-owner response guards, and existing all-ready whole-group submission in the all-question mode remain in place. The cumulative menu does not present past review completion as a newly completed retry.

Candidate verification: `node scripts/test-toeic-wrong-review.cjs` (98 assertions), `node scripts/test-toeic-partial-readiness.cjs` (353 assertions), and `node scripts/test-toeic-practice-client.cjs` passed against synthetic data only. `scripts/qa-toeic-wrong-review.cjs` is the responsive browser harness (320/390/1440, optional WebKit via `TEST_WEBKIT=1`); cloud Chromium launch is blocked by environment `socket() Operation not permitted` even through approved execution, and installed WebKit is unavailable. Browser visuals, exact remote build/CD and real signed-in user coverage remain unverified at this candidate stage. No API/DB migration or real user answer write was performed.
