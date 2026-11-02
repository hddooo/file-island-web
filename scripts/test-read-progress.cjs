#!/usr/bin/env node
/* 웹툰 읽음 표시(media/read-progress.js) 단위 검사 — 가짜 창·iframe 위치로 ‘바깥 화면에 실제로 보인 컷만’ 세는지 본다.
 *   node scripts/test-read-progress.cjs
 * 실제 웹툰 문서의 흐름·컷 수는 verify-hanq.cjs(jsdom)에서, 실제 화면(320/375/1280·늦게 뜨는 그림)은 조정자의 Chrome에서 본다. */
'use strict';
const path = require('path');
const P = require(path.join(__dirname, '..', 'media', 'learning-progress.js'));
const R = require(path.join(__dirname, '..', 'media', 'read-progress.js'));
let checks = 0, failures = 0;
function ok(c, m) { checks++; if (!c) { failures++; console.log('  ✗ ' + m); } }
function section(t) { console.log('\n■ ' + t); }
const J = JSON.stringify;

section('1. 흐름·컷 목록(manifest): 흐름 머리 뒤 컷이 그 흐름 · 절반(올림) 기준 · id 없는 컷도 늘 같은 키');
{
  const flows = [{ id: 'flow-1', name: '하나' }, { id: 'flow-2', name: '둘' }];
  const ent = [{ type: 'flow', id: 'flow-1' }, { type: 'scene', id: 'a', heading: 'A', art: 'a.webp' }, { type: 'scene', id: '', heading: '이름 없는 컷', art: 'b.webp' }, { type: 'scene', id: 'c', heading: 'C', art: 'c.webp' },
    { type: 'flow', id: 'flow-2' }, { type: 'scene', id: 'd', heading: 'D', art: '' }, { type: 'scene', id: 'a', heading: '겹친 id', art: 'e.webp' }];
  const m = R.buildManifest('samguk', flows, ent), m2 = R.buildManifest('samguk', flows, ent);
  ok(m.flows[0].total === 3 && m.flows[0].threshold === 2 && m.flows[1].total === 2 && m.flows[1].threshold === 1 && m.chapter.total === 5 && m.chapter.threshold === 3, '흐름 3·2컷(기준 2·1) · 장 5컷(기준 3)');
  ok(m.flows[0].scenes[1].key === m2.flows[0].scenes[1].key && /^x[0-9a-f]{8}$/.test(m.flows[0].scenes[1].key) && m.flows[1].scenes[1].key !== 'a', 'id 없는 컷은 흐름·순서·제목으로 같은 키 · 겹친 id는 따로');
  ok(m.v === m2.v && R.buildManifest('samguk', flows, ent.map(e => e.id === 'c' ? Object.assign({}, e, { heading: 'C2' }) : e)).v !== m.v, '같은 문서면 같은 버전 · 컷 내용이 바뀌면 버전이 바뀜');
  ok(R.threshold(7) === 4 && R.threshold(32) === 16 && R.threshold(1) === 1 && R.threshold(27) === 14, '기준 = ceil(n/2): 7→4 · 32→16 · 27→14');
}

section('2. 보이는 정도(visibleArea): 바깥 화면·iframe·가림 막대로 자른 뒤 의미 있게 보일 때만');
{
  const view = { top: 0, left: 0, bottom: 800, right: 375 }, frame = { top: -5000, left: 0, bottom: 7000, right: 375 };
  const at = (y, h) => ({ top: y, left: 0, bottom: y + h, right: 375 });
  ok(R.visibleArea(at(100, 300), frame, view).ok, '화면 안 그림 → 보임');
  ok(!R.visibleArea(at(900, 300), frame, view).ok && !R.visibleArea(at(-400, 300), frame, view).ok, '화면 아래·위 밖 → 안 보임(iframe 안에서는 다 보이는 위치라도)');
  ok(!R.visibleArea(at(700, 300), frame, view).ok && R.visibleArea(at(600, 300), frame, view).ok, '아래 끝에 1/3만 걸치면 안 보임 · 2/3면 보임');
  ok(R.visibleArea(at(-300, 1500), frame, view).ok, '화면보다 큰 그림: 화면 절반 이상을 채우면 보임');
  ok(!R.visibleArea(at(100, 300), frame, { top: 0, left: 0, bottom: 150, right: 375 }).ok, '아래 고정 막대가 대부분 가리면 안 보임');
  ok(!R.visibleArea(at(100, 300), { top: 0, left: 0, bottom: 150, right: 375 }, view).ok, 'iframe 칸 밖으로 잘린 부분은 안 보임');
}

