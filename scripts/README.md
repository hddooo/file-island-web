# Private textbook extraction

## 81회 대비 판본 후보 재생성

새 원문은 147쪽이며 SHA256은 `d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de`다. 기존 144쪽 원문은 `35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442`로 불변 보존한다. 아래 도구는 비공개 데이터 후보만 생성하며 활성 자료·사용자 답안·XP·DB를 변경하지 않는다. 원문과 검수 입력 JSON은 Git에 포함하지 않는다.

PyMuPDF 1.26.6 환경에서 새 `private-data/.../<새 SHA>` 디렉터리를 출력으로 지정한다. `--reviews`에는 원문을 직접 대조한 문항/정답 패널·도표·페이지 전사·장식 분류 기록 7개가 필요하다. 도구는 출력 디렉터리가 이미 있거나 원문 SHA가 다르면 중단한다.

```sh
python scripts/rebuild-history-revision.py \
  --raw-root "$HISTORY_NEW_RAW" --reviews "$HISTORY_REVIEW_INPUTS" \
  --baseline "$HISTORY_OLD_SEMANTIC" --legacy-source "$HISTORY_OLD_PDF" \
  --output "$HISTORY_NEW_REBUILD"
python scripts/verify-history-revision.py "$HISTORY_REVISIONS"
python scripts/verify-history-semantic-coverage.py "$HISTORY_NEW_REVISION"
node scripts/history-source-versions.cjs "$HISTORY_REVISIONS"
```

추출부터 다시 시작할 때는 기존 `extract_textbook.py --expected-pages 147 --scale 1.5`를 쓴다. `extract-history-question-anchors.py`와 `extract-history-answer-anchors.py`는 source SHA에 묶인 native 문자/번호 후보를 만들며, 독립적인 정답 패널 검수 없이 자동 승인하지 않는다. 재생성 출력의 raw 디렉터리는 기존 raw를 읽는 symlink다. 전달용 원본 디렉터리는 실제 파일로 유지하며 패키지 도구는 symlink를 거절한다.

신규 8개 시대는 원문 PDF쪽 기준으로 선사8–15, 삼국16–30, 남북국31–40, 고려41–58, 조선59–87, 개화88–107, 일제108–125, 현대126–139다. 인물140–141·지역142–144·출처/발행145–147·앞부분1–7도 남긴다. 현재 후보는 원문 빈칸697문항/702응답칸이며 문항 ID는 새 원문 namespace를 쓴다. 원문 공백·기호·부분 주석을 기존 정답 형식에 맞추어 개작하지 않는다.

원문 문자119809개와 ID, 모든 원문 페이지, 그림 bytes/soft-mask 및 문항/정답 anchor를 검사한다. 벡터 제목은 실제 path program 일치, glyph 표시 치환은 embedded font와 CMap 일치를 별도로 증명한다. 이 검사는 전체 문장의 독립 역사적 사실 확인이나 모든 표의 사람 검수 완료를 뜻하지 않는다. 본문 리플로우와 원문 전체 보기/확대를 함께 제공해야 하며 기존 승인보류 그림을 임의 활성화하지 않는다.

```sh
node scripts/qa-history-revision.cjs "$HISTORY_NEW_REVISION" "$HISTORY_READING_QA"
node scripts/qa-history-source-quiz.cjs "$HISTORY_NEW_REVISION" "$HISTORY_QUIZ_QA" "$HISTORY_CANDIDATE_RENDERER"
python scripts/package-history-revisions.py --revisions "$HISTORY_REVISIONS" --output "$HISTORY_PRIVATE_ARCHIVE"
```

브라우저 도구는 설치된 Playwright를 사용한다(`PLAYWRIGHT_PATH` 선택 가능). 실제 renderer/CSS를 사용하되 자료 로드는 로컬 intercept, 답안 저장은 메모리 어댑터다. 제안 renderer 경로로 실행한 결과와 실제 제품 renderer 결과를 구분한다. 320/390/1440px·낮은 가로 화면, Chromium/WebKit, 축소 모션을 대조하며 실제 기기·운영 인증·배포 검사를 대신하지 않는다. 화면 캡처는 로컬 검수 전용이다.

