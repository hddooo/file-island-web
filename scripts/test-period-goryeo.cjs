/* 전체 복습 · 고려 시기별 요약(10쪽 · 장면) — 구성·적용 범위·재생 시간·빈칸 떠올리기·멈춤·이동·정리·메뉴·약한 시대 경로 (가짜 시계) */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict');
const { JSDOM } = require(process.env.JSDOM_PATH || process.env.HANQ_JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const ok = (v, n) => { assert(v, n); checks++; };
const norm = s => String(s || '').replace(/[^0-9A-Za-zㄱ-ㆎ가-힣一-鿿]/g, '').toLowerCase();
const MEDIA = ['textbook-notes', 'review-memory-cards', 'review-ancient-cards', 'review-goryeo-cards', 'review-joseon-cards', 'review-opening-cards', 'review-modern-cards', 'review-colonial-cards', 'period-reviews', 'review-player', 'review-menu'];
const sha = f => require('crypto').createHash('sha256').update(fs.readFileSync(path.join(ROOT, f))).digest('hex');
const KEEP = ['media/textbook-notes.js', 'media/review-goryeo-cards.js', 'media/review-memory-cards.js', 'media/review-ancient-cards.js', 'media/review-joseon-cards.js', 'media/review-colonial-cards.js', 'media/review-book/data/unit03.js', 'docs/exam-pool-map.json'];
const before = KEEP.map(sha);

function setup(opts) {
  opts = opts || {};
  const dom = new JSDOM('<main id="h"></main>', { runScripts: 'outside-only', url: 'http://127.0.0.1:8777', pretendToBeVisual: true }), w = dom.window;
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
  for (const f of (opts.files || MEDIA)) w.eval(fs.readFileSync(path.join(ROOT, 'media', f + '.js'), 'utf8'));
  require('./fixtures/preserved-review-player.cjs')(w);
  const h = w.document.querySelector('#h');
  return { dom, w, h, advance, timers, now: () => now, writes: () => writes, fetches: () => fetches,
    setHidden: v => { hidden = v; w.document.dispatchEvent(new w.Event('visibilitychange')); },
    btn: i => h.querySelectorAll('.memory-controls button')[i] };
}

/* ---------- 1. 덱 구성: 정확히 10쪽 · 다섯 시기 ---------- */
const t = setup();
const P = t.w.HANQ_PERIOD_REVIEWS, D = P.decks.goryeo, player = t.w.HanqReviewPlayer;
ok(JSON.stringify(P.enabled) === '["goryeo","joseon","prehistory","gojoseon","baekje","samguk","nambuk"]' && JSON.stringify(Object.keys(P.decks)) === '["goryeo","joseon","prehistory","gojoseon","baekje","samguk","nambuk"]' && P.route('ancient', 'all') === null && P.route('ancient', 'samguk').format === 'period' && P.route('ancient', 'nambuk').format === 'period', '새 요약 재생: 고려·조선 + 고대사의 선사·고조선·백제 왕 비교·삼국·남북국 부분(고대사 전체·나머지 시대는 기존 카드)');
ok(D.cards.length === 10, '고려 10쪽');
const want = ['전체 목차', '고려 초기', '문벌귀족 시기', '무신집권기', '원 간섭기', '고려 말', '사회', '경제', '문화', '최종 정리'];
ok(D.cards.every((p, i) => p.title.includes(want[i])), '쪽 순서: ' + D.cards.map(p => p.title).join(' / '));
ok(D.cards[0].kind === 'outline' && D.cards[9].kind === 'recap' && D.cards.slice(1, 6).every(p => p.kind === 'period') && D.cards.slice(6, 9).every(p => p.kind === 'topic'), '목차 → 시기 5 → 주제 3 → 최종 정리');
ok(JSON.stringify(D.timeline.map(x => [x.name, x.years])) === JSON.stringify([['고려 초기', '918~1018년'], ['문벌귀족 시기', '1018~1170년'], ['무신집권기', '1170~1270년'], ['원 간섭기', '1270~1351년'], ['고려 말', '1351~1392년']]), '교재 PDF 41쪽 다섯 시기와 연도');
ok(D.cards.slice(1, 6).map(p => p.at).join() === 'early,munbeol,musin,won,late', '시기 쪽마다 다섯 시기 하나씩');
const pageText = p => p.title + ' ' + p.period + ' ' + p.scenes.map(s => s.title + ' ' + s.rows.map(r => r.head + ' ' + r.items.map(i => i.t).join(' ')).join(' ')).join(' ');
ok(!D.cards.some(p => /몽골/.test(p.title)) && D.cards[3].scenes.some(s => /몽골/.test(s.title) && s.rows.some(r => /삼별초/.test(r.head))), '몽골 침입·삼별초는 무신집권기 쪽 안의 장면(따로 시기가 아님)');
ok(/공민왕/.test(D.cards[5].scenes[0].title) && /원 간섭기/.test(pageText(D.cards[5]).slice(0, 400)) && /1351/.test(D.cards[5].period), '공민왕 반원 개혁 = 원 간섭기 → 고려 말을 잇는 다리');
const outline = pageText(D.cards[0]);
ok(['호족', '문벌 귀족', '무신', '권문세족', '신진사대부·신흥무인', '거란(요)', '여진(금)', '몽골(원)', '홍건적·왜구', '918', '1018', '1170', '1270', '1351', '1392'].every(x => outline.includes(x)), '첫 쪽: 다섯 시기 연도·세력·침입 세력');
ok(D.cards.every(p => p.scenes.length >= 2 && p.scenes.every(s => s.rows.length >= 1 && s.rows.length <= 4)), '쪽마다 장면 2개 이상 · 장면당 한꺼번에 보이는 줄 1~4줄');
/* 압축: 숨긴 글 없이 실제 화면 글(쪽 제목·시기·장면 제목·줄 머리·부제·요점) 글자 수를 기준(b052282)과 비교 */
const COV = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.json'), 'utf8'));
const visibleChars = D.cards.reduce((a, p) => a + Array.from(p.title + p.period).length + p.scenes.reduce((b, s) => b + Array.from(s.title).length + s.rows.reduce((c, r) => c + Array.from(r.head + (r.sub || '') + r.items.map(x => x.t).join('')).length, 0), 0), 0);
const pageChars = p => Array.from(p.title + p.period).length + p.scenes.reduce((b, s) => b + Array.from(s.title).length + s.rows.reduce((c, r) => c + Array.from(r.head + (r.sub || '') + r.items.map(x => x.t).join('')).length, 0), 0);
const bodyChars = D.cards.slice(0, 9).reduce((a, p) => a + pageChars(p), 0);
ok(COV.baseline.visibleChars === 8174 && COV.baseline.bodyChars === 7720 && visibleChars === COV.summary.goryeo.visibleChars && bodyChars <= COV.baseline.bodyChars * 0.85, '본문 1~9쪽 화면 글 ' + COV.baseline.bodyChars + '자 → ' + bodyChars + '자(15% 이상 줄임)');
ok(visibleChars < COV.baseline.visibleChars && pageChars(D.cards[9]) > COV.baseline.finalChars, '전체 ' + COV.baseline.visibleChars + '자 → ' + visibleChars + '자 · 최종 정리는 다시 떠올리기용으로 ' + COV.baseline.finalChars + '자 → ' + pageChars(D.cards[9]) + '자(늘림)');
ok(D.cards.reduce((a, p) => a + p.scenes.length, 0) > COV.baseline.scenes, '장면을 늘려 한꺼번에 보이는 글을 줄임(쪽 수는 10 그대로)');
ok(!D.cards.some(p => /표 ?\d|<표|교재 표|PDF|qz:|tb:/.test(pageText(p))), '화면 글에 교재 표 번호·검수용 id 없음');

/* ---------- 2. 재생 시간: 같은 도우미(periodSteps)로 계산 · 15~20분 ---------- */
const est = player.estimate(D);
const steps = player.periodSteps(D, true);
ok(est === steps.reduce((a, s) => a + s.ms, 0) && est >= 900000 && est <= 1200000, '기본 재생(빈칸 떠올리기) ' + est + 'ms = 15~20분');
ok(player.estimate(D, false) < est && steps.filter(s => s.phase === 'recall').length === steps.filter(s => s.phase === 'reveal').length && steps.filter(s => s.phase === 'recall').every(s => s.ms >= 3000 && s.ms <= 5000), '떠올리기 3~5초 · 떠올리기마다 드러냄');
ok(steps.filter(s => s.phase === 'read').every(s => { const r = D.cards[s.page].scenes[s.scene].rows[s.row]; return s.ms >= 1200 + Array.from(r.kind === 'ask' ? r.head : r.head + (r.sub || '') + r.items.map(i => i.t).join('')).length * 90; }), '줄 읽기 시간 = 글자 수 × 90ms 이상(떠올리기 질문은 질문 글만 · 정답은 드러낸 뒤 읽음)');

/* ---------- 3. 메뉴: 시대별 학습 목차 DOM · 실제 계산 시간 ---------- */
t.w.HanqReviewMenu.mount(t.h, {}, null, null);
const cards = [...t.h.querySelectorAll('section.toc > button.period.ready')];
ok(cards.length === 6 && cards.every(b => b.querySelector('.number') && b.querySelector('.period-text strong') && b.querySelector('.period-text small') && b.querySelector('.state') && b.querySelector('.chevron')), '메뉴는 .toc · .period.ready · .number · .period-text · .state · .chevron');
ok(cards.map(b => b.querySelector('strong').textContent).join() === '고대사,고려,조선,개화기,일제강점기,현대사', '여섯 시대만');
ok(cards[1].querySelector('small').textContent === '핵심 복습 · 누구나 이용', '고려 카드 시간 = 실제 계산 ' + cards[1].querySelector('small').textContent);
const oldMin = player.estimate(t.w.HANQ_MEMORY_REVIEWS.modern);
ok(cards[5].querySelector('small').textContent === t.w.HANQ_MEMORY_REVIEWS.modern.cards.length + '장 카드 · 1배 약 ' + Math.round(oldMin / 60000) + '분 (1배 기준 '+Math.round(oldMin/60000)+'분)', '다른 시대는 기존 카드 플레이어 실제 시간');
t.w.HanqReviewMenu.stop();

/* ---------- 4. 모든 원래 요점·교재 핵심표 68행이 화면 글에 보임(전체 보기로 10쪽을 넘기며) ---------- */
const src = t.w.HANQ_MEMORY_REVIEWS.goryeo, TB = t.w.HANQ_TEXTBOOK.goryeo;
const EXCLUDED = ['0:0', '0:1', '0:2', '1:0', '1:1', '1:2'];
t.w.HanqReviewMenu.mount(t.h, {}, 'goryeo', null);
t.btn(1).click();
ok(t.h.querySelector('.memory-count').textContent === '1 / 10 쪽' && t.btn(1).textContent === '재생', '메뉴에서 고려 열기 → 새 10쪽 요약 · 멈춤');
t.btn(3).click();
ok(!t.h.querySelector('.pr-blank') && t.btn(3).getAttribute('aria-pressed') === 'true' && t.btn(3).textContent === '빈칸으로 떠올리기', '전체 보기로 바꾸면 가린 낱말 없음');
const domPages = [];
for (let i = 0; i < 10; i++) { domPages.push(norm(t.h.querySelector('.pr-page').textContent)); if (i < 9) t.btn(2).click(); }
ok(t.h.querySelector('.memory-count').textContent === '10 / 10 쪽' && t.btn(2).disabled && t.btn(1).textContent === '재생', '멈춘 채로 다음 쪽 9번 → 10쪽 · 다음 버튼 끝에서 꺼짐');
const all = domPages.join('|');
let facts = 0;
/* 원래 요점: 글 그대로 보이거나(visible), 압축 표가 적어 둔 줄인 글이 실제 화면에 보이고 원래 낱말이 절반 이상 남아 있어야(mapped) 함 */
let exact = 0, mapped = 0;
const factById = Object.fromEntries(COV.facts.filter(f => f.group === 'goryeo').map(f => [f.id, f]));
src.cards.forEach((c, ci) => c.points.forEach((pt, pi) => {
  if (EXCLUDED.includes(ci + ':' + pi)) { ok(factById['goryeo#' + ci + ':' + pi].status === 'excluded', '목차·안내 제외 ' + ci + ':' + pi); return; }
  facts++;
  const f = factById['goryeo#' + ci + ':' + pi];
  ok(f && f.text === pt, '적용 범위 JSON이 원래 요점 글을 그대로 기록 ' + ci + ':' + pi);
  if (all.includes(norm(pt))) { exact++; ok(f.status === 'visible', '그대로 보이는 요점 ' + ci + ':' + pi); return; }
  ok(f.status === 'mapped' && f.shortened.length && f.shortened.every(x => x.text.split(' / ').every(part => all.includes(norm(part)))) && Math.max(...f.shortened.map(x => x.overlap)) >= 0.5, '줄인 글이 화면에 보임 goryeo#' + ci + ':' + pi + ' ' + pt + ' → ' + (f.shortened || []).map(x => x.text).join(' | '));
  mapped++;
}));
ok(facts === 188 && exact + mapped === 188 && exact === COV.summary.goryeo.factsVisible && mapped === COV.summary.goryeo.factsMapped, '원래 고려 요점 188 = 그대로 ' + exact + ' + 줄인 글 ' + mapped + ' (그대로 보인다고 주장하지 않음)');
const words0 = s => String(s).split(/[\s·,/()=→+:~—–-]+/).map(norm).filter(x => Array.from(x).length >= 2);
const stem = w => { const x = w.replace(/(으로|에게|에서|까지|부터|이다|하여|했다|였다|[을를이가은는의에로와과도만])$/, ''); return Array.from(x).length >= 2 ? x : w; };
const words = s => words0(s).map(stem).filter(x => Array.from(x).length >= 2);
const termsOf = s => String(s).replace(/(\d)·(\d)/g, '$1\u0001$2').split(/\s*(?:·|\/|,|\(|\)|=|→|\+|:)\s*/).map(x => x.replace(/\u0001/g, '·').trim()).filter(x => Array.from(x).length >= 2);
let core = 0;
TB.core.forEach((g, gi) => g.rows.forEach(([term, desc], ri) => {
  core++;
  const hit = domPages.some(pt => termsOf(term).every(x => pt.includes(norm(x))) && (pt.includes(norm(desc)) || words(desc).filter(x => pt.includes(x)).length / words(desc).length >= 0.7));
  ok(hit, '교재 핵심표 용어+뜻 같은 쪽 ' + gi + ':' + ri + ' ' + term + ' — ' + desc);
}));
ok(core === 68, '교재 고려 핵심표 68행');
/* 핵심 인물·행동·결과 관계(줄인 글에서도 같은 줄에 묶여 있어야 함) */
const rowTexts = D.cards.map(p => p.scenes.map(sc => sc.rows.map(r => norm(r.head + ' ' + r.items.map(i => i.t).join(' ')))));
const rowIn = (pi, ...keys) => rowTexts[pi].some(sc => sc.some(r => keys.every(k => r.includes(norm(k)))));
ok(rowIn(1, '광종', '왕권 강화', '쌍기의 건의', '과거제', '노비안검법', '호족 견제'), '광종: 쌍기 → 과거제 · 노비안검법 → 호족 견제·왕권 강화');
ok(rowIn(1, '태조', '훈요 10조', '역분전', '흑창', '기인 제도', '사심관') && rowIn(1, '경종', '전시과', '수조권') && rowIn(1, '성종', '최승로', '시무 28조', '12목', '국자감'), '태조 · 경종 · 성종 정책');
ok(rowIn(1, '1차(993 · 성종)', '서희', '강동 6주', '철수') && rowIn(1, '2차(1010 · 현종)', '강조', '양규', '곽주성', '나주', '거란 철수') && rowIn(1, '3차(1018~1019 · 현종)', '강감찬', '1018 침입', '흥화진', '1019 귀주 대첩', '대규모 침입'), '본문 2쪽: 거란 1·2·3차를 따로 · 공식 자료 연도(993·1010·1018~1019)와 결과');
const body3 = D.cards[1].scenes.flatMap(sc => sc.rows).find(r => /^3차/.test(r.head));
ok(body3 && !/초조/.test(body3.head + body3.items.map(i => i.t).join(' ')) && body3.items.some(i => /^전쟁 뒤 방어 정비: 개경 나성/.test(i.t)) && rowIn(1, '거란 대비', '초조대장경', '거란을 물리치려는 염원'), '본문: 3차 줄에 초조대장경 없음(거란 대비·불교 줄에 따로) · 전쟁 뒤 방어 정비는 따로 적음');
ok(D.cards[2].scenes.flatMap(sc => sc.rows).some(r => r.head === '숙종(15대)') && !D.cards.some(p => p.scenes.some(sc => sc.rows.some(r => /숙종[^)]*1104/.test(r.head)))), '숙종 머리에 1104를 재위처럼 쓰지 않음');
ok(rowIn(2, '숙종', '별무반', '신기군', '신보군', '항마군') && rowIn(2, '숙종 별무반 창설', '예종 때 윤관이 9성 축조', '여진에 반환') && rowIn(2, '이자겸', '척준경', '외척') && rowIn(2, '묘청', '서경', '김부식', '진압'), '문벌: 숙종 별무반 → 예종 윤관 9성 · 이자겸(외척) vs 묘청(서경 천도)');
ok(rowIn(3, '최충헌', '교정도감', '봉사 10조') && rowIn(3, '최우', '정방', '강화도') && D.cards[3].scenes.every(sc => sc.rows.every(r => !(/^최충헌/.test(r.head) && /정방/.test(r.items.map(i => i.t).join(' '))) && !(/^최우/.test(r.head) && /교정도감/.test(r.items.map(i => i.t).join(' '))))), '무신: 교정도감=최충헌 · 정방=최우(서로 섞이지 않음)');
ok(rowIn(4, '정동행성', '쌍성총관부', '원이 고려에 둔 기구') && rowIn(5, '공민왕', '반원 개혁', '기철', '쌍성총관부 공격', '철령 이북', '전민변정도감'), '원이 둔 기구(원 간섭기) vs 공민왕 반원 개혁(쌍성총관부 수복)');
ok(rowIn(8, '의천', '천태종', '교관겸수') && rowIn(8, '지눌', '조계종', '수선사 결사') && rowIn(8, '정혜쌍수', '돈오점수', '지눌'), '의천 천태종·교관겸수 vs 지눌 조계종·정혜쌍수·돈오점수');
ok(rowIn(7, '역분전(태조, 공신)', '전시과(경종, 관리', '과전법') && rowIn(1, '역분전(태조) → 전시과(경종) → 과전법'), '토지: 역분전 → 전시과 → 과전법');

