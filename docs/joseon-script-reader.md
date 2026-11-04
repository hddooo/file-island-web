# Joseon Script reader candidate

The reader is wired into the actual Joseon chapter route behind a closed, exact API-release gate. No deployment pin or readiness meta is supplied yet. Existing canonical revisions, progress and source data remain unchanged.

## Source and preservation

`scripts/build-joseon-script.cjs PRIVATE_MARKDOWN PRIVATE_OUTPUT [PRIVATE_IMAGES]` consumes the owner-provided Script bytes. It refuses public-tree output and existing output replacement. The 2026-11-04 reviewed input is 92,125 bytes, SHA-256 `8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1`. It partitions PDF59–87 into study, practice, answers and provenance segments. Concatenating all segments restores every normalized source line, including multiline question47 and source headings. The original file is retained separately, unchanged.

Coverage checks require 29 ordered pages, 172 numbered questions and 38 distinct image references. Printed-answer segments on PDF64/72/87 are separate. IDs identify Script line segments, **not** canonical question/progress IDs. Existing PDF SHA, quiz digest, grade, attempt and workspace contracts are untouched. Optional PNG validation emits each file's SHA, size, dimensions and proposed private object key under `history/joseon/81-2026/<script-sha-prefix>/`.

## Candidate UI

Load `media/joseon-script-reader.js` and its scoped CSS, then call `HanqJoseonScriptReader.mount(host, bundle, {loadFigure})`. The caller must already have authorized the current session and source. `loadFigure(name)` must fetch through a verified authenticated private transport and return an image Blob, never a public URL. The renderer itself has no HTTP endpoint, credential, storage or grading dependency. The caller must call `stop()` on logout, account change, source change and route teardown; stale image results are ignored and Blob URLs/drafts are removed. Do not attach this API to production before the transport and lifecycle integration are verified.

Four original units (early / late / society and economy / culture) lead to paper-colour reading cards with source-page references and heading navigation. Society and economy are kept together rather than repeating overlapping source pages. Nested lists preserve their parent item, including all 22 indented source items. Tables retain rows and columns with internal scrolling; 18px body text is not reduced on phones. Images retain aspect ratio, small source marks remain compact, and a native modal provides natural-size zoom, Escape/close and browser Back. Practice accepts temporary in-memory notes only. It is explicitly not a replacement for existing saved/graded problem-solving. Printed answers require a separate tab and deliberate reveal on each entry.

Markdown is rendered with DOM nodes, not arbitrary HTML. Only bounded strong/u/br tags and exact audited source colour spans are recognized; unknown tags/attributes remain literal text. Muted source ink is represented in a readable grey while its original value remains in `data-source-color`. Unknown links are plain labels and cannot initiate a request.

## Integration blockers

The existing frontend supports authenticated `/textbook/.../semantic` manifest/page/quiz/figure calls. Its figure identifiers are `pNNN-figure-N`, whereas this source uses `pNNN-NN.png`. No identity equivalence is assumed. The production revision gate remains absent and closed until the exact deployed API and immutable source roots are verified. Do not repurpose a canonical manifest, overwrite a root, invent a Script endpoint or activate the new edition to connect this candidate. The unauthenticated static sample server is not a valid destination.

Next integration step: the API/source owner must verify a private immutable Script transport, the exact source/image mapping, and account teardown contract. The integration owner verifies the prepared Joseon route against that API, reviews canonical quiz navigation, and coordinates main push/deployment with other frontend work. This branch alone does not satisfy live-account validation or operating content delivery.

## Validation

- `node scripts/test-joseon-script-reader.cjs [PRIVATE_MARKDOWN]`: synthetic rendering and HTML rejection, concealed answers, multiline blanks, repeated entry; optional actual lossless partition.
- `node scripts/test-textbook-semantic-library.cjs`: 81 existing reader/lifecycle assertions.
- `node scripts/test-history-joseon-source-layout.cjs`: 22 existing source-layout and revision-gate assertions.
- `node scripts/qa-joseon-script-reader.cjs PRIVATE_MARKDOWN PRIVATE_IMAGES PRIVATE_EVIDENCE`: isolated Playwright Chromium, 320/390/1440px, four units, source-image aspect ratios, modal zoom/Back/Escape and answer concealment. Screenshots remain private and ignored.

The legacy `test-private-textbook-dom.cjs` additionally requires its original sibling `hanq-private-data/manifest.json`, which is not supplied in this checkout. Its missing fixture is not a regression pass. Browser QA is distinct from a physical iPhone or real authenticated account check. Main's configured CI only runs on main push; this feature branch does not claim a CI run.

## Prepared app session boundary (still not activated)

`media/joseon-script-session.js` supplies `create({document, api, appRoot, uiLocks, sourceCatalog, navigateCanonical, offerLegacyQuiz})`. `mount(host, transport)` requires an explicitly reviewed transport with `ready === true`, exact Script `sourceSha256`, `loadBundle({signal})` and `loadFigure(name, {signal})`. There is no default URL or transport. Readiness here is a dependency-injection contract, not authentication or a replacement for the existing production revision gate.

