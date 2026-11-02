/* 고대사 · 백제 웅진·사비 왕 비교 — 수도 흐름(한성 → 웅진(공주) → 사비(부여)) · 문주왕 vs 동성왕(혼인 동맹) · 무령왕 22담로·벽돌무덤 ·
 * 성왕 사비·남부여·관산성, 거꾸로 떠올리기(설명 → 왕) 정답 숨김과 자동 공개, 계산한 재생 시간, 끝 장면 하나, 메뉴 범위·대체 경로,
 * 원래 삼국 카드·삼국/고대사 전체 경로·고려·조선·선사·고조선 그대로 (가짜 시계) */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict'), crypto = require('crypto');
const { JSDOM } = require(process.env.JSDOM_PATH || process.env.HANQ_JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const ok = (v, n) => { assert(v, n); checks++; };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const norm = s => String(s || '').replace(/[^0-9A-Za-zㄱ-ㆎ가-힣一-鿿]/g, '').toLowerCase();
const MEDIA = ['textbook-notes', 'review-memory-cards', 'review-ancient-cards', 'review-goryeo-cards', 'review-joseon-cards', 'review-opening-cards', 'review-modern-cards', 'review-colonial-cards', 'period-reviews', 'review-player', 'review-menu'];
/* 백제 작업 전(실제 front dev d66e98f와 같은 스냅숏)에서 잰 값 */
const BEFORE = {
  goryeo: { deck: '189bb1052d3325fb05990aa12da668fd9b39573aef7c7f313472c93dd84093be', steps: 'b78e12116f8eb392bfa28c7ce82889ea4646f53db6b2d5679ce3f91506371a07', stepsFull: '16d3e2fe2d4a815fa71d7ed2f81a1698ae18c235f6d0e8198c72493de27f85b2', ms: 1049140 },
  joseon: { deck: '5cf815c505b03d0c29b2c1522a4d723aad723098a4ae0f103f8fcfcd6f9f70d0', steps: '85180fc0cec42cfbd7f657b5072646d5811ea7486df5a20b8d467780a8d497e4', stepsFull: '34d4d736e60487106fd672add4162386b2d72c9c2e0f066226a1efd8afca20b6', ms: 1189820 },
  prehistory: { deck: '581f325f5fc36572d3af5428aaea2591ad81b04c6903fa5795ec5afef4db9b88', steps: '4c36d457164834b7c220bc71ba43cd5cda28cbbde96dbe555bd481f6d4911f48', stepsFull: '8572290ae0866a6a129e05c6801eefdb3b9614ea809a204ccc17c2225c765993', ms: 269100 },
  gojoseon: { deck: '4754585624bf9da59fa8c600b1bfb706007de2366d6b39f7c1e49508484975a8', steps: 'e2bad01c7f7cd29db2fca9052f6e5881d651fbcd4807fad7282b8c088c5b2b32', stepsFull: '9e5c0fefa1d5db30c25aae6f8f6f5513e339aaae5d2e3bae05b81d1a2f5162e0', ms: 328910 },
  cards: { samguk: { deck: '7e4f517c997d9e21c2565b3e71cbd078c97725d9ff2db862ba8edec50645f967', ms: 226076.66666666666, cards: 19 }, nambuk: { deck: '871df0bbc0b48ada5b532fb6f651ced3a16a9d6a18c8395c5115b779ae20dd79', ms: 190030, cards: 17 } }
};

function setup(skip) {
  const dom = new JSDOM('<main id="h"></main>', { runScripts: 'outside-only', url: 'http://127.0.0.1:8791', pretendToBeVisual: true }), w = dom.window;
  let now = 0, seq = 0, writes = 0, fetches = 0, hidden = false;
  const timers = new Map();
  w.setTimeout = (fn, ms) => { const id = ++seq; timers.set(id, { fn, at: now + ms }); return id; };
  w.clearTimeout = id => { timers.delete(id); };
  w.performance.now = () => now;
  w.requestAnimationFrame = () => 0;
  w.Storage.prototype.getItem = () => '1'; // Retain the existing 1x catalog timing regression.
  w.Storage.prototype.setItem = () => { writes++; };
  w.fetch = () => { fetches++; throw Error('no API'); };
  Object.defineProperty(w.document, 'hidden', { get: () => hidden });
  const advance = ms => { const end = now + ms; for (;;) { let id = null, t = null; timers.forEach((v, k) => { if (v.at <= end && (!t || v.at < t.at)) { id = k; t = v; } }); if (!t) break; timers.delete(id); now = t.at; t.fn(); } now = end; };
  for (const f of MEDIA) if (f !== skip) w.eval(fs.readFileSync(path.join(ROOT, 'media', f + '.js'), 'utf8'));
  require('./fixtures/preserved-review-player.cjs')(w);
  const h = w.document.querySelector('#h');
  return { dom, w, h, advance, timers, now: () => now, writes: () => writes, fetches: () => fetches,
    setHidden: v => { hidden = v; w.document.dispatchEvent(new w.Event('visibilitychange')); },
    btn: i => h.querySelectorAll('.memory-controls button')[i] };
}
function visibleText(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || node.hidden) return '';
  return [...node.childNodes].map(visibleText).join('');
}
const rowText = r => r.head + ' ' + r.items.map(i => i.t).join(' ');
const sceneText = s => s.title + ' ' + s.rows.map(rowText).join(' ');
const visScenes = x => [...x.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden);

