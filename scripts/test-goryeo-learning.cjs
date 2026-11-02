/* 고려 최종 정리 학습 흐름(흐름지도 → 핵심 비교 → 떠올리기 → 정답 확인) — 자료 근거 연도·인물·결과 순서, 시기별 왕,
 * 질문 정답 새지 않음, 생각할 시간 뒤 자동 드러냄, 끝나면 장면 하나, 한 번에 보이는 줄 수, 멈춤·이동·모드·다시 재생·가린 탭,
 * 조선·메타데이터 없는 덱은 예전 그대로 (가짜 시계) */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict'), crypto = require('crypto');
const { JSDOM } = require(process.env.JSDOM_PATH || process.env.HANQ_JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const ok = (v, n) => { assert(v, n); checks++; };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const MEDIA = ['textbook-notes', 'review-memory-cards', 'review-ancient-cards', 'review-goryeo-cards', 'review-joseon-cards', 'review-opening-cards', 'review-modern-cards', 'review-colonial-cards', 'period-reviews', 'review-player', 'review-menu'];
/* 기준판 1afe92d: 조선 생성 덱·재생 걸음(예전 플레이어로 잰 값)과 원래 자료 바이트 */
const JOSEON_DECK_SHA = '5cf815c505b03d0c29b2c1522a4d723aad723098a4ae0f103f8fcfcd6f9f70d0';
const JOSEON_STEPS_SHA = { true: '85180fc0cec42cfbd7f657b5072646d5811ea7486df5a20b8d467780a8d497e4', false: '34d4d736e60487106fd672add4162386b2d72c9c2e0f066226a1efd8afca20b6' };
const KEEP = {
  'media/review-goryeo-cards.js': '776e0a73d69ed47b95a0637e568bd17943d0902a1e2432f64f827f98740442f6',
  'media/review-joseon-cards.js': 'bcfb33827ed1af9605978b129fa6f5b4a297cd664b5f5c83b43a623231fee83a',
  'media/textbook-notes.js': 'e84134bf73f127cc7de3964e3a6d0c471437b3b009e04aa7c5381eabdc13c164',
  'media/review-memory-cards.js': '803e85c0050cd551ee9152572d6712f60fbd93c541a61a343e72ef6ee5c9144e',
  'media/quiz-progress.js': 'ac16c4a65575ee2be0224f49f950e6fcddec713eeef2c620d30f110a67346f3c',
  'docs/exam-pool-map.json': '74ee9689511b05d26c7550b3610f4640597cdd46206172324ec64999baf003e6',
  'scripts/joseon-compact.cjs': '649841358fdfd062abaf242b59906771d383e8f9a6df2ba5c282ceae9bef461e'
};

function setup(extra) {
  const dom = new JSDOM('<main id="h"></main>', { runScripts: 'outside-only', url: 'http://127.0.0.1:8779', pretendToBeVisual: true }), w = dom.window;
  let now = 0, seq = 0, writes = 0, fetches = 0;
  const timers = new Map();
  w.setTimeout = (fn, ms) => { const id = ++seq; timers.set(id, { fn, at: now + ms }); return id; };
  w.clearTimeout = id => { timers.delete(id); };
  w.performance.now = () => now;
  w.requestAnimationFrame = () => 0;
  w.Storage.prototype.getItem = () => '1'; // Retain the existing 1x catalog timing regression.
  w.Storage.prototype.setItem = () => { writes++; };
  w.fetch = () => { fetches++; throw Error('no API'); };
  let hidden = false;
  Object.defineProperty(w.document, 'hidden', { get: () => hidden });
  const advance = ms => { const end = now + ms; for (;;) { let id = null, t = null; timers.forEach((v, k) => { if (v.at <= end && (!t || v.at < t.at)) { id = k; t = v; } }); if (!t) break; timers.delete(id); now = t.at; t.fn(); } now = end; };
  for (const f of MEDIA) w.eval(fs.readFileSync(path.join(ROOT, 'media', f + '.js'), 'utf8'));
  if (extra) extra(w);
  const h = w.document.querySelector('#h');
  return { dom, w, h, advance, timers, now: () => now, writes: () => writes, fetches: () => fetches,
    setHidden: v => { hidden = v; w.document.dispatchEvent(new w.Event('visibilitychange')); },
    btn: i => h.querySelectorAll('.memory-controls button')[i] };
}
/* 숨겨진(hidden) 요소를 건너뛴 실제로 보이는 글 */
function visibleText(node) {
  if (node.nodeType === 3) return node.textContent;
  if (node.nodeType !== 1 || node.hidden) return '';
  return [...node.childNodes].map(visibleText).join('');
}

const t = setup();
const P = t.w.HANQ_PERIOD_REVIEWS, D = P.decks.goryeo, J = P.decks.joseon, player = t.w.HanqReviewPlayer;
const fin = D.cards[9];
const COV = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.json'), 'utf8'));

/* ---------- 1. 자료 근거: 거란 침입 연도·인물·결과 순서 · 시기별 왕 ---------- */
const body = D.cards[1].scenes.flatMap(s => s.rows);
const bodyWar = n => body.find(r => r.head.startsWith(n + '차'));
ok(bodyWar(1).head === '1차(993 · 성종): 서희' && bodyWar(2).head === '2차(1010 · 현종): 강조의 정변이 구실' && bodyWar(3).head === '3차(1018~1019 · 현종): 강감찬 귀주 대첩', '본문 2쪽: 최종 질문 전에 연도(993 · 1010 · 1018~1019)를 먼저 배움');
ok(/양규 곽주성 탈환·포로 구출/.test(bodyWar(2).items[0].t) && /거란 철수$/.test(bodyWar(2).items[0].t) && !/승리|완전/.test(bodyWar(2).items[0].t), '2차: 양규 곽주성 탈환·포로 구출 → 거란 철수(완전 승리로 쓰지 않음)');
ok(/^1018 침입 · 흥화진 전투도 승리 → 1019 귀주 대첩 → 거란의 대규모 침입이 끝남$/.test(bodyWar(3).items[0].t), '3차: 1018 침입 → 1019 귀주 대첩 → 대규모 침입 끝(침입 연도 ≠ 전투 연도)');
const off = COV.goryeoFinal.official;
ok(['kc_i200300', 'kc_i200400', 'E0035425', 'E0001049'].every(k => off[k] && /^https:\/\/(contents\.history\.go\.kr|encykorea\.aks\.ac\.kr)\//.test(off[k].url)) && /993/.test(off.kc_i200300.facts) && /1010/.test(off.kc_i200300.facts) && /1019 귀주 대첩/.test(off.kc_i200400.facts), '연도 근거: 우리역사넷·한국민족문화대백과(교재 PDF 42쪽 표로 돌리지 않음)');
const doc = fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.md'), 'utf8');
ok(/교재 PDF 42쪽 표에는 1·2·3차의 왕·인물만 있고 연도가 없습니다/.test(doc) && /새 시기를 만들지 않았습니다/.test(doc) && /34왕 전체 아님/.test(doc), '문서: 연도 출처 구분 · 3차 전쟁이 시기 경계에 걸침 · 34왕 전체 아님');
ok(JSON.stringify(D.timeline.map(x => x.years)) === JSON.stringify(['918~1018년', '1018~1170년', '1170~1270년', '1270~1351년', '1351~1392년']), '교재 다섯 시기 연표 그대로(새 시기 없음)');
ok(fin.scenes.length === 18 && fin.scenes.every(s => s.rows.length <= 3), '최종 정리 18장면 · 장면당 3줄 이하');

/* ---------- 2. 떠올리기 질문 6개: 대상·정답 새지 않음 ---------- */
const asks = fin.scenes.map((s, si) => ({ s, si })).filter(x => x.s.rows.some(r => r.kind === 'ask'));
const KEYS = [['성종'], ['양규', '강감찬'], ['1018', '1019'], ['숙종', '윤관', '최우'], ['초조', '팔만'], ['최충']];
ok(asks.length === 6 && asks.every((x, i) => x.s.rows.length === 1 && x.s.title === '떠올리기 ' + (i + 1) + ' / 6'), '질문 6개 · 장면마다 하나 · 제목은 번호만');
asks.forEach((x, i) => {
  const r = x.s.rows[0], ans = r.items.map(it => it.t).join(' ');
  ok(KEYS[i].every(k => ans.includes(k)), '질문 ' + (i + 1) + ' 정답에 ' + KEYS[i].join('·'));
  ok(KEYS[i].every(k => !r.head.includes(k) && !x.s.title.includes(k)), '질문 ' + (i + 1) + ' 질문 글·장면 제목에 정답 낱말 없음: ' + r.head);
  ok(!(r.hb || []).length && r.items.every(it => !it.b.length), '질문 ' + (i + 1) + ' 낱말 빈칸 대신 정답 전체를 가림');
});
ok(/시무 28조/.test(asks[0].s.rows[0].head) && /곽주성/.test(asks[1].s.rows[0].head) && /귀주 대첩/.test(asks[2].s.rows[0].head) && /별무반/.test(asks[3].s.rows[0].head) && /몽골/.test(asks[3].s.rows[0].head) && /대장경/.test(asks[4].s.rows[0].head) && /9재 학당/.test(asks[5].s.rows[0].head) && /교정도감/.test(asks[5].s.rows[0].head), '질문 대상: 왕←정책 · 거란 2차/3차 인물 · 침입 연도 vs 전투 연도 · 여진 vs 몽골 · 초조 vs 팔만 · 최충 vs 최충헌');

/* ---------- 3. 재생 시간: 같은 도우미 · 15~20분 · 질문은 질문 읽기 → 떠올리기 3.5초 → 정답 읽기 ---------- */
const S = player.periodSteps(D, true), est = player.estimate(D);
ok(est === S.reduce((a, x) => a + x.ms, 0) && est >= 900000 && est <= 1200000, '고려 기본 재생 ' + est + 'ms = 15~20분');
const askSteps = S.filter(x => x.page === 9 && fin.scenes[x.scene].rows[x.row] && fin.scenes[x.scene].rows[x.row].kind === 'ask');
ok(askSteps.length === 18 && asks.every(x => { const st = askSteps.filter(y => y.scene === x.si); const r = x.s.rows[0]; return st.map(y => y.phase).join() === 'read,recall,reveal' && st[0].ms === 1200 + Array.from(r.head).length * 90 && st[1].ms === 3500 && st[2].ms === 1200 + Array.from(r.items.map(i => i.t).join('')).length * 90; }), '질문마다 읽기(질문 글) → 떠올리기 3.5초 → 드러낸 정답 읽기(글자당 90ms)');
ok(player.periodSteps(D, false).filter(x => x.page === 9 && fin.scenes[x.scene].rows[x.row] && fin.scenes[x.scene].rows[x.row].kind === 'ask').every(x => x.phase === 'read'), '전체 보기: 질문·정답을 함께 읽기(떠올리기 단계 없음)');
t.w.HanqReviewMenu.mount(t.h, {}, null, null);
ok(t.h.querySelectorAll('.toc .period')[1].querySelector('small').textContent === '핵심 복습 · 누구나 이용', '메뉴 시간 = 실제 계산');
t.w.HanqReviewMenu.stop();

/* ---------- 4. 자동 재생: 질문 장면에서 정답은 생각할 시간 뒤에만 · 한 번에 보이는 줄 · 끝나면 장면 하나 ---------- */
const a = setup();
const ha = a.w.HanqReviewPlayer.mount(a.h, 'goryeo', '고려');
let n = 0, maxRows = 0, maxFinalRows = 0, leaks = 0, earlyReveal = 0, seenAsk = 0;
for (;;) {
  const st = ha.state();
  if (st.ended) break;
  const vis = [...a.h.querySelectorAll('.pr-scene:not([hidden])')];
  ok(vis.length === 1, '장면 하나만 보임 ' + st.step);
  const rows = vis[0].querySelectorAll('.pr-row').length;
  maxRows = Math.max(maxRows, rows); if (st.page === 9) maxFinalRows = Math.max(maxFinalRows, rows);
  const qi = asks.findIndex(x => st.page === 9 && x.si === st.scene);
  if (qi >= 0 && st.row === 0) {
    const text = visibleText(a.h.querySelector('.pr-page'));
    if (st.phase === 'read' || st.phase === 'recall') {
      seenAsk++;
      if (KEYS[qi].some(k => text.includes(k))) leaks++;
      const li = vis[0].querySelector('.pr-row--ask');
      if (!li.querySelector('.pr-items').hidden || li.querySelector('.pr-ask-wait').hidden || li.querySelector('.pr-phase').textContent !== '떠올리기') earlyReveal++;
    }
    if (st.phase === 'reveal') ok(KEYS[qi].every(k => text.includes(k)) && vis[0].querySelector('.pr-phase').textContent === '정답 확인', '질문 ' + (qi + 1) + ' 생각할 시간 뒤 정답 자동 드러냄');
  }
  a.advance(st.clock.remaining);
  assert(++n < 6000);
}
ok(seenAsk === 12 && leaks === 0 && earlyReveal === 0, '질문 6개 × (읽기·떠올리기) 동안 정답 낱말이 화면 어디에도 없음 · “떠올려 보세요”만');
ok(maxRows <= 4 && maxFinalRows <= 3, '한 번에 보이는 줄: 전체 4줄 이하 · 최종 정리 3줄 이하');
const endVis = [...a.h.querySelectorAll('.pr-scene:not([hidden])')];
ok(a.now() === est && endVis.length === 1 && /정답 확인 · 한눈에/.test(endVis[0].textContent) && endVis[0].querySelectorAll('.pr-row').length === 3 && a.h.querySelectorAll('.pr-row:not([hidden])').length >= 3 && [...a.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length === 1, '끝: 계산한 시각에 멈추고 정답 확인 장면 하나(3줄)만 남음');
ok(a.btn(1).textContent === '다시 재생' && a.timers.size === 0 && a.writes() === 0 && a.fetches() === 0, '끝: 다시 재생 · 타이머 없음 · 저장소·서버 기록 없음');
a.btn(3).click();
ok([...a.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length === 1 && ha.state().ended, '끝난 뒤 빈칸/전체 보기 바꿔도 장면 하나');
a.btn(3).click();
a.btn(0).click();
ok(ha.state().index === 8 && ha.state().clock.active && ha.state().clock.paused && ha.state().scene === 0 && [...a.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length === 1 && a.btn(1).textContent === '재생', '끝난 뒤 이전 쪽: 그 쪽 첫 장면에서 멈춘 채(쪽 전체를 펼치지 않음)');
a.btn(2).click();
ok(ha.state().index === 9 && ha.state().clock.paused && [...a.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length === 1, '다음 쪽(최종 정리)도 첫 장면에서 멈춤');
a.btn(1).click(); a.advance(1);
ok(!ha.state().clock.paused && ha.state().index === 9, '재생을 누르면 그 자리에서 이어감');
a.w.HanqReviewPlayer.stop();
const r2 = a.w.HanqReviewPlayer.mount(a.h, 'goryeo', '고려');
for (let g = 0; !r2.state().ended; g++) { a.advance(r2.state().clock.remaining); assert(g < 6000); }
a.btn(1).click();
ok(r2.state().step === 0 && r2.state().clock.active && !r2.state().ended, '다시 재생은 처음부터');
a.w.HanqReviewPlayer.stop();

/* ---------- 5. 질문 중 멈춤 · 가린 탭 · 모드 바꾸기 ---------- */
const b = setup();
const hb = b.w.HanqReviewPlayer.mount(b.h, 'goryeo', '고려');
const toRecall = b2 => { for (let g = 0; !(hb.state().page === 9 && hb.state().phase === 'recall' && asks.some(x => x.si === hb.state().scene)); g++) { b2.advance(hb.state().clock.remaining); assert(g < 6000); } };
toRecall(b);
const q = asks.findIndex(x => x.si === hb.state().scene), at = hb.state().step, left = hb.state().clock.remaining;
b.advance(1000); b.btn(1).click(); b.advance(600000);
ok(hb.state().step === at && hb.state().clock.paused && !KEYS[q].some(k => visibleText(b.h.querySelector('.pr-page')).includes(k)), '떠올리기 중 멈추면 정답을 드러내지 않음(10분 지나도)');
b.btn(1).click(); b.advance(left - 1000 - 1);
ok(hb.state().step === at, '남은 생각할 시간부터 이어감');
b.advance(1);
ok(hb.state().phase === 'reveal' && KEYS[q].every(k => visibleText(b.h.querySelector('.pr-page')).includes(k)), '남은 시간이 지나면 자동으로 정답');
toRecall(b);
const at2 = hb.state().step;
b.setHidden(true); b.advance(300000);
ok(hb.state().step === at2 && hb.state().clock.paused, '가린 탭: 멈춤');
b.setHidden(false);
ok(!hb.state().clock.paused && hb.state().step === at2, '다시 보이면 같은 질문에서 이어감');
const sc = hb.state().scene;
b.btn(3).click();
ok(!hb.state().blank && hb.state().scene === sc && hb.state().phase === 'read' && [...b.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length === 1 && !b.h.querySelector('.pr-scene:not([hidden]) .pr-row--ask .pr-items').hidden, '전체 보기로 바꾸면 같은 질문 장면에서 정답과 함께(장면 하나)');
b.btn(3).click();
ok(hb.state().blank && hb.state().scene === sc && hb.state().phase === 'read' && b.h.querySelector('.pr-scene:not([hidden]) .pr-row--ask .pr-items').hidden && b.h.querySelector('.pr-tl').hidden, '빈칸으로 돌아오면 같은 질문을 다시 가림');
b.w.HanqReviewPlayer.stop();
ok(b.timers.size === 0 && b.writes() === 0 && b.fetches() === 0, '정리 · 기록 없음');

/* ---------- 6. 조선·메타데이터 없는 덱은 예전 그대로 ---------- */
ok(sha(JSON.stringify(J)) === JOSEON_DECK_SHA && J.finishScene === undefined && !J.cards.some(p => p.scenes.some(s => s.rows.some(r => r.kind === 'ask'))), '조선 생성 덱 바이트 그대로(finishScene·질문 줄 없음)');
ok(sha(JSON.stringify(player.periodSteps(J, true))) === JOSEON_STEPS_SHA.true && sha(JSON.stringify(player.periodSteps(J, false))) === JOSEON_STEPS_SHA.false && player.estimate(J) === 1189820, '조선 재생 걸음·시간(1,189,820ms) 예전 플레이어와 같음');
const c = setup();
const hc = c.w.HanqReviewPlayer.mount(c.h, 'joseon', '조선');
for (let g = 0; !hc.state().ended; g++) { c.advance(hc.state().clock.remaining); assert(g < 8000); }
ok(c.h.querySelectorAll('.pr-scene[hidden]').length === 0 && !c.h.querySelector('.pr-blank') && c.h.querySelector('.memory-count').textContent === '14 / 14 쪽', '조선 끝 동작은 예전 그대로(쪽 전체 펼침 · 정답 모두 보임)');
c.btn(0).click();
ok(!hc.state().clock.active && c.h.querySelectorAll('.pr-scene[hidden]').length === 0 && hc.state().index === 12, '조선: 끝난 뒤 이전 쪽도 예전처럼 펼쳐서 보여 줌');
c.w.HanqReviewPlayer.stop();
const plain = { format: 'period', title: '시험', cards: [{ id: 'x', kind: 'period', title: 'x', period: '', scenes: [{ title: 'a', rows: [{ kind: 'row', head: '가', hb: [], items: [{ t: '나다', b: [[0, 2]] }] }] }, { title: 'b', rows: [{ kind: 'row', head: '라', hb: [], items: [{ t: '마', b: [] }] }] }] }] };
const d = setup(w => { w.HANQ_MEMORY_REVIEWS.__plain = plain; });
const hd = d.w.HanqReviewPlayer.mount(d.h, '__plain', '시험');
for (let g = 0; !hd.state().ended; g++) { d.advance(hd.state().clock.remaining); assert(g < 100); }
ok(d.h.querySelectorAll('.pr-scene').length === 2 && d.h.querySelectorAll('.pr-scene[hidden]').length === 0 && !d.h.querySelector('.pr-ask-wait,.pr-phase'), '메타데이터 없는 덱: 끝나면 예전처럼 모든 장면 펼침 · 새 요소 없음');
d.w.HanqReviewPlayer.stop();

/* ---------- 7. 원래 자료 그대로 · 생성 파일 일치 ---------- */
for (const [f, h] of Object.entries(KEEP)) ok(sha(fs.readFileSync(path.join(ROOT, f))) === h, '바이트 그대로 ' + f);
ok(COV.summary.goryeo.coreTermAndMeaning === 68 && COV.summary.goryeo.factsMissing === 0 && COV.summary.goryeo.factsVisible + COV.summary.goryeo.factsMapped === 188 && COV.exam.goryeo.visible >= 277 && COV.exam.goryeo.questionsWithVisible === 86, '고려 핵심표 68 · 요점 188 · 기출 낱말 277 이상 · 86문항 유지');
const built = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_period_reviews.cjs'), '--check'], { encoding: 'utf8', timeout: 20000, env: Object.assign({}, process.env, { HANQ_TEXTBOOK_LAYOUT: '' }) });
ok(built.status === 0, '생성 파일 일치(build --check)');
[t, a, b, c, d].forEach(x => x.dom.window.close());
console.log('Goryeo learning flow ' + checks + ' PASS · 최종 정리 ' + fin.scenes.length + '장면 · 질문 6 · 기본 재생 ' + est + 'ms');