The wrapper uses the existing `HanqApi.state()` signedIn/ownerId/epoch contract and `onChange` subscription. Logout/account/session changes clear private content and invalidate pending results. Hash or full route changes stop the reader; same-route reader history is handled before the app router remounts the chapter. The image modal obtains its own `HanqUiLocks.acquire(appRoot)` lease; closing/teardown releases only that lease. A previous dialog's delayed close event cannot dismiss a newly opened dialog.

Prepared wiring has three explicit integration points in `index.html`: mount inside the selected Joseon reading host; call the wrapper's `handlePopState(event)` before the existing semantic-library/app navigation dispatch; call `stop()` from `stopLearningResources()`. The wrapper already listens for hash changes and auth changes. The caller's `navigateCanonical(href)` must use the app's navigation dispatch (the existing replaceState + dispatched popstate convention is suitable), not a bare hash assignment that retains an incompatible `hanq.chapterId/step` history state. These index integration points are implemented, but production activation remains closed.

Optional `offerLegacyQuiz: true` creates an explicit **79회 교재의 기존 문제로 이동 (별도 자료)** link using `#chapter/joseon/bookquiz` without `textbookSource`; it neither reads nor transfers a Script draft. The 81-edition link is available only when the existing exact revision readiness gate approves the new PDF and Joseon. The click rechecks that gate. No question aliases, cross-edition equivalences or progress migration are created.

`node scripts/test-joseon-script-session.cjs` covers absent transport, exact source, session races, late results, hash/query departure, same-route popstate ownership, independent lock leases and both explicitly separated canonical navigation paths. The browser harness additionally mounts this wrapper with a synthetic session and verifies image Back interception, logout teardown and another overlay's lock preservation. This is not a full production router/real-account test.

## Read-only deployed baseline check, 2026-11-04

The checked frontend container serves main `431463ab73324cf964409522421b0bb4281a2634`, release `0.3.12-beta`; this main was merged into the review branch without conflicts. Its history scene changes are preserved.

The running API image identifies source `987be5798893b0023674a194626704a9d5033a37`. Its bundled server-only semantic manifest identifies the old PDF `35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442`, total PDF144, 104 listed semantic pages, 183 registered figures and 164 Joseon items (29 Joseon figures). The service's public-data projection and existing version formula produce canonical Joseon source-version `6892d35b75b9dc6580050bb950242e77ebdb0f2f40d01d13072f0ac5ea1ba3c4`. This differs from the quiz JSON file-byte hash and the PDF hash.

All 183 registered deployed figure files were present; **zero** have the same byte hash as any of the 38 new Script figures. The inspected deployed controller has the legacy semantic routes, not the new revision routes; its semantic page validator is bounded to144. Thus this is not an available transport for the new Script namespace. No container environment values, secrets, database rows, source files, mounts or settings were changed. Raw bundled manifest absence does not establish the state of an uninspected configured raw-root override. Live member-account access remains unverified.

## Prepared immutable transport and actual router QA

`joseon-script-transport.js` uses authenticated GET `/api/v1/textbook/scripts/joseon/:sourceSha256/bundle` and `/figures/:name`. The bundle must be exactly 113709 bytes with SHA256 `32a33b006d1c4b113dcc2e9df23a81e14b7b07ce2afe7400eafdde9f8750386b`. Each PNG is checked against its pinned bundle manifest. API client checks private/no-store cache headers, MIME, session ownership and abort. No token is passed in a URL.

`joseon-script-app.js` connects the real chapter host, popstate dispatch and stopLearningResources teardown. Explicit textbookSource routes retain existing behavior. REVIEWED_API_RELEASE remains null and the readiness meta is absent; candidate availability is therefore false in production. Setting either without verified exact API code and private source placement is not supported.

`test-joseon-script-transport.cjs [PRIVATE_BUNDLE PRIVATE_IMAGES]` checks auth, errors, abort, response integrity and the closed gate. `qa-joseon-app-route.cjs PRIVATE_MD PRIVATE_IMAGES PRIVATE_EVIDENCE [ISOLATED_LOOPBACK_API]` runs the actual index in isolated Chromium, checks paper colour/18px font, topic and modal Back, explicit legacy quiz navigation, return and teardown. Its optional candidate uses the actual adapter and real isolated controller with synthetic authentication. Only the test harness bypasses the deployment gate. Global game-theme overrides are restricted to the reader surface; character and scene files are untouched.

2026-11-04 integrated candidate evidence: loopback API fixture at 18187 passed actual index + actual transport with synthetic session, source/PNG integrity, topic/modal Back, explicit legacy navigation, re-entry and logout cleanup. Evidence remains in ignored `evidence/joseon-api-integrated/`; pageerror list is empty, no textbook writes or revision requests occurred. This verifies the isolated controller contract, not production deployment or a real member account. Regression checks: semantic library81, source layout22, revisions73, timeout22 plus reader/session/transport suites passed.
