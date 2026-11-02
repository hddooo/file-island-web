# Private textbook extraction

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
