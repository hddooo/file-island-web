/* 고대사 · 선사 시대와 고조선·여러 나라 시기별 요약 — 자료 사실·순서·유적, 원래 요점·교재 핵심표 적용 범위, 떠올리기 정답 숨김,
 * 계산한 재생 시간(늘리지 않음), 끝 장면 하나, 멈춤·가린 탭·모드·다시 재생·이동, 메뉴 범위 시간·쪽수,
 * 고대사 전체·삼국·남북국·고려·조선 그대로 (가짜 시계) */
'use strict';
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict'), crypto = require('crypto');
const { JSDOM } = require(process.env.JSDOM_PATH || process.env.HANQ_JSDOM_PATH || 'jsdom');
const ROOT = path.resolve(__dirname, '..');
let checks = 0;
const ok = (v, n) => { assert(v, n); checks++; };
const sha = s => crypto.createHash('sha256').update(s).digest('hex');
const norm = s => String(s || '').replace(/[^0-9A-Za-zㄱ-ㆎ가-힣一-鿿]/g, '').toLowerCase();
const MEDIA = ['textbook-notes', 'review-memory-cards', 'review-ancient-cards', 'review-goryeo-cards', 'review-joseon-cards', 'review-opening-cards', 'review-modern-cards', 'review-colonial-cards', 'period-reviews', 'review-player', 'review-menu'];
/* 기준판(137ff04)에서 잰 값: 고려·조선 생성 덱과 재생 걸음, 고대사 원래 카드 덱(선사·고조선·삼국·남북국)과 카드 재생 시간 */
const BEFORE = {
  goryeo: { deck: '189bb1052d3325fb05990aa12da668fd9b39573aef7c7f313472c93dd84093be', steps: 'b78e12116f8eb392bfa28c7ce82889ea4646f53db6b2d5679ce3f91506371a07', stepsFull: '16d3e2fe2d4a815fa71d7ed2f81a1698ae18c235f6d0e8198c72493de27f85b2', ms: 1049140 },
  joseon: { deck: '5cf815c505b03d0c29b2c1522a4d723aad723098a4ae0f103f8fcfcd6f9f70d0', steps: '85180fc0cec42cfbd7f657b5072646d5811ea7486df5a20b8d467780a8d497e4', stepsFull: '34d4d736e60487106fd672add4162386b2d72c9c2e0f066226a1efd8afca20b6', ms: 1189820 },
  cards: {
    prehistory: { deck: 'b07bce5a2fe9cfcabc279e243e0c63eef67428bd7a8867ece42de3921aa9e8cb', ms: 88376.66666666666, cards: 8 },
    gojoseon: { deck: 'b9495b668c2bc6222b14cb77c55b32bd2ee42b2b4cc89e0481920261c3de0ec3', ms: 110370, cards: 10 },
    samguk: { deck: '7e4f517c997d9e21c2565b3e71cbd078c97725d9ff2db862ba8edec50645f967', ms: 226076.66666666666, cards: 19 },
    nambuk: { deck: '871df0bbc0b48ada5b532fb6f651ced3a16a9d6a18c8395c5115b779ae20dd79', ms: 190030, cards: 17 }
  }
};

