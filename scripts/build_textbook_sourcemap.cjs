#!/usr/bin/env node
/* 교재 강조 매핑 → 앱 근거 파일 생성 (여러 번 실행해도 결과가 같다)
 *   node scripts/build_textbook_sourcemap.cjs [교재 매핑 JSON 경로]
 * 입력: 읽기 전용 분석 결과 hanq_all_eras_mapping.json (교재 글꼴·쪽 증거), media/textbook-notes.js (앱 학습 노트)
 * 출력: docs/textbook-source-map.json  — 개념 묶음별 쪽·굵은 글꼴 증거·검토 플래그·앱 시대 배치 (문장 원문은 담지 않음)
 *       media/textbook-terms.js       — 앱 시대별 ‘교재 굵은 글꼴 확인 용어’ 목록(요약 화면 굵게 표시용)
 * 왕 이름은 교재에서 굵어도 구조 표시(제목·표 구분)일 수 있어 굵게 표시 대상에서 뺀다.
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const SRC = process.argv[2] || '/Users/handonglee/Documents/Codex/2026-10-06/task-8/analysis/hanq_all_eras_mapping.json';
const mapping = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'media', 'textbook-notes.js'), 'utf8'), ctx);
const T = ctx.window.HANQ_TEXTBOOK;

// 교재 단원 → 앱 시대 (허용 범위)
const SECTION_TO_APP = {
  'early': ['prehistory', 'gojoseon'], 'three-kingdoms': ['samguk', 'islands'], 'north-south': ['nambuk'], 'goryeo': ['goryeo'],
  'joseon-early': ['joseon-early', 'joseon-late'], 'joseon-late': ['joseon-early', 'joseon-late', 'islands'],
  'joseon-society': ['joseon-early', 'joseon-late'], 'joseon-culture': ['joseon-early', 'joseon-late'],
  'modern-opening': ['opening'], 'colonial': ['colonial', 'islands'], 'republic': ['modern'],
  'appendix': ['islands', 'opening', 'colonial', 'modern'],
};
const MONARCHS = new Set(['태조', '혜종', '정종', '광종', '경종', '성종', '목종', '현종', '문종', '숙종', '예종', '인종', '의종', '명종', '고종', '원종', '충렬왕', '충목왕', '공민왕', '우왕', '태종', '세종', '단종', '세조', '연산군', '중종', '선조', '광해군', '인조', '효종', '영조', '정조', '순조', '헌종', '철종', '순종', '선덕여왕', '진성여왕',
  // 건국 군주·국외 황제·뒤에 왕이 된 인물 등 재위한 군주의 이름도 같은 원칙으로 뺀다
  '단군왕검', '위만', '한 무제', '대조영', '견훤', '궁예', '이성계', '김춘추']);
const isMonarch = t => MONARCHS.has(t) || /(왕|대왕)$/.test(t);

const usedBy = {};
for (const [era, v] of Object.entries(T)) for (const g of v.core) for (const id of g.src) (usedBy[id] = usedBy[id] || new Set()).add(era);

const concepts = {}, errors = [];
for (const sec of mapping.sections) {
  for (const c of sec.concepts) {
    const eras = [...(usedBy[c.id] || [])].sort();
    if (!eras.length) errors.push('앱에 배치되지 않은 개념 묶음: ' + c.id);
    for (const e of eras) if (!SECTION_TO_APP[sec.id].includes(e)) errors.push(c.id + ' → ' + e + ' 는 허용되지 않은 시대 배치');
    concepts[c.id] = {
      section: sec.id, section_title: sec.title, app_eras: eras, pdf_pages: c.pdf_pages, book_pages: c.book_pages, importance: c.importance,
      terms: c.term_emphasis.map(t => ({
        term: t.term, font_verified: t.status === 'font_verified', monarch_or_title: isMonarch(t.term),
        evidence: (t.bold_evidence || []).map(b => ({ pdf_page: b.pdf_page, book_page: b.book_page, font: b.font_name, weight: b.weight })),
      })),
      review_flags: (c.uncertainty || []).map(u => ({ pdf_page: u.pdf_page, issue: u.issue, app_decision: u.action, status: u.status })),
    };
  }
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

const out = {
  generated_by: 'scripts/build_textbook_sourcemap.cjs',
  source: { filename: mapping.source.filename, pdf_pages: mapping.source.pdf_pages, sha256: mapping.source.sha256, page_rule: mapping.source.page_number_rule },
  method: { font_method: mapping.method.font_method, bold_fonts: mapping.method.bold_fonts, visual_verified_pdf_pages: mapping.method.visual_verified_pdf_pages, limitations: mapping.method.limitations },
  policy: [
    '굵게 표시 = 교재 본문에서 실제 굵은 글꼴로 확인된 용어(font_verified). 출제 빈도 순위가 아님.',
    '증거가 비어 있는 용어는 문맥 용어로만 쓰고 굵게 표시하지 않음.',
    '재위한 군주의 이름(조선·고려 왕, ○○왕, 건국 군주 단군왕검·위만·대조영·견훤·궁예·이성계, 뒤에 왕이 된 김춘추, 국외 황제 한 무제)은 교재에서 굵어도 굵게 표시하지 않고 ‘찾기 단서’로만 씀.',
    '설명 문장은 새로 썼고 교재 문장·배치를 옮기지 않음.',
  ],
  section_to_app: SECTION_TO_APP,
  review_flags: mapping.review_flags.map(f => ({ pdf_page: f.pdf_page, issue: f.issue, app_decision: f.action, status: f.status })),
  visual_diagram_notes: mapping.visual_diagram_notes.map(v => ({ pdf_page: v.pdf_page, figure: v.figure, method: v.emphasis_method, caution: v.caution || '' })),
  concepts,
};
fs.writeFileSync(path.join(ROOT, 'docs', 'textbook-source-map.json'), JSON.stringify(out, null, 1) + '\n');

const terms = {};
for (const [era] of Object.entries(T)) terms[era] = new Set();
for (const c of Object.values(concepts)) for (const era of c.app_eras) for (const t of c.terms) if (t.font_verified && !t.monarch_or_title) terms[era].add(t.term);
const js = '/* 자동 생성: scripts/build_textbook_sourcemap.cjs — 직접 고치지 마세요.\n * 앱 시대별로, 교재 본문에서 굵은 글꼴로 확인된 용어(왕 이름 제외). 요약의 ‘핵심 개념’에서 굵게 보인다.\n */\nwindow.HANQ_TEXTBOOK_TERMS=' +
  JSON.stringify(Object.fromEntries(Object.entries(terms).map(([k, v]) => [k, [...v].sort()])), null, 0).replace(/\],"/g, '],\n"') + ';\n';
fs.writeFileSync(path.join(ROOT, 'media', 'textbook-terms.js'), js);
const n = Object.values(concepts).length, fv = Object.values(concepts).reduce((a, c) => a + c.terms.filter(t => t.font_verified).length, 0);
console.log('개념 묶음 ' + n + ' · 굵은 글꼴 확인 용어 ' + fv + ' · 시대별 굵게 표시 용어 ' + Object.entries(terms).map(([k, v]) => k + ' ' + v.size).join(', '));