/* 최종 정리(10쪽): 흐름지도 → 핵심 비교(교재 다섯 시기별 왕 → 대외 관계 → 짝) → 떠올리기(질문 하나씩) → 정답 확인 */
const fin = D.cards[9];
const T = fin.scenes.map(s => s.title);
ok(T.length === 18 && T.slice(0, 2).every(t => /^흐름지도/.test(t)) && T.slice(2, 11).every(t => /^핵심 비교/.test(t)) && T.slice(11, 17).every((t, i) => t === '떠올리기 ' + (i + 1) + ' / 6') && T[17] === '정답 확인 · 한눈에', '최종 정리 단계: 흐름지도 2 → 핵심 비교 9 → 떠올리기 6 → 정답 확인 1');
ok(fin.scenes.every((s, i) => s.rows.length <= 3) && fin.scenes.slice(11, 17).every(s => s.rows.length === 1 && s.rows[0].kind === 'ask'), '최종 정리 장면당 3줄 이하 · 떠올리기는 장면마다 질문 하나');
ok(fin.scenes.filter(s => !/^떠올리기/.test(s.title)).every(s => s.rows.every(r => !(r.hb || []).length && r.items.every(i => !i.b.length))), '흐름지도·핵심 비교·정답 확인 줄은 무작위 낱말 빈칸 없이 읽기');
const flow = fin.scenes.slice(0, 2).flatMap(s => s.rows).map(r => r.head + ' ' + r.items.map(i => i.t).join(' ')).join(' ');
ok(['918~1018년', '1018~1170년', '1170~1270년', '1270~1351년', '1351~1392년', '호족', '문벌 귀족', '무신', '권문세족', '신진사대부', '이자겸', '묘청', '교정도감', '정방', '정동행성', '위화도 회군', '과전법'].every(x => flow.includes(x)), '흐름지도: 다섯 시기 연도·세력 + 시기마다 대표 사건(문벌·무신·원 간섭·고려 말 구별)');
const fr = (si, head) => { const r = fin.scenes[si].rows.find(r => r.head === head); return r ? r.items.map(i => i.t).join(' ') : ''; };
/* 주요 왕 15명(교재 다섯 시기로 묶음) · 왕: 정책 → 의미 · 왕마다 한 줄 */
const KINGS = ['태조', '혜종', '정종', '광종', '경종', '성종', '현종', '문종', '숙종', '예종', '인종', '고종', '충렬왕', '충목왕', '공민왕'];
const kingRows = fin.scenes.flatMap(sc => sc.rows).filter(r => r.kind === 'king');
ok(JSON.stringify(kingRows.map(r => r.head)) === JSON.stringify(KINGS) && kingRows.every(r => r.items.length === 1), '주요 왕 15명 차례: ' + kingRows.map(r => r.head).join(' → '));
const periodOf = name => { const sc = fin.scenes.find(s => s.rows.some(r => r.kind === 'king' && r.head === name)); return sc ? sc.title : ''; };
ok(['태조', '혜종', '정종', '광종', '경종', '성종', '현종'].every(k => /① 고려 초기의 왕/.test(periodOf(k))) && ['문종', '숙종', '예종'].every(k => /② 문벌귀족 시기의 왕/.test(periodOf(k))) && /② 인종 → ③ 무신집권기 고종/.test(periodOf('인종')) && /③ 무신집권기 고종/.test(periodOf('고종')) && ['충렬왕', '충목왕', '공민왕'].every(k => /④ 원 간섭기 → ⑤ 고려 말의 왕/.test(periodOf(k))), '왕을 교재 시기로 묶음: 초기 7(세 장면) · 문벌 4 · 무신 고종 · 원 간섭 2 · 공민왕(다리)');
ok(fin.scenes.slice(2, 5).every(s => s.rows.length <= 3) && fin.scenes.slice(2, 5).flatMap(s => s.rows).filter(r => r.kind === 'king').length === 7, '초기 왕 7명은 세 장면에 나눔(장면당 3줄 이하)');
const K = Object.fromEntries(kingRows.map(r => [r.head, r.items[0].t]));
ok(/훈요 10조/.test(K['태조']) && /사심관·기인 제도 → 호족 견제/.test(K['태조']) && /왕규의 난/.test(K['혜종']) && /광군 설치 → 거란 대비/.test(K['정종']) && /쌍기 → 과거제/.test(K['광종']) && /노비안검법 → 호족 견제·왕권 강화/.test(K['광종']), '태조 → 혜종(왕규의 난) → 정종(광군) → 광종(과거·노비안검법 → 왕권 강화)');
ok(/전시과 → 관리에게 토지의 수조권/.test(K['경종']) && /최승로 시무 28조 → 유교 정치/.test(K['성종']) && /12목/.test(K['성종']) && /거란 2차\(나주 피란\) · 3차\(강감찬 귀주 대첩\)/.test(K['현종']) && /최충 9재 학당/.test(K['문종']), '경종 전시과 · 성종 시무 28조·12목 · 현종 거란 2·3차 · 문종 최충');
ok(/별무반\(신기군·신보군·항마군\)/.test(K['숙종']) && /주전도감·해동통보/.test(K['숙종']) && /윤관 동북 9성/.test(K['예종']) && !/별무반/.test(K['예종']) && /이자겸의 난 → 묘청의 서경 천도 운동/.test(K['인종']), '숙종 별무반(예종 아님) · 예종 윤관 9성 · 인종 이자겸 → 묘청');
ok(/몽골 침입\(1231–\) · 실권은 최우 → 강화 천도\(1232\)/.test(K['고종']) && /통문관/.test(K['충렬왕']) && /정치도감 → 폐정개혁/.test(K['충목왕']) && /원 간섭기 → 고려 말을 잇는 반원 개혁: 기철 숙청 · 쌍성총관부 탈환 · 전민변정도감/.test(K['공민왕']), '고종(실권 최우) → 충렬왕 통문관 → 충목왕 정치도감 → 공민왕 반원 개혁(다리)');
ok(!kingRows.some(r => /^\d차/.test(r.head)) && !/1104/.test(K['숙종']), '왕 줄은 거란 1·2·3차 줄과 따로 · 숙종에 1104 없음');
const W = fin.scenes[5];
ok(W.title === '핵심 비교 · 거란 침입 1차 · 2차 · 3차' && W.rows.map(r => r.head).join() === '1차 993 · 성종,2차 1010 · 현종,3차 1018~1019 · 현종' && fr(5, '1차 993 · 성종') === '서희 담판 → 강동 6주 확보' && fr(5, '2차 1010 · 현종') === '강조 정변 구실 → 나주 피란 · 양규 곽주성 탈환·항전 → 거란 철수' && fr(5, '3차 1018~1019 · 현종') === '1018 침입 · 강감찬 흥화진 → 1019 귀주 대첩 → 거란의 대규모 침입 종결', '거란 1·2·3차 비교: 연도·왕 | 인물 → 결과(침입 연도 1018 ≠ 귀주 대첩 1019)');
ok(!/초조/.test(W.rows.map(r => r.items[0].t).join(' ')) && /초조대장경\(불교, 거란을 물리치려는 염원\)/.test(fr(4, '거란 대비')) && /전쟁 뒤 나성·천리장성/.test(K['현종']), '초조대장경은 3차 결과가 아니라 거란 대비(불교) 줄 · 전쟁 뒤 방어 정비는 현종 줄');
ok(/숙종 별무반 → 예종 윤관 동북 9성 → 여진에 반환/.test(fr(9, '여진(문벌귀족 시기)')) && /최우 강화 천도/.test(fr(9, '몽골(무신집권기)')) && /김윤후 처인성/.test(fr(9, '몽골(무신집권기)')) && /팔만대장경 → 1270 개경 환도에 반발한 삼별초 → 1273 진압/.test(fr(9, '몽골(무신집권기)')) && /홍산\(최영\) → 진포\(최무선·화포\) → 황산\(이성계\)/.test(fr(9, '홍건적 · 왜구(고려 말)')), '여진 → 몽골(무신집권기) → 홍건적·왜구');
ok(/최충헌: 교정도감·봉사 10조 \/ 최우: 정방·강화 천도/.test(fr(7, '무신 집권자')), '무신 집권자: 최충헌 교정도감 vs 최우 정방');
ok(/초조대장경=거란 · 팔만대장경=몽골/.test(fr(10, '대장경 · 최충')) && /의천: 천태종·교관겸수 \/ 지눌: 조계종·수선사·정혜쌍수·돈오점수/.test(fr(10, '의천 vs 지눌')), '헷갈리는 짝: 대장경 · 의천 vs 지눌');
ok(!D.cards.some(p => /12도|삼수병/.test(pageText(p))), '교재 표에 없는 사학 12도·문항 표현 삼수병을 쓰지 않음');
t.w.HanqReviewMenu.stop();
ok(t.timers.size === 0, '메뉴 닫으면 타이머 없음');

