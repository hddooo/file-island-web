# Practice audio ZIP

The audio ZIP button sits beside the existing answer-sheet PDF for Part 1, Part 2 and Part 3/4. It exports the same wrong-question selection and grouped question context as those PDFs, not every track from an entire exam. Part 5/6 and Part 7 explicitly have no listening audio.

All audio reads use the existing authenticated `toeicCbtAudio(collectionId, groupId, signal)` API. Source URLs are only identity keys and are never fetched directly. Identical URLs and identical returned bytes are deduplicated. A UTF-8 list links filenames to source titles and displayed PDF question numbers. Original MP3 bytes are retained, so a source recording may include audio beyond a configured playback segment. No new player UI is introduced; existing players are unchanged.

ZIP construction stays in memory. Missing or failed audio aborts the whole export instead of silently delivering an incomplete archive. Limits: 500 tracks, 20 MiB per track, 120 MiB unique audio. Cancellation, navigation, logout, account change and BFCache suspension clean up requests and object URLs. Exports do not write grades, progress or user records and do not use an external upload service.

Run `scripts/test-toeic-practice-audio.cjs` with JSDOM available (or set JSDOM_PATH). Synthetic coverage checks ZIP CRC/UTF-8/byte preservation, deduplication, errors, limits, ownership changes, retry/cancel, navigation and BFCache. Actual authenticated downloads and browser/mobile rendering require separate verification; JSDOM is not a real playback or layout test.
