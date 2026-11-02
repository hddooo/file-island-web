# HanQ Patamon evolution supplement

This NEW supplemental package adds three transparent static portraits: Tokomon, Angemon, and HolyAngemon (MagnaAngemon). It does not replace or modify the previously delivered six-character package.

## Four-stage progression

1. Tokomon: tokomon.png from this supplement.
2. Patamon: keep patamon-idle-sprite.png and its existing PNG + CSS animation from the original pack.
3. Angemon: angemon.png from this supplement.
4. HolyAngemon (MagnaAngemon): holyangemon.png from this supplement.

These three new images are static PNGs, not GIFs. No new animation is provided or implied. Use them as ordinary images with object-fit: contain. Keep their transparent alpha channels. Do not replace the existing Patamon sprite with any of these portraits.

## Provenance

Created 2026-10-08 using the built-in OpenAI image-generation tool. These are AI-generated fan depictions of the named Digimon characters, not official or officially licensed artwork. They are stylized interpretations, not exact official model-sheet reproductions. No third-party image bytes are included. The full prompts are in prompts.json.

Official character references consulted for identity and defining traits:
- Tokomon: https://digimon.net/reference_en/detail.php?directory_name=tokomon
- Angemon: https://digimon.net/reference_en/detail.php?directory_name=angemon
- HolyAngemon / MagnaAngemon: https://digimon.net/reference_en/detail.php?directory_name=holyangemon

## Validation and integration

manifest.json records dimensions, exact byte sizes, SHA-256 hashes, transparency statistics, and frame counts. CHECKSUMS.sha256 covers all PNGs and supporting files. Each PNG was decoded and visually inspected; every file has an alpha channel and one frame.

Materialize this new ZIP into the consuming task's own workspace using the returned Library ID, then extract it into a separate directory. Producer cloud-local paths are not user-desktop paths. Copy the three PNGs to the existing character asset directory. Keep the prior package, CSS, and Patamon animation unchanged.

Only cloud asset files were created. No user computer, repository, or deployment was accessed or changed.