const t = setup();
const P = t.w.HANQ_PERIOD_REVIEWS, BJ = P.decks.baekje, player = t.w.HanqReviewPlayer, SG = t.w.HANQ_MEMORY_REVIEWS.samguk;
const COV = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.json'), 'utf8'));

/* ---------- 1. 그대로인 것 ---------- */
for (const g of ['goryeo', 'joseon', 'prehistory', 'gojoseon']) ok(sha(JSON.stringify(P.decks[g])) === BEFORE[g].deck && sha(JSON.stringify(player.periodSteps(P.decks[g], true))) === BEFORE[g].steps && sha(JSON.stringify(player.periodSteps(P.decks[g], false))) === BEFORE[g].stepsFull && player.estimate(P.decks[g]) === BEFORE[g].ms, g + ' 생성 덱·재생 걸음·시간 그대로');
for (const [k, b] of Object.entries(BEFORE.cards)) { const d = t.w.HANQ_MEMORY_REVIEWS[k]; ok(sha(JSON.stringify(d)) === b.deck && player.estimate(d) === b.ms && d.cards.length === b.cards, '원래 ' + k + ' 카드 덱·카드 재생 시간 그대로'); }
ok(JSON.stringify(P.enabled) === '["goryeo","joseon","prehistory","gojoseon","baekje","samguk","nambuk"]' && P.route('ancient', 'all') === null && P.route('ancient', 'nambuk').format === 'period' && P.forEra('nambuk').format === 'period' && P.forEra('baekje') === null && P.route('ancient', 'samguk').cards.length === P.decks.samguk.cards.length && P.forEra('samguk').cards.length === P.decks.samguk.cards.length && P.route('ancient', 'samguk').cards.every(p => !BJ.cards.some(b => b.id === p.id)), '고대사 전체는 기존 카드(null) · 삼국·남북국은 새 요약(삼국에 백제 범위 4쪽을 다시 싣지 않음) · 백제 범위는 따로');
ok(P.route('ancient', 'baekje').format === 'period' && P.route('ancient', 'baekje').cards.length === 4 && P.route('ancient', 'baekje').finishScene === 'last', '백제 범위만 새 요약(4쪽 · 끝 장면 하나)');
/* 원래 삼국 카드의 백제 요점(조정자 확인: 6번 문주왕·22담로·벽돌무덤 / 8번 성왕·관산성·나제 vs 나당)과 동성왕이 원래 카드에 없다는 점 */
ok(JSON.stringify(SG.cards[6].points) === JSON.stringify(['문주왕: 한성을 잃고 웅진으로 천도 (지금의 공주)', '무령왕 · 22담로: 지방 22곳에 왕족을 보내 다스림', '벽돌무덤: 무령왕릉 — 중국 남조의 영향']) && JSON.stringify(SG.cards[8].points) === JSON.stringify(['성왕 · 사비: 사비로 천도, 국호를 남부여로', '관산성: 성왕이 신라와 싸우다 전사한 곳', '나제 동맹(신라·백제) ≠ 나당 동맹(신라·당)']) && !JSON.stringify(SG).includes('동성왕') && !JSON.stringify(t.w.HANQ_TEXTBOOK.samguk).includes('동성왕'), '원래 삼국 카드 6·8번 그대로 · 동성왕은 원래 카드·교재 노트에 없음(PDF에서 보완)');