section('3. 이어서 보인 시간(dwell): 0.7초 이상 끊기지 않고 · 한 컷은 한 번');
{
  const d = R.createDwell(700);
  ok(d.step(['a'], 0).length === 0 && d.step(['a'], 500).length === 0 && J(d.step(['a'], 700)) === '["a"]' && d.step(['a'], 2000).length === 0, '0.7초 뒤 한 번만');
  ok(d.step(['b'], 0).length === 0 && d.step([], 400).length === 0 && d.step(['b'], 600).length === 0 && d.step(['b'], 1200).length === 0 && J(d.step(['b'], 1300)) === '["b"]', '중간에 사라지면 처음부터 다시');
}

/* 가짜 바깥 창 + 펼친 iframe(장 전체 높이, 안쪽 스크롤 0) */
function world(opts) {
  opts = opts || {};
  const W = { scrollY: 0, H: 800, Wd: 375, vis: 'visible', images: [], nav: null };
  const listeners = {};
  const win = {
    get innerHeight() { return W.H; }, get innerWidth() { return W.Wd; },
    document: { get visibilityState() { return W.vis; }, addEventListener() {}, removeEventListener() {}, querySelectorAll() { return W.nav ? [W.nav] : []; } },
    getComputedStyle: el => el.style || { position: 'static', display: 'block', visibility: 'visible' },
    addEventListener(t, f) { listeners[t] = f; }, removeEventListener() {}, setInterval() { return 1; }, clearInterval() {}, requestAnimationFrame() { return 1; }, cancelAnimationFrame() {}, setTimeout() { return 1; },
    URL: URL, Image: function () { const im = { naturalWidth: 0, decode: () => Promise.resolve() }; W.images.push(im); return im; }
  };
  const cuts = opts.cuts || 12, gap = 500, artH = 300;
  const docH = cuts * gap;
  const frame = { isConnected: true, clientTop: 0, clientLeft: 0, get clientHeight() { return docH; }, clientWidth: 375, addEventListener() {}, removeEventListener() {}, getClientRects: () => (W.hidden ? [] : [1]),
    getBoundingClientRect: () => ({ top: 200 - W.scrollY, left: 0, bottom: 200 - W.scrollY + docH, right: 375, width: 375, height: docH }),
    contentDocument: { readyState: 'complete', querySelector: s => (s === '.scene' ? {} : null), defaultView: null } };
  const decodeAll = [];
  const ents = [], flowsAt = opts.flowsAt || { 0: 'flow-1', 7: 'flow-2' };
  for (let i = 0; i < cuts; i++) {
    if (flowsAt[i]) ents.push({ type: 'flow', id: flowsAt[i] });
    const rect = () => ({ top: i * gap, left: 0, bottom: i * gap + artH, right: 375, width: 375, height: artH }); // iframe 안 좌표
    let art;
    if (opts.bg && i === opts.bg) art = { kind: 'bg', src: 'islands-panels.png', abs: 'https://hanq.test/media/islands-panels.png', el: { getBoundingClientRect: rect } };
    else if (opts.svg && i === opts.svg) art ={ kind: 'svg-image', src: 'panels/late.png', el: { getBoundingClientRect: rect }, image: { ownerDocument: { baseURI: 'https://hanq.test/media/x-comic.html' } } };
    else { const img = { complete: true, naturalWidth: 100, getBoundingClientRect: rect, decode: () => new Promise(r => decodeAll.push(r)) }; art = { kind: 'img', src: 'p' + i + '.webp', el: img }; }
    ents.push({ type: 'scene', id: 'c' + i, heading: '컷 ' + i, art: art.src, el: { getBoundingClientRect: rect }, artInfo: art });
  }
  return { W, win, frame, ents, decodeAll, flows: Object.values(flowsAt).map(id => ({ id, name: id })) };
}
const flushDecode = async w => { w.decodeAll.splice(0).forEach(r => r()); await new Promise(r => setImmediate(r)); };
function attach(w, store, era, extra) {
  let clock = 0, active = true, last = null;
  const t = R.attachFrame(Object.assign({ win: w.win, frame: w.frame, era, flows: w.flows, store, active: () => active, onChange: s => { last = s; }, now: () => clock, extract: () => w.ents }, extra || {}));
  return { t, at: v => { clock = v; }, setActive: v => { active = v; }, last: () => last };
}

