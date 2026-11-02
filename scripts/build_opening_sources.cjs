#!/usr/bin/env node
/* 개화기 강의 근거 → 앱 근거 파일 생성. 고려·조선의 근거 파일(docs/lecture-source-map.json, media/lecture-terms.js)은 건드리지 않는다.
 *   node scripts/build_opening_sources.cjs           → docs/opening-source-map.json, media/lecture-terms-opening.js 를 쓴다
 *   node scripts/build_opening_sources.cjs --check   → 다시 계산해 두 파일과 다르면 종료 코드 1(아무것도 쓰지 않음)
 * 입력은 저장소 안 파일뿐: docs/opening-lecture-handoff.json(강의 분석), media/lecture-notes-opening.js(요약 데이터),
 *   docs/opening-comic-map.json(있으면 웹툰 장면 연결). 시간·난수를 쓰지 않아 같은 입력이면 같은 결과.
 * 검증에 실패하면 아무것도 쓰지 않고 종료 코드 1.
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const OUT_MAP = 'docs/opening-source-map.json', OUT_TERMS = 'media/lecture-terms-opening.js';

const H = JSON.parse(rd('docs/opening-lecture-handoff.json'));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(rd('media/lecture-notes-opening.js'), ctx);
const L = ctx.window.HANQ_LECTURE.opening;
const COMIC = fs.existsSync(path.join(ROOT, 'docs', 'opening-comic-map.json')) ? JSON.parse(rd('docs/opening-comic-map.json')) : { scenes: [], art_needed: [] };

const TIERS = ['core', 'support', 'optional'];
const errors = [];
const byId = Object.fromEntries(H.modules.map(m => [m.id, m]));
if (H.source.sha256 !== 'f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') errors.push('강의 스크립트 SHA가 다름');
if (H.source.read_range[0] !== 1254 || H.source.read_range[1] !== 1607) errors.push('개화기 읽은 범위는 1254–1607행');
for (const m of H.modules) {
  if (!/^O\d\d$/.test(m.id)) errors.push('모듈 id 형식: ' + m.id);
  if (!TIERS.includes(m.priority)) errors.push(m.id + ' 등급 ' + m.priority);
  if (!m.priority_evidence.length || m.priority_evidence.some(e => e.lines.length !== 2 || e.lines[0] > e.lines[1] || !e.kind || !e.meaning)) errors.push(m.id + ' 강조 근거 형식');
  for (const r of m.content_lines.concat(m.priority_evidence.map(e => e.lines))) if (r[0] < 1254 || r[1] > 1607) errors.push(m.id + ' 행 범위 밖: ' + r.join('–'));
  if (m.priority === 'optional' && !m.priority_evidence.some(e => /lower|limited|explanation/.test(e.kind))) errors.push(m.id + ' 선택 심화인데 범위를 낮춘 근거 없음');
  if (m.priority === 'core' && !m.priority_evidence.some(e => /explicit|claimed|required|important|priority|order|pairing|core/.test(e.kind))) errors.push(m.id + ' 먼저 기억인데 직접 강조 근거 없음');
  for (const c of m.correction_ids) if (!H.corrections.some(x => x.id === c)) errors.push(m.id + ' 없는 정정 ' + c);
}
for (const c of H.corrections) if (!c.app_decision || c.app_decision.length < 10) errors.push('처리 기록 없는 정정: ' + c.id);
const used = {};
for (const g of L.groups) {
  if (!TIERS.includes(g.tier)) errors.push('«' + g.g + '» 등급 ' + g.tier);
  for (const id of g.mod) {
    const m = byId[id];
    if (!m) { errors.push('없는 모듈: ' + id); continue; }
    if (m.priority !== g.tier) errors.push(id + ' «' + g.g + '» 묶음 등급 ' + g.tier + ' ≠ 모듈 ' + m.priority);
    (used[id] = used[id] || []).push(g.g);
  }
  for (const r of g.rows) if (r[0].length > 40 || r[1].length > 48) errors.push('긴 행: ' + r[0]);
}
for (const k of ['flow', 'compare', 'recall']) for (const x of L[k] || []) for (const id of x.mod) if (!byId[id]) errors.push(k + ' 없는 모듈: ' + id);
for (const m of H.modules) if (!used[m.id]) errors.push('요약 묶음에 없는 모듈: ' + m.id);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const modules = {};
for (const m of H.modules) {
  modules[m.id] = {
    title: m.title, priority: m.priority, highlight_keywords: m.highlight_keywords, content_lines: m.content_lines,
    priority_evidence: m.priority_evidence, pdf_pages: m.pdf_pages, book_pages: m.book_pages, correction_ids: m.correction_ids,
    summary_groups: used[m.id],
    comic_scenes: (COMIC.scenes || []).filter(s => (s.modules || []).includes(m.id)).map(s => ({ id: s.id, scene: s.scene, art: s.art, depicts: s.depicts })),
    comic_art_needed: (COMIC.art_needed || []).filter(a => (a.modules || []).includes(m.id)).map(a => a.brief),
  };
}
const map = JSON.stringify({
  generated_by: 'scripts/build_opening_sources.cjs',
  source: H.source, textbook: H.textbook, priority_levels: H.priority_levels, chronology_parts: H.chronology_parts,
  app_policy: [
    '강의 강조 등급(core·support·optional)을 그대로 요약 묶음 등급으로 쓴다.',
    '굵게 = core 모듈의 강조어. 출제 빈도·예측이 아니다. 강사의 빈도 주장은 기록만 하고 화면에 쓰지 않는다.',
    '문장은 모두 새로 쓴다. 음성 인식 오류는 표준 이름으로 고친다(OC09).',
    '교재 강조 노트는 개화기 요약에서 ‘교재 정리 더 보기’로 접어 둔다.',
  ],
  corrections: H.corrections, modules,
}, null, 1) + '\n';
const s = new Set();
for (const g of L.groups) if (g.tier === 'core') for (const id of g.mod) for (const k of byId[id].highlight_keywords) s.add(k);
const terms = '/* 자동 생성: scripts/build_opening_sources.cjs — 직접 고치지 마세요.\n * 개화기 강의 핵심어(core 모듈에서 강사가 짚은 말). 요약과 웹툰에서 굵게 보인다. 출제 예측이 아님.\n */\n' +
  'window.HANQ_LECTURE_TERMS = window.HANQ_LECTURE_TERMS || {};\nwindow.HANQ_LECTURE_TERMS.opening=' + JSON.stringify([...s].sort()) + ';\n';

if (process.argv.includes('--check')) {
  const same = (f, t) => fs.existsSync(path.join(ROOT, f)) && rd(f) === t;
  if (!same(OUT_MAP, map) || !same(OUT_TERMS, terms)) { console.error('개화기 근거 파일이 최신이 아닙니다. node scripts/build_opening_sources.cjs 로 다시 만드세요.'); process.exit(1); }
  console.log('개화기 근거 파일 최신');
} else {
  fs.writeFileSync(path.join(ROOT, OUT_MAP), map);
  fs.writeFileSync(path.join(ROOT, OUT_TERMS), terms);
  console.log('개화기 모듈 ' + H.modules.length + ' · 정정 ' + H.corrections.length + ' · 핵심어 ' + s.size + ' · 웹툰 장면 ' + (COMIC.scenes || []).length);
}
