# 70–73 option study memo expansion

Base: local `276fa5f`, production-equivalent `d35a560`. This is **data only**, not deployed. Original question, correct answer, authored review and grading files are untouched.

## Contract

`round-70-73-study-memos.json` has `schema: hanq-choice-study-memos-v1` and `items[optionId]`. Each record contains questionId, exact content version, clue, resolved subject, 1–3 deduplicated associations, exact original option text with source JSON pointer, and individual association evidence paths. Authoring script records manually reviewed per-option IDs; there is no proposed runtime prose/prefix matching. New entity groups are limited to well-attested textbook identities. Existing curated groups are reused.

Integration must require successful `HanqCbtExplanations.resolve(q,'final')`, matching question ID, option ID and content version. Preserve existing government-first memo precedence. Render clue · subject · associations; if clue equals subject, emit it once. Correct option full line remains strong, other lines normal. Neither selected response nor official correctness changes.

## Actual fixture audit

|Round|Options|Before linked|After linked|New correct|New wrong|Memos|
|---|---:|---:|---:|---:|---:|---:|
|70|250|51|102|11|40|51|
|71|250|6|89|18|65|83|
|72|250|45|103|10|48|59|
|73|250|41|99|12|46|58|
|Total|1000|143|393|51|199|251|

One memo overlaps existing coverage (72-01 #5); the net addition is 250. Before/after measure presence of extra mnemonic associations, not whether an original explanation exists. **607 options remain without these new association blocks**, so this is not all-options completion.

Examples:
- 71-06 #3: 이사부·우산국 복속 · 지증왕 · 국호 신라, 동시전 (우산국 복속 deduplicated).
- 71-19 #2: 금위영 창설 · 숙종 · 환국, 초량왜관.
- 73-22 #3: 백두산정계비 · 숙종 · 환국, 금위영, 초량왜관.
- 73-17 #1: 의천의 천태종 개창 · 의천 · 교관겸수, 교장. The original subject '숙종 때' is explicitly not mapped to 조선 숙종.
- 72-37 #5: 중광단을 중심으로 조직 · 북로군정서 · 김좌진, 청산리 대첩, 대종교.

## Gaps / patterns

71 has full prose after the em dash, so old exact entity matching misses even unambiguous kings. 72 mixes prose and concise labels. Other frequent misses are qualified labels ('효종 때', '고종 때 흥선 대원군 집권기'), treaties with parenthetical years, and institutional/literary entities not in the old 77-group map.

Do not blindly compress false-pair or chronological-combination choices. Examples left unchanged: 70-12 #1 (균여 vs 요세 correction); 71-05 order variants; 72-14 political event order; 73-40 #3 order error. Also retain broad social-period, ambiguous reign and overlapping transition explanations unless explicitly audited. Existing modern-government dates/transition labels are not overridden.

Every record includes original author text for independent review. Associations have source paths into existing curated map and actual File Island notes/tables/round explanation sources. All added relationships are standard, unambiguous textbook facts; no external inferred dating was used.

## Tests

`node scripts/build-study-memos-70-73.cjs` regenerates deterministic metadata.
`node scripts/test-study-memos-70-73.cjs` uses real authored fixture and real resolver; exact source/version/ID checks, matching correct/wrong counts, 1–3 terms, dedup, input immutability, bad-version/unknown-ID negatives, and regression for 구석기/고구려 option offsets and 고려-vs-조선 숙종.
