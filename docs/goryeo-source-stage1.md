# Goryeo source structure: local stage 1

Base: `d31a3adcdfd7d71c8c6e8e879b7f07499ec00843`. This isolated candidate is not an era release. No index, API client, deployed Joseon module, release number, source storage or runtime configuration changes are included.

Implemented display projections:

- Table15 retains six columns and the Mongol/Won invasion cell spanning two periods.
- Table16 joins PDF42–43 into six rows. Its geographical inset spans the three early-ruler rows; the invasion note stays with its row.
- Early exam table retains nine content bands and grouped labels.
- Military exam table joins PDF45–46 into eight content bands and four row groups.
- The ruler timeline belongs to early-kings; the inset belongs to table16. Both have no invented visible caption. The timeline's source-exact optional text is closed initially.

Dedicated reader, stylesheet, session, structure and transport modules use Goryeo namespaces. The reviewed two-request image queue, abort/retry, cross-realm Blob/decode recovery, modal leases and route/account/session teardown are retained. No generic replacement of Joseon rendering is made.

## Immutable inputs and gates

- Raw MD: 60806 bytes; SHA256 `245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9`.
- Private bundle: 74046 bytes; SHA256 `ed4fcfab4b25b0e896c93bcfe0240372b70da0fcbb22c1fa81afad14bbc71943`; schema `hanq-goryeo-script/1`. The private filename bundle-v2.json does not change the schema.
- Source PDF SHA256: `d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de`.
- 24 PNGs remain individually pinned. Raw MD, PNGs, bundle, PDF and private audit artifacts are not repository or build inputs.

Preparation checks bundle digest, reconstructed UTF-8 source size/digest, every referenced fragment, mapping coverage and figure pins before mounting. Byte spans are decoded as UTF-8 bytes, never JS character offsets. The resulting model is cloned and frozen. Only exact selected source fragments become study content. Extraction, layout and provenance descriptions are not exposed, including in disclosures.

All 100 parent questions, 100 printed answers and 103 empty response fields are preserved in separate practice/answer modes. PDF58 questions8–21 remain above the answer boundary. Drafts are memory-only and cleared at teardown. No canonical79 alias or persistence/grade writes are introduced.

## Scope still pending

The verified bundle has three topics: politics, society, culture. This first slice exposes politics only; initial options for any declared topic and stale/foreign history safely fall back to the valid available topic. There is no Joseon `early` fallback. Tables17–22, remaining exam tables, five other contextual figures and the 17-image gallery remain unchanged in the bundle but are not displayed as flattened fallback. A final all-topic/24-image by three-width (72-display) acceptance run remains necessary after those structures are implemented.

Release availability remains closed. Later integration needs authenticated GET `/api/v1/textbook/scripts/goryeo/:sourceSha256/bundle` and `/api/v1/textbook/scripts/goryeo/:sourceSha256/figures/:name`, existing HanQ JWT/live-session/member guards, private/no-store responses, JSON/PNG MIME types and exact bundle/asset hashes. No endpoint availability is assumed here. API-client and index hookup are deferred to reviewed integration; no admin cookies or volume sharing are used.

## Local verification

`test-goryeo-stage1.cjs` compares 68 text cells against an independent line extraction, all 125 emphasis records, spans/header associations, exact source/bundle and 24 asset hashes, 100/100/103 counts, PDF58 boundary, all declared initial-topic options and invalid-source/mapping rejection. `test-goryeo-stage-session.cjs` covers readiness, source/identity races, route/popstate ownership, lock leases and canonical navigation gates. `test-goryeo-stage-transport.cjs` covers closed availability, digest/MIME/size errors and abort.

`qa-goryeo-stage1.cjs` uses actual index/shared theme with synthetic in-memory integration and intercepted APIs; it makes no real-user writes. The harness routes Goryeo popstate through the existing integration hook in memory only. It verifies 320/390/1440 viewport scroll containment and 18px cells, bounded image requests, HTTP/decode retry, zoom/Back, independent modal leases, 103 empty fields, answer reveal, route teardown and logout.

Evidence stays outside Git in sibling `private-goryeo/stage1-qa`: 36 left/middle/right viewport screenshots, two continuation screenshots, zoom screenshot and metrics.json with exact scroll widths/offsets and row/cell metrics. Original PDF42/43/45/46 renders were opened alongside viewport screenshots. Joseon reader/session/transport regression tests pass; deployed source files remain byte-identical to the base. Static build is a local artifact only, not deployment evidence.