신규 활성화 전 FE/API의 SHA별 144/147 상한·시대 범위·원문 보기와 source별 조회를 통합해야 한다. 현재 구판 풀이 목록·오답·중단 이어보기는 현재 quiz와 workspace를 함께 읽으므로 DB row만 남기는 것으로 기능이 보존되지 않는다. 구판 원문/정답/문항/workspace를 같은 source로 읽고 이어풀 수 있어야 한다. `source_version`은 원문 SHA 자체가 아니라 기존 API의 `SHA256(JSON.stringify({schema,source,items}))` 계산을 유지한다. 검토 브랜치 CI와 운영 반영은 통합 담당이 정확 SHA로 별도 확인한다.

### 원문 관계 교정 후보

사람 대조에서 확인한 사진/이름 셀, 출처표, raster 연표 문구 교정은 기존 후보를 보존한 새 `private-data/correction-candidates/.../<SHA>`에만 적용한다. 비공개 `source-relation-reviews.json`은 적용 전 페이지 hash, 원문 render/그림 hash, native 문자 ID와 검수한 표 경계를 고정한다. 출처 좌우 패널을 각각 3열로 복원하고 페이지 병합을 유지하며, 경계를 넘은 글자는 검수한 ID로만 지정한다. 글자 총량 일치만으로 사진명/출처 관계가 맞다고 판단하지 않는다.

```sh
python scripts/apply-history-relation-corrections.py "$HISTORY_CORRECTION" "$HISTORY_RELATION_REVIEWS"
node scripts/qa-history-source-relations.cjs "$HISTORY_CORRECTION" "$HISTORY_RELATION_QA"
```

전체 재생성에는 `rebuild-history-revision.py --relation-reviews "$HISTORY_RELATION_REVIEWS"`를 덧붙인다. 동일 입력으로 byte 재현한 뒤 native/문항/그림/구판 보존 검사와 전체 독서 브라우저 회귀를 다시 실행한다. 원문 PDF SHA·quiz digest·숫자 CAS revision은 서로 다른 값이며 교정 후보 식별자로 덮어쓰지 않는다. 원문/자료/검수 입력은 Git에 넣지 않으며 이 명령들은 업로드·활성화·운영 배포를 하지 않는다.

독서/관계 브라우저 QA는 로컬 intercept된 HTTPS 원본을 Blob으로 전달하며 `HISTORY_QA_ASSET_TRANSPORT=url`로 URL 계약을 별도 검사할 수 있다. WebKit의 내부 `blob:` 요청은 continue하고 실제 외부 요청은 차단한다. 결과의 `figureTransport`를 확인한다. 제거된 이미지도 `figure_load_failed` 상태로 검사하며, 이 검사를 실제 앱의 인증/API 전송 검수로 확대하지 않는다.

Offline only. Never copy `hanq-private-data` into a frontend public directory or deploy it. Source rights have not been cleared for publication.

Reproduce from the workspace root (Python 3.12, PyMuPDF 1.26.6):

    python hanq-private-work/scripts/extract_textbook.py --source "$(find hanq144 -maxdepth 1 -name '*.pdf' -print -quit)" --output hanq-private-data
    python -m unittest discover -s hanq-private-work/scripts -p 'test_textbook*.py' -v

The source PDF is copied byte-for-byte. All 144 page rasters preserve the source format and order. Text, images, vector paths, and raw character geometry are extracted without rewriting or normalization. Renders include annotations. PNGs are rendered at 2x scale by default.

## Consumer contract

Read `manifest.json`. `pages` is in original PDF page order. Every path is relative to this private data root; do not treat paths as public URLs. A local-only backend may serve these assets after an explicit private route is configured.

- `source`: sha256, bytes, originalFilename, pageCount, pdfPath.
- `pages[]`: pdfPage (1-based), printedPage (null on preliminary pages), width/height (PDF points), imagePath, dataPath, imageSha256, dataSha256, textSha256, textBlockCount, imagePlacementCount, reviewStatus.
- `pages/page-NNN.json`: textBlocks retains block/line/span hierarchy and raw chars; each span also includes literal text, font, size, flags, color, bbox, and bold/italic flag interpretation. imagePlacements retains bounds/transforms plus local asset/mask paths. vectorPaths retains drawing geometry, stroke and fill colors (including shading). semanticCandidates are coordinate regions only, never verified table cells or reading order.
- `assets[]`: extracted PDF xrefs, dimensions, byte counts and hashes. Inline assets are linked from each page. Full-page renders are the authoritative composited appearance, including masks and vector shapes.

