#!/usr/bin/env node
/* 조선 앱 문항 ↔ 조선 웹툰·강의 요약 대조표. 출제 비중을 추정하지 않는다(앱에 실제로 있는 문항이 화면 글에 나오는지 글자로만 대조).
 *   node scripts/build_joseon_question_map.cjs          → docs/joseon-question-map.json 을 쓴다
 *   node scripts/build_joseon_question_map.cjs --check  → 다시 계산해 파일과 다르면 종료 코드 1(아무것도 쓰지 않음)
 * 입력은 저장소 안의 파일뿐: index.html(빈칸 문항), media/past-exam-quiz.js(기출), media/joseon-all-comic.html,
 *   media/lecture-notes.js(조선 부분), docs/lecture-source-map.json(J 모듈 강조어). 시간·난수를 쓰지 않아 같은 입력이면 같은 결과.
 * status: comic_visible(펼치지 않아도 보이는 웹툰 글에 답) · comic_folded(접힌 보충에만) · summary_only(강의 요약에만) · not_found · ordering(순서 맞히기, 대조 안 함)
 * modules: 문항 글·답에 J 모듈 강조어가 들어 있으면 그 모듈(어림 연결 — 사람이 확인할 것)
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'joseon-question-map.json');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

function loadApp() {
  const html = rd('index.html');
  const body = html.match(/<script>\n  \(function\(\)\{\n([\s\S]*?)\n  \}\)\(\);\n  <\/script>/)[1];
  const ctx = { window: {} }; vm.createContext(ctx);
  for (const f of ['early-era-quiz.js', 'past-exam-quiz.js']) vm.runInContext(rd('media/' + f), ctx);
  const chaptersSrc = body.slice(body.indexOf('var chapters='), body.indexOf('var app='));
  const quizSrc = body.slice(body.indexOf('var quizzes='), body.indexOf('Object.assign(quizzes'));
  vm.runInContext(chaptersSrc + quizSrc + ';this.quizzes=quizzes;', ctx);
  return { quizzes: ctx.quizzes, mocks: ctx.window.PAST_EXAM_QUIZZES };
}

function build() {
  const { quizzes, mocks } = loadApp();
  const txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const norm = s => String(s).replace(/[\s·,와]/g, '');
  const comic = rd('media/joseon-all-comic.html');
  const main = comic.slice(comic.indexOf('<main>'), comic.indexOf('</main>'));
  const lec = rd('media/lecture-notes.js');
  const N = {
    visible: norm(txt(main.replace(/<details[\s\S]*?<\/details>/g, ' '))),
    folded: norm(txt((main.match(/<details[\s\S]*?<\/details>/g) || []).join(' '))),
    summary: norm(lec.slice(lec.indexOf("  'joseon-early':{"))),
  };
  const LS = JSON.parse(rd('docs/lecture-source-map.json'));
  const jmods = Object.keys(LS.modules).filter(id => id[0] === 'J').sort().map(id => [id, LS.modules[id].highlight_keywords.map(norm)]);
  const modsOf = text => { const t = norm(text); return jmods.filter(([, ks]) => ks.some(k => k && t.includes(k))).map(([id]) => id); };
  const out = {
    generated_by: 'scripts/build_joseon_question_map.cjs',
    note: '앱에 실제로 들어 있는 조선 문항과 웹툰·강의 요약 글의 글자 대조. 출제 비중·대표성 추정이 아님. modules는 강조어 포함 여부로 어림 연결한 것.',
    counts: {}, inline: {}, past_exam: {},
  };
  for (const era of ['joseon-early', 'joseon-late']) {
    const rows = (quizzes[era] || []).map((x, i) => {
      const ans = x.a.map(String);
      const ordering = ans.some(a => /→/.test(a));
      const hit = k => ans.map(norm).filter(Boolean).some(a => N[k].includes(a));
      const status = ordering ? 'ordering' : hit('visible') ? 'comic_visible' : hit('folded') ? 'comic_folded' : hit('summary') ? 'summary_only' : 'not_found';
      return { id: era + '#' + String(i + 1).padStart(3, '0'), q: x.q, a: ans, section: x.section || null, modules: modsOf(x.q + ' ' + ans.join(' ')), status, in_summary: ordering ? null : hit('summary') };
    });
    out.inline[era] = rows;
    const c = {}; for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
    out.counts[era] = Object.keys(c).sort().reduce((o, k) => (o[k] = c[k], o), { total: rows.length });
    out.past_exam[era] = (mocks[era] || []).map(x => ({ id: x.exam + '-' + x.number, topic: x.topic, remember: x.remember, modules: modsOf(x.topic + ' ' + x.why + ' ' + x.remember) }));
  }
  return JSON.stringify(out, null, 1) + '\n';
}

const text = build();
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== text) { console.error('docs/joseon-question-map.json 이 현재 문항·웹툰·요약과 다릅니다. node scripts/build_joseon_question_map.cjs 로 다시 만드세요.'); process.exit(1); }
  console.log('joseon-question-map.json 최신');
} else {
  fs.writeFileSync(OUT, text);
  const o = JSON.parse(text);
  console.log('조선 문항 대조:', JSON.stringify(o.counts));
}