/* ---------- 2. 내용: 수도 흐름 · 네 왕 · 비교 ---------- */
const T = BJ.cards.map(p => p.title + ' ' + p.period + ' ' + p.scenes.map(sceneText).join(' '));
ok(JSON.stringify(BJ.cards.map(p => p.kind)) === '["outline","period","period","recap"]' && JSON.stringify(BJ.cards.map(p => p.at)) === '["all","ungjin","sabi","all"]', '4쪽: 수도 흐름 → 웅진 → 사비 → 최종 정리');
ok(JSON.stringify(BJ.timeline.map(x => x.name)) === '["한성","웅진(공주)","사비(부여)"]' && BJ.timeline.every(x => x.weight === 1 && x.from === undefined) && BJ.timeline.map(x => x.years).join(' ').match(/문주왕 · 동성왕 · 무령왕/) && /성왕 · 남부여/.test(BJ.timeline[2].years), '수도 띠: 한성 · 웅진(공주) · 사비(부여) (연도 없음)');
const order = ['장수왕', '개로왕', '한성 함락', '문주왕이 웅진', '성왕이 사비', '남부여'];
ok(order.every((x, i) => T[0].includes(x) && (i === 0 || T[0].indexOf(x) > T[0].indexOf(order[i - 1]))) && /한성 → 웅진\(공주\) → 사비\(부여\)/.test(BJ.cards[0].period) && /한성 → 웅진 → 사비/.test(T[0]), '흐름지도: 장수왕 남진 → 개로왕 · 한성 함락 → 문주왕 웅진 → 성왕 사비 · 남부여');
const ung = BJ.cards[1].scenes, sabi = BJ.cards[2].scenes;
ok(/문주왕 한성을 잃고 웅진으로 천도 \(지금의 공주\)/.test(sceneText(ung[0])) && /동성왕 신라 소지 마립간과 혼인 동맹 → 나제 동맹 강화/.test(sceneText(ung[0])) && /백가의 난/.test(sceneText(ung[0])), '웅진 ①: 문주왕 웅진 천도 vs 동성왕 소지 마립간과 혼인 동맹(같은 장면에서 나란히)');
ok(/무령왕 · 22담로 지방 22곳에 왕족을 보내 다스림 \(왕족 파견 → 지방 통제\)/.test(sceneText(ung[1])) && /벽돌무덤 무령왕릉 — 중국 남조의 영향/.test(sceneText(ung[1])) && /남조 양과 외교/.test(sceneText(ung[1])), '웅진 ②: 무령왕 22담로(왕족 파견 → 지방 통제) · 벽돌무덤(남조 양)');
ok(/성왕 · 사비 사비로 천도, 국호를 남부여로/.test(sceneText(sabi[0])) && /도살성/.test(sceneText(sabi[0])) && /정림사지 5층 석탑 · 금동대향로/.test(sceneText(sabi[0])) && /진흥왕과 연합해 되찾음 → 신라가 차지/.test(sceneText(sabi[1])) && /관산성 성왕이 신라와 싸우다 전사한 곳/.test(sceneText(sabi[1])) && /나제 동맹\(신라·백제\) ≠ 나당 동맹\(신라·당\)/.test(sceneText(sabi[1])), '사비: 성왕 사비 천도·남부여 · 도살성 · 한강 하류 → 관산성 전사 · 나제 ≠ 나당');
const fin = BJ.cards[3], cmpT = fin.scenes.slice(0, 2).map(sceneText).join(' ');
ok(fin.scenes.slice(0, 2).every(s => s.rows.every(r => r.kind === 'cmp')) && /문주왕 = 웅진\(공주\)으로 옮김 \/ 동성왕 = 신라 소지 마립간과 혼인 동맹/.test(cmpT) && /동성왕 = 웅진 시대 · 혼인으로 나제 동맹 강화 \/ 성왕 = 사비 천도 · 남부여 · 관산성에서 전사/.test(cmpT) && /웅진 ← 문주왕 · 사비 ← 성왕/.test(cmpT), '헷갈리는 왕 비교: 문주왕 vs 동성왕 · 동성왕 vs 성왕 · 수도를 옮긴 왕');
ok(BJ.cards.every(p => p.scenes.every(s => s.rows.length >= 1 && s.rows.length <= 3)) && BJ.cards.reduce((a, p) => a + p.scenes.length, 0) === 12, '12장면 · 장면당 3줄 이하');
ok(!/빈출|자주 나오|오답|★/.test(T.join(' ')) && !/pdf:|tb:|samguk#|<표/.test(T.join(' ')), '‘빈출’·별표·검수용 표시는 화면에 없음');
ok(!/근초고왕|침류왕|마라난타|대가야|대야성|삼근왕|풍납/.test(T.join(' ')), '범위 밖 낱말(다른 왕·다른 나라·교재에 없는 유적)은 넣지 않음');

/* ---------- 3. 떠올리기: 설명 → 왕(정답 하나) ---------- */
const KEYS = [['무령왕'], ['동성왕'], ['성왕'], ['한성 → 웅진(공주) → 사비(부여)']];
const asks = fin.scenes.map((s, si) => ({ s, si })).filter(x => x.s.rows.some(r => r.kind === 'ask'));
ok(asks.length === 4 && asks.every((x, i) => x.s.rows.length === 1 && x.s.title === '떠올리기 ' + (i + 1) + ' / 4' && x.s.rows[0].items.length === 1 && x.s.rows[0].items[0].t === KEYS[i][0]), '떠올리기 4: 장면마다 질문 하나 · 정답 하나(무령왕 · 동성왕 · 성왕 · 한성 → 웅진 → 사비)');
ok(/22담로/.test(asks[0].s.rows[0].head) && /소지 마립간과 혼인 동맹/.test(asks[1].s.rows[0].head) && /사비.*남부여/.test(asks[2].s.rows[0].head) && /도읍이 옮겨 간 순서/.test(asks[3].s.rows[0].head), '질문은 설명(22담로 · 혼인 동맹 · 사비·남부여 · 수도 순서)에서 왕·수도로 거꾸로');
const leakWords = [['무령왕'], ['동성왕'], ['성왕'], ['한성', '웅진', '사비']];
asks.forEach((x, i) => ok(leakWords[i].every(k => !x.s.rows[0].head.includes(k) && !x.s.title.includes(k) && !fin.title.includes(k) && !fin.period.includes(k)), '질문 ' + (i + 1) + ' 글·제목에 정답 없음'));

/* ---------- 4. 원래 요점 · 교재 핵심표 · 기출 범위(글자만) ---------- */
const facts = COV.facts.filter(f => f.group === 'baekje');
ok(JSON.stringify(facts.map(f => f.id)) === '["samguk#6:0","samguk#6:1","samguk#6:2","samguk#8:0","samguk#8:1","samguk#8:2","samguk#9:1","samguk#11:2","samguk#18:2"]', '이 덱이 책임지는 원래 삼국 요점 9개(백제 수도·네 왕·사비 문화재)');
{ /* 전체 보기로 끝까지 자동 재생하며 실제로 보인 글 */
  const c = setup();
  c.w.HanqReviewMenu.mount(c.h, {}, 'ancient', 'baekje');
  c.btn(3).click();
  let seen = '';
  for (let n = 0; c.btn(1).textContent !== '다시 재생'; n++) { seen += '|' + norm(visibleText(c.h.querySelector('.pr-page'))); c.advance(500); assert(n < 5000); }
  for (const f of facts) {
    const pt = SG.cards[Number(f.id.split('#')[1].split(':')[0])].points[Number(f.id.split(':')[1])];
    ok(f.text === pt && (f.status === 'visible' ? seen.includes(norm(pt)) : f.status === 'mapped' && f.shortened.every(s => seen.includes(norm(s.text))) && Math.max(...f.shortened.map(s => s.overlap)) >= 0.5), '원래 요점 화면에 보임 ' + f.id + ' (' + f.status + ')');
  }
  ok(facts.filter(f => f.status === 'visible').length === 8 && facts.filter(f => f.status === 'mapped').length === 1 && COV.summary.baekje.factsMissing === 0, '요점 9 = 그대로 8 + 줄인 글 1(관산성 전투 진흥왕 때)');
  const rows = t.w.HANQ_TEXTBOOK.samguk.core.find(g => g.g === '백제 웅진 · 사비').rows;
  ok(rows.length === 5 && rows.every(([term, desc]) => term.split(' · ').every(x => seen.includes(norm(x))) && seen.includes(norm(desc))) && COV.summary.baekje.coreRows === 5 && COV.summary.baekje.coreTermAndMeaning === 5, '교재 핵심표 ‘백제 웅진 · 사비’ 5행 용어+뜻 모두 보임');
  ok(['동성왕', '소지마립간', '혼인동맹', '백가의난', '달기', '도살성', '송산리', '능산리', '부소산성'].every(x => seen.includes(x)), 'PDF에서 보완한 낱말이 실제 화면에');
  c.w.HanqReviewMenu.stop(); c.dom.window.close();
}
const EX = COV.exam.baekje;
ok(EX.questions === 9 && EX.keywords === 37 && EX.visible === 30 && EX.questionsWithVisible === 9, '기출 삼국 중 백제 수도·네 왕 문항 9개 · mem 낱말 30/37(글자만)');
ok(JSON.stringify(EX.missing) === JSON.stringify(['exam-71-05 근초고왕', 'exam-71-05 침류왕', 'exam-71-05 마라난타', 'exam-74-04 대가야', 'exam-74-04 대야성', 'exam-76-03 고국원왕', 'exam-79-03 삼근왕']), '보이지 않는 낱말은 같은 문항의 다른 왕·나라·시기 낱말뿐');
ok(['22담로', '무령왕', '성왕', '관산성', '사비'].every(k => EX.repeated.some(r => r.k === k && r.visible)) && JSON.stringify(EX.repeated.find(r => r.k === '22담로').questions) === '["exam-77-05","exam-79-03"]', '22담로(77-05·79-03) 등 여러 문항 낱말 모두 보임');
ok(COV.exam.ancient.visible === 266 && COV.exam.ancient.keywords === 324 && COV.summary.ancient.facts === 159 && COV.summary.ancient.coreRows === 107, '고대사 초안(재생에 안 씀) 적용 범위 수치는 백제 작업 전과 같음');
const layout = process.env.HANQ_TEXTBOOK_LAYOUT;
if (layout && fs.existsSync(layout)) {
  const pg = fs.readFileSync(layout, 'utf8').split('\f');
  ok(pg[19].includes('<표 6> 백제 핵심 내용') && /\(동성왕\) 나제 동맹 강화\(신라 소지왕\)/.test(pg[19]) && /지방에 22담로를 두어 왕족 파견/.test(pg[19]) && /사비 천도, 국호 남부여/.test(pg[19]) && /\(문주왕\) 공주로 천도/.test(pg[19]), 'PDF 20쪽 <표 6> 근거 글');
  ok(/소지 마립간과 혼인 동맹을 맺었다/.test(pg[21]) && /백제\(동성왕\)와 결혼 동맹/.test(pg[22]) && /\(1\) 지방에 22담로를 두어 왕족을 파견하였다/.test(pg[26]) && /\(3\) 사비로 천도하고 국호를 남부여로 고쳤다/.test(pg[26]) && /⑪ 동성왕이 나제 동맹을 강화하였다/.test(pg[27]), 'PDF 22·23쪽 동성왕 혼인 동맹 · 27·28쪽 설명 → 왕 문제');
}
ok(COV.baekjeSource.pdfAdded.some(x => /동성왕/.test(x.item) && /22쪽/.test(x.pdf) && /23쪽/.test(x.pdf)), 'PDF 보완 근거 기록(동성왕: 20·22·23·28쪽)');

/* ---------- 5. 재생 시간 · 메뉴 · 대체 경로 ---------- */
{ const S = player.periodSteps(BJ, true), est = player.estimate(BJ);
  ok(est === S.reduce((a, x) => a + x.ms, 0) && BJ.pace.msPerChar === 90 && BJ.pace.recallMs === 3500 && est < 900000 && est === COV.summary.baekje.timing.defaultMs && S.filter(x => x.phase === 'recall').every(x => x.ms === 3500), '기본 재생 ' + est + 'ms(글자당 90ms · 떠올리기 3.5초 · 15분 하한으로 늘리지 않음)'); }
const m = setup();
m.w.HanqReviewMenu.mount(m.h, {}, 'ancient', null);
const opt = [...m.h.querySelectorAll('.hanq-rm__select option')].map(o => [o.value, o.textContent]);
ok(opt.length===0,'고대사 내부 범위 선택 제거');
ok(m.h.querySelector('.memory-count').textContent === '1 / 54', '고대사 기본(전체)은 기존 54장 카드');
m.w.HanqReviewMenu.mount(m.h, {}, 'ancient', 'samguk');
ok(m.h.querySelector('.pr-page') && m.h.querySelector('.memory-count').textContent === '1 / ' + P.decks.samguk.cards.length + ' 쪽', '삼국 시대 범위는 새 삼국 요약(기존 19장 카드 대신)');
let routed = null;
m.w.HanqReviewMenu.mount(m.h, { onRoute: (g, p) => { routed = [g, p]; } }, 'ancient', 'samguk');
m.w.HanqReviewMenu.mount(m.h, {}, 'ancient', 'baekje');
ok(!m.h.querySelector('.hanq-rm__select')&&m.h.querySelector('.memory-count').textContent==='1 / 4 쪽','보존된 백제 자료 독립 검증');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const rf = /function reviewRouteFor\(id\)\{[^]*?return\{group:id,part:null\};\}/.exec(html);
const q = new Function(rf[0] + ';return reviewRouteFor;')()('samguk');
m.w.HanqReviewMenu.mount(m.h, {}, q.group, q.part);
ok(q.part === 'samguk' && m.h.querySelector('.memory-count').textContent === '1 / ' + P.decks.samguk.cards.length + ' 쪽', 'CBT 약한 시대(삼국)는 새 삼국 요약');
m.w.HanqReviewMenu.stop();
ok(m.timers.size === 0 && m.writes() === 0 && m.fetches() === 0, '메뉴 정리 · 기록 없음');
{ const f = setup('period-reviews');
  f.w.HanqReviewMenu.mount(f.h, {}, 'ancient', 'baekje');
  ok(f.h.querySelector('.memory-count').textContent === '1 / 19' && !f.h.querySelector('.pr-page'), '시기별 요약 파일이 없으면 백제 범위는 기존 삼국 카드로(빈 화면 없음)');
  f.w.HanqReviewMenu.stop(); f.dom.window.close(); }

/* ---------- 6. 재생: 정답이 화면 어디에도(수도 띠 포함) 없다가 3.5초 뒤 자동 공개 · 끝 장면 하나 ---------- */
{ const a = setup();
  a.w.HANQ_MEMORY_REVIEWS.period_ancient_baekje = a.w.HANQ_PERIOD_REVIEWS.route('ancient', 'baekje');
  const hd = a.w.HanqReviewPlayer.mount(a.h, 'period_ancient_baekje', BJ.title);
  let n = 0, leaks = 0, seen = 0, revealed = 0, one = true;
  for (;;) {
    const st = hd.state();
    if (st.ended) break;
    if (visScenes(a).length !== 1) one = false;
    const qi = st.page === 3 ? asks.findIndex(x => x.si === st.scene) : -1;
    if (qi >= 0) {
      const text = visibleText(a.h.querySelector('.pr-page'));
      if (st.phase === 'scene') ok(!leakWords[qi].some(k => text.replace(asks[qi].s.rows[0].head, '').includes(k)) && a.h.querySelector('.pr-tl').hidden, '백제 회상 장면 진입부터 정답과 수도 띠 숨김 ' + qi);
      if (st.phase === 'read' || st.phase === 'recall') { seen++; if (leakWords[qi].some(k => text.replace(asks[qi].s.rows[0].head, '').includes(k)) || !a.h.querySelector('.pr-tl').hidden) leaks++; }
      if (st.phase === 'reveal') { revealed++; ok(text.includes(KEYS[qi][0]), '질문 ' + (qi + 1) + ' 자동 공개: ' + KEYS[qi][0]); }
    }
    a.advance(st.clock.remaining);
    assert(++n < 3000);
  }
  ok(one && seen === 8 && leaks === 0 && revealed >= 4, '읽기·떠올리기 동안 정답(위쪽 수도 띠 포함) 화면에 없음 · 장면 하나씩');
  const vis = visScenes(a);
  ok(a.now() === player.estimate(BJ) && vis.length === 1 && /정답 확인 · 한눈에/.test(vis[0].textContent) && vis[0].querySelectorAll('.pr-row').length === 3 && /한성 → 웅진\(공주\) → 사비\(부여\)/.test(vis[0].textContent) && a.btn(1).textContent === '다시 재생' && a.timers.size === 0, '계산한 시각에 끝 · 정답 확인 장면(3줄) 하나만');
  a.btn(0).click();
  ok(hd.state().clock.paused && visScenes(a).length === 1 && hd.state().index === 2, '끝난 뒤 이전 쪽: 첫 장면에서 멈춘 채');
  a.w.HanqReviewPlayer.stop();
  const b = setup();
  b.w.HANQ_MEMORY_REVIEWS.period_ancient_baekje = b.w.HANQ_PERIOD_REVIEWS.route('ancient', 'baekje');
  const hb = b.w.HanqReviewPlayer.mount(b.h, 'period_ancient_baekje', BJ.title);
  for (let g = 0; !(hb.state().page === 3 && hb.state().phase === 'recall' && asks[0].si === hb.state().scene); g++) { b.advance(hb.state().clock.remaining); assert(g < 3000); }
  const at = hb.state().step, left = hb.state().clock.remaining;
  b.btn(1).click(); b.advance(600000);
  ok(hb.state().step === at && !visibleText(b.h.querySelector('.pr-page')).includes('무령왕'), '22담로 질문에서 멈추면 10분 지나도 정답(무령왕) 안 보임');
  b.btn(1).click(); b.advance(left - 1);
  ok(hb.state().step === at, '다시 재생: 남은 생각 시간부터');
  b.advance(1);
  ok(hb.state().phase === 'reveal' && visibleText(b.h.querySelector('.pr-page')).includes('무령왕'), '남은 시간 뒤 자동 공개');
  b.setHidden(true); const hs = hb.state().step; b.advance(300000);
  ok(hb.state().step === hs && hb.state().clock.paused, '가린 탭 멈춤'); b.setHidden(false);
  b.btn(3).click();
  ok(!hb.state().blank && visScenes(b).length === 1, '전체 보기로 바꿔도 장면 하나'); b.btn(3).click();
  for (let g = 0; !hb.state().ended; g++) { b.advance(hb.state().clock.remaining); assert(g < 3000); }
  b.btn(1).click();
  ok(hb.state().step === 0 && hb.state().clock.active, '다시 재생은 처음부터');
  b.w.HanqReviewPlayer.stop();
  ok(a.writes() + b.writes() + a.fetches() + b.fetches() === 0 && b.timers.size === 0, '저장소·서버 기록 없음 · 타이머 정리');
  [a, b].forEach(x => x.dom.window.close()); }

/* ---------- 7. 문서 · 생성 파일 일치 ---------- */
const doc = fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.md'), 'utf8');
ok(/## 고대사 · 백제 웅진·사비 왕 비교 \(전달\)/.test(doc) && /#reviews\/ancient\/baekje/.test(doc) && /기출 범위를 모두 다룬다는 뜻이 아니며/.test(doc) && /동성왕 · 신라 소지 마립간과 혼인 동맹/.test(doc) && doc.endsWith('\n') && !doc.endsWith('\n\n'), '문서: 경로 · 범위 · 기출 한계 · PDF 보완 근거 · 끝 빈 줄 없음');
const built = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_period_reviews.cjs'), '--check'], { encoding: 'utf8', timeout: 20000, env: Object.assign({}, process.env, { HANQ_TEXTBOOK_LAYOUT: '' }) });
ok(built.status === 0, '생성 파일 일치(build --check)');
[t, m].forEach(x => x.dom.window.close());
console.log('Baekje learning (백제 웅진·사비) ' + checks + ' PASS · ' + BJ.cards.length + '쪽 ' + BJ.cards.reduce((a, p) => a + p.scenes.length, 0) + '장면 · 질문 ' + asks.length + ' · ' + player.estimate(BJ) + 'ms');