/* ---------- 5. 저절로 끝까지: 장면 하나씩 · 가림 → 떠올리기 → 자동 드러냄 · 다음 장면 전 모두 드러남 · 계산한 시간에 정확히 끝 ---------- */
const a = setup();
const handle = a.w.HanqReviewPlayer.mount(a.h, 'goryeo', '고려');
const A = a.w.HANQ_PERIOD_REVIEWS.decks.goryeo, aest = a.w.HanqReviewPlayer.estimate(A);
ok(a.h.querySelector('.pr-page') && handle.state().blank === true && handle.state().clock.active, '예전 학습 화면 경로(player.mount goryeo)도 새 요약 · 빈칸 기본 · 자동 시작');
let n = 0, recalls = 0, pageCounter = '', badScene = 0, leftBlanks = 0, oneScene = true, start = a.now();
/* 낱말 빈칸(.pr-blank) 또는 떠올리기 질문의 정답 통째 가림(.pr-items[hidden]) */
const masked = el => !!el.querySelector('.pr-blank') || [...el.querySelectorAll('.pr-row--ask .pr-items')].some(x => x.hidden);
for (;;) {
  const st = handle.state();
  if (st.ended) break;
  const cur = a.h.querySelector('.pr-scene.is-current');
  if (a.h.querySelectorAll('.pr-scene:not([hidden])').length !== 1) oneScene = false;
  if (st.phase === 'recall') {
    recalls++;
    const row = cur.querySelectorAll('.pr-row')[st.row];
    ok(row.classList.contains('is-recall') && masked(row), '떠올리기 동안 핵심 낱말(또는 질문의 정답) 가림 ' + st.step);
  }
  if (st.phase === 'reveal') {
    const row = cur.querySelectorAll('.pr-row')[st.row];
    if (masked(row) || !(row.querySelector('.pr-revealed') || row.classList.contains('pr-row--ask'))) badScene++;
  }
  if (st.phase === 'scene' && st.scene === 0) pageCounter = a.h.querySelector('.memory-count').textContent;
  else if (a.h.querySelector('.memory-count').textContent !== pageCounter) badScene++;
  const nextStep = a.w.HanqReviewPlayer.periodSteps(A, true)[st.step + 1];
  if (!nextStep || nextStep.scene !== st.scene || nextStep.page !== st.page) leftBlanks += masked(cur) ? 1 : 0;
  a.advance(st.clock.remaining);
  assert(++n < 5000);
}
ok(oneScene, '재생 중에는 장면 하나만 보임');
ok(recalls === a.w.HanqReviewPlayer.periodSteps(A, true).filter(s => s.phase === 'recall').length && badScene === 0, '모든 빈칸 줄: 떠올리기 → 자동 드러냄 · 장면이 바뀌어도 쪽 번호 같음');
ok(leftBlanks === 0, '다음 장면·쪽으로 넘어가기 전에 그 장면 빈칸이 모두 드러남');
ok(a.now() - start === aest, '클릭 없이 끝까지 · 끝난 시각 = 계산한 시간 ' + (a.now() - start) + 'ms');
const vis = [...a.h.querySelectorAll('.pr-scene:not([hidden])')];
ok(a.h.querySelector('.memory-count').textContent === '10 / 10 쪽' && a.btn(1).textContent === '다시 재생' && a.timers.size === 0 && !masked(a.h) && vis.length === 1 && /정답 확인 · 한눈에/.test(vis[0].querySelector('.pr-scene-title').textContent) && vis[0].querySelectorAll('.pr-row').length === 3, '최종 정리에서 멈춤 · 다음 시대로 안 넘어감 · 타이머 없음 · 끝나면 정답 확인 장면 하나(3줄)만 남음(35줄로 펼치지 않음)');
ok(a.w.location.hash === '' && a.writes() === 0 && a.fetches() === 0, '주소·저장소·서버 기록 없음');
a.btn(1).click();
ok(handle.state().step === 0 && handle.state().clock.active, '다시 재생은 같은 시대 처음부터');