function setup() {
  const dom = new JSDOM('<main id="h"></main>', { runScripts: 'outside-only', url: 'http://127.0.0.1:8791', pretendToBeVisual: true }), w = dom.window;
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
const pageText = p => p.title + ' ' + p.period + ' ' + p.scenes.map(s => s.title + ' ' + s.rows.map(rowText).join(' ')).join(' ');

const t = setup();
const P = t.w.HANQ_PERIOD_REVIEWS, PH = P.decks.prehistory, GJ = P.decks.gojoseon, player = t.w.HanqReviewPlayer;
const COV = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.json'), 'utf8'));

/* ---------- 1. 그대로인 것: 고려·조선 덱·걸음, 고대사 원래 카드, 고대사 전체·삼국·남북국 경로 ---------- */
for (const g of ['goryeo', 'joseon']) ok(sha(JSON.stringify(P.decks[g])) === BEFORE[g].deck && sha(JSON.stringify(player.periodSteps(P.decks[g], true))) === BEFORE[g].steps && sha(JSON.stringify(player.periodSteps(P.decks[g], false))) === BEFORE[g].stepsFull && player.estimate(P.decks[g]) === BEFORE[g].ms, g + ' 생성 덱·재생 걸음·시간 그대로');
for (const [k, b] of Object.entries(BEFORE.cards)) { const d = t.w.HANQ_MEMORY_REVIEWS[k]; ok(sha(JSON.stringify(d)) === b.deck && player.estimate(d) === b.ms && d.cards.length === b.cards, '원래 ' + k + ' 카드 덱·카드 재생 시간 그대로'); }
ok(P.route('ancient', 'all') === null && P.forEra('nambuk').format === 'period' && P.forEra('samguk').format === 'period', '고대사 전체는 새 요약 없음(기존 카드) · 삼국·남북국은 새 요약');
ok(P.route('ancient', 'prehistory').cards.length === PH.cards.length && P.route('ancient', 'gojoseon').cards.length === GJ.cards.length && P.forEra('prehistory').format === 'period' && P.forEra('gojoseon').format === 'period', '선사·고조선 부분과 예전 경로(forEra)는 새 요약');
ok(PH.finishScene === 'last' && GJ.finishScene === 'last' && P.decks.joseon.finishScene === undefined, '끝 장면 하나 동작은 고려·선사·고조선 덱에만');

/* ---------- 2. 선사 시대: 흐름·도구·삶·유적·헷갈리는 짝 ---------- */
ok(PH.cards.length === 6 && PH.cards[0].kind === 'outline' && PH.cards[5].kind === 'recap' && JSON.stringify(PH.cards.slice(1, 5).map(p => p.at)) === JSON.stringify(['paleo', 'neo', 'bronze', 'iron']), '선사 6쪽: 흐름 → 구석기 → 신석기 → 청동기 → 철기 → 최종 정리');
ok(JSON.stringify(PH.timeline.map(x => x.name)) === JSON.stringify(['구석기', '신석기', '청동기', '철기']) && PH.timeline.every(x => x.weight === 1 && x.from === undefined), '시기 띠: 네 시대(연도를 지어내지 않음)');
const PT = PH.cards.map(pageText);
ok(/이동 → 정착 → 계급 → 철제 농기구/.test(PT[0]) && /뗀석기·이동 생활\(사냥·채집\) → 간석기·농경과 목축\(식량 생산\)·정착/.test(PT[0]) && /벼농사·사유재산·계급\(지배층\) → 철제 농기구/.test(PT[0]), '흐름지도: 도구와 삶(이동·채집 → 정착·생산 → 사유재산·계급 → 철제 농기구)을 함께');
ok(/주먹도끼 · 슴베찌르개 · 찍개: 돌을 깨서/.test(PT[1]) && /동굴/.test(PT[1]) && /막집/.test(PT[1]) && /돌을 갈아 만든 도구\(갈돌·갈판\)/.test(PT[2]) && /빗살무늬토기/.test(PT[2]) && /가락바퀴 · 뼈바늘/.test(PT[2]), '구석기 뗀석기(깨서)·막집 / 신석기 간석기(갈아서)·빗살무늬토기·가락바퀴');
ok(/반달 돌칼/.test(PT[3]) && /돌로 만듦/.test(PT[3]) && /비파형 동검 · 거친무늬 거울/.test(PT[3]) && /민무늬 토기\(미송리식 토기\)/.test(PT[3]) && /고인돌/.test(PT[3]) && /환호 · 목책/.test(PT[3]), '청동기: 반달 돌칼(돌 농기구)·비파형 동검·거친무늬 거울·민무늬(미송리식)·고인돌·환호');
ok(/호미 · 쇠스랑 · 따비와 괭이/.test(PT[4]) && /세형 동검 · 잔무늬 거울/.test(PT[4]) && /거푸집/.test(PT[4]) && /명도전 · 반량전 · 오수전/.test(PT[4]), '철기: 철제 농기구 · 세형 동검(거푸집) · 잔무늬 거울 · 중국 화폐');
ok(/여주 흔암리/.test(PT[3]) && /탄화미: 벼농사 단서/.test(PT[3]), '확보 기출 77회 1번 흔암리: 공식 자료의 청동기 탄화미 유적');
const sites = { 1: ['연천 전곡리', '공주 석장리', '청원 두루봉 동굴', '단양 금굴'], 2: ['서울 암사동', '제주 고산리', '부산 동삼동', '양양 오산리'], 3: ['부여 송국리', '울주 반구대 바위그림'] };
for (const [pi, list] of Object.entries(sites)) ok(list.every(x => PT[pi].includes(x)), '교재 9쪽 유적 모두 제 시대 쪽에: ' + list.join(', '));
const bangu = PH.cards[3].scenes.flatMap(s => s.rows).find(r => r.head === '울주 반구대 바위그림');
ok(bangu && /신석기~청동기/.test(rowText(bangu)) && /교재 표는 청동기 칸/.test(rowText(bangu)) && !PH.cards.some(p => p.scenes.some(s => s.rows.some(r => r.kind === 'ask' && /반구대/.test(rowText(r))))), '반구대: 신석기~청동기(공식 설명) · 교재 칸도 표시 · 청동기만의 질문으로 쓰지 않음');
const FT = PT[5];
ok(/구석기: 돌을 깨서 \/ 신석기: 돌을 갈아서/.test(FT) && /청동기에도 농기구는 돌\(반달 돌칼\) \/ 철기에 호미·쇠스랑 등 철제 농기구/.test(FT) && /둘 다 청동검 · 비파형=청동기\(거친무늬 거울\) \/ 세형=철기\(잔무늬 거울\)/.test(FT) && /신석기 빗살무늬 \/ 청동기 민무늬\(미송리식\)/.test(FT), '헷갈리는 짝: 뗀석기vs간석기 · 반달 돌칼vs철제 농기구 · 비파형vs세형(둘 다 청동) · 빗살무늬vs민무늬');
ok(!/오답|답이 되지/.test(PT.join(' ')) && !PH.cards.some(p => /<표|PDF|pdf:|tb:/.test(pageText(p))), '‘철기는 오답’ 식 안내·검수용 표시는 화면에 없음');

/* ---------- 3. 고조선과 여러 나라: 순서·법·나라별 비교(나란히) ---------- */
ok(GJ.cards.length === 5 && GJ.cards[0].kind === 'outline' && GJ.cards[4].kind === 'recap' && !GJ.timeline, '고조선 5쪽 · 시기 띠 없음(여러 나라는 같은 무렵)');
const GT = GJ.cards.map(pageText);
const order = ['단군왕검 건국', '진개 공격', '위만', '진번·임둔 복속', '한 무제 공격'];
ok(order.every((x, i) => i === 0 || GT[0].indexOf(x) > GT[0].indexOf(order[i - 1])) && /지역마다 나란히/.test(GT[0]), '흐름지도: 단군왕검 → 진개 → 위만 → 진번·임둔 → 한 무제(우거왕) · 여러 나라는 나란히');
const g2 = GJ.cards[1].scenes.map(s => s.rows.map(rowText).join(' ')).join(' ');
ok(/사람을 죽이면 사형 · 상처를 입히면 곡식으로 갚음 · 도둑질하면 노비\(용서받으려면 50만 전\)/.test(g2) && /생명·노동력·사유 재산 중시/.test(g2) && /상 · 대부 · 장군/.test(g2) && /중계 무역/.test(g2) && /왕검성/.test(g2), '고조선: 범금 8조 남은 세 조항 + 뜻 · 상·대부·장군 · 중계 무역 · 왕검성');
ok(g2.indexOf('진개') < g2.indexOf('진번 · 임둔') && g2.indexOf('진번 · 임둔') < g2.indexOf('한 무제'), '본문도 진개 → 위만 → 진번·임둔 → 한 무제 순서');
const nat = name => GJ.cards.slice(2, 4).flatMap(p => p.scenes).find(s => s.title.startsWith(name));
ok(/사출도/.test(nat('부여').rows.map(rowText).join(' ')) && /영고\(12월/.test(nat('부여').rows.map(rowText).join(' ')) && /1책 12법/.test(nat('부여').rows.map(rowText).join(' ')) && /형사취수제 · 우제점법/.test(nat('부여').rows.map(rowText).join(' ')), '부여: 사출도·영고(12월)·1책 12법·형사취수제·우제점법');
const gog = nat('초기 고구려').rows.map(rowText).join(' ');
ok(/제가회의/.test(gog) && /동맹\(10월/.test(gog) && /서옥제/.test(gog) && /상가·대로·패자/.test(gog) && /사자·조의·선인/.test(gog) && /계루부/.test(gog), '초기 고구려: 제가회의·동맹(10월)·서옥제·상가·대로·패자·사자·조의·선인');
const od = nat('옥저 · 동예').rows.map(rowText).join(' '), sh = nat('삼한').rows.map(rowText).join(' ');
ok(/읍군 · 삼로 왕 없이 다스린 군장 \(옥저·동예 공통\)/.test(od) && /옥저 소금·해산물 · 민며느리제/.test(od) && /골장제/.test(od) && /동예 단궁·과하마·반어피/.test(od) && /무천\(10월/.test(od) && /책화/.test(od), '옥저·동예: 왕 없는 읍군·삼로 · 옥저 소금·민며느리제·골장제 · 동예 단궁·과하마·반어피·무천·책화');
ok(/제정 분리/.test(sh) && /신지·읍차/.test(sh) && /천군/.test(sh) && /소도/.test(sh) && /벼농사/.test(sh) && /덩이쇠/.test(sh) && /낙랑/.test(sh) && /5월 · 농사를 마친 10월/.test(sh), '삼한: 신지·읍차 vs 천군·소도 = 제정 분리 · 벼농사 · 덩이쇠 → 낙랑 · 5월·10월');
ok(!/족외혼|왜와|왜에/.test(GT.join(' ')), '근거 없는 낱말(족외혼·변한과 왜)은 넣지 않음');

/* ---------- 4. 원래 요점·교재 핵심표: 실제 화면 글(전체 보기로 쪽을 넘기며) ---------- */
const words = s => String(s).split(/[\s·,/()=→+:~—–-]+/).map(norm).filter(x => Array.from(x).length >= 2).map(w => { const x = w.replace(/(으로|에게|에서|까지|부터|이다|하여|했다|였다|[을를이가은는의에로와과도만])$/, ''); return Array.from(x).length >= 2 ? x : w; });
const termsOf = s => String(s).replace(/(\d)·(\d)/g, '$1\u0001$2').split(/\s*(?:·|\/|,|\(|\)|=|→|\+|:)\s*/).map(x => x.replace(/\u0001/g, '·').trim()).filter(x => Array.from(x).length >= 2);
for (const [g, D, part] of [['prehistory', PH, 'prehistory'], ['gojoseon', GJ, 'gojoseon']]) {
  /* 전체 보기로 끝까지 자동 재생하며 걸음마다 실제로 보인 글을 쪽별로 모음 */
  const c = setup();
  c.w.HanqReviewMenu.mount(c.h, {}, 'ancient', part);
  c.btn(3).click();
  const pages = D.cards.map(() => '');
  for (let n = 0; ; n++) {
    const idx = Number(/^(\d+)/.exec(c.h.querySelector('.memory-count').textContent)[1]) - 1;
    pages[idx] += '|' + norm(visibleText(c.h.querySelector('.pr-page')));
    if (c.btn(1).textContent === '다시 재생') break;
    const before = c.now(); c.advance(500); assert(n < 20000 && c.now() > before);
  }
  ok(c.h.querySelector('.memory-count').textContent === D.cards.length + ' / ' + D.cards.length + ' 쪽', g + ' 전체 보기로 끝 쪽까지 자동 재생');
  c.w.HanqReviewMenu.stop(); c.dom.window.close();
  const all = pages.join('|');
  const facts = COV.facts.filter(f => f.group === g);
  let exact = 0, mapped = 0, excluded = 0;
  t.w.HANQ_MEMORY_REVIEWS[g].cards.forEach((c, ci) => c.points.forEach((pt, pi) => {
    const f = facts.find(x => x.id === g + '#' + ci + ':' + pi);
    ok(f && f.text === pt, g + ' 적용 범위 기록 ' + ci + ':' + pi);
    if (f.status === 'excluded') { excluded++; return; }
    if (all.includes(norm(pt))) { exact++; return; }
    ok(f.status === 'mapped' && f.shortened.every(x => x.text.split(' / ').every(part2 => all.includes(norm(part2)))) && Math.max(...f.shortened.map(x => x.overlap)) >= 0.5, g + ' 줄인 글이 화면에 보임 ' + ci + ':' + pi + ' ' + pt);
    mapped++;
  }));
  ok(exact + mapped + excluded === t.w.HANQ_MEMORY_REVIEWS[g].cards.reduce((a, c) => a + c.points.length, 0) && COV.summary[g].factsMissing === 0, g + ' 원래 요점 전부: 그대로 ' + exact + ' + 줄인 글 ' + mapped + ' + 제외 ' + excluded);
  let core = 0;
  t.w.HANQ_TEXTBOOK[g].core.forEach((grp, gi) => grp.rows.forEach(([term, desc], ri) => { core++; ok(pages.some(pt => termsOf(term).every(x => pt.includes(norm(x))) && (pt.includes(norm(desc)) || words(desc).filter(x => pt.includes(x)).length / words(desc).length >= 0.7)), g + ' 교재 핵심표 용어+뜻 ' + gi + ':' + ri + ' ' + term); }));
  ok(core === COV.summary[g].coreRows && COV.summary[g].coreTermAndMeaning === core, g + ' 교재 핵심표 ' + core + '행 모두');
}
ok(COV.summary.prehistory.factsExcluded === 1 && (x => x.status === 'excluded' && /5쪽/.test(x.reason))(COV.facts.find(f => f.group === 'prehistory' && f.id === 'prehistory#0:2')), '제외는 ‘오답을 가르는 단서’ 안내 한 줄뿐(이유·교재 5쪽 기록)');
ok(COV.exam.prehistory.questions === 10 && COV.exam.gojoseon.questions === 12 && COV.exam.prehistory.visible === 37 && COV.exam.gojoseon.visible === COV.exam.gojoseon.keywords, '기출 선사 10·고조선 12문항 mem 낱말 대조(글자만)');

/* ---------- 5. 재생 시간: 같은 도우미 · 늘리지 않음 · 메뉴 범위 표시 ---------- */
for (const D of [PH, GJ]) {
  const S = player.periodSteps(D, true), est = player.estimate(D);
  ok(est === S.reduce((a, x) => a + x.ms, 0) && D.pace.msPerChar === 90 && D.pace.recallMs === 3500 && est < 900000 && est === COV.summary[D.group].timing.defaultMs, D.group + ' 기본 재생 ' + est + 'ms(15분 하한으로 늘리지 않음)');
  ok(D.cards.every(p => p.scenes.every(s => s.rows.length >= 1 && s.rows.length <= 3)), D.group + ' 장면당 3줄 이하');
  ok(S.filter(x => x.phase === 'recall').every(x => x.ms === 3500), D.group + ' 떠올리기 3.5초');
}
const m = setup();
m.w.HanqReviewMenu.mount(m.h, {}, null, null);
ok(m.h.querySelectorAll('.toc .period')[0].querySelector('small').textContent === '핵심 복습 · 누구나 이용', '고대사 메뉴 카드(기본 고대사 전체)는 기존 카드 그대로');
m.w.HanqReviewMenu.mount(m.h, {}, 'ancient', null);
const opts = [...m.h.querySelectorAll('.hanq-rm__select option')].map(o => o.textContent);
const mins = d => Math.round(m.w.HanqReviewPlayer.estimate(d) / 60000);
ok(opts.length===0, '고대사 내부 범위 선택 제거');
ok(m.h.querySelector('.memory-count').textContent === '1 / 54' && !m.h.querySelector('.pr-page'), '고대사 전체는 기존 54장 카드');
for (const part of ['samguk', 'nambuk']) { m.w.HanqReviewMenu.mount(m.h, {}, 'ancient', part); ok(m.h.querySelector('.pr-page') && m.h.querySelector('.memory-count').textContent === '1 / ' + P.decks[part].cards.length + ' 쪽', part + '는 새 요약'); }
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const rf = /function reviewRouteFor\(id\)\{[^]*?return\{group:id,part:null\};\}/.exec(html);
const reviewRouteFor = new Function(rf[0] + ';return reviewRouteFor;')();
for (const [era, n] of [['prehistory', 6], ['gojoseon', 5]]) { const q = reviewRouteFor(era); m.w.HanqReviewMenu.mount(m.h, {}, q.group, q.part); ok(m.h.querySelector('.memory-count').textContent === '1 / ' + n + ' 쪽', 'CBT 약한 시대 ' + era + ' → 새 요약 ' + n + '쪽'); }
m.w.HanqReviewMenu.stop();
ok(m.timers.size === 0 && m.writes() === 0 && m.fetches() === 0, '메뉴 정리 · 기록 없음');

/* ---------- 6. 떠올리기: 질문 하나 · 정답이 화면 어디에도(시기 띠 포함) 없다가 3.5초 뒤 자동 공개 · 끝 장면 하나 ---------- */
const KEYS = {
  prehistory: [['구석기'], ['신석기', '빗살무늬'], ['반달 돌칼'], ['비파형', '세형'], ['청동기', '구석기']],
  gojoseon: [['진개의 공격 → 위만'], ['부여', '영고'], ['고구려', '서옥제'], ['민며느리제', '옥저'], ['책화', '동예'], ['소도', '삼한']]
};
for (const D of [PH, GJ]) {
  const fin = D.cards[D.cards.length - 1];
  const asks = fin.scenes.map((s, si) => ({ s, si })).filter(x => x.s.rows.some(r => r.kind === 'ask'));
  const keys = KEYS[D.group];
  ok(asks.length === keys.length && asks.every((x, i) => x.s.rows.length === 1 && x.s.title === '떠올리기 ' + (i + 1) + ' / ' + keys.length), D.group + ' 질문 ' + keys.length + '개 · 장면마다 하나');
  asks.forEach((x, i) => { const r = x.s.rows[0]; ok(keys[i].every(k => rowText({ head: '', items: r.items }).includes(k)) && keys[i].every(k => !r.head.includes(k) && !x.s.title.includes(k) && !fin.title.includes(k) && !fin.period.includes(k)), D.group + ' 질문 ' + (i + 1) + ': 정답 ' + keys[i].join('·') + ' · 질문·제목에 없음'); });
  const a = setup();
  const hd = a.w.HanqReviewPlayer.mount(a.h, D.group, D.title);
  let n = 0, leaks = 0, seen = 0, oneScene = true;
  for (;;) {
    const st = hd.state();
    if (st.ended) break;
    if ([...a.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length !== 1) oneScene = false;
    const qi = asks.findIndex(x => st.page === D.cards.length - 1 && x.si === st.scene);
    if (qi >= 0) {
      const text = visibleText(a.h.querySelector('.pr-page'));
      if (st.phase === 'scene') ok(!keys[qi].some(k => text.includes(k)) && a.h.querySelector('.pr-tl').hidden, D.group + ' 회상 장면 진입부터 정답과 시대 띠 숨김');
      if (st.phase === 'read' || st.phase === 'recall') { seen++; if (keys[qi].some(k => text.includes(k))) leaks++; if (D.timeline && !a.h.querySelector('.pr-tl').hidden) leaks++; }
      if (st.phase === 'reveal') ok(keys[qi].every(k => text.includes(k)), D.group + ' 질문 ' + (qi + 1) + ' 자동 공개');
    }
    a.advance(st.clock.remaining);
    assert(++n < 3000);
  }
  ok(oneScene && seen === keys.length * 2 && leaks === 0, D.group + ' 읽기·떠올리기 동안 정답(시기 띠 포함) 화면에 없음');
  const vis = [...a.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden);
  ok(a.now() === player.estimate(D) && vis.length === 1 && /정답 확인 · 한눈에/.test(vis[0].textContent) && vis[0].querySelectorAll('.pr-row').length <= 3 && a.btn(1).textContent === '다시 재생' && a.timers.size === 0, D.group + ' 계산한 시각에 끝 · 정답 확인 장면 하나만');
  a.btn(0).click();
  ok(hd.state().clock.paused && [...a.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length === 1 && hd.state().index === D.cards.length - 2, D.group + ' 끝난 뒤 이전 쪽: 첫 장면에서 멈춘 채(펼치지 않음)');
  a.w.HanqReviewPlayer.stop();
  /* 질문 중 멈춤·가린 탭·모드·다시 재생 */
  const b = setup();
  const hb = b.w.HanqReviewPlayer.mount(b.h, D.group, D.title);
  for (let g = 0; !(hb.state().phase === 'recall' && asks.some(x => x.si === hb.state().scene) && hb.state().page === D.cards.length - 1); g++) { b.advance(hb.state().clock.remaining); assert(g < 3000); }
  const qi = asks.findIndex(x => x.si === hb.state().scene), at = hb.state().step, left = hb.state().clock.remaining;
  b.btn(1).click(); b.advance(600000);
  ok(hb.state().step === at && !keys[qi].some(k => visibleText(b.h.querySelector('.pr-page')).includes(k)), D.group + ' 떠올리기 중 멈추면 정답 안 보임');
  b.btn(1).click(); b.advance(left - 1);
  ok(hb.state().step === at, D.group + ' 남은 생각 시간부터');
  b.advance(1);
  ok(hb.state().phase === 'reveal', D.group + ' 남은 시간 뒤 자동 공개');
  b.setHidden(true); const hs = hb.state().step; b.advance(300000);
  ok(hb.state().step === hs && hb.state().clock.paused, D.group + ' 가린 탭 멈춤'); b.setHidden(false);
  b.btn(3).click();
  ok(!hb.state().blank && [...b.h.querySelectorAll('.pr-scene')].filter(s => !s.hidden).length === 1, D.group + ' 전체 보기로 바꿔도 장면 하나');
  b.btn(3).click();
  for (let g = 0; !hb.state().ended; g++) { b.advance(hb.state().clock.remaining); assert(g < 3000); }
  b.btn(1).click();
  ok(hb.state().step === 0 && hb.state().clock.active, D.group + ' 다시 재생은 처음부터');
  b.w.HanqReviewPlayer.stop();
  ok(a.writes() === 0 && b.writes() === 0 && a.fetches() === 0 && b.fetches() === 0 && b.timers.size === 0, D.group + ' 저장소·서버 기록 없음 · 타이머 정리');
  [a, b].forEach(x => x.dom.window.close());
}

/* ---------- 7. 문서 · 생성 파일 일치 ---------- */
const doc = fs.readFileSync(path.join(ROOT, 'docs', 'period-review-coverage.md'), 'utf8');
ok(/## 고대사 · 선사 시대와 고조선·여러 나라 \(전달\)/.test(doc) && /사진: 없습니다/.test(doc) && /반구대/.test(doc) && /eh_r0040_0010/.test(doc) && /고대사 전체\(기존 카드 54장\)는 바뀌지 않아/.test(doc) && /기출 범위를 모두 다룬다는 뜻이 아닙니다/.test(doc) && doc.endsWith('\n') && !doc.endsWith('\n\n'), '문서: 경로·사진 없음·반구대 공식 근거·고대사 전체 한계·기출 한계 · 끝 빈 줄 없음');
const built = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_period_reviews.cjs'), '--check'], { encoding: 'utf8', timeout: 20000, env: Object.assign({}, process.env, { HANQ_TEXTBOOK_LAYOUT: '' }) });
ok(built.status === 0, '생성 파일 일치(build --check)');
[t, m].forEach(x => x.dom.window.close());
console.log('Ancient learning (선사·고조선) ' + checks + ' PASS · 선사 ' + PH.cards.length + '쪽 ' + player.estimate(PH) + 'ms · 고조선 ' + GJ.cards.length + '쪽 ' + player.estimate(GJ) + 'ms');
