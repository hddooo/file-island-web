#!/usr/bin/env node
/* 강의 강조 분석 → 앱 근거 파일 생성 (고려 · 조선 전기와 양난 · 조선 후기). 여러 번 실행해도 결과가 같다.
 *   node scripts/build_lecture_sourcemap.cjs <goryeo_joseon_script_handoff.json 경로>
 *   (또는 환경 변수 HANQ_LECTURE_HANDOFF에 경로를 둔다. 경로가 없거나 파일이 없으면 아무것도 쓰지 않고 멈춘다.)
 * 입력: goryeo_joseon_script_handoff.json(읽기 전용), media/lecture-notes.js, docs/lecture-comic-map.json(웹툰 장면 배치)
 * 출력: media/lecture-terms.js — 시대별 ‘강의 핵심어’(core·1급 보충 모듈의 강조어). 요약에서 굵게 표시
 *       docs/lecture-source-map.json — 모듈별 스크립트 행·강조 근거·교재 대조 쪽·정정 id·앱 배치·웹툰 장면
 * 스크립트 문장은 담지 않는다(행 번호와 근거 종류·의미 요약만).
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SRC = process.argv[2] || process.env.HANQ_LECTURE_HANDOFF;
if (!SRC || !fs.existsSync(SRC)) {
  console.error('강의 분석 파일(goryeo_joseon_script_handoff.json)을 찾을 수 없어요: ' + (SRC || '(경로 없음)') +
    '\n사용법: node scripts/build_lecture_sourcemap.cjs <handoff JSON 경로>  또는  HANQ_LECTURE_HANDOFF=<경로> node scripts/build_lecture_sourcemap.cjs');
  process.exit(2);
}
const H = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'media', 'lecture-notes.js'), 'utf8'), ctx);
const L = ctx.window.HANQ_LECTURE;
const comicMapPath = path.join(ROOT, 'docs', 'lecture-comic-map.json');
const COMIC = fs.existsSync(comicMapPath) ? JSON.parse(fs.readFileSync(comicMapPath, 'utf8')) : { scenes: [] };

const TIER = { core: 'core', target: 'target_1급', support: 'support', optional: 'optional', optional_highlight: 'optional_highlight' };
// 조선 모듈의 앱 배치 규칙: 전기·양난(건국~인조) / 후기(효종~) / 둘 다(시기 전체에 걸친 주제)
const PLACE = {
  J01: ['joseon-early'], J02: ['joseon-early'], J03: ['joseon-early'], J04: ['joseon-early'], J05: ['joseon-early'], J06: ['joseon-early'],
  J07: ['joseon-early', 'joseon-late'], J08: ['joseon-late'], J09: ['joseon-late'], J10: ['joseon-late'], J11: ['joseon-early'],
  J12: ['joseon-early', 'joseon-late'], J13: ['joseon-late'], J14: ['joseon-late'], J15: ['joseon-late'], J16: ['joseon-early', 'joseon-late'],
  J17: ['joseon-early'], J18: ['joseon-late'], J19: ['joseon-late'], J20: ['joseon-early', 'joseon-late'],
};
// 정정 17건의 앱 처리
const DECISIONS = {
  C01: '이징옥의 난은 1453년 단종 때로 따로 적고, 이시애의 난만 세조에 연결(요약 행·비교·회상·웹툰 세조 장면).',
  C02: '신해통공은 “육의전을 뺀 시전의 금난전권 폐지”로만 씀.',
  C03: '규장각 검서관 문맥의 표기를 서얼로 정규화.',
  C04: '통청 운동은 청요직 진출 요구로 설명하고 과거 응시 허용 요구와 같게 쓰지 않음.',
  C05: '신유박해: 정약용·정약전은 유배, 정약종은 처형으로 나눠 씀.',
  C06: '연려실기술의 저자는 이긍익으로 쓰고 이익과 다른 인물임을 밝힘(선택 심화).',
  C07: '황사영 백서는 박해 상황을 북경 주교에게 알리려던 편지로 설명. 청 군대 요청으로 단순화하지 않음.',
  C08: '김윤후는 처인성·충주성 항전으로만 연결. 다인철소와 한 전투로 합치지 않음.',
  C09: '동학은 “최제우가 창시한 종교”까지만. 인내천은 쓰지 않음.',
  C10: '1453 계유정난(단종 때)과 1455 세조 즉위를 별도 시점으로 표시.',
  C11: '임술농민봉기 뒤 박규수 파견·삼정이정청 설치까지만 연결. 세도정치를 끝낸 단일 원인으로 쓰지 않음.',
  C12: '벽란도는 여러 나라 상인이 오간 무역항으로만 씀. 교역 전체를 공무역으로 단정하지 않음.',
  C13: '권문세족은 원 간섭기에 성장한 유력 지배 세력으로 설명. 모두 친원이라 단정하지 않음.',
  C14: '탑 비교가 출제되지 않는다는 주장은 쓰지 않고, 경천사지(고려)와 원각사지(조선)를 구분하는 메모만 둠.',
  C15: '문제 번호로 시대를 정하는 요령은 쓰지 않음. 모내기·공인·상평통보 같은 내용 단서로 판별.',
  C16: '“가장 마지막 사건 고르기” 요령은 쓰지 않음.',
  C17: '홍문관은 경연·옥당 기능까지만. 수장 관직 단순화는 쓰지 않음.',
};

const errors = [], modules = {};
const byId = Object.fromEntries(H.modules.map(m => [m.id, m]));
const used = {};
for (const [era, v] of Object.entries(L)) {
  for (const g of v.groups) for (const id of g.mod) {
    const m = byId[id];
    if (!m) { errors.push('없는 모듈: ' + id); continue; }
    if (TIER[g.tier] !== m.effective_priority) errors.push(id + ' «' + g.g + '» 묶음 등급 ' + g.tier + ' ≠ 모듈 ' + m.effective_priority);
    const allowed = id.startsWith('G') ? ['goryeo'] : PLACE[id];
    if (!allowed.includes(era)) errors.push(id + ' 는 ' + era + ' 에 둘 수 없음');
    (used[id] = used[id] || { eras: new Set(), groups: [] }).eras.add(era);
    used[id].groups.push(era + ' · ' + g.g);
  }
  for (const k of ['flow', 'compare', 'recall']) for (const x of v[k] || []) for (const id of x.mod) if (!byId[id]) errors.push(k + ' 없는 모듈: ' + id);
}
for (const m of H.modules) if (!used[m.id]) errors.push('요약에 없는 모듈: ' + m.id);
for (const c of H.corrections) if (!DECISIONS[c.id]) errors.push('처리 기록 없는 정정: ' + c.id);
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

for (const m of H.modules) {
  modules[m.id] = {
    era: m.era, title: m.title, priority: m.effective_priority, section_scope: m.section_priority_scope || null,
    app_eras: [...used[m.id].eras].sort(), summary_groups: used[m.id].groups,
    highlight_keywords: m.highlight_keywords, content_lines: m.content_lines,
    priority_evidence: m.priority_evidence.map(e => ({ lines: [e.line_start, e.line_end], kind: e.kind, meaning: e.meaning })),
    frequency_claim_status: m.frequency_claim_status,
    pdf_crosscheck_pages: m.pdf_crosscheck_pages, book_crosscheck_pages: m.book_crosscheck_pages,
    correction_ids: m.correction_ids, verification_level: m.verification_level,
    comic_scenes: COMIC.scenes.filter(s => (s.modules || []).includes(m.id)).map(s => ({ file: s.file, id: s.id, art: s.art, depicts: s.depicts })),
    comic_art_needed: (COMIC.art_needed || []).filter(a => (a.modules || []).includes(m.id)).map(a => a.brief),
  };
}
const out = {
  generated_by: 'scripts/build_lecture_sourcemap.cjs',
  source: { filename: H.source.filename, lines: H.source.lines, sha256: H.source.sha256, timestamps_present: H.source.timestamps_present, read_ranges: H.coverage.read_ranges },
  priority_policy: H.priority_policy,
  app_policy: [
    '강의 우선순위(core·target_1급·support·optional·optional_highlight)를 그대로 묶음 등급으로 씀. optional_highlight는 선택 심화 안에서 먼저 볼 항목일 뿐 선택 범위를 벗어나지 않음.',
    '굵게 = 그 시대 core·target_1급 모듈의 강사 강조어. 출제 빈도·예측이 아님. 빈도 주장은 강사의 주장으로만 기록하고 화면에 배지로 만들지 않음.',
    '문장은 모두 새로 씀. 강의 대사·농담·드라마식 일화·문제 번호 요령은 옮기지 않음.',
    '교재는 사실·표준 용어 확인용 2순위로 쓰고, 기존 교재 강조 노트는 이 세 시대에서 ‘교재 정리 더 보기’로 접어 둠.',
  ],
  corrections: H.corrections.map(c => ({ id: c.id, script_lines: c.script_lines, issue: c.issue, safe_formulation: c.safe_formulation, status: c.status, pdf_pages: c.pdf_pages, sources: c.sources, app_decision: DECISIONS[c.id] })),
  placement_rule_joseon: PLACE,
  modules,
  comic: COMIC,
};
fs.writeFileSync(path.join(ROOT, 'docs', 'lecture-source-map.json'), JSON.stringify(out, null, 1) + '\n');

const terms = {};
for (const era of Object.keys(L)) {
  const s = new Set();
  for (const g of L[era].groups) if (g.tier === 'core' || g.tier === 'target') for (const id of g.mod) for (const k of byId[id].highlight_keywords) s.add(k);
  terms[era] = [...s].sort();
}
fs.writeFileSync(path.join(ROOT, 'media', 'lecture-terms.js'), '/* 자동 생성: scripts/build_lecture_sourcemap.cjs — 직접 고치지 마세요.\n * 시대별 강의 핵심어(core·1급 보충 모듈에서 강사가 짚은 말). 요약에서 굵게 보인다. 출제 예측이 아님.\n */\nwindow.HANQ_LECTURE_TERMS=' + JSON.stringify(terms).replace(/\],"/g, '],\n"') + ';\n');
console.log('모듈 ' + H.modules.length + ' · 정정 ' + H.corrections.length + ' · 핵심어 ' + Object.entries(terms).map(([k, v]) => k + ' ' + v.length).join(', ') + ' · 웹툰 장면 ' + COMIC.scenes.length);