/* ---------- 6. 멈춤: 장면 넘김과 드러냄이 함께 멈춤 · 멈춘 시간은 재생 시간에 안 들어감 · 가린 탭 ---------- */
const b = setup();
const hb = b.w.HanqReviewPlayer.mount(b.h, 'goryeo', '고려');
const B = b.w.HANQ_PERIOD_REVIEWS.decks.goryeo, best = b.w.HanqReviewPlayer.estimate(B);
let guard = 0;
while (hb.state().phase !== 'recall') { b.advance(hb.state().clock.remaining); assert(++guard < 500); }
const atRecall = hb.state();
b.advance(1000);
b.btn(1).click();
ok(hb.state().clock.paused && b.btn(1).textContent === '재생', '떠올리기 중 일시정지');
b.advance(600000);
ok(hb.state().step === atRecall.step && b.h.querySelector('.pr-row.is-recall .pr-blank'), '멈춘 10분 동안 드러내지 않고 장면도 그대로');
b.btn(1).click();
b.advance(hb.state().clock.remaining - 1);
ok(hb.state().step === atRecall.step, '남은 떠올리기 시간부터 이어서');
b.advance(1);
ok(hb.state().phase === 'reveal' && !b.h.querySelector('.pr-row.is-current .pr-blank'), '남은 시간이 지나면 자동으로 드러냄');
b.setHidden(true);
const hidStep = hb.state().step;
b.advance(300000);
ok(hb.state().step === hidStep && hb.state().clock.paused && b.btn(1).textContent === '재생', '탭을 가리면 멈춤');
b.setHidden(false);
ok(!hb.state().clock.paused, '다시 보이면 이어서');
b.btn(1).click();
b.setHidden(true); b.setHidden(false);
ok(hb.state().clock.paused, '직접 멈춘 재생은 탭이 다시 보여도 멈춘 채');
b.btn(1).click();
for (guard = 0; !hb.state().ended; guard++) { b.advance(hb.state().clock.remaining); assert(guard < 5000); }
ok(b.now() === best + 600000 + 300000, '끝난 시각 = 계산 시간 + 멈춘 시간(직접 10분 + 가린 탭 5분) ' + b.now() + ' vs ' + best);

