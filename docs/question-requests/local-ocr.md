# Browser-local OCR candidate helper

Copy media/local-ocr.js and media/ocr into the same-origin static site. No external services or image uploads are used by this helper. Assets are pinned in asset-manifest.json; upstream licenses are included. Tesseract.js 7.0.0 and official tessdata_fast eng/kor models are used.

Load /media/local-ocr.js then call HanqLocalOcr.analyze(file,{subject:'toeic'|'history',signal:AbortSignal,onProgress}). The helper lazy-loads ONLY same-origin library, worker, core and models; caching disabled. Local image pixels remain in memory. Existing image uploads elsewhere are independent and must obey their own ownership contract.

Result: text (whole page, original line order), lines [{text,confidence,bbox,highlightOverlap}], highlightedLines, highlights, width/height (original image), ocrWidth/ocrHeight, scale, confidence, needsReview:true. All bboxes and highlight regions use original-image coordinates. Never treat confidence as correctness, generate correct answers, infer certain parts, or automatically publish. A marked number/line can select its full question block in the frontend; do not discard unmarked answer choices. No regions means no automatic selection, not no questions.

PNG/JPEG/WebP only, up to 8 MiB and 20 megapixels, sides <=10000. OCR working image reduced to max 2400px side. Highlight detector uses bright yellow/green/pink candidates and is heuristic: colored photos and marker variants can produce false positives/negatives. Temporary maximum-channel grayscale makes bright marker backgrounds less likely to hide black text; original photo is not modified. It may miss colored print; review against original is mandatory. Pictures/columns/tables/handwriting/low-quality camera shots need manual correction.

AbortSignal terminates worker; failure rejects rather than quietly emitting fabricated content. Do not send raw error data to public logs. Avoid parallel analyze calls on memory-constrained mobile devices. Use UI busy state and cancel before replacing the image.

Validation: test-browser.cjs runs synthetic English/Korean highlighted questions in headless installed Chrome; audits every request as localhost; checks forbidden MIME/size, early and active abort, highlight and blank-image detection. No real user image used. Mobile Safari and real textbook photos have not been tested.
