#!/usr/bin/env node
/*
 * 전체 복습 · 시기별 요약(쪽 → 장면) 만들기
 *   node scripts/build_period_reviews.cjs          → media/period-reviews.js, docs/period-review-coverage.{json,md}
 *   node scripts/build_period_reviews.cjs --check  → 다시 만들어 비교만 함(다르면 종료 코드 1)
 *   HANQ_TEXTBOOK_LAYOUT=<pdftotext -layout 글>   → 고려 PDF 40~53쪽 대조(docs/period-review-goryeo-pdf.json)도 만들거나 비교
 *
 * 입력(저장소 안): media/textbook-notes.js, media/review-*-cards.js, media/review-book/data/unit0N.js, media/review-player.js(재생 시간 계산),
 *                 docs/exam-pool-map.json, docs/exam-reviews/round-70..79.json, scripts/period-review-plan.cjs
 * 원래 덱·교재·문항 파일은 읽기만 한다. 요점 문장은 그대로 옮기고(편집은 쪽·장면 배치뿐),
 * 같은 장면에 이미 보이는 카드만 겹침으로 접는다. 적용 범위 수치는 매번 원문에서 다시 센다.
 * media/period-reviews.js에는 ENABLED 묶음(지금은 고려·조선)만 넣는다. 나머지 네 묶음은 초안으로 적용 범위만 센다.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { PLAN, ANCIENT_PARTS, PDF_CITED_YEARS, TIMELINES, TIMELINE_SOURCE, ENABLED } = require('./period-review-plan.cjs');
const { GORYEO_COMPACT, BASELINE, GORYEO_OFFICIAL, FINAL_BEFORE } = require('./goryeo-compact.cjs');
const ANCIENT = require('./ancient-compact.cjs');
const BAEKJE = require('./baekje-compact.cjs');
const SAMGUK = require('./samguk-compact.cjs');
const NAMBUK = require('./nambuk-compact.cjs');
const { JOSEON_COMPACT, JOSEON_PDF_VIEWED, JOSEON_SOURCE_EXCEPTIONS, JOSEON_UNSUPPORTED, JOSEON_BASELINE } = require('./joseon-compact.cjs');
/* 압축 편집 표가 있는 묶음(전달 묶음): 줄마다 원래 요점 id를 적어 둔다 */
const COMPACT = { goryeo: GORYEO_COMPACT, joseon: JOSEON_COMPACT, prehistory: ANCIENT.PREHISTORY_COMPACT, gojoseon: ANCIENT.GOJOSEON_COMPACT, baekje: BAEKJE.BAEKJE_COMPACT, samguk: SAMGUK.SAMGUK_COMPACT, nambuk: NAMBUK.NAMBUK_COMPACT };

const ROOT = path.resolve(__dirname, '..');
const OUT_JS = path.join(ROOT, 'media', 'period-reviews.js');
const OUT_JSON = path.join(ROOT, 'docs', 'period-review-coverage.json');
const OUT_MD = path.join(ROOT, 'docs', 'period-review-coverage.md');
const OUT_PDF = path.join(ROOT, 'docs', 'period-review-goryeo-pdf.json');
const OUT_PDF_JOSEON = path.join(ROOT, 'docs', 'period-review-joseon-pdf.json');
const GROUPS = ['ancient', 'goryeo', 'joseon', 'opening', 'colonial', 'modern', 'prehistory', 'gojoseon', 'baekje', 'samguk', 'nambuk'];
const GROUP_LABEL = { ancient: '고대사', goryeo: '고려', joseon: '조선', opening: '개화기', colonial: '일제강점기', modern: '현대사', prehistory: '선사 시대', gojoseon: '고조선과 여러 나라', baekje: '백제 웅진·사비 왕 비교', samguk: '삼국 시대', nambuk: '남북국 시대' };
const MAX_SCENE_ROWS = 4; // 전달 묶음: 장면마다 한꺼번에 보이는 줄은 4줄 이하
const TARGET_MS = 900000, MAX_MS = 1200000;
const BASE_PACE = { msPerChar: 90, rowBase: 1200, recallMs: 3500, revealBase: 1200, revealPerChar: 120, sceneMs: 1500 };
const TRAP = /^(함정|주의)\s*[:：]/;

/* ---------- 원문 읽기 ---------- */
function loadSources() {
  const ctx = { console };
  ctx.window = ctx;
  vm.createContext(ctx);
  const files = ['textbook-notes', 'review-memory-cards', 'review-ancient-cards', 'review-goryeo-cards', 'review-joseon-cards',
    'review-opening-cards', 'review-modern-cards', 'review-colonial-cards', 'review-player'];
  for (let n = 1; n <= 7; n++) files.push('review-book/data/unit0' + n);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(ROOT, 'media', f + '.js'), 'utf8'), ctx, { filename: f + '.js' });
  const decks = Object.assign({}, ctx.HANQ_MEMORY_REVIEWS);
  decks.colonial = ctx.HANQ_COLONIAL_REVIEW;
  return { decks, textbook: ctx.HANQ_TEXTBOOK, units: ctx.HANQ_REVIEW_UNITS, player: ctx.HanqReviewPlayer };
}

const norm = s => String(s || '').replace(/\*\*/g, '').replace(/[^0-9A-Za-zㄱ-ㆎ가-힣一-鿿]/g, '').toLowerCase();
/* 용어 낱말: '·'·'/' 등으로 나누되 4·13, 6·25 같은 숫자 사이 '·'는 나누지 않음 */
const termsOf = s => String(s || '').replace(/(\d)·(\d)/g, '$1\u0001$2').split(/\s*(?:·|\/|,|\(|\)|=|→|\+|:)\s*/)
  .map(x => x.replace(/\u0001/g, '·').trim()).filter(x => Array.from(x).length >= 2);
const wordsOf = s => String(s || '').split(/[\s·,/()=→+:~—–-]+/).map(norm).filter(x => Array.from(x).length >= 2);
/* 낱말 줄기: 끝의 조사·어미 하나를 떼어 ‘빈민을’·‘빈민’을 같은 낱말로 본다(뜻·요점 대조용, 2글자 이상만) */
const stem = w => { const x = w.replace(/(으로|에게|에서|까지|부터|이다|하여|했다|였다|[을를이가은는의에로와과도만])$/, ''); return Array.from(x).length >= 2 ? x : w; };
const stemsOf = s => wordsOf(s).map(stem).filter(x => Array.from(x).length >= 2);

function tbRowId(tbSpec, ref, textbook) {
  const m = /^tb:(\d+):(\d+)$/.exec(ref);
  if (!m) return null;
  let g = Number(m[1]);
  const r = Number(m[2]);
  if (Array.isArray(tbSpec)) {
    for (const era of tbSpec) { const n = textbook[era].core.length; if (g < n) return era + ':' + g + ':' + r; g -= n; }
    return null;
  }
  return tbSpec + ':' + g + ':' + r;
}
function tbRow(textbook, id) {
  const [era, g, r] = id.split(':');
  const grp = textbook[era] && textbook[era].core[Number(g)];
  return grp && grp.rows[Number(r)] ? { group: grp.g, term: grp.rows[Number(r)][0], desc: grp.rows[Number(r)][1] } : null;
}

/* ---------- 기출 70~79회: 시대별 문항과 낱말 → 문항 id ---------- */
/* 고대사 안에서 따로 전달하는 부분 묶음(선사 · 고조선과 여러 나라 · 백제 왕 비교): 그 시대는 초안 ‘ancient’와 함께 이 묶음으로도 센다.
   백제 왕 비교는 삼국 시대의 일부라 기출은 BAEKJE_EXAM_SCOPE에 맞는 문항만, 교재 핵심표는 ‘백제 웅진 · 사비’ 묶음만 센다 */
const ERA_EXTRA_GROUP = { prehistory: ['prehistory'], gojoseon: ['gojoseon'], samguk: ['baekje', 'samguk'], nambuk: ['nambuk'] };
const EXAM_SCOPE = { baekje: BAEKJE.BAEKJE_EXAM_SCOPE };
const CORE_SCOPE = { baekje: g => g.g === BAEKJE.BAEKJE_CORE_GROUP };
const groupsOfEra = era => [ERA_GROUP[era]].concat(ERA_EXTRA_GROUP[era] || []);
const ERA_GROUP = { prehistory: 'ancient', gojoseon: 'ancient', samguk: 'ancient', nambuk: 'ancient', goryeo: 'goryeo', 'joseon-early': 'joseon', 'joseon-late': 'joseon', opening: 'opening', colonial: 'colonial', modern: 'modern' };
function loadExam() {
  const map = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'exam-pool-map.json'), 'utf8'));
  const items = {};
  for (let r = 70; r <= 79; r++) {
    const j = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'exam-reviews', 'round-' + r + '.json'), 'utf8'));
    for (const [no, it] of Object.entries(j.items)) items['exam-' + r + '-' + no] = it;
  }
  const byGroup = {};
  for (const [era, info] of Object.entries(map.eras)) {
    if (!ERA_GROUP[era]) continue;
    for (const g of groupsOfEra(era)) for (const q of info.primary || []) if (items[q] && (!EXAM_SCOPE[g] || EXAM_SCOPE[g].test([items[q].a].concat(items[q].mem || [], items[q].clue || []).join(' ')))) (byGroup[g] = byGroup[g] || []).push({ id: q, era, text: norm([items[q].a].concat(items[q].mem || [], items[q].clue || []).join(' ')), mem: items[q].mem || [] });
  }
  return byGroup;
}
const questionsFor = (qs, term) => { const n = norm(term); return n.length >= 2 ? qs.filter(q => q.text.includes(n)).map(q => q.id) : []; };

/* ---------- 빈칸: 한 줄에 서로 다른 낱말 최대 2개 · 문장 전체는 가리지 않음 · 기출에서 여러 번 나온 낱말을 먼저 ---------- */
function blanksFor(text, terms, used, skip) {
  const out = [];
  for (const term of terms) {
    if (used.size >= 2 && !used.has(term)) break;
    if (skip && skip.has(term)) continue;
    if (Array.from(text).length - Array.from(term).length < 2) continue;
    let at = text.indexOf(term), hit = false;
    while (at >= 0) {
      /* 더 긴 다른 낱말의 앞부분이면(최충 → 최충헌) 가리지 않음 · 조사는 허용 */
      const nx = text.charAt(at + term.length);
      const glued = /[가-힣]/.test(nx) && !/[의과와은는이가을를에로으도만]/.test(nx);
      if (!glued && !out.some(([s, l]) => at < s + l && s < at + term.length)) { out.push([at, term.length]); hit = true; }
      at = text.indexOf(term, at + term.length);
    }
    if (hit) used.add(term);
  }
  return out.sort((a, b) => a[0] - b[0]);
}

