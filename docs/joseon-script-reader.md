# Joseon Script reader candidate

This is an **unconnected candidate**, not a production content release. The standalone renderer is not registered in `index.html` or the existing chapter route. No revision declaration, API client, user data, canonical quiz, scene, character, workflow or release version is changed.

## Source and preservation

`scripts/build-joseon-script.cjs PRIVATE_MARKDOWN PRIVATE_OUTPUT [PRIVATE_IMAGES]` consumes the owner-provided Script bytes. It refuses public-tree output and existing output replacement. The 2026-11-04 reviewed input is 92,125 bytes, SHA-256 `8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1`. It partitions PDF59–87 into study, practice, answers and provenance segments. Concatenating all segments restores every normalized source line, including multiline question47 and source headings. The original file is retained separately, unchanged.

Coverage checks require 29 ordered pages, 172 numbered questions and 38 distinct image references. Printed-answer segments on PDF64/72/87 are separate. IDs identify Script line segments, **not** canonical question/progress IDs. Existing PDF SHA, quiz digest, grade, attempt and workspace contracts are untouched. Optional PNG validation emits each file's SHA, size, dimensions and proposed private object key under `history/joseon/81-2026/<script-sha-prefix>/`.

## Candidate UI

Load `media/joseon-script-reader.js` and its scoped CSS, then call `HanqJoseonScriptReader.mount(host, bundle, {loadFigure})`. The caller must already have authorized the current session and source. `loadFigure(name)` must fetch through a verified authenticated private transport and return an image Blob, never a public URL. The renderer itself has no HTTP endpoint, credential, storage or grading dependency. The caller must call `stop()` on logout, account change, source change and route teardown; stale image results are ignored and Blob URLs/drafts are removed. Do not attach this API to production before the transport and lifecycle integration are verified.

Five topic entries lead to paper-colour reading cards with source-page references and heading navigation. Economy currently preserves the complete relevant social/economic pages for context; more precise subsection curation remains a follow-up. Tables retain rows and columns with internal scrolling; 18px body text is not reduced on phones. Images retain aspect ratio, small source marks remain compact, and a native modal provides natural-size zoom, Escape/close and browser Back. Practice accepts temporary in-memory notes only. It is explicitly not a replacement for existing saved/graded problem-solving. Printed answers require a separate tab and deliberate reveal on each entry.

Markdown is rendered with DOM nodes, not arbitrary HTML. Only bounded strong/u/br tags and exact audited source colour spans are recognized; unknown tags/attributes remain literal text. Muted source ink is represented in a readable grey while its original value remains in `data-source-color`. Unknown links are plain labels and cannot initiate a request.

## Integration blockers

The existing frontend supports authenticated `/textbook/.../semantic` manifest/page/quiz/figure calls. Its figure identifiers are `pNNN-figure-N`, whereas this source uses `pNNN-NN.png`. No identity equivalence is assumed. The production revision gate remains absent and closed until the exact deployed API and immutable source roots are verified. Do not repurpose a canonical manifest, overwrite a root, invent a Script endpoint or activate the new edition to connect this candidate. The unauthenticated static sample server is not a valid destination.

Next integration step: the API/source owner must verify a private immutable Script transport, the exact source/image mapping, and account teardown contract. The integration owner then wires the candidate inside the approved Joseon route, reviews saved canonical quiz navigation, and coordinates main push/deployment with other frontend work. This branch alone does not satisfy live-account validation or operating content delivery.

## Validation

- `node scripts/test-joseon-script-reader.cjs [PRIVATE_MARKDOWN]`: synthetic rendering and HTML rejection, concealed answers, multiline blanks, repeated entry; optional actual lossless partition.
- `node scripts/test-textbook-semantic-library.cjs`: 81 existing reader/lifecycle assertions.
- `node scripts/test-history-joseon-source-layout.cjs`: 22 existing source-layout and revision-gate assertions.
- `node scripts/qa-joseon-script-reader.cjs PRIVATE_MARKDOWN PRIVATE_IMAGES PRIVATE_EVIDENCE`: isolated Playwright Chromium, 320/390/1440px, five topics, source-image aspect ratios, modal zoom/Back/Escape and answer concealment. Screenshots remain private and ignored.

The legacy `test-private-textbook-dom.cjs` additionally requires its original sibling `hanq-private-data/manifest.json`, which is not supplied in this checkout. Its missing fixture is not a regression pass. Browser QA is distinct from a physical iPhone or real authenticated account check. Main's configured CI only runs on main push; this feature branch does not claim a CI run.
