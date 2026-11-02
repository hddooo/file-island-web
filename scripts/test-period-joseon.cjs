/* 전체 복습 · 조선 시기별 요약(14쪽 · 장면) — 교재 두 시기·연표 · 교재 오류 비전파 · 요점/핵심표 적용 범위 · 핵심 관계 · 최종 정리(왕·전쟁·비교)
 * · 계산한 재생 시간 · 전기/후기 메뉴 거르기 · 일반 시기 띠 접근성 · 자동 재생·멈춤·끝 정지 · 원래 자료 그대로 · 고려 그대로 (가짜 시계) */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { JSDOM } = require(process.env.JSDOM_PATH || process.env.HANQ_JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const ok = (v, n) => { assert(v, n); checks++; };
const norm = s => String(s || '').replace(/[^0-9A-Za-zㄱ-ㆎ가-힣一-鿿]/g, '').toLowerCase();
const MEDIA = ['textbook-notes', 'review-memory-cards', 'review-ancient-cards', 'review-goryeo-cards', 'review-joseon-cards', 'review-opening-cards', 'review-modern-cards', 'review-colonial-cards', 'period-reviews', 'review-player', 'review-menu'];
const sha = f => require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
/* 깨끗한 기준(6ed1bf0)의 원래 덱·교재 노트·진도·문항 지도: 바이트 그대로여야 함 */
const KEEP = {
  'media/review-joseon-cards.js': 'bcfb33827ed1af9605978b129fa6f5b4a297cd664b5f5c83b43a623231fee83a',
  'media/textbook-notes.js': 'e84134bf73f127cc7de3964e3a6d0c471437b3b009e04aa7c5381eabdc13c164',
  'media/review-memory-cards.js': '803e85c0050cd551ee9152572d6712f60fbd93c541a61a343e72ef6ee5c9144e',
  'media/quiz-progress.js': 'ac16c4a65575ee2be0224f49f950e6fcddec713eeef2c620d30f110a67346f3c',
  'docs/exam-pool-map.json': '74ee9689511b05d26c7550b3610f4640597cdd46206172324ec64999baf003e6',
  'media/review-book/data/unit04.js': '5164ef9be659ce82da2bfdff1e1e5f132f5a94ce1696b5554b1994a7b71ad094'
};

function setup() {
  const dom = new JSDOM('<main id="h"></main>', { runScripts: 'outside-only', url: 'http://127.0.0.1:8778', pretendToBeVisual: true }), w = dom.window;
  let now = 0, seq = 0, writes = 0, fetches = 0;
  const timers = new Map();
  w.setTimeout = (fn, ms) => { const id = ++seq; timers.set(id, { fn, at: now + ms }); return id; };
  w.clearTimeout = id => { timers.delete(id); };
  w.performance.now = () => now;
  w.requestAnimationFrame = () => 0;
  w.Storage.prototype.getItem = () => '1'; // Retain the existing 1x catalog timing regression.
  w.Storage.prototype.setItem = () => { writes++; };
  w.fetch = () => { fetches++; throw Error('review must not call APIs'); };
  let hidden = false;
  Object.defineProperty(w.document, 'hidden', { get: () => hidden });
  const advance = ms => { const end = now + ms; for (;;) { let id = null, t = null; timers.forEach((v, k) => { if (v.at <= end && (!t || v.at < t.at)) { id = k; t = v; } }); if (!t) break; timers.delete(id); now = t.at; t.fn(); } now = end; };
  for (const f of MEDIA) w.eval(fs.readFileSync(path.join(ROOT, 'media', f + '.js'), 'utf8'));
  require('./fixtures/preserved-review-player.cjs')(w);
  const h = w.document.querySelector('#h');
  return { dom, w, h, advance, timers, now: () => now, writes: () => writes, fetches: () => fetches,
    setHidden: v => { hidden = v; w.document.dispatchEvent(new w.Event('visibilitychange')); },
    btn: i => h.querySelectorAll('.memory-controls button')[i] };
}

/* ---------- 1. 구성: 교재 두 시기 · 읽기 묶음 · 연표 ---------- */
const t = setup();
const P = t.w.HANQ_PERIOD_REVIEWS, D = P.decks.joseon, G = P.decks.goryeo, player = t.w.HanqReviewPlayer;
ok(JSON.stringify(P.enabled) === '["goryeo","joseon","prehistory","gojoseon","baekje","samguk","nambuk"]', '새 요약 재생: 고려·조선 + 고대사 선사·고조선·백제 왕 비교·삼국·남북국 부분');
ok(D.cards.length === 14 && D.cards[0].kind === 'outline' && D.cards[13].kind === 'recap', '조선 14쪽 · 목차 → … → 최종 정리');
ok(JSON.stringify(D.timeline.map(x => [x.no, x.name, x.years])) === JSON.stringify([['①', '조선 전기', '태조~명종'], ['②', '조선 후기', '선조~철종']]) && D.timeline.every(x => x.weight === 1 && x.from === undefined), '교재의 공식 구분 둘(PDF 58·63쪽) · 재위 연도를 지어내지 않음');
const pageText = p => p.title + ' ' + p.period + ' ' + p.scenes.map(s => s.title + ' ' + s.rows.map(r => r.head + ' ' + r.items.map(i => i.t).join(' ')).join(' ')).join(' ');
const ALL = D.cards.map(pageText).join(' ');
ok(D.cards.slice(1, 3).every(p => p.stage === 'early' && /^조선 전기/.test(p.title) && /① 조선 전기 안의 읽기 묶음/.test(p.period)) && D.cards.slice(3, 7).every(p => p.stage === 'late' && /^조선 후기/.test(p.title) && /② 조선 후기 안의 읽기 묶음/.test(p.period)), '2~3쪽 전기 · 4~7쪽 후기 정치 흐름은 ‘읽기 묶음’으로 표시');
ok(!/조선 중기|5시기|다섯 시기/.test(ALL), '교재에 없는 다른 시기 구분을 만들지 않음');
const outline = pageText(D.cards[0]);
ok(['1392', '1592', '1636', '1910', '철종', '개화기', '태조~명종', '선조~철종'].every(x => outline.includes(x)), '목차: 연표 1392·1592·1636·1910 + 복습 범위는 철종까지(고종 이후 개화기)');
ok(!/600여/.test(ALL) && /순조·헌종·철종 세 왕에 걸쳐 약 60여 년/.test(ALL), 'PDF 68쪽 원문대로 순조·헌종·철종 약 60여 년');
const rows = D.cards.flatMap(p => p.scenes.flatMap(s => s.rows));
ok(rows.every(r => { const x = r.head + ' ' + r.items.map(i => i.t).join(' '); return !/별무반/.test(x) || /신기군·신보군·항마군/.test(x); }) && rows.filter(r => /삼수병/.test(r.head + r.items.map(i => i.t).join(' '))).every(r => /훈련도감/.test(r.head + r.items.map(i => i.t).join(' '))), '삼수병 = 훈련도감 · 별무반 = 신기군·신보군·항마군(PDF 43쪽 확인 문항 오류 비전파)');
ok(D.cards.every((p, i) => p.scenes.length >= (i === 0 ? 1 : 2) && p.scenes.every(s => s.rows.length >= 1 && s.rows.length <= 4)), '목차 밖의 쪽은 장면 2개 이상 · 장면당 한꺼번에 보이는 줄 4줄 이하');
ok(!D.cards.some(p => /<표|[^연]표 \d+|교재 표 ?\d|PDF|qz:|tb:|pdf:/.test(pageText(p))), '화면 글에 교재 표 번호·검수용 id 없음');
ok(!/목민심서|정전론/.test(ALL), '근거 없는 요청 낱말(목민심서·정전론)은 넣지 않음');

/* ---------- 2. 재생 시간: 같은 도우미 · 15~20분 · 고려와 같은 글자당 90ms ---------- */
const est = player.estimate(D), steps = player.periodSteps(D, true);
ok(est === steps.reduce((a, s) => a + s.ms, 0) && est >= 900000 && est <= 1200000, '조선 기본 재생 ' + est + 'ms = 15~20분');
ok(D.pace.msPerChar === 90 && steps.filter(s => s.phase === 'read').every(s => { const r = D.cards[s.page].scenes[s.scene].rows[s.row]; return s.ms === 1200 + Array.from(r.head + (r.sub || '') + r.items.map(i => i.t).join('')).length * 90; }), '줄 읽기 = 글자 수 × 90ms(빠르게 넘기지 않음)');
ok(steps.filter(s => s.phase === 'recall').length === steps.filter(s => s.phase === 'reveal').length && steps.filter(s => s.phase === 'recall').length >= 60, '빈칸 줄마다 떠올리기 → 드러냄');
ok(player.estimate(G) === 1049140 && G.cards.length === 10 && G.cards.reduce((a, p) => a + p.scenes.length, 0) === 41 && G.finishScene === 'last' && D.finishScene === undefined, '고려 요약(10쪽 · 41장면 · 1,049,140ms · 끝 장면 하나) · 조선 덱에는 finishScene 없음');

/* ---------- 3. 적용 범위: 원래 요점 388 · 교재 핵심표 140행 (전체 보기로 14쪽을 넘기며 실제 화면 글) ---------- */
const COV = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.json'), 'utf8'));
t.w.HanqReviewMenu.mount(t.h, {}, 'joseon', 'all');
t.btn(1).click(); t.btn(3).click();
ok(t.h.querySelector('.memory-count').textContent === '1 / 14 쪽' && !t.h.querySelector('.pr-blank'), '메뉴 조선 전체 → 새 14쪽 요약 · 전체 보기');
const domPages = [];
for (let i = 0; i < 14; i++) { domPages.push(norm(t.h.querySelector('.pr-page').textContent)); if (i < 13) t.btn(2).click(); }
const all = domPages.join('|');
const src = t.w.HANQ_MEMORY_REVIEWS.joseon;
const facts = Object.fromEntries(COV.facts.filter(f => f.group === 'joseon').map(f => [f.id, f]));
let exact = 0, mapped = 0, excluded = 0;
src.cards.forEach((c, ci) => c.points.forEach((pt, pi) => {
  const f = facts['joseon#' + ci + ':' + pi];
  ok(f && f.text === pt, '적용 범위 JSON이 원래 요점을 그대로 기록 ' + ci + ':' + pi);
  if (f.status === 'excluded') { excluded++; return; }
  if (all.includes(norm(pt))) { exact++; ok(f.status === 'visible', '그대로 보이는 요점 ' + ci + ':' + pi); return; }
  ok(f.status === 'mapped' && f.shortened.every(x => x.text.split(' / ').every(part => all.includes(norm(part)))) && Math.max(...f.shortened.map(x => x.overlap)) >= 0.5, '줄인 글이 화면에 보임 joseon#' + ci + ':' + pi + ' ' + pt);
  mapped++;
}));
ok(exact + mapped + excluded === 388 && excluded === 1 && exact === COV.summary.joseon.factsVisible && mapped === COV.summary.joseon.factsMapped, '조선 요점 388 = 그대로 ' + exact + ' + 줄인 글 ' + mapped + ' + 목차 안내 제외 1');
const words0 = s => String(s).split(/[\s·,/()=→+:~—–-]+/).map(norm).filter(x => Array.from(x).length >= 2);
const stem = w => { const x = w.replace(/(으로|에게|에서|까지|부터|이다|하여|했다|였다|[을를이가은는의에로와과도만])$/, ''); return Array.from(x).length >= 2 ? x : w; };
const words = s => words0(s).map(stem).filter(x => Array.from(x).length >= 2);
const termsOf = s => String(s).replace(/(\d)·(\d)/g, '$1\u0001$2').split(/\s*(?:·|\/|,|\(|\)|=|→|\+|:)\s*/).map(x => x.replace(/\u0001/g, '·').trim()).filter(x => Array.from(x).length >= 2);
let core = 0;
for (const era of ['joseon-early', 'joseon-late']) t.w.HANQ_TEXTBOOK[era].core.forEach((g, gi) => g.rows.forEach(([term, desc], ri) => {
  core++;
  ok(domPages.some(pt => termsOf(term).every(x => pt.includes(norm(x))) && (pt.includes(norm(desc)) || words(desc).filter(x => pt.includes(x)).length / words(desc).length >= 0.7)), '교재 핵심표 용어+뜻 같은 쪽 ' + era + ':' + gi + ':' + ri + ' ' + term);
}));
ok(core === 140 && COV.summary.joseon.coreTermAndMeaning === 140, '교재 조선 핵심표 140행(전기 74 + 후기 66) 모두 용어+뜻');
ok(COV.exam.joseon.questions === 93 && COV.exam.joseon.visible >= COV.exam.joseon.cardDeckVisible, '기출 조선 93문항 mem 낱말 ' + COV.exam.joseon.visible + '/' + COV.exam.joseon.keywords + ' (기존 카드 ' + COV.exam.joseon.cardDeckVisible + ' 이상)');
t.w.HanqReviewMenu.stop();

/* ---------- 4. 핵심 관계(같은 줄에 묶여 있어야 함) ---------- */
const rowTexts = D.cards.map(p => p.scenes.flatMap(sc => sc.rows.map(r => norm(r.head + ' ' + r.items.map(i => i.t).join(' ')))));
const rowIn = (pi, ...keys) => (pi === null ? rowTexts.flat() : rowTexts[pi]).some(r => keys.every(k => r.includes(norm(k))));
ok(rowIn(1, '태종', '6조 직계제', '왕권 강화') && rowIn(1, '세종', '의정부 서사제', '재상') && rowIn(13, '태종', '6조 직계제') && rowIn(13, '세조', '6조 직계제'), '태종 6조 직계제 vs 세종 의정부 서사제 vs 세조 6조 직계제');
ok(rowIn(2, '성종', '경국대전', '홍문관') && rowIn(2, '연산군', '무오사화(1498)', '갑자사화(1504)') && rowIn(2, '중종', '조광조', '기묘사화(1519)') && rowIn(2, '명종', '을사사화(1545)'), '성종 경국대전·홍문관 vs 연산군 무오·갑자 vs 중종 기묘 vs 명종 을사');
ok(rowIn(3, '훈련도감', '포수·사수·살수(삼수병)') && rowIn(4, '광해군', '중립외교') && rowIn(4, '대동법', '이원익', '경기') && rowIn(4, '정묘호란(1627)', '용골산성') && rowIn(4, '인조', '영정법', '풍흉과 관계없이') && rowIn(4, '남한산성', '삼전도'), '선조 임진·훈련도감 vs 광해군 중립·대동 vs 인조 정묘·병자·영정법');
ok(rowIn(5, '효종', '북벌', '어영청') && rowIn(5, '효종', '나선 정벌') && rowIn(5, '현종', '예송') && rowIn(5, '숙종', '환국') && rowIn(5, '숙종', '금위영'), '효종 북벌·나선 vs 현종 예송 vs 숙종 환국·금위영');
ok(rowIn(6, '영조', '균역법', '군포 2필 → 1필') && rowIn(6, '결작', '선무군관포') && rowIn(6, '정조', '규장각', '장용영', '신해통공'), '영조 균역법(결작·선무군관포) vs 정조 규장각·장용영·신해통공');
ok(rowIn(8, '과전법', '전·현직') && rowIn(8, '직전법(세조) → 관수관급제(성종)') && rowIn(8, '직전법 폐지(명종)', '녹봉') && rowIn(8, '대동법', '공인') && rowIn(8, '모내기법', '이모작') && rowIn(8, '도고') && rowIn(8, '덕대') && rowIn(8, '상평통보'), '과전법 → 직전법 → 관수관급제 → 직전법 폐지 · 대동법 공인 · 후기 경제');
ok(rowIn(7, '사헌부·사간원·홍문관', '삼사', '양사', '서경권'), '삼사(사헌부·사간원·홍문관) vs 양사(사헌부·사간원)');
ok(rowIn(10, '세종', '칠정산', '갑인자', '농사직설', '향약집성방') && rowIn(10, '태종', '혼일강리역대국도지도') && rowIn(10, '성종', '악학궤범') && rowIn(10, '주세붕', '백운동 서원(중종', '명종 때 사액', '소수 서원') && rowIn(10, '이황', '성학십도', '이이', '성학집요') && rowIn(10, '정상기', '동국지도', '김정호', '대동여지도'), '전기 문화 사업 · 서원(주세붕 중종 → 명종 사액) · 이황 vs 이이 · 동국지도 vs 대동여지도');
ok(rowIn(11, '유형원', '반계수록', '균전론') && rowIn(11, '이익', '성호사설', '한전론') && rowIn(11, '정약용', '여전론') && rowIn(11, '홍대용', '의산문답', '지전설') && rowIn(11, '박지원', '열하일기', '수레·선박', '양반전') && rowIn(11, '박제가', '북학의'), '실학: 유형원·이익·정약용 / 홍대용·박지원·박제가');
ok(rowIn(12, '정선', '진경산수화', '금강전도', '인왕제색도') && rowIn(12, '김정희', '금석과안록', '세한도', '추사체') && rowIn(12, '김홍도 씨름', '신윤복 월하정인'), '정선 진경산수화 · 김정희 · 김홍도 씨름 vs 신윤복 월하정인');

/* ---------- 5. 최종 정리: 장면을 나눠 왕 → 정책, 전쟁은 따로, 비교는 셋으로 ---------- */
const fin = D.cards[13];
ok(JSON.stringify(fin.scenes.map(s => s.title)) === JSON.stringify(['전기 왕 ① 태조 → 태종 → 세종 → 세조', '전기 왕 ② 성종 → 연산군 → 중종 → 명종', '후기 왕 ① 선조 → 광해군 → 인조 → 효종', '후기 왕 ② 현종 → 숙종 → 영조 → 정조', '세도 정치 · 순조 → 헌종 → 철종 · 전체 흐름', '전쟁과 반정 · 1592 임진왜란 → 1623 인조반정 → 1627 정묘호란 → 1636 병자호란', '헷갈리는 짝 ① 정치 · 기구', '헷갈리는 짝 ② 토지 · 세금 · 경제', '헷갈리는 짝 ③ 문화 · 학문']) && fin.scenes.every(s => s.rows.length <= 4), '최종 정리 장면 순서 · 장면당 4줄 이하');
const kingRows = fin.scenes.slice(0, 5).flatMap(s => s.rows).filter(r => r.kind === 'king');
ok(JSON.stringify(kingRows.map(r => r.head)) === JSON.stringify(['태조', '태종', '세종', '세조', '성종', '연산군', '중종', '명종', '선조', '광해군', '인조', '효종', '현종', '숙종', '영조', '정조', '순조', '철종']) && kingRows.every(r => r.items.length === 1), '주요 왕 18명 차례(교재·원래 카드에 있는 왕만 · 27왕 전체 아님)');
const K = Object.fromEntries(kingRows.map(r => [r.head, r.items[0].t]));
ok(/6조 직계제 → 왕권 강화/.test(K['태종']) && /의정부 서사제/.test(K['세종']) && /6조 직계제/.test(K['세조']) && /경국대전/.test(K['성종']) && /무오사화\(1498\)/.test(K['연산군']) && /기묘사화\(1519\)/.test(K['중종']) && /을사사화\(1545\)/.test(K['명종']), '전기 왕 → 정책');
ok(/훈련도감\(삼수병\)/.test(K['선조']) && /중립외교/.test(K['광해군']) && /대동법/.test(K['광해군']) && /영정법/.test(K['인조']) && /북벌/.test(K['효종']) && /예송/.test(K['현종']) && /환국/.test(K['숙종']) && /금위영/.test(K['숙종']) && /균역법/.test(K['영조']) && /신해통공/.test(K['정조']) && /공노비 해방\(1801\)/.test(K['순조']) && /삼정이정청/.test(K['철종']), '후기 왕 → 정책');
const wars = fin.scenes[5].rows;
ok(JSON.stringify(wars.map(r => r.head)) === JSON.stringify(['임진왜란(1592 · 선조 · 일본)', '정묘호란(1627 · 인조 · 후금)', '병자호란(1636 · 인조 · 청)']) && /탄금대/.test(wars[0].items[0].t) && /용골산성/.test(wars[1].items[0].t) && /삼전도/.test(wars[2].items[0].t) && !/용골산성|삼전도/.test(wars[0].items[0].t), '임진·정묘·병자를 따로(장소·인물 섞지 않음)');
ok(fin.scenes.slice(6).every(s => s.rows.every(r => r.kind === 'cmp')) && /6조 직계제/.test(K['태종']) && /6조 직계제/.test(K['세조']) && /의정부 서사제/.test(K['세종']) && fin.scenes.every(s => s.rows.some(r => (r.hb || []).length || r.items.some(i => i.b.length)) || s.rows.every(r => r.kind === 'cmp' || r.kind === 'note')), '혼동 비교는 세 장면으로 나눔');

/* ---------- 6. 메뉴: 조선 카드 시간 · 전체/전기/후기 거르기 · 약한 시대 경로 ---------- */
const m = setup();
m.w.HanqReviewMenu.mount(m.h, {}, null, null);
const cards = [...m.h.querySelectorAll('section.toc > button.period.ready')];
ok(cards[2].querySelector('small').textContent === '14쪽 요약 · 1배 약 ' + Math.round(est / 60000) + '분 (1배 기준 '+Math.round(est/60000)+'분)', '조선 메뉴 카드 = 실제 계산 시간 ' + cards[2].querySelector('small').textContent);
const early = D.cards.filter(p => p.stage === 'early' || p.stage === 'cross'), late = D.cards.filter(p => p.stage === 'late' || p.stage === 'cross');
ok(early.length < 14 && late.length < 14 && early.every(p => !/^조선 후기/.test(p.title)) && late.every(p => !/^조선 전기/.test(p.title)) && early[0].kind === 'outline' && late[late.length - 1].kind === 'recap', '전기·후기 범위: 각 시기 쪽 + 공통 주제, 목차로 시작 · 최종 정리로 끝');
m.w.HanqReviewMenu.mount(m.h, {}, 'joseon', 'joseon-early');
ok(m.h.querySelector('.memory-count').textContent === '1 / ' + early.length + ' 쪽' && m.h.querySelector('select').value === 'joseon-early' && m.timers.size === 1, '메뉴 조선 전기 → ' + early.length + '쪽');
const sel = m.h.querySelector('select'); sel.value = 'joseon-late'; sel.dispatchEvent(new m.w.Event('change'));
ok(m.h.querySelector('.memory-count').textContent === '1 / ' + late.length + ' 쪽' && m.timers.size === 1, '범위 바꾸기 → 후기 ' + late.length + '쪽 · 타이머 하나');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const rf = /function reviewRouteFor\(id\)\{[^]*?return\{group:id,part:null\};\}/.exec(html);
const reviewRouteFor = new Function(rf[0] + ';return reviewRouteFor;')();
for (const [era, n] of [['joseon-early', early.length], ['joseon-late', late.length]]) {
  const q = reviewRouteFor(era);
  m.w.HanqReviewMenu.mount(m.h, {}, q.group, q.part);
  ok(q.group === 'joseon' && m.h.querySelector('.pr-page') && m.h.querySelector('.memory-count').textContent === '1 / ' + n + ' 쪽', 'CBT 약한 시대 ' + era + ' → 조선 새 요약 ' + n + '쪽');
}
m.w.HanqReviewMenu.mount(m.h, {}, 'opening', null);
ok(!m.h.querySelector('.pr-page') && m.h.querySelector('.memory-card .memory-points'), '개화기는 기존 카드 그대로');
m.w.HanqReviewMenu.stop();
ok(m.timers.size === 0 && m.writes() === 0 && m.fetches() === 0, '메뉴 정리 · 저장소·서버 기록 없음');
const legacy = setup();
const lh = legacy.w.HanqReviewPlayer.mount(legacy.h, 'joseon-late', '조선 후기');
ok(legacy.h.querySelector('.memory-count').textContent === '1 / ' + late.length + ' 쪽' && lh.state().blank, '예전 학습 화면 경로(player.mount joseon-late)도 새 요약');
legacy.w.HanqReviewPlayer.stop();

/* ---------- 7. 시기 띠 접근성 · 자동 재생 끝까지 · 멈춤 · 끝 정지 ---------- */
const a = setup();
const hd = a.w.HanqReviewPlayer.mount(a.h, 'joseon', '조선');
const tl = a.h.querySelector('.pr-tl');
ok(tl && tl.getAttribute('aria-label') === '조선 시기 구분' && a.h.querySelectorAll('.pr-tl-node').length === 2 && [...a.h.querySelectorAll('.pr-tl-node')].every(n => n.style.flexGrow === '1'), '시기 띠: “조선 시기 구분” · 두 칸 같은 너비');
a.btn(1).click(); a.btn(2).click(); a.btn(1).click();
ok(a.h.querySelector('.pr-tl-node.is-here[aria-current="step"] .pr-tl-name').textContent === '① 조선 전기', '2쪽(전기 읽기 묶음)에서 ① 조선 전기 표시');
const A = a.w.HANQ_PERIOD_REVIEWS.decks.joseon, S = a.w.HanqReviewPlayer.periodSteps(A, true);
a.w.HanqReviewPlayer.stop();
const b = setup();
const hb = b.w.HanqReviewPlayer.mount(b.h, 'joseon', '조선');
let n = 0, recalls = 0, bad = 0, leftBlanks = 0, oneScene = true;
for (;;) {
  const st = hb.state();
  if (st.ended) break;
  const cur = b.h.querySelector('.pr-scene.is-current');
  if (b.h.querySelectorAll('.pr-scene:not([hidden])').length !== 1) oneScene = false;
  if (st.phase === 'recall') { recalls++; const r = cur.querySelectorAll('.pr-row')[st.row]; if (!r.classList.contains('is-recall') || !r.querySelector('.pr-blank')) bad++; }
  if (st.phase === 'reveal') { const r = cur.querySelectorAll('.pr-row')[st.row]; if (r.querySelector('.pr-blank') || !r.querySelector('.pr-revealed')) bad++; }
  const nx = S[st.step + 1];
  if (!nx || nx.scene !== st.scene || nx.page !== st.page) leftBlanks += cur.querySelectorAll('.pr-blank').length;
  b.advance(st.clock.remaining);
  assert(++n < 8000);
}
ok(oneScene && bad === 0 && leftBlanks === 0 && recalls === S.filter(s => s.phase === 'recall').length, '장면 하나씩 · 가림 → 떠올리기 → 자동 드러냄 · 다음 장면 전에 모두 드러남');
ok(b.now() === est && b.h.querySelector('.memory-count').textContent === '14 / 14 쪽' && b.btn(1).textContent === '다시 재생' && b.timers.size === 0, '클릭 없이 끝까지 · 끝난 시각 = 계산 시간 ' + b.now() + 'ms · 최종 정리에서 멈춤');
b.btn(1).click();
ok(hb.state().step === 0 && hb.state().clock.active, '다시 재생은 처음부터');
let g = 0; while (hb.state().phase !== 'recall') { b.advance(hb.state().clock.remaining); assert(++g < 500); }
const at = hb.state().step; b.btn(1).click(); b.advance(600000);
ok(hb.state().step === at && b.h.querySelector('.pr-row.is-recall .pr-blank'), '멈추면 드러냄·장면 넘김도 멈춤');
const pg = hb.state().index; b.btn(2).click();
ok(hb.state().index === pg + 1 && hb.state().clock.paused && hb.state().phase === 'scene', '멈춘 채 다음 쪽(그 쪽 첫 장면)');
b.setHidden(true); b.setHidden(false);
ok(hb.state().clock.paused, '직접 멈춘 재생은 탭이 다시 보여도 멈춤');
b.w.HanqReviewPlayer.stop();
ok(b.timers.size === 0 && b.writes() === 0 && b.fetches() === 0, '정리 · 저장소·서버 기록 없음');

/* ---------- 8. 원래 자료 그대로 · 생성 파일 일치 ---------- */
for (const [f, h] of Object.entries(KEEP)) ok(sha(f) === h, '바이트 그대로 ' + f);
const built = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_period_reviews.cjs'), '--check'], { encoding: 'utf8', timeout: 20000, env: Object.assign({}, process.env, { HANQ_TEXTBOOK_LAYOUT: '' }) });
ok(built.status === 0, '생성 파일이 편집 표·원문과 일치(build --check)');
const doc = fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.md'), 'utf8');
ok(/## 조선 \(전달\)/.test(doc) && !/600여 년/.test(doc) && /60여 년/.test(doc) && /삼수병/.test(doc) && /57, 58, 59, 60, 61, 63, 64, 65, 66, 67, 68, 71, 72, 73, 74, 75, 76, 77, 78, 79/.test(doc) && /144쪽 전체나 기출 500문항 그림을 모두 확인했다는 뜻이 아닙니다/.test(doc), '문서: 조선 근거 쪽 20쪽 · 별무반 정정 · 원문 세도 기간 · 확인 범위 한계');

[t, m, legacy, a, b].forEach(x => x.dom.window.close());
console.log('Joseon period review ' + checks + ' PASS · 14쪽 · 장면 ' + D.cards.reduce((s, p) => s + p.scenes.length, 0) + ' · 기본 재생 ' + est + 'ms');
