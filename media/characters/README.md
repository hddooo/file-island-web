# HanQ character asset handoff

Generated 2026-10-08 using OpenAI's built-in image-generation tool. All artwork is an AI-generated fan depiction of the named Digimon characters. It is not official or officially licensed artwork. Generation does not grant a trademark or character license.

## Contents

- agumon-idle-sprite.png: four real animation cels, 2 × 2 atlas, 1254 × 1254 RGBA.
- patamon-idle-sprite.png: four real animation cels, 2 × 2 atlas, 1254 × 1254 RGBA.
- koromon.png, greymon.png, metalgreymon.png, wargreymon.png: single transparent portraits, each 1254 × 1254 RGBA.
- hanq-mascots.css: CSS animation and reduced-motion fallback.
- preview.html: standalone local visual preview.
- manifest.json: dimensions, frame coordinates, bytes, checksums, provenance, and validation.
- prompts.json: exact generation prompt set.

## Format and behavior

These files are PNGs plus CSS animation, not GIF files. Each sprite PNG stores four distinct generated cels. Animation is performed by CSS background positioning. All six PNGs have a verified alpha channel. PNG artwork is unchanged from the image tool.

Agumon: 627 × 627 source viewports, row-major grid. Neutral, wave, blink, neutral. Four-second loop with a short blink.
Patamon: 627 × 627 source viewports. Its generated second row was 42 pixels high relative to the first; CSS corrects the baseline by using y = 585 instead of 627. Four cels are wing-up, wing-down, happy blink, wing-level. 3.6-second loop.

For reduced motion, freeze on the first cell. The stylesheet implements this. Add hanq-mascot--static for any growth-stage thumbnail that should not animate. Do not display the whole sprite atlas with a plain img as one character.

## Integration

Keep the CSS next to all PNGs, or update its two URLs after moving into the site's public asset directory. The stylesheet is framework-independent.

Header: span with classes "hanq-mascot hanq-mascot--agumon", role="img", aria-label="Agumon". For a purely decorative mascot accompanying text, use aria-hidden="true" instead of role/label. Set --mascot-size to the desired CSS size, usually 72px–112px.

Patamon: substitute class hanq-mascot--patamon. Control premium selection/access in application logic, not in these artwork files.

Growth progression: Koromon portrait → Agumon first sprite cell → Greymon portrait → MetalGreymon portrait → WarGreymon portrait. Use standard img object-fit: contain for single portraits.

Keep the user's three encouragement phrases as accessible HTML text next to the mascot. No phrase text was supplied to this artwork task, so none was invented or burned into the images.

Do not preload every growth-stage portrait. Load the active character first; lazy-load an opened collection view. Full-resolution originals are included to avoid irreversible quality loss.

## Consumer desktop contract

Materialize the exact Library IDs reported with this handoff into the consuming desktop thread's own workspace using its current Library materialization workflow. Cloud-local paths in the producer thread are not desktop paths. The ZIP contains the complete flat asset directory; extract it to a temporary working directory, verify SHA-256 against manifest.json, then copy the needed files to the requested project. Do not use private signed download URLs in UI or code.

No user repository or computer was accessed or changed while creating these assets.


## 2026-10-09 idle 적용

정지 PNG 단계(코로몬·그레이몬·메탈그레이몬·워그레이몬·토코몬·엔젤몬·홀리엔젤몬)는 헤더와 마이페이지에서 CSS의 4초 주기 가벼운 떠오름을 공유합니다. 아구몬·파닥몬의 기존 4프레임 스프라이트는 그대로입니다. `prefers-reduced-motion: reduce`에서는 모든 idle을 멈춥니다. 점수·계열·프리미엄·클릭 동작은 변경하지 않습니다.

검증: 캐릭터/회원 UI 54개, 독립 Chrome(375·1280px) 46개 통과. 캐릭터별 헤더·마이페이지 idle, 클릭 대상, 프리미엄 계열과 줄인 움직임 설정을 확인했습니다. 운영 API/DB 요청 없음.

깜몬 자산은 현재 없습니다. 승인된 아구몬 계열 기준은 800점 이하 깜몬, 801~1199점 코로몬, 1200점 이상 기존 단계 유지이며, 기존 1000점 아구몬 구간을 대체합니다. 이 기준은 깜몬 이미지가 준비된 뒤 별도로 적용할 예정이고 이 idle 변경에 포함하지 않았습니다. 필요한 `botamon.png`는 투명 배경 RGBA 정사각 PNG(기존 초상화와 동일하게 1254×1254 권장), 캐릭터 전체가 잘리지 않고 중앙에 배치된 한 프레임입니다. 다른 캐릭터나 검은 원을 완성 자산으로 대체하지 않습니다.

2026-10-24: botamon.png is an AI-generated fan depiction (built-in image_gen, transparent PNG), not official/licensed artwork. Added requested default chain stage 깜몬 0–499 / 코로몬500–999; existing1000/1200/1500/1800 boundaries retained. Original generation preserved outside this repository.

## Rainbow collection addition (2026-10-28)

`collection-atlas-v1.webp` contains nine static 418×418 cells in a 1254×1254 transparent3×3 atlas. It was generated with built-in imagegen and converted with cwebp quality90/alpha100. Rows are digitama/Punimon/Tsunomon, Gabumon/Garurumon/WereGarurumon, MetalGarurumon/Poyomon/Seraphimon. Use `HanqCollection.portrait` and the manifest, not a full-atlas img. Existing artwork is reused for the other stages. These are AI-generated fan depictions, not official or officially licensed artwork. No additional battle action poses are claimed. The source prompt and provenance are in `collection-manifest.json` and its linked prompt file.


## Collection motion · 2026-10-30

`collection-life.js/css` reuses the reviewed collection portraits for articulated feelers, ears, limbs, tails and wings. The original portrait pixels are unchanged. `collection-atlas-v1.registration.json` records actual alpha-component bounds and CSS isolation, because figures cross the nominal418px cell edges. Detached Poyomon bubbles are preserved. The original Agumon rendering and all gameplay rules remain separate.

`patamon-hover-idle-v1.png` is the unmodified six-pose Library handoff candidate. Its raw3×2 layout has a row shift and cell-crossing wings; use the measured584px view and per-frame coordinates/clips in `patamon-hover-idle-v1.registration.json`, rather than a300%×200% equal-cell viewport. The integrated loop uses real earwing changes plus low hovering, with a static original four-cell fallback during decode failure.

`patamon-actions-v2.png` contains only Patamon charge/release/hurt/defeat in the approved orange/cream, blue-eye, purple-membrane identity. Use `patamon-actions-v2.registration.json` for actual silhouettes, common scale, clipping and mouth anchors. The old family atlas is retained for the other eleven forms and as fallback. Generation provenance is recorded in [patamon-actions-20261030.json](../../docs/versions/v0.1.0/patamon-actions-20261030.json). These remain AI-generated fan depictions, with the provenance notice above applying.

The local tests use real external stylesheet links and verify resolved asset URLs, frame changes, masks, visibility/reduced-motion lifecycle and decode recovery. Chromium/WebKit coverage is not a claim of real iPhone/Safari or production deployment.
