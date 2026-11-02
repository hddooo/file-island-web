#!/usr/bin/env node
/* 개화기 앱 문항 ↔ 개화기 웹툰·강의 요약 대조표. 출제 비중을 추정하지 않는다(앱에 실제로 있는 문항의 답이 화면 글에 나오는지 글자로만 대조).
 *   node scripts/build_opening_question_map.cjs          → docs/opening-question-map.json 을 쓴다
 *   node scripts/build_opening_question_map.cjs --check  → 다시 계산해 파일과 다르면 종료 코드 1(아무것도 쓰지 않음)
 * 입력은 저장소 안 파일뿐: index.html(빈칸 문항), media/past-exam-quiz.js(기출), media/opening-comic.html,
 *   media/lecture-notes-opening.js, docs/opening-lecture-handoff.json(O 모듈 강조어). 시간·난수를 쓰지 않는다.
 * status: comic_visible · comic_folded · summary_only · not_found · ordering(순서 맞히기, 대조 안 함)
 * modules: 문항 글·답에 O 모듈 강조어가 들어 있으면 그 모듈(어림 연결 — 사람이 확인할 것)
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'opening-question-map.json');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const ERA = 'opening';

function loadApp() {
  const html = rd('index.html');
  const body = html.match(/<script>\n  \(function\(\)\{\n([\s\S]*?)\n  \}\)\(\);\n  <\/script>/)[1];
  const ctx = { window: {} }; vm.createContext(ctx);
  for (const f of ['early-era-quiz.js', 'past-exam-quiz.js']) vm.runInContext(rd('media/' + f), ctx);
  const chaptersSrc = body.slice(body.indexOf('var chapters='), body.indexOf('var app='));
  const quizSrc = body.slice(body.indexOf('var quizzes='), body.indexOf('Object.assign(quizzes'));
  vm.runInContext(chaptersSrc + quizSrc + ';this.quizzes=quizzes;', ctx);
  Object.assign(ctx.quizzes, ctx.window.EARLY_ERA_QUIZZES || {});
  return { quizzes: ctx.quizzes, mocks: ctx.window.PAST_EXAM_QUIZZES };
}

function build() {
  const { quizzes, mocks } = loadApp();
  const txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const norm = s => String(s).replace(/[\s·,와]/g, '');
  const comic = rd('media/opening-comic.html');
  const main = comic.slice(comic.indexOf('<main>'), comic.indexOf('</main>'));
  // 웹툰은 세 부분의 상세 만화를 통째로 접어 두므로(펼치면 장면 본문), 장면 안의 접힌 보충(details.scene-more)만 ‘접힘’으로 센다
  const MORE = /<details class="scene-more">[\s\S]*?<\/details>/g;
  const N = {
    visible: norm(txt(main.replace(MORE, ' ').replace(/<script[\s\S]*?<\/script>/g, ' '))),
    folded: norm(txt((main.match(MORE) || []).join(' '))),
    summary: norm(rd('media/lecture-notes-opening.js')),
  };
  const H = JSON.parse(rd('docs/opening-lecture-handoff.json'));
  const omods = H.modules.map(m => [m.id, m.highlight_keywords.map(norm)]);
  const modsOf = text => { const t = norm(text); return omods.filter(([, ks]) => ks.some(k => k && t.includes(k))).map(([id]) => id); };
  const rows = (quizzes[ERA] || []).map((x, i) => {
    const ans = x.a.map(String);
    const ordering = ans.some(a => /→/.test(a));
    const hit = k => ans.map(norm).filter(Boolean).some(a => N[k].includes(a));
    const status = ordering ? 'ordering' : hit('visible') ? 'comic_visible' : hit('folded') ? 'comic_folded' : hit('summary') ? 'summary_only' : 'not_found';
    return { id: ERA + '#' + String(i + 1).padStart(3, '0'), q: x.q, a: ans, section: x.section || null, modules: modsOf(x.q + ' ' + ans.join(' ')), status, in_summary: ordering ? null : hit('summary') };
  });
  const c = {}; for (const r of rows) c[r.status] = (c[r.status] || 0) + 1;
  const out = {
    generated_by: 'scripts/build_opening_question_map.cjs',
    note: '앱에 실제로 들어 있는 개화기 문항과 웹툰·강의 요약 글의 글자 대조. 출제 비중·대표성 추정이 아님. modules는 강조어 포함 여부로 어림 연결한 것. comic_visible = 세 부분 상세 만화를 펼친 상태의 장면 본문·덩어리 목록, comic_folded = 장면 안 접힌 보충(scene-more)에만 있음.',
    counts: Object.keys(c).sort().reduce((o, k) => (o[k] = c[k], o), { total: rows.length }),
    inline: rows,
    past_exam: (mocks[ERA] || []).map(x => ({ id: x.exam + '-' + x.number, topic: x.topic, remember: x.remember, modules: modsOf(x.topic + ' ' + x.why + ' ' + x.remember) })),
  };
  return JSON.stringify(out, null, 1) + '\n';
}

const text = build();
if (process.argv.includes('--check')) {
  const cur = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  if (cur !== text) { console.error('docs/opening-question-map.json 이 현재 문항·웹툰·요약과 다릅니다. node scripts/build_opening_question_map.cjs 로 다시 만드세요.'); process.exit(1); }
  console.log('opening-question-map.json 최신');
} else {
  fs.writeFileSync(OUT, text);
  console.log('개화기 문항 대조:', JSON.stringify(JSON.parse(text).counts));
}