/* ---------- 7. 손으로 쪽 이동(멈춤 유지) · 경계 버튼 · 빈칸/전체 보기 전환 · 줄인 움직임 · 정리 ---------- */
const c = setup();
const hc = c.w.HanqReviewPlayer.mount(c.h, 'goryeo', '고려');
ok(c.btn(0).disabled && c.btn(0).getAttribute('aria-disabled') === 'true' && !c.btn(2).disabled, '첫 쪽: 이전 버튼 꺼짐');
c.btn(1).click();
c.btn(2).click();
ok(hc.state().index === 1 && hc.state().clock.paused && hc.state().phase === 'scene' && c.h.querySelector('.memory-count').textContent === '2 / 10 쪽', '멈춘 채 다음 쪽 → 2쪽 첫 장면, 여전히 멈춤');
const pausedStep = hc.state().step;
c.advance(100000);
ok(hc.state().index === 1 && hc.state().step === pausedStep && c.h.querySelector('.memory-count').textContent === '2 / 10 쪽', '멈춘 채 시간이 지나도 그대로');
c.btn(0).click();
ok(hc.state().index === 0 && hc.state().clock.paused && c.btn(0).disabled && c.w.document.activeElement !== c.btn(0), '이전 쪽 → 1쪽 · 꺼진 버튼에 초점 남지 않음');
c.btn(3).click();
ok(hc.state().index === 0 && hc.state().clock.paused && !hc.state().blank && !c.h.querySelector('.pr-blank'), '전체 보기 전환: 쪽·멈춤 유지 · 가린 낱말 없음');
c.btn(3).click();
ok(hc.state().blank && hc.state().index === 0 && c.h.querySelector('.pr-blank'), '다시 빈칸으로');
ok([...c.h.querySelectorAll('.memory-controls button')].length === 4 && c.h.querySelectorAll('button').length === 4, '버튼은 이전·재생·다음·빈칸/전체 보기 넷뿐');
ok(c.h.querySelector('.pr-tl') && c.h.querySelectorAll('.pr-tl-node').length === 5, '다섯 시기 흐름 띠');
c.btn(2).click(); c.btn(2).click();
ok(c.h.querySelector('.pr-tl-node.is-here[aria-current="step"] .pr-tl-name').textContent === '② 문벌귀족 시기', '시기 쪽에서 해당 시기 표시');
const h2 = c.w.HanqReviewPlayer.mount(c.h, 'goryeo', '고려');
hc.stop();
ok(h2.state().clock.active && c.h.querySelector('.pr-page'), '옛 재생 손잡이를 멈춰도 새 재생은 그대로');
c.w.HanqReviewPlayer.stop();
ok(c.timers.size === 0 && c.writes() === 0 && c.fetches() === 0, '멈추면 타이머 정리 · 저장소·서버 기록 없음');