Render page images with preserved aspect ratio, original order, and pan/zoom. Coordinate-based region enlargement can use candidate bounds; it must not claim semantic completeness or rearrange blocks. Tables, title/row/column associations, image captions, text-order anomalies and visual emphasis require manual verification before reflow. Page 104 is a known source-order anomaly. Printed page mapping is sourced from the supplied structural analysis and marked unverified per page.

No claim of verified full reflow or historical fact verification is made. Machine tests establish extraction coverage and byte preservation, not that PDF text reading order or Unicode mapping matches every visible glyph. Source-only view remains available on every page, including cover, appendices, image credits, and rights notice.

## Optional source-emphasis enhancement and coordinate regions

    python hanq-private-work/scripts/enhance_textbook.py --output hanq-private-data

`enhancedImagePath` is a passive PNG; `enhancedSvgPath` is a private audit artifact only. Each original glyph path use is matched by literal character and baseline position to a source span. Only positively matched bold-flag glyph fills become deep blue (#123b75); geometry and normal glyphs are untouched in SVG. Unmatched/ambiguous glyphs remain unchanged. Original PNGs stay available. Whole-page SVG rasterization was rejected; the corrected pixel-mask renderer below is required. Original source remains authoritative.

Each page JSON also gains `regions` containing full-page-width, ordered, nonoverlapping vertical source slices, covering y=0 through page height without gaps. Detected table row boundaries are candidate cut locations. Cuts intersecting text lines or images are rejected; a conservative 36-point caption margin is protected below images. Table candidates preserve source columns. Semantic row and caption association remains unverified. Region labels deliberately use neutral '구간 N'; they do not invent titles. No field should be presented as verified responsive reflow.

## Corrected pixel-preserving enhancement (required)

The full-page SVG rasterization path was rejected after visual comparison found thicker table headers and changed photo clipping. Never use full-page SVG output as the enhanced bitmap.

    python hanq-private-work/scripts/render_source_overlay.py --output hanq-private-data

The corrected renderer uses the untouched original PNG as its base. It renders only matched source-bold glyph paths to a transparent mask, then changes only existing source-ink pixels inside that mask. All normal-font span bounds and all image bounds are excluded. Original images, source shading, table headers, and ordinary text therefore remain pixel-identical outside selected bold glyph ink. A persisted mask and per-page audit prove zero differences outside that mask and zero differences in protected normal-text/image bounds. `enhancementAudit.pixelPreservationVerified` is set only after these checks and a saved-PNG readback check succeed. Semantic completeness remains unverified. Image-baked bold lettering is deliberately untouched.

`unmatched-glyph-audit.json` confirms all 51 unmatched glyph uses are whitespace, with zero non-whitespace misses. Those uses stay unchanged; no glyph is dropped.

## Conservative table-context segmentation correction

Whitespace-only cuts were found to split rows and detach country/king/category labels from their content. The corrected segmentation protects each complete detected table envelope, expanded to include every row and cell bbox. This deliberately preserves merged labels and column headings by refusing all cuts inside the table, even apparently safe row boundaries. Pages with no reliable table geometry use one whole-page region. Original/enhanced PNG bytes are checksum-verified unchanged by region refresh.

`tableRowAndCellBoundaryCheck: passed` means only that cuts do not cross detected geometry. It is never semantic proof. Whole-page fallbacks with unknown/detection-failed structure remain `not-verified`. Run `refresh_regions.py` to regenerate metadata only; full-table viewing with zoom is preferred over smaller fragments that lose context. The previous region count is obsolete; consult the current manifest.

## Pixel-proven optional reading viewport

    python hanq-private-work/scripts/prepare_textbook_viewports.py hanq-private-data

This adds page-wide horizontal crop coordinates from every exact nonwhite original PNG pixel with 4pt padding. Discarded side strips must be entirely white. Rasters are unchanged; reader full-page mode keeps original bounds and region mode keeps the full-page-derived font scale. Run after final region metadata generation.