(async () => {
  section('4. 펼친 iframe(장 전체 높이): 들어오자마자 모든 컷을 읽음으로 두지 않음 · 바깥 화면에 보인 컷만');
  {
    const store = P.create({ storage: P.memoryStorage() }), w = world(), A = attach(w, store, 'samguk');
    A.at(0); A.t.tick(); await flushDecode(w); A.at(10); A.t.tick(); A.at(900); A.t.tick();
    const s = A.t.debug().summary;
    // 바깥 창 0–800, iframe 위가 200 → 컷0(200–500)·컷1(700–1000: 100만 보임 → 아님)
    ok(s.chapter.seen === 1 && s.flows[0].seen === 1 && J(Object.keys(R.loadSeen(store, 'samguk')).map(k => k.split('|')[0])) === '["c0"]', '들어온 화면: 실제로 보인 첫 컷 1개만(12컷 iframe 전체가 아님)');
    w.W.scrollY = 3000; A.at(1000); A.t.tick(); await flushDecode(w); A.at(1010); A.t.tick(); A.at(1800); A.t.tick();
    const s2 = A.t.debug().summary, seenKeys = Object.keys(R.loadSeen(store, 'samguk')).map(k => k.split('|')[0]).sort();
    ok(J(seenKeys) === J(['c0', 'c6']) && !s2.flows[0].read, '가운데로 바로 가기: 그 화면의 컷(6)만 · 지나친 앞 컷(1–5)은 읽음이 아님');
    w.W.scrollY = 3200; A.at(1850); A.t.tick(); A.at(1900); A.t.tick();
    ok(Object.keys(R.loadSeen(store, 'samguk')).length === 2, '0.7초가 안 되게 스친 컷은 세지 않음(그림이 풀리기 전도 아님)');
  }

  section('5. 흐름 읽음 = 그 흐름 컷 절반(올림) · 흐름을 읽어도 장 전체는 따로');
  {
    const store = P.create({ storage: P.memoryStorage() }), w = world({ cuts: 32, flowsAt: { 0: 'flow-1', 7: 'flow-2', 13: 'flow-3', 21: 'flow-4' } }), A = attach(w, store, 'samguk');
    w.W.H = 500; // 화면 높이 500: 한 번에 컷 하나만 보이게
    let t = 0; const look = async i => { w.W.scrollY = 200 + i * 500 - 100; t += 10; A.at(t); A.t.tick(); await flushDecode(w); t += 10; A.at(t); A.t.tick(); t += 800; A.at(t); A.t.tick(); };
    for (const i of [0, 1, 2]) await look(i);
    let s = A.t.debug().summary;
    ok(s.flows[0].total === 7 && s.flows[0].threshold === 4 && s.flows[0].seen === 3 && !s.flows[0].read, '흐름1 7컷 중 3컷(기준 4 − 1): 아직 읽음 아님');
    await look(3); s = A.t.debug().summary;
    ok(s.flows[0].seen === 4 && s.flows[0].read && !s.flows[1].read && s.chapter.total === 32 && s.chapter.threshold === 16 && !s.chapter.read, '4컷 → 흐름1만 읽음 · 장 32컷(기준 16)은 아직');
    await look(3); ok(A.t.debug().summary.flows[0].seen === 4 && store.progressViews('read-samguk-').length === 4, '같은 컷을 다시 봐도 늘지 않음(기록 하나)');
    const again = attach(w, store, 'samguk'); again.at(0); again.t.tick();
    ok(again.t.debug().summary.flows[0].read && R.summarize(R.loadManifest(store, 'samguk'), R.loadSeen(store, 'samguk')).flows[0].read, '다시 열어도(새로 고침) 흐름1 읽음 그대로 · 목차용 저장 manifest로도 같음');
    ok(!R.summarize(R.loadManifest(store, 'samguk'), R.loadSeen(store, 'nambuk')).flows[0].read && R.loadManifest(store, 'nambuk') === null, '다른 시대(nambuk)의 같은 flow-1로 번지지 않음');
  }

  section('6. 그림이 실제로 풀리기 전·숨은 화면·다른 화면으로 간 뒤에는 세지 않음');
  {
    const store = P.create({ storage: P.memoryStorage() }), w = world({ svg: 1 }), A = attach(w, store, 'colonial');
    w.W.scrollY = 600; // 컷1(svg 외부 그림)이 화면 가운데
    A.at(0); A.t.tick(); A.at(10); A.t.tick(); A.at(2000); A.t.tick();
    ok(w.W.images.length === 1 && w.W.images[0].src === 'https://hanq.test/media/panels/late.png' && !Object.keys(R.loadSeen(store, 'colonial')).some(k => k.startsWith('c1|')), 'svg의 외부 그림: 같은 주소를 따로 불러 풀리기 전에는 세지 않음(viewBox만으로는 아님)');
    w.W.images[0].naturalWidth = 10; w.W.images[0].onload(); await new Promise(r => setImmediate(r));
    A.at(2100); A.t.tick(); A.at(2900); A.t.tick();
    ok(Object.keys(R.loadSeen(store, 'colonial')).some(k => k.startsWith('c1|')), '그림이 풀린 뒤 0.7초 → 셈');
    const S2 = P.create({ storage: P.memoryStorage() }), w2 = world(), B = attach(w2, S2, 'modern');
    w2.W.vis = 'hidden'; B.at(0); B.t.tick(); await flushDecode(w2); B.at(10); B.t.tick(); B.at(5000); B.t.tick();
    ok(Object.keys(R.loadSeen(S2, 'modern')).length === 0, '탭이 숨은 동안은 세지 않음');
    w2.W.vis = 'visible'; w2.W.hidden = true; B.at(6000); B.t.tick(); B.at(9000); B.t.tick();
    ok(Object.keys(R.loadSeen(S2, 'modern')).length === 0, 'iframe이 화면에 없으면(display none) 세지 않음');
    w2.W.hidden = false; B.setActive(false); B.at(9100); B.t.tick(); B.at(9900); B.t.tick();
    ok(Object.keys(R.loadSeen(S2, 'modern')).length === 0 && B.t.debug().stopped, '다른 화면으로 가면 멈추고(타이머·리스너 정리) 세지 않음');
    const w3 = world(); w3.W.nav = { style: { position: 'fixed', display: 'block', visibility: 'visible' }, getBoundingClientRect: () => ({ top: 260, bottom: 800, height: 540 }) };
    const S3 = P.create({ storage: P.memoryStorage() }), C = attach(w3, S3, 'opening');
    C.at(0); C.t.tick(); await flushDecode(w3); C.at(10); C.t.tick(); C.at(900); C.t.tick();
    ok(Object.keys(R.loadSeen(S3, 'opening')).length === 0, '아래 고정 막대가 그림을 거의 가리면 세지 않음');
  }

  section('7. 내용이 바뀐 컷은 예전 ‘봤음’을 옮기지 않음 · 옛 기록은 그대로 · 저장이 막혀도 이 탭에서 동작');
  {
    const store = P.create({ storage: P.memoryStorage() }), w = world(), A = attach(w, store, 'goryeo');
    A.at(0); A.t.tick(); await flushDecode(w); A.at(10); A.t.tick(); A.at(900); A.t.tick();
    ok(R.summarize(R.loadManifest(store, 'goryeo'), R.loadSeen(store, 'goryeo')).chapter.seen === 1, '(준비) 컷0을 봄');
    w.ents.find(e => e.id === 'c0').heading = '바뀐 제목';
    const B = attach(w, store, 'goryeo'); B.at(0); B.t.tick();
    const s = B.t.debug().summary;
    ok(s.chapter.seen === 0 && store.progressViews('read-goryeo-').length === 1 && R.loadManifest(store, 'goryeo').v === s.v, '바뀐 컷(서명이 다름)은 아직 안 본 컷 · 예전 기록 1개는 지우지 않음 · 목록은 새 내용으로');
    const blocked = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() {}, key() { return null; }, get length() { return 0; } };
    const M = P.create({ storage: blocked }), w2 = world(), C = attach(w2, M, 'islands');
    C.at(0); C.t.tick(); await flushDecode(w2); C.at(10); C.t.tick(); C.at(900); C.t.tick();
    ok(C.t.debug().summary.chapter.seen === 1 && M.status().backend === 'memory' && M.status().notices.some(n => n.code === 'blocked'), '저장소가 막혀도 이 탭에서는 세고, 막혔다는 알림은 저장소가 그대로');
    ok(!('markRead' in C.t) && !('setSeen' in R), '읽음을 강제로 바꾸는 함수는 없음(읽기 전용 debug만)');
  }

  section('8. 저장 형식 지키기: 더 새 형식·깨진·겹친 기록은 세지도·읽지도·덮어쓰지도 않음(지우지 않음)');
  {
    const storage = P.memoryStorage(), s = P.create({ storage });
    const man = R.buildManifest('samguk', [{ id: 'flow-1' }, { id: 'flow-2' }], [{ type: 'flow', id: 'flow-1' }, { type: 'scene', id: 'a', heading: 'A', art: 'img|a.webp' }, { type: 'scene', id: 'b', heading: 'B', art: 'img|b.webp' }, { type: 'flow', id: 'flow-2' }, { type: 'scene', id: 'c', heading: 'C', art: 'img|c.webp' }]);
    const cut = man.flows[0].scenes[0], view = R.seenView('samguk', cut.key, cut.sig);
    s.updateProgress(view, () => ({ schema: 999, kind: 'read-cut', subject: 'history', era: 'samguk', key: cut.key, sig: cut.sig, flowId: 'flow-1', at: 1 }));
    const raw = storage.getItem(P.KEYS.progress + view);
    ok(Object.keys(R.loadSeen(s, 'samguk')).length === 0, '안쪽 schema 999 컷 기록은 세지 않음');
    R.recordSeen(s, 'samguk', cut, 5);
    ok(storage.getItem(P.KEYS.progress + view) === raw, '같은 자리의 더 새 형식 기록을 덮어쓰지 않음');
    s.updateProgress(R.MAN_PREFIX + 'samguk', () => Object.assign(JSON.parse(JSON.stringify(man)), { schema: 999, v: 'future' }));
    const fm = storage.getItem(P.KEYS.progress + R.MAN_PREFIX + 'samguk');
    ok(R.loadManifest(s, 'samguk') === null, '안쪽 schema 999 manifest는 읽지 않음');
    R.saveManifest(s, man);
    ok(storage.getItem(P.KEYS.progress + R.MAN_PREFIX + 'samguk') === fm, '더 새 형식 manifest를 덮어쓰지 않음');
    const s2 = P.create({ storage: P.memoryStorage() }), dup = JSON.parse(JSON.stringify(man));
    R.saveManifest(s2, man); ok(R.loadManifest(s2, 'samguk').chapter.total === 3, '(준비) 올바른 manifest 저장·읽기');
    for (const [name, fn] of [['흐름 안 같은 컷 키', m => { m.flows[0].scenes[1] = Object.assign({}, m.flows[0].scenes[0]); }], ['흐름 사이 같은 컷 키', m => { m.flows[1].scenes[0] = Object.assign({}, m.flows[0].scenes[0]); }],
      ['pre와 흐름이 같은 컷 키', m => { m.pre.push(Object.assign({}, m.flows[0].scenes[0])); }], ['pre에 빈 칸', m => { m.pre.push(null); }], ['같은 흐름 id 둘', m => { m.flows[1].id = 'flow-1'; }], ['키가 빔', m => { m.flows[0].scenes[0].key = ''; }]]) {
      const bad = JSON.parse(JSON.stringify(R.loadManifest(s2, 'samguk'))); fn(bad);
      const s3 = P.create({ storage: P.memoryStorage() }); s3.updateProgress(R.MAN_PREFIX + 'samguk', () => bad);
      const before = J(s3.loadProgress(R.MAN_PREFIX + 'samguk'));
      ok(R.loadManifest(s3, 'samguk') === null && (R.saveManifest(s3, man), J(s3.loadProgress(R.MAN_PREFIX + 'samguk')) === before), '깨진 manifest(' + name + '): 읽지 않고 덮어쓰지도 않음');
    }
    const changed = R.buildManifest('samguk', [{ id: 'flow-1' }, { id: 'flow-2' }], [{ type: 'flow', id: 'flow-1' }, { type: 'scene', id: 'a', heading: 'A', art: 'img|a2.webp' }, { type: 'scene', id: 'b', heading: 'B', art: 'img|b.webp' }, { type: 'flow', id: 'flow-2' }, { type: 'scene', id: 'c', heading: 'C', art: 'img|c.webp' }]);
    R.recordSeen(s2, 'samguk', man.flows[0].scenes[0], 7); R.saveManifest(s2, changed);
    ok(R.loadManifest(s2, 'samguk').v === changed.v && s2.progressViews('read-samguk-').length === 1 && R.summarize(R.loadManifest(s2, 'samguk'), R.loadSeen(s2, 'samguk')).chapter.seen === 0, '올바른 manifest는 실제 내용이 바뀌면 새로 · 예전 관찰 기록은 그대로(새 컷으로 옮기지 않음)');
  }

  section('9. CSS로 숨은 iframe · 숨었다 돌아온 시간 · 잠깐 실패한 그림 · 혼자 연 웹툰');
  {
    const store = P.create({ storage: P.memoryStorage() }), w = world();
    let cssOn = false; w.frame.checkVisibility = () => !cssOn; w.frame.ownerDocument = { defaultView: {} };
    const A = attach(w, store, 'samguk');
    cssOn = true; A.at(0); A.t.tick(); await flushDecode(w); A.at(10); A.t.tick(); A.at(2000); A.t.tick();
    ok(Object.keys(R.loadSeen(store, 'samguk')).length === 0, 'visibility:hidden 등 CSS로 숨은 iframe은 사각형이 남아도 세지 않음');
    cssOn = false; A.at(2100); A.t.tick(); await flushDecode(w); A.at(2110); A.t.tick(); A.at(2900); A.t.tick();
    ok(Object.keys(R.loadSeen(store, 'samguk')).length === 1, '다시 보이면 그때부터 0.7초');
    // 숨었다 돌아오면 곧바로 처음부터: 숨기 전 300ms + 숨은 동안은 넣지 않음
    const w2 = world(), S2 = P.create({ storage: P.memoryStorage() });
    let visHandler = null; w2.win.document.addEventListener = (t, f) => { if (t === 'visibilitychange') visHandler = f; };
    const B = attach(w2, S2, 'nambuk');
    B.at(0); B.t.tick(); await flushDecode(w2); B.at(10); B.t.tick(); B.at(310); B.t.tick();
    w2.W.vis = 'hidden'; visHandler(); w2.W.vis = 'visible'; visHandler();
    B.at(800); B.t.tick();
    ok(Object.keys(R.loadSeen(S2, 'nambuk')).length === 0, '숨었다 돌아오면 머문 시간을 처음부터(숨기 전 시간을 넣지 않음)');
    B.at(1600); B.t.tick();
    ok(Object.keys(R.loadSeen(S2, 'nambuk')).length === 1, '돌아온 뒤 0.7초 이어 보이면 셈');
    // svg 외부 그림이 한 번 실패해도 나중에 실제로 불러와지면 셈
    const w3 = world({ svg: 1 }), S3 = P.create({ storage: P.memoryStorage() }), C = attach(w3, S3, 'colonial');
    w3.W.scrollY = 600; C.at(0); C.t.tick(); w3.W.images[0].onerror(); C.at(100); C.t.tick();
    ok(w3.W.images.length === 1, '실패 직후에는 바로 다시 부르지 않음');
    C.at(5000); C.t.tick();
    ok(w3.W.images.length === 2, '잠시 뒤 다시 불러 봄(영구 거절 아님)');
    w3.W.images[1].naturalWidth = 5; w3.W.images[1].onload(); await new Promise(r => setImmediate(r));
    C.at(5100); C.t.tick(); C.at(5900); C.t.tick();
    ok(Object.keys(R.loadSeen(S3, 'colonial')).some(k => k.startsWith('c1|')), '다시 불러 실제로 풀린 뒤에는 셈');
    // 혼자 연 웹툰: 맨 위 창이 아니면 시작하지 않음 · 맨 위면 그 창 화면 기준
    const w4 = world(); w4.win.self = w4.win; w4.win.top = {};
    ok(R.attachStandalone({ win: w4.win, doc: w4.frame.contentDocument, era: 'modern', flows: w4.flows, store: P.create({ storage: P.memoryStorage() }), extract: () => w4.ents }) === null, '앱 안 iframe(맨 위 창 아님)에서는 혼자 연 웹툰 추적을 시작하지 않음(이중 추적·큰 iframe 화면 기준 없음)');
    w4.win.top = w4.win; const S4 = P.create({ storage: P.memoryStorage() });
    let t4 = 0; const T = R.attachStandalone({ win: w4.win, doc: w4.frame.contentDocument, era: 'modern', flows: w4.flows, store: S4, now: () => t4, extract: () => w4.ents });
    T.tick(); await flushDecode(w4); t4 = 10; T.tick(); t4 = 900; T.tick();
    const seen4 = Object.keys(R.loadSeen(S4, 'modern')).map(k => k.split('|')[0]).sort();
    // 혼자 연 창: 화면 0–800 · 컷 i는 i*500부터 300 → 컷0·컷1(500–800)
    ok(J(seen4) === J(['c0', 'c1']) && T.debug().mode === 'standalone' && R.loadManifest(S4, 'modern') && R.loadManifest(S4, 'modern').v === T.debug().manifest.v, '혼자 연 웹툰: 그 창 화면에 보인 컷만 · 같은 시대 manifest를 남겨 앱 목차가 같은 기록으로 표시');
  }

  section('10. CSS 배경 그림 컷(독도와 간도 .art.i-art): 그림판 주소·크기·자르기 값으로 서명 · 실제로 풀린 뒤에만');
  {
    // 실제 웹툰과 같은 꼴: 그림 틀에 img·svg가 없고, 스타일시트의 background-image + background-size, 인라인 --x/--y로 자름
    const mkScene = (o) => {
      const doc = { baseURI: o.base, defaultView: { getComputedStyle: () => ({ backgroundImage: o.bi, backgroundSize: o.size || '200% 400%', backgroundPosition: o.pos || '0px 0px' }) } };
      const wrap = { ownerDocument: doc, querySelector: () => null, getAttribute: a => (a === 'style' ? o.style : null) };
      return { querySelector: s => (s === R.ART_WRAP ? wrap : null), ownerDocument: doc };
    };
    const app = R.artOf(mkScene({ base: 'https://hanq.test/media/islands-comic.html#topic-dokdo', bi: 'url("https://hanq.test/media/islands-panels.png")', style: '--x: 100%; --y:33.333%', pos: '412px 120px' }));
    const narrow = R.artOf(mkScene({ base: 'http://127.0.0.1:8774/media/islands-comic.html', bi: 'url("http://127.0.0.1:8774/media/islands-panels.png")', style: '--y:33.333%;--x:100%', pos: '160px 47px' }));
    const raw = R.artOf(mkScene({ base: 'about:blank', bi: 'url(islands-panels.png)', style: '--x:100%;--y:33.333%' }));
    ok(app && app.kind === 'bg' && app.src === 'islands-panels.png' && app.abs === 'https://hanq.test/media/islands-panels.png' && /^bg\|islands-panels\.png\|200% 400%\|--x:100%;--y:33\.333%$/.test(app.desc), 'CSS 배경 그림: 종류 bg · 문서 기준 상대 주소 · 크기 · 자르기 값(--x·--y) 서명');
    ok(app.desc === narrow.desc && app.desc === raw.desc, '서명은 화면 폭(계산된 픽셀 위치)·주소 호스트·검사 환경(jsdom 날 값)과 관계없이 같음');
    const moved = R.artOf(mkScene({ base: 'https://hanq.test/media/islands-comic.html', bi: 'url("https://hanq.test/media/islands-panels.png")', style: '--x:0%;--y:33.333%' }));
    const resized = R.artOf(mkScene({ base: 'https://hanq.test/media/islands-comic.html', bi: 'url("https://hanq.test/media/islands-panels.png")', style: '--x:100%;--y:33.333%', size: '200% 300%' }));
    const other = R.artOf(mkScene({ base: 'https://hanq.test/media/islands-comic.html', bi: 'url("https://hanq.test/media/other.png")', style: '--x:100%;--y:33.333%' }));
    ok(moved.desc !== app.desc && resized.desc !== app.desc && other.desc !== app.desc, '자르기 위치·크기·그림판이 바뀌면 서명이 바뀜(예전 봤음을 옮기지 않음)');
    ok(R.artOf(mkScene({ base: 'https://hanq.test/x.html', bi: 'none', style: '--x:1%' })) === null, '배경 그림이 없는 틀은 그림 컷이 아님');
    // 늦게 뜨는 배경 그림판: 같은 주소를 따로 불러 풀리기 전에는 세지 않음 · 실패 뒤 다시
    const w = world({ bg: 1 }), S = P.create({ storage: P.memoryStorage() }), A = attach(w, S, 'islands');
    w.W.scrollY = 600; A.at(0); A.t.tick(); A.at(10); A.t.tick(); A.at(2000); A.t.tick();
    ok(w.W.images.length === 1 && w.W.images[0].src === 'https://hanq.test/media/islands-panels.png' && !Object.keys(R.loadSeen(S, 'islands')).some(k => k.startsWith('c1|')), '배경 그림판이 풀리기 전에는 세지 않음(그림 틀 사각형만으로는 아님)');
    w.W.images[0].onerror(); A.at(2100); A.t.tick(); ok(w.W.images.length === 1, '실패 직후에는 다시 부르지 않음');
    A.at(9000); A.t.tick(); ok(w.W.images.length === 2, '잠시 뒤 다시 불러 봄');
    w.W.images[1].naturalWidth = 8; w.W.images[1].onload(); await new Promise(r => setImmediate(r));
    A.at(9100); A.t.tick(); A.at(9900); A.t.tick();
    ok(Object.keys(R.loadSeen(S, 'islands')).some(k => k.startsWith('c1|')), '실제로 풀린 뒤 0.7초 → 셈');
  }

  console.log('\n검사 ' + checks + ' · 실패 ' + failures);
  process.exit(failures ? 1 : 0);
})().catch(e => { console.log('  ✗ 예외 ' + e.stack); process.exit(1); });