/* ---------- 8. 약한 시대 → 복습 경로(기존 index.html reviewRouteFor) ---------- */
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const m = /function reviewRouteFor\(id\)\{[^]*?return\{group:id,part:null\};\}/.exec(html) || /function reviewRouteFor\(id\)\{.*?\}\s*(?=function )/.exec(html);
ok(m, 'index.html reviewRouteFor 있음');
const reviewRouteFor = new Function(m[0] + ';return reviewRouteFor;')();
ok(JSON.stringify(reviewRouteFor('goryeo')) === '{"group":"goryeo","part":null}', 'CBT 약한 시대 고려 → #reviews/goryeo');
ok(/onLearn:function\(era,review\)\{openChapter\(era,false,review\?4:0\);\}/.test(html) && html.includes("initialStep=2;legacyQuizMaterial='cards'"), '실전 결과 복습 → 시대별 퀴즈의 복습 카드');
ok(html.includes('<script src="media/review-colonial-cards.js"></script><script src="media/period-reviews.js"></script>'), 'index.html이 새 요약 파일을 덱 뒤에 읽음');
const r = setup();
const route = reviewRouteFor('goryeo');
r.w.HanqReviewMenu.mount(r.h, {}, route.group, route.part);
ok(r.h.querySelector('.pr-page') && r.h.querySelector('.memory-count').textContent === '1 / 10 쪽', '약한 시대 고려 → 새 10쪽 요약');
for (const era of ['samguk', 'nambuk']) { const q = reviewRouteFor(era); r.w.HanqReviewMenu.mount(r.h, {}, q.group, q.part); ok(r.h.querySelector('.pr-page') && r.h.querySelector('.memory-count').textContent === '1 / ' + P.decks[era].cards.length + ' 쪽', '약한 시대 ' + era + ' → 새 요약'); }
for (const era of ['colonial', 'modern', 'islands', 'opening']) {
  const q = reviewRouteFor(era);
  r.w.HanqReviewMenu.mount(r.h, {}, q.group, q.part);
  ok(!r.h.querySelector('.pr-page') && r.h.querySelector('.memory-card .memory-points'), era + ' → 기존 카드 복습 그대로');
}
r.w.HanqReviewMenu.stop();
ok(r.timers.size === 0 && r.writes() === 0, '경로 검사 뒤 정리');