/* ---------- 묶음 하나 만들기 (쪽 → 장면 → 줄) ---------- */
function buildGroup(group, src, report, examQs) {
  const { decks, textbook } = src;
  const facts = report.facts;
  const refHits = report.refHits;
  const cfg = PLAN[group];
  const examRank = term => questionsFor(examQs, term).length;
  const rankTerms = terms => terms.map((t, i) => ({ t, i, n: examRank(t) })).sort((a, b) => b.n - a.n || a.i - b.i).map(x => x.t);

  function cardRows(deckId, tbSpec, spec, sceneText, merged, where) {
    const i = typeof spec === 'object' ? spec.i : spec;
    const card = decks[deckId].cards[i];
    if (!card) throw new Error('카드 없음: ' + deckId + '#' + i);
    const key = deckId + '#' + i;
    const points = card.points.filter((p, k) => !(typeof spec === 'object' && spec.points) || spec.points.includes(k));
    const refs = (card.refs || []).map(r => tbRowId(tbSpec, r, textbook)).filter(Boolean);
    const terms = [];
    refs.forEach(id => { const row = tbRow(textbook, id); if (row) termsOf(row.term).forEach(t => { if (!terms.includes(t)) terms.push(t); }); });
    refs.forEach(id => { (refHits[id] = refHits[id] || new Set()).add(where); });
    const textNow = norm(sceneText.join(' '));
    if (points.every(p => textNow.includes(norm(p)))) { merged.push(key); return { main: null, traps: [] }; }
    const detail = /^핵심 관계/.test(card.sub || '');
    const pts = points.filter(p => !TRAP.test(p));
    const traps = points.filter(p => TRAP.test(p));
    let head = card.topic, items = pts;
    if (detail && pts.length) { head = pts[0]; items = pts.slice(1); }
    const used = new Set();
    /* 쪽·장면 제목에 이미 보이는 낱말은 가리지 않음 */
    const ranked = rankTerms(terms).filter(t => !sceneText[0].includes(t) && !sceneText[1].includes(t));
    const anchor = new Set(termsOf(head).slice(0, 1));
    const hb = blanksFor(head, ranked, used, anchor);
    const shown = new Set(termsOf(head).filter(t => !used.has(t)));
    const main = pts.length ? { kind: 'row', head, hb, sub: detail || (cfg.hideSub || []).includes(i) ? '' : (card.sub || ''), items: items.map(t => ({ t, b: blanksFor(t, ranked, used, shown) })), src: [key], refs } : null;
    return { main, traps: traps.map(t => ({ t, src: key })) };
  }
  function tbcRow(era, i) {
    const c = textbook[era].compare[i];
    if (!c) throw new Error('교재 비교표 없음: ' + era + ':' + i);
    const used = new Set();
    const items = c.rows.map(r => { const t = r[0] + ' → ' + r[1]; return { t, b: blanksFor(t, rankTerms(termsOf(r[1])), used, new Set(termsOf(r[0]))) }; });
    if (c.tip) items.push({ t: '팁: ' + c.tip, b: [] });
    return { kind: 'cmp', head: c.title, hb: [], sub: '', items, src: ['tbc:' + era + ':' + i], refs: [] };
  }
  function tb15Rows(mode, tl) {
    const used = () => new Set();
    if (mode === 'full') return tl.map(p => { const u = used(); const it = ['세력: ' + p.power, p.events.join(' · ')]; return { kind: 'node', head: p.no + ' ' + p.name + ' · ' + p.years, hb: [], sub: '', items: it.map(t => ({ t, b: blanksFor(t, [p.power], u) })), src: ['pdf:41:표15:' + p.key], refs: [] }; });
    if (mode === 'invaders') {
      const groups = [];
      tl.forEach(p => { const g = groups.find(x => x.invader === p.invader); if (g) g.names.push(p.no + ' ' + p.name); else groups.push({ invader: p.invader, names: [p.no + ' ' + p.name] }); });
      return groups.map(g => { const t = g.invader + ' → ' + g.names.join(' · '); return { kind: 'node', head: '침입: ' + g.invader, hb: [], sub: '', items: [{ t, b: blanksFor(t, g.names.map(n => n.slice(2)), new Set()) }], src: ['pdf:41:표15:침략'], refs: [] }; });
    }
    return tl.map(p => { const t = '세력: ' + p.power + ' · 침략: ' + p.invader; return { kind: 'node', head: p.no + ' ' + p.name + ' · ' + p.years, hb: [], sub: '', items: [{ t, b: blanksFor(t, [p.power], new Set()) }], src: ['pdf:41:표15:' + p.key], refs: [] }; });
  }

  function makeScene(sc, deckId, tbSpec, pageId, si, pageTitle) {
    const where = pageId + '/' + si;
    const sceneText = [pageTitle, sc.title];
    const merged = [];
    const rows = [];
    const traps = [];
    const add = row => { if (!row) return; rows.push(row); sceneText.push(row.head, row.sub, row.items.map(x => x.t).join(' ')); };
    const list = k => (sc[k] || []).map(x => (typeof x === 'object' && x.deck ? x : { deck: deckId, tb: tbSpec, spec: x }));
    if (sc.tb15) tb15Rows(sc.tb15, TIMELINES[cfg.timeline]).forEach(add);
    (sc.notes || []).forEach(n => add({ kind: 'note', head: n.head, hb: [], sub: '', items: n.items.map(t => ({ t, b: [] })), src: [n.src], refs: [] }));
    for (const k of ['flow', 'core', 'cmp']) for (const c of list(k)) {
      const r = cardRows(c.deck, c.tb, c.spec !== undefined ? c.spec : c.i, sceneText, merged, where);
      if (r.main) r.main.kind = k === 'cmp' ? 'cmp' : k === 'flow' ? 'flow' : 'row';
      add(r.main);
      traps.push(...r.traps);
    }
    if (traps.length) add({ kind: 'cmp', head: '헷갈리는 점', hb: [], sub: '', items: traps.map(x => ({ t: x.t, b: [] })), src: traps.map(x => x.src).filter((s, i, a) => a.indexOf(s) === i), refs: [] });
    for (const t of sc.tbc || []) {
      const [era, i] = Array.isArray(t) ? t : [Array.isArray(tbSpec) ? tbSpec[0] : tbSpec, t];
      const row = tbcRow(era, i);
      const before = norm(sceneText.join(' '));
      if (row.items.every(x => before.includes(norm(x.t.replace(/^팁:\s*/, ''))))) { merged.push(row.src[0]); continue; }
      add(row);
    }
    return { title: sc.title, layout: sc.tb15 ? 'flow5' : 'rows', rows, merged, text: norm(sceneText.join(' ')) };
  }

  function makePage(p, deckId, tbSpec, extra) {
    const scenes = p.scenes || [{ title: p.title, flow: p.flow, core: p.core, cmp: p.cmp, tbc: p.tbc, notes: p.notes }];
    const page = Object.assign({ id: p.id, kind: p.kind, title: p.title, period: p.period }, extra || {});
    if (p.at) page.at = p.at;
    if (p.stage) page.stage = p.stage;
    if (p.scope) page.scope = p.scope;
    page.scenes = scenes.map((sc, si) => makeScene(sc, deckId, tbSpec, p.id, si, p.title));
    page.cite = p.cite || '';
    page.text = norm([p.title, p.period].join(' ')) + page.scenes.map(s => s.text).join('');
    return page;
  }

  const pages = [];
  const mapTargets = {}, sceneTitles = {};
  if (COMPACT[group]) {
    /* 압축 편집 표(scripts/goryeo-compact.cjs): 줄마다 원래 요점 id를 적어 둔다 → 아래 요점 대조에서 ‘mapped’로 남김 */
    const pid = x => (x.startsWith('nb') ? 'nambuk#' + x.slice(2) : cfg.deck + '#' + x);
    for (const p of COMPACT[group]) {
      const page = { id: p.id, kind: p.kind, title: p.title, period: p.period, at: p.at, cite: p.cite || '' };
      if (p.stage) page.stage = p.stage;
      page.scenes = p.scenes.map((sc, si) => {
        const where = p.id + '/' + si;
        const rows = sc.rows.map(r => {
          const refs = [];
          (r.src || []).forEach(k => { const [d, i] = k.split('#'); (decks[d].cards[Number(i)].refs || []).forEach(ref => { const id = tbRowId(d === 'nambuk' ? 'nambuk' : cfg.tb, ref, textbook); if (id && !refs.includes(id)) refs.push(id); }); });
          refs.forEach(id => { (refHits[id] = refHits[id] || new Set()).add(where); });
          const terms = [];
          refs.forEach(id => { const row = tbRow(textbook, id); if (row) termsOf(row.term).forEach(t => { if (!terms.includes(t)) terms.push(t); }); });
          (r.blank || []).forEach(t => { if (!terms.includes(t)) terms.push(t); });
          const used = new Set();
          /* 최종 정리의 흐름지도·핵심 비교(noBlank)와 떠올리기 질문(ask, 정답을 통째로 가림)은 낱말 빈칸을 두지 않는다 */
          const ranked = r.noBlank || r.kind === 'ask' ? [] : rankTerms(terms).filter(t => !p.title.includes(t) && !sc.title.includes(t));
          const anchor = new Set(termsOf(r.h).slice(0, 1));
          const hb = blanksFor(r.h, ranked, used, anchor);
          const shown = new Set(termsOf(r.h).filter(t => !used.has(t)));
          const row = { kind: r.kind || 'row', head: r.h, hb, sub: '', items: r.i.map(t => ({ t, b: blanksFor(t, ranked, used, shown) })), src: (r.src || []).concat(r.pdf ? [r.pdf] : []), refs };
          const text = r.h + ' ' + r.i.join(' ');
          sceneTitles[p.id + '/' + (si + 1)] = sc.title;
          (r.fh || []).forEach(x => (mapTargets[pid(x)] = mapTargets[pid(x)] || []).push({ scene: p.id + '/' + (si + 1), text }));
          r.f.forEach(list => list.forEach(x => (mapTargets[pid(x)] = mapTargets[pid(x)] || []).push({ scene: p.id + '/' + (si + 1), text })));
          return row;
        });
        const text = norm([p.title, sc.title].concat(rows.map(r => r.head + ' ' + r.items.map(x => x.t).join(' '))).join(' '));
        return { title: sc.title, layout: sc.layout || 'rows', rows, merged: [], text };
      });
      page.text = norm([p.title, p.period].join(' ')) + page.scenes.map(s => s.text).join('');
      pages.push(page);
    }
  } else if (group === 'ancient') {
    const a = PLAN.ancient;
    pages.push(makePage({ id: a.outline.id, kind: 'outline', scope: 'all', title: a.outline.title, period: a.outline.period,
      flow: ANCIENT_PARTS.map(x => ({ deck: x.deck, tb: x.tb, i: 0 })) }, null, null, { part: 'all' }));
    for (const x of ANCIENT_PARTS) for (const p of a.parts[x.part]) pages.push(makePage(p, x.deck, x.tb, { part: x.part }));
    pages.push(makePage({ id: a.recap.id, kind: 'recap', scope: 'all', title: a.recap.title, period: a.recap.period,
      flow: ANCIENT_PARTS.map(x => ({ deck: x.deck, tb: x.tb, i: decks[x.deck].cards.length - 1 })) }, null, null, { part: 'all' }));
  } else {
    for (const p of cfg.pages) {
      const pg = makePage(p, cfg.deck, cfg.tb);
      /* 조선 등 범위 필터는 원래 카드의 stage를 따른다(편집 표의 stage보다 원래 자료 우선) */
      if (group === 'joseon') {
        const st = new Set();
        pg.scenes.forEach(s => s.rows.forEach(r => r.src.forEach(k => { const m = /#(\d+)$/.exec(k); if (m) st.add(decks.joseon.cards[Number(m[1])].stage); })));
        pg.stage = st.size === 1 ? [...st][0] : 'cross';
      }
      pages.push(pg);
    }
  }

  const exclude = cfg && cfg.exclude || {};
  const decksOf = group === 'ancient' ? ANCIENT_PARTS.map(a => a.deck) : [cfg.deck];
  /* points: 원래 덱의 일부 요점만 책임지는 묶음(백제 왕 비교 → 삼국 카드 일부). 없으면 덱 전체 */
  const owns = (ci, pi) => !(cfg && cfg.points) || (cfg.points[ci] || []).includes(pi);
  for (const d of decksOf) decks[d].cards.forEach((c, ci) => c.points.forEach((pt, pi) => {
    if (!owns(ci, pi)) return;
    const id = d + '#' + ci + ':' + pi;
    const n = norm(pt);
    const on = [];
    pages.forEach(pg => pg.scenes.forEach((s, si) => { if (s.text.includes(n)) on.push(pg.id + '/' + (si + 1)); }));
    /* 원래 글이 그대로 보이지 않고 압축 표가 이 요점을 적어 둔 줄이 있으면 mapped: 줄인 글과 원래 글의 낱말(줄기) 겹침 비율을 함께 남김 */
    /* 겹침은 장면 단위로 잼: 같은 장면에서 이 요점을 적어 둔 줄들 + 장면 제목(순서·구분 요점은 여러 줄에 나뉘어 담김) */
    let targets;
    if (!on.length && mapTargets[id]) {
      const byScene = {};
      mapTargets[id].forEach(t => { (byScene[t.scene] = byScene[t.scene] || []).push(t.text); });
      targets = Object.entries(byScene).map(([scene, texts]) => ({ scene, text: texts.join(' / '), overlap: overlap(pt, (sceneTitles[scene] || '') + ' ' + texts.join(' ')) }));
    }
    const status = exclude[id] ? 'excluded' : on.length ? 'visible' : targets ? 'mapped' : 'missing';
    facts.push({ group, id, text: pt, scenes: on.length ? on : targets ? targets.map(t => t.scene) : [], status, reason: exclude[id] || undefined, shortened: targets });
  }));
  if (group === 'goryeo') report.nambukMapped = Object.keys(mapTargets).filter(k => k.startsWith('nambuk#')).map(k => ({ id: k, text: decks.nambuk.cards[Number(k.split('#')[1].split(':')[0])].points[Number(k.split(':')[1])], targets: mapTargets[k] }));
  return pages;
}

/* 원래 요점 낱말(줄기) 가운데 줄인 줄 글에 남은 비율 */
function overlap(original, shortened) {
  const w = stemsOf(original), t = norm(shortened);
  return w.length ? Math.round(w.filter(x => t.includes(x)).length / w.length * 100) / 100 : 1;
}

/* ---------- 교재 핵심표 행: 용어와 뜻이 같은 장면에 보이는가 ---------- */
function meaningVisible(desc, text) {
  if (text.includes(norm(desc))) return true;
  const w = stemsOf(desc);
  return w.length > 0 && w.filter(x => text.includes(x)).length / w.length >= 0.7;
}
function tbCoverage(textbook, groupPages, refHits) {
  const rows = [];
  for (const era of Object.keys(ERA_GROUP)) for (const grp of groupsOfEra(era)) textbook[era].core.forEach((g, gi) => (!CORE_SCOPE[grp] || CORE_SCOPE[grp](g)) && g.rows.forEach((r, ri) => {
    const id = era + ':' + gi + ':' + ri;
    const scenes = {};
    groupPages[grp].forEach(pg => pg.scenes.forEach((s, si) => { scenes[pg.id + '/' + si] = s; }));
    const where = Array.from(refHits[id] || []).filter(w => scenes[w]);
    const termOn = where.filter(w => scenes[w] && termsOf(r[0]).every(t => scenes[w].text.includes(norm(t))));
    const bothOn = termOn.filter(w => meaningVisible(r[1], scenes[w].text));
    rows.push({ id, group: grp, term: r[0], meaning: r[1], scenes: where.map(w => w.replace(/\/(\d+)$/, (m, k) => '/' + (Number(k) + 1))),
      status: !where.length ? 'missing' : bothOn.length ? 'term+meaning-visible' : termOn.length ? 'term-visible-meaning-manual' : 'ref-only-manual' });
  }));
  return rows;
}

/* ---------- 기출 대조(글자만) ---------- */
function examCrosswalk(groupPages, exam) {
  const out = {};
  for (const g of GROUPS) {
    const qs = exam[g] || [];
    const allText = groupPages[g].map(p => p.text).join('|');
    const row = out[g] = { questions: qs.length, keywords: 0, visible: 0, questionsWithVisible: 0, missing: [], repeated: [] };
    const tally = {};
    for (const q of qs) {
      let any = false;
      for (const k of q.mem) {
        const n = norm(k);
        if (Array.from(n).length < 2) continue;
        row.keywords++;
        (tally[n] = tally[n] || { k: String(k).replace(/\*\*/g, ''), q: [] }).q.push(q.id);
        if (allText.includes(n)) { row.visible++; any = true; } else row.missing.push(q.id + ' ' + String(k).replace(/\*\*/g, ''));
      }
      if (any) row.questionsWithVisible++;
    }
    row.repeated = Object.entries(tally).filter(([, v]) => new Set(v.q).size >= 2)
      .map(([n, v]) => ({ k: v.k, questions: [...new Set(v.q)], visible: allText.includes(n) }))
      .sort((a, b) => b.questions.length - a.questions.length || a.k.localeCompare(b.k, 'ko'));
  }
  return out;
}

/* ---------- 시기 구분 연도는 원래 덱·교재 노트 또는 직접 본 PDF 표에 있는 것만 ---------- */
function yearGuard(src, groupPages) {
  const corpus = norm(JSON.stringify(src.decks) + JSON.stringify(src.textbook));
  const bad = [];
  for (const g of GROUPS) for (const p of groupPages[g]) {
    const text = p.title + ' ' + p.period + ' ' + p.scenes.map(s => s.title).join(' ');
    for (const y of text.match(/\b(1[0-9]{3}|20[0-9]{2}|[0-9]{3})\b|[0-9]+세기/g) || []) if (!corpus.includes(norm(y)) && !PDF_CITED_YEARS[y]) bad.push(p.id + ' ' + y);
  }
  /* 전달 묶음의 줄 글 연도: 원래 덱·교재 노트, 직접 본 PDF 표, 또는 확인된 공식 자료(GORYEO_OFFICIAL)에 있는 것만 */
  const official = [GORYEO_OFFICIAL].concat(Object.values(SN_OFFICIAL)).flatMap(m => Object.values(m).map(o => o.facts)).join(' ') + ' ' + Object.keys(SN_PDF_NUMBERS).join(' ');
  for (const g of ENABLED) for (const p of groupPages[g]) for (const sc of p.scenes) for (const r of sc.rows) {
    const text = r.head + ' ' + r.items.map(x => x.t).join(' ');
    for (const y of text.match(/(?<![0-9])(1[0-9]{3}|9[0-9]{2})(?![0-9])/g) || []) if (!corpus.includes(norm(y)) && !PDF_CITED_YEARS[y] && !official.includes(y)) bad.push(p.id + ' 줄 ' + y);
  }
  /* 삼국·남북국: 교재 PDF에 연도가 없으므로 줄·시기 띠의 세 자리 숫자(500~999)까지 원래 덱·교재 노트·확인한 공식 자료·PDF 숫자(SN_PDF_NUMBERS)에 있는 것만 */
  for (const g of SN_GROUPS.filter(x => ENABLED.includes(x))) {
    const texts = groupPages[g].flatMap(p => p.scenes.flatMap(sc => sc.rows.map(r => r.head + ' ' + r.items.map(x => x.t).join(' ')))).concat((TIMELINES[PLAN[g].timeline] || []).map(n => n.name + ' ' + n.years));
    for (const t of texts) for (const y of t.match(/(?<![0-9])([5-9][0-9]{2}|1[0-9]{3})(?![0-9])/g) || []) if (!corpus.includes(norm(y)) && !official.includes(y)) bad.push(g + ' 줄 ' + y);
  }
  if (bad.length) throw new Error('원문에 없는 연도: ' + bad.join(', '));
}

/* ---------- 삼국·남북국: 교재 PDF 사실 목록(show 낱말)이 실제 장면 글에 모두 있는가 ---------- */
const SN_GROUPS = ['samguk', 'nambuk'];
const SN_SOURCE = { samguk: SAMGUK.SAMGUK_SOURCE, nambuk: NAMBUK.NAMBUK_SOURCE };
const SN_OFFICIAL = { samguk: SAMGUK.SAMGUK_OFFICIAL, nambuk: NAMBUK.NAMBUK_OFFICIAL };
const SN_PDF_NUMBERS = { 1700: 'PDF 18쪽 <표 5> 광개토대왕릉비 “4면에 새겨진 1700여개 문자”' };
function sourceInventory(groupPages) {
  const out = {};
  for (const g of SN_GROUPS.filter(x => ENABLED.includes(x))) {
    const text = groupPages[g].map(p => p.text).join('|');
    const rows = SN_SOURCE[g].map(x => x.excluded ? { pdf: x.pdf, item: x.item, status: 'excluded', reason: x.excluded } : { pdf: x.pdf, item: x.item, show: x.show, status: x.show.every(w => text.includes(norm(w))) ? 'visible' : 'missing', missing: x.show.filter(w => !text.includes(norm(w))) });
    const miss = rows.filter(r => r.status === 'missing');
    if (miss.length) throw new Error(g + ' 교재 사실 목록 빠짐: ' + miss.map(r => 'PDF ' + r.pdf + ' ' + r.item + ' [' + r.missing.join(', ') + ']').join(' | '));
    out[g] = { items: rows.length, visible: rows.filter(r => r.status === 'visible').length, excluded: rows.filter(r => r.status === 'excluded').length, words: rows.reduce((a, r) => a + (r.show ? r.show.length : 0), 0), rows };
  }
  return out;
}

/* ---------- 교재 PDF 쪽 대조(로컬 PDF 글이 있을 때만): 고려 40~53쪽 · 조선 57~79쪽 ---------- */
function pdfCrosscheck(groupPagesOf, from, to, skip) {
  const layout = process.env.HANQ_TEXTBOOK_LAYOUT;
  if (!layout || !fs.existsSync(layout)) return null;
  const pages = fs.readFileSync(layout, 'utf8').split('\f');
  if (from === 40) for (const y of Object.keys(PDF_CITED_YEARS).filter(y => /PDF 41쪽/.test(PDF_CITED_YEARS[y]))) if (!pages[40].includes(y + '년')) throw new Error('PDF 41쪽 글에 없는 연도: ' + y);
  const text = groupPagesOf.map(p => p.text).join('|');
  const out = { source: 'pdftotext -layout 글(벼락치기_한능검_요약서.pdf, SHA256 35d850c6…0442) · 글자만 대조, 그림·지도·도표 모양은 보지 않음', pages: [] };
  for (let n = from; n <= to; n++) {
    if ((skip || []).includes(n)) continue;
    const lines = pages[n - 1].split('\n').map(l => l.replace(/[\uE000-\uF8FF\u{F0000}-\u{FFFFD}]/gu, ' ').replace(/\s+/g, ' ').trim()).filter(l => /[가-힣]{2}/.test(l));
    const bullets = lines.filter(l => !/^Ⅲ 고려 시대$|^Ⅳ 조선 시대$|^<표|^구분 내용$|공부돼지|^\d+$/.test(l));
    const res = bullets.map(l => { const w = wordsOf(l).filter(x => !/^(설치|실시|시행|하였다|있었다|발행|운영|조직)$/.test(x)); const hit = w.filter(x => text.includes(x)); return { line: l, words: w.length, visible: hit.length, ratio: w.length ? Math.round(hit.length / w.length * 100) / 100 : 1 }; });
    out.pages.push({ pdfPage: n, lines: res.length, mostlyVisible: res.filter(r => r.ratio >= 0.6).length, lowOverlap: res.filter(r => r.ratio < 0.6).map(r => r.line) });
  }
  return out;
}

/* ---------- 재생 시간: media/review-player.js의 periodSteps 그대로 ---------- */
function calibrate(player, deck, noFloor) {
  const total = pace => { deck.pace = pace; return player.estimate(deck); };
  let pace = Object.assign({}, BASE_PACE);
  let ms = total(pace);
  if (ms > MAX_MS) throw new Error(deck.group + ' 기본 재생 ' + ms + 'ms > ' + MAX_MS + 'ms (사실을 줄이거나 빨리 넘기지 말고 편집 표를 다시 볼 것)');
  while (!noFloor && ms < TARGET_MS) { pace = Object.assign({}, pace, { msPerChar: pace.msPerChar + 1 }); ms = total(pace); }
  if (ms > MAX_MS) throw new Error('보정 뒤 ' + ms + 'ms');
  deck.pace = pace;
  return ms;
}

/* ---------- 런타임 도우미(생성 파일에 함께 들어감) ---------- */
function installRuntime(root) {
  var P = root.HANQ_PERIOD_REVIEWS;
  if (!P || !P.decks) return;
  function copy(group, list) {
    var d = P.decks[group], out = {}, k;
    for (k in d) if (Object.prototype.hasOwnProperty.call(d, k)) out[k] = d[k];
    out.format = 'period';
    out.cards = list.slice();
    return out;
  }
  P.route = function (group, part) {
    /* 고대사 각 부분은 활성화된 시기별 덱을 사용하며 고대사 전체만 기존 카드 그대로(null) */
    if (group === 'ancient') return part && part !== 'all' && Object.prototype.hasOwnProperty.call(P.decks, part) ? copy(part, P.decks[part].cards) : null;
    var d = Object.prototype.hasOwnProperty.call(P.decks, group) ? P.decks[group] : null;
    if (!d) return null;
    var list = d.cards, out = [], i, c, stage;
    if (group === 'ancient' && part && part !== 'all') {
      for (i = 0; i < list.length; i++) { c = list[i]; if (c.part === part && c.scope !== 'all') out.push(c); }
    } else if (group === 'ancient') {
      for (i = 0; i < list.length; i++) { c = list[i]; if (c.scope !== 'part') out.push(c); }
    } else if (group === 'joseon' && (part === 'joseon-early' || part === 'joseon-late')) {
      stage = part === 'joseon-early' ? 'early' : 'late';
      for (i = 0; i < list.length; i++) { c = list[i]; if (c.stage === stage || c.stage === 'cross') out.push(c); }
    } else if (group === 'opening' && part === 'islands') {
      return null;
    } else out = list;
    return out.length ? copy(group, out) : null;
  };
  var ERA = { prehistory: ['ancient', 'prehistory'], gojoseon: ['ancient', 'gojoseon'], samguk: ['ancient', 'samguk'], nambuk: ['ancient', 'nambuk'],
    goryeo: ['goryeo', null], joseon: ['joseon', 'all'], 'joseon-early': ['joseon', 'joseon-early'], 'joseon-late': ['joseon', 'joseon-late'],
    opening: ['opening', 'opening'], colonial: ['colonial', null], modern: ['modern', null] };
  P.forEra = function (era) { var r = Object.prototype.hasOwnProperty.call(ERA, era) ? ERA[era] : null; return r ? P.route(r[0], r[1]) : null; };
}

/* ---------- 출력 ---------- */
const publicPage = p => {
  const o = { id: p.id, kind: p.kind, title: p.title, period: p.period };
  for (const k of ['at', 'part', 'stage', 'scope']) if (p[k] !== undefined) o[k] = p[k];
  o.scenes = p.scenes.map(s => ({ title: s.title, layout: s.layout, rows: s.rows.map(r => ({ kind: r.kind, head: r.head, hb: r.hb, sub: r.sub, items: r.items })) }));
  return o;
};

function build() {
  const src = loadSources();
  const exam = loadExam();
  const report = { facts: [], refHits: {} };
  const groupPages = {};
  for (const g of GROUPS) groupPages[g] = buildGroup(g, src, report, exam[g] || []);
  yearGuard(src, groupPages);
  const inventory = sourceInventory(groupPages);
  for (const g of ENABLED) for (const p of groupPages[g]) p.scenes.forEach((s, si) => { if (s.rows.length > MAX_SCENE_ROWS) throw new Error(p.id + ' 장면 ' + (si + 1) + ' 줄 ' + s.rows.length + ' > ' + MAX_SCENE_ROWS); });
  const tb = tbCoverage(src.textbook, groupPages, report.refHits);
  const crosswalk = examCrosswalk(groupPages, exam);
  const pdf = pdfCrosscheck(groupPages.goryeo, 40, 53);
  const pdfJoseon = pdfCrosscheck(groupPages.joseon, 57, 79);
  /* 비교 기준: 기존 조선 복습 카드 176장 글에 보이던 기출 mem 낱말 수(같은 글자 대조) */
  { const raw = norm(src.decks.joseon.cards.map(c => [c.era, c.topic, c.sub].concat(c.points).join(' ')).join('|'));
    crosswalk.joseon.cardDeckVisible = (exam.joseon || []).reduce((a, q) => a + q.mem.filter(k => Array.from(norm(k)).length >= 2 && raw.includes(norm(k))).length, 0); }

  const decksOut = {};
  const timing = {};
  for (const g of ENABLED) {
    const sources = ['scripts/period-review-plan.cjs (편집 표)', 'media/textbook-notes.js (HANQ_TEXTBOOK core·compare)'].concat(src.decks[PLAN[g].deck].sources || []);
    const deck = { format: 'period', group: g, era: g, title: PLAN[g].title, sources, cards: groupPages[g].map(publicPage) };
    if (PLAN[g].finishScene) deck.finishScene = PLAN[g].finishScene;
    if (PLAN[g].timeline) deck.timeline = TIMELINES[PLAN[g].timeline].map(p => ({ key: p.key, no: p.no, name: p.name, years: p.years, from: p.from, to: p.to, weight: p.weight }));
    const ms = calibrate(src.player, deck, !!PLAN[g].noFloor);
    const steps = src.player.periodSteps(deck, true);
    timing[g] = { defaultMs: ms, fullReadMs: src.player.estimate(deck, false), pace: deck.pace, steps: steps.length,
      recallRows: steps.filter(s => s.phase === 'recall').length, pages: deck.cards.length, scenes: deck.cards.reduce((a, p) => a + p.scenes.length, 0) };
    decksOut[g] = deck;
  }
  const data = { schema: 2, generatedBy: 'scripts/build_period_reviews.cjs', enabled: ENABLED.slice(), decks: decksOut };
  const js = '/* 전체 복습 · 시기별 요약 — scripts/build_period_reviews.cjs가 만든 파일입니다. 손으로 고치지 마세요.\n' +
    ' * 새 요약 재생: ' + ENABLED.join(', ') + ' · 편집 표: scripts/period-review-plan.cjs · 적용 범위: docs/period-review-coverage.md */\n' +
    'window.HANQ_PERIOD_REVIEWS=' + JSON.stringify(data) + ';\n(' + installRuntime.toString() + ')(window);\n';

  const summary = {};
  for (const g of GROUPS) {
    const pages = groupPages[g];
    const f = report.facts.filter(x => x.group === g);
    const t = tb.filter(x => x.group === g);
    const blanks = pages.reduce((a, p) => a + p.scenes.reduce((b, s) => b + s.rows.reduce((c, r) => c + r.hb.length + r.items.reduce((d, it) => d + it.b.length, 0), 0), 0), 0);
    summary[g] = { status: ENABLED.includes(g) ? 'delivered' : 'draft (재생에 쓰지 않음 · 기존 복습 화면 유지)', pages: pages.length, scenes: pages.reduce((a, p) => a + p.scenes.length, 0),
      maxRowsPerScene: Math.max.apply(null, pages.map(p => Math.max.apply(null, p.scenes.map(s => s.rows.length)))),
      facts: f.length, factsVisible: f.filter(x => x.status === 'visible').length, factsExcluded: f.filter(x => x.status === 'excluded').length, factsMapped: f.filter(x => x.status === 'mapped').length,
      mappedMinOverlap: (() => { const m = f.filter(x => x.status === 'mapped').map(x => Math.max(...x.shortened.map(t => t.overlap))); return m.length ? Math.min(...m) : null; })(),
      mappedLowOverlap: f.filter(x => x.status === 'mapped' && Math.max(...x.shortened.map(t => t.overlap)) < 0.5).map(x => x.id + ' ' + Math.max(...x.shortened.map(t => t.overlap))),
      cardDeckChars: g === 'joseon' ? src.decks.joseon.cards.reduce((a, c) => a + Array.from([c.era, c.topic, c.sub || ''].concat(c.points).join('')).length, 0) : undefined,
      charsByPage: Object.fromEntries(pages.map(p => [p.id, Array.from(p.title + p.period).length + p.scenes.reduce((b, s) => b + Array.from(s.title).length + s.rows.reduce((c, r) => c + Array.from(r.head + (r.sub || '') + r.items.map(x => x.t).join('')).length, 0), 0)])),
      visibleChars: pages.reduce((a, p) => a + Array.from(p.title + p.period).length + p.scenes.reduce((b, s) => b + Array.from(s.title).length + s.rows.reduce((c, r) => c + Array.from(r.head + (r.sub || '') + r.items.map(x => x.t).join('')).length, 0), 0), 0), factsMissing: f.filter(x => x.status === 'missing').length,
      mergedCards: pages.reduce((a, p) => a + p.scenes.reduce((b, s) => b + s.merged.filter(m => !m.startsWith('tbc:')).length, 0), 0),
      coreRows: t.length, coreTermAndMeaning: t.filter(x => x.status === 'term+meaning-visible').length,
      coreManual: t.filter(x => x.status !== 'term+meaning-visible').map(x => x.id + ' ' + x.term + ' (' + x.status + ')'),
      blanks, timing: timing[g] || null };
  }
  const coverage = {
    generatedBy: 'scripts/build_period_reviews.cjs', enabled: ENABLED.slice(),
    method: {
      fact: '원래 카드 요점마다 공백·문장부호를 뺀 글자가 실제 장면 글(쪽 제목·장면 제목·줄 머리·요점)에 그대로 들어 있는 장면을 셈. 숨은 메타데이터로는 통과하지 않음',
      coreRow: '교재 핵심표 행(tb)을 참조하는 카드가 놓인 장면에서 용어 낱말이 모두 보이고, 뜻 글이 그대로 또는 뜻 낱말 70% 이상 보이면 term+meaning-visible. 나머지는 수동 확인',
      exam: '제70~79회 공식 풀이(docs/exam-reviews)의 mem 낱말 글자만 같은 시대 쪽 글과 대조. repeated는 같은 낱말이 서로 다른 문항 2개 이상의 mem에 있는 경우(문항 id 기록). 문항 그림을 다시 분석하지 않았고 앞으로의 출제 예측이 아님',
      timing: 'media/review-player.js periodSteps(덱, 빈칸) 합계. 장면 시작 + 줄 읽기(머리·부제·요점 글자 수 × 글자당 시간) + 빈칸 줄은 떠올리기 + 드러낸 뒤 확인 읽기. 손으로 멈춘 시간은 들어가지 않음'
    },
    pdfSource: { file: '벼락치기_한능검_요약서.pdf (요청 명칭) · 실제 로컬 파일 벼락치기한능검_요약서.pdf (NFD 파일명, 144쪽, SHA256 35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442)', viewedAsImage: ['PDF 40쪽(고려 단원 첫 쪽: ①고려 초기 ②문벌귀족 시기 ③무신집권기 ④원 간섭기 ⑤고려 말)', 'PDF 41쪽(<표 15> 고려 시대 구분 · <표 16>)', 'PDF 42쪽(거란 침입 표 · 조정자가 따로 그림으로 확인)', 'PDF 43쪽(<표 17>)', 'PDF 44쪽(<표 18>)', 'PDF 46쪽(<표 19>)', 'PDF 47쪽(<표 20>)', 'PDF 51쪽(<표 21>)', 'PDF 53쪽(<표 22>)'],
      readAsText: 'PDF 40~53쪽(<표 15>~<표 22>) pdftotext -layout 글', pageOffset: '인쇄 쪽 + 7 = PDF 쪽', citedYears: PDF_CITED_YEARS, timeline: TIMELINE_SOURCE },
    goryeoFinal: (() => { const fp = groupPages.goryeo[9]; const asks = fp.scenes.flatMap(sc => sc.rows.filter(r => r.kind === 'ask'));
      return { questions: asks.length, prompts: asks.map(r => ({ q: r.head, a: r.items.map(x => x.t).join(' · ') })), recallMs: BASE_PACE.recallMs, closingRows: fp.scenes[fp.scenes.length - 1].rows.length,
        maxRowsFlowCompare: Math.max(...fp.scenes.filter(sc => !sc.rows.some(r => r.kind === 'ask')).map(sc => sc.rows.length)), before: FINAL_BEFORE, official: GORYEO_OFFICIAL }; })(),
    ancientSource: { official: ANCIENT.ANCIENT_OFFICIAL, unsupported: ANCIENT.ANCIENT_UNSUPPORTED },
    snSource: { official: SN_OFFICIAL, pdfNumbers: SN_PDF_NUMBERS, inventory },
    askPrompts: Object.fromEntries(['baekje'].concat(SN_GROUPS.filter(x => ENABLED.includes(x))).map(g => [g, groupPages[g].flatMap(p => p.scenes.flatMap(sc => sc.rows.filter(r => r.kind === 'ask'))).map(r => ({ q: r.head, a: r.items.map(x => x.t).join(' · ') }))])),
    baekjeSource: { points: BAEKJE.BAEKJE_POINTS, examScope: String(BAEKJE.BAEKJE_EXAM_SCOPE), coreGroup: BAEKJE.BAEKJE_CORE_GROUP, pdfAdded: BAEKJE.BAEKJE_PDF_ADDED },
    joseonSource: { pdfViewedAsImage: JOSEON_PDF_VIEWED, exceptions: JOSEON_SOURCE_EXCEPTIONS, unsupported: JOSEON_UNSUPPORTED, baseline: JOSEON_BASELINE },
    summary, facts: report.facts, nambukMapped: report.nambukMapped || [], baseline: BASELINE, textbookCore: tb, exam: crosswalk,
    pages: GROUPS.reduce((o, g) => { o[g] = groupPages[g].map(p => ({ id: p.id, kind: p.kind, title: p.title, period: p.period, cite: p.cite, at: p.at, part: p.part, stage: p.stage,
      scenes: p.scenes.map((s, si) => ({ n: si + 1, title: s.title, rows: s.rows.length, merged: s.merged, src: [].concat(...s.rows.map(r => r.src)) })) })); return o; }, {})
  };
  return { js, json: JSON.stringify(coverage, null, 1) + '\n', md: renderMd(coverage), pdf: pdf ? JSON.stringify(pdf, null, 1) + '\n' : null, pdfJoseon: pdfJoseon ? JSON.stringify(pdfJoseon, null, 1) + '\n' : null, coverage };
}

function renderMd(c) {
  const L = [];
  const S = c.summary;
  const min = ms => (ms / 60000).toFixed(1) + '분';
  L.push('# 전체 복습 · 시기별 요약 적용 범위', '');
  L.push('`scripts/build_period_reviews.cjs`가 원래 복습 덱·교재 노트·기출 풀이에서 매번 다시 세어 만드는 문서입니다(손으로 고친 수치 없음). 시험 범위 전체를 보장한다는 뜻이 아닙니다.', '');
  L.push('**전달 상태:** 새 시기별 요약으로 재생하는 묶음은 ' + c.enabled.map(g => GROUP_LABEL[g]).join(' · ') + '입니다(' + c.enabled.join(', ') + '). 고대사 전체(기본 범위)·개화기·일제강점기·현대사는 기존 복습 카드 그대로이고, 아래 ‘초안’ 묶음은 편집 표 초안으로만 적용 범위를 셉니다.', '');
  L.push('## 묶음별 요약', '');
  L.push('| 묶음 | 상태 | 쪽 | 장면 | 원래 요점 | 글 그대로 | 줄인 글로 옮김 | 목차·안내로 제외 | 빠짐 | 교재 핵심표 행 | 용어+뜻 보임 | 빈칸 | 기본 재생 |');
  L.push('|---|---|---|---|---|---|---|---|---|---|---|---|---|');
  for (const [g, s] of Object.entries(S)) L.push('| ' + [GROUP_LABEL[g], s.status.startsWith('delivered') ? '전달' : '초안', s.pages, s.scenes, s.facts, s.factsVisible, s.factsMapped, s.factsExcluded, s.factsMissing, s.coreRows, s.coreTermAndMeaning, s.blanks, s.timing ? min(s.timing.defaultMs) : '—'].join(' | ') + ' |');
  L.push('', '초안 묶음의 쪽 수는 예전 편집 표 기준이며 사용자 화면에 나오지 않습니다.', '');
  const G = S.goryeo;
  L.push('## 고려 (전달)', '');
  L.push('- 쪽 ' + G.pages + ' · 장면 ' + G.scenes + ' · 장면당 최대 ' + G.maxRowsPerScene + '줄 · 빈칸 ' + G.blanks + '개');
  L.push('- 기본 재생(빈칸 떠올리기 포함) ' + G.timing.defaultMs + 'ms(' + min(G.timing.defaultMs) + ') · 전체 보기 ' + G.timing.fullReadMs + 'ms(' + min(G.timing.fullReadMs) + ') · 글자당 ' + G.timing.pace.msPerChar + 'ms · 떠올리기 줄 ' + G.timing.recallRows + '개');
  { const cp = G.charsByPage, body = Object.keys(cp).filter(k => k !== 'go-10').reduce((a, k) => a + cp[k], 0);
    L.push('- 본문 1~9쪽 화면 글: ' + BASELINE.bodyChars + '자 → ' + body + '자(' + Math.round((1 - body / BASELINE.bodyChars) * 1000) / 10 + '% 줄임) · 최종 정리 10쪽: ' + BASELINE.finalChars + '자 → ' + cp['go-10'] + '자(주요 왕 15명·거란 1·2·3차·시기 구별을 다시 떠올리게 하려고 늘림) · 쪽별: ' + Object.keys(cp).map(k => k + ' ' + BASELINE.perPage[k] + '→' + cp[k]).join(', ')); }
  L.push('- 전체 화면 글 압축: 기준(' + BASELINE.base + ') ' + BASELINE.visibleChars + '자 · ' + BASELINE.scenes + '장면 · 장면당 최대 ' + BASELINE.maxRowsPerScene + '줄 · ' + BASELINE.defaultMs + 'ms → 지금 ' + G.visibleChars + '자(' + Math.round((1 - G.visibleChars / BASELINE.visibleChars) * 1000) / 10 + '% 줄임) · ' + G.scenes + '장면 · 장면당 최대 ' + G.maxRowsPerScene + '줄 · ' + G.timing.defaultMs + 'ms. 글자 수는 쪽 제목·시기·장면 제목·줄 머리·요점 글(숨긴 글 없음)');
  L.push('- 원래 고려 덱 요점 ' + G.facts + '개: 글 그대로 보임 ' + G.factsVisible + '개 · 줄인 글로 옮김(mapped) ' + G.factsMapped + '개 · 목차·안내로 제외 ' + G.factsExcluded + '개(아래) · 빠짐 ' + G.factsMissing + '개. **원래 문장이 모두 그대로 보인다는 뜻이 아닙니다.** mapped 요점은 `scripts/goryeo-compact.cjs`에 줄마다 원래 요점 id를 적어 두었고, 빌드가 같은 장면의 줄인 글에 원래 낱말(조사 뗀 줄기)이 남은 비율을 잽니다(최소 ' + G.mappedMinOverlap + ' · 0.5 미만이면 빌드 실패). 원래 글 → 줄인 글 짝은 `docs/period-review-coverage.json`의 facts[].shortened에 모두 있습니다.');
  L.push('- 교재 핵심표 고려 ' + G.coreRows + '행 중 용어와 뜻이 같은 장면에 보이는 행 ' + G.coreTermAndMeaning + '행' + (G.coreManual.length ? ' · 수동 확인: ' + G.coreManual.join(' / ') : ''), '');
  { const gp = c.pages.goryeo[9], gd = c.goryeoFinal;
    L.push('### 최종 정리(10쪽) · 학습 흐름: 흐름지도 → 핵심 비교 → 떠올리기 → 정답 확인', '');
    L.push('- 문제였던 점(조정자 브라우저 확인, 기준판 1afe92d): 자동 재생이 끝나면 최종 정리 ' + FINAL_BEFORE.finishVisibleScenes + '장면 ' + FINAL_BEFORE.finishVisibleRows + '줄이 한꺼번에 펼쳐지고(모바일 카드 높이 ' + FINAL_BEFORE.mobileCardHeightPx + 'px) 모든 정답이 드러났습니다. 왕 15명은 시기 구분 없이 4줄씩 이어졌고, 거란 1·2·3차 줄에는 연도가 없었으며, 읽는 줄의 낱말을 무작위로 가렸을 뿐 따로 떠올리는 단계가 없었습니다.');
    L.push('- 바꾼 점: 장면 ' + gp.scenes.length + '개 = 흐름지도 2 → 핵심 비교 9(교재 다섯 시기별 주요 왕 15명 → 거란 1·2·3차 → 여진·몽골·홍건적·왜구 → 헷갈리는 짝) → 떠올리기 ' + gd.questions + '(한 장면에 질문 하나) → 정답 확인 1(마지막에 남는 요약). 흐름지도·핵심 비교는 장면당 3줄 이하이고 빈칸 없이 읽습니다.');
    L.push('- 떠올리기: 빈칸 모드(기본)에서 질문만 보이고 정답은 통째로 가립니다 → 생각할 시간 ' + gd.recallMs + 'ms → 정답을 드러내고 글자당 ' + G.timing.pace.msPerChar + 'ms로 읽음. 클릭·입력·점수·저장 없음. 질문 글과 장면 제목에는 정답 낱말이 없고, 정답을 드러내기 전에는 위쪽 시기 띠(918~1018 등 연도)도 잠시 숨깁니다(검사). 전체 보기 모드에서는 질문과 정답을 함께 보여 주지만 장면은 하나씩입니다.');
    L.push('- 끝난 뒤: 마지막 “정답 확인 · 한눈에” 장면(' + gd.closingRows + '줄) 하나만 남고 다른 장면은 펼치지 않습니다. 끝난 뒤 이전/다음 쪽은 그 쪽 첫 장면에서 멈춘 채로 엽니다. 이 동작은 덱의 finishScene 값이 있을 때만이며(고려만) 조선·기존 카드 덱은 그대로입니다.');
    L.push('- 질문: ' + gd.prompts.map((q, i) => (i + 1) + ') ' + q.q + ' → ' + q.a).join(' / '));
    L.push('- 최종 정리 화면 글: ' + FINAL_BEFORE.chars + '자(10장면) → ' + c.summary.goryeo.charsByPage['go-10'] + '자(' + gp.scenes.length + '장면). 글은 늘었지만 한 번에 보이는 줄은 끝난 뒤 35줄 → 장면당 최대 3줄입니다. 고려 전체 기본 재생 ' + FINAL_BEFORE.defaultMs + 'ms → ' + G.timing.defaultMs + 'ms(최종 정리 비교 줄의 무작위 빈칸을 없애고 떠올리기 질문으로 바꿈 · 글자당 90ms·떠올리기 3.5초 그대로).');
    L.push('- 거란 침입 연도: 교재 PDF 42쪽 표에는 1·2·3차의 왕·인물만 있고 연도가 없습니다. 본문 2쪽과 최종 정리의 993 · 1010 · 1018~1019(침입 1018, 귀주 대첩 1019)는 조정자가 확인한 공식 자료에서 가져왔습니다: ' + Object.entries(GORYEO_OFFICIAL).map(([k, o]) => k + ' ' + o.url + ' (' + o.facts + ')').join(' · ') + '. 3차 전쟁(1018~1019)은 교재 시기 구분의 경계(초기 918~1018 / 문벌귀족 1018~1170)에 걸치지만 새 시기를 만들지 않았습니다. 2차는 ‘완전 승리’가 아니라 양규의 곽주성 탈환·항전 뒤 거란 철수로, 1차는 서희 담판으로 강동 6주 확보로 적었습니다.');
    L.push('- 주요 왕 15명(교재·원래 카드에 있는 왕만, 34왕 전체 아님)을 교재 다섯 시기로 묶음: ① 고려 초기 태조·혜종·정종·광종·경종·성종·현종(3장면) · ② 문벌귀족 문종·숙종·예종·인종 · ③ 무신집권기 고종(실권 최우) · ④ 원 간섭기 충렬왕·충목왕 · ⑤ 공민왕(원 간섭기 → 고려 말 다리). 왕의 재위 연도는 쓰지 않았습니다. 초조대장경은 3차 결과가 아니라 거란 대비(불교) 줄에, 별무반은 숙종(신기군·신보군·항마군)으로 적었습니다.', ''); }
  L.push('### 제외한 목차·안내 요점 (역사 사실 아님)', '');
  c.facts.filter(f => f.group === 'goryeo' && f.status === 'excluded').forEach(f => L.push('- `' + f.id + '` “' + f.text + '” — ' + f.reason));
  L.push('', '### 쪽과 장면', '', '| 쪽 | 제목 | 시기 | 장면 | 근거(문서 전용) |', '|---|---|---|---|---|');
  c.pages.goryeo.forEach((p, i) => L.push('| ' + [(i + 1) + ' `' + p.id + '`', p.title, p.period, p.scenes.map(s => s.n + '. ' + s.title + ' (' + s.rows + '줄)').join('<br>'), p.cite].join(' | ') + ' |'));
  L.push('', '### 교재 원문 PDF', '');
  L.push('- 파일: ' + c.pdfSource.file);
  L.push('- 그림으로 직접 본 쪽: ' + c.pdfSource.viewedAsImage.join(' · ') + '. 나머지 쪽은 글만 읽었고 그림·지도·도표 모양은 보지 않았습니다.');
  L.push('- 글로 읽은 범위: ' + c.pdfSource.readAsText + ' (' + c.pdfSource.pageOffset + ')');
  L.push('- 시기 경계 연도(1018·1170·1270·1351·1392)와 세력은 PDF 41쪽 <표 15>에서 가져왔습니다. <표 15>와 <표 19>는 공민왕 개혁(쌍성총관부 탈환·전민변정도감)을 원 간섭기 칸에 두지만 고려 말을 1351년부터로 나눕니다. 그래서 공민왕을 새 시기로 만들지 않고 6쪽 첫 장면에 두 시기를 잇는 다리로 보여 줍니다. 몽골(원) 침입은 <표 15>에서 무신집권기·원 간섭기 두 칸에 걸쳐 있어 4쪽 무신집권기 안의 장면으로 넣었습니다.');
  L.push('- PDF 40~53쪽 줄별 글자 대조 결과는 `docs/period-review-goryeo-pdf.json`(로컬 PDF 글이 있을 때 다시 만듦)에 있습니다. 낱말이 적게 겹친 줄은 원래 복습 덱에 없던 내용이거나 표현이 다른 줄입니다. 새 사실로 지어 넣지 않았습니다.', '');
  const E = c.exam.goryeo;
  L.push('### 기출 70~79회 고려 ' + E.questions + '문항 (글자만 대조)', '');
  L.push('- mem 낱말 ' + E.keywords + '개 중 ' + E.visible + '개가 고려 장면 글에 보임 · 낱말이 하나라도 보인 문항 ' + E.questionsWithVisible + '/' + E.questions);
  L.push('- 서로 다른 문항 2개 이상에 나온 낱말(문항 id): ' + E.repeated.map(r => r.k + ' ' + r.questions.join('·') + (r.visible ? '' : ' (장면에 없음)')).join(' / '));
  L.push('- 장면에 보이지 않은 낱말: ' + E.missing.join(', '));
  L.push('- 2쪽 첫 장면은 남북국 덱의 후삼국 카드 두 장(nambuk#14·#15)의 요점을 줄여 함께 보여 줍니다(공산 전투·고창 전투·일리천 전투 이름은 그대로 · 원래 → 줄인 글 짝은 JSON nambukMapped). 기출에서 고려로 분류된 문항에 고창 전투·궁예·광평성·경순왕·일리천 등이 여러 번 나오기 때문입니다(위 문항 id). 이 두 장은 남북국 덱의 사실이라 고려 요점 수에는 넣지 않았습니다.');
  L.push('- 표기 차이: 기출 낱말 “경천사지 십층 석탑”·“월정사 팔각 구층 석탑”처럼 숫자를 한글로 쓴 낱말은 원래 카드의 “10층”·“팔각구층” 표기와 글자가 달라 보이지 않음으로 셀 수 있습니다(글자 대조의 한계).');
  L.push('- 빈칸은 교재 핵심표 용어 가운데 이 기출 낱말과 겹친 문항이 많은 낱말을 먼저 고릅니다(줄마다 최대 2개). “빈출” 같은 표시는 화면에 쓰지 않습니다.', '');
  const JS = S.joseon, JX = c.exam.joseon, JO = c.joseonSource;
  L.push('## 조선 (전달)', '');
  L.push('- 교재의 공식 구분은 둘뿐입니다: PDF 58쪽 ① 조선 전기(태조~명종) · PDF 63쪽 ② 조선 후기(선조~철종). 2~7쪽의 ‘조선 전기 ①·②’, ‘조선 후기 ①~④’는 그 안의 복습용 읽기 묶음이며 교재의 시기 구분이 아닙니다. 왕마다의 재위 연도는 새로 쓰지 않았습니다.');
  L.push('- 연표: 교재 58쪽 연표의 1392 건국 · 1592 임진왜란 · 1636 병자호란 · 1910 경술국치(연표의 끝). 이 복습은 철종까지이고 고종 이후는 개화기 복습에서 다룹니다.');
  L.push('- 쪽 ' + JS.pages + ' · 장면 ' + JS.scenes + ' · 장면당 최대 ' + JS.maxRowsPerScene + '줄 · 빈칸 ' + JS.blanks + '개 · 기본 재생 ' + JS.timing.defaultMs + 'ms(' + min(JS.timing.defaultMs) + ') · 전체 보기 ' + JS.timing.fullReadMs + 'ms · 글자당 ' + JS.timing.pace.msPerChar + 'ms(고려와 같음, 빠르게 넘기지 않음)');
  L.push('- 화면 글: 기존 조선 복습 카드 176장(시대·주제·부제·요점) ' + JS.cardDeckChars + '자 → 새 요약 ' + JS.visibleChars + '자(' + Math.round((1 - JS.visibleChars / JS.cardDeckChars) * 1000) / 10 + '% 줄임) · 쪽별: ' + Object.entries(JS.charsByPage).map(([k, v]) => k + ' ' + v).join(', '));
  L.push('- 원래 조선 덱 요점 ' + JS.facts + '개: 글 그대로 ' + JS.factsVisible + '개 · 줄인 글로 옮김(mapped) ' + JS.factsMapped + '개 · 목차 안내로 제외 ' + JS.factsExcluded + '개 · 빠짐 ' + JS.factsMissing + '개. mapped는 `scripts/joseon-compact.cjs`의 원래 요점 id와 줄인 글 짝(JSON facts[].shortened)으로 추적하며, 낱말 줄기 겹침 비율(최소 ' + JS.mappedMinOverlap + ')은 글자 근거일 뿐 모든 뜻이 같다는 증명은 아닙니다.');
  L.push('- 교재 핵심표 조선 ' + JS.coreRows + '행(전기 74 + 후기 66) 중 용어와 뜻이 같은 장면에 보이는 행 ' + JS.coreTermAndMeaning + '행' + (JS.coreManual.length ? ' · 수동 확인: ' + JS.coreManual.join(' / ') : ''));
  L.push('- 기출 70~79회 조선 ' + JX.questions + '문항(전기 44 + 후기 49): mem 낱말 ' + JX.keywords + '개 중 ' + JX.visible + '개가 장면 글에 보임(기존 카드 덱 글 기준 ' + JX.cardDeckVisible + '개) · 낱말이 하나라도 보인 문항 ' + JX.questionsWithVisible + '/' + JX.questions + '. 글자만 대조했으며 문항 그림을 다시 분석하거나 출제를 예측한 것이 아닙니다.');
  L.push('- 교재 원문 PDF(같은 파일·SHA256)에서 조정자가 실제로 그림으로 연 쪽: ' + JO.pdfViewedAsImage.join(', ') + '. 144쪽 전체나 기출 500문항 그림을 모두 확인했다는 뜻이 아닙니다. 57~79쪽 글 대조는 `docs/period-review-joseon-pdf.json`(로컬 PDF 글이 있을 때만 다시 만듦).');
  L.push('- 원래 덱에는 없고 PDF에 있는 낱말만 더함(줄마다 pdf 근거): 주세붕 백운동 서원(중종) → 명종 때 사액 → 소수 서원(77쪽) · 유형원 반계수록 · 이익 성호사설(78쪽) · 정선 금강전도·인왕제색도 · 김홍도 씨름(79쪽) · 결작 1결당 쌀 2두(65쪽) · 숙종 상평통보(73쪽).');
  L.push('- 세도 정치 기간은 PDF 68쪽 원문대로 순조·헌종·철종 약 60여 년입니다. 원문 이미지와 추출 글을 함께 확인했습니다.');
  L.push('', '### 교재 오류 (새 화면에 옮기지 않음 · 원래 덱과 교재 노트는 그대로)', '');
  JO.exceptions.forEach(x => L.push('- PDF ' + x.page + '쪽 “' + x.sourceText + '” → ' + x.used + ' · 근거: ' + x.basis));
  L.push('', '### 근거가 없어 넣지 않은 요청 낱말', '');
  JO.unsupported.forEach(x => L.push('- ' + x.item + ' — ' + x.reason));
  L.push('', '### 조선 쪽과 장면', '', '| 쪽 | 제목 | 시기·범위 | 장면 | 근거(문서 전용) |', '|---|---|---|---|---|');
  c.pages.joseon.forEach((p, i) => L.push('| ' + [(i + 1) + ' `' + p.id + '` (' + (p.stage || '') + ')', p.title, p.period, p.scenes.map(s => s.n + '. ' + s.title + ' (' + s.rows + '줄)').join('<br>'), p.cite].join(' | ') + ' |'));
  L.push('', '- 메뉴의 조선 범위: 전체 · 조선 전기(전기 쪽 + 공통 주제) · 조선 후기(후기 쪽 + 공통 주제). 공통(cross) 쪽: 목차 · 통치 기구 · 토지/세금/경제 · 사회/기록 · 전기 문화/성리학/역사서 · 최종 정리.', '');
  { const AP = S.prehistory, AG = S.gojoseon, EP = c.exam.prehistory, EG = c.exam.gojoseon;
    L.push('## 고대사 · 선사 시대와 고조선·여러 나라 (전달)', '');
    L.push('- 열리는 곳: 전체 복습 → 고대사 → 범위 ‘선사 시대’·‘고조선과 여러 나라’, CBT 약한 시대(선사·고조선) 경로. 고대사 전체는 기존 카드 그대로입니다(한 플레이어에서 카드 덱과 시기별 요약을 섞을 수 없어 고대사 전체는 바꾸지 않음). 삼국·남북국은 아래 각 절.');
    L.push('- 학습 흐름(고려 최종 정리와 같은 방식): 흐름지도 → 시대·나라별 핵심(장면당 3줄 이하) → 헷갈리는 짝 → 떠올리기(질문 하나씩, 정답을 통째로 가렸다가 3.5초 뒤 자동 공개, 그동안 위쪽 시기 띠도 숨김) → 정답 확인 장면 하나만 남기고 끝. 클릭·입력·점수·저장 없음.');
    L.push('- 선사 시대: 쪽 ' + AP.pages + ' · 장면 ' + AP.scenes + ' · 장면당 최대 ' + AP.maxRowsPerScene + '줄 · 기본 재생 ' + AP.timing.defaultMs + 'ms(' + min(AP.timing.defaultMs) + ') · 원래 요점 ' + AP.facts + ' = 그대로 ' + AP.factsVisible + ' + 줄인 글 ' + AP.factsMapped + ' + 제외 ' + AP.factsExcluded + ' · 교재 핵심표 ' + AP.coreTermAndMeaning + '/' + AP.coreRows + ' · 기출 ' + EP.questions + '문항 mem 낱말 ' + EP.visible + '/' + EP.keywords + '(보이지 않음: ' + (EP.missing.join(', ') || '없음') + ')');
    L.push('- 고조선과 여러 나라: 쪽 ' + AG.pages + ' · 장면 ' + AG.scenes + ' · 장면당 최대 ' + AG.maxRowsPerScene + '줄 · 기본 재생 ' + AG.timing.defaultMs + 'ms(' + min(AG.timing.defaultMs) + ') · 원래 요점 ' + AG.facts + ' = 그대로 ' + AG.factsVisible + ' + 줄인 글 ' + AG.factsMapped + ' + 제외 ' + AG.factsExcluded + ' · 교재 핵심표 ' + AG.coreTermAndMeaning + '/' + AG.coreRows + ' · 기출 ' + EG.questions + '문항 mem 낱말 ' + EG.visible + '/' + EG.keywords + '(보이지 않음: ' + (EG.missing.join(', ') || '없음') + ')');
    L.push('- 재생 시간: 두 단원 합 ' + (AP.timing.defaultMs + AG.timing.defaultMs) + 'ms(' + min(AP.timing.defaultMs + AG.timing.defaultMs) + '). 짧은 단원이라 15분 하한으로 늘리지 않았습니다(글자당 90ms·떠올리기 3.5초 그대로). 고대사 전체(기존 카드 54장)는 바뀌지 않아 15~20분 목표에 맞춘 새 요약이 아닙니다 — 카드와 요약을 한 플레이어에서 섞을 수 없고, 선사·고조선·삼국·남북국 네 요약을 이으면 ' + min(['prehistory', 'gojoseon', 'samguk', 'nambuk'].reduce((a, g) => a + (S[g].timing ? S[g].timing.defaultMs : 0), 0)) + '이라 목표를 넘기기 때문입니다(삼국·남북국은 범위별 새 요약).');
    L.push('- 근거: 교재 원문 PDF(formfeed 기준) 9쪽 <표 1> 선사 · 10쪽 시험 단서 · 11쪽 <표 2> 고조선·범금 8조 남은 세 조항(한서지리지) · 12쪽 <표 3> 여러 나라 · 13쪽 시험 단서 · 14~15쪽 확인 문제와 답 · 139·140쪽 지역(전곡리·석장리·두루봉·암사동·송국리·고산리). 연도·재위는 새로 쓰지 않았습니다. 기출 낱말 대조는 글자만 본 것이며 기출 범위를 모두 다룬다는 뜻이 아닙니다.');
    L.push('- 공식 자료(교재와 다르게 설명되는 곳): ' + Object.entries(c.ancientSource.official).map(([k, o]) => k + ' ' + o.url + ' (' + o.facts + ')').join(' · ') + '. 울주 반구대 바위그림은 교재 9쪽 표의 청동기 칸에 있지만 공식 설명은 신석기~청동기 생활이므로 ‘선사 사냥·고기잡이 바위그림(신석기~청동기)’으로 보여 주고, 청동기만의 떠올리기 질문으로 쓰지 않았습니다(교재 칸도 함께 표시).');
    L.push('- 사진: 없습니다. 유적·유물은 이름과 특징 글로만 익히며 그림을 만들거나 내려받지 않았습니다.');
    L.push('', '### 제외·근거 없는 요청 낱말', '');
    c.facts.filter(f => (f.group === 'prehistory' || f.group === 'gojoseon') && f.status === 'excluded').forEach(f => L.push('- `' + f.id + '` “' + f.text + '” — ' + f.reason));
    c.ancientSource.unsupported.forEach(x => L.push('- ' + x.item + ' — ' + x.reason));
    L.push('', '### 선사 · 고조선 쪽과 장면', '', '| 쪽 | 제목 | 시기·범위 | 장면 | 근거(문서 전용) |', '|---|---|---|---|---|');
    for (const g of ['prehistory', 'gojoseon']) c.pages[g].forEach((p, i) => L.push('| ' + [g + ' ' + (i + 1) + ' `' + p.id + '`', p.title, p.period, p.scenes.map(x => x.n + '. ' + x.title + ' (' + x.rows + '줄)').join('<br>'), p.cite].join(' | ') + ' |'));
    L.push(''); }
  { const B = S.baekje, EB = c.exam.baekje, BS = c.baekjeSource, bp = c.pages.baekje, fin = bp[bp.length - 1];
    const asks = c.askPrompts.baekje;
    L.push('## 고대사 · 백제 웅진·사비 왕 비교 (전달)', '');
    L.push('- 열리는 곳: 전체 복습 → 고대사 → 범위 ‘백제 웅진·사비 왕 비교’(주소 `#reviews/ancient/baekje`). 백제 왕 비교는 선택 범위로 유지합니다. 삼국·남북국과 CBT 약한 시대 경로는 아래의 새 요약을 열고, 고대사 전체만 기존 카드 54장입니다.');
    L.push('- 범위: 백제 수도 한성 → 웅진(공주) → 사비(부여)와 네 왕(문주왕 · 동성왕 · 무령왕 · 성왕). 원래 삼국 카드 요점 중 ' + Object.entries(BS.points).map(([ci, ps]) => 'samguk#' + ci + ':' + ps.join(',')).join(' · ') + '만 이 덱이 책임집니다(나머지 삼국 요점은 기존 카드에 그대로).');
    L.push('- 쪽 ' + B.pages + ' · 장면 ' + B.scenes + ' · 장면당 최대 ' + B.maxRowsPerScene + '줄 · 기본 재생 ' + B.timing.defaultMs + 'ms(' + min(B.timing.defaultMs) + ') · 글자당 ' + B.timing.pace.msPerChar + 'ms · 떠올리기 3.5초(15분 하한으로 늘리지 않음)');
    L.push('- 학습 흐름: 수도 흐름지도 → 웅진 시대(문주왕 천도 · 동성왕 혼인 동맹 · 무령왕 22담로·벽돌무덤) → 사비 시대(성왕 · 남부여 · 도살성 · 한강 하류 · 관산성) → 헷갈리는 왕 비교 2장면 → 떠올리기 ' + asks.length + '(설명 → 왕, 질문 하나씩 정답을 통째로 가렸다가 자동 공개, 그동안 위쪽 수도 띠도 숨김) → “' + fin.scenes[fin.scenes.length - 1].title + '” 장면 하나만 남기고 끝. 클릭·입력·점수·저장 없음.');
    L.push('- 질문: ' + asks.map((q, i) => (i + 1) + ') ' + q.q + ' → ' + q.a).join(' / '));
    L.push('- 원래 요점 ' + B.facts + ' = 그대로 ' + B.factsVisible + ' + 줄인 글 ' + B.factsMapped + ' + 제외 ' + B.factsExcluded + ' · 빠짐 ' + B.factsMissing + ' · 교재 핵심표 ‘' + BS.coreGroup + '’ ' + B.coreTermAndMeaning + '/' + B.coreRows + '행 용어+뜻');
    L.push('- 기출 70~79회 삼국 문항 중 이 범위 문항(공식 풀이 a·mem·clue에 ' + BS.examScope + ') ' + EB.questions + '개: mem 낱말 ' + EB.visible + '/' + EB.keywords + '(보이지 않음: ' + (EB.missing.join(', ') || '없음') + '). 글자 대조일 뿐 기출 범위를 모두 다룬다는 뜻이 아니며, 보이지 않는 낱말 대부분은 같은 문항에 함께 나온 다른 나라·다른 시기 낱말이라 이 덱에 넣지 않았습니다(삼국 기존 카드에 있음). ‘빈출’ 표시는 쓰지 않습니다.');
    L.push('- 서로 다른 문항 2개 이상의 mem에 나온 낱말(문항 id): ' + EB.repeated.map(r => r.k + ' ' + r.questions.join('·') + (r.visible ? '' : ' (장면에 없음)')).join(' / '));
    L.push('- 원래 카드에 없고 교재 PDF에만 있어 더한 낱말(formfeed 쪽): ' + BS.pdfAdded.map(x => x.item + ' — ' + x.pdf).join(' · ') + '. 연도·재위는 새로 쓰지 않았고 사진·그림은 없습니다.');
    L.push('', '### 백제 쪽과 장면', '', '| 쪽 | 제목 | 시기·범위 | 장면 | 근거(문서 전용) |', '|---|---|---|---|---|');
    bp.forEach((p, i) => L.push('| ' + [(i + 1) + ' `' + p.id + '`', p.title, p.period, p.scenes.map(x => x.n + '. ' + x.title + ' (' + x.rows + '줄)').join('<br>'), p.cite].join(' | ') + ' |'));
    L.push(''); }
  for (const g of SN_GROUPS.filter(x => c.enabled.includes(x))) {
    const A = S[g], EX = c.exam[g], INV = c.snSource.inventory[g], gp = c.pages[g], asks = c.askPrompts[g];
    L.push('## 고대사 · ' + GROUP_LABEL[g] + ' (전달)', '');
    L.push('- 열리는 곳: 전체 복습 → 고대사 → 범위 ‘' + GROUP_LABEL[g] + '’(주소 `#reviews/ancient/' + g + '`)과 CBT 약한 시대(' + GROUP_LABEL[g] + ')·예전 학습 화면 복습 경로. 기존 ' + GROUP_LABEL[g] + ' 카드 대신 이 요약을 엽니다. 고대사 전체(기본)는 기존 카드 54장 그대로입니다 — 한 플레이어에서 카드 덱과 시기별 요약을 섞을 수 없고, 네 요약을 이으면 15~20분 목표를 크게 넘기 때문입니다.');
    if (g === 'samguk') L.push('- 쪽 묶음은 교재 첫 쪽(PDF 16쪽) “각 나라별 전성기 + 삼국통일 과정”을 따릅니다: 큰 흐름 → 고구려 → 백제 → 신라·가야 → 7세기 전쟁과 통일 → 제도·사회 → 문화 → 최종 정리. 위쪽 띠는 나라별 전성기 세기(4세기 백제 · 5세기 고구려 · 6세기 신라)와 7세기 통일 전쟁입니다. 백제 웅진·사비 네 왕의 자세한 비교는 별도 범위 ‘백제 웅진·사비 왕 비교’에 그대로 두고, 여기서는 백제 쪽과 헷갈리는 짝 한 장면에만 짧게 넣었습니다(자동 재생에서 4쪽을 두 번 싣지 않음).');
    if (g === 'nambuk') L.push('- 쪽 묶음은 교재 첫 쪽(PDF 16쪽) “통일신라: 주요 왕별 정치 상황 + 후삼국 통일 과정 / 발해: 사회 제도가 중요!”와 원래 카드 목차를 따릅니다: 큰 흐름(남쪽 통일 신라 · 북쪽 발해가 나란히 → 신라 하대 → 후삼국 → 고려) → 통일 신라 전기 왕별 정치 → 발해 → 통일 신라 문화 → 신라 하대 → 후삼국과 통일 → 최종 정리. 위쪽 띠: 통일 신라 전기 · 발해(같은 시기 북쪽) · 신라 하대 · 후삼국 → 고려. 고려 덱 2쪽이 줄여 쓰는 남북국 카드 14·15번(후삼국)은 원래 카드라 그대로이며 고려 덱도 바뀌지 않았습니다.');
    L.push('- 쪽 ' + A.pages + ' · 장면 ' + A.scenes + ' · 장면당 최대 ' + A.maxRowsPerScene + '줄 · 기본 재생 ' + A.timing.defaultMs + 'ms(' + min(A.timing.defaultMs) + ') · 전체 보기 ' + A.timing.fullReadMs + 'ms · 글자당 ' + A.timing.pace.msPerChar + 'ms · 떠올리기 3.5초. 실제 분량대로 쟀고 15분 하한으로 늘리지 않았습니다.');
    L.push('- 떠올리기 ' + asks.length + '(질문 하나씩 · 정답과 위쪽 띠를 장면 시작부터 가렸다가 3.5초 뒤 자동 공개): ' + asks.map((q, i) => (i + 1) + ') ' + q.q + ' → ' + q.a).join(' / '));
    L.push('- 원래 ' + GROUP_LABEL[g] + ' 카드 요점 ' + A.facts + ' = 그대로 ' + A.factsVisible + ' + 줄인 글 ' + A.factsMapped + ' + 목차 제외 ' + A.factsExcluded + ' · 빠짐 ' + A.factsMissing + ' · 교재 핵심표 ' + A.coreTermAndMeaning + '/' + A.coreRows + '행 용어+뜻');
    L.push('- 교재 PDF 사실 목록 ' + INV.items + '항목: 장면 글에 보임 ' + INV.visible + '(확인 낱말 ' + INV.words + '개 모두 · 빌드가 매번 검사) · 제외 ' + INV.excluded + '(아래 이유). 글자 대조라 뜻까지 같다는 증명은 아닙니다.');
    L.push('- 기출 70~79회 ' + GROUP_LABEL[g] + ' ' + EX.questions + '문항: mem 낱말 ' + EX.visible + '/' + EX.keywords + '(보이지 않음: ' + (EX.missing.join(', ') || '없음') + '). 글자 대조일 뿐 기출 범위를 모두 다룬다는 뜻이 아니며 ‘빈출’ 표시는 쓰지 않습니다.');
    L.push('- 연도: 교재 PDF에 연도가 없어 줄의 연도는 공식 자료에서 확인한 것만 씁니다: ' + Object.entries(c.snSource.official[g]).map(([k, o]) => k + ' ' + o.url + ' (' + o.facts + ')').join(' · ') + '. 왕의 재위 연도는 쓰지 않았습니다. 사진·지도는 없고 유물은 이름과 특징 글로만 익힙니다.');
    L.push('', '### ' + GROUP_LABEL[g] + ' 교재 사실 목록에서 제외한 항목', '');
    INV.rows.filter(r => r.status === 'excluded').forEach(r => L.push('- PDF ' + r.pdf + '쪽 ' + r.item + ' — ' + r.reason));
    c.facts.filter(f => f.group === g && f.status === 'excluded').forEach(f => L.push('- `' + f.id + '` “' + f.text + '” — ' + f.reason));
    L.push('', '### ' + GROUP_LABEL[g] + ' 쪽과 장면', '', '| 쪽 | 제목 | 시기·범위 | 장면 | 근거(문서 전용) |', '|---|---|---|---|---|');
    gp.forEach((p, i) => L.push('| ' + [(i + 1) + ' `' + p.id + '`', p.title, p.period, p.scenes.map(x => x.n + '. ' + x.title + ' (' + x.rows + '줄)').join('<br>'), p.cite].join(' | ') + ' |'));
    L.push('');
  }
  L.push('## 초안 묶음 (재생에 쓰지 않음)', '');
  for (const g of GROUPS.filter(x => !c.enabled.includes(x))) { const s = S[g], e = c.exam[g]; L.push('- ' + GROUP_LABEL[g] + ': 초안 ' + s.pages + '쪽 · 요점 ' + s.factsVisible + '/' + s.facts + ' · 교재 행 용어+뜻 ' + s.coreTermAndMeaning + '/' + s.coreRows + ' · 기출 mem 낱말 ' + e.visible + '/' + e.keywords); }
  L.push('');
  return L.join('\n').trimEnd() + '\n';
}

if (require.main === module) {
  const out = build();
  const check = process.argv.includes('--check');
  const files = [[OUT_JS, out.js], [OUT_JSON, out.json], [OUT_MD, out.md]];
  if (out.pdf) files.push([OUT_PDF, out.pdf]);
  if (out.pdfJoseon) files.push([OUT_PDF_JOSEON, out.pdfJoseon]);
  if (check) {
    const stale = files.filter(([f, s]) => !fs.existsSync(f) || fs.readFileSync(f, 'utf8') !== s).map(([f]) => path.relative(ROOT, f));
    if (stale.length) { console.error('다시 만들어야 함: ' + stale.join(', ')); process.exit(1); }
  } else files.forEach(([f, s]) => fs.writeFileSync(f, s));
  const S = out.coverage.summary;
  console.log(Object.entries(S).map(([g, s]) => g + ' [' + (s.status.startsWith('delivered') ? '전달' : '초안') + '] 쪽 ' + s.pages + ' 장면 ' + s.scenes + ' · 요점 그대로 ' + s.factsVisible + ' + 줄인 글 ' + (s.factsMapped || 0) + ' / ' + s.facts + ' (제외 ' + s.factsExcluded + ') · 교재행 용어+뜻 ' + s.coreTermAndMeaning + '/' + s.coreRows + (s.timing ? ' · 재생 ' + s.timing.defaultMs + 'ms' : '')).join('\n'));
  const low = ENABLED.flatMap(g => S[g].mappedLowOverlap);
  if (low.length) { console.error('줄인 글에 원래 낱말이 너무 적음(0.5 미만): ' + low.join(', ')); process.exit(1); }
  const missing = out.coverage.facts.filter(f => f.status === 'missing' && ENABLED.includes(f.group));
  if (missing.length) { console.error('빠진 요점 ' + missing.length + ': ' + missing.slice(0, 10).map(f => f.id + ' ' + f.text).join(' | ')); process.exit(1); }
}
module.exports = { build, norm, termsOf };
