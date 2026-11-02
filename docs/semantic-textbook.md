# Text-first member textbook reader

The era reader uses the authenticated semantic API. Book text, answers and figures are not frontend assets. Every backend semantic endpoint requires the existing live JWT/member guards and returns `private, no-store`; server-only data is kept in the user's private API repository. No public static route serves it.

## Current bounded content

- 94 reviewed native text/table sections, including PDF31 and source attribution tables142–143. This is not a claim that all144 complete pages or all image-baked text are available.
- 642 original source questions across eight eras. Original blanks and answers remain available without generated distractors.
- 24 separately labelled four-choice practice items: seven prehistory and17 reform-stage questions. Original question IDs, wording, subtopic instructions and complete correct answer strings are preserved. Each of the72 distractors has a reviewed source-grounded explanation. Five ambiguous prehistory candidates remain original blanks only.
- Only11 initial small figures are available. Other figures explicitly remain pending; grouped images fail atomically rather than showing an incomplete half.
- PDF33's adjacent village-document and pagoda captions retain every native character, with the caption ownership corrected.

Source-bold spans use deep blue; table row and column order is preserved, with controlled horizontal scrolling for wide tables. Actual mobile/desktop signed-in browser and full visual parity checks remain outstanding.

## Choice API and lifecycle

`GET /api/v1/textbook/semantic/choices/:id` accepts only the eight fixed era IDs and requires a corresponding manifest entry. Runtime validation binds the derivative to the original quiz SHA256, unchanged question/segments/source references and exact complete correct answer. Every option must resolve to a same-corpus original answer label. This runtime integrity check complements, but does not replace, per-stem source review for ambiguity.

The four-choice mode appears only where verified data is available. Choices are practice additions, not original printed options or official examination questions. Results and in-era wrong retries are kept only while that screen is mounted; the UI explicitly discloses that limitation. They do not enter the global03 CBT-only notebook or overwrite existing quiz records. No original source corpus is persisted in browser storage. Auth changes and navigation clear the mounted content and invalidate pending requests.

## Reproducible checks

- `node scripts/test-textbook-four-choice.cjs`: synthetic DOM/lifecycle checks; optional private derived JSON paths validate all supplied actual items.
- `node scripts/test-textbook-semantic-library.cjs`: coordinator/auth/navigation races.
- `node scripts/test-private-textbook-dom.cjs`: whole-host routing and menu integration.
- Backend unit suite includes member/anonymous choice access, unlisted IDs, altered source/answer/duplicate-option rejection and source-file hash drift.

Actual production account reads, database-backed replay and mobile browser rendering must be reported separately from these local checks.

## 2026-10-19 Mac source-figure pass

The API bundle now lists 197 small original assets. This is not a full-page raster reader. Actual source page QA revealed and fixed three renderer failures: a single captioned image with a composite identifier was treated as a fragmented group; merged gallery cells lost their images when approximate envelopes did not contain the entire figure; and PDF89's verified `source-inset` was rejected. Verified caption associations now keep images in their source cells, gallery captions follow images, and source inset text/line order stays intact.

`node scripts/qa-semantic-source-pages.cjs /path/to/api/private-textbook-semantic-data /path/to/local/evidence` runs headless Chromium on all 94 actual source sections at 390px and 1440px, decodes available images, rejects body overflow/broken images, and saves selected local screenshots. This uses isolated local files and never starts the API or reads/writes account/exam data. Test tooling belongs only in ignored `.test-tools/`.

The API's 144-page and figure inventories explicitly retain unresolved text diagrams and held assets. No full-fidelity or full four-choice completion is claimed.

## 2026-10-19 final diagram/source coverage pass

The current bundle supplies 104 semantic pages and 41 original exercise-source pages, covering all 144 PDF pages with PDF37 shared. This is a source coverage statement, not pixel-identical page reproduction. 44 text-raster placements are represented by 39 native-text diagrams; the figure manifest retains 183 actual maps/photos/illustrations. Five previously connected decorative characters and eleven text rasters were retired. A modern-government sequence had been incorrectly classified with cover artwork and is now native text as well.

Source timelines retain their original tick/band coordinates, native table spans preserve source range bars and organizational branches, and the original 94 pages retain their native-source span multisets. Verified figure captions stay with images; the PDF35 organizational diagram stays in its original caption cell; PDF86's flag/stele labels stay with their corresponding photographs. Reviewed decorations and cover background fragments neither fetch images nor reserve unavailable-image placeholders.

Validation: 104 actual source pages at 390px/1440px (208 renders), zero broken available images and zero document overflow; 39 logical diagrams/44 placements render once with no retired text-raster endpoints; original blank-quiz compatibility in all eight era files; existing textbook HTTP guard/integrity tests. The original three in-era navigation tabs remain intact. Source front matter and appendices are available through supplementary links inside the reader. No quiz/exam/incorrect-answer record is created by these checks.

Approval-held `p009-figure-5`/`p009-figure-6` and atomic sibling `p009-figure-4` remain excluded. Four-choice practice remains the previously verified 24 questions, independently of source-text coverage.


### Continuous era reading and original figure placement

The semantic library now appends every available source page in PDF order, with at most three page requests in flight. Its section TOC scrolls to existing headings instead of fetching/replacing a selected page. Page references are secondary, and offscreen figure Blobs are fetched only near the viewport (800px margin). Switching modes, eras, accounts or logging out cancels deferred loads and cleans every page controller and Blob URL. A failed source page has its own retry; an authorization failure clears all source pages.

Existing source blanks remain one continuous era list, now with subtopic anchors that preserve typed responses and per-question answer controls. The samguk screen maps to the existing ancient quiz ID. No source question, answer, four-choice payload or production attempt is changed.

Reviewed source layout repairs cover PDF17/20/31 table-map side panels, PDF76/77/79/103/128 captioned gallery row/column order, and PDF124/130 photo-label side panels. PDF79 keeps its stacked cells, rowspan relationships and the atomic four-piece minhwa. PDF21/54 gallery canvases retain aspect ratio while limiting height to 220px on mobile and 300px on desktop. Wide original tables still scroll internally, including keyboard arrows.

Validation scripts: test-textbook-figure-layout-source.cjs (actual private layout), test-textbook-semantic-library.cjs (loading/auth races), qa-continuous-textbook.cjs (isolated actual source fixture, all eras at 390/1440), and qa-semantic-source-pages.cjs (decoded images and page overflow). These do not themselves certify production authentication or complete page fidelity.