/* ---------- 9. 화면 크기: 고정 폭·고정 높이 없음 · 글자 15px 이상 · 줄인 움직임 ---------- */
const css = fs.readFileSync(path.join(ROOT, 'media', 'review-menu.css'), 'utf8');
const pr = css.slice(css.indexOf('/* 시기별 요약(review-player mountPages)'));
ok(pr.length > 200 && !/(?:^|[;{])\s*(?:width|height|min-width)\s*:\s*\d{3,}px/.test(pr) && !/max-height/.test(pr), '시기별 요약 CSS에 고정 폭·높이 없음(320px에서 가로로 안 넘침)');
ok((pr.match(/font-size:\s*(\d+)px/g) || []).every(x => Number(/\d+/.exec(x)[0]) >= 15), '글자 15px 이상');
ok(/overflow-wrap:anywhere/.test(pr) && /@media \(prefers-reduced-motion:reduce\)\{\.pr-row\{transition:none\}\}/.test(pr) && /\.pr-scene--flow5 \.pr-rows\{grid-template-columns:1fr/.test(pr), '긴 낱말 줄바꿈 · 줄인 움직임 · 다섯 시기 읽기 칸은 모든 폭에서 단일 열');
ok(/\.hanq-rm \.toc\b/.test(css) && !/\.hanq-rm__group\s*\{/.test(css), '메뉴 버튼에 따로 만든 격자 스타일 없음(시대별 학습 목차 스타일 그대로)');

/* 단일 열 자동 읽기: 화면 밖 단서는 드러내되, 화면 안 단서와 일시정지는 스크롤을 일으키지 않는다 */
const scrollQA = setup(); let scrollCalls = 0, offscreen = true;
scrollQA.w.HTMLElement.prototype.getBoundingClientRect = function () { return { top: offscreen ? 850 : 100, bottom: offscreen ? 1050 : 300, height: 200 }; };
scrollQA.w.HTMLElement.prototype.scrollIntoView = function () { scrollCalls++; };
const scrollHandle = scrollQA.w.HanqReviewPlayer.mount(scrollQA.h, 'goryeo', '고려');
scrollQA.advance(scrollHandle.state().clock.remaining);
ok(scrollCalls === 1, '화면 밖 현재 줄이 자동 읽기 때 화면 안으로 들어옴');
offscreen = false; scrollQA.advance(scrollHandle.state().clock.remaining);
ok(scrollCalls === 1, '이미 보이는 줄은 회상 단계에서 화면을 움직이지 않음');
scrollQA.btn(1).click(); offscreen = true; scrollQA.btn(2).click();
ok(scrollCalls === 1, '일시정지한 채 다음 쪽을 눌러도 자동 스크롤 없음');
scrollHandle.stop(); scrollQA.dom.window.close();

/* ---------- 10. 원래 자료 그대로 ---------- */
ok(KEEP.map(sha).join() === before.join(), '교재·원래 덱·문항 지도 파일 바이트 그대로');
const built = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_period_reviews.cjs'), '--check'], { encoding: 'utf8', timeout: 20000, env: Object.assign({}, process.env, { HANQ_TEXTBOOK_LAYOUT: '' }) });
ok(built.status === 0, '생성 파일이 편집 표·원문과 일치(build --check) ' + (built.stderr || '').slice(0, 200));

[t, a, b, c, r].forEach(x => x.dom.window.close());
console.log('Goryeo period review ' + checks + ' PASS · ' + D.cards.length + '쪽 · 장면 ' + D.cards.reduce((s, p) => s + p.scenes.length, 0) + ' · 기본 재생 ' + est + 'ms');
