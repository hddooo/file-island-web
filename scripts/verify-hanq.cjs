#!/usr/bin/env node
/* 한국사 한눈에 · 로컬 검증 (배포 파일 아님: .vercelignore로 제외)
 *   node scripts/verify-hanq.cjs [기준본 경로]
 * 기준본(기본값 ../joseon-baseline)과 비교해 원본 데이터·장면 보존, 통합 조선시대, 장면 번호, 용어 풀이를 검사한다.
 * DOM 동작 검사는 jsdom이 있을 때만 실행한다: JSDOM_PATH=/path/to/node_modules/jsdom node scripts/verify-hanq.cjs
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), assert = require('assert/strict');
const ROOT = path.resolve(__dirname, '..');
// Legacy scene/tier contracts apply to the original comic. New source-backed
// cuts and gallery are independently checked by test-study-renewal.cjs.
function legacyComic(s){return s.replace(/<!--STUDY-ENRICHMENT-->[\s\S]*?<!--END-STUDY-ENRICHMENT-->/g,'');}
const BASE = path.resolve(process.argv[2] || path.join(ROOT, '..', 'joseon-baseline'));
let failures = 0, checks = 0;
function ok(cond, msg) { checks++; if (!cond) { failures++; console.log('  ✗ ' + msg); } }
function section(t) { console.log('\n■ ' + t); }

function loadData(root) {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const m = html.match(/<script>\n  \(function\(\)\{\n([\s\S]*?)\n  \}\)\(\);\n  <\/script>/);
  const body = m[1];
  const ctx = { window: {} }; vm.createContext(ctx);
  for (const f of ['early-era-quiz.js', 'past-exam-quiz.js']) vm.runInContext(fs.readFileSync(path.join(root, 'media', f), 'utf8'), ctx);
  const chaptersSrc = body.slice(body.indexOf('var chapters='), body.indexOf('var app='));
  const quizSrc = body.slice(body.indexOf('var quizzes='), body.indexOf('Object.assign(quizzes'));
  vm.runInContext(chaptersSrc + quizSrc + ';this.chapters=chapters;this.quizzes=quizzes;', ctx);
  Object.assign(ctx.quizzes, ctx.window.EARLY_ERA_QUIZZES || {});
  return { html, chapters: ctx.chapters, quizzes: ctx.quizzes, mocks: ctx.window.PAST_EXAM_QUIZZES };
}
const sample = len => { const c = Math.min(20, len); return Array.from({ length: c }, (_, i) => Math.floor(i * len / c)); };
const J = x => JSON.stringify(x);

const cur = loadData(ROOT), base = fs.existsSync(path.join(BASE, 'index.html')) ? loadData(BASE) : null;
if (!base) console.log('(기준본 없음: ' + BASE + ' — 비교 검사는 건너뜀)');

section('1. 조선시대 통합 · 데이터 보존');
const visible = cur.chapters.filter(c => c.active && !c.hidden);
ok(visible.filter(c => /^조선/.test(c.title)).length === 1 && visible.some(c => c.id === 'joseon' && c.title === '조선시대'), '목차에 조선 카드는 “조선시대” 하나');
ok(!visible.some(c => c.id === 'joseon-early' || c.id === 'joseon-late'), '전기·후기 카드는 목차에서 숨김');
const early = cur.chapters.find(c => c.id === 'joseon-early'), late = cur.chapters.find(c => c.id === 'joseon-late');
ok(early && late && early.partOf === 'joseon' && late.partOf === 'joseon', '전기·후기 장은 통합 장의 부분(옛 경로 별칭)으로 유지');
ok(early.note.length + late.note.length === 14, '요약 카드 5+9=14개 (' + (early.note.length + late.note.length) + ')');
ok((cur.quizzes['joseon-early'] || []).length === 33 && (cur.quizzes['joseon-late'] || []).length === 140, '빈칸 원본 풀 33+140');
ok((cur.mocks['joseon-early'] || []).length === 5 && (cur.mocks['joseon-late'] || []).length === 5, '기출 5+5');
if (base) {
  for (const c of base.chapters) {
    const n = cur.chapters.find(x => x.id === c.id);
    ok(n && J(n.note) === J(c.note) && n.memory === c.memory && n.title === c.title && n.desc === c.desc, '요약 노트 원문 보존: ' + c.id);
  }
  ok(J(Object.keys(base.quizzes).sort()) === J(Object.keys(cur.quizzes).sort()), '빈칸 풀 목록 동일');
  for (const k of Object.keys(base.quizzes)) ok(J(base.quizzes[k]) === J(cur.quizzes[k]), '빈칸 풀 원본 동일: ' + k);
  ok(J(base.mocks) === J(cur.mocks), '기출 데이터 동일');
  const sel = id => sample(base.quizzes[id].length).map(i => base.quizzes[id][i].q);
  console.log('  · 원래 고른 20문항: 전기 ' + sel('joseon-early').length + ' + 후기 ' + sel('joseon-late').length);
}
ok(/#chapter\/\(\[\^\/\]\+\)\/\(webtoon\|summary\|quiz\|mock\)/.test(cur.html.replace(/\\\//g, '/')) || cur.html.includes("location.hash.match(/^#chapter\\/([^/]+)\\/(webtoon|summary|quiz|mock|review|culture)$/)"), '해시 경로 형식 유지');

section('2. 웹툰 장면 · 번호 · 자산');
const COMICS = ['prehistory', 'gojoseon', 'samguk', 'nambuk', 'goryeo', 'joseon', 'joseon-late', 'islands', 'opening', 'colonial', 'modern'];
// 강의 강조로 다시 엮은 웹툰(이 네 파일만 기준본과 달라도 됨 — 대신 7번 검사로 확인)
const LECTURE_COMICS = new Set(['goryeo-comic.html', 'joseon-comic.html', 'joseon-late-comic.html', 'joseon-all-comic.html']);
const LMAP = fs.existsSync(path.join(ROOT, 'docs', 'lecture-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'lecture-comic-map.json'), 'utf8')) : { scenes: [], art_needed: [] };
const LEC_COUNT = {}; for (const x of LMAP.scenes) if (x.scene) LEC_COUNT[x.file] = (LEC_COUNT[x.file] || 0) + 1;
// 개화기는 별도 생성기·장면 지도로 다시 엮었다(기준본과 달라도 됨 — 대신 10번 검사로 확인)
const OMAP = fs.existsSync(path.join(ROOT, 'docs', 'opening-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'opening-comic-map.json'), 'utf8')) : { scenes: [], art_needed: [] };
const OPENING_COUNT = OMAP.scenes.filter(x => x.scene).length;
// 독도와 간도도 별도 생성기·장면 지도로 두 주제를 다시 엮었다(기준본과 달라도 됨 — 대신 11번 검사로 확인)
const IMAP = fs.existsSync(path.join(ROOT, 'docs', 'islands-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'islands-comic-map.json'), 'utf8')) : { scenes: [], memory: [] };
// 일제 강점기도 별도 생성기·장면 지도로 네 흐름을 다시 엮었다(기준본과 달라도 됨 — 대신 12번 검사로 확인)
const CMAP = fs.existsSync(path.join(ROOT, 'docs', 'colonial-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'colonial-comic-map.json'), 'utf8')) : { scenes: [], memory: [], panel_source: { panels: {} } };
// 광복과 대한민국(현대사)도 별도 생성기·장면 지도로 다섯 흐름을 엮었다(기준본과 달라도 됨 — 대신 13번 검사로 확인)
const MMAP = fs.existsSync(path.join(ROOT, 'docs', 'modern-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'modern-comic-map.json'), 'utf8')) : { scenes: [], memory: [], panel_source: { panels: {} } };
// 선사시대도 별도 생성기·장면 지도로 네 흐름을 엮었다(기준본과 달라도 됨 — 대신 14번 검사로 확인)
const PMAP = fs.existsSync(path.join(ROOT, 'docs', 'prehistory-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'prehistory-comic-map.json'), 'utf8')) : { scenes: [], memory: [] };
// 고조선과 여러 나라도 별도 생성기·장면 지도로 두 흐름을 엮었다(기준본과 달라도 됨 — 대신 15번 검사로 확인)
const GJMAP = fs.existsSync(path.join(ROOT, 'docs', 'gojoseon-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'gojoseon-comic-map.json'), 'utf8')) : { scenes: [], memory: [] };
// 남북국 시대도 별도 생성기·장면 지도로 네 흐름을 엮었다(기준본과 달라도 됨 — 대신 16번 검사로 확인). 품었던 그림판은 media/nambuk-sheets/로 옮김
const NMAP = fs.existsSync(path.join(ROOT, 'docs', 'nambuk-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'nambuk-comic-map.json'), 'utf8')) : { scenes: [], memory: [], panel_source: { sheets: {} } };
// 삼국시대도 같은 방식으로 네 흐름을 엮었다(기준본과 달라도 됨 — 대신 17번 검사로 확인). 품었던 그림판은 media/samguk-sheets/로 옮김
const SGMAP = fs.existsSync(path.join(ROOT, 'docs', 'samguk-comic-map.json')) ? JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'samguk-comic-map.json'), 'utf8')) : { scenes: [], memory: [], panel_source: { sheets: {} } };
const SCENE =/<section class="scene"[\s\S]*?<\/section>/g;
const strip = s => s.replace(/<\/?a\b[^>]*>/g, '').replace(/data:[a-z/+]+;base64,[A-Za-z0-9+/=]+/g, '').replace(/<span[^>]*data-scene-count[^>]*>[^<]*<\/span>/g, '').replace(/<[^>]+>/g, ' ').replace(/\b\d\d \/ \d\d\b/g, ' ').replace(/(class="meta">|^|\s)\d\d ·/g, ' ·').replace(/\s+/g, ' ').trim();
const counts = {};
for (const name of COMICS) {
  const file = name + '-comic.html';
  const s = legacyComic(fs.readFileSync(path.join(ROOT, 'media', file), 'utf8'));
  const scenes = s.match(SCENE) || [];
  counts[name] = scenes.length;
  const ids = [...s.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  ok(new Set(ids).size === ids.length, file + ': id 중복 없음');
  ok((s.match(/data-scene-count/g) || []).length === scenes.length, file + ': 장면마다 동적 번호 1개');
  ok(s.includes('comic-scenes.js') && s.includes('glossary-data.js') && s.includes('data-auto="comic"'), file + ': 공용 스크립트 연결');
  ok(!/\b\d\d \/ 32\b/.test(s.replace(/<span[^>]*data-scene-count[^>]*>[^<]*<\/span>/g, '')) || name === 'samguk' || name === 'nambuk' ? true : false, file + ': 고정 “/ 32” 없음');
  const statics = [...s.matchAll(/<span[^>]*data-scene-count( data-format="n")?>([^<]*)<\/span>/g)].map(m => m[2]);
  ok(statics.every((t, i) => t.startsWith(String(i + 1).padStart(2, '0'))) && statics.every(t => !t.includes('/') || t.endsWith(' / ' + String(scenes.length).padStart(2, '0'))), file + ': 정적 번호도 실제 순서·전체 수와 일치');
  for (const m of s.matchAll(/(?:src|href)="([^"#:]+\.(?:webp|png|js|html))"/g)) ok(fs.existsSync(path.join(ROOT, 'media', m[1])), file + ': 자산 존재 ' + m[1]);
  for (const m of s.matchAll(/url\(["']?([^"')]+\.png)["']?\)/g)) ok(fs.existsSync(path.join(ROOT, 'media', m[1])), file + ': 배경 그림 존재 ' + m[1]);
  if (base && LECTURE_COMICS.has(file)) {
    ok(scenes.length === LEC_COUNT[file], file + ': 강의 구성 장면 수 = 장면 지도(' + LEC_COUNT[file] + ')');
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (강의 구성 · 7번 검사)');
  } else if (base && file === 'opening-comic.html') {
    ok(scenes.length === OPENING_COUNT && OPENING_COUNT > 0, file + ': 개화기 강의 구성 장면 수 = 개화기 장면 지도(' + OPENING_COUNT + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (개화기 강의 구성 · 10번 검사)');
  } else if (base && file === 'islands-comic.html') {
    ok(scenes.length === 7 && IMAP.scenes.length === 7, file + ': 두 주제 구성 장면 7개 = 장면 지도(' + IMAP.scenes.length + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (두 주제 구성 · 11번 검사)');
  } else if (base && file === 'colonial-comic.html') {
    ok(scenes.length === 18 && CMAP.scenes.length === 18, file + ': 네 흐름 구성 장면 18개 = 장면 지도(' + CMAP.scenes.length + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (네 흐름 구성 · 12번 검사)');
  } else if (base && file === 'modern-comic.html') {
    ok(scenes.length === 18 && MMAP.scenes.length === 18, file + ': 다섯 흐름 구성 장면 18개 = 장면 지도(' + MMAP.scenes.length + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (다섯 흐름 구성 · 13번 검사)');
  } else if (base && file === 'prehistory-comic.html') {
    ok(scenes.length === 12 && PMAP.scenes.length === 12, file + ': 네 흐름 구성 장면 12개 = 장면 지도(' + PMAP.scenes.length + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (네 흐름 구성 · 14번 검사)');
  } else if (base && file === 'gojoseon-comic.html') {
    ok(scenes.length === 12 && GJMAP.scenes.length === 12, file + ': 두 흐름 구성 장면 12개 = 장면 지도(' + GJMAP.scenes.length + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (두 흐름 구성 · 15번 검사)');
  } else if (base && file === 'nambuk-comic.html') {
    ok(scenes.length === 32 && NMAP.scenes.length === 32, file + ': 네 흐름 구성 장면 32개 = 장면 지도(' + NMAP.scenes.length + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (네 흐름 구성 · 16번 검사)');
  } else if (base && file === 'samguk-comic.html') {
    ok(scenes.length === 32 && SGMAP.scenes.length === 32, file + ': 네 흐름 구성 장면 32개 = 장면 지도(' + SGMAP.scenes.length + ')');
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (네 흐름 구성 · 17번 검사)');
  } else if (base && /data-orig="1"/.test(fs.readFileSync(path.join(BASE, 'media', file), 'utf8'))) {
    // 기준본이 이미 장면 보강이 반영된 공개본이면 웹툰은 바이트 단위로 같아야 한다
    ok(fs.readFileSync(path.join(BASE, 'media', file), 'utf8') === s, file + ': 기준본(공개본)과 바이트 동일');
    console.log('  · ' + file.padEnd(24) + scenes.length + ' (기준본과 동일)');
  } else if (base) {
    const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8');
    const bs = b.match(SCENE) || [];
    const origs = scenes.filter(x => /data-orig="/.test(x));
    ok(origs.length === bs.length, file + ': 원래 장면 ' + bs.length + '개 모두 유지');
    bs.forEach((sc, i) => { const n = origs[i] || ''; ok(strip(n.replace(/ data-orig="\d+"/, '')) === strip(sc), file + ': 원래 장면 ' + (i + 1) + ' 글 그대로'); });
    for (const m of b.matchAll(/\sid="([^"]+)"/g)) ok(ids.includes(m[1]), file + ': 원래 앵커 유지 #' + m[1]);
    for (const m of b.matchAll(/(?:class="(?:bridge-text|story-seam-text)">|<div class="story-link"><span class="dots" aria-hidden="true">…<\/span><p>)([^<]+)</g)) ok(s.includes(m[1]), file + ': 원래 연결 문장 유지 “' + m[1].slice(0, 18) + '…”');
    console.log('  · ' + file.padEnd(24) + bs.length + ' → ' + scenes.length);
  }
}
const all = legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-all-comic.html'), 'utf8'));
const allScenes = all.match(SCENE) || [];
ok(allScenes.length === counts['joseon'] + counts['joseon-late'], '통합 웹툰 장면 = 전기 + 후기 (' + allScenes.length + ')');
const allIds = [...all.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
ok(new Set(allIds).size === allIds.length, '통합 웹툰 id 중복 없음');
for (const f of ['joseon-comic.html', 'joseon-late-comic.html']) {
  const s = legacyComic(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8'));
  for (const m of s.matchAll(/<section class="scene"[^>]*\sid="([^"]+)"/g)) ok(allIds.includes(m[1]), '통합 웹툰에 장면 앵커 #' + m[1]);
  for (const m of s.matchAll(/<b>([^<]+)<\/b><span>([^<]+)<\/span>/g)) ok(all.includes('<span>' + m[2] + '</span>'), '통합 웹툰에 대사 보존: ' + m[2].slice(0, 16));
}
ok(!/<iframe/i.test(all), '통합 웹툰 안에 iframe 없음(이중 스크롤 없음)');
ok(all.includes('id="early-part"') && all.includes('id="late-part"'), '통합 웹툰 1부·2부 앵커');
console.log('  · joseon-all-comic.html  ' + allScenes.length);

section('3. 용어 풀이 데이터');
const gctx = { window: {} }; vm.createContext(gctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'media', 'glossary-data.js'), 'utf8'), gctx);
const G = gctx.window.HANQ_GLOSSARY;
ok(Array.isArray(G) && G.length > 0, '용어 ' + G.length + '개');
ok(new Set(G.map(e => e.id)).size === G.length, '용어 id 중복 없음');
for (const e of G) {
  ok(e.short && e.short.length <= 60, '짧은 뜻 길이(60자 이하): ' + e.term);
  ok(e.sources.length > 0 && e.sources.every(x => /^https?:\/\/(encykorea\.aks\.ac\.kr|contents\.history\.go\.kr)\//.test(x.url)), '공식 출처 URL: ' + e.term);
}
const report = fs.readFileSync(path.join(ROOT, 'docs', 'glossary-verification.md'), 'utf8');
for (const e of G) for (const x of e.sources) ok(report.includes(x.url), '검증 기록에 출처 기록: ' + e.term + ' ' + x.url);
const dg = G.find(e => e.id === 'daedong');
ok(/공납/.test(dg.short) && /토지/.test(dg.short) && /쌀/.test(dg.short) && /(베|포)/.test(dg.short), '대동법 짧은 뜻: 공납→토지 기준→쌀·베·동전');
// 프로젝트 글 어디에 나오는지
const prose = [cur.html, ...COMICS.map(n => fs.readFileSync(path.join(ROOT, 'media', n + '-comic.html'), 'utf8').replace(/data:[^"')]+/g, '')), fs.readFileSync(path.join(ROOT, 'media', 'study-notes.js'), 'utf8')].join('\n');
const unused = G.filter(e => !(e.match || [e.term]).some(m => prose.includes(m)));
ok(unused.length === 0, '모든 용어가 실제 본문에 등장 (미등장: ' + unused.map(e => e.term).join(',') + ')');

section('3b. 검토 반영 회귀 검사');
ok(G.every(e => e.sources.every(x => x.url.startsWith('https://'))), '모든 출처가 https 공식 주소');
ok(G.find(e => e.id === 'hwanguk').sources.some(x => x.url === 'https://encykorea.aks.ac.kr/Article/E0002637'), '환국 출처 E0002637(https)');
for (const id of ['yullyeong', 'taehak']) ok(G.some(e => e.id === id), '삼국 용어 추가: ' + id);
{ const sctx = { window: {} }; vm.createContext(sctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'media', 'study-notes.js'), 'utf8'), sctx); const S = sctx.window.HANQ_STUDY;
  const find = (era, t) => S[era].flow.find(f => f.t === t) || {};
  ok(!find('gojoseon', '위만 집권').cause && !JSON.stringify(S.gojoseon.flow).includes("cause:'연의"), '고조선: 진개 침략을 위만 집권의 원인으로 표시하지 않음');
  ok(!S.gojoseon.flow.some(f => (f.cause || '').includes('진개')), '고조선: 진개는 원인 칸에 없음');
  ok(S.goryeo.flow.some(f => /1차: 서희 담판으로 강동 6주/.test(f.change) && !f.result), '고려: 강동 6주는 1차 서희에 직접');
  ok(!S.nambuk.flow.some(f => (f.result || '').includes('정전')), '남북국: 정전을 신문왕의 결과로 두지 않음');
  ok(!S.colonial.flow.some(f => /경찰|치안유지법/.test(f.change) && /산미/.test(f.result || '')), '일제: 산미증식은 경찰·치안유지법의 결과가 아님');
  ok(!S.colonial.flow.some(f => /독립군|광복군/.test(f.change) && /총동원/.test(f.result || '')), '일제: 총동원은 무장 투쟁의 결과가 아님');
  ok(S.modern.compare.some(p => p.tip === '8차 간선·7년 단임 → 9차 직선·5년 단임'), '현대: 8차·9차 구분 문구');
  ok(!S['joseon-early'].flow.some(f => /세종/.test(f.result || '')), '조선 전기: 세종을 태종 정비의 결과로 두지 않음');
}
ok(!/baseline/.test(fs.readFileSync(path.join(ROOT, 'scripts', 'build_comics.py'), 'utf8')), '웹툰 생성 스크립트는 기준본 경로에 의존하지 않음');

section('5. 조선 웹툰 장면 그림 (칸별 PNG)');
{
  const zlib = require('zlib'), crypto = require('crypto');
  function readPng(file) {
    const b = fs.readFileSync(file); let p = 8, w, h, ct, idat = [];
    while (p < b.length) { const len = b.readUInt32BE(p), t = b.toString('ascii', p + 4, p + 8), body = b.subarray(p + 8, p + 8 + len);
      if (t === 'IHDR') { w = body.readUInt32BE(0); h = body.readUInt32BE(4); ct = body[9]; if (body[8] !== 8 || (ct !== 2 && ct !== 6) || body[12]) throw new Error('지원 안 되는 PNG ' + file); }
      if (t === 'IDAT') idat.push(body); if (t === 'IEND') break; p += 12 + len; }
    const bpp = ct === 2 ? 3 : 4, stride = w * bpp, raw = zlib.inflateSync(Buffer.concat(idat)), rows = []; let prev = Buffer.alloc(stride), i = 0;
    for (let y = 0; y < h; y++) { const f = raw[i], line = Buffer.from(raw.subarray(i + 1, i + 1 + stride)); i += 1 + stride;
      for (let x = 0; x < stride; x++) { const a = x >= bpp ? line[x - bpp] : 0, bb = prev[x], c = x >= bpp ? prev[x - bpp] : 0;
        if (f === 1) line[x] = (line[x] + a) & 255; else if (f === 2) line[x] = (line[x] + bb) & 255; else if (f === 3) line[x] = (line[x] + ((a + bb) >> 1)) & 255;
        else if (f === 4) { const q = a + bb - c, pa = Math.abs(q - a), pb = Math.abs(q - bb), pc = Math.abs(q - c); line[x] = (line[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? bb : c)) & 255; } }
      rows.push(bpp === 3 ? line : Buffer.from(Array.from({ length: w * 3 }, (_, k) => line[Math.floor(k / 3) * 4 + k % 3]))); prev = line; }
    return { w, h, rows };
  }
  const gut = (r, x) => { const a = r[x * 3], b = r[x * 3 + 1], c = r[x * 3 + 2]; return Math.min(a, b, c) > 200 && Math.max(a, b, c) - Math.min(a, b, c) < 45; };
  const man = JSON.parse(fs.readFileSync(path.join(ROOT, 'media', 'joseon-panels', 'manifest.json'), 'utf8'));
  const sheets = { 'joseon-story-grid.png': 'early', 'joseon-late-panels.png': 'late' };
  for (const [sheet, prefix] of Object.entries(sheets)) {
    const m = man[sheet]; ok(m && m.panels.length === 12, sheet + ': 칸 12개');
    const srcBuf = fs.readFileSync(path.join(ROOT, 'media', sheet));
    ok(crypto.createHash('sha256').update(srcBuf).digest('hex') === m.source_sha256, sheet + ': 원본 그림판 변경 없음(목록 해시)');
    if (base) ok(Buffer.compare(srcBuf, fs.readFileSync(path.join(BASE, 'media', sheet))) === 0, sheet + ': 기준본 그림판과 바이트 동일');
    const src = readPng(path.join(ROOT, 'media', sheet));
    ok(src.w === m.source_size[0] && src.h === m.source_size[1], sheet + ': 크기 ' + src.w + '×' + src.h);
    for (const pn of m.panels) {
      const img = readPng(path.join(ROOT, 'media', 'joseon-panels', pn.file));
      ok(img.w === pn.w && img.h === pn.h, pn.file + ': 크기 ' + pn.w + '×' + pn.h);
      const crop = Buffer.concat(src.rows.slice(pn.y, pn.y + pn.h).map(r => r.subarray(pn.x * 3, (pn.x + pn.w) * 3)));
      const got = Buffer.concat(img.rows);
      ok(Buffer.compare(crop, got) === 0, pn.file + ': 그림판 (' + pn.x + ',' + pn.y + ') 영역과 픽셀 완전 일치(무손실)');
      ok(crypto.createHash('sha256').update(got).digest('hex') === pn.pixels_sha256, pn.file + ': 픽셀 해시 = 목록');
      // 경계 바로 바깥은 칸 사이 여백, 안쪽 첫 줄은 그림(이웃 칸 띠가 섞이지 않음)
      const g = (r, x, loose) => loose ? (() => { const a = r[x * 3], b = r[x * 3 + 1], c = r[x * 3 + 2]; return Math.min(a, b, c) > 150 && (a + b + c) / 3 > 210; })() : gut(r, x);
      const rowFrac = (y, loose) => { let n = 0, t = 0; for (let x = pn.x; x < pn.x + pn.w; x += 2) { t++; n += g(src.rows[y], x, loose); } return n / t; };
      const colFrac = (x, loose) => { let n = 0, t = 0; for (let y = pn.y; y < pn.y + pn.h; y += 2) { t++; n += g(src.rows[y], x, loose); } return n / t; };
      const sides = [['위', pn.y - 1, pn.y, rowFrac], ['아래', pn.y + pn.h, pn.y + pn.h - 1, rowFrac], ['왼쪽', pn.x - 1, pn.x, colFrac], ['오른쪽', pn.x + pn.w, pn.x + pn.w - 1, colFrac]];
      for (const [nm, out, inn, fr] of sides) {
        const lim = fr === rowFrac ? src.h : src.w;
        const dir = out > inn ? 1 : -1, outs = [0, 1, 2].map(k => out + dir * k).filter(v => v >= 0 && v < lim);
        if (outs.length) ok(outs.some(v => fr(v, true) > .5), pn.file + ': ' + nm + ' 경계 바깥 3px 안에 칸 사이 여백 줄(이웃 칸과 분리)');
        ok(fr(inn) <= .5, pn.file + ': ' + nm + ' 경계 안쪽은 그림');
      }
    }
    // 예전 균등 격자 가정이 실제 칸과 얼마나 어긋났는지 기록(후기 7번 장면의 아래 띠)
    const p7 = m.panels[6], ideal = { y0: Math.round(2 * src.h / 4), y1: Math.round(3 * src.h / 4) };
    console.log('  · ' + sheet + ' 실제 칸 높이: ' + [0, 3, 6, 9].map(i => m.panels[i].h).join('/') + ' · 너비: ' + [0, 1, 2].map(i => m.panels[i].w).join('/') + ' · 예전 7번 창 y' + ideal.y0 + '–' + ideal.y1 + ' ↔ 실제 y' + p7.y + '–' + (p7.y + p7.h - 1));
  }
  // HTML: 장면마다 칸 그림 1장, 원래 장면은 기준본과 같은 칸
  const cellOf = st => { const x = parseFloat(/--x:([\d.]+)%/.exec(st)[1]), y = parseFloat(/--y:([\d.]+)%/.exec(st)[1]); return Math.round(y / (100 / 3)) * 3 + Math.round(x / 50) + 1; };
  const byFile = {}; for (const [sheet, prefix] of Object.entries(sheets)) for (const pn of man[sheet].panels) byFile[prefix + '-' + String(pn.scene).padStart(2, '0')] = pn;
  for (const [file, prefix, total] of [['joseon-comic.html', 'early', LEC_COUNT['joseon-comic.html']], ['joseon-late-comic.html', 'late', LEC_COUNT['joseon-late-comic.html']], ['joseon-all-comic.html', null, LEC_COUNT['joseon-all-comic.html']]]) {
    const s = legacyComic(fs.readFileSync(path.join(ROOT, 'media', file), 'utf8')), scenes = s.match(SCENE) || [];
    ok(scenes.length === total, file + ': 장면 ' + total);
    ok(s.includes('hanq-panel-images') && /\.scene\{opacity:1!important;transform:none!important;content-visibility:visible!important\}/.test(s), file + ': 늦게 불러와도 장면이 숨지 않음(페이드·content-visibility 해제)');
    ok(/\.art\.panel-img\{aspect-ratio:auto!important;height:auto!important/.test(s) && /\.art\.panel-img>img\{display:block;width:100%;height:auto/.test(s), file + ': 그림은 너비 100%·높이 자동(고유 비율)');
    ok(!/style="[^"]*background-(?:size|position)/.test(s) && !s.includes('그림 확대)'), file + ': 확대 자르기 없음, “다시 사용”으로 표기');
    scenes.forEach((sc, i) => {
      const imgs = [...sc.matchAll(/<div class="art(?: late)? panel-img" role="group" aria-label="[^"]*" data-panel="([a-z]+-\d\d)"><img src="joseon-panels\/([a-z]+-\d\d)\.png" width="(\d+)" height="(\d+)" alt="" decoding="async" loading="(?:eager|lazy)">/g)];
      ok(imgs.length === 1, file + ' 장면 ' + (i + 1) + ': 칸 그림 1장');
      if (!imgs.length) return;
      const [, dp, fsrc, w, h] = imgs[0], pn = byFile[fsrc];
      ok(dp === fsrc && pn && +w === pn.w && +h === pn.h, file + ' 장면 ' + (i + 1) + ': width/height = 실제 칸 크기');
      for (const W of [320, 375, 560]) { const H = W * pn.h / pn.w; ok(Math.abs(H - W * (+h) / (+w)) < .01, file + ' 장면 ' + (i + 1) + ': ' + W + 'px 너비에서 높이 ' + H.toFixed(1) + 'px(원래 비율)'); }
    });
    if (LECTURE_COMICS.has(file)) {
      // 강의 구성: 칸 그림·크기는 위에서, 장면·모듈 배치는 7번에서 확인
    } else if (base && prefix && /data-orig="1"/.test(fs.readFileSync(path.join(BASE, 'media', file), 'utf8'))) {
      ok(fs.readFileSync(path.join(BASE, 'media', file), 'utf8') === s, file + ': 칸 그림 연결이 기준본(공개본)과 동일');
    } else if (base && prefix) {
      const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8'), bs = b.match(SCENE) || [];
      const origs = scenes.filter(x => /data-orig="/.test(x));
      bs.forEach((sc, i) => { const st = /style="(--x:[^"]+)"/.exec(sc); const want = prefix + '-' + String(cellOf(st[1])).padStart(2, '0'); const got = (/data-panel="([^"]+)"/.exec(origs[i] || '') || [])[1]; ok(got === want, file + ': 원래 장면 ' + (i + 1) + ' → ' + want + ' (기준본 그림 위치와 같은 칸)'); });
    }
  }
  const allS = legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-all-comic.html'), 'utf8'));
  for (const f of ['joseon-comic.html', 'joseon-late-comic.html']) { const s = legacyComic(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8'));
    for (const sc of s.match(SCENE)) { const id = /\sid="([^"]+)"/.exec(sc), dp = /data-panel="([^"]+)"/.exec(sc)[1]; if (id) ok(new RegExp('id="' + id[1] + '"[^>]*>[\\s\\S]*?data-panel="' + dp + '"').test(allS), '통합 웹툰 #' + id[1] + ' 같은 칸 그림 ' + dp); } }
}

section('6. 교재 강조 개념 요약 (데이터)');
const TB = (() => { const c = { window: {} }; vm.createContext(c); for (const f of ['textbook-notes.js', 'textbook-terms.js', 'study-notes.js']) vm.runInContext(legacyComic(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8')), c); return { notes: c.window.HANQ_TEXTBOOK, terms: c.window.HANQ_TEXTBOOK_TERMS, study: c.window.HANQ_STUDY }; })();
const SMAP = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'textbook-source-map.json'), 'utf8'));
const LEC = (() => { const c = { window: {} }; vm.createContext(c); for (const f of ['lecture-notes.js', 'lecture-terms.js', 'lecture-notes-opening.js', 'lecture-terms-opening.js']) vm.runInContext(legacyComic(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8')), c); return { notes: c.window.HANQ_LECTURE, terms: c.window.HANQ_LECTURE_TERMS }; })();
const LSRC = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'lecture-source-map.json'), 'utf8'));
const APP_ERAS = cur.chapters.filter(c => !c.parts).map(c => c.id);
{
  const nz = x => String(x).replace(/\s/g, '');
  ok(J(Object.keys(TB.notes).sort()) === J(APP_ERAS.slice().sort()), '교재 노트가 앱의 모든 시대(' + APP_ERAS.length + ')를 다룸');
  const ids = Object.keys(SMAP.concepts);
  ok(ids.length === 145, '교재 매핑 개념 묶음 145개');
  const used = new Set(Object.values(TB.notes).flatMap(v => v.core.flatMap(g => g.src)));
  ok(ids.every(i => used.has(i)), '교재 개념 묶음 145개 모두 핵심 개념에 배치 (빠짐: ' + ids.filter(i => !used.has(i)).join(',') + ')');
  for (const sec of ['joseon-early', 'joseon-late', 'joseon-society', 'joseon-culture']) { const n = ids.filter(i => SMAP.concepts[i].section === sec); ok(n.length && n.every(i => SMAP.concepts[i].app_eras.some(e => e === 'joseon-early' || e === 'joseon-late')), '조선 ' + sec + ' ' + n.length + '묶음 모두 전기/후기에 배치'); }
  ok(ids.filter(i => /^joseon-/.test(i)).length === 47, '조선 개념 묶음 47개');
  for (const [i, c] of Object.entries(SMAP.concepts)) ok(c.app_eras.every(e => SMAP.section_to_app[c.section].includes(e)), '단원→시대 배치 규칙: ' + i + ' → ' + c.app_eras.join(','));
  for (const [era, v] of Object.entries(TB.notes)) {
    ok(v.core.length >= 3 && v.core.reduce((a, g) => a + g.rows.length, 0) >= 10, era + ': 핵심 개념 묶음 ' + v.core.length + '개·행 ' + v.core.reduce((a, g) => a + g.rows.length, 0) + '개');
    for (const g of v.core) {
      ok(g.src.every(i => SMAP.concepts[i]), era + ' «' + g.g + '»: 근거 묶음 id 존재');
      const terms = g.src.flatMap(i => SMAP.concepts[i].terms.map(t => nz(t.term)));
      for (const r of g.rows) {
        ok(terms.some(t => nz(r[0]).includes(t)), era + ' «' + g.g + '» ' + r[0] + ': 근거 묶음의 교재 용어 포함');
        ok(r[0].length <= 40 && r[1].length <= 48, era + ' ' + r[0] + ': 짧은 설명(이름 40자·뜻 48자 이하)');
      }
    }
    for (const p of v.compare || []) { const terms = p.src.flatMap(i => SMAP.concepts[i].terms.map(t => nz(t.term))); for (const r of p.rows) ok(terms.some(t => nz(r[0] + r[1]).includes(t)), era + ' 비교 «' + p.title + '» ' + r[0] + ': 교재 용어 포함'); }
    for (const r of v.recall || []) ok(r.src.every(i => SMAP.concepts[i]), era + ' 떠올리기 근거 id: ' + r.q);
    // 굵게 표시 용어 = 그 시대에 배치된 묶음의 ‘굵은 글꼴 확인·왕 이름 아님’ 용어와 정확히 일치
    const expect = new Set(); for (const c of Object.values(SMAP.concepts)) if (c.app_eras.includes(era)) for (const t of c.terms) if (t.font_verified && !t.monarch_or_title) expect.add(t.term);
    ok(J([...expect].sort()) === J((TB.terms[era] || []).slice().sort()), era + ': 굵게 표시 목록 = 교재 굵은 글꼴 확인 용어(' + expect.size + ')');
    ok(!(TB.terms[era] || []).some(t => ['세종', '태종', '세조', '성종', '영조', '정조', '숙종', '광해군', '연산군', '중종', '명종', '선조', '인조', '효종', '순조', '철종', '단군왕검', '위만', '한 무제', '대조영', '견훤', '궁예', '이성계', '김춘추', '선덕여왕', '태조'].includes(t) || /왕$/.test(t)), era + ': 재위한 군주 이름(한 무제·위만·단군왕검 등 포함)은 굵게 표시하지 않음');
  }
  for (const c of Object.values(SMAP.concepts)) for (const t of c.terms) if (t.font_verified) ok(t.evidence.length > 0 && t.evidence.every(e => e.pdf_page && e.weight >= 700 && e.font), '굵은 글꼴 증거(쪽·글꼴·굵기): ' + t.term);
  // 사화: 연도·왕·계기 한 행
  const sh = TB.notes['joseon-early'].core.find(g => g.sahwa);
  const want = [['무오사화', '1498', '연산군', '조의제문'], ['갑자사화', '1504', '연산군', '폐비 윤씨'], ['기묘사화', '1519', '중종', '조광조'], ['을사사화', '1545', '명종', '윤임·윤원형']];
  ok(sh && sh.rows.length === 4, '사화 묶음 4행');
  want.forEach(([n, y, k, c], i) => { const r = sh.rows[i] || []; const parts = String(r[1]).split(' · '); ok(r[0] === n && parts[0] === y && parts[1] === k && parts[2].includes(c), n + ': ' + y + ' · ' + k + ' · ' + c + ' 한 행'); });
  const mn = TB.notes['joseon-early'].recall.find(r => r.mnemonic);
  ok(mn && /무갑기을/.test(mn.a + mn.q) && /연연중명/.test(mn.a) && /왕위 계승 순서가 아니/.test(mn.a) && /중종 → 인종 → 명종/.test(mn.a), '사화 암기법: 사화 순서일 뿐, 실제 계승 중종 → 인종 → 명종');
  const allText = fs.readFileSync(path.join(ROOT, 'media', 'textbook-notes.js'), 'utf8') + fs.readFileSync(path.join(ROOT, 'media', 'study-notes.js'), 'utf8');
  ok(!/중종\s*→\s*명종/.test(allText), '인종을 뺀 “중종 → 명종” 표기 없음');
  // 검토 플래그 반영
  const rowsAll = Object.values(TB.notes).flatMap(v => v.core.flatMap(g => g.rows).concat((v.compare || []).flatMap(p => p.rows)).concat((v.recall || []).map(r => [r.q, r.a])));
  const rowTxt = rowsAll.map(r => r.join(' '));
  ok(!/인내천/.test(allText), '인내천을 최제우에 직접 연결하지 않음');
  ok(rowTxt.filter(t => /승정원일기/.test(t)).every(t => !/관보/.test(t)), '승정원일기를 관보라 하지 않음');
  ok(rowTxt.filter(t => /대동법/.test(t)).every(t => !(/숙종/.test(t) && /전국/.test(t))) && !/대동법[^'\]]*전국/.test(allText), '대동법 전국 실시 왕을 단정하지 않음');
  ok(rowTxt.filter(t => /홍문관/.test(t)).every(t => !/대제학/.test(t)), '홍문관 수장 단순화 없음');
  ok(!rowTxt.some(t => /경부 고속도로/.test(t) && /지하철/.test(t)) && !rowTxt.some(t => /(경부 고속도로|지하철).*\b19\d\d\b/.test(t)), '경부 고속도로·지하철 1호선을 같은 연도로 묶지 않음');
  ok(!rowTxt.some(t => /정여립/.test(t) && /동인/.test(t)), '정여립 사건을 동인 분화 원인으로 잇지 않음');
  ok(!JSON.stringify(TB.study.modern.flow).includes('미소공동위원회 실패 → 정읍'), '현대: 미소공위·정읍·좌우합작을 한 줄 순서로 두지 않음');
  ok(!String((TB.study['joseon-early'].flow.find(f => /붕당의 시작/.test(f.t)) || {}).result || '').includes('기축옥사') && TB.study['joseon-early'].flow.some(f => f.t === '기축옥사'), '선조: 기축옥사를 이조전랑 다툼의 결과로 두지 않음(별도 항목)');
  const doc = fs.readFileSync(path.join(ROOT, 'docs', 'textbook-summary-sources.md'), 'utf8');
  for (const k of ['PDF 73', 'PDF 72', 'PDF 76', 'PDF 71', 'PDF 128', 'PDF 124', 'PDF 9', 'PDF 63', '인종']) ok(doc.includes(k), '근거 기록에 결정 사항: ' + k);
  ok(SMAP.review_flags.length === 8 && SMAP.visual_diagram_notes.some(v => v.pdf_page === 63), '근거 지도에 검토 플래그 8개·PDF63 도표 판독 기록');
  // ---- 검토 반영: 조선 범위의 시간 순서 · 연도 ----
  {
    const E = TB.notes['joseon-early'].core.map(g => g.g), L = TB.notes['joseon-late'].core.map(g => g.g);
    const idx = t => E.findIndex(x => x.startsWith(t));
    const seq = ['건국과 태종', '세종', '단종 · 세조 · 성종', '사화 4개', '중종 · 조광조', '선조 · 붕당의 시작', '전쟁과 반정', '임진왜란 · 선조', '광해군', '인조', '병자호란 · 인조'];
    ok(seq.every(t => idx(t) >= 0) && seq.every((t, i) => i === 0 || idx(seq[i - 1]) < idx(t)), '전기 핵심 개념: 건국 → 사화 → 선조 붕당 → 임진왜란 → 광해군 → 인조 → 병자호란 순서');
    const firstCross = E.findIndex(t => /\(조선 전 시기\)|\(태조~명종\)|전기 왕들의 문화/.test(t));
    ok(firstCross > idx('병자호란 · 인조'), '전기: 시기 전체를 다루는 기구·제도 묶음은 정치 흐름 뒤에, 제목에 범위 표시');
    ok(L[0].startsWith('효종') && L.indexOf('영조 · 정조') > 0 && L.indexOf('세도정치기') > L.indexOf('영조 · 정조'), '후기 핵심 개념: 효종 → 영조·정조 → 세도정치기로 시작');
    const lateRows = TB.notes['joseon-late'].core.flatMap(g => g.rows.map(r => r[0]));
    ok(!lateRows.some(k => /^(선조|광해군|인조) ·/.test(k)) && !L.some(t => /^(선조|광해군|인조)/.test(t)), '후기에 선조·광해군·인조 정치 묶음 없음');
    for (const id of ['joseon-late-01', 'joseon-late-04', 'joseon-late-05', 'joseon-late-06', 'joseon-late-07']) ok(SMAP.concepts[id].app_eras.includes('joseon-early') && !SMAP.concepts[id].app_eras.includes('joseon-late'), id + ': 전기·양난 범위에 배치');
    for (const id of ['joseon-late-08', 'joseon-late-09', 'joseon-late-11', 'joseon-late-12', 'joseon-late-13', 'joseon-late-14']) ok(J(SMAP.concepts[id].app_eras) === J(['joseon-late']), id + ': 후기에 배치');
    const lateCross = TB.notes['joseon-late'].core.filter(g => /세금 3종|경제의 변화|신분과 사회|기록과 외교/.test(g.g));
    ok(lateCross.length === 4 && lateCross.every(g => /\(조선 후기 사회\)|조선 전 시기/.test(g.g)), '후기의 사회·기록 묶음은 다루는 시기를 제목에 밝힘');
    const dated = TB.notes['joseon-early'].core.find(g => g.dated);
    const wantD = [['임진왜란', '1592', '선조', '일본'], ['인조반정', '1623', '인조', '광해군'], ['정묘호란', '1627', '인조', '후금'], ['병자호란', '1636', '인조', '청']];
    ok(dated && dated.rows.length === 4, '전쟁과 반정 연도 묶음 4행');
    wantD.forEach(([n, y, k, c], i) => { const r = (dated && dated.rows[i]) || []; const parts = String(r[1]).split(' · '); ok(r[0] === n && parts[0] === y && parts[1] === k && (parts[2] || '').includes(c), n + ': ' + y + ' · ' + k + ' · ' + c + ' 한 행'); });
    const rowOf = k => TB.notes['joseon-early'].core.flatMap(g => g.rows).find(r => r[0] === k) || ['', ''];
    ok(/^1453 · 단종/.test(rowOf('단종 · 계유정난')[1]) && !/세조 즉위/.test(rowOf('단종 · 계유정난')[1]), '계유정난: 1453·단종, 즉위와 한 행에 섞지 않음');
    ok(/^1455 · /.test(rowOf('세조 즉위')[1]), '세조 즉위: 1455 별도 행');
    const ef = JSON.stringify(TB.study['joseon-early'].flow);
    ok(/1453 계유정난/.test(ef) && /1455 세조 즉위/.test(ef) && !/cause":"계유정난/.test(ef), '흐름 노트: 1453 계유정난과 1455 세조 즉위를 구분');
    const nobi = TB.notes['joseon-late'].core.flatMap(g => g.rows).find(r => /공노비/.test(r[0])) || ['', ''];
    ok(/^1801 · /.test(nobi[1]) && /내수사/.test(nobi[1]) && /중앙 관청/.test(nobi[1]) && /납공 노비/.test(nobi[1]) && /남음/.test(nobi[1]) && !/관청 노비를 풀어 줌/.test(allText), '순조 공노비 해방: 1801·내수사·중앙 관청 납공 노비로 범위 한정');
    const titles = TB.study['joseon-early'].flow.map(f => f.t), it = t => titles.findIndex(x => x.includes(t));
    ok(it('사화') < it('선조') && it('선조') < it('임진왜란') && it('임진왜란') < it('광해군') && it('광해군') < it('인조'), '전기 흐름 노트: 사화 → 선조 → 임진왜란 → 광해군 → 인조 순서');
    ok(/효종/.test(TB.study['joseon-late'].flow[0].change) && !TB.study['joseon-late'].flow.some(f => /광해군|인조반정|기축옥사/.test(JSON.stringify(f))), '후기 흐름 노트: 효종부터 시작');
    ok(!/1623 인조반정 →|→ 1627/.test(ef), '반정·호란을 원인 화살표로 잇지 않음(연도 나열)');
    for (const u of ['https://encykorea.aks.ac.kr/Article/E0052503', 'kc_i300400', 'kc_n312000', 'kc_i304900', 'https://encykorea.aks.ac.kr/Article/E0016857', 'https://encykorea.aks.ac.kr/Article/E0055819', 'https://encykorea.aks.ac.kr/Article/E0032244', 'nh_034_0020_0050_0040', 'https://encykorea.aks.ac.kr/Article/E0012421']) ok(doc.includes(u), '근거 기록에 공식 확인 링크: ' + u);
    ok(/전부를 공식 자료로 하나하나 확인하지는 않았다/.test(doc), '근거 기록: 나머지 설명은 공식 확인 범위 밖임을 명시');
    ok(/한 무제/.test(doc) && /위만/.test(doc) && /단군왕검/.test(doc), '근거 기록: 굵게 제외 군주 범위(한 무제·위만·단군왕검 포함) 명시');
  }
  // 바뀌지 않아야 할 파일
  if (base) {
    const same = f => fs.existsSync(path.join(BASE, f)) && Buffer.compare(fs.readFileSync(path.join(BASE, f)), fs.readFileSync(path.join(ROOT, f))) === 0;
    const media = fs.readdirSync(path.join(BASE, 'media'), { recursive: true }).filter(f => fs.statSync(path.join(BASE, 'media', f)).isFile());
    // 기준본에 따라 고려·조선 웹툰은 이미 같을 수 있다. 그래도 바뀐 기존 media 파일은 이 다섯 웹툰 밖으로 나가면 안 되고, 개화기 웹툰은 반드시 다시 엮였어야 한다.
    // 공용 장면 스크립트(comic-scenes.js)는 한 페이지 학습(앱이 요청할 때만 높이·위치 알림)을 위해 바뀔 수 있다 — 아래 7번 끝에서 번호 매기기·혼자 연 웹툰 동작을 따로 검사
    const changedOk = ['goryeo-comic.html', 'joseon-all-comic.html', 'joseon-comic.html', 'joseon-late-comic.html', 'opening-comic.html', 'islands-comic.html', 'colonial-comic.html', 'modern-comic.html', 'prehistory-comic.html', 'gojoseon-comic.html', 'nambuk-comic.html', 'samguk-comic.html', 'comic-scenes.js'];
    const diffMedia = media.filter(f => !same(path.join('media', f)));
    ok(diffMedia.every(f => changedOk.includes(f)) && diffMedia.includes('opening-comic.html') && diffMedia.includes('islands-comic.html') && diffMedia.includes('colonial-comic.html') && diffMedia.includes('modern-comic.html') && diffMedia.includes('prehistory-comic.html') && diffMedia.includes('gojoseon-comic.html') && diffMedia.includes('nambuk-comic.html') && diffMedia.includes('samguk-comic.html'), 'media/ 에서 바뀐 기존 파일은 강의 구성 웹툰(고려·조선·개화기·독도와 간도·일제 강점기·현대사·선사시대·고조선과 여러 나라·남북국·삼국)과 공용 장면 스크립트뿐 (' + diffMedia.join(',') + ')');
    ok(same('media/samguk-summary.png'), '삼국 휴대폰용 요약 이미지 samguk-summary.png 바이트 동일(접힌 요약 노트 안에 그대로)');
    // 기준본에 없던 새 media 파일은 남북국 그림판 네 장과 흐름 데이터뿐(그림판 바이트는 16번에서 기준본에 품었던 base64와 대조)
    const curMedia = fs.readdirSync(path.join(ROOT, 'media'), { recursive: true }).filter(f => fs.statSync(path.join(ROOT, 'media', f)).isFile());
    const newMedia = curMedia.filter(f => !media.includes(f)).map(f => f.split(path.sep).join('/')).sort();
    ok(['nambuk-sheets/0.png', 'nambuk-sheets/1.png', 'nambuk-sheets/2.png', 'nambuk-sheets/3.png', 'lecture-flow-nambuk.js'].every(f => newMedia.includes(f)) && newMedia.filter(f => /^nambuk-sheets\//.test(f)).length === 4, '기준본에 없던 media 파일 중 남북국 그림판은 정확히 0–3.png 네 장 · 흐름 데이터 (' + newMedia.join(',') + ')');
    ok(['samguk-sheets/0.png', 'samguk-sheets/1.png', 'samguk-sheets/2.png', 'samguk-sheets/3.png', 'lecture-flow-samguk.js'].every(f => newMedia.includes(f)) && newMedia.filter(f => /^samguk-sheets\//.test(f)).length === 4, '기준본에 없던 media 파일 중 삼국 그림판은 정확히 0–3.png 네 장 · 흐름 데이터 (그림판 바이트는 17번에서 기준본에 품었던 base64와 대조)');
    ok(Array.from({ length: 8 }, (_, i) => 'media/gojoseon-panels/0' + (i + 1) + '.webp').every(same), '고조선과 여러 나라 그림 01–08.webp 바이트 동일');
    ok(Array.from({ length: 8 }, (_, i) => 'media/prehistory-panels/0' + (i + 1) + '.webp').every(same), '선사시대 그림 01–08.webp 바이트 동일');
    ok(same('media/modern-panels.png'), '현대사 원본 그림판 modern-panels.png 바이트 동일');
    ok(same('media/colonial-panels.png'), '일제 강점기 원본 그림판 colonial-panels.png 바이트 동일');
    ok(same('media/opening-panels.png'), '개화기 원본 그림판 opening-panels.png 바이트 동일');
    ok(same('media/islands-panels.png'), '독도와 간도 원본 그림판 islands-panels.png 바이트 동일');
    ok(same('media/glossary-data.js') && same('media/glossary.js') && same('media/early-era-quiz.js') && same('media/past-exam-quiz.js'), '용어 사전·문제·기출 파일 바이트 동일');
    const bIdx = fs.readFileSync(path.join(BASE, 'index.html'), 'utf8'), cIdx = cur.html;
    const fnBody = (src, name) => { const l = src.split('\n').find(x => x.includes('function ' + name + '(')); return l || ''; };
    // 빈칸 화면 함수(quizEntries · showQuizQuestion · checkCurrentAnswer · jumpQuiz · syncQuizJump · renderQuiz · retryQuiz)는 객관식·묶음으로 바뀌었다 — 18번 검사와 동작 검사가 대신 본다.
    // 범위 바꾸기(setPart)·기출·주소 함수는 그대로; 퀴즈 이동은 미풀이 자동 선택으로 바뀜
    // 실전 모의 화면 함수(showMockQuestion)는 기출 500 확장(범위·묶음·보기 ID·채점 뒤 풀이·크게 보기)으로 다시 썼다 — 19번 검사와 동작 검사(4번 실전 모의 확장)가 대신 본다.
    for (const fn of ['setPart', 'readRoute', 'routeUrl', 'openChapter', 'noteCards', 'partChapters', 'sampleIndexes', 'noLeak', 'answerTokens']) ok(fnBody(bIdx, fn) && fnBody(bIdx, fn) === fnBody(cIdx, fn).replace('webtoon|summary|quiz|mock|review','webtoon|summary|quiz|mock').replace('initialStep<=4','initialStep<=3'), 'index.html 함수 그대로: ' + fn);
    const mockSrc = cIdx.slice(cIdx.indexOf('function showMockQuestion('), cIdx.indexOf('window.HanqMock='));
    ok(fnBody(bIdx, 'showMockQuestion') && mockSrc.length > 200 && /class="mock-choice[\s\S]*role="radio"[\s\S]*data-choice="[\s\S]*data-option="/.test(mockSrc) && /mock-feedback/.test(mockSrc) && /id="checkMock"/.test(mockSrc) && /closeMockZoom\(\)/.test(mockSrc), 'index.html showMockQuestion: 기출 확장판(기준본의 보기 버튼·정답 확인·피드백 이름 유지, 보기 ID·라디오, 새 문제를 그리기 전에 크게 보기 닫음)');
    ok(/function home\([^\n]*closeMockZoom\(true\)/.test(cIdx) && /function changeStep\([^\n]*closeMockZoom\(true\)/.test(cIdx) && /addEventListener\('popstate',function\(\)\{closeMockZoom\(true\);\}\)/.test(cIdx) && /addEventListener\('hashchange',function\(\)\{closeMockZoom\(true\);\}\)/.test(cIdx) && /\.mock-question \.mock-enlarge\{min-height:44px/.test(cIdx), 'index.html: 홈·단계·뒤로 가기·주소 변경 때 크게 보기 대화 상자를 닫음 · 크게 보기 버튼 44px');
    const study = (src) => { const c = { window: {} }; vm.createContext(c); vm.runInContext(src, c); return c.window.HANQ_STUDY; };
    const bS = study(fs.readFileSync(path.join(BASE, 'media', 'study-notes.js'), 'utf8')), cS = TB.study;
    ok(Object.keys(bS).every(k => J(bS[k].compare) === J(cS[k].compare) && J(bS[k].recall) === J(cS[k].recall)), '기존 학습 노트의 비교·떠올리기는 그대로');
    const changedFlow = Object.keys(bS).filter(k => J(bS[k].flow) !== J(cS[k].flow));
    ok(J(changedFlow) === J([]), '기존 흐름 노트(study-notes.js)는 기준본 그대로 (' + changedFlow.join(',') + ')');
  }
  // 좁은 화면: 줄바꿈·열 구성
  const css = cur.html;
  ok(/\.core-list,\.cmp-list\{display:grid;grid-template-columns:minmax\(0,1fr\)/.test(css) && /\.core-row dt,\.cmp-row dt\{[^}]*overflow-wrap:anywhere/.test(css) && /\.core-row dd,\.cmp-row dd\{[^}]*overflow-wrap:anywhere/.test(css), '핵심 개념·비교: 한 열 기본·긴 말 줄바꿈');
  ok(/\.sahwa \.core-row dd,\.dated \.core-row dd\{display:flex;flex-wrap:wrap/.test(css), '사화·연도 행: 좁은 화면에서 연도·왕·계기가 줄바꿈');
  ok(/@media\(min-width:650px\)\{\.core-list\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)\}/.test(css), '넓은 화면 2열');
  ok(/\.core-group>summary\{[^}]*min-height:44px/.test(css), '묶음 제목 터치 높이 44px');
}

section('7. 강의 강조 구성 (고려 · 조선 전기와 양난 · 조선 후기)');
{
  const LERAS = ['goryeo', 'joseon-early', 'joseon-late'];
  const TIERN = { core: 'core', target: 'target_1급', support: 'support', optional: 'optional', optional_highlight: 'optional_highlight' };
  ok(J(Object.keys(LEC.notes).sort()) === J(LERAS.concat('opening').sort()), '강의 노트는 고려·조선 세 부분과 개화기(별도 파일)에만 있음');
  ok(!/opening/.test(fs.readFileSync(path.join(ROOT, 'media', 'lecture-notes.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//, '')) && !LSRC.modules.O01, '개화기 데이터는 고려·조선 노트·근거 지도와 분리(별도 파일)');
  const mods = LSRC.modules, ids = Object.keys(mods);
  ok(ids.length === 33 && ids.filter(i => i[0] === 'G').length === 13 && ids.filter(i => i[0] === 'J').length === 20, '강의 모듈 33개(G01–G13, J01–J20)');
  ok(LSRC.corrections.length === 17 && LSRC.corrections.every(c => c.app_decision && c.app_decision.length > 10), '정정 17건 모두 앱 처리 기록');
  for (const [id, m] of Object.entries(mods)) {
    ok(m.app_eras.length > 0 && m.summary_groups.length > 0, id + ': 요약 묶음에 배치');
    ok(m.content_lines.length && m.priority_evidence.every(e => e.lines.length === 2 && e.kind), id + ': 스크립트 행·강조 근거 보관');
    ok(m.comic_scenes.length > 0 || m.comic_art_needed.length > 0, id + ': 웹툰 장면 ' + m.comic_scenes.length + '개' + (m.comic_art_needed.length ? ' · 그림 필요 기록' : ''));
    ok(m.app_eras.every(e => id[0] === 'G' ? e === 'goryeo' : LSRC.placement_rule_joseon[id].includes(e)), id + ': 시대 배치 규칙 (' + m.app_eras.join(',') + ')');
  }
  for (const era of LERAS) {
    const L = LEC.notes[era];
    for (const g of L.groups) {
      ok(g.mod.every(i => mods[i] && mods[i].priority === TIERN[g.tier]), era + ' «' + g.g + '»: 묶음 등급 ' + g.tier + ' = 강의 모듈 등급');
      for (const r of g.rows) ok(r[0].length <= 40 && r[1].length <= 48, era + ' ' + r[0] + ': 짧은 설명');
    }
    // 굵게 = core·target 모듈의 강조어(그 시대에 놓인 묶음 기준)
    const want = new Set(); for (const g of L.groups) if (g.tier === 'core' || g.tier === 'target') for (const i of g.mod) for (const k of mods[i].highlight_keywords) want.add(k);
    ok(J([...want].sort()) === J(LEC.terms[era].slice().sort()), era + ': 굵게 표시 목록 = 먼저 기억·1급 보충 모듈 강조어(' + want.size + ')');
    const optKw = new Set(); for (const g of L.groups) if (g.tier === 'optional' || g.tier === 'optional_highlight') for (const i of g.mod) for (const k of mods[i].highlight_keywords) optKw.add(k);
    ok([...optKw].every(k => !LEC.terms[era].includes(k) || L.groups.some(g => (g.tier === 'core' || g.tier === 'target') && g.mod.some(i => mods[i].highlight_keywords.includes(k)))), era + ': 선택 심화 강조어는 굵게 승격하지 않음');
  }
  ok(LEC.notes.goryeo.groups.find(g => g.mod.includes('G08')).tier === 'optional_highlight' && LEC.notes['joseon-late'].groups.find(g => g.mod.includes('J19')).tier === 'optional_highlight' && LEC.notes['joseon-late'].groups.find(g => g.mod.includes('J18')).tier === 'optional', '선택 범위: G08·J19는 선택 심화 안 우선, J18 실학은 선택 심화');
  for (const m of ['G09', 'G10', 'G12']) ok(LEC.notes.goryeo.groups.some(g => g.tier === 'core' && g.mod.includes(m)), '고려 핵심 ' + m + '(경제·불교·역사서) 먼저 기억에 있음');
  // 시간 순서
  const E = LEC.notes['joseon-early'].groups.filter(g => g.tier === 'core').map(g => g.g), Lt = LEC.notes['joseon-late'].groups.map(g => g.g);
  const ix = t => E.findIndex(x => x.startsWith(t));
  const seq = ['건국', '태종 · 세종', '계유정난', '사화 4개', '중종', '선조', '광해군', '인조 · 반정', '두 호란'];
  ok(seq.every(t => ix(t) >= 0) && seq.every((t, i) => !i || ix(seq[i - 1]) < ix(t)), '전기·양난: 건국 → 태종·세종 → 계유정난 → 사화 → 중종 → 선조 → 광해군 → 인조 순서');
  ok(Lt[0].startsWith('효종') && !Lt.some(t => /^(선조|광해군|인조)/.test(t)) && !E.some(t => /^효종/.test(t)), '후기는 효종부터, 선조·광해군·인조는 전기에만');
  ok(LEC.notes['joseon-early'].groups.find(g => g.mod.includes('J11')).g.includes('조선 전 시기') && LEC.notes['joseon-late'].groups.find(g => g.mod.includes('J13')).g.includes('조선 전 시기') && LEC.notes['joseon-late'].groups.filter(g => g.mod.some(i => i === 'J14' || i === 'J15')).every(g => g.g.includes('조선 후기 사회')), '시기를 넘나드는 주제는 제목에 범위 표시');
  // 사화·연도
  const ER = LEC.notes['joseon-early'].groups.flatMap(g => g.rows), row = k => ER.find(r => r[0] === k) || ['', ''];
  const sh = LEC.notes['joseon-early'].groups.find(g => g.sahwa);
  ok(sh && J(sh.rows.map(r => [r[0], r[1].split(' · ')[0], r[1].split(' · ')[1]])) === J([['무오사화', '1498', '연산군'], ['갑자사화', '1504', '연산군'], ['기묘사화', '1519', '중종'], ['을사사화', '1545', '명종']]), '강의 사화 4행: 연도·왕');
  const mn = LEC.notes['joseon-early'].recall.find(r => r.mnemonic);
  ok(mn && /무갑기을/.test(mn.a) && /연연중명/.test(mn.a) && /왕위 계승 순서가 아니/.test(mn.a) && /중종 → 인종 → 명종/.test(mn.a), '사화 암기법은 사화 순서일 뿐, 실제 계승 중종 → 인종 → 명종');
  ok(/^1453 · 단종/.test(row('계유정난')[1]) && /^1455 · /.test(row('세조 즉위')[1]), '1453 계유정난(단종)과 1455 세조 즉위는 따로');
  ok(/^1592 · 선조/.test(row('임진왜란')[1]) && J(LEC.notes['joseon-early'].groups.find(g => g.dated).rows.map(r => r[1].slice(0, 9))) === J(['1623 · 인조', '1627 · 인조', '1636 · 인조']), '임진왜란 1592·선조 / 인조반정 1623 · 정묘 1627 · 병자 1636');
  // 정정 반영(요약 데이터 + 세 웹툰 글)
  const lecText = fs.readFileSync(path.join(ROOT, 'media', 'lecture-notes.js'), 'utf8');
  const comicText = ['goryeo-comic.html', 'joseon-comic.html', 'joseon-late-comic.html', 'joseon-all-comic.html'].map(f => legacyComic(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8')).replace(/<[^>]+>/g, ' ')).join('\n');
  const T = lecText + '\n' + comicText;
  const lines = T.split(/\n|(?<=[.。])\s|<\/?(?:p|div|section)>/);
  const near = (a, b) => T.split(/['\]]|\n|·\s(?=[가-힣]+ =)/).filter(x => x.includes(a)).every(x => b(x));
  ok(/이징옥의 난','1453 · 단종/.test(lecText) && !/세조[^'\]]{0,12}이징옥|이징옥[^'\]]{0,20}세조/.test(lecText) && /이징옥의 난\(단종\)/.test(comicText), 'C01 이징옥의 난 = 1453 단종 (세조 아님)');
  ok((T.match(/금난전권 폐지/g) || []).length === (T.match(/육의전을 뺀 시전의 금난전권 폐지/g) || []).length && !/모든 시전|금난전권[^\n'\]]{0,6}전면/.test(T), 'C02 신해통공은 육의전을 뺀 시전의 금난전권 폐지 (예외 없이 모든 금난전권 폐지 표현 없음)');
  ok(/육의전을 뺀 시전의 금난전권 폐지/.test(lecText) && /육의전을 뺀 시전의 금난전권 폐지/.test(comicText), 'C02 문구가 요약·웹툰 모두에');
  ok(!/서울 출신/.test(T) && /서얼 출신/.test(T), 'C03 서얼 표기');
  ok(/청요직/.test(lecText) && !/통청[^'\]\n]{0,20}과거 응시/.test(T), 'C04 통청 운동 = 청요직 진출 요구');
  ok(/정약용·정약전 유배, 정약종 처형/.test(lecText) && /정약종은 처형, 정약용·정약전은 유배/.test(comicText), 'C05 정약용·정약전 유배 / 정약종 처형');
  ok(/이긍익 · 연려실기술/.test(lecText) && !/이익[^'\]]{0,6}연려실기술/.test(T), 'C06 연려실기술 = 이긍익');
  ok(!/황사영[^\n]{0,40}군대/.test(T) && /북경 주교/.test(T), 'C07 황사영 백서를 군대 요청으로 단순화하지 않음');
  ok(!/다인철소/.test(T) && /처인성 · 충주성/.test(T), 'C08 김윤후 = 처인성·충주성 (다인철소와 합치지 않음)');
  ok(!/인내천|시천주/.test(T) && /최제우가 창시한 종교/.test(lecText), 'C09 동학 = 최제우 창시만');
  ok(!/계유정난[^\n]{0,20}세조 즉위\)/.test(T) && /1455 세조 즉위/.test(comicText), 'C10 계유정난과 세조 즉위 시점 분리');
  ok(!/세도정치를 (끝|무너)/.test(T), 'C11 농민 봉기를 세도정치 종료의 단일 원인으로 쓰지 않음');
  ok(!/공무역/.test(T) && /여러 나라 상인/.test(T), 'C12 벽란도 = 여러 나라 상인이 오간 무역항(공무역 단정 없음)');
  ok(!/권문세족[^\n'\]]{0,20}친원/.test(T) && /원 간섭기에 성장한/.test(T), 'C13 권문세족을 친원 세력 전체로 단정하지 않음');
  ok(!/출제되지 않|안 나와/.test(T) && /원각사지/.test(T), 'C14 탑 비교 출제 주장 없이 경천사지·원각사지 구분');
  ok(!/문제 번호|\d\d번대/.test(T), 'C15 문제 번호로 시대 판별하지 않음');
  ok(!/가장 마지막/.test(T), 'C16 “가장 마지막 사건” 요령 없음');
  ok(!/대제학/.test(T) && /홍문관/.test(T), 'C17 홍문관 수장 단순화 없음');
  ok(!/자주 나|빈출|반드시 나|매번 나|출제 확률|독살|인절미/.test(T), '출제 빈도 주장·드라마 일화 없음');
  // 웹툰: 장면 지도 · 그림 · 옛 앵커
  const IMGDIM = f => { const b = fs.readFileSync(path.join(ROOT, 'media', f)); if (/\.png$/.test(f)) return [b.readUInt32BE(16), b.readUInt32BE(20)];
    const t = b.toString('ascii', 12, 16); if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; } return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]; };
  for (const file of LECTURE_COMICS) {
    const s = legacyComic(fs.readFileSync(path.join(ROOT, 'media', file), 'utf8')), scs = s.match(SCENE) || [];
    const mapped = LMAP.scenes.filter(x => x.file === file && x.scene);
    ok(scs.length === mapped.length, file + ': 장면 ' + scs.length + ' = 장면 지도');
    scs.forEach((sc, i) => {
      const lm = (/data-lecture="([^"]+)"/.exec(sc) || [])[1], tier = (/class="scene-tier tier-([a-z_]+)"/.exec(sc) || [])[1];
      ok(lm && J(lm.split(' ')) === J(mapped[i].modules) && tier === mapped[i].tier, file + ' 장면 ' + (i + 1) + ': 모듈 ' + lm + ' · 배지 ' + tier);
      ok(lm && lm.split(' ').some(m => mods[m].priority === TIERN[tier]), file + ' 장면 ' + (i + 1) + ': 배지가 실제 모듈 등급');
      const im = [...sc.matchAll(/<img src="([^"]+)" width="(\d+)" height="(\d+)"/g)];
      ok(im.length === 1, file + ' 장면 ' + (i + 1) + ': 그림 1장');
      for (const [, src, w, h] of im) {
        ok(file === 'goryeo-comic.html' ? /^(goryeo-panels\/\d\d\.webp|lecture-panels\/goryeo-[a-z-]+\.png)$/.test(src) : /^joseon-panels\/(early|late)-\d\d\.png$/.test(src), file + ' 장면 ' + (i + 1) + ': 같은 시대 그림만 (' + src + ')');
        const d = IMGDIM(src); ok(d[0] === +w && d[1] === +h, file + ' ' + src + ': width/height = 실제 그림 크기 ' + d.join('×'));
      }
      ok(/<div class="key">|<p class="key">/.test(sc), file + ' 장면 ' + (i + 1) + ': 핵심 단서 줄');
    });
    ok(/\.artwork\.full img\{aspect-ratio:auto!important;width:100%;height:auto!important;object-fit:contain!important\}/.test(s) && /\.scene\{opacity:1!important/.test(s), file + ': 그림은 자르지 않고 원래 비율 · 장면이 숨지 않음');
    if (base) { const b = fs.readFileSync(path.join(BASE, 'media', file), 'utf8'); const bi = [...b.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]).filter(x => !/^hanq-/.test(x)); const ni = new Set([...s.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
      ok(bi.every(x => ni.has(x)), file + ': 기준본 앵커 ' + bi.length + '개 모두 유지 (빠짐: ' + bi.filter(x => !ni.has(x)).join(',') + ')'); }
    ok(!/\b\d\d \/ (18|23|41)\b/.test(s.replace(/<span[^>]*data-scene-count[^>]*>[^<]*<\/span>/g, '')), file + ': 옛 고정 장면 수 없음');
  }
  const covered = new Set(LMAP.scenes.flatMap(x => x.modules)), needed = new Set((LMAP.art_needed || []).flatMap(a => a.modules));
  ok(ids.every(i => covered.has(i) || needed.has(i)), '웹툰: 33개 모듈 모두 장면 또는 그림 요청에 연결 (빠짐: ' + ids.filter(i => !covered.has(i) && !needed.has(i)).join(',') + ')');
  ok(LMAP.scenes.some(x => x.art === 'lecture-panels/goryeo-buddhism.png' && x.modules.includes('G10')) && /실제 두 인물의 만남을 그린 것이 아님/.test(legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'goryeo-comic.html'), 'utf8'))), 'G10 불교 장면 = 새 개념 그림(실제 만남 아님 명시)');
  const lt = fs.existsSync(path.join(ROOT, 'media', 'lecture-panels', 'goryeo-land-tax.png'));
  ok(lt ? LMAP.scenes.some(x => x.art === 'lecture-panels/goryeo-land-tax.png' && x.modules.includes('G09')) && /땅 주인이 바뀌는 장면이 아님/.test(legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'goryeo-comic.html'), 'utf8'))) : LMAP.art_needed.some(a => a.modules.includes('G09')), 'G09 경제: ' + (lt ? '토지·세금 개념 그림 장면(소유권 이전 아님)' : '그림 요청 기록 + 글 상자'));
  ok(!legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'goryeo-comic.html'), 'utf8')).includes('goryeo-panels/15.webp" width="309" height="310" alt="' ) || !/goryeo-panels\/15\.webp[^>]*>[\s\S]{0,400}의천/.test(legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'goryeo-comic.html'), 'utf8'))), '도공 그림(15)을 불교 사상 장면에 쓰지 않음');
  const allS2 = legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-all-comic.html'), 'utf8')), eS = legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-comic.html'), 'utf8')), lS = legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-late-comic.html'), 'utf8'));
  ok((allS2.match(SCENE) || []).length === (eS.match(SCENE) || []).length + (lS.match(SCENE) || []).length, '통합 조선 웹툰 = 전기 + 후기 장면');
  ok(allS2.indexOf('id="injo"') < allS2.indexOf('id="late-part"') && allS2.indexOf('id="late-part"') < allS2.indexOf('id="hyojong"'), '통합 웹툰: 인조(1부) → 2부 → 효종');
  ok(/선조·광해군·인조 이야기는 <a href="joseon-comic.html#bungdang-origin">/.test(lS), '후기 웹툰: 옮긴 장면 안내와 옛 앵커 연결');
  // 다른 시대는 그대로
  if (base) for (const f of ['media/study-notes.js', 'media/textbook-notes.js', 'media/textbook-terms.js', 'media/glossary-data.js', 'media/glossary.js', 'media/early-era-quiz.js', 'media/past-exam-quiz.js', 'docs/textbook-source-map.json', 'docs/glossary-verification.md']) ok(Buffer.compare(fs.readFileSync(path.join(BASE, f)), fs.readFileSync(path.join(ROOT, f))) === 0, f + ': 기준본과 바이트 동일');
  // 공용 장면 스크립트: 바이트 동일 대신 동작을 본다 — 번호 매기기 함수는 기준본 그대로, 학습 화면용 알림은 앱(부모 창)이 요청할 때만
  { const csNow = fs.readFileSync(path.join(ROOT, 'media', 'comic-scenes.js'), 'utf8'), runOf = src => (/function run\(\)\{[\s\S]*?\n  \}\n/.exec(src) || [''])[0];
    if (base) ok(runOf(csNow) && runOf(csNow) === runOf(fs.readFileSync(path.join(BASE, 'media', 'comic-scenes.js'), 'utf8')), 'comic-scenes.js: 장면 번호 매기기(run)는 기준본 그대로');
    ok(/if\(e\.data\.focus\)\{[^}]*tabindex','-1'\);try\{el\.focus\(\{preventScroll:true\}\)/.test(csNow) && /type:'hanq:goto',id:b\.getAttribute\('data-target'\),focus:true/.test(cur.html) && /prefers-reduced-motion: reduce\)'\)\.matches;window\.scrollTo\(\{top:Math\.max\(0,top\),behavior:calm\?'auto':'smooth'\}\)/.test(cur.html), '세 부분 바로 가기: 그 부분 머리로 초점 이동(스크롤은 앱이 하고, 움직임 줄이기 설정이면 바로 이동)');
    ok(/e\.source!==parentWin/.test(csNow) && /type==='hanq:measure'\)\{watchHeight\(\)/.test(csNow) && !/^\s*watchHeight\(\);?\s*$/m.test(csNow) && (csNow.match(/postMessage\(/g) || []).length === 2, 'comic-scenes.js: 높이·위치 알림은 앱(부모 창)의 요청에만 응답 — 혼자 열거나 다른 화면에서는 아무것도 보내지 않음'); }
}

section('8. 고려 웹툰 · 요약: 왕 · 연도 · 흐름 · 실제 문항 대조');
{
  const gs = legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'goryeo-comic.html'), 'utf8'));
  const scs = gs.match(SCENE) || [];
  // 고려 34왕(표준 대수 순서). 화면의 “N대 ○○” 표기를 이 순서와 대조한다
  const KINGS = ['태조', '혜종', '정종', '광종', '경종', '성종', '목종', '현종', '덕종', '정종', '문종', '순종', '선종', '헌종', '숙종', '예종', '인종', '의종', '명종', '신종', '희종', '강종', '고종', '원종', '충렬왕', '충선왕', '충숙왕', '충혜왕', '충목왕', '충정왕', '공민왕', '우왕', '창왕', '공양왕'];
  const txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const lecSrc = fs.readFileSync(path.join(ROOT, 'media', 'lecture-notes.js'), 'utf8');
  const lecG = lecSrc.slice(lecSrc.indexOf('  goryeo:{'), lecSrc.indexOf("  'joseon-early':{"));
  const regnal = [...(txt(gs) + '\n' + lecG).matchAll(/(\d+)대 ([가-힣]+)/g)];
  const badReg = regnal.filter(m => !(KINGS[+m[1] - 1] && m[2].startsWith(KINGS[+m[1] - 1])));
  ok(regnal.length >= 20 && !badReg.length, '고려 왕 대수 표기 ' + regnal.length + '곳이 실제 왕 순서와 일치 (틀림: ' + badReg.map(m => m[0]).join(',') + ')');
  // 정치 흐름 장면: 왕 표시 · 연도 오름차순 · 왕 건너뜀 표시
  const pol = [], isPol = [];
  scs.forEach((sc, i) => {
    const k = /data-kings="(\d+)-(\d+)"/.exec(sc), y = /data-year="(\d+)"/.exec(sc);
    isPol.push(!!k);
    if (k) pol.push({ i, a: +k[1], b: +k[2], y: y ? +y[1] : 0, reign: (/<p class="g-reign"><b class="king">([^<]+)<\/b>/.exec(sc) || [])[1] || '' });
  });
  ok(pol.length === 15 && isPol.indexOf(false) === pol.length && isPol.slice(pol.length).every(x => !x), '고려: 정치 흐름 장면 15개가 먼저, 시기를 넘나드는 경제·문화 장면은 그 뒤');
  ok(pol.every(p => p.reign.startsWith(p.a + '대 ' + KINGS[p.a - 1]) && p.reign.includes(KINGS[p.b - 1])), '고려 정치 장면마다 맨 위에 다루는 왕(대수)을 표시');
  ok(pol.every((p, j) => !j || (p.y > pol[j - 1].y && p.a >= pol[j - 1].a)), '고려 정치 장면: 연도·왕 순서가 앞으로만 진행 (' + pol.map(p => p.y).join(' → ') + ')');
  for (let j = 1; j < pol.length; j++) {
    const prev = pol[j - 1], next = pol[j];
    const from = gs.indexOf(scs[prev.i]) + scs[prev.i].length, gap = gs.slice(from, gs.indexOf(scs[next.i], from));
    const missing = []; for (let n = prev.b + 1; n < next.a; n++) missing.push(n);
    const leap = /data-leap="1"/.test(gap) && /class="leap">중간 왕 생략</.test(gap);
    const named = missing.every(n => new RegExp(n + '대 ' + KINGS[n - 1]).test(txt(gap)));
    ok(missing.length ? (leap || named) : !leap, '고려 장면 ' + (prev.i + 1) + '→' + (next.i + 1) + ': ' + (missing.length ? '사이의 ' + missing.join('·') + '대는 이름을 밝히거나 ‘중간 왕 생략’ 표시' : '바로 이어지는 왕이라 생략 표시 없음'));
  }
  // 펼치지 않고 읽는 줄거리(연도 줄 + 장면 사이 줄)의 연도는 뒤로 가지 않는다
  const yrs = [];
  pol.forEach((p, j) => {
    const sc = scs[p.i];
    yrs.push(...(((/<p class="g-when">([^<]+)<\/p>/.exec(sc) || [])[1] || '').match(/\d{3,4}/g) || []).map(Number));
    // 흐름 머리(g-flow)의 범위 표시와 외울 것 카드(g-mem)의 되짚기는 사건 순서에서 뺀다(아래 고려 흐름 검사에서 따로 본다). 장면 사이 줄의 연도는 그대로 센다
    if (j < pol.length - 1) { const from = gs.indexOf(sc) + sc.length; yrs.push(...(txt(gs.slice(from, gs.indexOf(scs[pol[j + 1].i], from)).replace(/<div class="g-flow"[\s\S]*?<\/div>/g, ' ').replace(/<aside class="g-mem"[\s\S]*?<\/aside>/g, ' ')).match(/\d{3,4}/g) || []).map(Number)); }
  });
  ok(yrs.length > 20 && yrs.every((y, k) => !k || y >= yrs[k - 1]), '고려 정치 흐름: 연도 줄·장면 사이 줄의 연도가 뒤로 가지 않음 (' + yrs.join(' ') + ')');
  const unfold = h => h.replace(/<details[\s\S]*?<\/details>/g, ' '), folds = h => (h.match(/<details[\s\S]*?<\/details>/g) || []).join(' ');
  const s14 = scs.find(sc => / id="late"/.test(sc)) || '', sYuan = scs.find(sc => / id="yuan"/.test(sc)) || '';
  ok(!/1389|창왕|쓰시마/.test(txt(unfold(s14))) && /1389/.test(folds(s14)) && /다음 창왕 때/.test(folds(s14)) && /박위/.test(folds(s14)) && /쓰시마/.test(folds(s14)) && /박위/.test(lecG), '왜구 장면: 본문은 우왕 때 1376·1380까지, 1389 박위(창왕 때)는 접힌 보충과 요약에');
  ok(/24대 원종 → 25대 충렬왕/.test(sYuan) && /원 간섭기 1270–1351/.test(sYuan) && /원종 때부터 원의 간섭이 시작/.test(sYuan) && /1274 즉위\) 때부터 간섭이 깊어졌다/.test(sYuan) && !/1274–/.test(gs + lecG) && !/원 간섭기 · 25대 충렬왕부터/.test(lecG) && /원 간섭기 · 1270–1351/.test(lecG), '원 간섭기: 1270(원종 때) 시작 · 1274 충렬왕 즉위 뒤 심화를 구분');
  ok(/1126 → 1135/.test(lecG), '고려 요약: 이자겸의 난 → 묘청의 난은 연도 순서(1126 → 1135)로 적음');
  // 장면 안: 연도 줄 · 흐름 꼬리표 · 굵은 말 · 꼭 기억 · 말풍선 · 접힌 보충
  const LBL = { cause: ['배경', '과제'], dev: ['전개', '의천'], res: ['결과', '지눌'] };
  scs.forEach((sc, i) => {
    const n = '고려 장면 ' + (i + 1) + ': ';
    ok(gs.slice(gs.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="g-mem"[\s\S]*?<\/aside>)?/, '').startsWith('<div class="bridge') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 장면으로 잇는 줄' : '마지막 장면 뒤에는 잇는 줄 없음'));
    ok(((/<p class="g-when">([^<]+)<\/p>/.exec(sc) || [])[1] || '').trim().length > 3, n + '연도·사건 줄');
    const st = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)].map(m => ({ k: m[1], l: m[2], t: m[3] }));
    ok(st.length >= 3 && st.every(s => s.k === 'item' || LBL[s.k].includes(s.l)), n + '흐름 줄 ' + st.length + '개, 꼬리표가 종류와 맞음');
    if (isPol[i]) { const ks = st.map(s => s.k).filter(k => k !== 'item'); ok(ks[0] === 'cause' && ks.indexOf('dev') > 0 && (ks.indexOf('res') < 0 || ks.indexOf('res') > ks.indexOf('dev')), n + '배경 → 전개 → 결과 순서'); }
    ok(st.filter(s => s.k === 'res').every(s => !/연호|깊이갈이|팔만대장경|의창|훈요/.test(s.t)), n + '같은 때 일어난 사실을 ‘결과’로 묶지 않음');
    const bold = ((sc.match(/<ol class="g-steps"[\s\S]*?<\/ol>/) || [''])[0].match(/<strong>[^<]+<\/strong>/g) || []).map(b => b.replace(/<\/?strong>/g, ''));
    ok(bold.every(b => LEC.terms.goryeo.includes(b)) && new Set(bold).size === bold.length, n + '흐름 줄의 굵은 말 ' + bold.length + '개는 강의 핵심어, 한 번씩만');
    const key = (/<div class="key"><span class="key-label">꼭 기억<\/span>(.*?)<\/div>/.exec(sc) || [])[1] || '';
    const items = [...key.matchAll(/<(strong|span class="kw-plain")>([^<]+)<\/(?:strong|span)>/g)];
    ok(items.length >= 1 && items.every(m => (m[1] === 'strong') === LEC.terms.goryeo.some(t => m[2].includes(t))), n + '꼭 기억 ' + items.length + '개, 강의 핵심어가 든 항목만 굵게');
    const ar = /<div class="artwork full" style="--g-ar:(\d+) \/ (\d+)"><img src="[^"]+" width="(\d+)" height="(\d+)"[^>]*><\/div>/.exec(sc);
    ok(ar && ar[1] === ar[3] && ar[2] === ar[4] && /loading="(eager|lazy)"/.test(sc), n + '그림 칸이 실제 그림 비율(' + (ar ? ar[1] + '/' + ar[2] : '?') + ')만큼 미리 자리를 잡음(늦게 불러와도 높이 0이 아님)');
    ok(/<div class="artwork full"[^>]*><img [^>]+><\/div>/.test(sc) && /<div class="dialogue g-talk"><p aria-label="[^"]+"><b>[^<]+<\/b><span>[^<]+<\/span><\/p><p aria-label="[^"]+"><b>[^<]+<\/b><span>[^<]+<\/span><\/p><\/div>/.test(sc), n + '말풍선 둘은 그림을 가리지 않고 아래에, 말한 사람 표시');
    const det = (sc.match(/<details/g) || []).length;
    ok([...sc.matchAll(/<details class="scene-more"><summary>[^<]+<\/summary><p>[^<]+<\/p><\/details>/g)].length === det && !/<details[^>]* open/.test(sc), n + '접힌 보충 ' + det + '개는 제목 있는 details, 처음엔 닫힘');
  });
  const visibleHtml = gs.replace(/<details[\s\S]*?<\/details>/g, ' '), vis = txt(visibleHtml);
  ok(!/도병마사|어사대/.test(vis), '고려: 선택 심화(G08 기관)는 접힌 보충 안에만');
  const gm = new Set([...gs.matchAll(/data-lecture="([^"]+)"/g)].flatMap(m => m[1].split(' ')));
  ok(Array.from({ length: 13 }, (_, i) => 'G' + String(i + 1).padStart(2, '0')).every(m => gm.has(m)), '고려 웹툰: G01–G13 모두 장면 또는 정리 카드에 있음');
  ok(!/class="art-pending/.test(gs) && !(LMAP.art_needed || []).some(a => a.file === 'goryeo-comic.html'), '고려: 그림 준비 중 상자·그림 요청 없음(핵심 모듈 모두 그림 장면)');
  const hist = scs.find(sc => / id="goryeo-history"/.test(sc)) || '';
  ok(/data-lecture="G12"/.test(hist) && /<img src="lecture-panels\/goryeo-history\.png" width="1254" height="1254" alt="[^"]*개념 그림[^"]*초상[^"]*"/.test(hist) && LMAP.scenes.some(x => x.id === 'goryeo-history' && x.scene === scs.indexOf(hist) + 1 && x.art === 'lecture-panels/goryeo-history.png'), 'G12 역사서: 새 개념 그림 장면(특정 인물 초상 아님 명시) · 장면 지도와 일치');
  ok(['김부식 · 삼국사기', '이규보 · 동명왕편', '각훈 · 해동고승전', '일연 · 삼국유사', '이승휴 · 제왕운기'].every(p => hist.includes('<strong>' + p + '</strong>')) && /이제현/.test(txt(unfold(hist))) && /만권당/.test(txt(unfold(hist))) && /역옹패설/.test(folds(hist)) && /그림 안내/.test(folds(hist)), 'G12 역사서: 저자·책 다섯 짝은 꼭 기억에, 이제현·만권당은 본문, 역옹패설·그림 안내는 접힌 보충');
  const LSRC_G12 = LSRC.modules.G12;
  ok(LSRC_G12.comic_scenes.some(x => x.art === 'lecture-panels/goryeo-history.png') && LSRC_G12.comic_art_needed.length === 0 && (LSRC.comic.art_needed || []).length === (LMAP.art_needed || []).length, '근거 지도: G12 장면 그림 반영, 남은 그림 요청 없음');
  ok((gs.match(/id="hanq-goryeo-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.dialogue\.g-talk\{grid-template-columns:1fr/.test(gs), '고려: 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(!/바로 다음/.test(lecG), '고려 요약: “바로 다음” 대신 강의에서 이어 보는 사건으로 표현');
  // 한 페이지 학습(media/lecture-flow-goryeo.js): 강의의 네 시기 + 주제별 흐름 머리, 덩어리 끝 ‘이 부분에서 외울 것’ 카드, 그림 밖 말풍선, 바로 가기 줄
  {
    const fsrc = fs.readFileSync(path.join(ROOT, 'media', 'lecture-flow-goryeo.js'), 'utf8'), GF = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[]}'])[1]), FL = GF.list || [];
    const KEYS = Array.from({ length: scs.length }, (_, i) => 'S' + String(i + 1).padStart(2, '0')), F = 'goryeo-comic.html: ';
    const gcss = (/<style id="hanq-goryeo-story">([\s\S]*?)<\/style>/.exec(gs) || [])[1] || '';
    ok(scs.length === 20 && /<body class="g-story">/.test(gs) && /<span data-scene-total>20<\/span>/.test(gs), F + '20컷 그대로 · 고려 읽기 구조(body.g-story)');
    ok(J(FL.map(f => f.no + ' ' + f.name)) === J(['① 고려 초기', '② 문벌귀족 시기', '③ 무신 집권기와 몽골 항쟁', '④ 원 간섭기와 고려 말', '⑤ 경제 · 불교 · 문화 (주제별)']) && J(FL.map(f => f.start)) === J(['S01', 'S05', 'S08', 'S12', 'S16']) && /겹/.test(GF.note) && /겹/.test(FL[4].range) && /정치 사건의 순서가 아니/.test(FL[4].lead),
      '고려 흐름: 강의의 네 시기(초기 · 문벌귀족 · 무신 집권 · 원 간섭과 고려 말) + 고려 전 시기 주제별 정리(시기가 겹친다고 밝힘)');
    const flowOf = k => FL.filter(f => KEYS.indexOf(f.start) <= KEYS.indexOf(k)).pop();
    ok(scs.every((sc, i) => { const y = +((/data-year="(\d+)"/.exec(sc) || [])[1] || 0), r = /(\d{3,4})–(\d{3,4})/.exec(flowOf(KEYS[i]).range); return y ? (r && y >= +r[1] && y <= +r[2]) : flowOf(KEYS[i]).id === 'flow-5'; }), F + '정치 장면의 연도는 그 시기 범위 안, 연도 없는 경제·문화 장면은 모두 ⑤ 주제별');
    const heads = [...gs.matchAll(/<div class="g-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
    ok(heads.length === 5 && heads.every(m => { const f = FL.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2] === f.no + ' · ' + f.range && gs.indexOf(m[0]) + m[0].length === gs.indexOf(scs[KEYS.indexOf(f.start)]); }), F + '흐름 머리 5개는 각 흐름 첫 장면 바로 앞');
    const CH = FL.flatMap(f => f.chunks), endKey = {}; CH.forEach((k, i) => { endKey[k.t] = i + 1 < CH.length ? KEYS[KEYS.indexOf(CH[i + 1].go) - 1] : KEYS[KEYS.length - 1]; });
    const wantCards = ['S04','S07','S11','S15','S20'];
    const cards = [...gs.matchAll(/<aside class="g-mem" id="mem-(s\d\d)" aria-label="[^"]+"><p class="g-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
    ok(cards.length === 5 && J(cards.map(m => m[1].toUpperCase())) === J(wantCards) && cards.every(m => { const sc = scs[KEYS.indexOf(m[1].toUpperCase())]; return gs.indexOf(sc) + sc.length === m.index; }) && J(cards.map(m => 'mem-' + m[1])) === J((LMAP.goryeo_memory || []).map(x => x.anchor)),
      F + '외울 것 카드 ' + cards.length + '장은 덩어리의 마지막 컷 바로 뒤(장면 지도와 같음): ' + cards.map(m => m[1]).join(','));
    const kRe = /<div class="g-mem-k"><p class="g-mem-head"><b class="g-mem-t">([^<]+)<\/b><span class="g-mem-w">([^<]+)<\/span><\/p><div class="g-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="g-memo">[\s\S]*?<\/div>)?(<p class="g-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="g-keys"><span class="g-keys-label">암기 키워드<\/span>((?:<span class="g-key">[^<]+<\/span>)+)<\/p><\/div>/g;
    const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), md = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + md(x) + '</p>').join('') && k.story.length >= 2 && k.story.length <= 4 && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="g-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k) && k.k.length >= 1 && k.k.length <= 3; }),
      F + '카드 = 데이터의 덩어리 순서·왕/시기·이야기 2–4문장(용어 굵게)·외우는 순서·헷갈리지 않기·키워드 1–3');
    const cardBold = ks.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
    ok(cardBold.length > 20 && cardBold.every(b => LEC.terms.goryeo.includes(b)), F + '카드에서 굵은 말 ' + cardBold.length + '개는 모두 고려 강의 핵심어(강의 등급을 올리지 않음)');
    const cardTxt = txt(cards.map(m => m[2]).join(' '));
    ok(!/도병마사|어사대|식목도감|중추원/.test(cardTxt) && /흑창을 의창으로 넓힌 왕은 성종/.test(cardTxt) && /초조대장경은 거란 침입 때, 팔만대장경은/.test(cardTxt) && /교정도감·봉사 10조는 최충헌, 정방·강화 천도는 그 아들 최우/.test(cardTxt) && /요동 정벌을 주장한 쪽은 최영, 위화도에서 군대를 돌린 쪽은 이성계/.test(cardTxt),
      F + '카드는 헷갈리는 짝(태조 흑창 ↔ 성종 의창, 초조 ↔ 팔만대장경, 최충헌 ↔ 최우, 최영 ↔ 이성계)을 가르고, 선택 심화 기관은 올리지 않음');
    ok(/서희[^.]*강동 6주/.test(cardTxt) && /양규/.test(cardTxt) && /강감찬[^.]*귀주대첩/.test(cardTxt) && /숙종[^.]*별무반/.test(cardTxt) && /예종 때 윤관[^.]*동북 9성/.test(cardTxt) && /이자겸[^.]*9년 뒤[^.]*묘청[^.]*김부식/.test(cardTxt) && /기철[^.]*쌍성총관부[^.]*신돈[^.]*전민변정도감/.test(cardTxt) && /정치도감/.test(cardTxt),
      F + '강의의 연결: 서희·강동 6주 / 양규 / 강감찬·귀주 · 숙종 별무반 → 예종 윤관 9성 · 이자겸 → 9년 뒤 묘청(김부식) · 공민왕 기철·쌍성총관부·신돈 전민변정도감 · 충목왕 정치도감');
    // 말풍선: 그림 밖, 학습용 요약 대화 표시, 기록에 이름이 없는 화자는 설명용 인물
    const GG = /^(공신|거란 장수|학생|신하|백성|삼별초|삼별초 장수|원 관리|고려 관리|관리|농민|경전을 공부하는 스님|참선하는 스님|도공|스님|장인|학자|제자) · 설명용 인물$/;
    ok(scs.every(sc => /<p class="g-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*<\/p><div class="dialogue g-talk">/.test(sc) && [...sc.matchAll(/<div class="dialogue g-talk">([\s\S]*?)<\/div>/g)].every(t => [...t[1].matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)].every(b => b[1] === b[2] + ': ' + b[3] && (/설명용 인물/.test(b[2]) ? GG.test(b[2]) : !GG.test(b[2] + ' · 설명용 인물'))))),
      F + '말풍선 위 ‘학습용 요약 대화’ 표시, 기록에 이름이 없는 화자는 모두 ‘설명용 인물’로 밝힘');
    ok(/\.g-story \.artwork\.full\{display:block;width:100%;aspect-ratio:var\(--g-ar\)/.test(gcss) && /\.g-story \.artwork\.full img\{display:block;width:100%;height:100%!important;object-fit:contain!important\}/.test(gcss) && !/object-fit:cover/.test(gcss),
      F + '그림 칸은 고려 안에서만 실제 비율로 자리를 먼저 잡고(공용 height:auto 덮음), 그림은 contain으로 원래 비율 그대로(늘이거나 자르지 않음)');
    ok(/1196 <strong>최충헌<\/strong>이 권력을 잡아 왕에게 <strong>봉사 10조<\/strong>를 올렸다\. 뒤에 <strong>교정도감<\/strong>을 두어/.test(gs) && !/1196[^<.]*교정도감을 (두|설치)/.test(txt(gs)) && /원나라에 있던 만권당/.test(txt(gs)) && !/원의 만권당/.test(txt(gs)),
      F + '1196은 최충헌 집권·봉사 10조, 교정도감은 그 뒤(새 연도 없음) · 만권당은 원나라에 있던 곳(장면·카드 모두)');
    ok(/\.g-story \.dialogue\.g-talk b\{font-size:14px/.test(gcss) && /\.g-story \.dialogue\.g-talk span\{font-size:16px/.test(gcss) && /\.g-steps li\{[^}]*font-size:16px/.test(gcss) && /\.g-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(gcss), F + '대사 16px · 화자 14px · 설명·카드 이야기 16px(좁은 화면에서도 줄이지 않음)');
    // 바로 가기 줄(개화기·조선과 같은 방식)
    const navM = /<nav class="g-nav" aria-label="[^"]+"><div class="g-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(gs);
    ok(navM && J([...navM[1].matchAll(/href="#(flow-\d)"/g)].map(m => m[1])) === J(FL.map(f => f.id)) && (gs.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 다섯 흐름 머리로 가는 링크만(줄 하나)');
    ok(/\.g-story nav\.g-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(gcss) && /\.g-story \.g-nav-track\{[^}]*overflow-x:auto/.test(gcss) && /\.g-story nav\.g-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(gcss) &&
      /\.g-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(gcss) && /@media\(min-width:760px\)\{\.g-story nav\.g-nav\{padding-right:10px\}\}/.test(gcss) &&
      /\.g-story \.scene,\.g-story \.g-flow,\.g-story \.g-mem\{scroll-margin-top:68px\}\.g-story \.legacy-anchor\{top:-68px\}/.test(gcss) && /\.g-story \.g-flow:focus\{outline:3px/.test(gcss) && gcss.indexOf('.embedded .g-story nav{display:none}') > gcss.indexOf('.g-story nav.g-nav{position:sticky'),
      F + '바로 가기 줄 60px 고정 · 홈 버튼은 오른쪽 92px 빈자리에 · 링크 44px · 앵커 이동 때 제목이 가려지지 않음 · 초점 테두리 · 앱 안에서는 숨김(줄 규칙보다 뒤)');
    ok(['early', 'khitan-2-3', 'aristocrat', 'military', 'yuan', 'late', 'goryeo-relief', 'culture', 'goryeo-history'].every(id => new RegExp('<section class="scene" id="' + id + '"').test(gs)) && ['goryeo-kings-early', 'goryeo-system', 'sukjong-yejong', 'yuan-kings', 'goryeo-art'].every(id => (gs.match(new RegExp('<span class="legacy-anchor" id="' + id + '"', 'g')) || []).length === 1),
      F + '예전 장면 앵커 9개와 별칭 앵커 5개 그대로');
    ok(/href="\.\.\/index\.html#chapter\/goryeo\/quiz" target="_top">[^<]*퀴즈로/.test(gs), F + '마지막 안내는 고려 빈칸 문제로(앱 안에서도 바깥 창으로)');
    ok(/media\/lecture-flow-goryeo\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\['goryeo','opening','joseon','islands'[^\]]*\]/.test(cur.html) && !/세 부분 이야기 · 강의 중요도별 묶음 · 헷갈리는 짝 · 떠올려 보기 · 교재 정리<\/span>/.test(cur.html), 'index.html: 고려도 한 페이지 학습(흐름 데이터 연결) · 요약 더 보기 안내는 시대에 맞게(개화기만 세 부분 이야기)');
    ok(!/\/Users\//.test(fsrc) && !/Math\.random|Date\.now|new Date/.test(fsrc), 'media/lecture-flow-goryeo.js: 개인 경로·시간·난수 없음');
  }
  // 실제 앱 문항과 대조 (출제 비중 추정이 아님)
  const mk = (cur.mocks.goryeo || []).map(x => x.exam + '-' + x.number);
  ok(J(mk) === J(['70-15', '75-11', '76-11', '77-11', '77-17']), '앱의 고려 기출은 실제 5문항 (' + mk.join(',') + ')');
  const NEED = { '70-15': ['강화', '처인성', '삼별초', '개경 환도'], '75-11': ['시무 28조', '12목', '국자감'], '76-11': ['7재', '양현고', '청연각'], '77-11': ['초조대장경', '팔만대장경'], '77-17': ['김부식', '삼국사기', '일연', '삼국유사'] };
  for (const [q, ws] of Object.entries(NEED)) ok(ws.every(w => vis.includes(w) && lecG.includes(w)), '기출 ' + q + ' 단서가 웹툰(펼치지 않아도 보임)과 강의 요약에 모두 있음: ' + ws.join(' · '));
  const norm = s => String(s).replace(/[\s·,와]/g, '');
  const pool = norm(txt(gs) + lecG);
  const qs = (cur.quizzes.goryeo || []).filter(x => !x.a.some(a => /→/.test(a)));
  const miss = [...new Set(qs.filter(x => !x.a.some(a => pool.includes(norm(a)))).map(x => x.a[0]))].sort();
  console.log('  · 고려 빈칸 ' + qs.length + '문항 중 답이 웹툰·강의 요약 글에 나오는 문항 ' + qs.filter(x => x.a.some(a => pool.includes(norm(a)))).length + '개 (글자 대조일 뿐, 출제 비중 추정 아님)');
  ok(J(miss) === J(['농상집요', '수시력', '안향', '주현, 속현', '향, 부곡, 소', '향약구급방', '혜민국'].sort()), '빈칸 답 중 웹툰·강의 요약에 없는 것 = 근거 문서의 생략 목록 (' + miss.join(', ') + ')');
  // 근거 문서 · 생성기
  const gdocPath = path.join(ROOT, 'docs', 'goryeo-scene-sources.md'), gdoc = fs.existsSync(gdocPath) ? fs.readFileSync(gdocPath, 'utf8') : '';
  ok(gdoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && gdoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'), '고려 근거 문서: 강의 스크립트·교재 SHA-256 기록');
  ok(Array.from({ length: scs.length }, (_, i) => '| ' + String(i + 1).padStart(2, '0') + ' |').every(x => gdoc.includes(x)), '고려 근거 문서: 장면 ' + scs.length + '개 모두 표에 있음');
  ok(miss.every(w => gdoc.includes(w)) && !/\d+\s*%/.test(gdoc), '고려 근거 문서: 생략 항목 기록, 출제 비중 수치 주장 없음');
  ok(/공식 출처와 하나하나 대조하지 않았/.test(gdoc), '고려 근거 문서: 연도 확인 한계 명시');
  const cli = fs.readFileSync(path.join(ROOT, 'scripts', 'build_lecture_sourcemap.cjs'), 'utf8'), gen = fs.readFileSync(path.join(ROOT, 'scripts', 'build_lecture_comics.py'), 'utf8');
  ok(!/\/Users\//.test(cli) && /process\.argv\[2\] \|\| process\.env\.HANQ_LECTURE_HANDOFF/.test(cli) && /process\.exit\(2\)/.test(cli), '강의 근거 생성기: 개인 경로 없이 입력 파일을 밝혀야 실행');
  ok(!/\/Users\//.test(gen) && !/\brandom\b|datetime|time\.time/.test(gen), '웹툰 생성기: 개인 경로·시간·난수 없음');
  // 입력 없이 / 없는 파일로 돌리면 종료 코드 2, 출력 파일은 그대로
  const { spawnSync } = require('child_process');
  const outs = ['docs/lecture-source-map.json', 'media/lecture-terms.js'], snap = () => outs.map(f => fs.readFileSync(path.join(ROOT, f)));
  const before = snap(), env = Object.assign({}, process.env); delete env.HANQ_LECTURE_HANDOFF;
  const cliPath = path.join(ROOT, 'scripts', 'build_lecture_sourcemap.cjs');
  const r1 = spawnSync(process.execPath, [cliPath], { env, encoding: 'utf8' }), r2 = spawnSync(process.execPath, [cliPath, path.join(ROOT, 'docs', '__no_such_handoff__.json')], { env, encoding: 'utf8' });
  const after = snap();
  ok(r1.status === 2 && r2.status === 2 && /사용법/.test(r1.stderr) && /__no_such_handoff__/.test(r2.stderr) && before.every((b, i) => Buffer.compare(b, after[i]) === 0), '강의 근거 생성기: 입력이 없거나 파일이 없으면 종료 코드 2, 출력 파일은 바이트 그대로');
}

section('9. 조선 웹툰 · 요약: 왕 대수 · 연도 · 흐름 · 실제 문항 대조');
{
  // 조선 27왕(표준 대수 순서). 화면·요약의 “N대 ○○” 표기를 이 순서와 대조한다
  const JK = ['태조', '정종', '태종', '세종', '문종', '단종', '세조', '예종', '성종', '연산군', '중종', '인종', '명종', '선조', '광해군', '인조', '효종', '현종', '숙종', '경종', '영조', '정조', '순조', '헌종', '철종', '고종', '순종'];
  const txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const unfold = h => h.replace(/<details[\s\S]*?<\/details>/g, ' '), folds = h => (h.match(/<details[\s\S]*?<\/details>/g) || []).join(' ');
  const lecSrc = fs.readFileSync(path.join(ROOT, 'media', 'lecture-notes.js'), 'utf8');
  const lecJ = lecSrc.slice(lecSrc.indexOf("  'joseon-early':{"));
  const badLec = [...lecJ.matchAll(/(\d+)대 ([가-힣]+)/g)].filter(m => !(JK[+m[1] - 1] && m[2].startsWith(JK[+m[1] - 1])));
  ok(!badLec.length, '조선 요약의 왕 대수 표기가 27왕 순서와 일치 (틀림: ' + badLec.map(m => m[0]).join(',') + ')');
  ok(/중종 → 인종 → 명종/.test(lecJ) && /12대 인종/.test(lecJ) && /20대 경종/.test(lecJ), '조선 요약: 중종·명종 사이 12대 인종, 숙종·영조 사이 20대 경종을 밝힘');
  ok(/1683 무렵 서인이 노론·소론으로/.test(lecJ) && !/result:'[^']*(노론|소론)/.test(lecJ), '조선 요약: 노론·소론 분화(1683 무렵)는 환국의 결과 칸이 아니라 같은 흐름 안에 연도와 함께');
  ok(/1608[^']*경기/.test(lecJ) &&/김육/.test(lecJ) && /영정법 = 16대 인조/.test(lecJ) && /균역법 = 21대 영조/.test(lecJ), '조선 요약: 대동법은 1608 경기에서 시작·김육 등이 확대, 영정법(인조)·균역법(영조) 구분');
  const FILES = [['joseon-comic.html', () => 'joseon-early'], ['joseon-late-comic.html', () => 'joseon-late'], ['joseon-all-comic.html', sc => /data-part="late"/.test(sc) ? 'joseon-late' : 'joseon-early']];
  const LBL = { cause: ['배경'], dev: ['전개'], res: ['결과'] };
  for (const [file, eraOf] of FILES) {
    const s = legacyComic(fs.readFileSync(path.join(ROOT, 'media', file), 'utf8')), scs = s.match(SCENE) || [], F = file + ': ';
    ok(/<body class="j-story">/.test(s) && (s.match(/id="hanq-joseon-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.j-talk\{grid-template-columns:1fr/.test(s), F + '조선 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
    const regnal = [...txt(s).matchAll(/(\d+)대 ([가-힣]+)/g)], bad = regnal.filter(m => !(JK[+m[1] - 1] && m[2].startsWith(JK[+m[1] - 1])));
    ok(regnal.length >= 10 && !bad.length, F + '왕 대수 표기 ' + regnal.length + '곳이 조선 27왕 순서와 일치 (틀림: ' + bad.map(m => m[0]).join(',') + ')');
    const pol = [], isPol = [];
    scs.forEach((sc, i) => {
      const k = /data-kings="(\d+)-(\d+)"/.exec(sc), y = /data-year="(\d+)"/.exec(sc);
      isPol.push(!!k);
      if (k) pol.push({ i, a: +k[1], b: +k[2], y: y ? +y[1] : 0, reign: (/<p class="j-reign"><b class="king">([^<]+)<\/b>/.exec(sc) || [])[1] || '' });
    });
    ok(pol.length >= 7 && isPol.every((p, i) => p === (i < pol.length)), F + '정치 흐름 장면 ' + pol.length + '개가 먼저, 시기를 넘나드는 사회·문화 장면은 그 뒤');
    ok(pol.every(p => p.reign.startsWith(p.a + '대 ' + JK[p.a - 1]) && p.reign.includes(JK[p.b - 1])), F + '정치 장면마다 맨 위에 왕 대수·이름');
    ok(pol.every((p, j) => !j || (p.y > pol[j - 1].y && p.a >= pol[j - 1].a)), F + '정치 장면: 연도·왕 순서가 앞으로만 (' + pol.map(p => p.y).join(' → ') + ')');
    const yrs = [];
    pol.forEach((p, j) => {
      const sc = scs[p.i];
      yrs.push(...(((/<p class="j-when">([^<]+)<\/p>/.exec(sc) || [])[1] || '').match(/\d{3,4}/g) || []).map(Number));
      if (j === pol.length - 1) return;
      const nx = pol[j + 1], from = s.indexOf(sc) + sc.length, gap = s.slice(from, s.indexOf(scs[nx.i], from));
      const missing = []; for (let n = p.b + 1; n < nx.a; n++) missing.push(n);
      const leap = /data-leap="1"/.test(gap) && /class="leap">중간 왕 생략</.test(gap), named = missing.every(n => new RegExp(n + '대 ' + JK[n - 1]).test(txt(gap)));
      ok(missing.length ? (leap || named) : !leap, F + '장면 ' + (p.i + 1) + '→' + (nx.i + 1) + (missing.length ? ': 사이의 ' + missing.map(n => n + '대 ' + JK[n - 1]).join('·') + '을(를) 밝히거나 ‘중간 왕 생략’ 표시' : ': 바로 이어지는 왕이라 생략 표시 없음'));
      // 흐름 머리(j-flow)의 “① · 시작–끝”은 범위 표시, 외울 것 카드(j-mem)는 덩어리 되짚기라 사건 순서에서 뺀다(아래에서 따로 검사). 장면 사이 줄의 연도는 그대로 센다
      yrs.push(...(txt(gap.replace(/<div class="j-flow"[\s\S]*?<\/div>/g, ' ').replace(/<aside class="j-mem"[\s\S]*?<\/aside>/g, ' ')).match(/\d{3,4}/g) || []).map(Number));
    });
    ok(yrs.length > 15 && yrs.every((y, k) => !k || y >= yrs[k - 1]), F + '펼치지 않고 읽는 연도 줄·장면 사이 줄의 연도가 뒤로 가지 않음 (' + yrs.join(' ') + ')');
    // 이야기 순서: 앞 장면 본문(전개·결과·함께 줄)에서 말한 해보다 다음 장면의 연도 줄이 이르면,
    // 같은 왕의 재위를 주제별로 나눈 장면이라고 화면에 밝혀야 한다(헤더 연도만으로는 시간 역행이 가려지므로)
    const YR = /(?<!\d)1[3-9]\d\d(?!\d)/g;
    const bodyYears = sc => [...sc.matchAll(/<li><b class="st (?:dev|res|item)">[^<]+<\/b><span>(.*?)<\/span><\/li>/g)].flatMap(m => (txt(m[1]).match(YR) || []).map(Number));
    const scopeOk = sc => /data-scope="reign"/.test(sc) && /<p class="j-scope">[^<]*주제별 정리[^<]*<\/p>/.test(sc);
    for (let j = 1; j < pol.length; j++) {
      const A = scs[pol[j - 1].i], B = scs[pol[j].i];
      const aMax = Math.max(0, ...bodyYears(A)), bMin = Math.min(9999, ...((((/<p class="j-when">([^<]+)<\/p>/.exec(B) || [])[1] || '').match(YR) || []).map(Number)));
      if (bMin < aMax) ok(scopeOk(B) && pol[j].a === pol[j - 1].a && /거슬러|돌아가/.test((/<p class="j-scope">([^<]*)<\/p>/.exec(B) || [])[1] || ''), F + '장면 ' + (pol[j].i + 1) + ': 앞 장면 본문(' + aMax + ')보다 이른 해(' + bMin + ')로 돌아가므로 같은 왕 재위의 ‘주제별 정리’이고 시간이 돌아간다고 화면에 밝힘');
    }
    const scoped = scs.filter(sc => /data-scope="reign"/.test(sc));
    ok(scoped.every(scopeOk) && scoped.length === (file === 'joseon-late-comic.html' ? 0 : 2) && scoped.every(sc => /data-kings="4-4"/.test(sc)), F + '‘주제별 정리’ 예외 표시는 세종 두 장면에만, 화면에 보이게 (' + scoped.length + ')');
    const seenPanel = {};
    scs.forEach((sc, i) => {
      const n = F + '장면 ' + (i + 1) + ': ', vocab = LEC.terms[eraOf(sc)];
      ok(s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^\s*(?:<aside class="j-mem"[\s\S]*?<\/aside>\s*)?/, '').startsWith('<div class="bridge') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 장면으로 잇는 줄' : '마지막 장면 뒤에는 잇는 줄 없음'));
      ok(/<p class="j-talk-cap">학습용 요약 대화[^<]*<\/p><div class="j-talk">/.test(sc) && [...sc.matchAll(/<div class="j-talk">[\s\S]*?<\/div>/g)].every(t => [...t[0].matchAll(/<b>([^<]+)<\/b>/g)].every(b => b[1].trim() && (!/^(신하|다른 신하|학자|다른 학자|훈구 대신|사림|동인|서인|남인|수군|장수|농민|관리|다른 관리|무장|병사|검서관|감독|일꾼|이웃|상인|손님|마을 사람)$/.test(b[1]) && (!/설명용 인물/.test(b[1]) || /^(신하|다른 신하|학자|다른 학자|훈구 대신|사림|동인|서인|남인|수군|장수|농민|관리|다른 관리|무장|병사|검서관|감독|일꾼|이웃|상인|손님|마을 사람) · 설명용 인물$/.test(b[1]))))), n + '말풍선 위 ‘학습용 요약 대화’ 표시, 기록에 이름이 없는 화자는 ‘설명용 인물’로 밝힘');
      ok(((/<p class="j-when">([^<]+)<\/p>/.exec(sc) || [])[1] || '').trim().length > 3, n + '연도·사건 줄');
      const st = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)].map(m => ({ k: m[1], l: m[2], t: m[3] }));
      ok(st.length >= 2 && st.every(x => x.k === 'item' || LBL[x.k].includes(x.l)), n + '흐름 줄 ' + st.length + '개, 꼬리표가 종류와 맞음');
      if (isPol[i]) { const ks = st.map(x => x.k).filter(k => k !== 'item'); ok(ks[0] === 'cause' && ks.indexOf('dev') > 0 && (ks.indexOf('res') < 0 || ks.indexOf('res') > ks.indexOf('dev')), n + '배경 → 전개 → 결과 순서'); }
      else ok(/\(17~19세기\)/.test((/<div class="meta">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '') && /<p class="j-when">여러 왕 대에 걸친/.test(sc), n + '시기를 넘나드는 장면은 제목·연도 줄에 범위(17~19세기·여러 왕 대) 표시');
      const bold = ((sc.match(/<ol class="j-steps"[\s\S]*?<\/ol>/) || [''])[0].match(/<strong>[^<]+<\/strong>/g) || []).map(b => b.replace(/<\/?strong>/g, ''));
      ok(bold.every(b => vocab.includes(b)) && new Set(bold).size === bold.length, n + '흐름 줄 굵은 말 ' + bold.length + '개는 그 시대 강의 핵심어, 한 번씩');
      const key = (/<div class="key"><span class="key-label">꼭 기억<\/span>(.*?)<\/div>/.exec(sc) || [])[1] || '';
      const items = [...key.matchAll(/<(strong|span class="kw-plain")>([^<]+)<\/(?:strong|span)>/g)];
      ok(items.length >= 1 && items.every(m => (m[1] === 'strong') === vocab.some(t => m[2].includes(t))), n + '꼭 기억 ' + items.length + '개, 강의 핵심어가 든 항목만 굵게');
      ok(/<div class="art(?: late)? panel-img" role="group" aria-label="[^"]+" data-panel="[a-z]+-\d\d"><img [^>]+><\/div>/.test(sc) && /<div class="j-talk"><p aria-label="[^"]+"><b>[^<]+<\/b><span>[^<]+<\/span><\/p><p aria-label="[^"]+"><b>[^<]+<\/b><span>[^<]+<\/span><\/p><\/div>/.test(sc), n + '말풍선 둘은 그림을 가리지 않고 아래에, 말한 사람 표시');
      const det = (sc.match(/<details/g) || []).length;
      ok([...sc.matchAll(/<details class="scene-more"><summary>[^<]+<\/summary><p>[^<]+<\/p><\/details>/g)].length === det && !/<details[^>]* open/.test(sc), n + '접힌 보충 ' + det + '개는 제목 있는 details, 처음엔 닫힘');
      const dp = (/data-panel="([^"]+)"/.exec(sc) || [])[1];
      if (seenPanel[dp]) ok(/<p class="j-art-note">[^<]*같은[^<]*<\/p>/.test(sc), n + '앞 장면과 같은 그림(' + dp + ')을 다시 쓴다고 화면에 밝힘');
      seenPanel[dp] = true;
    });
    // 다섯 흐름(media/lecture-flow-joseon.js): 흐름 머리는 그 흐름 첫 장면 바로 앞, ‘이 부분에서 외울 것’ 카드는 덩어리의 마지막 장면 바로 뒤
    {
      const fsrc = fs.readFileSync(path.join(ROOT, 'media', 'lecture-flow-joseon.js'), 'utf8'), FL = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[]}'])[1]).list;
      const KEYS = Array.from({ length: 16 }, (_, i) => 'E' + String(i + 1).padStart(2, '0')).concat(Array.from({ length: 11 }, (_, i) => 'L' + String(i + 1).padStart(2, '0')));
      const fileKeys = file === 'joseon-comic.html' ? KEYS.slice(0, 16) : file === 'joseon-late-comic.html' ? KEYS.slice(16) : KEYS;
      ok(scs.length === fileKeys.length, F + '장면 ' + scs.length + '개(전기 16 · 후기 11 · 통합 27) 그대로');
      // 흐름 바로 가기 줄: 높이 고정 + 안쪽 가로 스크롤 트랙, 좁은 화면에서 홈 버튼 자리(92px)를 비움, 링크 44px, 장면·흐름 머리는 줄 높이 + 8px 띄움
      const jcss = (/<style id="hanq-joseon-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
      const navM = /<nav class="j-nav" aria-label="[^"]+"><div class="j-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
      ok(navM && [...navM[1].matchAll(/href="#(flow-\d)"/g)].every(m => s.includes('<div class="j-flow" id="' + m[1] + '">')) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 실제 흐름 머리로 가는 링크만(줄 하나)');
      ok(/\.j-story nav\.j-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(jcss) && /\.j-story \.j-nav-track\{[^}]*overflow-x:auto/.test(jcss) && /\.j-story nav\.j-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(jcss) &&
        /\.j-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(jcss) && /@media\(min-width:760px\)\{\.j-story nav\.j-nav\{padding-right:10px\}\}/.test(jcss) &&
        /\.j-story \.scene,\.j-story \.j-flow,\.j-story \.j-mem\{scroll-margin-top:68px\}/.test(jcss) && jcss.indexOf('.embedded .j-story nav{display:none}') > jcss.indexOf('.j-story nav.j-nav{position:sticky'), F + '바로 가기 줄 60px 고정 · 홈 버튼(9+42px)은 줄 안 오른쪽 92px 빈자리에 · 링크 44px · 앵커 이동 때 제목이 줄 밑에 가려지지 않음 · 앱 안에서는 숨김(줄 규칙보다 뒤)');
      const flowOf = key => FL.filter(f => KEYS.indexOf(f.start) <= KEYS.indexOf(key)).pop();
      const wantHeads = [...new Set(fileKeys.map(k => flowOf(k).id))];
      const heads = [...s.matchAll(/<div class="j-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
      ok(J(heads.map(m => m[1])) === J(wantHeads) && heads.every(m => { const f = FL.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2].startsWith(f.no + ' · ' + f.range); }), F + '흐름 머리 ' + heads.map(m => m[1]).join(',') + ' (통합 = ① 건국과 제도 정비 → ② 사화와 붕당 → ③ 임진왜란과 호란 → ④ 탕평과 개혁 → ⑤ 세도정치)');
      ok(heads.every(m => { const f = FL.find(x => x.id === m[1]), k = fileKeys.includes(f.start) ? f.start : fileKeys[0], sc = scs[fileKeys.indexOf(k)]; return s.indexOf(m[0]) + m[0].length === s.indexOf(sc); }), F + '흐름 머리는 그 흐름의 첫 장면 바로 앞(이어지는 흐름은 웹툰 첫 장면 앞에 ‘이어짐’ 표시)');
      // 흐름 안 정치 장면의 연도는 흐름 범위 안
      const yOf = sc => +((/data-year="(\d+)"/.exec(sc) || [])[1] || 0);
      ok(scs.every((sc, i) => { const y = yOf(sc), r = /(\d{4})–(\d{4})/.exec(flowOf(fileKeys[i]).range); return !y || (y >= +r[1] && y <= +r[2]); }), F + '정치 장면의 연도는 그 흐름의 범위 안');
      // 카드: 덩어리(go부터 다음 덩어리 go 앞까지)의 마지막 장면 뒤
      const CH = FL.flatMap(f => f.chunks), endKey = {}; CH.forEach((k, i) => { endKey[k.t] = i + 1 < CH.length ? KEYS[KEYS.indexOf(CH[i + 1].go) - 1] : KEYS[KEYS.length - 1]; });
      const wantCards = file==='joseon-comic.html'?['E07','E11','E16']:file==='joseon-late-comic.html'?['L01','L05','L11']:['E07','E11','L01','L05','L11'];
      const cards = [...s.matchAll(/<aside class="j-mem" id="mem-([EL]\d\d)" aria-label="[^"]+"><p class="j-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
      ok(J(cards.map(m => m[1])) === J(wantCards) && cards.every(m => s.indexOf(scs[fileKeys.indexOf(m[1])]) + scs[fileKeys.indexOf(m[1])].length === m.index), F + '외울 것 카드 ' + cards.length + '장은 덩어리의 마지막 컷 바로 뒤(' + cards.map(m => m[1]).join(',') + ')');
      const cardT = cards.flatMap(m => [...m[2].matchAll(/<b class="j-mem-t">([^<]+)<\/b>/g)].map(x => x[1]));
      ok(J(cardT) === J(CH.filter(k => fileKeys.includes(endKey[k.t])).map(k => k.t)) && cards.every(m => [...m[2].matchAll(/<div class="j-mem-k">([\s\S]*?)<p class="j-keys">([\s\S]*?)<\/p><\/div>/g)].every(k => { const ps = (k[1].match(/<div class="j-mem-story">((?:<p>[\s\S]*?<\/p>)+)<\/div>/) || ['', ''])[1].match(/<p>/g) || []; const ks = (k[2].match(/class="j-key"/g) || []).length; return ps.length >= 2 && ps.length <= 4 && ks >= 1 && ks <= 3 && /<p class="j-mem-x"><b>헷갈리지 않기<\/b>/.test(k[1]); })),
        F + '카드마다 덩어리 순서대로 이어지는 이야기 2–4문장 → (외우는 순서) → 헷갈리지 않기 → 키워드 1–3');
      if (file !== 'joseon-late-comic.html') { const sh = cards.find(m => /네 번의 사화/.test(m[2])); ok(sh && /무오\(1498\)·갑자\(1504\) = 연산군 → 기묘\(1519\) = 중종 → 을사\(1545\) = 명종/.test(sh[2]) && /실제 계승은 중종 → 12대 인종 → 명종/.test(sh[2]), F + '사화 카드: 무오1498·갑자1504 연산군 · 기묘1519 중종 · 을사1545 명종, 실제 계승 중종 → 인종 → 명종'); }
      if (file !== 'joseon-comic.html') { const ys = cards.find(m => /예송과 환국/.test(m[2])); ok(ys && /18대 <strong>현종<\/strong>|18대 현종/.test(ys[2]) && /효종이 아니라 현종/.test(ys[2]), F + '예송 카드: 효종이 세상을 떠난 뒤 현종 때의 일(그때 왕은 현종)'); }
    }
    const find = re => scs.find(sc => re.test(sc)) || '', all = txt(s);
    if (file !== 'joseon-late-comic.html') {
      const sDan = find(/data-kings="6-6"/), sSejo = find(/data-kings="7-7"/), sDae = find(/<p class="j-when">1608 경기에서 대동법/), sInjo = find(/ id="injo"/), sSj = find(/data-kings="9-9"/);
      ok(/1453 계유정난/.test(txt(sDan)) && /이징옥의 난\(단종\)/.test(txt(sDan)) && /1455 세조 즉위/.test(txt(sDan)) && /6대 단종/.test(txt(sDan)), F + '계유정난·이징옥의 난은 1453 단종 때, 세조 즉위는 1455로 따로');
      ok(/이시애의 난/.test(txt(sSejo)) && !/이징옥/.test(sSejo), F + '이시애의 난은 세조 장면에, 이징옥의 난과 섞지 않음');
      ok(/이원익/.test(sDae) && /김육/.test(sDae) && /넓어졌다/.test(sDae) && !/전국/.test(txt(unfold(sDae))), F + '대동법: 15대 광해군 1608 경기 시작(이원익) · 김육 등이 확대 · 한 왕의 전국 시행으로 쓰지 않음');
      ok(/영정법/.test(sInjo) && /16대 인조/.test(txt(sInjo)) && /1결당 4두/.test(sInjo), F + '영정법은 16대 인조(전세 1결당 4두)');
      ok(/조선의 삼사\(사헌부·사간원·홍문관\)는 언론/.test(folds(sSj)) && /고려의 삼사는 회계/.test(folds(sSj)), F + '삼사: 조선은 언론 기관 셋, 고려는 회계 기관 — 이름만 같음');
      ok(/중종 → 인종 → 명종/.test(all) && /12대 인종/.test(all), F + '사화 암기법 아래 실제 계승 중종 → 인종 → 명종, 장면 사이에 12대 인종');
    }
    if (file !== 'joseon-comic.html') {
      const sYj = find(/data-kings="21-21"/), sSil = find(/ id="scene-11"/), sSe = find(/ id="scene-7"/), sHs = find(/ id="scene-2"/);
      const hsRes = [...sHs.matchAll(/<b class="st res">결과<\/b><span>([\s\S]*?)<\/span>/g)].map(m => txt(m[1])).join(' ');
      ok(/1680·1689·1694 환국/.test(sHs) && !/노론|소론/.test(hsRes) && /송시열/.test(hsRes) && /1683[^.]*노론/.test(txt(sHs)), F + '환국의 결과 칸에는 직접 결과(진 붕당이 목숨까지 잃음)만, 1683 노론·소론 분화는 따로 연도와 함께');
      ok(/균역법/.test(sYj) && /21대 영조/.test(txt(sYj)) && /인조 영정법/.test(folds(sYj)) && /영조 균역법/.test(folds(sYj)), F + '균역법은 21대 영조, 영정법(인조)과 왕을 섞지 않음');
      ok(!/data-kings=/.test(sSil) && /박지원\(정조때청에다녀와열하일기\)/.test(txt(sSil).replace(/\s/g, '')) &&/class="scene-tier tier-optional"/.test(sSil), F + '실학은 선택 심화·여러 왕 대 장면(박지원 열하일기만 정조 때로 따로 밝힘)');
      ok(/정약종은 처형, 정약용·정약전은 유배/.test(txt(sSe)) && /북경 주교/.test(sSe) && !/세도정치를 (끝|무너)/.test(all) && ![...s.matchAll(/<b class="st res">결과<\/b><span>([\s\S]*?)<\/span>/g)].some(m => /탕평/.test(m[1])), F + '신유박해·황사영 정정 반영, 세도정치 종료·탕평을 다른 사건의 결과로 쓰지 않음');
      ok(!/거중기|해동제국기|발해고|연려실기술/.test(txt(unfold(s))) && /거중기/.test(folds(s)), F + '선택 심화 안 우선 항목(거중기·해동제국기·발해고·연려실기술)은 접힌 보충에만');
    }
  }
  // 실제 앱 문항과 대조 (출제 비중 추정이 아님)
  const jm = era => (cur.mocks[era] || []).map(x => x.exam + '-' + x.number);
  ok(J(jm('joseon-early')) === J(['75-19', '76-19', '76-20', '77-20', '77-22']) && J(jm('joseon-late')) === J(['75-24', '76-23', '76-25', '77-24', '77-26']), '앱의 조선 기출은 전기 5 · 후기 5문항 (' + jm('joseon-early').concat(jm('joseon-late')).join(',') + ')');
  const visAll = txt(unfold(legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-all-comic.html'), 'utf8'))));
  const NEED = { '75-19': ['방석', '1차 왕자의 난', '이방원'], '76-19': ['박연', '아악', '삼강행실도'], '76-20': ['연산군', '조의제문', '폐비 윤씨', '무오사화'], '77-20': ['간경도감', '직전법'], '77-22': ['남한산성', '북벌', '이완'],
    '75-24': ['이인좌의 난', '탕평비'], '76-23': ['대동법', '김육', '공인', '방납'], '76-25': ['청계천', '속대전'], '77-24': ['환국', '금위영'], '77-26': ['박제가', '검서관'] };
  for (const [q, ws] of Object.entries(NEED)) ok(ws.every(w => visAll.includes(w)), '기출 ' + q + ' 단서가 통합 웹툰에 펼치지 않아도 보임: ' + ws.join(' · '));
  const SUMNEED = { '75-19': ['왕자의 난'], '76-19': ['삼강행실도'], '76-20': ['무오사화', '조의제문'], '77-20': ['직전법', '간경도감'], '77-22': ['북벌', '남한산성'],
    '75-24': ['균역법', '탕평'], '76-23': ['대동법', '공인', '김육'], '76-25': ['속대전'], '77-24': ['환국', '금위영'], '77-26': ['박제가'] };
  for (const [q, ws] of Object.entries(SUMNEED)) ok(ws.every(w => lecJ.includes(w)), '기출 ' + q + ' 핵심 단서가 조선 강의 요약에도 있음: ' + ws.join(' · '));
  const { spawnSync } = require('child_process');
  const qm = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_joseon_question_map.cjs'), '--check'], { encoding: 'utf8' });
  ok(qm.status === 0, '조선 문항 대조표(docs/joseon-question-map.json)가 현재 문항·웹툰·요약과 일치' + (qm.status === 0 ? '' : ' — ' + (qm.stderr || '').trim()));
  const qmPath = path.join(ROOT, 'docs', 'joseon-question-map.json'), QM = fs.existsSync(qmPath) ? JSON.parse(fs.readFileSync(qmPath, 'utf8')) : null;
  ok(QM && ['joseon-early', 'joseon-late'].every(era => QM.inline[era].length === (cur.quizzes[era] || []).length && J(QM.past_exam[era].map(x => x.id)) === J(jm(era))), '대조표: 앱의 조선 빈칸·기출 문항 id를 모두 기록');
  if (QM) console.log('  · 조선 빈칸 글자 대조(출제 비중 추정 아님): ' + JSON.stringify(QM.counts));
  // 근거 문서 · 생성기
  const jdocPath = path.join(ROOT, 'docs', 'joseon-scene-sources.md'), jdoc = fs.existsSync(jdocPath) ? fs.readFileSync(jdocPath, 'utf8') : '';
  ok(jdoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && jdoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442'), '조선 근거 문서: 강의 스크립트·교재 SHA-256 기록');
  const nE = (legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-comic.html'), 'utf8')).match(SCENE) || []).length, nL = (legacyComic(fs.readFileSync(path.join(ROOT, 'media', 'joseon-late-comic.html'), 'utf8')).match(SCENE) || []).length;
  ok(Array.from({ length: nE }, (_, i) => '| E' + String(i + 1).padStart(2, '0') + ' |').concat(Array.from({ length: nL }, (_, i) => '| L' + String(i + 1).padStart(2, '0') + ' |')).every(x => jdoc.includes(x)), '조선 근거 문서: 전기 ' + nE + ' · 후기 ' + nL + '장면 모두 표에 있음');
  ok(jm('joseon-early').concat(jm('joseon-late')).every(id => jdoc.includes(id)) && jdoc.includes('docs/joseon-question-map.json') && !/\d+\s*%/.test(jdoc) && /공식 출처와 하나하나 대조하지 않았/.test(jdoc), '조선 근거 문서: 기출 10문항 id · 빈칸 대조표 · 연도 확인 한계, 비율 주장 없음');
  const qsrc = fs.readFileSync(path.join(ROOT, 'scripts', 'build_joseon_question_map.cjs'), 'utf8');
  ok(!/\/Users\//.test(qsrc) && !/Math\.random|Date\.now|new Date/.test(qsrc), '문항 대조 생성기: 개인 경로·시간·난수 없음');
}

section('10. 개화기 웹툰 · 요약: 26대 고종 · 27대 순종 · 연도 · 흐름 · 원본 칸 그림 · 실제 문항 대조');
{
  const KO = { 26: '고종', 27: '순종' };
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  // 세 부분의 상세 만화(details.o-part-detail · o-more)는 통째로 접혀 있고 펼치면 장면 본문이다. ‘접힌 보충’은 장면 안의 details.scene-more만 뜻한다.
  const MORE = /<details class="scene-more">[\s\S]*?<\/details>/g;
  const unfold = h => h.replace(MORE, ' '), folds = h => (h.match(MORE) || []).join(' ');
  const s = rdr('media/opening-comic.html'), scs = s.match(SCENE) || [], F = 'opening-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>')), mainTxt = txt(mainHtml), visMain = txt(unfold(mainHtml));
  const notesSrc = rdr('media/lecture-notes-opening.js'), L = LEC.notes.opening || { groups: [], flow: [], compare: [], recall: [] }, T = LEC.terms.opening || [];
  const H = JSON.parse(rdr('docs/opening-lecture-handoff.json')), mod = id => H.modules.find(m => m.id === id) || { priority_evidence: [] };
  // 구조 · 스타일 · 원본 그림판
  ok(/<body class="o-story">/.test(s) && (s.match(/id="hanq-opening-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.o-talk\{grid-template-columns:1fr/.test(s), F + '개화기 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(!/background-size|background-position|--x:|class="bubble/.test(mainHtml), F + '그림판 배경 확대·자르기와 그림 위 말풍선 없음');
  // 고정 바로 가기 줄: 높이 고정 → 장면·부 머리 scroll-margin이 그 높이만큼(제목·번호·왕 줄이 가려지지 않게), 홈 버튼은 줄 안의 비운 자리에, 가로 스크롤은 안쪽 트랙에서만
  const ocss = (/<style id="hanq-opening-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const navH = +((/\.o-story\{--o-nav-h:(\d+)px\}/.exec(ocss) || [])[1] || 0);
  const navPad = /\.o-story nav\.o-nav\{position:sticky;top:0;[^}]*height:var\(--o-nav-h\);box-sizing:border-box;[^}]*padding:0 (\d+)px 0 10px/.exec(ocss);
  const home = /\.o-story \.comic-home\{top:calc\((\d+)px \+ env\(safe-area-inset-top\)\);min-height:(\d+)px\}/.exec(ocss);
  const sm8 = /\.o-story \.scene,\.o-story \.o-part,\.o-story \.bridge\{scroll-margin-top:calc\(var\(--o-nav-h\) \+ (\d+)px\)\}/.exec(ocss);
  ok(navH >= 52 && navPad && sm8 && +sm8[1] >= 4, F + '바로 가기 줄 높이 ' + navH + 'px 고정, 장면·부 머리·잇는 줄의 scroll-margin = 줄 높이 + 여백(앵커 이동·scrollIntoView에서 제목이 가려지지 않음)');
  ok(navPad && +navPad[1] >= 88 && home && +home[1] + +home[2] <= navH && /@media\(min-width:760px\)\{\.o-story nav\.o-nav\{padding-right:10px\}\}/.test(ocss) && /\.embedded \.o-story nav\.o-nav\{padding-right:10px\}/.test(ocss), F + '홈 버튼은 바로 가기 줄 높이 안·오른쪽 비운 자리(' + (navPad ? navPad[1] : '?') + 'px)에, 넓은 화면·앱 안에서는 자리를 비우지 않음');
  const navHtml = (/<nav class="o-nav" aria-label="세 부분 바로 가기"><div class="o-nav-track">([\s\S]*?)<\/div><\/nav>/.exec(s) || [])[1] || '';
  const navIds = [...navHtml.matchAll(/<a href="#([^"]+)">[^<]+<\/a>/g)].map(m => m[1]);
  ok(J(navIds) === J(['part-fix', 'part-reform', 'part-defend']) &&navIds.every(id => new RegExp('<(?:div class="o-part"|section class="scene") id="' + id + '"').test(s)) && /\.o-story \.o-nav-track\{[^}]*overflow-x:auto/.test(ocss) && /nav\.o-nav a\{[^}]*min-height:44px[^}]*font-size:(1[4-9])px/.test(ocss), F + '바로 가기 ' + navIds.length + '개는 실제 장면·부 머리로 이동, 가로 스크롤 트랙 · 누르기 44px · 글자 14px 이상');
  // 세 부분 구조: 요약 노트와 같은 기준 데이터(parts)로 머리·덩어리를 그리고, 상세 만화는 처음엔 모두 접힘
  const PJ = (LEC.notes.opening || {}).parts || { list: [] };
  const secs = [...s.matchAll(/<section class="o-psec" aria-labelledby="([^"]+)-h"><div class="o-part" id="\1"><small>(\d)부 · ([^<]+)<\/small><h2 id="\1-h">([^<]+)<\/h2>/g)];
  ok(secs.length === 3 && J(secs.map(m => [m[1], m[3], m[4]])) === J(PJ.list.map(p => [p.id, p.range, p.no + ' ' + p.name])), F + '세 부분 머리 = 요약 노트의 세 부분 데이터(① 나라를 바로잡자 · ② 나라를 개혁하자 · ③ 나라를 지키자)');
  // 흐름이 끊기는 곳의 ‘이 부분에서 외울 것’ 카드: 덩어리의 마지막 장면 바로 뒤. 요약 노트와 같은 사건·왕/시기 → 같은 이야기 2–4문장 → 외우는 순서 → 헷갈리지 않기 → 키워드
  const memRe = /<aside class="o-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="o-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g;
  const memCards = [...s.matchAll(memRe)];
  const kRe = /<div class="o-mem-k"><p class="o-chunk-head"><b class="o-chunk-t">([^<]+)<\/b><span class="o-chunk-w">([^<]+)<\/span><\/p><div class="o-chunk-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="o-memo">[\s\S]*?<\/div>)?(<p class="o-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)?<p class="o-chunk-k"><span class="o-keys-label">암기 키워드<\/span>((?:<span class="o-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const memK = memCards.flatMap(m => [...m[2].matchAll(kRe)].map(k => ({ after: m[1], k })));
  const PCK = PJ.list.flatMap(p => p.chunks), unstar = x => String(x).replace(/\*\*/g, '');
  const storyOf = h => [...h.matchAll(/<p>([\s\S]*?)<\/p>/g)].map(x => x[1].replace(/<strong class="o-em">([^<]*)<\/strong>/g, '$1'));
  const canon = memK.filter(x => PCK.some(k => k.t === x.k[1]));
  ok(canon.length === 14 && canon.every((x, i) => { const k = PCK[i] || { story: [], k: [] }, m = x.k;
    return m[1] === k.t && m[2] === k.w && J(storyOf(m[3])) === J(k.story.map(unstar)) && !/\*\*|<(?!\/?(?:p|strong)\b)/.test(m[3]) &&
      (m[3].match(/<strong class="o-em">/g) || []).length === (k.story.join('').match(/\*\*[^*]+\*\*/g) || []).length &&
      (!!m[4] === !!k.memo) && (!k.memo || (m[4].includes(k.memo.text) && m[4].includes(k.memo.note))) && (!!m[5] === !!k.x) &&
      J([...m[6].matchAll(/<span class="o-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k); }),
    F + '외울 것 카드에 덩어리 14개(4·5·5): 요약 노트와 같은 사건·왕/시기 → 같은 이야기 2–4문장(용어 굵게) → 외우는 순서 → 헷갈리지 않기 → 키워드');
  // 카드 위치: 덩어리는 go 장면부터 다음 덩어리의 go 앞까지, 카드는 그 마지막 장면 바로 뒤(같은 장면에서 끝나는 덩어리는 한 카드)
  const OIDS = { 'part-fix': ['scene-1', 'scene-2', 'shinmi-1871', 'scene-3'], 'part-reform': ['gaehwa-policy', 'scene-4', 'scene-5', 'scene-6', 'scene-7', 'gyeongbok-1894', 'scene-8', 'ugeumchi-1894', 'hongbeom-1894', 'scene-9', 'independence-club', 'scene-10'], 'part-defend': ['advisers-1904', 'scene-11', 'scene-12', 'annexation-1910', 'national-defense'] };
  const endOf = {}; for (const p of PJ.list) { const ids = OIDS[p.id] || [], st = p.chunks.map(k => ids.indexOf(k.go)); p.chunks.forEach((k, i) => { const later = st.filter(x => x > st[i]); endOf[k.t] = ids[later.length ? Math.min(...later) - 1 : ids.length - 1]; }); }
  ok(canon.every(x=>PJ.list.find(p=>p.chunks.some(k=>k.t===x.k[1]))?.id===({'scene-3':'part-fix','modern-culture':'part-reform','national-defense':'part-defend'})[x.after]) && memCards.every(m => new RegExp('<section class="scene" id="' + m[1] + '"[\\s\\S]*?</section><aside class="o-mem" id="mem-' + m[1] + '"').test(s)) && J(memCards.map(m => m[1])) === J((OMAP.memory || []).map(x => x.after)),
    F + '외울 것 카드는 덩어리의 마지막 컷 바로 뒤(장면 지도와 같음): ' + memCards.map(m => m[1]).join(','));
  const mcCard = memK.find(x => /근대 문물/.test(x.k[1])), mcScene = (OMAP.scenes || []).find(x => x.id === 'modern-culture') || {};
  ok(mcCard && /주제별/.test(mcCard.k[1]) && /시기가 겹침/.test(mcCard.k[2]) && J([...mcCard.k[6].matchAll(/<span class="o-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(mcScene.learn || []), F + '근대 문물(주제별 · 시기가 겹침) 카드는 그 장면의 핵심 말로');
  ok(/\.o-chunk-story p\{[^}]*font-size:(1[6-9])px;line-height:1\.7/.test(ocss) && /\.o-mem-x\{[^}]*font-size:(1[6-9])px;line-height:1\.7/.test(ocss) && !/\.o-chunk-story[^{]*\{[^}]*font-size:(1[0-5](\.\d)?)px/.test(ocss), F + '카드 이야기·헷갈리지 않기 글자 16px 이상 · 줄 간격 1.7');
  ok(!/<details[^>]* open/.test(mainHtml) && !/class="o-(?:chunks|part-detail|more)"/.test(mainHtml) && [...mainHtml.matchAll(/<details class="([^"]+)"/g)].every(m => m[1] === 'scene-more'), F + '컷은 하나도 접지 않음: 접힌 것은 장면 안 보충(scene-more)뿐, 만화 앞 덩어리 목록 없음');
  ok(/\.embedded \.o-story nav\.o-nav\{display:none\}/.test(ocss), F + '앱 안(학습 화면)에서는 웹툰의 고정 줄을 숨기고 앱의 세 부분 바로 가기를 씀');
  // 장면이 어느 부모 안에 있는지: section·details 여닫는 태그를 쌓아(스택) 장면마다 조상 목록을 얻는다(장면 안 scene-more 닫힘과 헷갈리지 않게)
  const anc = {}; let tagsOk = true;
  { const st = [];
    for (const m of mainHtml.matchAll(/<(\/?)(section|details)\b([^>]*)>/g)) {
      if (m[1]) { const top = st.pop(); if (!top || top.tag !== m[2]) tagsOk = false; continue; }
      const cls = (/\sclass="([^"]*)"/.exec(m[3]) || [])[1] || '', id = (/\sid="([^"]*)"/.exec(m[3]) || [])[1] || '';
      if (m[2] === 'section' && cls === 'scene') { if (anc[id]) tagsOk = false; anc[id] = st.map(x => x.tag + '.' + x.cls + (x.id ? '#' + x.id : '')); }
      st.push({ tag: m[2], cls, id });
    }
    if (st.length) tagsOk = false; }
  // 장면마다 어느 부분(o-psec) 안인지: 부분 머리 순서로 센다. 장면 위에는 접는 부모(details)가 없어야 한다
  const ids22 = Object.keys(anc), secIdx = id => { const at = mainHtml.indexOf('<section class="scene" id="' + id + '"'); return secs.filter(m => mainHtml.indexOf(m[0]) < at).length; };
  const byPart = [0, 0, 0]; for (const id of ids22) byPart[secIdx(id) - 1]++;
  ok(tagsOk && ids22.length === scs.length && scs.length === 22 && ids22.every(id => J(anc[id]) === J(['section.o-psec']) && ['part-fix', 'part-reform', 'part-defend'][secIdx(id) - 1] === ((OMAP.scenes || []).find(x => x.id === id) || {}).part) && J(byPart) === J([4, 13, 5]),
    F + '장면 22개는 모두 정해진 부분 바로 안, 접는 부모 없이(① 4 · ② 13 · ③ 5, 태그 짝 맞음) ' + J(byPart));
  ok(secIdx('modern-culture') === 2 && mainHtml.indexOf('id="modern-culture"') > mainHtml.indexOf('<aside class="o-mem" id="mem-scene-10"'), F + '근대 문물(주제별)은 ② 나라를 개혁하자의 정치 흐름과 그 외울 것 카드 뒤에 펼친 채');
  ok(['part-1', 'part-2', 'part-3', 'part-4'].every(id => s.includes('<span class="legacy-anchor" id="' + id + '" aria-hidden="true"></span><section class="scene"')) && Array.from({ length: 12 }, (_, i) => 'scene-' + (i + 1)).every(id => s.includes('<section class="scene" id="' + id + '"')), F + '예전 앵커 #part-1–4(같은 장면 바로 앞) · #scene-1–12 유지');
  // 예전 접힌 상세 만화 id(#part-…-detail)는 부분 머리 바로 뒤의 빈 앵커로만 남김(접는 details 없이, 같은 부분 첫 장면으로)
  ok(['part-fix', 'part-reform', 'part-defend'].every(p => s.includes('<div class="o-part" id="' + p + '">') && new RegExp('<div class="o-part" id="' + p + '">[\\s\\S]*?</div>\\n<span class="legacy-anchor" id="' + p + '-detail" aria-hidden="true"></span>(?:<span class="legacy-anchor" id="part-\\d" aria-hidden="true"></span>)?<section class="scene"').test(s) && (s.match(new RegExp('id="' + p + '-detail"', 'g')) || []).length === 1) && !/<details[^>]*id="part-/.test(s),
    F + '예전 앵커 #part-fix-detail · #part-reform-detail · #part-defend-detail은 각 부분 첫 장면 앞의 빈 앵커(접는 상자 없음, id 하나씩)');
  ok(/href="\.\.\/index\.html#chapter\/opening\/quiz" target="_top">[^<]*퀴즈로/.test(s) && !/요약 노트·문제로 이어가기/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로 열림), 따로 있던 요약 탭 안내 없음');
  ok(/prefers-reduced-motion: reduce/.test((/<script id="hanq-opening-deeplink">[\s\S]*?<\/script>/.exec(s) || [''])[0]) && /\.o-story \.o-part:focus\{outline:3px/.test(ocss), F + '바로 링크 이동은 움직임 줄이기 설정을 따르고, 초점이 옮겨 온 부분 머리에는 테두리가 보임');
  ok((s.match(/<script id="hanq-opening-deeplink">/g) || []).length === 1 && s.indexOf('<script id="hanq-opening-deeplink">') < s.indexOf('</head>'), F + '바로 링크 스크립트 한 번(장면 안 접힌 보충 속 대상이면 그 부모를 엶)');
  const fz = sel => [...ocss.matchAll(new RegExp('\\.o-talk [^{]*\\.' + sel + '\\{[^}]*font-size:([\\d.]+)px', 'g'))].map(m => +m[1]);
  ok(fz('who').length && fz('who').every(v => v >= 14) && fz('role').length && fz('role').every(v => v >= 14) && fz('line').length && fz('line').every(v => v >= 16) && !/\.o-talk (?:b|span)\{/.test(ocss), F + '말풍선 화자 이름·역할 14px 이상, 대사 16px 이상(좁은 화면에서도 줄이지 않음)');
  const sheet = fs.readFileSync(path.join(ROOT, 'media', 'opening-panels.png')), P = (OMAP.panel_source || {}).panels || {};
  ok(require('crypto').createHash('sha256').update(sheet).digest('hex') === 'fcfa1b12f78d896b71d0151cde9a78578fc3bfc42e6f5f893cc13045934befca' && OMAP.panel_source.sha256 === 'fcfa1b12f78d896b71d0151cde9a78578fc3bfc42e6f5f893cc13045934befca' && sheet.readUInt32BE(16) === 1024 && sheet.readUInt32BE(20) === 1536, '개화기 원본 그림판 1024×1536 · 측정 때와 같은 해시');
  const rects = Object.values(P);
  ok(rects.length === 12 && [P.p01.h, P.p04.h, P.p07.h, P.p10.h].join('/') === '370/376/374/400' && rects.every(r => r.x >= 0 && r.y >= 0 && r.x + r.w <= 1024 && r.y + r.h <= 1536) &&
    rects.every((a, i) => rects.every((b, j) => i === j || a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y)), '칸 12개는 그림판 안에서 서로 겹치지 않음 · 행 높이 370/376/374/400');
  // 왕 대수 · 즉위 구분
  const regnal = [...(mainTxt + '\n' + notesSrc).matchAll(/(\d+)대 ([가-힣]+)/g)];
  ok(regnal.length >= 5 && regnal.every(m => KO[+m[1]] && m[2].startsWith(KO[+m[1]])), '개화기 왕 대수 표기는 26대 고종 · 27대 순종뿐 (틀림: ' + regnal.filter(m => !(KO[+m[1]] && m[2].startsWith(KO[+m[1]]))).map(m => m[0]).join(',') + ')');
  ok(/1863 고종 즉위/.test(scs[0] || '') && /흥선대원군 집권/.test(scs[0] || '') && /1863–1873/.test(scs[0] || ''), F + '첫 장면: 1863 고종 즉위와 흥선대원군 집권(1863–1873)을 나눠 표시');
  const s1897 = scs.find(sc => /data-year="1897"/.test(sc)) || '';
  ok(/황제 즉위/.test(txt(s1897)) && /1863년 왕위 즉위와 다른/.test(txt(s1897)) && /대한제국 황제/.test(s1897), F + '1897 황제 즉위를 1863 왕위 즉위와 구분');
  // 정치 흐름 장면 가운데 27대 순종이 처음 나오는 곳 = 1907 고종 강제 퇴위. (②의 ‘더 보기’ 근대 문물은 두 왕 대에 걸친 주제별 정리라 data-kings가 없고, 아래에서 그 왕 줄을 따로 검사)
  const topicOk = sc => !/data-kings=/.test(sc) && /<b class="king">26대 고종 → 27대 순종<\/b><span class="years">여러 왕 대에 걸친 정리 · /.test(sc);
  const iSun = scs.findIndex(sc => /data-kings=/.test(sc) && /27대 순종/.test(txt(sc)));
  ok(iSun > 0 && /data-kings="26-27"/.test(scs[iSun]) && /1907고종을강제로/.test(txt(scs[iSun]).replace(/\s/g, '')) && scs.slice(0, iSun).every(sc => !/순종/.test(sc) || topicOk(sc)), F + '27대 순종은 1907 고종 강제 퇴위 장면에서 처음 등장(앞에는 두 왕 대에 걸친 주제별 정리만)');
  // 정치 흐름: 왕 · 연도 · 순서
  const pol = [], isPol = [];
  scs.forEach((sc, i) => { const k = /data-kings="(\d+)-(\d+)"/.exec(sc), y = /data-year="(\d+)"/.exec(sc); isPol.push(!!k);
    if (k) pol.push({ i, a: +k[1], b: +k[2], y: y ? +y[1] : 0, reign: (/<p class="o-reign"><b class="king">([^<]+)<\/b>/.exec(sc) || [])[1] || '' }); });
  // 주제별 정리는 둘뿐: 근대 문물(②의 ‘더 보기’ 안)과 항일 저항(③의 마지막 장면). 나머지는 모두 정치 흐름 장면
  const topicIdx = isPol.map((p, i) => p ? -1 : i).filter(i => i >= 0);
  ok(pol.length === scs.length - 2 && J(topicIdx.map(i => (/<section class="scene" id="([^"]+)"/.exec(scs[i]) || [])[1])) === J(['modern-culture', 'national-defense']) && topicIdx[1] === scs.length - 1 && topicIdx.every(i => topicOk(scs[i])), F + '정치 흐름 장면 ' + pol.length + '개, 주제별 정리는 ②의 더 보기(근대 문물)와 ③의 마지막(항일 저항) 둘');
  ok(pol.every(p => p.reign.startsWith(p.a + '대 ' + KO[p.a]) && p.reign.includes(KO[p.b])), F + '정치 장면마다 맨 위에 왕 대수·이름');
  ok(pol.every((p, j) => !j || (p.y >= pol[j - 1].y && p.a >= pol[j - 1].a)), F + '정치 장면: 연도·왕 순서가 앞으로만 (' + pol.map(p => p.y).join(' → ') + ')');
  const YR = /(?<!\d)1[89]\d\d(?!\d)/g, yrs = [];
  pol.forEach((p, j) => {
    const sc = scs[p.i];
    yrs.push(...(((/<p class="o-when">([^<]+)<\/p>/.exec(sc) || [])[1] || '').match(YR) || []).map(Number));
    if (j === pol.length - 1) return;
    const nx = pol[j + 1], from = s.indexOf(sc) + sc.length, gap = s.slice(from, s.indexOf(scs[nx.i], from));
    const leap = /data-leap="1"/.test(gap);
    ok(nx.a <= p.b + 1 ? !leap : leap, F + '장면 ' + (p.i + 1) + '→' + (nx.i + 1) + ': 왕을 건너뛰지 않으면 생략 표시 없음');
    // 부 머리(o-part)의 "N부 · 시작–끝"은 범위 표시, 외울 것 카드(o-mem)는 덩어리 되짚기라 사건 순서에서 빼고(따로 검사),
    // 두 정치 장면 사이에 끼인 주제별 장면(②의 근대 문물)도 뺀다. 장면 사이 줄(bridge)의 연도는 그대로 센다.
    yrs.push(...(txt(gap.replace(SCENE, ' ').replace(/<div class="o-part"[\s\S]*?<\/div>/g, ' ').replace(/<aside class="o-mem"[\s\S]*?<\/aside>/g, ' ')).match(YR) || []).map(Number));
  });
  ok(yrs.length > 25 && yrs.every((y, k) => !k || y >= yrs[k - 1]), F + '펼치지 않고 읽는 연도 줄·장면 사이 줄의 연도가 뒤로 가지 않음 (' + yrs.join(' ') + ')');
  // 부 머리 범위: 그 부에 속한 정치 장면의 data-year·연도 줄이 범위 안
  const parts = [...s.matchAll(/<div class="o-part" id="([^"]+)"><small>([^<]*)<\/small>/g)].map(m => ({ id: m[1], at: m.index, r: /\d부 · (\d{4})–(\d{4})/.exec(m[2]) }));
  ok(parts.filter(p => p.r).length === 3, F + '연도 범위가 있는 부 머리 3개(1부·2부·3부) (' + parts.map(p => p.id).join(',') + ')');
  for (const p of pol) {
    const at = s.indexOf(scs[p.i]), pt = parts.filter(q => q.at < at).pop();
    if (!pt || !pt.r) continue;
    const a = +pt.r[1], b = +pt.r[2], ys = [p.y].concat((((/<p class="o-when">([^<]+)<\/p>/.exec(scs[p.i]) || [])[1] || '').match(YR) || []).map(Number));
    ok(ys.every(y => y >= a && y <= b), F + '장면 ' + (p.i + 1) + ': 연도(' + ys.join(',') + ')가 ' + pt.id + ' 범위 ' + a + '–' + b + ' 안');
  }
  // 왕 줄: 사건 기간이 아니라 실제 재위(고종 1863–1907 · 대한제국 황제 1897–1907 · 순종 1907–1910), 아니면 '사건 시기'라고 밝힘
  const REIGN = { '고종': [1863, 1907, /재위 1863–1907/], '순종': [1907, 1910, /재위 1907–1910/] };
  const rl = scs.map((x, i) => ({ i, m: /<p class="o-reign"><b class="king">([^<]+)<\/b><span class="years">([^<]+)<\/span><\/p>/.exec(x), y: +((/data-year="(\d+)"/.exec(x) || [])[1] || 0) })).filter(r => r.m);
  ok(rl.length === scs.length && rl.every(r => r.m[1].trim() && r.m[2].trim()), F + '22장면 모두 왕 줄(왕 이름·기간)이 비어 있지 않음 (' + rl.length + '/' + scs.length + ')');
  for (const r of rl) {
    const k = r.m[1], yv = r.m[2], who = Object.keys(REIGN).filter(n => k.includes(n)), n = F + '장면 ' + (r.i + 1) + ' 왕 줄 “' + k + ' ' + yv + '”: ';
    if (/^사건 시기/.test(yv)) { ok(true, n + '사건 시기로 밝힘'); continue; }
    if (!isPol[r.i]) {
      // 주제별 정리: 한 왕의 때로 오해하지 않게 두 왕 대에 걸친 정리라고 밝히고, 정렬용 data-kings·data-year는 두지 않는다
      ok(k === '26대 고종 → 27대 순종' && /^여러 왕 대에 걸친 정리 · 고종 재위 1863–1907 · 순종 재위 1907–1910$/.test(yv) && !/data-kings=|data-year=/.test(scs[r.i]) && /<p class="o-when">여러 해에 걸친/.test(scs[r.i]), n + '주제별 장면: 고종·순종 두 왕 대에 걸친 정리로 표시, 연도 순서 검사 밖');
      continue;
    }
    ok(who.length > 0 && who.every(w => REIGN[w][2].test(yv)), n + '왕마다 실제 재위 기간');
    ok(!/대한제국 황제/.test(k) || /황제 1897–1907/.test(yv), n + '대한제국 황제는 황제 재위 1897–1907을 따로 표시');
    ok(!/흥선대원군/.test(k) || /흥선대원군 집권 1863–1873/.test(yv), n + '흥선대원군 집권 1863–1873은 고종 재위와 나눠 표시');
    ok(r.y >= Math.min(...who.map(w => REIGN[w][0])) && r.y <= Math.max(...who.map(w => REIGN[w][1])), n + '장면 연도 ' + r.y + '가 재위 안');
  }
  const bodyYears = sc => [...sc.matchAll(/<li><b class="st (?:dev|res|item)">[^<]+<\/b><span>(.*?)<\/span><\/li>/g)].flatMap(m => (txt(m[1]).match(YR) || []).map(Number));
  const scopeOk = sc => /data-scope="reign"/.test(sc) && /<p class="o-scope">[^<]*주제별 정리[^<]*시간이 돌아가[^<]*<\/p>/.test(sc);
  for (let j = 1; j < pol.length; j++) {
    const A = scs[pol[j - 1].i], B = scs[pol[j].i], aMax = Math.max(0, ...bodyYears(A)), bMin = Math.min(9999, ...((((/<p class="o-when">([^<]+)<\/p>/.exec(B) || [])[1] || '').match(YR) || []).map(Number)));
    if (bMin < aMax) ok(scopeOk(B) && pol[j].a === pol[j - 1].a, F + '장면 ' + (pol[j].i + 1) + ': 앞 장면 본문(' + aMax + ')보다 이른 해(' + bMin + ')로 돌아가므로 같은 왕 때의 ‘주제별 정리’이고 시간이 돌아간다고 화면에 밝힘');
  }
  const scoped = scs.filter(sc => /data-scope="reign"/.test(sc));
  ok(scoped.length === 1 && scoped.every(scopeOk) && /data-year="1897"/.test(scoped[0]), F + '시간이 돌아가는 예외 표시는 1897 대한제국 장면 하나뿐, 화면에 보이게');
  // 장면 안: 꼬리표 · 굵은 말 · 꼭 기억 · 말풍선 · 그림 · 접힌 보충
  const LBL = { cause: ['배경'], dev: ['전개'], res: ['결과'] }, seenArt = {};
  scs.forEach((sc, i) => {
    const n = F + '장면 ' + (i + 1) + ': ';
    ok(s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^\s*(?:<aside class="o-mem"[\s\S]*?<\/aside>\s*)?/, '').startsWith('<div class="bridge') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 장면으로 잇는 줄' : '마지막 장면 뒤에는 잇는 줄 없음'));
    ok(((/<p class="o-when">([^<]+)<\/p>/.exec(sc) || [])[1] || '').trim().length > 3, n + '연도·사건 줄');
    const st = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)].map(m => ({ k: m[1], l: m[2], t: m[3] }));
    ok(st.length >= 3 && st.every(x => x.k === 'item' || LBL[x.k].includes(x.l)), n + '흐름 줄 ' + st.length + '개, 꼬리표가 종류와 맞음');
    if (isPol[i]) { const ks = st.map(x => x.k).filter(k => k !== 'item'); ok(ks[0] === 'cause' && ks.indexOf('dev') > 0 && (ks.indexOf('res') < 0 || ks.indexOf('res') > ks.indexOf('dev')), n + '배경 → 전개 → 결과 순서'); }
    else ok(/주제별 정리/.test((/<div class="meta">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '') && /<p class="o-when">여러 해에 걸친/.test(sc), n + '주제별 장면은 제목·연도 줄에 범위 표시');
    const bold = ((sc.match(/<ol class="o-steps"[\s\S]*?<\/ol>/) || [''])[0].match(/<strong>[^<]+<\/strong>/g) || []).map(b => b.replace(/<\/?strong>/g, ''));
    ok(bold.every(b => T.includes(b)) && new Set(bold).size === bold.length, n + '흐름 줄 굵은 말 ' + bold.length + '개는 개화기 강의 핵심어, 한 번씩');
    // 읽는 순서: 제목 → 왕·연도 줄 → 그림 → 개념 그림 표시 → 말풍선 → 배경·전개·결과 → 이 컷 핵심(1–3, 설명 뒤 — 앞에 미리 읽히는 요약이 아님)
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="o-when">/), at(/<div class="o-art/), at(/<p class="o-art-cap">/), at(/<div class="o-talk">/), at(/<ol class="o-steps"/), at(/<div class="o-learn"/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])) && !/class="key"/.test(sc), n + '읽는 순서: 제목 → 왕·연도 줄 → 그림 → 개념 그림 표시 → 말풍선 → 배경·전개·결과 → 이 컷 핵심');
    const learn = (/<div class="o-learn" aria-label="이 컷 핵심"><p class="o-learn-label">이 컷 핵심<\/p><ol>(.*?)<\/ol><\/div>/.exec(sc) || [])[1] || '';
    const li = [...learn.matchAll(/<li><(strong class="lt"|b class="lt plain")>([^<]+)<\/(?:strong|b)><span>([^<]+)<\/span><\/li>/g)];
    ok(li.length >= 1 && li.length <= 3 && li.length === (learn.match(/<li>/g) || []).length, n + '이 장면에서 외울 것 ' + li.length + '개(1–3개)');
    ok(li.every(m => m[3].length >= 12 && /다\.$/.test(m[3]) && m[3].replace(/[\s·,]/g, '') !== m[2].replace(/[\s·,]/g, '')), n + '외울 것마다 용어 나열이 아니라 뜻·관계 한 문장');
    ok(li.every(m => m[1].startsWith('strong') === T.some(t => m[2].includes(t))), n + '외울 것은 강의 핵심어가 든 용어만 굵게(강의 등급을 올리지 않음)');
    const sm = (OMAP.scenes || []).find(x => x.scene === i + 1) || {}, vis = txt(unfold(sc)).replace(/\s/g, '');
    const lost = (sm.exam_clues || []).flatMap(k => k.split(/ · | → /)).filter(p => !vis.includes(p.replace(/\s/g, '')));
    ok((sm.exam_clues || []).length >= 2 && lost.length === 0, n + '예전 꼭 기억 시험 단서 ' + (sm.exam_clues || []).length + '묶음이 외울 것·본문·연도 줄에 펼치지 않고 모두 보임' + (lost.length ? ' (빠짐: ' + lost.join(',') + ')' : ''));
    ok(J(sm.learn) === J(li.map(m => m[2])), n + '장면 지도의 외울 것 = 화면');
    // 말풍선: 그림 밖, 화자 이름 + 역할, 기록에 이름 없는 인물은 설명용 인물, 학습용 요약 대화 표시
    const tk = /<div class="o-talk"><p class="o-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*<\/p>(.*?)<\/div>/.exec(sc);
    const says = tk ? [...tk[1].matchAll(/<p class="say( generic)?" aria-label="([^"]+)"><b class="who">([^<]+)<\/b><span class="role">([^<]+)<\/span><span class="line">([^<]+)<\/span><\/p>/g)] : [];
    ok(says.length === 2 && says.every(m => m[3].trim() && m[4].trim() && m[5].trim() && m[2].startsWith(m[3] + '(' + m[4] + ')')), n + '말풍선 둘: 화자 이름·역할·대사가 모두 있고, 학습용 요약 대화라고 표시');
    ok(says.every(m => !!m[1] === /설명용 인물$/.test(m[4]) && (sm.speakers || []).some(x => x.name === m[3] && x.generic === !!m[1])), n + '기록에 이름이 없는 일반 인물은 ‘설명용 인물’로 밝힘');
    ok(!/<div class="o-art[^"]*"[^>]*>(?:(?!<\/div>)[\s\S])*o-talk/.test(sc), n + '말풍선은 그림 밖(아래)');
    ok(/<p class="o-art-cap">개념 그림[^<]*실제 인물[^<]*아니에요\.<\/p>/.test(sc), n + '그림 아래 ‘개념 그림 · 실제 인물 초상이 아님’ 표시');
    const pm = /<div class="o-art" data-panel="opening-(p\d\d)"><svg class="o-panel" viewBox="(\d+) (\d+) (\d+) (\d+)" width="(\d+)" height="(\d+)" role="img" aria-label="[^"]+"[^>]*><image href="opening-panels\.png" x="0" y="0" width="1024" height="1536"\/><\/svg><\/div>/.exec(sc);
    const im = /<div class="o-art" data-art="new"><img src="(lecture-panels\/opening-[a-z0-9-]+\.png)" width="(\d+)" height="(\d+)" alt="[^"]+"/.exec(sc);
    const pend = /<div class="o-art-pending" role="note" data-art-needed="(lecture-panels\/opening-[a-z0-9-]+\.png)">/.exec(sc);
    ok([pm, im, pend].filter(Boolean).length === 1, n + '그림은 원본 칸·새 개념 그림·그림 준비 중 상자 가운데 정확히 하나');
    if (pm) { const r = P[pm[1]]; ok(r && +pm[2] === r.x && +pm[3] === r.y && +pm[4] === r.w && +pm[5] === r.h && +pm[6] === r.w && +pm[7] === r.h, n + '원본 칸 ' + pm[1] + ' 사각형 전체를 원래 비율로(이웃 칸·확대 없음)'); }
    if (im) { const b = fs.readFileSync(path.join(ROOT, 'media', im[1])); ok(b.readUInt32BE(16) === +im[2] && b.readUInt32BE(20) === +im[3], n + '새 개념 그림 크기 = 실제 파일'); }
    if (pend) ok(!fs.existsSync(path.join(ROOT, 'media', pend[1])) && (OMAP.art_needed || []).some(a => a.scene === i + 1 && a.expected_file === 'media/' + pend[1] && a.brief.length > 40), n + '그림 준비 중: 그림 요청(설명) 기록, 다른 그림으로 대신하지 않음');
    const art = pm ? pm[1] : im ? im[1] : null;
    if (art && seenArt[art]) ok(/<p class="o-art-note">[^<]*같은[^<]*다시[^<]*<\/p>/.test(sc), n + '앞 장면과 같은 그림(' + art + ')을 다시 쓴다고 화면에 밝힘');
    if (art) seenArt[art] = true;
    const det = (sc.match(/<details/g) || []).length;
    ok([...sc.matchAll(/<details class="scene-more"><summary>[^<]+<\/summary><p>[^<]+<\/p><\/details>/g)].length === det && !/<details[^>]* open/.test(sc), n + '접힌 보충 ' + det + '개는 제목 있는 details, 처음엔 닫힘');
  });
  const omods = new Set([...s.matchAll(/data-lecture="([^"]+)"/g)].flatMap(m => m[1].split(' ')));
  ok(H.modules.every(m => omods.has(m.id)) && OMAP.scenes.filter(x => x.scene).length === scs.length, F + '강의 모듈 O01–O' + H.modules.length + ' 모두 장면에 있고 장면 지도와 수가 같음');
  // 사실 · 짝 단서
  // V: 펼치지 않고 보이는 장면 글, C: 같은 글에서 공백을 뺀 것(굵게 표시 때문에 생기는 띄어쓰기에 흔들리지 않게)
  const sc = re => scs.find(x => re.test(x)) || '', V = x => txt(unfold(x)), C = x => V(x).replace(/\s/g, '');
  const s1866 = sc(/1866년, 병인양요/), s1871 = sc(/1871년, 신미양요/);
  ok(['양헌수', '정족산성', '한성근', '문수산성', '외규장각'].every(w => V(s1866).includes(w)) && !/어재연|광성보/.test(V(s1866)), F + '병인양요(1866) = 양헌수 정족산성 · 한성근 문수산성 · 외규장각');
  ok(['어재연', '광성보', '척화비', '1868 오페르트'].every(w => V(s1871).includes(w)) && !/양헌수|정족산성|한성근|문수산성/.test(V(s1871)), F + '신미양요(1871) = 어재연 광성보 → 척화비, 1868 오페르트는 그 앞');
  ok(C(s1866).indexOf('제너럴셔먼호가') > 0 && C(s1866).indexOf('제너럴셔먼호가') < C(s1866).indexOf('프랑스가병인박해를구실로'), F + '1866 제너럴셔먼호 사건을 병인양요보다 앞에');
  const sGang = sc(/1876년, 강화도 조약/), sMi = sc(/1882년, 조미수호통상조약/), sIm = sc(/1882년, 구식 군인의 봉기/), sGap = sc(/1884년, 3일 만에/);
  ok(/원산·인천/.test(V(sGang)) && /측량/.test(V(sGang)) && !/무관세/.test(V(sGang)) && /무관세/.test(folds(sGang)), F + '강화도 조약 본문(개항·측량)과 부속 조약(무관세, 선택 심화)을 나눔');
  ok(['최혜국 대우', '관세', '거중 조정'].every(w => V(sMi).includes(w)) && /1882서양나라와처음/.test(C(sMi)),F + '조미수호통상조약(1882) = 최혜국 대우·관세·거중 조정');
  ok(/제물포 조약/.test(V(sIm)) && /조청상민수륙무역장정/.test(V(sIm)) && /한성 조약/.test(V(sGap)) && /톈진 조약/.test(V(sGap)) && !/한성 조약|톈진 조약/.test(V(sIm).replace(/조청상민수륙무역장정\(청 상인의 한성 상점 개설\)/, '')), F + '임오군란 → 제물포·조청상민수륙무역장정 / 갑신정변 → 한성·톈진');
  ok(/<b class="st item">그 뒤<\/b><span>1885–1887[^<]*거문도/.test(sGap), F + '거문도 사건(1885–1887)은 갑신정변 뒤 ‘그 뒤’로 표시');
  const sDong = sc(/고부에서 전주성까지/), dv = txt((sDong.match(/<ol class="o-steps"[\s\S]*?<\/ol>/) || [''])[0]), at = w => dv.indexOf(w);
  ok(at('고부') >= 0 && at('고부') < at('황토현') && at('황토현') < at('전주성') && at('전주성') < at('전주 화약') && at('전주 화약') < at('집강소'), F + '동학 1차: 고부 → 황토현·황룡촌 → 전주성 → 전주 화약 → 집강소 순서');
  const idx = re => scs.findIndex(x => re.test(x));
  ok(idx(/일본군의 경복궁 점령/) > idx(/고부에서 전주성까지/) && idx(/군국기무처의 1차 갑오개혁/) > idx(/일본군의 경복궁 점령/) && idx(/우금치에서 멈춘/) > idx(/군국기무처의 1차/) && idx(/홍범 14조와 교육 입국 조서/) > idx(/우금치에서 멈춘/), F + '1894: 경복궁 점령·청일 전쟁 → 1차 갑오개혁 → 2차 봉기·우금치 → 2차 갑오개혁');
  const s1st = sc(/군국기무처의 1차 갑오개혁/), s2nd = sc(/홍범 14조와 교육 입국 조서/), sEul = sc(/을미사변과 단발령/);
  ok(/군국기무처/.test(V(s1st)) && /공사 노비제/.test(V(s1st)) && !/홍범/.test(V(s1st)) && ['홍범 14조', '교육 입국 조서', '23부'].every(w => V(s2nd).includes(w)) && !/군국기무처/.test(V(s2nd)), F + '1차 갑오(군국기무처·공사 노비제 폐지)와 2차 갑오(홍범 14조·교육 입국 조서·23부)를 나눔');
  ok(['단발령', '태양력', '건양', '1896년부터 사용', '친위대', '진위대', '아관 파천'].every(w => V(sEul).includes(w)), F + '을미개혁 = 단발령·태양력·건양(1896년부터)·친위대·진위대, 아관 파천으로 중단');
  const sClub = sc(/독립신문과 만민 공동회/), sEmp = s1897;
  ok(/1896서재필이독립신문을발행/.test(C(sClub)) && /독립협회를창립/.test(C(sClub)) && !/독립협회를만들어독립신문/.test(C(sClub)), F + '서재필의 독립신문 발행(1896)과 독립협회 창립(1896)을 따로 적음(협회가 신문을 낸 것처럼 쓰지 않음)');
  ok(/독립문건립(을)?추진/.test(C(sClub)) && !/독립문을세웠|독립문(을)?완공|독립문건립\(?1[89]\d\d/.test(C(sClub)), F + '독립문은 ‘건립 추진’, 완공 연도 없음');
  ok(/관민공동회에서헌의6조/.test(C(sClub)) && !/만민공동회(와관민공동회)?에서헌의6조|만민공동회와관민공동회/.test(C(sClub)) && ['원수부', '지계', '구본신참'].every(w => V(sEmp).includes(w)), F + '1898 만민 공동회와 별도로 관민 공동회에서 헌의 6조 결의 / 광무개혁 = 구본신참·원수부·지계');
  ok(!/서로 돕|동맹/.test(V(sMi)) && /거중조정조항\(다른나라와분쟁이생기면조정·중재/.test(C(sMi)), F + '거중 조정 = 다른 나라와의 분쟁을 조정·중재(서로 돕는 동맹이 아님)');
  const s1904 = sc(/1904년, 고문 정치/), s1905 = sc(/1905년, 외교권을/), s1907 = scs[iSun] || '', s1910 = sc(/1910년, 나라를 빼앗기다/);
  ok(/한일 의정서/.test(V(s1904)) && /제1차 한일 협약/.test(V(s1904)) && /화폐정리사업\(1905\)/.test(C(s1904)) &&/외교권/.test(V(s1905)) && /통감부/.test(V(s1905)) && !/군대 해산|정미/.test(V(s1905)), F + '1904 한일 의정서·제1차 한일 협약 → 1905 화폐 정리 / 1905 을사늑약(외교권·통감부)과 1907 정미 7조약 구분');
  const v7 = txt((s1907.match(/<ol class="o-steps"[\s\S]*?<\/ol>/) || [''])[0]).replace(/\s/g, '');
  ok(v7.indexOf('고종을강제로') >= 0 && v7.indexOf('고종을강제로') < v7.indexOf('27대순종이즉위') && v7.indexOf('27대순종이즉위') < v7.indexOf('군대를해산') && /정미의병/.test(v7),F + '1907: 고종 강제 퇴위 → 27대 순종 즉위 → 정미 7조약·군대 해산 → 정미의병');
  ok(/1909 기유각서로 사법권/.test(V(s1910)) && /1910 경찰권/.test(V(s1910)) && /국권 피탈/.test(V(s1910)), F + '1909 기유각서(사법권) → 1910 경찰권 → 국권 피탈');
  const sDebt = sc(/빚을 갚고, 사람을 키우고/), debtSent = V(sDebt).split(/[.!?]/).filter(x => /양기탁/.test(x));
  ok(/김광제·서상돈이국채보상운동을시작/.test(C(sDebt)) &&debtSent.length > 0 && debtSent.every(x => /대한매일신보/.test(x)), F + '국채보상운동은 김광제·서상돈이 시작, 양기탁은 대한매일신보로 지원');
  ok(!/105인|1911/.test(visMain) && /105인 사건/.test(folds(sDebt)) && /다음 시대 미리 보기/.test(folds(sDebt)), F + '105인 사건(1911)은 본 줄거리에 없고 주제별 장면의 ‘다음 시대 미리 보기’에만');
  ok(!/땡전|인내천|시천주|독살|인절미/.test(mainTxt + notesSrc) && !/자주 나|빈출|반드시 나|매번 나|출제 확률|\d+\s*%|\d+문제|\d+점/.test(mainTxt + notesSrc), '개화기: 민간 어원·뒤 시기 교리 표현·출제 빈도·점수 주장 없음');
  // 요약 데이터
  ok(L.groups.every(g => g.mod.every(id => mod(id).priority === g.tier)) && H.modules.every(m => L.groups.some(g => g.mod.includes(m.id))), '개화기 요약: 묶음 등급 = 강의 모듈 등급, 모든 모듈이 묶음에 있음');
  ok(L.groups.every(g => g.rows.every(r => r[0].length <= 40 && r[1].length <= 48)), '개화기 요약: 짧은 설명');
  // 세 부분 이야기(요약 첫 화면 · 웹툰 세 부분의 기준 데이터): ① 나라를 바로잡자 4 · ② 나라를 개혁하자 5 · ③ 나라를 지키자 5
  const PT = L.parts || { list: [] }, PL = PT.list || [], plain = x => String(x).replace(/\*\*/g, '');
  const pj = /\/\*PARTS-JSON\*\/([\s\S]*?)\/\*END-PARTS-JSON\*\//.exec(notesSrc);
  ok(pj && J(JSON.parse(pj[1])) === J(PT), '세 부분 요약은 표시 사이 순수 JSON 하나(웹툰 생성기와 같은 원본)');
  ok(J(PL.map(p => p.no + ' ' + p.name)) === J(['① 나라를 바로잡자', '② 나라를 개혁하자', '③ 나라를 지키자']) && J(PL.map(p => p.chunks.length)) === J([4, 5, 5]) && /겹/.test(PT.note), '개화기 세 부분: 나라를 바로잡자 4 · 나라를 개혁하자 5 · 나라를 지키자 5 덩어리, 시기가 겹치는 주제 묶음이라고 밝힘');
  const CK = PL.flatMap(p => p.chunks);
  ok(CK.every(k => /^(26대 고종|27대 순종|26대 고종 → 27대 순종) · \d{4}(–\d{4})?$/.test(k.w)), '덩어리마다 짧은 왕 · 시기 (예: 26대 고종 · 1882) — 재위 전체 문장 반복 없음');
  // 실제 문장 수: 항목마다 마침표로 끝나는 문장 하나(안에 다른 마침표 없음) → 덩어리마다 실제 2–4문장. 이어 붙인 긴 문장 막기: 90자 이하 · 쉼표 2개 이하
  const sentences = s => (plain(s).match(/\.(?=\s|$)/g) || []).length;
  const badSent = CK.flatMap(k => k.story.filter(s => sentences(s) !== 1 || !/\.$/.test(s) || !/다[.(]/.test(plain(s)) || plain(s).length < 15 || plain(s).length > 90 || (plain(s).match(/,/g) || []).length > 2).map(s => k.t + ': ' + plain(s).slice(0, 24)));
  ok(CK.every(k => k.story.length >= 2 && k.story.length <= 4 && k.story.reduce((n, s) => n + sentences(s), 0) === k.story.length && /\*\*[^*]+\*\*/.test(k.story.join(''))) && badSent.length === 0, '덩어리마다 실제 2–4문장(항목 하나 = 문장 하나, 90자 이하, 쉼표 2개 이하), 이야기 안에서 용어 굵게' + (badSent.length ? ' (고칠 문장: ' + badSent.join(' / ') + ')' : ''));
  ok(PL.every(p => !p.lead || (sentences(p.lead) === 1 && plain(p.lead).length <= 70)), '세 부분 머리 한 문장은 짧게(본문과 겹치지 않게)');
  ok(CK.every(k => k.k.length >= 1 && k.k.length <= 3), '덩어리마다 암기 키워드 1–3개');
  const yr = k => +((/(\d{4})/.exec(k.w) || [])[1] || 0), polCK = CK.filter(k => !/주제별/.test(k.t));
  ok(polCK.every((k, i) => !i || yr(k) >= yr(polCK[i - 1])) && CK.filter(k => /주제별/.test(k.t)).length === 1 && /시기가 겹/.test(CK[CK.length - 1].t + CK[CK.length - 1].story.join('')), '덩어리 시작 연도는 앞으로만, 주제별 저항 덩어리 하나만 시기가 겹친다고 밝힘');
  const ckText = t => plain((CK.find(k => k.t === t) || { story: [] }).story.join(' ')), allTxt = plain(CK.map(k => k.story.join(' ')).join(' '));
  const yo = PL[0].chunks[1] || {}, memo = yo.memo || {};
  ok(/병제병오신척/.test(memo.label) && memo.text === '병인박해 → 제너럴셔먼호 사건 → 병인양요 → 오페르트 도굴 미수 → 신미양요 → 척화비' && /시간 순서/.test(memo.note) && /병인박해 → 프랑스/.test(memo.note) && /제너럴셔먼호 사건 → 미국/.test(memo.note) && !/오페르트[^.→]*→[^.]*미국/.test(memo.note + allTxt), '병제병오신척 = 시간 순서, 원인은 박해 → 프랑스 · 셔먼호 → 미국 (오페르트 → 미국 침략으로 잇지 않음)');
  const p1 = plain(PL[0].chunks.map(k => k.story.join(' ')).join(' '));
  ok(['비변사', '경복궁 중건', '당백전', '호포제', '통상을 거부', '직접 정치', '1875년', '운요호', '1876년', '강화도 조약', '부록', '조일무역규칙'].every(w => p1.includes(w)) && p1.indexOf('왕권이 약했기 때문에') < p1.indexOf('비변사를 줄였') && p1.indexOf('직접 정치') < p1.indexOf('운요호') && p1.indexOf('운요호') < p1.indexOf('강화도 조약'), '① 나라를 바로잡자: 왕권 강화 이유 → 경복궁·당백전·비변사·호포제 / 통상 거부 / 고종 친정 → 운요호(1875) → 강화도 조약(1876)·부록·무역규칙');
  const dh = ckText('동학 농민 운동과 갑오개혁');
  const dat = w => dh.indexOf(w);
  ok(/최제우는 1860년 동학을 창시/.test(dh) && /1894년 고부의 탐관오리 군수 조병갑/.test(dh) && /전봉준을 따라 일어났/.test(dh) && !/1896/.test(dh) &&
    dat('전주성을 점령') > 0 && dat('전주성을 점령') < dat('청에 군대를 요청') && dat('청에 군대를 요청') < dat('일본도 군대를 보내') && dat('일본도 군대를 보내') < dat('경복궁') && dat('경복궁') < dat('2차 봉기') && dat('2차 봉기') < dat('우금치'),
    '동학: 최제우 창시(1860) · 조병갑(고부 탐관오리) · 전봉준(1894) / 전주성 점령 → 정부가 청군 요청 → 일본도 파병·경복궁 점령 → 2차 봉기 → 우금치 순서');
  ok(/관민 공동회에서 헌의 6조/.test(allTxt) && !/만민 공동회에서 헌의/.test(allTxt) && /최고 군사 기구인 원수부/.test(allTxt) && /서울 상인들은 1898년 황국 중앙 총상회를 만들어 상권 수호/.test(allTxt) && /황국협회와 다른/.test(allTxt), '헌의 6조 = 관민 공동회 · 원수부 = 황제 직속 최고 군사 기구 · 황국 중앙 총상회(1898 상권 수호) ≠ 황국협회');
  ok(/1904년 보안회는 일본의 황무지 개간권 요구를 막아/.test(allTxt) && /김광제·서상돈이 국채보상운동을 시작/.test(allTxt) && allTxt.split(/[.]/).filter(x => /양기탁/.test(x)).every(x => /대한매일신보/.test(x)) && /1909년 안중근이 하얼빈에서 이토 히로부미/.test(allTxt), '보안회(황무지 개간권) · 국채보상(김광제·서상돈 시작, 양기탁은 대한매일신보로 지원) · 안중근(1909 하얼빈 · 이토)');
  ok(/1905년 을사늑약으로 대한제국의 외교권/.test(allTxt) && /1906년 통감부/.test(allTxt) && /1909년 기유각서/.test(allTxt) && allTxt.indexOf('을사늑약으로') < allTxt.indexOf('헤이그 특사') && allTxt.indexOf('정미 7조약') < allTxt.indexOf('기유각서'), '③ 조약 구분·순서: 을사늑약(1905 외교권) → 통감부(1906) → 헤이그 특사·정미 7조약(1907) → 기유각서(1909)');
  ok(!L.groups.some(g => g.rows.some(r => /105인|1911/.test(r.join(' ')))) && L.recall.filter(r => /105인/.test(r.a)).length === 1 && L.recall.filter(r => /105인/.test(r.a)).every(r => /다음 시대/.test(r.q) && /1911/.test(r.a)), '개화기 요약: 105인 사건(1911)은 보이는 묶음 행이 아니라 ‘다음 시대’ 떠올리기(접힘)에만');
  const gj = L.groups.find(g => g.mod.includes('O09')) || { rows: [], g: '' }, gc = (L.groups.flatMap(g => g.rows).find(r => r[0] === '거중 조정') || ['', ''])[1];
  ok(gj.tier === 'core' && /전봉준/.test(gj.g) && gj.rows.some(r => r[0] === '전봉준' && /지도자/.test(r[1])) && gj.rows.some(r => /전주 화약/.test(r[0]) && /집강소/.test(r[0])), '개화기 요약: 동학 농민 운동(먼저 기억) 묶음에 지도자 전봉준 · 전주 화약 · 집강소');
  ok(/조정|중재/.test(gc) && /분쟁/.test(gc) && !/돕|동맹|위협/.test(gc), '개화기 요약: 거중 조정 = 다른 나라와 분쟁을 조정·중재 (' + gc + ')');
  const club = (L.groups.find(g => g.mod.includes('O12')) || { rows: [] }).rows, cr = k => (club.find(r => r[0] === k) || ['', ''])[1];
  ok(/1896/.test(cr('서재필 · 독립신문')) && /1896 창립/.test(cr('독립협회')) && /건립 추진/.test(cr('독립협회')) && /헌의 6조/.test(cr('관민 공동회 · 헌의 6조')) && !/헌의/.test(cr('만민 공동회')) && !club.some(r => /만민 공동회 · 관민 공동회/.test(r[0])), '개화기 요약: 독립신문(1896)과 독립협회 창립(1896) 따로, 헌의 6조는 관민 공동회');
  const want = new Set(); for (const g of L.groups) if (g.tier === 'core') for (const id of g.mod) for (const k of mod(id).highlight_keywords) want.add(k);
  ok(J([...want].sort()) === J(T.slice().sort()), '개화기 굵게 표시 목록 = 먼저 기억 모듈 강조어(' + want.size + ')');
  ok(['O02', 'O05', 'O10', 'O13', 'O19'].every(id => mod(id).priority === 'core') && ['O04', 'O14', 'O21'].every(id => mod(id).priority === 'optional') && H.modules.filter(m => m.priority === 'core').length < H.modules.length * 0.75, '강의 강조 등급: 강하게 짚은 모듈은 먼저 기억, 낮춘 범위는 선택 심화, 먼저 기억이 전부는 아님');
  const cover = (id, a, b) => mod(id).priority_evidence.some(e => e.lines[0] <= a && e.lines[1] >= b);
  ok(cover('O02', 1302, 1303) && cover('O05', 1336, 1341) && cover('O10', 1445, 1447) && cover('O10', 1522, 1526) && cover('O13', 1518, 1520) && cover('O19', 1542, 1547) && cover('O19', 1567, 1567) && cover('O04', 1329, 1329) && cover('O21', 1588, 1588), '강조 근거 행이 실제 강의의 강조·범위 낮춤 행과 맞음');
  ok(/중종|명종/.test(notesSrc) === false && /'1부 · 흥선대원군 집권 \(1863–1873\)'/.test(notesSrc) && /1897 대한제국 선포·고종의 황제 즉위/.test(notesSrc), '개화기 요약 흐름: 1863–1873 흥선대원군 집권과 1897 황제 즉위를 나눔');
  // 생성기 · 대조표 · 문서
  const { spawnSync } = require('child_process');
  const cs = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_opening_sources.cjs'), '--check'], { encoding: 'utf8' });
  ok(cs.status === 0, '개화기 근거 지도·핵심어 파일이 강의 분석·요약·장면 지도와 일치' + (cs.status === 0 ? '' : ' — ' + (cs.stderr || '').trim()));
  const qm = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'build_opening_question_map.cjs'), '--check'], { encoding: 'utf8' });
  ok(qm.status === 0, '개화기 문항 대조표(docs/opening-question-map.json)가 현재 문항·웹툰·요약과 일치' + (qm.status === 0 ? '' : ' — ' + (qm.stderr || '').trim()));
  const om = (cur.mocks.opening || []).map(x => x.exam + '-' + x.number);
  ok(J(om) === J(['75-28', '76-29', '76-31', '77-30', '77-33']), '앱의 개화기 기출은 실제 5문항 (' + om.join(',') + ')');
  const NEED = { '75-28': ['갑신정변', '김옥균', '한성 조약', '톈진 조약'], '76-29': ['경복궁', '당백전', '병인양요', '한성근', '문수산성'], '76-31': ['전봉준', '전주 화약', '집강소'], '77-30': ['단발령', '태양력', '건양', '친위대', '진위대'], '77-33': ['을사늑약', '외교권', '통감부', '민영환'] };
  for (const [q, ws] of Object.entries(NEED)) ok(ws.every(w => visMain.includes(w)), '기출 ' + q + ' 단서가 개화기 웹툰에 펼치지 않아도 보임: ' + ws.join(' · '));
  const SUMNEED = { '75-28': ['갑신정변', '톈진 조약'], '76-29': ['경복궁 중건', '병인양요', '한성근'], '76-31': ['전봉준', '전주 화약', '집강소'], '77-30': ['단발령', '건양', '친위대'], '77-33': ['을사늑약', '통감부'] };
  for (const [q, ws] of Object.entries(SUMNEED)) ok(ws.every(w => notesSrc.includes(w)), '기출 ' + q + ' 핵심 단서가 개화기 강의 요약에도 있음: ' + ws.join(' · '));
  const QM = fs.existsSync(path.join(ROOT, 'docs', 'opening-question-map.json')) ? JSON.parse(rdr('docs/opening-question-map.json')) : null;
  ok(QM && QM.inline.length === (cur.quizzes.opening || []).length && J(QM.past_exam.map(x => x.id)) === J(om), '대조표: 앱의 개화기 빈칸·기출 문항 id를 모두 기록');
  if (QM) console.log('  · 개화기 빈칸 글자 대조(출제 비중 추정 아님): ' + JSON.stringify(QM.counts));
  const odoc = fs.existsSync(path.join(ROOT, 'docs', 'opening-scene-sources.md')) ? rdr('docs/opening-scene-sources.md') : '';
  ok(odoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && odoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442') && odoc.includes('fcfa1b12f78d896b71d0151cde9a78578fc3bfc42e6f5f893cc13045934befca'), '개화기 근거 문서: 강의 스크립트·교재·그림판 SHA-256 기록');
  ok(Array.from({ length: scs.length }, (_, i) => '| ' + String(i + 1).padStart(2, '0') + ' |').every(x => odoc.includes(x)) && H.modules.every(m => odoc.includes(m.id)) && om.every(id => odoc.includes(id)), '개화기 근거 문서: 장면 ' + scs.length + '개·모듈·기출 id 모두 기록');
  ok(odoc.includes('docs/opening-question-map.json') && !/\d+\s*%/.test(odoc) && /공식 출처와 하나하나 대조하지 않았/.test(odoc), '개화기 근거 문서: 빈칸 대조표 · 연도 확인 한계, 비율 주장 없음');
  for (const f of ['scripts/build_opening_comic.py', 'scripts/build_opening_sources.cjs', 'scripts/build_opening_question_map.cjs', 'docs/opening-lecture-handoff.json', 'media/lecture-notes-opening.js'])
    ok(!/\/Users\//.test(rdr(f)) && !/Math\.random|Date\.now|new Date|\brandom\b|datetime|time\.time/.test(rdr(f)), f + ': 개인 경로·시간·난수 없음');
}

section('11. 독도와 간도: 두 주제 · 7컷 모두 펼친 채 · 컷 뒤 외울 것 · 원본 칸 그림');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8')), txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const s = rdr('media/islands-comic.html'), scs = s.match(SCENE) || [], F = 'islands-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>'));
  const icss = (/<style id="hanq-islands-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const fsrc = rdr('media/lecture-flow-islands.js'), FLOW = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[]}'])[1]), TL = FLOW.list || [];
  // 화면 순서(주제별로 나눔)와 원래 그림판 칸(2열×4행, 열·행) — 원래 웹툰의 --x/--y와 같은 칸
  const ORDER = ['scene-1', 'scene-3', 'treaties-1904', 'scene-2', 'stele-mountain', 'scene-4', 'independence-battles'];
  const CELL = { 'scene-1': [0, 0], 'scene-3': [1, 2], 'treaties-1904': [0, 2], 'scene-2': [1, 1], 'stele-mountain': [0, 3], 'scene-4': [1, 3], 'independence-battles': [1, 3] };
  const TOPIC = { 'scene-1': 'topic-dokdo', 'scene-3': 'topic-dokdo', 'treaties-1904': 'topic-dokdo', 'scene-2': 'topic-gando', 'stele-mountain': 'topic-gando', 'scene-4': 'topic-gando', 'independence-battles': 'topic-gando' };
  const idOf = sc => (/<section class="scene"[^>]*\sid="([^"]+)"/.exec(sc) || [])[1];
  ok(/<body class="i-story">/.test(s) && (s.match(/id="hanq-islands-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.i-talk\{grid-template-columns:1fr/.test(icss), F + '두 주제 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(J(scs.map(idOf)) === J(ORDER), F + '7컷을 주제별 순서로: 독도(scene-1 → scene-3 → treaties-1904) → 간도(scene-2 → stele-mountain → scene-4 → independence-battles) (' + scs.map(idOf).join(',') + ')');
  ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<section class="scene"/.test(mainHtml) && !/class="bubble/.test(mainHtml) && !/background-size|background-position/.test(mainHtml), F + '컷은 하나도 접지 않음 · 그림 위 말풍선·확대 배경 없음');
  // 두 주제 데이터(media/lecture-flow-islands.js)
  ok(J(TL.map(t => [t.id, t.no + ' ' + t.name, t.start])) === J([['topic-dokdo', '① 독도', 'scene-1'], ['topic-gando', '② 간도', 'scene-2']]) && /서로 다른 두 주제/.test(FLOW.note) && /시간 순서가 아니/.test(FLOW.note), '독도와 간도 데이터: 두 주제(① 독도 · ② 간도), 한 땅의 이어진 시간 순서가 아니라고 밝힘');
  const CH = TL.flatMap(t => t.chunks);
  ok(J(CH.map(k => k.go)) === J(['scene-1', 'scene-3', 'scene-2', 'scene-4']) && TL.every(t => t.chunks[0].go === t.start) && CH.every(k => k.story.length >= 1 && k.story.length <= 4 && k.x && k.k.length >= 1 && k.k.length <= 3), '독도와 간도 데이터: 덩어리 4개(우산국 · 러일전쟁 무렵 · 백두산정계비 · 간도 기지와 전투), 각각 이야기 1–4문장 · 헷갈리지 않기 · 키워드 1–3');
  // 주제 머리: 그 주제 첫 컷 바로 앞
  const heads = [...s.matchAll(/<div class="i-topic" id="(topic-[a-z]+)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
  ok(heads.length === 2 && heads.every(m => { const t = TL.find(x => x.id === m[1]); const sc = t && scs[ORDER.indexOf(t.start)]; return t && m[3] === t.no + ' ' + t.name && m[2].includes(t.range) && s.indexOf(m[0]) + m[0].length === s.indexOf(sc); }), F + '주제 머리 둘(① 독도 · ② 간도)은 각 주제 첫 컷 바로 앞, 범위(시대) 표시');
  // 바로 가기 줄(개화기·조선과 같은 방식)
  const navM = /<nav class="i-nav" aria-label="[^"]+"><div class="i-nav-track">((?:<a href="#topic-[a-z]+">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
  ok(navM && J([...navM[1].matchAll(/href="#([^"]+)"/g)].map(m => m[1])) === J(['topic-dokdo', 'topic-gando']) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '주제 바로 가기는 두 주제 머리로 가는 링크만(줄 하나)');
  ok(/\.i-story nav\.i-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(icss) && /\.i-story \.i-nav-track\{[^}]*overflow-x:auto/.test(icss) && /\.i-story nav\.i-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(icss) &&
    /\.i-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(icss) && /@media\(min-width:760px\)\{\.i-story nav\.i-nav\{padding-right:10px\}\}/.test(icss) &&
    /\.i-story \.scene\{[^}]*scroll-margin-top:68px/.test(icss) && /\.i-story \.i-topic\{[^}]*scroll-margin-top:68px/.test(icss) && /\.i-mem\{[^}]*scroll-margin-top:68px/.test(icss) &&
    icss.indexOf('.embedded .i-story nav{display:none}') > icss.indexOf('.i-story nav.i-nav{position:sticky'), F + '바로 가기 줄 60px 고정 · 홈 버튼은 오른쪽 92px 빈자리에 · 링크 44px · 앵커 이동 때 제목이 가려지지 않음 · 앱 안에서는 숨김(줄 규칙보다 뒤)');
  ok(/\.i-story \.i-topic:focus\{outline:3px/.test(icss), F + '바로 가기로 초점이 옮겨 온 주제 머리에 테두리');
  // 글자 크기: 대사 16px · 화자 14px(그림 밖) · 카드 이야기 16px
  ok(/\.i-talk span\{[^}]*font-size:16px/.test(icss) && /\.i-talk b\{[^}]*font-size:14px/.test(icss) && /\.i-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(icss) && /\.i-steps li\{[^}]*font-size:16px/.test(icss), F + '대사 16px · 화자 이름·역할 14px · 설명·카드 이야기 16px');
  // 컷마다
  const GEN = /^(신라 군사|대한제국 사람|동료|대한제국 관리|관리|동료 관리|독립운동가|독립군) · 설명용 인물$/;
  const bKeys = {}; if (base) for (const sc of (fs.readFileSync(path.join(BASE, 'media', 'islands-comic.html'), 'utf8').match(SCENE) || [])) bKeys[idOf(sc)] = { key: (/<p class="key">([^<]+)<\/p>/.exec(sc) || [])[1], h2: (/<h2>([^<]+)<\/h2>/.exec(sc) || [])[1] };
  scs.forEach((sc, i) => {
    const id = idOf(sc), n = F + id + ': ';
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="i-when">/), at(/<div class="art i-art"/), at(/<p class="i-art-cap">/), at(/<p class="i-talk-cap">/), at(/<ol class="i-steps"/), at(/<p class="key">/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])), n + '읽는 순서: 제목 → 때 줄 → 그림 칸 → 개념 그림 표시 → 학습용 요약 대화 → 설명 → 꼭 기억');
    const c = CELL[id] || [-1, -1], st = (/<div class="art i-art" role="img" aria-label="[^"]+" style="([^"]+)"><\/div>/.exec(sc) || [])[1];
    ok(st === '--x:' + (c[0] * 100).toFixed(3) + '%;--y:' + (c[1] * 100 / 3).toFixed(3) + '%', n + '그림판 칸 (' + c.join(',') + ') 전체를 원래 비율로(확대·이웃 칸 없음)');
    const says = [...((/<div class="i-talk">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '').matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)];
    ok(/<p class="i-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*<\/p><div class="i-talk">/.test(sc) && says.length === 2 && says.every(m => m[1] === m[2] + ': ' + m[3] && (m[2] === '이사부' || /^해설 · /.test(m[2]) || GEN.test(m[2]))), n + '말풍선 둘은 그림 밖(아래), ‘학습용 요약 대화’ 표시, 이사부 말고는 ‘설명용 인물’ 또는 ‘해설’로 밝힘');
    const steps = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>([^<]+)<\/span><\/li>/g)];
    ok(steps.length >= 2 && steps.every(m => m[3].length >= 12 && /다\.$/.test(m[3])) && ((/<p class="i-when">([^<]+)<\/p>/.exec(sc) || [])[1] || '').length > 3, n + '때 줄 + 설명 ' + steps.length + '줄(누가·왜·무엇을·결과를 문장으로)');
    if (base && bKeys[id]) ok((/<p class="key">([^<]+)<\/p>/.exec(sc) || [])[1] === bKeys[id].key && (/<h2>([^<]+)<\/h2>/.exec(sc) || [])[1] === bKeys[id].h2, n + '원래 제목·꼭 기억 단서 그대로');
    const rest = s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="i-mem"[\s\S]*?<\/aside>)?/, '');
    ok(rest.startsWith('<div class="story-seam') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 컷으로 잇는 줄' : '마지막 컷 뒤에는 잇는 줄 없음'));
  });
  ok(/<p class="i-art-note">[^<]*같은 칸[^<]*다시[^<]*<\/p>/.test(scs[6] || '') && /앞 장면 그림 다시 사용/.test(scs[6] || '') && (scs.filter(sc => /i-art-note/.test(sc)).length === 1), F + '마지막 컷은 앞 컷과 같은 칸 전체를 다시 쓴다고 화면에 밝힘(확대 없음)');
  ok(/<b>해설 · 뒷날을 미리 짚음<\/b><span>서간도·북간도 기지는 훨씬 뒤의 일이지요\.<\/span>/.test(scs[4] || '') && !/뒷날의 독립운동가/.test(s), F + '정계비 컷의 뒷날 이야기는 ‘해설(뒷날을 미리 짚음)’로 밝힘(시간 여행 대화 아님)');
  // 외울 것 카드: 덩어리의 마지막 컷 바로 뒤
  const cards = [...s.matchAll(/<aside class="i-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="i-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
  ok(J(cards.map(m => m[1])) === J(['treaties-1904','independence-battles']) && cards.every(m => { const sc = scs[ORDER.indexOf(m[1])]; return sc && s.indexOf(sc) + sc.length === m.index; }), F + '외울 것 카드 4장은 덩어리의 마지막 컷 바로 뒤(' + cards.map(m => m[1]).join(',') + ')');
  const kRe = /<div class="i-mem-k"><p class="i-mem-head"><b class="i-mem-t">([^<]+)<\/b><span class="i-mem-w">([^<]+)<\/span><\/p><div class="i-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="i-memo">[\s\S]*?<\/div>)?(<p class="i-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="i-keys"><span class="i-keys-label">암기 키워드<\/span>((?:<span class="i-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), unstar = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + unstar(x) + '</p>').join('') && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="i-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k); }), F + '카드 = 데이터의 덩어리 순서·때·이야기(핵심어 굵게)·외우는 순서·헷갈리지 않기·키워드');
  // 주제 사이: 시대를 이어 붙이지 않음
  ok(/<div class="story-seam i-switch"[^>]*><span class="story-seam-dots"[^>]*>…<\/span><span class="story-seam-text">여기까지가 독도 이야기예요\. 이제 주제를 바꿔[^<]*<\/span><\/div>\n?<div class="i-topic" id="topic-gando">/.test(s), F + '독도 → 간도는 주제가 바뀐다고 밝힌 줄 바로 뒤에 ② 간도 머리(앞 주제의 결과로 잇지 않음)');
  ok(/시대가 크게 건너뛰어요/.test(txt(s.slice(s.indexOf('id="mem-scene-1"'), s.indexOf('id="scene-3"')))) && /시대가 크게 건너뛰어요/.test(txt(s.slice(s.indexOf('id="mem-stele-mountain"'), s.indexOf('id="scene-4"')))), F + '주제 안의 큰 시대 건너뜀(우산국 → 러일전쟁, 정계비 → 독립운동 기지)을 잇는 줄에 밝힘');
  ok(!/바다와 국경을 지키려는 움직임은 독립운동 기지의 이야기로 이어진다|돌에 새긴 경계 뒤에도 바다의 섬|바다의 섬을 살피는 동안, 북쪽에서는/.test(s), F + '두 주제를 하나의 시간 순서처럼 잇던 예전 연결 문장 없음');
  ok(/href="\.\.\/index\.html#chapter\/islands\/quiz" target="_top">[^<]*퀴즈로/.test(s) && !/요약 노트·문제로 이어가기/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로)');
  // 원래 앵커 · 그림판 · 장면 지도
  ok(ORDER.every(id => (s.match(new RegExp(' id="' + id + '"', 'g')) || []).length === 1), F + '원래 앵커 7개(#scene-1–4 · #stele-mountain · #treaties-1904 · #independence-battles) 하나씩');
  const sheet = fs.readFileSync(path.join(ROOT, 'media', 'islands-panels.png')), sw = sheet.readUInt32BE(16), sh = sheet.readUInt32BE(20);
  ok(/url\('islands-panels\.png'\);background-size:200% 400%/.test(s) && /\.art\{aspect-ratio:4\/3;background-size:200% 400%\}/.test(s) && Math.abs((sw / 2) / (sh / 4) - 4 / 3) < 0.03, F + '그림판 ' + sw + '×' + sh + ' = 2열×4행, 칸 비율 4:3 그대로 보여 줌');
  ok(IMAP.generated_by === 'scripts/build_islands_comic.py' && J(IMAP.scenes.map(x => x.id)) === J(ORDER) && IMAP.scenes.every(x => J(x.cell) === J(CELL[x.id]) && x.topic === TOPIC[x.id]) && J(IMAP.memory.map(x => x.after)) === J(cards.map(m => m[1])) && IMAP.scenes.filter(x => x.reused).length === 1, '독도와 간도 장면 지도 = 화면(순서·주제·칸·카드 위치·다시 쓴 그림 1)');
  // 노트·문제는 그대로, 생성기·근거 문서
  const ic = cur.chapters.find(c => c.id === 'islands');
  ok(ic && ic.note.length === 5 && (cur.quizzes.islands || []).length > 0, '독도와 간도 노트 카드 5장 · 빈칸 문제 그대로(' + (cur.quizzes.islands || []).length + ')');
  if (base) { const bc = base.chapters.find(c => c.id === 'islands'); ok(bc && J(bc.note) === J(ic.note) && J(base.quizzes.islands) === J(cur.quizzes.islands) && J((base.mocks || {}).islands) === J((cur.mocks || {}).islands), '독도와 간도 노트·빈칸·기출은 기준본과 같음'); }
  const igen = rdr('scripts/build_islands_comic.py');
  ok(!/\/Users\//.test(igen + fsrc) && !/\brandom\b|datetime|time\.time|Math\.random|Date\.now/.test(igen + fsrc), '독도와 간도 생성기·데이터: 개인 경로·시간·난수 없음');
  ok(/LECTURE_MANAGED = \{[^}]*'islands'/.test(rdr('scripts/build_comics.py')), 'build_comics.py는 독도와 간도를 다시 쓰지 않음(전용 생성기가 관리)');
  const idocPath = path.join(ROOT, 'docs', 'islands-scene-sources.md'), idoc = fs.existsSync(idocPath) ? fs.readFileSync(idocPath, 'utf8') : '';
  ok(ORDER.every(id => idoc.includes('`' + id + '`')) && idoc.includes('media/lecture-flow-islands.js') && idoc.includes('scripts/build_islands_comic.py') && !/%/.test(idoc), '독도와 간도 근거 문서: 7컷 · 데이터 · 생성기 기록, 비율 주장 없음');
  ok(/media\/lecture-flow-islands\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\[[^\]]*'islands'[^\]]*\]/.test(cur.html), 'index.html: 독도와 간도도 한 페이지 학습(두 주제 바로 가기 데이터 연결)');
}

section('12. 일제 강점기: 네 흐름 · 18컷 모두 펼친 채 · 원본 칸 전체(SVG) · 컷 뒤 외울 것 · 강의 근거');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8')), txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const s = rdr('media/colonial-comic.html'), scs = s.match(SCENE) || [], F = 'colonial-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>'));
  const ccss = (/<style id="hanq-colonial-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const fsrc = rdr('media/lecture-flow-colonial.js'), CF = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[],"terms":[]}'])[1]), CL = CF.list || [], TERMS = CF.terms || [];
  const ORDER = ['scene-1','scene-2','scene-3','scene-4','secret-societies','scene-5','scene-6','singanhoe','social-movements','uiyeoldan','scene-7','scene-8','scene-10','language-history','manchuria-1930s','scene-9','scene-11','scene-12'];
  // 칸 번호: 원래 장면 n = 원본 칸 n(예전 --x/--y 3열×4행 위치), 덧붙인 장면 = 예전에 확대해 쓰던 칸(이제 칸 전체)
  const PANEL_OF = { 'scene-1': 1, 'scene-2': 2, 'scene-3': 3, 'scene-4': 4, 'scene-5': 5, 'scene-6': 6, 'scene-7': 7, 'scene-8': 8, 'scene-9': 9, 'scene-10': 10, 'scene-11': 11, 'scene-12': 12,
    'secret-societies': 6, 'singanhoe': 3, 'social-movements': 2, 'uiyeoldan': 9, 'manchuria-1930s': 7, 'language-history': 5 };
  const RECT = { 1: [0, 0, 338, 370], 2: [345, 0, 334, 370], 3: [686, 0, 338, 370], 4: [0, 378, 338, 366], 5: [345, 378, 334, 366], 6: [686, 378, 338, 366],
    7: [0, 752, 338, 355], 8: [345, 752, 334, 355], 9: [686, 752, 338, 355], 10: [0, 1115, 338, 421], 11: [345, 1115, 334, 421], 12: [686, 1115, 338, 421] };
  const idOf = sc => (/<section class="scene"[^>]*\sid="([^"]+)"/.exec(sc) || [])[1];
  ok(/<body class="c-story">/.test(s) && (s.match(/id="hanq-colonial-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.c-talk\{grid-template-columns:1fr/.test(ccss), F + '일제 강점기 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(J(scs.map(idOf)) === J(ORDER), F + '18컷을 강의 순서로: 통치 세 시기(①–③) → 독립운동사(④) (' + scs.map(idOf).join(',') + ')');
  ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<section class="scene"/.test(mainHtml) && !/class="bubble/.test(mainHtml) && !/class="art[" ]/.test(mainHtml) && !/background-size|background-position|--x:|--y:/.test(mainHtml), F + '컷은 하나도 접지 않음 · 예전 배경 격자 그림(늘이기·확대)과 그림 위 말풍선 없음');
  // 원본 그림판 · 칸 사각형(조정자가 읽기 전용으로 잰 흰 줄 경계)
  const sheet = fs.readFileSync(path.join(ROOT, 'media', 'colonial-panels.png')), P = (CMAP.panel_source || {}).panels || {};
  ok(require('crypto').createHash('sha256').update(sheet).digest('hex') === '1808ac69a3a1eab7074f7b9fbcd55efae55b4754d5be42194e0c3215f8a81e02' && (CMAP.panel_source || {}).sha256 === '1808ac69a3a1eab7074f7b9fbcd55efae55b4754d5be42194e0c3215f8a81e02' && sheet.readUInt32BE(16) === 1024 && sheet.readUInt32BE(20) === 1536, '일제 강점기 원본 그림판 1024×1536 · 측정 때와 같은 해시');
  const rects = Object.values(RECT);
  ok(Object.keys(P).length === 12 && Object.entries(RECT).every(([k, r]) => { const p = P['p' + String(k).padStart(2, '0')] || {}; return J([p.x, p.y, p.w, p.h]) === J(r); }) && rects.every(([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 1024 && y + h <= 1536) &&
    rects.every((a, i) => rects.every((b, j) => i === j || a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1])) && J([...new Set(rects.map(r => r[3]))]) === J([370, 366, 355, 421]) && J([...new Set(rects.map(r => r[2]))].sort()) === J([334, 338]),
    '칸 12개는 그림판 안에서 서로 겹치지 않음 · 행 높이 370/366/355/421 · 열 너비 338/334/338(흰 줄 경계)');
  const used = {};
  scs.forEach((sc, i) => {
    const id = idOf(sc), n = F + id + ': ';
    const pm = /<div class="c-art" data-panel="colonial-p(\d\d)"><svg class="c-panel" viewBox="(\d+) (\d+) (\d+) (\d+)" width="(\d+)" height="(\d+)" role="img" aria-label="[^"]+" focusable="false" preserveAspectRatio="xMidYMid meet"><image href="colonial-panels\.png" x="0" y="0" width="1024" height="1536"\/><\/svg><\/div>/.exec(sc);
    const want = RECT[PANEL_OF[id]] || [];
    ok(pm && +pm[1] === PANEL_OF[id] && J([+pm[2], +pm[3], +pm[4], +pm[5]]) === J(want) && +pm[6] === want[2] && +pm[7] === want[3] && (sc.match(/<svg/g) || []).length === 1, n + '원본 칸 ' + PANEL_OF[id] + ' 사각형 전체를 SVG viewBox로 원래 비율(이웃 칸·확대·늘이기 없음)');
    const reuse = !/ data-orig="/.test(sc);
    ok(reuse === /<p class="c-art-note">그림: [^<]*같은 칸 전체를 확대하지 않고 다시 썼어요\.<\/p>/.test(sc) && (!reuse || /다시 사용/.test(sc)), n + (reuse ? '덧붙인 장면: 같은 칸 전체를 다시 쓴다고 화면에 밝힘' : '원래 장면: 다시 쓴다는 표시 없음'));
    if (!reuse) used[PANEL_OF[id]] = (used[PANEL_OF[id]] || 0) + 1;
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="c-when">/), at(/<div class="c-art"/), at(/<p class="c-art-cap">/), at(/<p class="c-talk-cap">/), at(/<ol class="c-steps"/), at(/<p class="key">/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])), n + '읽는 순서: 제목 → 시기 줄 → 그림 → 개념 그림 표시 → 학습용 요약 대화 → 설명 → 꼭 기억');
    const says = [...((/<div class="c-talk">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '').matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)];
    ok(/<p class="c-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*<\/p><div class="c-talk">/.test(sc) && says.length === 2 && says.every(m => m[1] === m[2] + ': ' + m[3] && (/^(임병찬|박상진|김원봉|김구|지청천|양세봉)$/.test(m[2]) || /^(학생|아버지|농민|동료|시민|독립운동가|교사|상인|회원|노동자|독립군|단원|광복군|학자|역사가) · 설명용 인물$/.test(m[2]))),
      n + '말풍선 둘은 그림 밖, ‘학습용 요약 대화’ 표시, 기록에 이름이 없는 화자는 ‘설명용 인물’');
    const steps = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)];
    const sb = steps.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
    ok(steps.length >= 2 && steps.every(m => /다\.$/.test(txt(m[3]).trim())) && sb.every(b => TERMS.includes(b)) && new Set(sb).size === sb.length, n + '설명 ' + steps.length + '줄(누가·왜·무엇을·결과를 문장으로), 굵은 말 ' + sb.length + '개는 흐름 데이터의 핵심어, 한 번씩');
    const mp = CMAP.scenes.find(x => x.id === id) || {};
    ok(mp.teacher_lines && /^\d{4}/.test(mp.teacher_lines) && (!mp.stress || sc.includes('<p class="c-stress"><b>강의 강조</b>')) && (!!mp.stress === /class="c-stress"/.test(sc)), n + '강의 근거 행(' + (mp.teacher_lines || '?') + ') 기록 · 강의가 직접 짚은 말은 ‘강의 강조’로 표시');
    const rest = s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="c-mem"[\s\S]*?<\/aside>)?/, '');
    ok(rest.startsWith('<div class="story-seam') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 컷으로 잇는 줄' : '마지막 컷 뒤에는 잇는 줄 없음'));
  });
  ok(J(Object.keys(used).map(Number).sort((a, b) => a - b)) === J(Array.from({ length: 12 }, (_, i) => i + 1)) && Object.values(used).every(v => v === 1), F + '원래 장면 12개는 원본 칸 1–12를 하나씩, 덧붙인 6개는 그 칸을 다시 씀(모든 컷에 그림)');
  if (base) { const b = fs.readFileSync(path.join(BASE, 'media', 'colonial-comic.html'), 'utf8'), bs = b.match(SCENE) || [];
    ok(bs.length === 18 && bs.every(x => { const sc = scs.find(y => idOf(y) === idOf(x)) || ''; return (/<h2>([^<]+)<\/h2>/.exec(sc) || [])[1] === (/<h2>([^<]+)<\/h2>/.exec(x) || [])[1] && (/<p class="key">([^<]+)<\/p>/.exec(sc) || [])[1] === (/<p class="key">([^<]+)<\/p>/.exec(x) || [])[1]; }), F + '원래 18컷의 제목·꼭 기억 단서 그대로'); }
  // 네 흐름 · 카드
  ok(J(CL.map(f => [f.id, f.start])) === J([['flow-1','scene-1'],['flow-2','scene-5'],['flow-3','scene-10']]) && CL.length===3 && CL.every(g=>g.chunks.some(k=>/독립|광복|의열단/.test(k.t))), '일제 강점기 흐름: 통치 세 시기(①–③) + 같은 35년을 다시 처음부터 따라가는 독립운동사(④, 시기가 겹친다고 밝힘)');
  const heads = [...s.matchAll(/<div class="c-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
  ok(heads.length === 3 && heads.every(m => { const f = CL.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2] === f.no + ' · ' + f.range && s.indexOf(m[0]) + m[0].length === s.indexOf(scs[ORDER.indexOf(f.start)]); }), F + '흐름 머리 4개는 각 흐름 첫 컷 바로 앞');
  ok(['secret-societies','scene-8'].every(id => { const sc = scs[ORDER.indexOf(id)]; return /^(?:<aside class="c-mem"[\s\S]*?<\/aside>)?<div class="story-seam c-switch"/.test(s.slice(s.indexOf(sc) + sc.length)); }) && (s.match(/story-seam c-switch/g) || []).length === 2, F + '흐름이 바뀌는 곳 3곳은 진한 잇는 줄(①→② · ②→③ · ③→④ 처음부터)');
  const CH = CL.flatMap(f => f.chunks), endKey = {}; CH.forEach((k, i) => { endKey[k.t] = i + 1 < CH.length ? ORDER[ORDER.indexOf(CH[i + 1].go) - 1] : ORDER[ORDER.length - 1]; });
  const cards = [...s.matchAll(/<aside class="c-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="c-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
  ok(cards.length === 3 && J(cards.map(m => m[1])) === J(['secret-societies','scene-8','scene-12']) && cards.every(m => { const sc = scs[ORDER.indexOf(m[1])]; return s.indexOf(sc) + sc.length === m.index; }) && J(cards.map(m => m[1])) === J((CMAP.memory || []).map(x => x.after)),
    F + '외울 것 카드 10장은 덩어리의 마지막 컷 바로 뒤(장면 지도와 같음): ' + cards.map(m => m[1]).join(','));
  const kRe = /<div class="c-mem-k"><p class="c-mem-head"><b class="c-mem-t">([^<]+)<\/b><span class="c-mem-w">([^<]+)<\/span><\/p><div class="c-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="c-memo">[\s\S]*?<\/div>)?(<p class="c-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="c-keys"><span class="c-keys-label">암기 키워드<\/span>((?:<span class="c-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), md = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + md(x) + '</p>').join('') && k.story.length >= 2 && k.story.length <= 4 && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="c-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k) && k.k.length <= 3; }),
    F + '카드 = 데이터의 덩어리 순서·시기·이야기 2–4문장(핵심어 굵게)·외우는 순서·헷갈리지 않기·키워드 1–3');
  const cb = ks.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
  ok(cb.length > 30 && cb.every(b => TERMS.includes(b)), F + '카드에서 굵은 말 ' + cb.length + '개는 모두 흐름 데이터의 핵심어');
  const cardTxt = txt(cards.map(m => m[2]).join(' '));
  ok(/3·1 운동\(1919\)은 고종의 인산일을 앞두고 시작되었고, 6·10 만세 운동\(1926\)은 순종의 인산일 당일에 일어났다/.test(cardTxt) && /보통 경찰·치안유지법·산미증식계획은 1920년대, 헌병 경찰·태형령·회사령은 1910년대/.test(cardTxt) && /독립의군부 = 임병찬·고종 밀지·복벽주의, 대한광복회 = 박상진·공화주의/.test(cardTxt) &&
    /봉오동 = 홍범도·대한독립군, 청산리 = 김좌진·북로군정서군/.test(cardTxt) && /한인애국단\(김구\)과 의열단\(김원봉\)/.test(cardTxt) && /조선의용대\(1938 · 김원봉 · 우한\)와 한국광복군\(1940 · 임시정부 · 충칭\)은 따로 만들어진 다른 부대/.test(cardTxt) && /조선물산공진회\(1915, 경복궁\)/.test(cardTxt),
    F + '카드의 헷갈리는 짝: 3·1 vs 6·10 · 1910년대 vs 1920년대 통치 · 독립의군부 vs 대한광복회 · 봉오동 vs 청산리 · 한인애국단 vs 의열단 · 조선의용대 vs 한국광복군(별개 창설) · 공진회 vs 물산 장려');
  // 강의 핵심 단서가 펼치지 않고 보이는지(접힌 보충 제외) · 강의가 낮춘 범위는 접힌 보충에만
  const vis = txt(mainHtml.replace(/<details[\s\S]*?<\/details>/g, ' ')), folded = txt((mainHtml.match(/<details[\s\S]*?<\/details>/g) || []).join(' '));
  const NEED = ['조선 총독부', '헌병 경찰', '태형령', '회사령', '토지조사사업', '경작권', '동양 척식 주식회사', '2·8 독립 선언', '고종', '제암리', '대한민국 임시정부', '연통제', '교통국', '독립공채', '구미 위원부', '이승만', '김구', '삼균주의',
    '보통 경찰', '치안유지법', '산미증식계획', '조만식', '물산 장려', '이상재', '민립 대학', '경성 제국 대학', '6·10 만세 운동', '정우회 선언', '신간회', '광주학생항일운동', '근우회', '조선 형평사', '암태도', '원산 총파업', '강주룡', '방정환', '브나로드',
    '국가총동원법', '황국신민서사', '창씨개명', '신사 참배', '애국반', '남면북양', '여자 정신 근로령', '조선어학회', '진단학회', '신채호', '박은식', '정인보', '백남운',
    '독립의군부', '대한광복회', '경학사', '신흥강습소', '서전서숙', '중광단', '권업회', '대한광복군 정부', '흥사단', '대조선국민군단', '의열단', '조선혁명선언', '봉오동', '청산리', '간도 참변', '자유시 참변', '미쓰야 협정',
    '한국독립군', '조선혁명군', '한인애국단', '이봉창', '윤봉길', '조선의용대', '한국광복군', '미얀마', '국내 진공 작전', '광복', '나운규', '아리랑'];
  const lost = NEED.filter(w => !vis.includes(w));
  ok(!lost.length, F + '강의가 짚은 단서 ' + NEED.length + '개가 펼치지 않아도 보임' + (lost.length ? ' (빠짐: ' + lost.join(',') + ')' : ''));
  ok(/국민대표회의/.test(folded) && !/국민대표회의/.test(vis) && /문관 총독/.test(folded) && !/문관 총독/.test(vis) && /조선물산공진회/.test(folded), F + '강의가 가볍게 · 시험에 거의 안 나온다고 낮춘 범위(국민대표회의 · 문관 총독 등)는 접힌 보충에만, 공진회는 카드의 헷갈리는 짝과 접힌 보충');
  // 사실 정정 · 표현 범위: 3·1 운동은 고종의 인산일(국장)보다 앞서 시작 · 이상설은 서전서숙만 · 조선어학회 사건은 탄압·활동 중단 · ③의 말·역사 정리는 주제별(1920년대부터)
  const s3 = scs[ORDER.indexOf('scene-3')] || '', sSec = scs[ORDER.indexOf('secret-societies')] || '', allT = txt(mainHtml) + ' ' + fsrc;
  ok(/고종의 인산일을 앞두고 3·1 운동/.test(txt(s3)) && /인산일\)를 앞두고/.test(txt(s3)) && !/인산일에 맞춰|장례일에 맞춰|장례일\(인산일\)에|인산일 → 전국/.test(txt(s3)) && !/고종[^.]{0,20}(인산일|장례일|장례)[^.]{0,6}에 맞춰|3·1 운동[^.]{0,10}고종의 인산일(\(|에|,)/.test(allT) && /순종의 인산일 당일/.test(allT),
    F + '3·1 운동은 고종의 인산일을 앞두고 시작(같은 날로 쓰지 않음), 6·10 만세 운동은 순종의 인산일 당일');
  ok(/이상설이 세운 서전서숙이 있었고 명동학교도 있었/.test(txt(sSec)) && /이상설이 세운 서전서숙이 있었고 명동학교도 있었/.test(fsrc) && !/이상설이 세운 서전서숙과 명동학교|이상설의 서전서숙·명동학교/.test(allT), F + '북간도 학교: 이상설이 세운 것은 서전서숙뿐, 명동학교는 따로(장면·카드 모두)');
  ok(/조선어학회 사건으로 탄압을 받아 활동이 중단/.test(allT) && !/조선어학회 사건으로 강제 해산/.test(allT), F + '조선어학회 사건은 탄압으로 활동이 중단된 것으로 적음(공식 해산이라고 단정하지 않음)');
  ok(/주제별/.test(CL[2].range) && /1920년대/.test(CL[2].range) && /1920년대부터/.test(CL[2].lead) && CL[2].chunks.length === 4 && /주제별/.test(CL[2].chunks[1].t) && /여러 해에 걸친/.test(CL[2].chunks[1].w), F + '③의 말·역사 지키기는 1937년 뒤만의 일이 아니라 1920년대부터의 주제별 정리라고 흐름·카드에 밝힘');
  ok(/나운규[^.]*아리랑/.test(txt(scs[ORDER.indexOf('language-history')] || '').replace(/<details[\s\S]*?<\/details>/g, '')) && /나운규의 아리랑이 시험에 제일 잘 나온다/.test(s), F + '나운규 · 아리랑(1920년대)은 펼친 본문·카드·강의 강조에 보임(강의 1802–1803행)');
  // 받아쓰기 오타가 화면·데이터에 퍼지지 않음, 강의·노트에 없는 내용은 넣지 않음
  const shown = txt(mainHtml) + ' ' + fsrc;
  ok(!/3일 운동|문독|문간 총독|봉호동|중강단|미스아|치한 유지법|시안 유지법|신간해|신관해|근후회|서관도|북관도|연애주|삼미 증식|이상제|백남원|정인포|태양령|환병|선변 경찰|지열사|조소왕|창시 계명|한국 신민서사/.test(shown), F + '강의 받아쓰기 오타(3일 운동·문독·봉호동·중강단·미스아 등)가 화면·흐름 데이터에 없음(바른 표기만)');
  ok(!/민족 대표 ?33|즉결 ?처분|병참 ?기지|이동휘|강상호/.test(shown), F + '강의 대조 범위·기존 노트에 없는 내용(민족 대표 33인 · 즉결 처분 · 병참 기지화 · 이동휘 · 강상호)은 넣지 않음(근거 문서에 기록)');
  // 글자 크기 · 바로 가기 줄 · 끝 안내
  ok(/\.c-talk span\{[^}]*font-size:16px/.test(ccss) && /\.c-talk b\{[^}]*font-size:14px/.test(ccss) && /\.c-steps li\{[^}]*font-size:16px/.test(ccss) && /\.c-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(ccss) && /\.c-panel\{display:block;width:100%;height:auto\}/.test(ccss) && /\.c-story \.art\{background:none;aspect-ratio:auto\}/.test(ccss), F + '대사 16px · 화자 14px · 설명·카드 16px · SVG 칸은 너비 100%·원래 비율 · 예전 .art 배경·비율 무효');
  const navM = /<nav class="c-nav" aria-label="[^"]+"><div class="c-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
  ok(navM && J([...navM[1].matchAll(/href="#(flow-\d)"/g)].map(m => m[1])) === J(['flow-1','flow-2','flow-3']) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 네 흐름 머리로 가는 링크만(줄 하나)');
  ok(/\.c-story nav\.c-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(ccss) && /\.c-story \.c-nav-track\{[^}]*overflow-x:auto/.test(ccss) && /\.c-story nav\.c-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(ccss) &&
    /\.c-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(ccss) && /@media\(min-width:760px\)\{\.c-story nav\.c-nav\{padding-right:10px\}\}/.test(ccss) && /\.c-story \.scene,\.c-story \.c-flow,\.c-story \.c-mem\{scroll-margin-top:68px\}/.test(ccss) &&
    /\.c-story \.c-flow:focus\{outline:3px/.test(ccss) && ccss.indexOf('.embedded .c-story nav{display:none}') > ccss.indexOf('.c-story nav.c-nav{position:sticky'), F + '바로 가기 줄 60px 고정 · 홈 버튼 자리 92px · 링크 44px · 앵커 68px · 초점 테두리 · 앱 안에서는 숨김(줄 규칙보다 뒤)');
  ok(/href="\.\.\/index\.html#chapter\/colonial\/quiz" target="_top">[^<]*퀴즈로/.test(s) && !/요약 노트·문제로 이어가기/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로)');
  // 노트·문제 그대로 · 생성기 · 문서 · 앱 연결
  const cc = cur.chapters.find(c => c.id === 'colonial');
  ok(cc && cc.note.length === 10 && (cur.quizzes.colonial || []).length > 0, '일제 강점기 노트 카드 10장 · 빈칸 문제 그대로(' + (cur.quizzes.colonial || []).length + ')');
  if (base) { const bc = base.chapters.find(c => c.id === 'colonial'); ok(bc && J(bc.note) === J(cc.note) && J(base.quizzes.colonial) === J(cur.quizzes.colonial) && J((base.mocks || {}).colonial) === J((cur.mocks || {}).colonial), '일제 강점기 노트·빈칸·기출은 기준본과 같음'); }
  const cgen = rdr('scripts/build_colonial_comic.py');
  ok(!/\/Users\//.test(cgen + fsrc) && !/\brandom\b|datetime|time\.time|Math\.random|Date\.now/.test(cgen + fsrc) && cgen.includes('1808ac69a3a1eab7074f7b9fbcd55efae55b4754d5be42194e0c3215f8a81e02'), '일제 강점기 생성기·데이터: 개인 경로·시간·난수 없음, 그림판 해시를 확인함');
  ok(/LECTURE_MANAGED = \{[^}]*'colonial'/.test(rdr('scripts/build_comics.py')), 'build_comics.py는 일제 강점기를 다시 쓰지 않음(전용 생성기가 관리)');
  const cdocPath = path.join(ROOT, 'docs', 'colonial-scene-sources.md'), cdoc = fs.existsSync(cdocPath) ? fs.readFileSync(cdocPath, 'utf8') : '';
  ok(ORDER.every(id => cdoc.includes('`' + id + '`')) && cdoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && cdoc.includes('1808ac69a3a1eab7074f7b9fbcd55efae55b4754d5be42194e0c3215f8a81e02') && /1607–1815/.test(cdoc) && /봉호동 → 봉오동/.test(cdoc) && /3일 운동 → 3·1 운동/.test(cdoc) && /문독 · 문간 총독 → 문관 총독/.test(cdoc) && !/\d+\s*%/.test(cdoc),
    '일제 강점기 근거 문서: 18컷 · 강의 범위 1607–1815행 · 스크립트·그림판 SHA-256 · 받아쓰기 정정 기록, 비율 주장 없음');
  ok(/media\/lecture-flow-colonial\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\[[^\]]*'colonial'[^\]]*\]/.test(cur.html), 'index.html: 일제 강점기도 한 페이지 학습(네 흐름 바로 가기 데이터 연결)');
}

section('13. 광복과 대한민국: 다섯 흐름 · 18컷 모두 펼친 채 · 원본 칸 전체(SVG) · 컷 뒤 외울 것 · 강의 근거 · 정정');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8')), txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const s = rdr('media/modern-comic.html'), scs = s.match(SCENE) || [], F = 'modern-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>'));
  const mcss = (/<style id="hanq-modern-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const fsrc = rdr('media/lecture-flow-modern.js'), MF = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[],"terms":[]}'])[1]), ML = MF.list || [], TERMS = MF.terms || [];
  const ORDER = ['scene-1', 'scene-2', 'scene-3', 'constituent-tasks', 'scene-4', 'scene-5', 'rhee-amendments', 'scene-6', 'scene-7', 'yushin-end', 'scene-8', 'chun-government', 'scene-9', 'scene-10', 'ys-government', 'scene-11', 'inter-korean', 'scene-12'];
  // 칸 번호: 원래 장면 n = 원본 칸 n(예전 --x/--y 3열×4행 위치), 덧붙인 장면 = 예전에 확대해 쓰던 칸(이제 칸 전체)
  const PANEL_OF = { 'scene-1': 1, 'scene-2': 2, 'scene-3': 3, 'scene-4': 4, 'scene-5': 5, 'scene-6': 6, 'scene-7': 7, 'scene-8': 8, 'scene-9': 9, 'scene-10': 10, 'scene-11': 11, 'scene-12': 12,
    'constituent-tasks': 3, 'rhee-amendments': 3, 'yushin-end': 6, 'chun-government': 7, 'ys-government': 7, 'inter-korean': 11 };
  const RECT = { 1: [0, 0, 336, 359], 2: [342, 0, 340, 359], 3: [688, 0, 336, 359], 4: [0, 364, 336, 386], 5: [342, 364, 340, 386], 6: [688, 364, 336, 386],
    7: [0, 756, 336, 380], 8: [342, 756, 340, 380], 9: [688, 756, 336, 380], 10: [0, 1142, 336, 394], 11: [342, 1142, 340, 394], 12: [688, 1142, 336, 394] };
  const idOf = sc => (/<section class="scene"[^>]*\sid="([^"]+)"/.exec(sc) || [])[1];
  ok(/<body class="m-story">/.test(s) && (s.match(/id="hanq-modern-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.m-talk\{grid-template-columns:1fr/.test(mcss), F + '현대사 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(J(scs.map(idOf)) === J(ORDER), F + '18컷은 기존 순서 그대로(강의 순서와 같음) (' + scs.map(idOf).join(',') + ')');
  ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<section class="scene"/.test(mainHtml) && !/class="bubble/.test(mainHtml) && !/class="art[" ]/.test(mainHtml) && !/background-size|background-position|--x:|--y:/.test(mainHtml), F + '컷은 하나도 접지 않음 · 예전 배경 격자 그림(늘이기·확대)과 그림 위 말풍선 없음');
  // 원본 그림판 · 칸 사각형(조정자가 읽기 전용으로 잰 흰 줄 경계)
  const sheet = fs.readFileSync(path.join(ROOT, 'media', 'modern-panels.png')), P = (MMAP.panel_source || {}).panels || {};
  ok(require('crypto').createHash('sha256').update(sheet).digest('hex') === '30a8ed4d366edd53ee1c9d53e8918295c62ec1c6a0b442654e871aaf4a1beaa9' && (MMAP.panel_source || {}).sha256 === '30a8ed4d366edd53ee1c9d53e8918295c62ec1c6a0b442654e871aaf4a1beaa9' && sheet.readUInt32BE(16) === 1024 && sheet.readUInt32BE(20) === 1536, '현대사 원본 그림판 1024×1536 · 측정 때와 같은 해시');
  const rects = Object.values(RECT);
  ok(Object.keys(P).length === 12 && Object.entries(RECT).every(([k, r]) => { const p = P['p' + String(k).padStart(2, '0')] || {}; return J([p.x, p.y, p.w, p.h]) === J(r); }) && rects.every(([x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 1024 && y + h <= 1536) &&
    rects.every((a, i) => rects.every((b, j) => i === j || a[0] + a[2] <= b[0] || b[0] + b[2] <= a[0] || a[1] + a[3] <= b[1] || b[1] + b[3] <= a[1])) && J([...new Set(rects.map(r => r[3]))]) === J([359, 386, 380, 394]) && J([...new Set(rects.map(r => r[2]))].sort()) === J([336, 340]),
    '칸 12개는 그림판 안에서 서로 겹치지 않음 · 행 높이 359/386/380/394 · 열 너비 336/340/336(흰 줄 경계)');
  const used = {};
  scs.forEach((sc, i) => {
    const id = idOf(sc), n = F + id + ': ';
    const pm = /<div class="m-art" data-panel="modern-p(\d\d)"><svg class="m-panel" viewBox="(\d+) (\d+) (\d+) (\d+)" width="(\d+)" height="(\d+)" role="img" aria-label="[^"]+" focusable="false" preserveAspectRatio="xMidYMid meet"><image href="modern-panels\.png" x="0" y="0" width="1024" height="1536"\/><\/svg><\/div>/.exec(sc);
    const want = RECT[PANEL_OF[id]] || [];
    ok(pm && +pm[1] === PANEL_OF[id] && J([+pm[2], +pm[3], +pm[4], +pm[5]]) === J(want) && +pm[6] === want[2] && +pm[7] === want[3] && (sc.match(/<svg/g) || []).length === 1, n + '원본 칸 ' + PANEL_OF[id] + ' 사각형 전체를 SVG viewBox로 원래 비율(이웃 칸·확대·늘이기 없음)');
    const reuse = !/ data-orig="/.test(sc);
    ok(reuse === /<p class="m-art-note">그림: [^<]*같은 칸 전체를 확대하지 않고 다시 썼어요\.<\/p>/.test(sc) && (!reuse || /다시 사용/.test(sc)), n + (reuse ? '덧붙인 장면: 같은 칸 전체를 다시 쓴다고 화면에 밝힘' : '원래 장면: 다시 쓴다는 표시 없음'));
    if (!reuse) used[PANEL_OF[id]] = (used[PANEL_OF[id]] || 0) + 1;
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="m-when">/), at(/<div class="m-art"/), at(/<p class="m-art-cap">/), at(/<p class="m-talk-cap">/), at(/<ol class="m-steps"/), at(/<p class="key">/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])), n + '읽는 순서: 제목 → 시기 줄 → 그림 → 개념 그림 표시 → 학습용 요약 대화 → 설명 → 꼭 기억');
    const says = [...((/<div class="m-talk">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '').matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)];
    ok(/<p class="m-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*<\/p><div class="m-talk">/.test(sc) && says.length === 2 && says.every(m => m[1] === m[2] + ': ' + m[3] && (/^(여운형|김구|김규식)$/.test(m[2]) || /^(시민|유권자|의원|농민|어머니|아들|군인|가족|기자|학생|노동자|동료|관리|이산가족|선생) · 설명용 인물$/.test(m[2]))),
      n + '말풍선 둘은 그림 밖, ‘학습용 요약 대화’ 표시, 기록에 이름이 없는 화자는 ‘설명용 인물’');
    const steps = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)];
    const sb = steps.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
    ok(steps.length >= 2 && steps.every(m => /다\.$/.test(txt(m[3]).trim())) && sb.every(b => TERMS.includes(b)) && new Set(sb).size === sb.length, n + '설명 ' + steps.length + '줄(누가·왜·무엇을·결과를 문장으로), 굵은 말 ' + sb.length + '개는 흐름 데이터의 핵심어, 한 번씩');
    const mp = MMAP.scenes.find(x => x.id === id) || {};
    ok(mp.teacher_lines && /^\d{4}/.test(mp.teacher_lines) && (!!mp.stress === /class="m-stress"/.test(sc)), n + '강의 근거 행(' + (mp.teacher_lines || '?') + ') 기록 · 강의가 직접 짚은 말은 ‘강의 강조’로 표시');
    const rest = s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="m-mem"[\s\S]*?<\/aside>)?/, '');
    ok(rest.startsWith('<div class="story-seam') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 컷으로 잇는 줄' : '마지막 컷 뒤에는 잇는 줄 없음'));
  });
  ok(J(Object.keys(used).map(Number).sort((a, b) => a - b)) === J(Array.from({ length: 12 }, (_, i) => i + 1)) && Object.values(used).every(v => v === 1), F + '원래 장면 12개는 원본 칸 1–12를 하나씩, 덧붙인 6개는 그 칸을 다시 씀(모든 컷에 그림)');
  if (base) { const b = fs.readFileSync(path.join(BASE, 'media', 'modern-comic.html'), 'utf8'), bs = b.match(SCENE) || [];
    ok(bs.length === 18 && J(bs.map(idOf)) === J(ORDER) && bs.every(x => { const sc = scs.find(y => idOf(y) === idOf(x)) || ''; return (/<h2>([^<]+)<\/h2>/.exec(sc) || [])[1] === (/<h2>([^<]+)<\/h2>/.exec(x) || [])[1] && (/<p class="key">([^<]+)<\/p>/.exec(sc) || [])[1] === (/<p class="key">([^<]+)<\/p>/.exec(x) || [])[1]; }), F + '원래 18컷의 순서·제목·꼭 기억 단서 그대로'); }
  // 다섯 흐름 · 카드
  ok(J(ML.map(f => [f.id, f.start])) === J([['flow-1', 'scene-1'], ['flow-2', 'scene-4'], ['flow-3', 'scene-7'], ['flow-4', 'scene-8'], ['flow-5', 'scene-10']]) && /주제별/.test(ML[4].range) && /겹/.test(ML[4].lead) && /겹/.test(MF.note) && /6·25 전쟁 전/.test(ML[0].range),
    '현대사 흐름: 광복~정부 수립 → 6·25·이승만·4·19 → 박정희·유신 → 신군부·6월 민주항쟁 → 민주화 이후 정부별(남북 관계·FTA는 주제별·시기가 겹친다고 밝힘)');
  const heads = [...s.matchAll(/<div class="m-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
  ok(heads.length === 5 && heads.every(m => { const f = ML.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2] === f.no + ' · ' + f.range && s.indexOf(m[0]) + m[0].length === s.indexOf(scs[ORDER.indexOf(f.start)]); }), F + '흐름 머리 5개는 각 흐름 첫 컷 바로 앞');
  ok(['constituent-tasks', 'scene-6', 'yushin-end', 'scene-9'].every(id => { const sc = scs[ORDER.indexOf(id)]; return /^(?:<aside class="m-mem"[\s\S]*?<\/aside>)?<div class="story-seam m-switch"/.test(s.slice(s.indexOf(sc) + sc.length)); }) && (s.match(/story-seam m-switch/g) || []).length === 4, F + '흐름이 바뀌는 곳 4곳은 진한 잇는 줄');
  const CH = ML.flatMap(f => f.chunks), endKey = {}; CH.forEach((k, i) => { endKey[k.t] = i + 1 < CH.length ? ORDER[ORDER.indexOf(CH[i + 1].go) - 1] : ORDER[ORDER.length - 1]; });
  const cards = [...s.matchAll(/<aside class="m-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="m-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
  ok(cards.length === 5 && J(cards.map(m => m[1])) === J(['constituent-tasks','scene-6','yushin-end','scene-9','scene-12']) && cards.every(m => { const sc = scs[ORDER.indexOf(m[1])]; return s.indexOf(sc) + sc.length === m.index; }) && J(cards.map(m => m[1])) === J((MMAP.memory || []).map(x => x.after)),
    F + '외울 것 카드 9장은 덩어리의 마지막 컷 바로 뒤(장면 지도와 같음): ' + cards.map(m => m[1]).join(','));
  const kRe = /<div class="m-mem-k"><p class="m-mem-head"><b class="m-mem-t">([^<]+)<\/b><span class="m-mem-w">([^<]+)<\/span><\/p><div class="m-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="m-memo">[\s\S]*?<\/div>)?(<p class="m-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="m-keys"><span class="m-keys-label">암기 키워드<\/span>((?:<span class="m-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), md = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + md(x) + '</p>').join('') && k.story.length >= 2 && k.story.length <= 4 && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="m-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k) && k.k.length <= 3; }),
    F + '카드 = 데이터의 덩어리 순서·시기·이야기 2–4문장(핵심어 굵게)·외우는 순서·헷갈리지 않기·키워드 1–3');
  const cb = ks.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
  ok(cb.length > 30 && cb.every(b => TERMS.includes(b)), F + '카드에서 굵은 말 ' + cb.length + '개는 모두 흐름 데이터의 핵심어');
  const cardTxt = txt(cards.map(m => m[2]).join(' '));
  ok(/대통령이 물러난 것은 4·19, 시민군을 꾸린 것은 5·18, 직선제 개헌을 얻어 낸 것은 6월 민주항쟁/.test(cardTxt) && /4·19\(1960 · 3·15 부정선거 → 이승만 하야\) · 5·18\(1980 · 계엄 확대 반대 → 시민군\) · 6월 민주항쟁\(1987 · 4·13 호헌 철폐 → 직선제 개헌\)/.test(cardTxt) &&
    /제주 4·3 사건은 5·10 총선거 전, 여수·순천 10·19 사건은 정부 수립 뒤/.test(cardTxt) && /반민특위 활동과 농지 개혁은 모두 6·25 전쟁 전/.test(cardTxt) && /좌우합작은 여운형·김규식, 남북 협상은 김구·김규식/.test(cardTxt) &&
    /발췌개헌은 전쟁 중 부산\(직선제\), 사사오입개헌은 전쟁 뒤\(중임 제한 철폐\)/.test(cardTxt) && /개성공단은 김대중 정부 때 합의하고 노무현 정부 때 착공/.test(cardTxt) && /7·4 \/ 6·15 \/ 10·4는 각각 박정희 \/ 김대중 \/ 노무현 정부/.test(cardTxt) && /최초 이산가족 상봉은 전두환 정부/.test(cardTxt),
    F + '카드의 헷갈리는 짝: 4·19 vs 5·18 vs 6월(계기·결과) · 제주 4·3(5·10 전) vs 여수·순천(정부 수립 뒤) · 반민특위·농지 개혁은 6·25 전 · 좌우합작 vs 남북 협상 · 발췌 vs 사사오입 · 개성공단 합의 vs 착공 · 7·4/6·15/10·4 정부 짝');
  // 강의 핵심 단서가 펼치지 않고 보이는지(접힌 보충 제외) · 강의가 낮춘 범위는 접힌 보충에만
  const vis = txt(mainHtml.replace(/<details[\s\S]*?<\/details>/g, ' ')), folded = txt((mainHtml.match(/<details[\s\S]*?<\/details>/g) || []).join(' '));
  const NEED = ['여운형', '조선건국준비위원회', '조선 인민 공화국', '미군정', '모스크바 3국 외상회의', '신탁 통치', '미소공동위원회', '정읍', '좌우합작', '남북 협상', 'UN', '제주 4·3 사건', '5·10 총선거', '제헌국회', '신한공사',
    '반민족 행위 처벌법', '반민특위', '농지개혁법', '여수·순천 10·19 사건', '애치슨 선언', '인천 상륙 작전', '1·4 후퇴', '정전 협정', '한미상호방위조약', '발췌개헌', '사사오입개헌', '진보당 사건', '삼백 산업', '3·15 부정선거', '김주열', '4·19 혁명', '장면 내각', '양원제',
    '5·16 군사정변', '경제개발 5개년 계획', '경부고속도로', '새마을운동', '6·3 시위', '7·4 남북 공동 성명', '남북조절위원회', '유신헌법', '통일주체국민회의', '긴급조치', '3·1 민주 구국 선언', 'YH 무역 사건', '부마항쟁', '10·26 사태',
    '12·12 군사정변', '5·18 민주화운동', '시민군', '8차 개헌', '이산가족', '보도지침', '삼청교육대', '3저 호황', '4·13 호헌조치', '박종철', '이한열', '6월 민주항쟁', '6·29 민주화 선언', '9차 개헌',
    '서울 올림픽', '7·7 선언', '남북 고위급 회담', 'UN에 동시 가입', '남북기본합의서', '비핵화', '금융실명제', '하나회', '지방자치제', '외환위기', '금 모으기 운동', '노사정 위원회', '국가 인권 위원회', '국민기초생활보장법',
    '6·15 남북 공동 선언', '금강산', '10·4 남북 정상 선언', '개성공단', '호주제 폐지', 'G20', '다문화가족지원법', '평창', '판문점 남북 정상회담'];
  const lost = NEED.filter(w => !vis.includes(w));
  ok(!lost.length, F + '강의가 짚은 단서 ' + NEED.length + '개가 펼치지 않아도 보임' + (lost.length ? ' (빠짐: ' + lost.join(',') + ')' : ''));
  ok(/FTA/.test(folded) && !/칠레|박근혜/.test(vis) && /칠레 = 김대중 정부, 미국 = 노무현 정부, 중국 = 박근혜 정부/.test(folded) && /체결한 정부와 실제로 효력이 생긴 정부가 다르다/.test(folded) && /부천 경찰서/.test(folded) && !/부천 경찰서/.test(vis),
    F + 'FTA(체결한 정부 기준, 체결 ≠ 발효)와 강의가 ‘가끔’으로 낮춘 범위는 접힌 보충에만');
  // 받아쓰기 오타·틀린 연도가 화면·데이터에 퍼지지 않음, 강의 범위 밖 내용은 넣지 않음
  const shown = txt(mainHtml) + ' ' + fsrc;
  ok(/한국민주당\(1945년 9월 창당\)/.test(folded) && !/한국민주당[^.]{0,12}1948/.test(shown), F + '한국민주당 창당은 1945년 9월(강의 받아쓰기의 1948년을 옮기지 않음)');
  // 이한열: 6월 9일 최루탄에 맞아 크게 다침 → 시위 확산 → 6·29 민주화 선언 → 9차 개헌, 숨진 것은 6·29 뒤(7월 5일). 죽음이 6·29를 이끈 것처럼 쓰지 않는다
  { const s9 = scs[ORDER.indexOf('scene-9')] || '', t9 = ((/<ol class="m-steps"[\s\S]*?<\/ol>/.exec(s9) || [''])[0]).replace(/<[^>]+>/g, ''), at9 = w => t9.indexOf(w), w9 = txt((/<p class="m-when">([^<]+)<\/p>/.exec(s9) || [])[0] || '');
    ok(/이한열 최루탄 피격\) → 6·29 민주화 선언 → 9차 개헌/.test(w9) && at9('최루탄에 맞아 크게 다치') > 0 && at9('최루탄에 맞아 크게 다치') < at9('6·29 민주화 선언을 발표') && at9('6·29 민주화 선언을 발표') < at9('9차 개헌') && at9('9차 개헌') < at9('끝내 숨져') && /6·29 민주화 선언 뒤에 끝내 숨져/.test(t9) &&
      !/이한열[^.]{0,30}숨지(며|자|면서|고)|이한열[^.]{0,10}사망하(며|자)/.test(shown) && /이한열\*\*이 최루탄에 맞아 크게 다치면서 시위가 전국으로 커졌다\. 결국 \*\*6·29 민주화 선언\*\*/.test(fsrc),
      F + '이한열: 최루탄 피격(중상) → 6월 민주항쟁 확산 → 6·29 → 9차 개헌, 숨진 것은 6·29 뒤 — 죽음이 6·29를 이끈 것처럼 쓰지 않음(장면·카드 모두)'); }
  ok(!/여은영|건주|사계국|좌액|애치슬|낙동간|암록강|인내 전술|일상 후태|발체|445의|조함|대범원|패관|4구 혁명|미니언|참위원|300산|이불학|을사느약|3일 민주|126 사태|1212|전두한|전도한|전부한|호환 조치|호원|62구|3조 호황|3천대|노트 정부|77 선언|고익급|김영산|김영상|한화회|지방자 취재|외한|근무기|6위로|14남북|개선공단|김대전|금강상|6로로|호주 재패지|호돌리|수월왕|칠내|신례관|노미현|50총선거|재헌|반민 특기|신앙공사|제주 43/.test(shown), F + '강의 받아쓰기 오타가 화면·흐름 데이터에 없음(바른 표기만)');
  ok(!/윤석열|이재명|2025년|세계 기록 유산으로도 등재가 되었습니다/.test(shown) && !/(이명박|박근혜) 정부[^.]{0,30}(정상회담|공동 선언)/.test(shown), F + '강의 범위(문재인 정부까지) 밖의 정부·최신 일은 넣지 않고, 정부별 단서를 바꾸지 않음');
  // 글자 크기 · 바로 가기 줄 · 끝 안내
  ok(/\.m-talk span\{[^}]*font-size:16px/.test(mcss) && /\.m-talk b\{[^}]*font-size:14px/.test(mcss) && /\.m-steps li\{[^}]*font-size:16px/.test(mcss) && /\.m-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(mcss) && /\.m-panel\{display:block;width:100%;height:auto\}/.test(mcss) && /\.m-story \.art\{background:none;aspect-ratio:auto\}/.test(mcss), F + '대사 16px · 화자 14px · 설명·카드 16px · SVG 칸은 너비 100%·원래 비율 · 예전 .art 배경·비율 무효');
  const navM = /<nav class="m-nav" aria-label="[^"]+"><div class="m-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
  ok(navM && J([...navM[1].matchAll(/href="#(flow-\d)"/g)].map(m => m[1])) === J(['flow-1', 'flow-2', 'flow-3', 'flow-4', 'flow-5']) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 다섯 흐름 머리로 가는 링크만(줄 하나)');
  ok(/\.m-story nav\.m-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(mcss) && /\.m-story \.m-nav-track\{[^}]*overflow-x:auto/.test(mcss) && /\.m-story nav\.m-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(mcss) &&
    /\.m-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(mcss) && /@media\(min-width:760px\)\{\.m-story nav\.m-nav\{padding-right:10px\}\}/.test(mcss) && /\.m-story \.scene,\.m-story \.m-flow,\.m-story \.m-mem\{scroll-margin-top:68px\}/.test(mcss) &&
    /\.m-story \.m-flow:focus\{outline:3px/.test(mcss) && mcss.indexOf('.embedded .m-story nav{display:none}') > mcss.indexOf('.m-story nav.m-nav{position:sticky'), F + '바로 가기 줄 60px 고정 · 홈 버튼 자리 92px · 링크 44px · 앵커 68px · 초점 테두리 · 앱 안에서는 숨김(줄 규칙보다 뒤)');
  ok(/href="\.\.\/index\.html#chapter\/modern\/quiz" target="_top">[^<]*퀴즈로/.test(s) && !/요약 노트·문제로 이어가기/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로)');
  // 노트·문제 그대로 · 생성기 · 문서 · 앱 연결
  const mc = cur.chapters.find(c => c.id === 'modern');
  ok(mc && mc.note.length === 9 && (cur.quizzes.modern || []).length > 0, '현대사 노트 카드 9장 · 빈칸 문제 그대로(' + (cur.quizzes.modern || []).length + ')');
  if (base) { const bc = base.chapters.find(c => c.id === 'modern'); ok(bc && J(bc.note) === J(mc.note) && J(base.quizzes.modern) === J(cur.quizzes.modern) && J((base.mocks || {}).modern) === J((cur.mocks || {}).modern), '현대사 노트·빈칸·기출은 기준본과 같음'); }
  const mgen = rdr('scripts/build_modern_comic.py');
  ok(!/\/Users\//.test(mgen + fsrc) && !/\brandom\b|datetime|time\.time|Math\.random|Date\.now/.test(mgen + fsrc) && mgen.includes('30a8ed4d366edd53ee1c9d53e8918295c62ec1c6a0b442654e871aaf4a1beaa9'), '현대사 생성기·데이터: 개인 경로·시간·난수 없음, 그림판 해시를 확인함');
  ok(/LECTURE_MANAGED = \{[^}]*'modern'/.test(rdr('scripts/build_comics.py')), 'build_comics.py는 현대사를 다시 쓰지 않음(전용 생성기가 관리)');
  const mdocPath = path.join(ROOT, 'docs', 'modern-scene-sources.md'), mdoc = fs.existsSync(mdocPath) ? fs.readFileSync(mdocPath, 'utf8') : '';
  ok(ORDER.every(id => mdoc.includes('`' + id + '`')) && mdoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && mdoc.includes('30a8ed4d366edd53ee1c9d53e8918295c62ec1c6a0b442654e871aaf4a1beaa9') && /1815–2033/.test(mdoc) && /1948년 9월 → 1945년 9월/.test(mdoc) && /여은영 → 여운형/.test(mdoc) && !/\d+\s*%/.test(mdoc),
    '현대사 근거 문서: 18컷 · 강의 범위 1815–2033행 · 스크립트·그림판 SHA-256 · 받아쓰기·연도 정정 기록, 비율 주장 없음');
  ok(/media\/lecture-flow-modern\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\[[^\]]*'modern'[^\]]*\]/.test(cur.html), 'index.html: 현대사도 한 페이지 학습(다섯 흐름 바로 가기 데이터 연결)');
}

section('14. 선사시대: 네 흐름 · 12컷 모두 펼친 채 · 그림 전체(원래 비율, 자리 먼저) · 시대 끝 외울 것 · 강의·교재 근거');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8')), txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const s = rdr('media/prehistory-comic.html'), scs = s.match(SCENE) || [], F = 'prehistory-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>'));
  const pcss = (/<style id="hanq-prehistory-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const fsrc = rdr('media/lecture-flow-prehistory.js'), PF = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[],"terms":[]}'])[1]), PL = PF.list || [], TERMS = PF.terms || [];
  const ORDER = ['scene-1', 'scene-2', 'paleo-sites', 'scene-3', 'scene-4', 'neo-village', 'scene-5', 'scene-6', 'bronze-village', 'scene-7', 'scene-8', 'iron-trade'];
  // 그림: 원래 장면 n = prehistory-panels/0n.webp, 덧붙인 장면 = 예전에 확대해 쓰던 그림(이제 전체)
  const PANEL_OF = { 'scene-1': 1, 'scene-2': 2, 'scene-3': 3, 'scene-4': 4, 'scene-5': 5, 'scene-6': 6, 'scene-7': 7, 'scene-8': 8, 'paleo-sites': 2, 'neo-village': 3, 'bronze-village': 6, 'iron-trade': 8 };
  const webpDim = f => { const b = fs.readFileSync(path.join(ROOT, 'media', f)), t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; } return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]; };
  const idOf = sc => (/<section class="scene"[^>]*\sid="([^"]+)"/.exec(sc) || [])[1];
  ok(/<body class="p-story">/.test(s) && (s.match(/id="hanq-prehistory-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.p-talk\{grid-template-columns:1fr/.test(pcss), F + '선사시대 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(J(scs.map(idOf)) === J(ORDER), F + '12컷은 기존 순서 그대로 (' + scs.map(idOf).join(',') + ')');
  ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<section class="scene"/.test(mainHtml) && !/class="bubble/.test(mainHtml) && !/class="art[" ]/.test(mainHtml) && !/transform:scale|transform-origin/.test(mainHtml), F + '컷은 하나도 접지 않음 · 예전 확대(transform)·그림 위 말풍선 없음');
  ok(/<div id="progress"><\/div><main>/.test(s) && /getElementById\("progress"\)/.test(s) && s.includes('comic-scenes.js') && s.includes('data-auto="comic"'), F + '예전 진행 막대·공용 스크립트(장면 번호·용어 풀이)는 그대로');
  // 그림: 01–08 모두 539×358, 칸은 그 비율만큼 먼저 자리를 잡고(공용 .art img의 1.33 잘림 비율을 쓰지 않음), 그림은 contain
  ok(Array.from({ length: 8 }, (_, i) => webpDim('prehistory-panels/0' + (i + 1) + '.webp')).every(d => d[0] === 539 && d[1] === 358), '선사시대 그림 01–08은 모두 539×358(실제 파일 크기)');
  ok(/\.p-story \.p-art\{display:block;width:100%;aspect-ratio:var\(--p-ar\)/.test(pcss) && /\.p-story \.p-art img\{display:block;width:100%;height:100%;object-fit:contain;transform:none\}/.test(pcss) && !/object-fit:cover/.test(pcss), F + '그림 칸은 실제 비율로 자리를 먼저 잡고(늦게 불러와도 높이 0 아님), 그림은 contain으로 원래 비율 그대로(늘이기·자르기 없음)');
  const used = {};
  scs.forEach((sc, i) => {
    const id = idOf(sc), n = F + id + ': ';
    const im = /<div class="p-art" data-panel="prehistory-(\d\d)" style="--p-ar:539 \/ 358"><img src="prehistory-panels\/(\d\d)\.webp" width="539" height="358" alt="[^"]+" decoding="async" loading="(eager|lazy)"><\/div>/.exec(sc);
    ok(im && +im[1] === PANEL_OF[id] && +im[2] === PANEL_OF[id] && im[3] === (i < 2 ? 'eager' : 'lazy') && (sc.match(/<img /g) || []).length === 1, n + '그림 ' + String(PANEL_OF[id]).padStart(2, '0') + '.webp 전체 · 539×358 비율로 자리 · 처음 두 컷만 바로 불러오기');
    const reuse = !/ data-orig="/.test(sc);
    ok(reuse === /<p class="p-art-note">그림: [^<]*같은 그림 전체를 확대하지 않고 다시 썼어요\.<\/p>/.test(sc) && (!reuse || /그림 전체 다시 사용/.test(sc)), n + (reuse ? '덧붙인 장면: 같은 그림 전체를 다시 쓴다고 화면에 밝힘' : '원래 장면: 다시 쓴다는 표시 없음'));
    if (!reuse) used[PANEL_OF[id]] = (used[PANEL_OF[id]] || 0) + 1;
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="p-when">/), at(/<div class="p-art"/), at(/<p class="p-art-cap">/), at(/<p class="p-talk-cap">/), at(/<ol class="p-steps"/), at(/<p class="key">/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])), n + '읽는 순서: 제목 → 시대 줄 → 그림 → 개념 그림 표시 → 학습용 요약 대화 → 설명 → 꼭 기억');
    const says = [...((/<div class="p-talk">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '').matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)];
    ok(/<p class="p-talk-cap">학습용 요약 대화[^<]*실제 말이 아니에요[^<]*해설[^<]*<\/p><div class="p-talk">/.test(sc) && says.length === 2 && says.every(m => m[1] === m[2] + ': ' + m[3] && (/^(아버지|아이|농부|동료|직조인|어머니|지도자|전사|족장|마을 사람|대장장이|상인) · 설명용 인물$/.test(m[2]) || m[2] === '해설 · 오늘의 유적 안내')),
      n + '말풍선 둘은 그림 밖, 상상 속 화자는 ‘설명용 인물’, 오늘날의 유적 이야기는 ‘해설’(선사시대 사람이 유적 이름을 말하지 않음)');
    const steps = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)];
    const sb = steps.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
    ok(steps.length >= 2 && steps.every(m => /다\.$/.test(txt(m[3]).trim())) && sb.every(b => TERMS.includes(b)) && new Set(sb).size === sb.length, n + '설명 ' + steps.length + '줄, 굵은 말 ' + sb.length + '개는 흐름 데이터의 핵심어, 한 번씩');
    const mp = PMAP.scenes.find(x => x.id === id) || {};
    ok(mp.teacher_lines && /^\d/.test(mp.teacher_lines) && (!!mp.stress === /class="p-stress"/.test(sc)), n + '강의 근거 행(' + (mp.teacher_lines || '?') + ') 기록 · 강의가 직접 짚은 말은 ‘강의 강조’로 표시');
    const rest = s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="p-mem"[\s\S]*?<\/aside>)?/, '');
    ok(rest.startsWith('<div class="story-seam') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 컷으로 잇는 줄' : '마지막 컷 뒤에는 잇는 줄 없음'));
  });
  ok(J(Object.keys(used).map(Number).sort((a, b) => a - b)) === J([1, 2, 3, 4, 5, 6, 7, 8]) && Object.values(used).every(v => v === 1), F + '원래 장면 8개는 그림 01–08을 하나씩, 덧붙인 4개는 그 그림 전체를 다시 씀(모든 컷에 그림)');
  if (base) { const b = fs.readFileSync(path.join(BASE, 'media', 'prehistory-comic.html'), 'utf8'), bs = b.match(SCENE) || [];
    ok(bs.length === 12 && J(bs.map(idOf)) === J(ORDER) && bs.every(x => { const sc = scs.find(y => idOf(y) === idOf(x)) || ''; return (/<h2>([^<]+)<\/h2>/.exec(sc) || [])[1] === (/<h2>([^<]+)<\/h2>/.exec(x) || [])[1] && (/<p class="key">([^<]+)<\/p>/.exec(sc) || [])[1] === (/<p class="key">([^<]+)<\/p>/.exec(x) || [])[1]; }), F + '원래 12컷의 순서·제목·꼭 기억 단서 그대로'); }
  // 네 흐름 · 카드
  ok(J(PL.map(f => [f.id, f.no + ' ' + f.name, f.start])) === J([['flow-1', '① 구석기', 'scene-1'], ['flow-2', '② 신석기', 'scene-3'], ['flow-3', '③ 청동기', 'scene-5'], ['flow-4', '④ 철기 (오답 가르기)', 'scene-8']]) && /오답/.test(PL[3].lead) && /유적지는 몰라도/.test(PF.note),
    '선사시대 흐름: 구석기 → 신석기 → 청동기 → 철기(강의대로 오답 가르기용으로만), 유적지는 몰라도 된다고 밝힘');
  const heads = [...s.matchAll(/<div class="p-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
  ok(heads.length === 4 && heads.every(m => { const f = PL.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2] === f.no + ' · ' + f.range && s.indexOf(m[0]) + m[0].length === s.indexOf(scs[ORDER.indexOf(f.start)]); }), F + '흐름 머리 4개는 각 시대 첫 컷 바로 앞');
  ok(['paleo-sites', 'neo-village', 'scene-7'].every(id => { const sc = scs[ORDER.indexOf(id)]; return /^(?:<aside class="p-mem"[\s\S]*?<\/aside>)?<div class="story-seam p-switch"/.test(s.slice(s.indexOf(sc) + sc.length)); }) && (s.match(/story-seam p-switch/g) || []).length === 3, F + '시대가 바뀌는 곳 3곳은 진한 잇는 줄');
  const cards = [...s.matchAll(/<aside class="p-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="p-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
  ok(J(cards.map(m => m[1])) === J(['paleo-sites', 'neo-village', 'scene-7', 'iron-trade']) && cards.every(m => { const sc = scs[ORDER.indexOf(m[1])]; return s.indexOf(sc) + sc.length === m.index; }) && J(cards.map(m => m[1])) === J((PMAP.memory || []).map(x => x.after)),
    F + '외울 것 카드 4장은 각 시대의 마지막 컷 바로 뒤(장면 지도와 같음)');
  const CH = PL.flatMap(f => f.chunks);
  const kRe = /<div class="p-mem-k"><p class="p-mem-head"><b class="p-mem-t">([^<]+)<\/b><span class="p-mem-w">([^<]+)<\/span><\/p><div class="p-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="p-memo">[\s\S]*?<\/div>)?(<p class="p-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="p-keys"><span class="p-keys-label">암기 키워드<\/span>((?:<span class="p-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), md = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + md(x) + '</p>').join('') && k.story.length >= 2 && k.story.length <= 4 && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="p-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k) && k.k.length <= 3; }),
    F + '카드 = 데이터의 덩어리 순서·시대·이야기 2–4문장(핵심어 굵게)·외우는 순서·헷갈리지 않기·키워드 1–3');
  const cb = ks.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
  ok(cb.length >= 20 && cb.every(b => TERMS.includes(b)), F + '카드에서 굵은 말 ' + cb.length + '개는 모두 흐름 데이터의 핵심어');
  const cardTxt = txt(cards.map(m => m[2]).join(' '));
  ok(/농경은 신석기에 시작했고, 벼농사\(쌀\)는 청동기다/.test(cardTxt) && /뗀석기는 구석기, 간석기는 신석기다/.test(cardTxt) && /반달 돌칼은 청동이 아니라 돌로 만든 도구다/.test(cardTxt) && /비파형 동검은 청동기, 세형 동검은 철기다/.test(cardTxt) && /움집·빗살무늬 토기·농경은 신석기다/.test(cardTxt) && /벼농사 → 생산 증가 → 사유 재산 → 계급·지배층 → 고인돌/.test(cardTxt),
    F + '카드의 헷갈리는 짝: 농경(신석기) vs 벼농사(청동기) · 뗀석기 vs 간석기 · 반달 돌칼은 돌 · 비파형 vs 세형 동검 · 움집·빗살무늬는 신석기 · 벼농사 → 계급 순서');
  // 강의·교재 단서가 펼치지 않고 보이는지 · 유적지 목록은 접힌 보충에만
  const vis = txt(mainHtml.replace(/<details[\s\S]*?<\/details>/g, ' ')), folded = txt((mainHtml.match(/<details[\s\S]*?<\/details>/g) || []).join(' '));
  const NEED = ['이동 생활', '동굴', '막집', '뗀석기', '주먹도끼', '슴베찌르개', '농경', '목축', '정착', '움집', '가락바퀴', '뼈바늘', '빗살무늬 토기', '간석기', '갈돌', '화덕', '샤머니즘',
    '벼농사', '사유 재산', '계급', '지배층', '환호', '목책', '비파형 동검', '거친무늬 거울', '민무늬 토기', '고인돌', '반달 돌칼', '농경문 청동기', '철제 농기구', '세형 동검', '잔무늬 거울', '명도전', '중국'];
  const lost = NEED.filter(w => !vis.includes(w));
  ok(!lost.length, F + '강의·교재가 짚은 생활·도구 단서 ' + NEED.length + '개가 펼치지 않아도 보임' + (lost.length ? ' (빠짐: ' + lost.join(',') + ')' : ''));
  ok(['청원 두루봉', '단양 금굴', '제주 고산리', '양양 오산리', '부산 동삼동', '반구대'].every(w => folded.includes(w) && !vis.includes(w)), F + '강의가 몰라도 된다고 한 유적지 목록은 접힌 보충에만(기존 꼭 기억의 전곡리·석장리·암사동·송국리는 글자 그대로 둠)');
  const shown = txt(mainHtml) + ' ' + fsrc;
  ok(!/댄석기|승배|찌르게|변농사|비파용|세스랑|굉이|전공훈리|방구대|가락박퀴|포토템|환우|반량점|독적인|별을 벨/.test(shown), F + '강의 받아쓰기 오타(댄석기·승배 찌르게·변농사·비파용 동검·세스랑 등)가 화면·흐름 데이터에 없음(바른 표기만)');
  ok(!/2025|세계 문화 유산/.test(shown), F + '강의가 덧붙인 최신 소식(반구대 등재 연도)은 넣지 않음');
  // 글자 크기 · 바로 가기 줄 · 끝 안내
  ok(/\.p-talk span\{[^}]*font-size:16px/.test(pcss) && /\.p-talk b\{[^}]*font-size:14px/.test(pcss) && /\.p-steps li\{[^}]*font-size:16px/.test(pcss) && /\.p-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(pcss), F + '대사 16px · 화자 14px · 설명·카드 16px');
  const navM = /<nav class="p-nav" aria-label="[^"]+"><div class="p-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
  ok(navM && J([...navM[1].matchAll(/href="#(flow-\d)"/g)].map(m => m[1])) === J(['flow-1','flow-2','flow-3','flow-4']) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 네 흐름 머리로 가는 링크만(줄 하나)');
  ok(/\.p-story nav\.p-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(pcss) && /\.p-story \.p-nav-track\{[^}]*overflow-x:auto/.test(pcss) && /\.p-story nav\.p-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(pcss) && /\.p-story nav\.p-nav a:focus-visible\{outline:3px/.test(pcss) &&
    /\.p-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(pcss) && /@media\(min-width:760px\)\{\.p-story nav\.p-nav\{padding-right:10px\}\}/.test(pcss) && /\.p-story \.scene,\.p-story \.p-flow,\.p-story \.p-mem\{scroll-margin-top:68px\}/.test(pcss) &&
    /\.p-story \.p-flow:focus\{outline:3px/.test(pcss) && pcss.indexOf('.embedded .p-story nav{display:none}') > pcss.indexOf('.p-story nav.p-nav{position:sticky') && /prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}/.test(s), F + '바로 가기 줄 60px 고정 · 홈 버튼 자리 92px · 링크 44px·초점 테두리 · 앵커 68px · 앱 안에서는 숨김 · 움직임 줄이기 설정 따름');
  ok(/href="\.\.\/index\.html#chapter\/prehistory\/quiz" target="_top">[^<]*퀴즈로/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로)');
  // 노트·문제 그대로 · 생성기 · 문서 · 앱 연결
  const pc = cur.chapters.find(c => c.id === 'prehistory');
  ok(pc && pc.note.length === 5 && (cur.quizzes.prehistory || []).length > 0, '선사시대 노트 카드 5장 · 빈칸 문제 그대로(' + (cur.quizzes.prehistory || []).length + ')');
  if (base) { const bc = base.chapters.find(c => c.id === 'prehistory'); ok(bc && J(bc.note) === J(pc.note) && bc.memory === pc.memory && J(base.quizzes.prehistory) === J(cur.quizzes.prehistory) && J((base.mocks || {}).prehistory) === J((cur.mocks || {}).prehistory), '선사시대 노트·빈칸·기출은 기준본과 같음'); }
  const pgen = rdr('scripts/build_prehistory_comic.py');
  ok(!/\/Users\//.test(pgen + fsrc) && !/\brandom\b|datetime|time\.time|Math\.random|Date\.now/.test(pgen + fsrc) && /PANEL_W, PANEL_H = 539, 358/.test(pgen), '선사시대 생성기·데이터: 개인 경로·시간·난수 없음, 그림 크기 539×358을 확인함');
  ok(/LECTURE_MANAGED = \{[^}]*'prehistory'/.test(rdr('scripts/build_comics.py')), 'build_comics.py는 선사시대를 다시 쓰지 않음(전용 생성기가 관리)');
  const pdocPath = path.join(ROOT, 'docs', 'prehistory-scene-sources.md'), pdoc = fs.existsSync(pdocPath) ? fs.readFileSync(pdocPath, 'utf8') : '';
  ok(ORDER.every(id => pdoc.includes('`' + id + '`')) && pdoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && pdoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442') && /17–47/.test(pdoc) && /댄석기 → 뗀석기/.test(pdoc) && /승배 찌르게 → 슴베찌르개/.test(pdoc) && /변농사 → 벼농사/.test(pdoc) && !/\d+\s*%/.test(pdoc),
    '선사시대 근거 문서: 12컷 · 강의 17–47행 · 스크립트·교재 SHA-256 · 받아쓰기 정정 기록, 비율 주장 없음');
  ok(/media\/lecture-flow-prehistory\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\[[^\]]*'prehistory'[^\]]*\]/.test(cur.html), 'index.html: 선사시대도 한 페이지 학습(네 흐름 바로 가기 데이터 연결)');
}

section('15. 고조선과 여러 나라: 두 흐름 · 12컷 모두 펼친 채 · 그림 전체(원래 비율, 자리 먼저) · 덩어리 끝 외울 것 · 강의·교재 근거');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8')), txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const s = rdr('media/gojoseon-comic.html'), scs = s.match(SCENE) || [], F = 'gojoseon-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>'));
  const gcss = (/<style id="hanq-gojoseon-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const fsrc = rdr('media/lecture-flow-gojoseon.js'), GF = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[],"terms":[]}'])[1]), GL = GF.list || [], TERMS = GF.terms || [];
  const ORDER = ['scene-1', 'gojoseon-law', 'scene-2', 'scene-3', 'wiman-trade', 'scene-4', 'scene-5', 'scene-6', 'eupgun-samno', 'scene-7', 'scene-8', 'samhan-rites'];
  // 그림: 원래 장면 n = gojoseon-panels/0n.webp, 덧붙인 장면 = 예전에 확대해 쓰던 그림(이제 전체)
  const PANEL_OF = { 'scene-1': 1, 'scene-2': 2, 'scene-3': 3, 'scene-4': 4, 'scene-5': 5, 'scene-6': 6, 'scene-7': 7, 'scene-8': 8, 'gojoseon-law': 1, 'wiman-trade': 3, 'eupgun-samno': 6, 'samhan-rites': 8 };
  const webpDim = f => { const b = fs.readFileSync(path.join(ROOT, 'media', f)), t = b.toString('ascii', 12, 16);
    if (t === 'VP8X') return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)]; if (t === 'VP8L') { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; } return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]; };
  const idOf = sc => (/<section class="scene"[^>]*\sid="([^"]+)"/.exec(sc) || [])[1];
  ok(/<body class="gj-story">/.test(s) && (s.match(/id="hanq-gojoseon-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.gj-talk\{grid-template-columns:1fr/.test(gcss), F + '고조선과 여러 나라 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(J(scs.map(idOf)) === J(ORDER), F + '12컷은 기존 순서 그대로 (' + scs.map(idOf).join(',') + ')');
  ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<section class="scene"/.test(mainHtml) && !/class="bubble/.test(mainHtml) && !/class="art[" ]/.test(mainHtml) && !/transform:scale|transform-origin/.test(mainHtml), F + '컷은 하나도 접지 않음 · 예전 확대(transform)·그림 위 말풍선 없음');
  ok(/<div id="progress"><\/div><main>/.test(s) && /getElementById\("progress"\)/.test(s) && s.includes('comic-scenes.js') && s.includes('data-auto="comic"'), F + '예전 진행 막대·공용 스크립트(장면 번호·용어 풀이)는 그대로');
  ok(Array.from({ length: 8 }, (_, i) => webpDim('gojoseon-panels/0' + (i + 1) + '.webp')).every(d => d[0] === 508 && d[1] === 380), '고조선과 여러 나라 그림 01–08은 모두 508×380(실제 파일 크기 · 선사시대 539×358과 다름)');
  ok(/\.gj-story \.gj-art\{display:block;width:100%;aspect-ratio:var\(--gj-ar\)/.test(gcss) && /\.gj-story \.gj-art img\{display:block;width:100%;height:100%;object-fit:contain;transform:none\}/.test(gcss) && !/object-fit:cover/.test(gcss), F + '그림 칸은 실제 비율로 자리를 먼저 잡고(늦게 불러와도 높이 0 아님), 그림은 contain으로 원래 비율 그대로(늘이기·자르기 없음)');
  const used = {};
  scs.forEach((sc, i) => {
    const id = idOf(sc), n = F + id + ': ';
    const im = /<div class="gj-art" data-panel="gojoseon-(\d\d)" style="--gj-ar:508 \/ 380"><img src="gojoseon-panels\/(\d\d)\.webp" width="508" height="380" alt="[^"]+" decoding="async" loading="(eager|lazy)"><\/div>/.exec(sc);
    ok(im && +im[1] === PANEL_OF[id] && +im[2] === PANEL_OF[id] && im[3] === (i < 2 ? 'eager' : 'lazy') && (sc.match(/<img /g) || []).length === 1, n + '그림 ' + String(PANEL_OF[id]).padStart(2, '0') + '.webp 전체 · 508×380 비율로 자리 · 처음 두 컷만 바로 불러오기');
    const reuse = !/ data-orig="/.test(sc);
    ok(reuse === /<p class="gj-art-note">그림: [^<]*같은 그림 전체를 확대하지 않고 다시 썼어요\.<\/p>/.test(sc) && (!reuse || /그림 전체 다시 사용/.test(sc)), n + (reuse ? '덧붙인 장면: 같은 그림 전체를 다시 쓴다고 화면에 밝힘' : '원래 장면: 다시 쓴다는 표시 없음'));
    if (!reuse) used[PANEL_OF[id]] = (used[PANEL_OF[id]] || 0) + 1;
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="gj-when">/), at(/<div class="gj-art"/), at(/<p class="gj-art-cap">/), at(/<p class="gj-talk-cap">/), at(/<ol class="gj-steps"/), at(/<p class="key">/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])), n + '읽는 순서: 제목 → 나라 줄 → 그림 → 개념 그림 표시 → 학습용 요약 대화 → 설명 → 꼭 기억');
    const says = [...((/<div class="gj-talk">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '').matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)];
    ok(/<p class="gj-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*해설[^<]*<\/p><div class="gj-talk">/.test(sc) && says.length === 2 && says.every(m => m[1] === m[2] + ': ' + m[3] && (/^(준왕|위만)$/.test(m[2]) || /^(상인|동료|마을 어른|전령|주민|신하|부여 사람|청년|옥저 사람|바닷가 사람|여행자|동예 사람|제사장|천군|신지) · 설명용 인물$/.test(m[2]) || m[2] === '해설 · 오늘날의 풀이')),
      n + '말풍선 둘은 그림 밖, 기록에 이름이 없는 화자는 ‘설명용 인물’(천군·신지는 직책), 오늘날의 풀이는 ‘해설’');
    const steps = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)];
    const sb = steps.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
    ok(steps.length >= 2 && steps.every(m => /다\.$/.test(txt(m[3]).trim())) && sb.every(b => TERMS.includes(b)) && new Set(sb).size === sb.length, n + '설명 ' + steps.length + '줄, 굵은 말 ' + sb.length + '개는 흐름 데이터의 핵심어, 한 번씩');
    const mp = GJMAP.scenes.find(x => x.id === id) || {};
    ok(mp.teacher_lines && /^\d/.test(mp.teacher_lines) && (!!mp.stress === /class="gj-stress"/.test(sc)), n + '강의 근거 행(' + (mp.teacher_lines || '?') + ') 기록 · 강의가 직접 짚은 말은 ‘강의 강조’로 표시');
    const rest = s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="gj-mem"[\s\S]*?<\/aside>)?/, '');
    ok(rest.startsWith('<div class="story-seam') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 컷으로 잇는 줄' : '마지막 컷 뒤에는 잇는 줄 없음'));
  });
  ok(J(Object.keys(used).map(Number).sort((a, b) => a - b)) === J([1, 2, 3, 4, 5, 6, 7, 8]) && Object.values(used).every(v => v === 1), F + '원래 장면 8개는 그림 01–08을 하나씩, 덧붙인 4개는 그 그림 전체를 다시 씀(모든 컷에 그림)');
  if (base) { const b = fs.readFileSync(path.join(BASE, 'media', 'gojoseon-comic.html'), 'utf8'), bs = b.match(SCENE) || [];
    ok(bs.length === 12 && J(bs.map(idOf)) === J(ORDER) && bs.every(x => { const sc = scs.find(y => idOf(y) === idOf(x)) || ''; return (/<h2>([^<]+)<\/h2>/.exec(sc) || [])[1] === (/<h2>([^<]+)<\/h2>/.exec(x) || [])[1] && (/<p class="key">([^<]+)<\/p>/.exec(sc) || [])[1] === (/<p class="key">([^<]+)<\/p>/.exec(x) || [])[1]; }), F + '원래 12컷의 순서·제목·꼭 기억 단서 그대로'); }
  // 두 흐름: ① 고조선(순서) · ② 여러 나라(나란히, 화살표로 잇지 않음)
  ok(J(GL.map(f => [f.id, f.no + ' ' + f.name, f.start])) === J([['flow-1', '① 고조선', 'scene-1'], ['flow-2', '② 여러 나라 (지역별로 나란히)', 'scene-4']]) && /나란히/.test(GL[1].lead) && /차례로 이어진 나라가 아니/.test(GL[1].lead) && /차례로 이어진 나라가 아니/.test(GF.note),
    '고조선과 여러 나라 흐름: ① 고조선은 순서대로, ② 여러 나라는 차례로 이어진 나라가 아니라 나란히 있던 나라라고 밝힘');
  ok(!/(부여|고구려|옥저|동예)[^.→]{0,12}→\s*(고구려|옥저|동예|삼한)/.test(txt(mainHtml.replace(/<p class="key">[^<]*<\/p>/g, ' ')) + ' ' + fsrc) && /북쪽부터/.test(s), F + '여러 나라를 화살표로 이어 시간 순서처럼 쓰지 않음(북쪽부터 지역별 비교)');
  const heads = [...s.matchAll(/<div class="gj-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
  ok(heads.length === 2 && heads.every(m => { const f = GL.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2] === f.no + ' · ' + f.range && s.indexOf(m[0]) + m[0].length === s.indexOf(scs[ORDER.indexOf(f.start)]); }), F + '흐름 머리 2개는 각 흐름 첫 컷 바로 앞');
  ok(/^(?:<aside class="gj-mem"[\s\S]*?<\/aside>)?<div class="story-seam gj-switch"/.test(s.slice(s.indexOf(scs[4]) + scs[4].length)) && (s.match(/story-seam gj-switch/g) || []).length === 1, F + '흐름이 바뀌는 곳(고조선 → 여러 나라) 1곳은 진한 잇는 줄');
  const CH = GL.flatMap(f => f.chunks), endKey = {}; CH.forEach((k, i) => { endKey[k.t] = i + 1 < CH.length ? ORDER[ORDER.indexOf(CH[i + 1].go) - 1] : ORDER[ORDER.length - 1]; });
  const cards = [...s.matchAll(/<aside class="gj-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="gj-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
  ok(J(cards.map(m => m[1])) === J(['gojoseon-law', 'wiman-trade', 'scene-5', 'scene-7', 'samhan-rites']) && J(cards.map(m => m[1])) === J([...new Set(CH.map(k => endKey[k.t]))]) && cards.every(m => { const sc = scs[ORDER.indexOf(m[1])]; return s.indexOf(sc) + sc.length === m.index; }) && J(cards.map(m => m[1])) === J((GJMAP.memory || []).map(x => x.after)),
    F + '외울 것 카드 5장은 덩어리의 마지막 컷 바로 뒤(장면 지도와 같음)');
  const kRe = /<div class="gj-mem-k"><p class="gj-mem-head"><b class="gj-mem-t">([^<]+)<\/b><span class="gj-mem-w">([^<]+)<\/span><\/p><div class="gj-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="gj-memo">[\s\S]*?<\/div>)?(<p class="gj-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="gj-keys"><span class="gj-keys-label">암기 키워드<\/span>((?:<span class="gj-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), md = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + md(x) + '</p>').join('') && k.story.length >= 2 && k.story.length <= 4 && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="gj-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k) && k.k.length <= 3; }),
    F + '카드 = 데이터의 덩어리 순서·나라·이야기 2–4문장(핵심어 굵게)·외우는 순서·헷갈리지 않기·키워드 1–3');
  const cb = ks.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
  ok(cb.length >= 30 && cb.every(b => TERMS.includes(b)), F + '카드에서 굵은 말 ' + cb.length + '개는 모두 흐름 데이터의 핵심어');
  const cardTxt = txt(cards.map(m => m[2]).join(' '));
  ok(/진개는 연나라의 장수이고, 고조선을 멸망시킨 것은 한나라의 무제다/.test(cardTxt) && /범금 8조\(8조법\)가 보이면 고조선이다\. 도둑질하면 12배로 갚게 한 1책 12법은 부여의 법이다/.test(cardTxt) &&
    /마가·우가·저가·구가와 사출도는 부여, 상가·대로·패자는 고구려다\. 영고는 12월\(부여\), 동맹은 10월\(고구려\)이다/.test(cardTxt) && /민며느리제·골장제는 옥저, 책화·무천·단궁·과하마·반어피는 동예다\. 읍군·삼로는 두 나라 모두에 있었다/.test(cardTxt) &&
    /천군·소도와 신지·읍차는 삼한이다\. 옥저·동예의 군장 읍군·삼로와 섞지 않는다/.test(cardTxt) && /단군왕검 건국 → 연 장수 진개의 공격 → 위만이 준왕을 몰아냄 → 진번·임둔 복속 → 우거왕 때 한 무제 공격·왕검성 함락\(멸망\)/.test(cardTxt) && /부여 영고\(12월\) · 고구려 동맹\(10월\) · 동예 무천\(10월\) · 삼한 5월·10월 계절제/.test(cardTxt),
    F + '카드의 헷갈리는 짝: 연 진개 vs 한 무제 · 범금 8조 vs 1책 12법 · 부여 vs 고구려(관직·제천 달) · 옥저 vs 동예(혼인·장례 vs 책화·무천, 읍군·삼로는 공통) · 삼한 vs 군장 국가 · 고조선 순서 · 제천 행사 비교');
  // 강의·교재 단서가 펼치지 않고 보이는지 · 나라 단서를 다른 나라에 붙이지 않음
  const vis = txt(mainHtml.replace(/<details[\s\S]*?<\/details>/g, ' '));
  const NEED = ['단군왕검', '왕검성', '상·대부·장군', '범금 8조', '생명', '노동력', '사유 재산', '홍익인간', '제정일치', '진개', '위만', '준왕', '철기 문화', '진번', '임둔', '중계 무역', '우거왕', '한 무제', '한사군',
    '사출도', '마가', '우가', '저가', '구가', '영고', '1책 12법', '우제점법', '5부', '계루부', '제가회의', '상가', '대로', '패자', '사자', '조의', '선인', '동맹', '서옥제',
    '소금', '해산물', '민며느리제', '골장제', '읍군', '삼로', '책화', '무천', '단궁', '과하마', '반어피', '신지', '읍차', '천군', '소도', '제정 분리', '벼농사', '덩이쇠', '낙랑', '5월', '10월'];
  const lost = NEED.filter(w => !vis.includes(w));
  ok(!lost.length, F + '강의·교재가 짚은 나라별 단서 ' + NEED.length + '개가 펼치지 않아도 보임' + (lost.length ? ' (빠짐: ' + lost.join(',') + ')' : ''));
  const stepTxt = id => txt(((/<ol class="gj-steps"[\s\S]*?<\/ol>/.exec(scs[ORDER.indexOf(id)] || '') || [''])[0]));
  ok(!/민며느리제|골장제/.test(stepTxt('scene-7')) && !/책화|무천/.test(stepTxt('scene-6')) && !/사출도|영고/.test(stepTxt('scene-5')) && !/제가회의|동맹|서옥제/.test(stepTxt('scene-4')) && !/읍군|삼로/.test(stepTxt('scene-8') + stepTxt('samhan-rites')) && !/형사취수제/.test(vis),
    F + '나라별 설명에 다른 나라의 단서를 붙이지 않음(옥저·동예 혼인·장례 vs 책화·무천, 부여 vs 고구려, 삼한에 읍군·삼로 없음)');
  const shown = txt(mainHtml) + ' ' + fsrc;
  ok(!/범근|사출가|골제|동의 안|반호피|진계|한 무죄|위이라는|연고라는|일책|12위법|우제 전법|개루부|손우부|서혹|민면느리|민면을리|옥전|옥조|음락|조랑마린|바다표번|변화는|사한|신지읍자|변농사|낭랑|중개 무역/.test(shown), F + '강의 받아쓰기 오타(범근·사출가·골제·반호피·진계·한 무죄 등)가 화면·흐름 데이터에 없음(바른 표기만)');
  ok(!/낙랑과 왜|왜에 수출/.test(shown), F + '강의·교재에 없는 교역 상대(왜)는 넣지 않음(교재·강의대로 낙랑)');
  // 글자 크기 · 바로 가기 줄 · 끝 안내
  ok(/\.gj-talk span\{[^}]*font-size:16px/.test(gcss) && /\.gj-talk b\{[^}]*font-size:14px/.test(gcss) && /\.gj-steps li\{[^}]*font-size:16px/.test(gcss) && /\.gj-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(gcss), F + '대사 16px · 화자 14px · 설명·카드 16px');
  const navM = /<nav class="gj-nav" aria-label="[^"]+"><div class="gj-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
  ok(navM && J([...navM[1].matchAll(/href="#(flow-\d)"/g)].map(m => m[1])) === J(['flow-1', 'flow-2']) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 두 흐름 머리로 가는 링크만(줄 하나)');
  ok(/\.gj-story nav\.gj-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(gcss) && /\.gj-story \.gj-nav-track\{[^}]*overflow-x:auto/.test(gcss) && /\.gj-story nav\.gj-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(gcss) && /\.gj-story nav\.gj-nav a:focus-visible\{outline:3px/.test(gcss) &&
    /\.gj-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(gcss) && /@media\(min-width:760px\)\{\.gj-story nav\.gj-nav\{padding-right:10px\}\}/.test(gcss) && /\.gj-story \.scene,\.gj-story \.gj-flow,\.gj-story \.gj-mem\{scroll-margin-top:68px\}/.test(gcss) &&
    /\.gj-story \.gj-flow:focus\{outline:3px/.test(gcss) && gcss.indexOf('.embedded .gj-story nav{display:none}') > gcss.indexOf('.gj-story nav.gj-nav{position:sticky') && /prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}/.test(s), F + '바로 가기 줄 60px 고정 · 홈 버튼 자리 92px · 링크 44px·초점 테두리 · 앵커 68px · 앱 안에서는 숨김 · 움직임 줄이기 설정 따름');
  ok(/href="\.\.\/index\.html#chapter\/gojoseon\/quiz" target="_top">[^<]*퀴즈로/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로)');
  // 노트·문제 그대로 · 생성기 · 문서 · 앱 연결
  const gc = cur.chapters.find(c => c.id === 'gojoseon');
  ok(gc && gc.note.length === 5 && (cur.quizzes.gojoseon || []).length > 0, '고조선과 여러 나라 노트 카드 5장 · 빈칸 문제 그대로(' + (cur.quizzes.gojoseon || []).length + ')');
  if (base) { const bc = base.chapters.find(c => c.id === 'gojoseon'); ok(bc && J(bc.note) === J(gc.note) && bc.memory === gc.memory && J(base.quizzes.gojoseon) === J(cur.quizzes.gojoseon) && J((base.mocks || {}).gojoseon) === J((cur.mocks || {}).gojoseon), '고조선과 여러 나라 노트·빈칸·기출은 기준본과 같음'); }
  const ggen = rdr('scripts/build_gojoseon_comic.py');
  ok(!/\/Users\//.test(ggen + fsrc) && !/\brandom\b|datetime|time\.time|Math\.random|Date\.now/.test(ggen + fsrc) && /PANEL_W, PANEL_H = 508, 380/.test(ggen) && /if webp_size\(path\) != \(PANEL_W, PANEL_H\):/.test(ggen) && /check_panels\(\)/.test(ggen.slice(ggen.indexOf('def build('))), '고조선과 여러 나라 생성기·데이터: 개인 경로·시간·난수 없음, 그림 크기 508×380을 실제로 확인함(확인을 끄지 않음)');
  ok(/LECTURE_MANAGED = \{[^}]*'gojoseon'/.test(rdr('scripts/build_comics.py')), 'build_comics.py는 고조선과 여러 나라를 다시 쓰지 않음(전용 생성기가 관리)');
  const gdocPath = path.join(ROOT, 'docs', 'gojoseon-scene-sources.md'), gdoc = fs.existsSync(gdocPath) ? fs.readFileSync(gdocPath, 'utf8') : '';
  ok(ORDER.every(id => gdoc.includes('`' + id + '`')) && gdoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && gdoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442') && /48–99/.test(gdoc) && /범근 8조 → 범금 8조/.test(gdoc) && /사출가 → 사출도/.test(gdoc) && /골제 → 골장제/.test(gdoc) && /반호피 → 반어피/.test(gdoc) && !/\d+\s*%/.test(gdoc),
    '고조선과 여러 나라 근거 문서: 12컷 · 강의 48–99행 · 스크립트·교재 SHA-256 · 받아쓰기 정정 기록, 비율 주장 없음');
  ok(/media\/lecture-flow-gojoseon\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\[[^\]]*'gojoseon'[^\]]*\]/.test(cur.html), 'index.html: 고조선과 여러 나라도 한 페이지 학습(두 흐름 바로 가기 데이터 연결)');
}

section('16. 남북국 시대: 네 흐름 · 32컷 모두 펼친 채 · 품었던 그림판의 칸 전체(SVG) · 컷 뒤 외울 것 · 강의·교재 근거');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8')), txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const crypto = require('crypto');
  const s = rdr('media/nambuk-comic.html'), scs = s.match(SCENE) || [], F = 'nambuk-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>'));
  const ncss = (/<style id="hanq-nambuk-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const fsrc = rdr('media/lecture-flow-nambuk.js'), NF = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[],"terms":[]}'])[1]), NL = NF.list || [], TERMS = NF.terms || [];
  const ORDER = Array.from({ length: 32 }, (_, i) => 's' + (i + 1));
  // 기준본 웹툰에 base64로 품었던 그림판 네 장(조정자가 잰 해시) · 장면별 칸 사각형(그림판, x, y, w, h — 행 높이가 다르고 s3·s4는 좌우가 뒤바뀜)
  const SHA = ['03e16087e8b66c87e896679994ff83a8c9d6c004476ffbf33d3a5585eaaffbed', 'b01abffcfd236b6fdac8e9db4ba5c95ae190d37fe9783e92066d39515c5126e6', 'ea8f29e32980d4265b98f73c8158ef33b1c4553a0d05341d94d891e773c1a0ee', 'f30e7bbffaf1d75c05d1f76018aba6b0dd8cdbd2a9da724e99542631568fc88e'];
  const RECT = { 1: [0, 0, 0, 543, 349], 2: [0, 543, 0, 543, 349], 3: [0, 543, 349, 543, 335], 4: [0, 0, 349, 543, 335], 5: [0, 0, 684, 543, 332], 6: [0, 543, 684, 543, 332], 7: [0, 0, 1016, 543, 432], 8: [0, 543, 1016, 543, 432],
    9: [1, 0, 0, 543, 356], 10: [1, 543, 0, 543, 356], 11: [1, 0, 356, 543, 370], 12: [1, 543, 356, 543, 370], 13: [1, 0, 726, 543, 338], 14: [1, 543, 726, 543, 338], 15: [1, 0, 1064, 543, 384], 16: [1, 543, 1064, 543, 384],
    17: [2, 0, 0, 543, 351], 18: [2, 543, 0, 543, 351], 19: [2, 0, 351, 543, 327], 20: [2, 543, 351, 543, 327], 21: [2, 0, 678, 543, 338], 22: [2, 543, 678, 543, 338], 23: [2, 0, 1016, 543, 432], 24: [2, 543, 1016, 543, 432],
    25: [3, 0, 0, 543, 351], 26: [3, 543, 0, 543, 351], 27: [3, 0, 351, 543, 327], 28: [3, 543, 351, 543, 327], 29: [3, 0, 678, 543, 337], 30: [3, 543, 678, 543, 337], 31: [3, 0, 1015, 543, 433], 32: [3, 543, 1015, 543, 433] };
  const idOf = sc => (/<section class="scene"[^>]*\sid="([^"]+)"/.exec(sc) || [])[1];
  const MORE = /<details[\s\S]*?<\/details>/g, unfold = h => h.replace(MORE, ' '), folds = h => (h.match(MORE) || []).join(' ');
  ok(/<body class="n-story">/.test(s) && (s.match(/id="hanq-nambuk-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.n-talk\{grid-template-columns:1fr/.test(ncss), F + '남북국 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(J(scs.map(idOf)) === J(ORDER) && scs.every((sc, i) => new RegExp('^<section class="scene" data-orig="' + (i + 1) + '" id="s' + (i + 1) + '">').test(sc)), F + '32컷은 기존 id·순서 그대로(s1–s32, data-orig 같은 번호)');
  ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<section class="scene"/.test(mainHtml) && !/class="(?:frame|dialogue|shade|beat|bubble|fact)[" ]/.test(mainHtml) && !/background-size|background-position/.test(mainHtml) && !/base64,|\.sheet\d\{/.test(s), F + '컷은 하나도 접지 않음 · 예전 배경 늘이기 그림·그림 위 말풍선·품은 base64 그림판 없음(예전 공용 스타일은 앞부분에 그대로)');
  ok(/<div id="progress"><\/div><main>/.test(s) && /getElementById\("progress"\)/.test(s) && s.includes('id="hanq-edge-swipe"') && s.includes('comic-scenes.js') && s.includes('data-auto="comic"') && s.includes('id="hanq-responsive-comic"'), F + '예전 진행 막대·가장자리 밀기·공용 스크립트(장면 번호·용어 풀이)·반응형 스타일은 그대로');
  // 그림판: 새 파일 네 장 = 기준본에 품었던 PNG 바이트(다시 인코딩 없음), 1086×1448, 장면 지도와 같은 해시
  const sheets = [0, 1, 2, 3].map(n => { const p = path.join(ROOT, 'media', 'nambuk-sheets', n + '.png'); return fs.existsSync(p) ? fs.readFileSync(p) : Buffer.alloc(0); });
  ok(sheets.every((b, n) => b.length > 24 && crypto.createHash('sha256').update(b).digest('hex') === SHA[n] && b.readUInt32BE(16) === 1086 && b.readUInt32BE(20) === 1448), '남북국 그림판 media/nambuk-sheets/0–3.png: 측정 때와 같은 해시 · 1086×1448');
  const PS = (NMAP.panel_source || {}).sheets || {};
  ok(J([0, 1, 2, 3].map(n => (PS[n] || {}).sha256)) === J(SHA) && [0, 1, 2, 3].every(n => (PS[n] || {}).file === 'media/nambuk-sheets/' + n + '.png'), '장면 지도: 그림판 네 장의 파일·해시 기록');
  if (base) {
    const b = fs.readFileSync(path.join(BASE, 'media', 'nambuk-comic.html'), 'utf8');
    const emb = {}; for (const m of b.matchAll(/\.sheet(\d)\{background-image:url\(data:image\/png;base64,([A-Za-z0-9+/=]+)\)\}/g)) emb[m[1]] = Buffer.from(m[2], 'base64');
    ok(Object.keys(emb).length === 4 && [0, 1, 2, 3].every(n => emb[n] && Buffer.compare(emb[n], sheets[n]) === 0), '그림판 0–3.png는 기준본 웹툰에 품었던 base64 PNG와 바이트 동일(꺼내기만 하고 다시 인코딩하지 않음)');
    const bs = b.match(SCENE) || [];
    const one = (re, h) => (re.exec(h) || [])[1];
    ok(bs.length === 32 && J(bs.map(idOf)) === J(ORDER) && bs.every(x => { const sc = scs.find(y => idOf(y) === idOf(x)) || ''; return one(/<h2>([^<]+)<\/h2>/, sc) === one(/<h2>([^<]+)<\/h2>/, x) && one(/<p class="key">([^<]+)<\/p>/, sc) === one(/<div class="beat">([^<]+)<\/div>/, x); }), F + '원래 32컷의 id·순서·제목·핵심 줄(예전 .beat → p.key) 그대로');
    ok(bs.every(x => { const sc = scs.find(y => idOf(y) === idOf(x)) || ''; return one(/<p class="n-hook"><b>구분<\/b>([\s\S]*?)<\/p>/, sc) === one(/<p class="hook">([\s\S]*?)<\/p>/, x) && one(/<details class="scene-more n-orig"><summary>예전 설명\(원문 그대로\)<\/summary><p>([\s\S]*?)<\/p><\/details>/, sc) === one(/<p class="fact">([\s\S]*?)<\/p>/, x); }), F + '예전 구분 줄(.hook)은 보이게, 예전 설명(.fact)은 접힌 ‘예전 설명(원문 그대로)’에 글자 그대로');
    ok(bs.every(x => { const sc = scs.find(y => idOf(y) === idOf(x)) || ''; const ms = h => [...h.matchAll(/<b>([^<]+)<\/b><span>([^<]+)<\/span>/g)].map(m => m[2]); const o = ms(x), n = ms(sc); return o.length === 2 && n.length === 2 && (idOf(x) === 's8' ? o[0] === n[0] : J(o) === J(n)); }), F + '예전 대사 그대로(s8 관리 대사만 뜻이 갈리지 않게 다듬음 · 근거 문서 기록)');
  }
  // 칸: 장면마다 그 칸 사각형 전체를 SVG viewBox로, 비율 자리(--n-ar) 먼저, 이웃 칸·확대 없음
  const rs = Object.values(RECT), ngen = rdr('scripts/build_nambuk_comic.py');
  ok(rs.length === 32 && rs.every(([, x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 1086 && y + h <= 1448) && rs.every((a, i) => rs.every((c, j) => i === j || a[0] !== c[0] || a[1] + a[3] <= c[1] || c[1] + c[3] <= a[1] || a[2] + a[4] <= c[2] || c[2] + c[4] <= a[2])) && RECT[3][1] === 543 && RECT[4][1] === 0 && J([...new Set(rs.filter(r => r[0] === 0).map(r => r[4]))]) === J([349, 335, 332, 432]),
    '칸 32개는 그림판 안에서 서로 겹치지 않음 · 행 높이가 고르지 않고(그림판 0: 349/335/332/432) s3 오른쪽·s4 왼쪽(균등 격자 가정 없음)');
  ok(Object.entries(RECT).every(([k, r]) => ngen.includes(k + ': (' + r.join(', ') + ')')), '생성기의 칸 사각형 = 조정자가 잰 값');
  scs.forEach((sc, i) => {
    const id = idOf(sc), n = F + id + ': ', r = RECT[i + 1];
    const pm = /<div class="n-art" data-panel="nambuk-(\d)-s(\d\d)"><svg class="n-panel" viewBox="(\d+) (\d+) (\d+) (\d+)" width="(\d+)" height="(\d+)" style="--n-ar:(\d+) \/ (\d+)" role="img" aria-label="[^"]+" focusable="false" preserveAspectRatio="xMidYMid meet"><image href="nambuk-sheets\/(\d)\.png" x="0" y="0" width="1086" height="1448"\/><\/svg><\/div>/.exec(sc);
    ok(pm && +pm[1] === r[0] && +pm[2] === i + 1 && +pm[11] === r[0] && J([+pm[3], +pm[4], +pm[5], +pm[6]]) === J(r.slice(1)) && +pm[7] === r[3] && +pm[8] === r[4] && +pm[9] === r[3] && +pm[10] === r[4] && (sc.match(/<svg/g) || []).length === 1,
      n + '그림판 ' + r[0] + '의 칸 (' + r.slice(1).join(',') + ') 전체를 SVG viewBox로 · 비율 자리 먼저(이웃 칸·확대·늘이기 없음)');
    const mp = NMAP.scenes.find(x => x.id === id) || {};
    ok(mp.panel && J(mp.panel.rect) === J(r.slice(1)) && mp.panel.sha256 === SHA[r[0]] && mp.panel.sheet === 'media/nambuk-sheets/' + r[0] + '.png', n + '장면 지도: 칸 사각형·그림판 해시');
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="n-when">/), at(/<div class="n-art"/), at(/<p class="n-art-cap">/), at(/<p class="n-talk-cap">/), at(/<ol class="n-steps"/), at(/<p class="key">/), at(/<p class="n-hook">/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])), n + '읽는 순서: 제목 → 왕·시기 줄 → 그림 → 개념 그림 표시 → 학습용 요약 대화 → 설명 → 핵심 줄 → 구분');
    const says = [...((/<div class="n-talk">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '').matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)];
    ok(/<p class="n-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*<\/p><div class="n-talk">/.test(sc) && says.length === 2 && says.every(m => m[1] === m[2] + ': ' + m[3] && (/^(신문왕|대조영|무왕|장문휴|문왕|선왕|설총|원효|의상|혜초|장보고|최치원|견훤|궁예)$/.test(m[2]) || /^(신라 병사|동료|신하|귀족|지방관|병사|장수|지방 세력가|관리|백성|고구려 유민|신라 사신|상인|학자|사신|학생|스승|왕|제자|승려|장인|신라 사람|안내자|발해 사람|농민|지방민|호족|발해 사신|기록자) · 설명용 인물$/.test(m[2]))),
      n + '말풍선 둘은 그림 밖, ‘학습용 요약 대화’ 표시, 기록에 이름이 없는 화자는 ‘설명용 인물’');
    const steps = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)];
    const sb = steps.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
    ok(steps.length >= 2 && steps.every(m => /다\.$/.test(txt(m[3]).trim())) && sb.every(b => TERMS.includes(b)) && new Set(sb).size === sb.length, n + '설명 ' + steps.length + '줄(문장), 굵은 말 ' + sb.length + '개는 흐름 데이터의 핵심어, 한 번씩');
    ok((mp.teacher_lines && /^\d{3}/.test(mp.teacher_lines)) || (mp.teacher_lines === null && (id === 's22' || id === 's31') && /기존 웹툰 설명/.test(mp.source || '')), n + '근거 기록(강의 ' + (mp.teacher_lines || '없음 · 기존 웹툰 설명') + ')');
    ok(!!mp.stress === /class="n-stress"/.test(sc) && (!mp.stress || /짚었어요\.$/.test(mp.stress)), n + '강의가 직접 짚은 말만 ‘강의 강조’로 표시');
    ok(/<details class="scene-more n-orig"><summary>예전 설명\(원문 그대로\)<\/summary><p>[\s\S]*?<\/p><\/details><\/section>$/.test(sc) && !/<details[^>]* open/.test(sc), n + '예전 설명은 장면 끝에 접힌 채(원문 그대로)');
    const rest = s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="n-mem"[\s\S]*?<\/aside>)?/, '');
    ok(rest.startsWith('<div class="story-seam') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 컷으로 잇는 줄' : '마지막 컷 뒤에는 잇는 줄 없음'));
  });
  // 네 흐름: ① 통일 신라 전기(왕 순서) · ② 같은 시기 북쪽 발해(신라 다음 나라가 아님) · ③ 문화(주제별, 시기가 겹침) · ④ 하대 동요와 후삼국(시간 순서)
  ok(J(NL.map(f => [f.id, f.start])) === J([['flow-1', 's1'], ['flow-2', 's9'], ['flow-3', 's15'], ['flow-4', 's25']]) && /나란히/.test(NL[1].lead) && /신라 다음/.test(NL[1].lead) && /같은 시기/.test(NL[1].name) && /주제별/.test(NL[2].name) && /겹/.test(NL[2].lead) && /나란히/.test(NF.note) && /겹/.test(NF.note) && /따로/.test(NL[3].lead),
    '남북국 흐름: 통일 신라 전기 → 같은 시기 북쪽의 발해(신라 다음 나라가 아님) → 문화(주제별·시기가 겹침) → 하대 동요와 후삼국(발해 멸망은 따로)');
  const heads = [...s.matchAll(/<div class="n-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
  ok(heads.length === 4 && heads.every(m => { const f = NL.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2] === f.no + ' · ' + f.range && s.indexOf(m[0]) + m[0].length === s.indexOf(scs[ORDER.indexOf(f.start)]); }), F + '흐름 머리 4개는 각 흐름 첫 컷 바로 앞');
  ok(['s8', 's14', 's24'].every(id => { const sc = scs[ORDER.indexOf(id)]; return /^(?:<aside class="n-mem"[\s\S]*?<\/aside>)?<div class="story-seam n-switch"/.test(s.slice(s.indexOf(sc) + sc.length)); }) && (s.match(/story-seam n-switch/g) || []).length === 3 && /같은 시기 북쪽의 발해[^<]*신라 다음에 온 나라가 아니라/.test(s), F + '흐름이 바뀌는 곳 3곳은 진한 잇는 줄(발해로 넘어갈 때 신라 다음 나라가 아니라고 밝힘)');
  const CH = NL.flatMap(f => f.chunks), endKey = {}; CH.forEach((k, i) => { endKey[k.t] = i + 1 < CH.length ? ORDER[ORDER.indexOf(CH[i + 1].go) - 1] : ORDER[ORDER.length - 1]; });
  const cards = [...s.matchAll(/<aside class="n-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="n-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
  ok(J(cards.map(m => m[1])) === J(['s8','s14','s24','s32']) && cards.every(m => { const sc = scs[ORDER.indexOf(m[1])]; return s.indexOf(sc) + sc.length === m.index; }) && J(cards.map(m => m[1])) === J((NMAP.memory || []).map(x => x.after)),
    F + '외울 것 카드 15장은 덩어리의 마지막 컷 바로 뒤(장면 지도와 같음)');
  const kRe = /<div class="n-mem-k"><p class="n-mem-head"><b class="n-mem-t">([^<]+)<\/b><span class="n-mem-w">([^<]+)<\/span><\/p><div class="n-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="n-memo">[\s\S]*?<\/div>)?(<p class="n-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="n-keys"><span class="n-keys-label">암기 키워드<\/span>((?:<span class="n-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), md = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + md(x) + '</p>').join('') && k.story.length >= 2 && k.story.length <= 4 && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="n-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k) && k.k.length >= 1 && k.k.length <= 3; }),
    F + '카드 = 데이터의 덩어리 순서·왕/시기·이야기 2–4문장(핵심어 굵게)·외우는 순서·헷갈리지 않기·키워드 1–3');
  const cb = ks.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
  ok(cb.length >= 40 && cb.every(b => TERMS.includes(b)), F + '카드에서 굵은 말 ' + cb.length + '개는 모두 흐름 데이터의 핵심어');
  const cardTxt = txt(cards.map(m => m[2]).join(' '));
  ok(/김흠돌의 난은 신문왕의 왕권 강화, 김헌창의 난은 혜공왕 피살 뒤 신라 하대의 동요다/.test(cardTxt) && /정전이 신문왕 개혁의 결과라는 뜻은 아니에요/.test(cardTxt) && /5경 15부 62주와 해동성국은 문왕이 아니라 선왕이다/.test(cardTxt) &&
    /두 무덤은 앞뒤로 이어진 것이 아니라 남북에 나란히 있던 두 나라의 것이다/.test(cardTxt) && /발해는 신라 다음 나라도, 후삼국의 하나도 아니다/.test(cardTxt) && /혜공왕 피살 → 김헌창의 난 → 장보고의 난/.test(cardTxt) &&
    /공산 전투 → 고창 전투 → 신라 항복 → 일리천 전투 → 고려의 후삼국 통일/.test(cardTxt) && /공산 전투는 고려가 진 싸움\(신숭겸 전사\), 고창 전투는 고려가 이긴 싸움이다/.test(cardTxt),
    F + '카드의 헷갈리는 짝: 김흠돌 vs 김헌창 · 정전은 신문왕 개혁의 결과가 아님 · 62주·해동성국은 선왕 · 남북의 무덤은 나란히 · 발해 멸망은 따로 · 하대 반란 순서 · 공고신일');
  // 신라와 발해 사이에 화살표 없음 · 왕과 업적 짝 · 강의가 낮춘 범위는 접힌 보충에만
  const vis = txt(unfold(mainHtml)), folded = txt(folds(mainHtml)), shown = txt(mainHtml) + ' ' + fsrc;
  ok(!/(신라|통일 신라)[^.→\n"]{0,15}→\s*발해|발해[^.→\n"]{0,15}→\s*(통일 신라|신라(?!도))/.test(shown), F + '신라와 발해를 화살표로 잇지 않음(같은 시기 남북의 두 나라)');
  const stepTxt = id => txt(((/<ol class="n-steps"[\s\S]*?<\/ol>/.exec(scs[ORDER.indexOf(id)] || '') || [''])[0]));
  // 왕-업적 짝은 문장(또는 키워드 한 칸) 안에서 왕 이름마다 끊은 ‘왕 구절’로 본다. 화면 전체를 이어 붙인 글에서 고정 거리로 찾으면
  // “문왕 · 상경 천도 / 선왕 · 해동성국”처럼 두 왕을 나란히 비교한 줄도 잘못 걸리기 때문이다(앞 판의 거짓 실패).
  const ATTR = /5경 15부 62주|3성 6부|해동성국/, KING = /신문왕|문무왕|무열왕|성덕왕|경덕왕|원성왕|혜공왕|진성여왕|경순왕|대조영|무왕|문왕|선왕/g;
  const units = h => h.replace(/<\/(?:p|li|span|div|h2|small|b|a|summary)>/g, '\n').replace(/<[^>]+>/g, ' ').split('\n').flatMap(x => x.split(/(?<=다\.|요\.)\s+/)).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const leaves = o => typeof o === 'string' ? [o] : Array.isArray(o) ? o.flatMap(leaves) : o && typeof o === 'object' ? Object.values(o).flatMap(leaves) : [];
  const kingClauses = u => { const ks = [...u.matchAll(KING)]; return { pre: ks.length ? u.slice(0, ks[0].index) : u, list: ks.map((m, i) => ({ king: m[0], text: u.slice(m.index, i + 1 < ks.length ? ks[i + 1].index : u.length) })) }; };
  // 잘못 붙인 경우: 문왕 구절 안에 업적이 있거나, 문왕 구절 바로 앞(같은 문장, 앞선 왕 없음)에 업적이 있는데 “문왕이 아니라”로 부정하지 않은 경우
  const badMun = u => { const c = kingClauses(u); return c.list.some((k, i) => k.king === '문왕' && (ATTR.test(k.text) || (i === 0 && ATTR.test(c.pre) && !/^문왕이 아니라/.test(k.text)))); };
  const seonOk = u => kingClauses(u).list.some(k => k.king === '선왕' && /5경 15부 62주/.test(k.text) && /해동성국/.test(k.text));
  ok(badMun('문왕 때 지방 제도를 5경 15부 62주로 정비했다.') && badMun('해동성국은 문왕 때다.') && badMun('문왕 · 3성 6부') && !badMun('문왕 · 상경 천도 선왕 · 해동성국') && !badMun('대조영 건국 · 무왕 등주 공격 · 문왕 상경 천도 · 선왕 해동성국') &&
    !badMun('5경 15부 62주와 해동성국은 문왕이 아니라 선왕이다.') && !badMun('신문왕 = 9주 5소경') && seonOk('선왕(연호 건흥) 때 영토가 가장 넓어 5경 15부 62주로 정비했고, 해동성국이라 불렸다.') && !seonOk('문왕 · 상경 천도 선왕 · 63주'),
    '왕-업적 짝 검사 자체 확인: 문왕에 62주·3성 6부·해동성국을 붙인 문장은 잡고, 문왕·선왕을 나란히 비교한 줄과 “문왕이 아니라 선왕” 부정문은 통과');
  const allUnits = units(unfold(mainHtml)).concat(leaves(NF).flatMap(x => x.replace(/\*\*/g, '').split(/(?<=다\.|요\.)\s+/)));
  const wrong = allUnits.filter(badMun);
  ok(!/5경 15부 62주|3성 6부|해동성국/.test(stepTxt('s11')) && /선왕/.test(stepTxt('s12')) && /5경 15부 62주/.test(stepTxt('s12')) && /해동성국/.test(stepTxt('s12')) && !wrong.length && allUnits.some(seonOk) && /3성 6부/.test(folds(scs[13] || '')) && !/3성 6부/.test(vis) && !kingClauses(txt(folds(scs[13] || ''))).list.some(k => /3성 6부/.test(k.text)),
    F + '5경 15부 62주·해동성국은 선왕(문장 안 선왕 구절에 둘 다), 문왕 장면·구절에는 없음, 3성 6부는 왕을 밝히지 않은 관제로 접힌 선택 심화에만' + (wrong.length ? ' (문왕에 붙음: ' + wrong.slice(0, 3).join(' | ') + ')' : ''));
  ok(/장문휴/.test(stepTxt('s10')) && /등주/.test(stepTxt('s10')) && /인안/.test(stepTxt('s10')) && /상경/.test(stepTxt('s11')) && /대흥/.test(stepTxt('s11')) && /당과 가까이/.test(stepTxt('s11')) && /건흥/.test(stepTxt('s12')) && /진국/.test(stepTxt('s9')), F + '발해 네 왕의 업적·연호·당과의 관계를 나눔(무왕 인안·등주 공격 / 문왕 대흥·당과 친선·상경 / 선왕 건흥)');
  ok(/김흠돌의 난/.test(stepTxt('s2')) && /국학/.test(stepTxt('s3')) && /관료전/.test(stepTxt('s4')) && /녹읍/.test(stepTxt('s4')) && /9주 5소경/.test(stepTxt('s5')) && /9서당 10정/.test(stepTxt('s6')) && /문무왕[^.]*외사정/.test(stepTxt('s7')) && /성덕왕[^.]*정전/.test(stepTxt('s8')) && /경덕왕[^.]*녹읍[^.]*부활/.test(stepTxt('s8')) && /원성왕[^.]*독서삼품과/.test(stepTxt('s15')),
    F + '신라 왕과 업적 짝: 신문왕(김흠돌의 난·국학·관료전·녹읍 폐지·9주 5소경·9서당 10정) · 문무왕 외사정 · 성덕왕 정전 · 경덕왕 녹읍 부활 · 원성왕 독서삼품과');
  const NEED = ['남북국 시대', '무열왕', '문무왕', '외사정', '신문왕', '김흠돌의 난', '국학', '관료전', '녹읍', '9주 5소경', '9서당 10정', '상수리 제도', '성덕왕', '정전', '경덕왕', '촌락 문서', '쇼소인', '서원경',
    '대조영', '진국', '동모산', '무왕', '인안', '장문휴', '등주', '문왕', '대흥', '상경', '신라도', '선왕', '건흥', '해동성국', '5경 15부 62주', '솔빈부의 말', '발해 5도', '주자감',
    '원성왕', '독서삼품과', '설총', '이두', '화왕계', '원효', '무애가', '일심 사상', '화쟁 사상', '의상', '화엄', '부석사', '관음 신앙', '혜초', '왕오천축국전', '불국사 3층 석탑', '무구정광대다라니경', '김대성', '선종', '9산 선문', '승탑',
    '굴식 돌방무덤', '12지 신상', '정혜공주묘', '모줄임 천장', '돌사자상', '온돌', '장보고', '청해진', '법화원', '울산항', '당항성', '영암', '서시', '남시',
    '혜공왕', '김헌창의 난', '웅천주', '장보고의 난', '진성여왕', '최치원', '시무 10여 조', '원종과 애노', '사벌주', '호족', '성주', '견훤', '완산주', '후백제', '후당', '오월', '경애왕',
    '궁예', '후고구려', '광평성', '마진', '태봉', '송악', '철원', '왕건', '거란', '공산 전투', '신숭겸', '고창 전투', '금산사', '경순왕', '사심관', '일리천 전투'];
  const lost = NEED.filter(w => !vis.includes(w));
  ok(!lost.length, F + '강의·교재가 짚은 단서 ' + NEED.length + '개가 펼치지 않아도 보임' + (lost.length ? ' (빠짐: ' + lost.join(',') + ')' : ''));
  ok(/대내상/.test(folded) && !/대내상|중정대|문적원/.test(vis) && /감은사/.test(folded) && !/감은사|만파식적/.test(vis), F + '강의가 ‘100점 목표만’으로 낮춘 3성 6부 관제와 흐름 보충(감은사·만파식적)은 접힌 보충에만');
  ok(!/김음돌|관류전|해공왕|해공항|독서 ?상품|김원창|에노의|법파원|견어|견원|궁해|궁회|송학|신순겸|1, 2천|공고신 1|가은사|원유|해초|왕호천축|정해 ?공주|모주림|이불 병자|영광탁|장무유|이난|대조형|구서당|구조서경|성도왕|경도왕|석꾸람|통행신|통해신라|말갈린|바레|발래|청방 임문표|해신밀경소/.test(shown), F + '강의 받아쓰기 오타(김음돌·관류전·해공왕·김원창·견어·궁해·이난·장무유·정해 공주묘 등)가 화면·흐름 데이터에 없음(바른 표기만)');
  ok(!/문무왕의 외손자|28명|평균 제위/.test(shown) && !/빈출|출제 확률|\d+\s*%/.test(txt(mainHtml) + ' ' + fsrc), F + '확인되지 않은 강의 말(설총 = 문무왕의 외손자 · 하대 왕 28명)과 출제 비율 주장은 넣지 않음');
  // 글자 크기 · 바로 가기 줄 · 끝 안내
  ok(/\.n-talk span\{[^}]*font-size:16px/.test(ncss) && /\.n-talk b\{[^}]*font-size:14px/.test(ncss) && /\.n-steps li\{[^}]*font-size:16px/.test(ncss) && /\.n-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(ncss) && /\.n-story \.n-panel\{display:block;width:100%;height:auto;aspect-ratio:var\(--n-ar\)\}/.test(ncss), F + '대사 16px · 화자 14px · 설명·카드 16px · SVG 칸은 너비 100%·칸 비율로 자리');
  const navM = /<nav class="n-nav" aria-label="[^"]+"><div class="n-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
  ok(navM && J([...navM[1].matchAll(/href="#(flow-\d)"/g)].map(m => m[1])) === J(['flow-1','flow-2','flow-3','flow-4']) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 네 흐름 머리로 가는 링크만(줄 하나, 예전 nav는 대체)');
  ok(/\.n-story nav\.n-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(ncss) && /\.n-story \.n-nav-track\{[^}]*overflow-x:auto/.test(ncss) && /\.n-story nav\.n-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(ncss) && /\.n-story nav\.n-nav a:focus-visible\{outline:3px/.test(ncss) &&
    /\.n-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(ncss) && /@media\(min-width:760px\)\{\.n-story nav\.n-nav\{padding-right:10px\}\}/.test(ncss) && /\.n-story \.scene,\.n-story \.n-flow,\.n-story \.n-mem\{scroll-margin-top:68px\}/.test(ncss) &&
    /\.n-story \.n-flow:focus\{outline:3px/.test(ncss) && ncss.indexOf('.embedded .n-story nav{display:none}') > ncss.indexOf('.n-story nav.n-nav{position:sticky') && /prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}/.test(s) && /\.n-story \.n-head h2\{padding:0/.test(ncss) && /\.n-story \.n-head \.meta\{padding:0/.test(ncss),
    F + '바로 가기 줄 60px 고정 · 홈 버튼 자리 92px · 링크 44px·초점 테두리 · 앵커 68px · 앱 안에서는 숨김 · 움직임 줄이기 · 예전 공용 h2·meta 여백 덮음');
  ok(/href="\.\.\/index\.html#chapter\/nambuk\/quiz" target="_top">[^<]*퀴즈로/.test(s) && /<div class="source">[^<]*등장 순서가 모두 연대순인 것은 아닙니다/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로) · 예전 자료 안내 유지');
  // 노트·문제 그대로 · 생성기 · 문서 · 앱 연결
  const nc = cur.chapters.find(c => c.id === 'nambuk');
  ok(nc && nc.note.length === 3 && (cur.quizzes.nambuk || []).length > 0, '남북국 노트 카드 3장 · 빈칸 문제 그대로(' + (cur.quizzes.nambuk || []).length + ')');
  if (base) { const bc = base.chapters.find(c => c.id === 'nambuk'); ok(bc && J(bc.note) === J(nc.note) && bc.memory === nc.memory && J(base.quizzes.nambuk) === J(cur.quizzes.nambuk) && J((base.mocks || {}).nambuk) === J((cur.mocks || {}).nambuk), '남북국 노트·빈칸·기출은 기준본과 같음'); }
  ok(!/\/Users\//.test(ngen + fsrc) && !/\brandom\b|datetime|time\.time|Math\.random|Date\.now/.test(ngen + fsrc) && SHA.every(h => ngen.includes(h)) && /SHEET_W, SHEET_H = 1086, 1448/.test(ngen) && /base64\.b64decode\(found\[n\]\[0\], validate=True\)/.test(ngen) && /prepare_sheets\(src\)/.test(ngen.slice(ngen.indexOf('def build('))) && /check_panels\(\)/.test(ngen.slice(ngen.indexOf('def build('))),
    '남북국 생성기·데이터: 개인 경로·시간·난수 없음, 품은 그림판을 디코드만 해 해시·크기를 실제로 확인(확인을 끄지 않음)');
  ok(/LECTURE_MANAGED = \{[^}]*'nambuk'/.test(rdr('scripts/build_comics.py')), 'build_comics.py는 남북국을 다시 쓰지 않음(전용 생성기가 관리)');
  const ndocPath = path.join(ROOT, 'docs', 'nambuk-scene-sources.md'), ndoc = fs.existsSync(ndocPath) ? fs.readFileSync(ndocPath, 'utf8') : '';
  ok(ORDER.every(id => ndoc.includes('`' + id + '`')) && ndoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && ndoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442') && SHA.every(h => ndoc.includes(h)) && /337–478/.test(ndoc) && /PDF 31–37/.test(ndoc) &&
    /김음돌 → 김흠돌/.test(ndoc) && /이난 → 인안/.test(ndoc) && /견어 · 견원 · 결혼 → 견훤/.test(ndoc) && /문무왕의 외손자가 아니다/.test(ndoc) && /문왕에 붙이지 않는다/.test(ndoc) && !/\d+\s*%/.test(ndoc),
    '남북국 근거 문서: 32컷 · 강의 337–478행 · 교재 PDF 31–37쪽 · 스크립트·교재·그림판 SHA-256 · 받아쓰기·사실 정정 기록, 비율 주장 없음');
  ok(/media\/lecture-flow-nambuk\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\[[^\]]*'nambuk'[^\]]*\]/.test(cur.html), 'index.html: 남북국도 한 페이지 학습(네 흐름 바로 가기 데이터 연결)');
}

section('17. 삼국시대: 네 흐름 · 32컷 모두 펼친 채 · 품었던 그림판의 칸 전체(SVG) · 컷 뒤 외울 것 · 같은 시기 세 나라 · 강의·교재 근거');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8')), txt = h => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const crypto = require('crypto');
  const s = rdr('media/samguk-comic.html'), scs = s.match(SCENE) || [], F = 'samguk-comic.html: ';
  const mainHtml = s.slice(s.indexOf('<main>'), s.indexOf('</main>'));
  const scss = (/<style id="hanq-samguk-story">([\s\S]*?)<\/style>/.exec(s) || [])[1] || '';
  const fsrc = rdr('media/lecture-flow-samguk.js'), SF = JSON.parse((/\/\*FLOW-JSON\*\/([\s\S]*?)\/\*END-FLOW-JSON\*\//.exec(fsrc) || [, '{"list":[],"terms":[]}'])[1]), SL = SF.list || [], TERMS = SF.terms || [];
  const ORDER = Array.from({ length: 32 }, (_, i) => 's' + (i + 1));
  // 기준본 웹툰에 base64로 품었던 그림판 네 장(조정자가 잰 해시) · 장면별 칸 사각형(그림판, x, y, w, h — 그림판마다 행 높이가 다름)
  const SHA = ['6c476e4f1fef1707f1f3172f90e751412db9c1bee8e8c6010a90f083d921a74a', 'bfbed0bb132b14a677e0b811231c8e46308123d6d8fc2ccfc225c20d690e2aca', '88aeaaede189d24f8f403c0e93cb745b5084c4b4a55c26878856d22d0c9fc11d', 'b7a8596db4e7108e9c742072f0486c5fc210120a88ca62fc9b29f0900aae09b5'];
  const RECT = { 1: [0, 0, 0, 543, 358], 2: [0, 543, 0, 543, 358], 3: [0, 0, 358, 543, 350], 4: [0, 543, 358, 543, 350], 5: [0, 0, 708, 543, 362], 6: [0, 543, 708, 543, 362], 7: [0, 0, 1070, 543, 378], 8: [0, 543, 1070, 543, 378],
    9: [1, 0, 0, 543, 352], 10: [1, 543, 0, 543, 352], 11: [1, 0, 352, 543, 326], 12: [1, 543, 352, 543, 326], 13: [1, 0, 678, 543, 337], 14: [1, 543, 678, 543, 337], 15: [1, 0, 1015, 543, 433], 16: [1, 543, 1015, 543, 433],
    17: [2, 0, 0, 543, 362], 18: [2, 543, 0, 543, 362], 19: [2, 0, 362, 543, 365], 20: [2, 543, 362, 543, 365], 21: [2, 0, 727, 543, 362], 22: [2, 543, 727, 543, 362], 23: [2, 0, 1089, 543, 359], 24: [2, 543, 1089, 543, 359],
    25: [3, 0, 0, 543, 336], 26: [3, 543, 0, 543, 336], 27: [3, 0, 336, 543, 348], 28: [3, 543, 336, 543, 348], 29: [3, 0, 684, 543, 329], 30: [3, 543, 684, 543, 329], 31: [3, 0, 1013, 543, 435], 32: [3, 543, 1013, 543, 435] };
  const idOf = sc => (/<section class="scene"[^>]*\sid="([^"]+)"/.exec(sc) || [])[1];
  const MORE = /<details[\s\S]*?<\/details>/g, unfold = h => h.replace(MORE, ' '), folds = h => (h.match(MORE) || []).join(' ');
  ok(/<body class="s-story">/.test(s) && (s.match(/id="hanq-samguk-story"/g) || []).length === 1 && /@media\(max-width:400px\)\{\.s-talk\{grid-template-columns:1fr/.test(scss), F + '삼국 읽기 구조 CSS 한 번 · 좁은 화면(320·375)에서 말풍선 한 줄씩');
  ok(J(scs.map(idOf)) === J(ORDER) && scs.every((sc, i) => new RegExp('^<section class="scene" data-orig="' + (i + 1) + '" id="s' + (i + 1) + '">').test(sc)) && !/data-added=/.test(s), F + '32컷은 기존 id·순서 그대로(s1–s32, data-orig 같은 번호, 덧붙인 장면 없음)');
  ok(!/<details[^>]*>(?:(?!<\/details>)[\s\S])*<section class="scene"/.test(mainHtml) && !/class="(?:frame|dialogue|shade|beat|bubble|fact|artnote)[" ]/.test(mainHtml) && !/background-size|background-position/.test(mainHtml) && !/base64,|\.sheet\d\{/.test(s), F + '컷은 하나도 접지 않음 · 예전 배경 늘이기 그림·그림 위 말풍선·품은 base64 그림판 없음(예전 공용 스타일은 앞부분에 그대로)');
  ok(/<div id="progress"><\/div><main>/.test(s) && /getElementById\("progress"\)/.test(s) && s.includes('id="hanq-edge-swipe"') && s.includes('comic-scenes.js') && s.includes('data-auto="comic"') && s.includes('id="hanq-responsive-comic"') && s.includes('id="hanq-story-seams"'), F + '예전 진행 막대·가장자리 밀기·공용 스크립트(장면 번호·용어 풀이)·반응형·잇는 줄 스타일은 그대로');
  // 그림판: 새 파일 네 장 = 기준본에 품었던 PNG 바이트(다시 인코딩 없음), 1086×1448, 장면 지도와 같은 해시
  const sheets = [0, 1, 2, 3].map(n => { const p = path.join(ROOT, 'media', 'samguk-sheets', n + '.png'); return fs.existsSync(p) ? fs.readFileSync(p) : Buffer.alloc(0); });
  ok(sheets.every((b, n) => b.length > 24 && crypto.createHash('sha256').update(b).digest('hex') === SHA[n] && b.readUInt32BE(16) === 1086 && b.readUInt32BE(20) === 1448), '삼국 그림판 media/samguk-sheets/0–3.png: 측정 때와 같은 해시 · 1086×1448');
  const PS = (SGMAP.panel_source || {}).sheets || {};
  ok(J([0, 1, 2, 3].map(n => (PS[n] || {}).sha256)) === J(SHA) && [0, 1, 2, 3].every(n => (PS[n] || {}).file === 'media/samguk-sheets/' + n + '.png'), '장면 지도: 그림판 네 장의 파일·해시 기록');
  const one = (re, h) => (re.exec(h) || [])[1];
  if (base) {
    const b = fs.readFileSync(path.join(BASE, 'media', 'samguk-comic.html'), 'utf8');
    const emb = {}; for (const m of b.matchAll(/\.sheet(\d)\{background-image:url\(data:image\/png;base64,([A-Za-z0-9+/=]+)\)\}/g)) emb[m[1]] = Buffer.from(m[2], 'base64');
    ok(Object.keys(emb).length === 4 && [0, 1, 2, 3].every(n => emb[n] && Buffer.compare(emb[n], sheets[n]) === 0), '그림판 0–3.png는 기준본 웹툰에 품었던 base64 PNG와 바이트 동일(꺼내기만 하고 다시 인코딩하지 않음)');
    const bs = b.match(SCENE) || [];
    const find = x => scs.find(y => idOf(y) === idOf(x)) || '';
    ok(bs.length === 32 && J(bs.map(idOf)) === J(ORDER) && bs.every(x => { const sc = find(x); return one(/<h2>([^<]+)<\/h2>/, sc) === one(/<h2>([^<]+)<\/h2>/, x) && one(/<p class="key">([^<]+)<\/p>/, sc) === one(/<div class="beat">([^<]+)<\/div>/, x); }), F + '원래 32컷의 id·순서·제목·핵심 줄(예전 .beat → p.key) 그대로');
    ok(bs.every(x => { const sc = find(x); return one(/<p class="s-hook"><b>구분<\/b>([\s\S]*?)<\/p>/, sc) === one(/<p class="hook">([\s\S]*?)<\/p>/, x) && one(/<details class="scene-more s-orig"><summary>예전 설명\(원문 그대로\)<\/summary><p>([\s\S]*?)<\/p><\/details>/, sc) === one(/<p class="fact">([\s\S]*?)<\/p>/, x); }), F + '예전 구분 줄(.hook)은 보이게, 예전 설명(.fact)은 접힌 ‘예전 설명(원문 그대로)’에 글자 그대로');
    ok(bs.every(x => { const sc = find(x); const ms = h => [...h.matchAll(/<b>([^<]+)<\/b><span>([^<]+)<\/span>/g)].map(m => [m[1], m[2]]); const o = ms(x), n = ms(sc); return o.length === 2 && n.length === 2 && J(o.map(p => p[1])) === J(n.map(p => p[1])) && o.every((p, i) => n[i][0] === p[0] || n[i][0] === p[0] + ' · 설명용 인물'); }), F + '예전 대사·화자 그대로(이름 없는 화자에만 ‘설명용 인물’)');
    const artIds = bs.filter(x => /class="artnote"/.test(x)).map(idOf);
    ok(J(artIds) === J(['s16', 's17', 's18', 's19', 's20']) && J(scs.filter(x => /class="s-art-note"/.test(x)).map(idOf)) === J(artIds) && artIds.every(id => /<p class="s-art-note">[^<]*실제 유물의 형태와 다를 수 있어요/.test(scs[ORDER.indexOf(id)] || '')), F + '예전 그림 안내(유물 형태가 다를 수 있음)가 있던 컷(s16–s20)에만 같은 뜻의 안내');
  }
  // 칸: 장면마다 그 칸 사각형 전체를 SVG viewBox로, 비율 자리(--s-ar) 먼저, 이웃 칸·확대 없음, 처음 두 컷 외에도 지연 로딩 대신 같은 네 파일 공유
  const rs = Object.values(RECT), sgen = rdr('scripts/build_samguk_comic.py');
  ok(rs.length === 32 && rs.every(([, x, y, w, h]) => x >= 0 && y >= 0 && x + w <= 1086 && y + h <= 1448) && rs.every((a, i) => rs.every((c, j) => i === j || a[0] !== c[0] || a[1] + a[3] <= c[1] || c[1] + c[3] <= a[1] || a[2] + a[4] <= c[2] || c[2] + c[4] <= a[2])) &&
    J([0, 1, 2, 3].map(k => [...new Set(rs.filter(r => r[0] === k).map(r => r[4]))])) === J([[358, 350, 362, 378], [352, 326, 337, 433], [362, 365, 359], [336, 348, 329, 435]]),
    '칸 32개는 그림판 안에서 서로 겹치지 않음 · 행 높이가 그림판마다 다름(균등 격자 가정 없음)');
  ok(Object.entries(RECT).every(([k, r]) => sgen.includes(k + ': (' + r.join(', ') + ')')), '생성기의 칸 사각형 = 조정자가 잰 값');
  const GEN = /^(농민|고구려 장수|백제 장수|신하|신라 사신|가야 상인|상인 동료|백제 사신|백제 신하|청년|학생|스승|장인|고구려 사람|백제 사람|안내자|신라 사람|동료|사신|왕실 사람|백제 장인|승려|고구려 신하|장수|신라군|부흥군|고구려 유민|신라 장수|신라 왕|수군|기록자) · 설명용 인물$/;
  scs.forEach((sc, i) => {
    const id = idOf(sc), n = F + id + ': ', r = RECT[i + 1];
    const pm = /<div class="s-art" data-panel="samguk-(\d)-s(\d\d)"><svg class="s-panel" viewBox="(\d+) (\d+) (\d+) (\d+)" width="(\d+)" height="(\d+)" style="--s-ar:(\d+) \/ (\d+)" role="img" aria-label="[^"]+" focusable="false" preserveAspectRatio="xMidYMid meet"><image href="samguk-sheets\/(\d)\.png" x="0" y="0" width="1086" height="1448"\/><\/svg><\/div>/.exec(sc);
    ok(pm && +pm[1] === r[0] && +pm[2] === i + 1 && +pm[11] === r[0] && J([+pm[3], +pm[4], +pm[5], +pm[6]]) === J(r.slice(1)) && +pm[7] === r[3] && +pm[8] === r[4] && +pm[9] === r[3] && +pm[10] === r[4] && (sc.match(/<svg/g) || []).length === 1,
      n + '그림판 ' + r[0] + '의 칸 (' + r.slice(1).join(',') + ') 전체를 SVG viewBox로 · 비율 자리 먼저(이웃 칸·확대·늘이기 없음)');
    const mp = SGMAP.scenes.find(x => x.id === id) || {};
    ok(mp.panel && J(mp.panel.rect) === J(r.slice(1)) && mp.panel.sha256 === SHA[r[0]] && mp.panel.sheet === 'media/samguk-sheets/' + r[0] + '.png', n + '장면 지도: 칸 사각형·그림판 해시');
    const at = re => { const m = re.exec(sc); return m ? m.index : -1; };
    const pos = [at(/<h2>/), at(/<p class="s-when">/), at(/<div class="s-art"/), at(/<p class="s-art-cap">/), at(/<p class="s-talk-cap">/), at(/<ol class="s-steps"/), at(/<p class="key">/), at(/<p class="s-hook">/)];
    ok(pos.every((p, k) => p >= 0 && (!k || p > pos[k - 1])), n + '읽는 순서: 제목 → 나라·왕·시기 줄 → 그림 → 개념 그림 표시 → 학습용 요약 대화 → 설명 → 핵심 줄 → 구분');
    const says = [...((/<div class="s-talk">([\s\S]*?)<\/div>/.exec(sc) || [])[1] || '').matchAll(/<p aria-label="([^"]+)"><b>([^<]+)<\/b><span>([^<]+)<\/span><\/p>/g)];
    ok(/<p class="s-talk-cap">학습용 요약 대화[^<]*실제 발언[^<]*<\/p><div class="s-talk">/.test(sc) && says.length === 2 && says.every(m => m[1] === m[2] + ': ' + m[3] && (/^(을파소|미천왕|근초고왕|소수림왕|광개토 대왕|장수왕|문주왕|지증왕|법흥왕|백제 성왕|신라 진흥왕|을지문덕|김춘추|계백)$/.test(m[2]) || GEN.test(m[2]))),
      n + '말풍선 둘은 그림 밖, ‘학습용 요약 대화’ 표시, 기록에 이름이 없는 화자는 ‘설명용 인물’');
    const steps = [...sc.matchAll(/<li><b class="st (cause|dev|res|item)">([^<]+)<\/b><span>(.*?)<\/span><\/li>/g)];
    const sb = steps.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
    ok(steps.length >= 2 && steps.every(m => /다\.$/.test(txt(m[3]).trim())) && sb.every(b => TERMS.includes(b)) && new Set(sb).size === sb.length, n + '설명 ' + steps.length + '줄(문장), 굵은 말 ' + sb.length + '개는 흐름 데이터의 핵심어, 한 번씩');
    ok((mp.teacher_lines && /^\d{3}/.test(mp.teacher_lines)) || (mp.teacher_lines === null && id === 's21' && /기존 웹툰 설명/.test(mp.source || '')), n + '근거 기록(강의 ' + (mp.teacher_lines || '없음 · 기존 웹툰 설명') + ')');
    ok(!!mp.stress === /class="s-stress"/.test(sc) && (!mp.stress || /(짚었어요|했어요)\.$/.test(mp.stress)), n + '강의가 직접 짚은 말만 ‘강의 강조’로 표시');
    ok(/<details class="scene-more s-orig"><summary>예전 설명\(원문 그대로\)<\/summary><p>[\s\S]*?<\/p><\/details><\/section>$/.test(sc) && !/<details[^>]* open/.test(sc), n + '예전 설명은 장면 끝에 접힌 채(원문 그대로)');
    const rest = s.slice(s.indexOf(sc) + sc.length).replace(/<span class="legacy-anchor" id="mem-[^"]+" aria-hidden="true"><\/span>/g,'').replace(/^(?:<aside class="s-mem"[\s\S]*?<\/aside>)?/, '');
    ok(rest.startsWith('<div class="story-seam') === (i < scs.length - 1), n + (i < scs.length - 1 ? '(외울 것 카드가 있으면 그 뒤) 다음 컷으로 잇는 줄' : '마지막 컷 뒤에는 잇는 줄 없음'));
  });
  // 네 흐름: 시작 컷은 예전 바로 가기와 같고, 같은 시기 세 나라를 나란히 · ③은 주제별(시기가 겹침)
  ok(J(SL.map(f => [f.id, f.start])) === J([['flow-1', 's1'], ['flow-2', 's8'], ['flow-3', 's14'], ['flow-4', 's22']]) && /나란히/.test(SF.note) && /나란히/.test(SL[0].lead) && !/→/.test(SL[0].range) && !/→/.test(SL[2].range) && /주제별|나라별 비교/.test(SL[2].name) && /겹/.test(SL[2].lead) && /겹/.test(SF.note),
    '삼국 흐름: 시작 컷 s1·s8·s14·s22(예전 바로 가기와 같음) · 세 나라는 나란히 · ①·③의 범위 줄은 화살표 없이 · ③은 나라별 비교(시기가 겹침)');
  const heads = [...s.matchAll(/<div class="s-flow" id="(flow-\d)"><small>([^<]*)<\/small><h2 id="\1-h">([^<]+)<\/h2><p>[^<]+<\/p><\/div>\n?/g)];
  ok(heads.length === 4 && heads.every(m => { const f = SL.find(x => x.id === m[1]); return f && m[3] === f.no + ' ' + f.name && m[2] === f.no + ' · ' + f.range && s.indexOf(m[0]) + m[0].length === s.indexOf(scs[ORDER.indexOf(f.start)]); }), F + '흐름 머리 4개는 각 흐름 첫 컷 바로 앞');
  ok(['s7', 's13', 's21'].every(id => { const sc = scs[ORDER.indexOf(id)]; return /^(?:<aside class="s-mem"[\s\S]*?<\/aside>)?<div class="story-seam s-switch"/.test(s.slice(s.indexOf(sc) + sc.length)); }) && (s.match(/story-seam s-switch/g) || []).length === 3, F + '흐름이 바뀌는 곳 3곳은 진한 잇는 줄');
  const CH = SL.flatMap(f => f.chunks), endKey = {}; CH.forEach((k, i) => { endKey[k.t] = i + 1 < CH.length ? ORDER[ORDER.indexOf(CH[i + 1].go) - 1] : ORDER[ORDER.length - 1]; });
  const cards = [...s.matchAll(/<aside class="s-mem" id="mem-([^"]+)" aria-label="[^"]+"><p class="s-mem-label">이 부분에서 외울 것<\/p>([\s\S]*?)<\/aside>/g)];
  ok(J(cards.map(m => m[1])) === J(['s7','s13','s21','s32']) && cards.every(m => { const sc = scs[ORDER.indexOf(m[1])]; return s.indexOf(sc) + sc.length === m.index; }) && J(cards.map(m => m[1])) === J((SGMAP.memory || []).map(x => x.after)),
    F + '외울 것 카드 13장은 덩어리의 마지막 컷 바로 뒤(장면 지도와 같음)');
  const kRe = /<div class="s-mem-k"><p class="s-mem-head"><b class="s-mem-t">([^<]+)<\/b><span class="s-mem-w">([^<]+)<\/span><\/p><div class="s-mem-story">((?:<p>(?:(?!<\/p>)[\s\S])*<\/p>)+)<\/div>(<div class="s-memo">[\s\S]*?<\/div>)?(<p class="s-mem-x"><b>헷갈리지 않기<\/b>[\s\S]*?<\/p>)<p class="s-keys"><span class="s-keys-label">암기 키워드<\/span>((?:<span class="s-key">[^<]+<\/span>)+)<\/p><\/div>/g;
  const ks = cards.flatMap(m => [...m[2].matchAll(kRe)]), md = x => x.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  ok(ks.length === CH.length && ks.every((m, i) => { const k = CH[i]; return m[1] === k.t && m[2] === k.w && m[3] === k.story.map(x => '<p>' + md(x) + '</p>').join('') && k.story.length >= 2 && k.story.length <= 4 && !!m[4] === !!k.memo && J([...m[6].matchAll(/<span class="s-key">([^<]+)<\/span>/g)].map(y => y[1])) === J(k.k) && k.k.length >= 1 && k.k.length <= 3; }),
    F + '카드 = 데이터의 덩어리 순서·나라/왕·이야기 2–4문장(핵심어 굵게)·외우는 순서·헷갈리지 않기·키워드 1–3');
  const cb = ks.flatMap(m => [...m[3].matchAll(/<strong>([^<]+)<\/strong>/g)].map(x => x[1]));
  ok(cb.length >= 60 && cb.every(b => TERMS.includes(b)), F + '카드에서 굵은 말 ' + cb.length + '개는 모두 흐름 데이터의 핵심어');
  const cardTxt = txt(cards.map(m => m[2]).join(' '));
  ok(/근초고왕\(고국원왕 전사\)이고, 백제 성왕이 죽은 곳은 관산성이다/.test(cardTxt) && /한성 함락 때 죽은 왕은 개로왕, 웅진으로 옮긴 왕은 문주왕이다/.test(cardTxt) && /영락은 광개토왕의 연호다\. 신라 법흥왕의 연호 건원과 섞지 않는다/.test(cardTxt) &&
    /금관가야는 법흥왕, 대가야는 진흥왕 때 신라에 복속되었다/.test(cardTxt) && /수와의 전쟁은 을지문덕·살수, 당과의 전쟁은 안시성이다/.test(cardTxt) && /백제 부흥은 부여풍·복신·도침·흑치상지, 고구려 부흥은 검모잠·고연무·안승이다/.test(cardTxt) &&
    /매소성·기벌포는 당을 몰아낸 나당 전쟁의 싸움이다/.test(cardTxt) && /한 나라가 다른 나라에 전한 순서로 잇지 않아요/.test(cardTxt) && /한 나라가 다른 나라를 이은 순서가 아니라, 같은 시기 세 나라가 전성기를 맞은 차례예요/.test(cardTxt) && /나제 동맹은 신라와 백제, 나당 동맹은 신라와 당이다/.test(cardTxt),
    F + '카드의 헷갈리는 짝: 고국원왕 vs 성왕 · 개로왕 vs 문주왕 · 영락 vs 건원 · 금관가야 vs 대가야 · 살수 vs 안시성 · 두 부흥 운동 · 매소성·기벌포 · 불교 수용은 각자 · 전성기 차례는 나라 교체가 아님 · 나제 vs 나당');
  // 헷갈리는 짝: 장면 설명(펼친 본문)에서 왕-업적을 바꿔 붙이지 않음
  const stepTxt = id => txt(((/<ol class="s-steps"[\s\S]*?<\/ol>/.exec(scs[ORDER.indexOf(id)] || '') || [''])[0]));
  const stepLines = id => [...((/<ol class="s-steps"[\s\S]*?<\/ol>/.exec(scs[ORDER.indexOf(id)] || '') || [''])[0]).matchAll(/<li>([\s\S]*?)<\/li>/g)].map(m => txt(m[1]));
  ok(/근초고왕[^.]*평양성[^.]*고국원왕[^.]*전사/.test(stepTxt('s3')) && !/관산성|성왕/.test(stepTxt('s3')) && /성왕[^.]*관산성[^.]*전사/.test(stepTxt('s13')) && !/고국원왕/.test(stepTxt('s13')), F + '고국원왕 전사(근초고왕의 평양성 공격)와 성왕 전사(관산성)를 섞지 않음');
  ok(/장수왕[^.]*한성[^.]*함락[^.]*개로왕/.test(stepTxt('s8')) && /문주왕[^.]*웅진/.test(stepTxt('s8')) && !/개로왕[^.]*웅진|문주왕[^.]*한성/.test(stepTxt('s8')), F + '한성 함락은 개로왕, 웅진 천도는 문주왕');
  ok(/영락/.test(stepTxt('s5')) && !/건원/.test(stepTxt('s5')) && /건원/.test(stepTxt('s11')) && !/영락/.test(stepTxt('s11')), F + '영락은 광개토왕(s5), 건원은 법흥왕(s11)');
  // 경당: 교재 표 4는 장수왕 칸, 예전 구분 줄은 “소수림왕 업적으로 묶지 말자” — 설명 줄·카드 문장·흐름 데이터의 어느 문장에서도 경당을 소수림왕과 함께 쓰지 않는다(예전 구분 줄의 부정문은 제외)
  const sentences = arr => arr.flatMap(x => String(x).replace(/\*\*/g, '').split(/(?<=다\.|요\.)\s+/));
  const gyeong = sentences([...scs.flatMap((sc, i) => stepLines(ORDER[i])), ...cards.flatMap(m => [...m[2].matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(x => txt(x[1]))), ...SL.flatMap(f => [f.lead, ...f.chunks.flatMap(k => [...k.story, k.x, ...(k.memo ? [k.memo.text, k.memo.note] : [])])])]).filter(l => /경당/.test(l));
  ok(/율령/.test(stepTxt('s4')) && /태학/.test(stepTxt('s4')) && /순도/.test(stepTxt('s4')) && !/경당/.test(stepTxt('s4')) && gyeong.length >= 2 && gyeong.every(l => !/소수림왕/.test(l) && /지방/.test(l)),
    F + '소수림왕 = 율령·태학·순도(불교), 경당은 어느 문장에서도 소수림왕과 묶지 않고 지방 학교로만(' + gyeong.length + '문장)');
  ok(stepLines('s19').some(l => /소수림왕/.test(l) && /순도/.test(l)) && stepLines('s19').some(l => /침류왕/.test(l) && /마라난타/.test(l)) && stepLines('s19').some(l => /법흥왕/.test(l) && /이차돈/.test(l)) && stepLines('s19').some(l => /무왕/.test(l) && /미륵사/.test(l)) && stepLines('s19').some(l => /선덕여왕/.test(l) && /자장/.test(l) && /황룡사 9층 목탑/.test(l)),
    F + '불교 수용의 왕(소수림왕·순도 / 침류왕·마라난타 / 법흥왕·이차돈)과 탑의 왕(무왕·미륵사 / 선덕여왕·자장·황룡사)을 한 줄씩 짝지음');
  ok(stepLines('s6').some(l => /금관가야는 신라 법흥왕/.test(l) && /대가야는 신라 진흥왕/.test(l)), F + '금관가야는 법흥왕, 대가야는 진흥왕 때 복속');
  ok(/살수/.test(stepTxt('s22')) && !/안시성/.test(stepTxt('s22')) && /안시성/.test(stepTxt('s23')) && !/살수/.test(stepTxt('s23')), F + '살수(수)와 안시성(당)을 섞지 않음');
  ok(/부여풍/.test(stepTxt('s26')) && !/안승|검모잠/.test(stepTxt('s26')) && stepLines('s28').slice(0, 2).every(l => !/부여풍|복신|흑치상지/.test(l)) && /안승/.test(stepTxt('s28')) && /매소성/.test(stepTxt('s30')) && !/매소성|기벌포/.test(stepTxt('s26')), F + '백제 부흥(부여풍·복신·도침·흑치상지)과 고구려 부흥(검모잠·고연무·안승)·나당 전쟁(매소성·기벌포)을 섞지 않음');
  ok(/김유신/.test(stepTxt('s24')) && /선덕여왕[^.]*비담과 염종의 난|비담과 염종의 난[^.]*김유신/.test(stepTxt('s24')) && /윤충[^.]*대야성/.test(stepTxt('s24')), F + '대야성(의자왕·윤충)과 비담과 염종의 난(선덕여왕·김유신)');
  // 같은 시기 세 나라: 전성기 차례의 화살표는 정리 컷(s31)·마지막 카드에만, 나머지 펼친 본문·흐름 데이터에는 나라 사이 전성기 사슬을 만들지 않음
  const vis = txt(unfold(mainHtml)), folded = txt(folds(mainHtml));
  const visNoRecap = txt(unfold(mainHtml.replace(scs[30] || '', ' ').replace(/<aside class="s-mem" id="mem-s32"[\s\S]*?<\/aside>/, ' ').replace(/<div class="end">[\s\S]*?<\/div>/, ' ')));
  const CHAIN = /근초고(?:왕)?\s*→\s*(?:고구려\s*)?광개토|광개토(?:왕)?[·\s]*(?:장수(?:왕)?)?\s*→\s*(?:신라\s*)?진흥/;
  ok(!CHAIN.test(visNoRecap) && !CHAIN.test(txt(SL.slice(0, 3).map(f => f.lead + ' ' + f.range + ' ' + f.chunks.map(k => k.story.join(' ') + ' ' + k.x).join(' ')).join(' '))) && /나란히/.test(stepTxt('s31')) && /전성기를 맞은 순서/.test(stepTxt('s31')),
    F + '전성기 차례(근초고 → 광개토·장수 → 진흥)는 정리 컷·마지막 카드에만, “같은 시기 나란히 있던 나라”라고 밝힘');
  const NEED = ['고국천왕', '을파소', '진대법', '유리왕', '국내성', '동천왕', '관구검', '환도성', '미천왕', '서안평', '낙랑군', '근초고왕', '마한', '평양성', '고국원왕', '칠지도', '고흥', '서기', '소수림왕', '율령', '태학', '순도',
    '광개토왕', '영락', '호우명 그릇', '김수로', '금관가야', '대가야', '장수왕', '광개토대왕릉비', '장군총', '나제 동맹', '북위', '개로왕', '문주왕', '웅진', '동성왕', '소지 마립간', '무령왕', '22담로', '무령왕릉', '백가의 난',
    '지증왕', '동시전', '이사부', '우산국', '순장', '마립간', '법흥왕', '병부', '상대등', '이차돈', '건원', '성왕', '사비', '남부여', '진흥왕', '신주', '관산성', '김무력', '화랑도', '거칠부', '국사',
    '욕살', '처려근지', '부경', '정사암', '6좌평', '부여씨', '화백 회의', '골품', '세속 5계', '경당', '임신서기석', '돌무지무덤', '굴식 돌방무덤', '모줄임 천장', '개마무사', '안악 3호분', '석촌동', '송산리', '능산리', '돌무지 덧널무덤', '천마도', '금관',
    '침류왕', '마라난타', '무왕', '미륵사', '미륵사지 석탑', '선덕여왕', '자장', '황룡사 9층 목탑', '분황사 모전 석탑', '첨성대', '사신도', '금동대향로', '산수무늬 벽돌', '혜자', '노리사치계',
    '영양왕', '을지문덕', '살수', '이문진', '신집', '천리장성', '연개소문', '안시성', '의자왕', '윤충', '대야성', '김춘추', '나당 동맹', '비담과 염종의 난', '김유신', '무열왕', '계백', '황산벌', '사비성',
    '복신', '도침', '부여풍', '흑치상지', '임존성', '백강', '문무왕', '검모잠', '고연무', '안승', '보덕국왕', '웅진 도독부', '계림 도독부', '안동 도호부', '매소성', '기벌포'];
  const lost = NEED.filter(w => !vis.includes(w));
  ok(!lost.length, F + '강의·교재가 짚은 단서 ' + NEED.length + '개가 펼치지 않아도 보임' + (lost.length ? ' (빠짐: ' + lost.join(',') + ')' : ''));
  ok(/걸사표/.test(folded) && !/걸사표/.test(vis) && /비유왕/.test(folded) && /정림사지 5층 석탑/.test(folded), F + '강의가 ‘가끔’·‘몰라도 돼요’로 낮춘 범위(원광의 걸사표 · 처음 동맹의 왕 비유왕·눌지)와 흐름 보충은 접힌 보충에만');
  const shown = txt(mainHtml) + ' ' + fsrc;
  ok(!/소수린|소스왕|소스인왕|관계토|관객토|낭랑군|고국 원|원항|근처고|근처공|평양선|평행성|광구검|서한평|윤령|연계 ?소문|연계서문|건모장|철력|위래성|고의왕|게로왕|소재왕|22담를|격돌 무덤|성황|데가야|대화성|대하성|개백|정사함|육자평|내두자형|금동 대양로|지정황|기증왕|버풍왕|버프왕|늘지왕|설화벌|사로곡|2차돈|금강가야|금간 가야|지능왕|도덕부|도후부|메기 전투|돌박|황용사|구축목탑|분항사|임신석이석|철가옷|무여왕|스로왕|비우왕|송산니|안악 사무분|연가 치연명/.test(shown),
    F + '강의 받아쓰기 오타(소수린·관계토왕·근처고왕·연계소문·버풍왕·지능왕·대화성·정사함 등)가 화면·흐름 데이터에 없음(바른 표기만)');
  ok(!/소지왕과 결혼|동성왕[^.]*소재/.test(shown) && /소지 마립간/.test(stepTxt('s8')) && /진흥왕[^.]*거칠부/.test(stepTxt('s13')), F + '강의 정정: 동성왕의 혼인 동맹 상대는 소지 마립간, 「국사」·대가야 정복은 진흥왕(강의 받아쓰기 “지능왕”)');
  ok(!/빈출|출제 확률|\d+\s*%/.test(txt(mainHtml) + ' ' + fsrc) && !/100만 대군|113만/.test(vis), F + '출제 비율 주장 없음 · 출처마다 다른 병력 수는 펼친 본문에 쓰지 않음(예전 설명에만)');
  // 글자 크기 · 바로 가기 줄 · 끝 안내
  ok(/\.s-talk span\{[^}]*font-size:16px/.test(scss) && /\.s-talk b\{[^}]*font-size:14px/.test(scss) && /\.s-steps li\{[^}]*font-size:16px/.test(scss) && /\.s-mem-story p\{[^}]*font-size:16px;line-height:1\.7/.test(scss) && /\.s-story \.s-panel\{display:block;width:100%;height:auto;aspect-ratio:var\(--s-ar\)\}/.test(scss), F + '대사 16px · 화자 14px · 설명·카드 16px · SVG 칸은 너비 100%·칸 비율로 자리');
  const navM = /<nav class="s-nav" aria-label="[^"]+"><div class="s-nav-track">((?:<a href="#flow-\d">[^<]+<\/a>)+)<\/div><\/nav>/.exec(s);
  ok(navM && J([...navM[1].matchAll(/href="#(flow-\d)"/g)].map(m => m[1])) === J(['flow-1','flow-2','flow-3','flow-4']) && (s.match(/<nav[\s>]/g) || []).length === 1, F + '흐름 바로 가기는 네 흐름 머리로 가는 링크만(줄 하나, 예전 nav는 대체 · 예전 앵커 #s1·#s8·#s14·#s22는 장면 id로 그대로)');
  ok(/\.s-story nav\.s-nav\{position:sticky;top:0;[^}]*height:60px;box-sizing:border-box;[^}]*padding:0 92px 0 10px/.test(scss) && /\.s-story \.s-nav-track\{[^}]*overflow-x:auto/.test(scss) && /\.s-story nav\.s-nav a\{[^}]*min-height:44px[^}]*font-size:14px/.test(scss) && /\.s-story nav\.s-nav a:focus-visible\{outline:3px/.test(scss) &&
    /\.s-story \.comic-home\{top:calc\(9px \+ env\(safe-area-inset-top\)\);min-height:42px\}/.test(scss) && /@media\(min-width:760px\)\{\.s-story nav\.s-nav\{padding-right:10px\}\}/.test(scss) && /\.s-story \.scene,\.s-story \.s-flow,\.s-story \.s-mem\{scroll-margin-top:68px\}/.test(scss) &&
    /\.s-story \.s-flow:focus\{outline:3px/.test(scss) && scss.indexOf('.embedded .s-story nav{display:none}') > scss.indexOf('.s-story nav.s-nav{position:sticky') && /prefers-reduced-motion:reduce\)\{html\{scroll-behavior:auto\}/.test(s) && /\.s-story \.s-head h2\{padding:0/.test(scss) && /\.s-story \.s-head \.meta\{padding:0/.test(scss),
    F + '바로 가기 줄 60px 고정 · 홈 버튼 자리 92px · 링크 44px·초점 테두리 · 앵커 68px · 앱 안에서는 숨김 · 움직임 줄이기 · 예전 공용 h2·meta 여백 덮음');
  ok(/href="\.\.\/index\.html#chapter\/samguk\/quiz" target="_top">[^<]*퀴즈로/.test(s) && /<div class="source">[^<]*등장 순서가 모두 연대순인 것은 아닙니다|<div class="source">자료: 「한능검 심화 시대별 문단구분 수정본 v2」 5~7쪽/.test(s), F + '마지막 안내는 이 시대 퀴즈로(앱 안에서도 바깥 창으로) · 예전 자료 안내 유지');
  // 노트·요약 이미지·문제 그대로 · 생성기 · 문서 · 앱 연결 · 모든 시대가 한 페이지 학습
  const sc0 = cur.chapters.find(c => c.id === 'samguk');
  ok(sc0 && sc0.note.length === 3 && sc0.summaryType === 'image' && sc0.summary === 'media/samguk-summary.png' && (cur.quizzes.samguk || []).length > 0, '삼국 노트 카드 3장 · 요약 이미지 · 빈칸 문제 그대로(' + (cur.quizzes.samguk || []).length + ')');
  if (base) { const bc = base.chapters.find(c => c.id === 'samguk'); ok(bc && J(bc.note) === J(sc0.note) && bc.memory === sc0.memory && bc.summary === sc0.summary && J(base.quizzes.samguk) === J(cur.quizzes.samguk) && J((base.mocks || {}).samguk) === J((cur.mocks || {}).samguk), '삼국 노트·요약 이미지·빈칸·기출은 기준본과 같음'); }
  ok(!/\/Users\//.test(sgen + fsrc) && !/\brandom\b|datetime|time\.time|Math\.random|Date\.now/.test(sgen + fsrc) && SHA.every(h => sgen.includes(h)) && /SHEET_W, SHEET_H = 1086, 1448/.test(sgen) && /base64\.b64decode\(found\[n\]\[0\], validate=True\)/.test(sgen) && /prepare_sheets\(src\)/.test(sgen.slice(sgen.indexOf('def build('))) && /check_panels\(\)/.test(sgen.slice(sgen.indexOf('def build('))) &&
    sgen.indexOf('prepare_sheets(src)', sgen.indexOf('def build(')) < sgen.indexOf("SHEET_STYLE_RE.sub('', src[src.index('</main>'):])"),
    '삼국 생성기·데이터: 개인 경로·시간·난수 없음, 품은 그림판을 디코드만 해 해시·크기를 확인한 뒤에야 품은 스타일을 지움(확인을 끄지 않음)');
  ok(/LECTURE_MANAGED = \{[^}]*'samguk'/.test(rdr('scripts/build_comics.py')), 'build_comics.py는 삼국을 다시 쓰지 않음(전용 생성기가 관리)');
  const sdocPath = path.join(ROOT, 'docs', 'samguk-scene-sources.md'), sdoc = fs.existsSync(sdocPath) ? fs.readFileSync(sdocPath, 'utf8') : '';
  ok(ORDER.every(id => sdoc.includes('`' + id + '`')) && sdoc.includes('f421b2e4fae8692960a4e6d3f691918a698cdc73b510e33222d6c2617a2e4d15') && sdoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442') && SHA.every(h => sdoc.includes(h)) && /100–336/.test(sdoc) && /PDF 16–30/.test(sdoc) &&
    /근처고왕 · 근처고황/.test(sdoc) && /버풍왕 · 버프왕 · 버왕 → 법흥왕/.test(sdoc) && /지능왕 → 진흥왕/.test(sdoc) && /소재왕 → 소지 마립간/.test(sdoc) && /경당/.test(sdoc) && /나란히/.test(sdoc) && !/\d+\s*%/.test(sdoc),
    '삼국 근거 문서: 32컷 · 강의 100–336행 · 교재 PDF 16–30쪽 · 스크립트·교재·그림판 SHA-256 · 받아쓰기·사실 정정(소지 마립간·진흥왕·경당) · 나란히 있던 나라, 비율 주장 없음');
  ok(/media\/lecture-flow-samguk\.js"><\/script>/.test(cur.html) && /var INTEGRATED=\[[^\]]*'samguk'[^\]]*\]/.test(cur.html), 'index.html: 삼국도 한 페이지 학습(네 흐름 바로 가기 데이터 연결)');
  const integ = ((/var INTEGRATED=\[([^\]]*)\]/.exec(cur.html) || [])[1] || '').split(',').map(x => x.replace(/'/g, '').trim());
  ok(cur.chapters.filter(c => c.active && !c.hidden && !c.partOf).every(c => integ.includes(c.id)), 'index.html: 목차의 모든 시대가 한 페이지 학습 목록에 있음(남은 네 탭 시대 없음)');
}

section('18. 빈칸 객관식 카탈로그: 기존 666 · 교재 642 · 보기 · 보기별 풀이 · 묶음');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const cpath = path.join(ROOT, 'media', 'quiz-catalog.js');
  const QC = fs.existsSync(cpath) ? (() => { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(cpath, 'utf8'), c); return c.window.HANQ_QUIZ_CATALOG; })() : null;
  ok(QC && QC.schema === 1 && QC.generatedBy === 'scripts/build_quiz_catalog.py', 'media/quiz-catalog.js 있음(scripts/build_quiz_catalog.py가 생성)');
  if (QC) {
    const Q = QC.questions, items = Object.values(Q);
    const CIRC = '①②③④⑤⑥⑦⑧⑨⑩⑪⑫⑬⑭⑮⑯⑰⑱⑲⑳';
    const nm = s => String(s).toLowerCase().split('').map(ch => CIRC.indexOf(ch) >= 0 ? String(CIRC.indexOf(ch) + 1) : ch).join('').replace(/[^가-힣a-z0-9]/g, '');
    const baseOf = s => String(s).replace(/\s*\([^)]*\)/g, '').trim();
    const keysOf = arr => { const out = new Set(); for (const s of arr) for (const t of [s, baseOf(s)].concat([...String(s).matchAll(/\(([^)]*)\)/g)].flatMap(m => m[1].split(/[,=·/]/)))) { const k = nm(t.trim()); if (k) { out.add(k); if (k.length >= 3 && k.endsWith('왕')) out.add(k.slice(0, -1)); } } return out; };
    const seq = s => [...String(s)].filter(ch => CIRC.includes(ch)).join('');
    const SPL = /\s*,\s*|(?<!\d)\s*·\s*(?!\d)/;
    const els = s => baseOf(s).split(SPL).filter(Boolean);
    // 기존 666: 실제 앱 배열(index.html · media/early-era-quiz.js)과 한 글자도 다르지 않게, ID는 legacy-장-번호
    let legacyTotal = 0, legacyOk = true, badLegacy = [];
    for (const [era, arr] of Object.entries(cur.quizzes)) arr.forEach((r, i) => {
      legacyTotal++;
      const id = 'legacy-' + era + '-' + String(i).padStart(3, '0'), it = Q[id], L = it && it.legacy;
      const same = L && L.chapter === era && L.index === i && ['q', 'a', 'section', 'clue', 'why', 'cue'].every(k => J(L[k] === undefined ? null : L[k]) === J(r[k] === undefined ? null : r[k]));
      if (!same) { legacyOk = false; badLegacy.push(id); }
    });
    ok(legacyTotal === QC.counts.legacy && QC.counts.legacy === items.filter(i => i.origin === 'legacy').length && legacyOk, '기존 빈칸 ' + legacyTotal + '문항이 모두 카탈로그에 원래 q·a·section·clue·why·cue 그대로(legacy-장-번호)' + (badLegacy.length ? ' (다름: ' + badLegacy.slice(0, 5).join(',') + ')' : ''));
    if (base) ok(J(Object.keys(base.quizzes).sort()) === J(Object.keys(cur.quizzes).sort()) && Object.keys(base.quizzes).every(k => J(base.quizzes[k]) === J(cur.quizzes[k])), '기존 빈칸 배열은 기준본과 바이트 단위로 같은 데이터(새 카탈로그는 별도 파일)');
    // 교재 642: 문항마다 원문 ID·줄·원문 문제·원문 정답이 남고, 모두 어떤 문항에 이어짐
    const refs = items.flatMap(i => (i.sources || []).map(s => [i.id, s]));
    const srcIds = new Set(refs.map(r => r[1].id));
    ok(srcIds.size === 642 && QC.counts.source === 642 && [...srcIds].every(x => /^check-\d\d-\d\d$/.test(x)) && Object.keys(QC.sourceIndex).length === 642 &&
      Object.entries(QC.sourceIndex).every(([sid, list]) => list.length >= 1 && list.every(iid => Q[iid] && Q[iid].sources.some(s => s.id === sid))), '교재 확인 문제 642개(서로 다른 check-GG-NN)가 모두 문항에 이어지고 원문 색인과 같음');
    ok(refs.every(([, s]) => Number.isInteger(s.line) && typeof s.rawQuestion === 'string' && typeof s.rawAnswer === 'string' && typeof s.answer === 'string' && s.question && s.chapterTitle && s.prompt), '교재 문항마다 원문 줄 · 원문 문제 · 원문 정답(고치기 전) · 쓰는 정답 · 단원 · 묶음 제목 보관');
    const srcOf = sid => (refs.find(r => r[1].id === sid) || [])[1] || {}, itemsOf = sid => (QC.sourceIndex[sid] || []).map(i => Q[i]), correctText = it => (it.options.find(o => o.correct) || {}).text;
    const corrected = refs.filter(([, s]) => s.correction).map(([, s]) => s.id);
    ok(new Set(corrected).size === 18 && /②→⑧/.test(srcOf('check-03-09').rawAnswer) && srcOf('check-03-09').answer === '장수왕' && srcOf('check-24-02').answer === '동의보감(광해군)' && /※/.test(srcOf('check-26-15').rawAnswer) && srcOf('check-26-15').answer === '조영통상조약' &&
      refs.filter(([, s]) => s.correction).every(([, s]) => s.correction.raw_answer === s.rawAnswer && s.correction.source_pdf_page), '교재 PDF 정답표로 고친 18건: 원문 정답은 그대로 두고 고친 정답·PDF 쪽을 함께(예: check-03-09 장수왕 · check-24-02 동의보감(광해군) · check-26-15)');
    ok(itemsOf('check-03-09').every(it => correctText(it) === '장수왕') && itemsOf('check-03-10').every(it => it.shape === 'order' && seq(correctText(it)) === '②⑧④③⑥①⑤⑦'), '줄이 밀린 정답을 그대로 쓰지 않음: check-03-09 = 장수왕, check-03-10 = ②→⑧→④→③→⑥→①→⑤→⑦');
    ok(['check-21-08', 'check-21-09', 'check-21-10', 'check-21-11'].every(sid => { const s = srcOf(sid); return /^\(국가\)/.test(s.rawQuestion) && s.clarification && itemsOf(sid).every(it => /조선이/.test(it.q) && !/^\(국가\)/.test(it.q) && !it.options.some(o => nm(o.text) === nm('조선'))); }) &&
      itemsOf('check-21-08').every(it => correctText(it) === '여진') && itemsOf('check-21-11').every(it => correctText(it) === '여진'), '외교 상대 4문항: 원문 ‘(국가) …’는 그대로 두고 화면은 상대를 묻는 문장으로, 6진·무역소의 정답은 여진(‘조선’은 보기에 없음)');
    const pairs = [['check-05-06', 'check-06-21'], ['check-11-04', 'check-15-01'], ['check-33-12', 'check-34-08']];
    ok(pairs.every(([a, b]) => { const A = QC.sourceIndex[a] || [], B = QC.sourceIndex[b] || []; return A.length && B.length && !A.some(x => B.includes(x)) && A.every(x => B.every(y => correctText(Q[x]) !== correctText(Q[y]) && Q[x].ask && Q[y].ask && Q[x].ask !== Q[y].ask)); }),
      '글은 같지만 묻는 것이 다른 세 쌍(법흥왕·신라 · 예종·여진 · 1920년대·산미증식계획)은 서로 다른 문항, ‘묻는 것’을 따로 표시');
    ok(itemsOf('check-12-02').every(it => it.shape === 'map' && it.options.length >= 2) && itemsOf('check-02-11').every(it => it.shape === 'set' && it.options.every(o => els(o.text).length === 2)) && itemsOf('check-02-01').every(it => it.shape === 'order'),
      '짝짓기(check-12-02)·두 나라 묶음(check-02-11 옥저·동예: 보기도 모두 두 나라)·순서(check-02-01)는 쪼개지 않고 한 문항');
    // 보기: 정답 하나 · 보기 ID(자리와 무관) · 겹치지 않음 · 오답이 정답의 별칭이 아님 · 모양별 규칙
    const bad = [];
    for (const it of items) {
      const o = it.options || [], cor = o.filter(x => x.correct), why = m => bad.push(it.id + ' ' + m);
      if (o.length < 2 || o.length > 4 || cor.length !== 1) { why('보기 수/정답 수'); continue; }
      if (new Set(o.map(x => x.id)).size !== o.length || !o.every(x => /^o[0-9a-f]{10}$/.test(x.id))) why('보기 ID');
      if (new Set(o.map(x => nm(x.text))).size !== o.length) why('보기 글 겹침');
      if (!/^[0-9a-f]{16}$/.test(it.v || '')) why('버전');
      if (!o.every(x => Array.isArray(x.review) && x.review.length >= 1 && x.review.every(l => typeof l === 'string' && l.length && l.length <= 400))) why('보기 풀이');
      const c = cor[0], wrongs = o.filter(x => !x.correct);
      if (it.shape === 'single') {
        if (it.compound) { if (wrongs.some(w => nm(w.text) === nm(c.text))) why('짝 답 오답'); }
        else { const acc = keysOf(it.a.concat([c.text])); if (wrongs.some(w => [...keysOf([w.text])].some(k => acc.has(k)))) why('오답이 정답 별칭과 겹침'); if (!it.a.some(a => nm(baseOf(a)) === nm(baseOf(c.text)) || nm(a) === nm(c.text))) why('정답 보기가 받는 답이 아님'); }
      } else if (it.shape === 'order') {
        const cs = seq(c.text); if (!it.a.some(a => seq(a) === cs)) why('순서 정답');
        if (wrongs.some(w => seq(w.text) === cs || [...seq(w.text)].sort().join('') !== [...cs].sort().join(''))) why('순서 오답');
      } else if (it.shape === 'set' || it.shape === 'roles') {
        const ce = els(c.text), setKey = a => it.shape === 'set' ? a.map(nm).sort().join('|') : a.map(nm).join('|');
        if (wrongs.some(w => els(w.text).length !== ce.length || setKey(els(w.text)) === setKey(ce))) why('묶음 오답이 정답과 같음(순서만 바꾼 묶음 포함)');
        if (it.shape === 'roles' && wrongs.some(w => els(w.text).map(nm).sort().join('|') !== ce.map(nm).sort().join('|'))) why('칸 답 오답은 같은 말의 다른 칸');
      } else if (it.shape === 'map') {
        if (wrongs.some(w => w.text === c.text)) why('짝짓기 오답');
      } else why('모양');
      if (!c.review[0].startsWith('**')) why('정답 풀이 첫 줄');
    }
    ok(!bad.length, '문항 ' + items.length + '개: 보기 2–4개 · 정답 하나 · 안정 보기 ID · 글 겹침 없음 · 오답이 정답 별칭·같은 묶음(순서만 바꾼 것)이 아님 · 보기마다 짧은 풀이' + (bad.length ? ' (문제: ' + bad.slice(0, 6).join(' / ') + ')' : ''));
    const binaryOk = items.filter(i => i.options.length === 2).every(i => i.shape !== 'order' && (i.shape === 'roles' || i.shape === 'map' || (i.flags || []).some(f => f === 'options-2')));
    ok(binaryOk, '보기가 둘뿐인 문항은 같은 종류의 다른 답이 하나뿐인 경우(억지로 채우지 않음) · 지도 기록(flags)에 표시');
    // 묶음: 기본 20 = 예전 고르기, 풀 = 기존 전부 + 교재만의 문항, 세트 수 = ceil(풀/20)
    const sampleIx = len => { const c = Math.min(20, len); return Array.from({ length: c }, (_, i) => Math.floor(i * len / c)); };
    ok(Object.entries(cur.quizzes).every(([era, arr]) => { const ch = QC.chapters[era]; return ch && J(ch.core) === J(sampleIx(arr.length).map(i => 'legacy-' + era + '-' + String(i).padStart(3, '0'))) && J(ch.pool.slice(0, arr.length)) === J(arr.map((_, i) => 'legacy-' + era + '-' + String(i).padStart(3, '0'))); }),
      '장마다 기본 20(조선 전기·후기 각 20 = 예전 40)은 예전과 같은 고르기, 풀은 기존 문항 전부를 원래 순서로 먼저');
    ok(Object.entries(QC.chapters).every(([era, ch]) => ch.poolCount === ch.pool.length && ch.sets === Math.ceil(ch.pool.length / 20) && ch.pool.slice(ch.legacyCount).every(id => Q[id] && Q[id].origin === 'source' && Q[id].chapter === era)) &&
      items.filter(i => i.origin === 'source' && !i.duplicateOf).every(i => QC.chapters[i.chapter] && QC.chapters[i.chapter].pool.includes(i.id)) && QC.counts.pool === Object.values(QC.chapters).reduce((a, c) => a + c.poolCount, 0) && QC.setSize === 20,
      '풀 = 기존 문항 + 교재만의 문항(같은 문제·답이면 기존 문항의 출처로), 세트 수 = ⌈풀/20⌉, 수는 카탈로그에서 셈(' + Object.entries(QC.chapters).map(([e, c]) => e + ' ' + c.poolCount).join(', ') + ')');
    // 공용 풀이 계약: 같은 보기 ID로 묶인 풀이를 마이페이지 등에서도 그대로
    const rc = { window: {} }; vm.createContext(rc); vm.runInContext(rdr('media/quiz-review.js'), rc); const RV = rc.window.HanqQuizReview;
    const sampleItems = [Q['legacy-samguk-000'], ...itemsOf('check-12-02'), ...itemsOf('check-02-11'), ...itemsOf('check-24-02')].filter(Boolean);
    ok(RV && sampleItems.length >= 4 && sampleItems.every(it => { const w = it.options.find(o => !o.correct), k = RV.contract(it, w.id), html = RV.render(it, w.id);
      return k.schema === 2 && k.questionId === it.id && k.reviewVersion === it.rv && k.overview && k.overview.reason.length && k.contentVersion === it.v && k.correct === false && k.selectedOptionId === w.id && J(k.options.map(x => x.optionId)) === J(it.options.map(o => o.id)) &&
        k.options.filter(x => x.verdict === 'selected-wrong').length === 1 && k.options.filter(x => x.verdict === 'correct').length === 1 && it.options.every(o => html.includes('data-option="' + o.id + '"')); }) && RV.contract(sampleItems[0], null).correct === null,
      '공용 풀이 계약(media/quiz-review.js): 보기 ID마다 판정(정답 · 고른 오답 · 다른 보기)과 풀이 줄, 원문 출처 — 고르기 전에는 판정 없음');
    // 문항 풀이 카드(overview): 703문항 모두 왜 · 결정 단서 · 흐름 · 외울 말 · 헷갈림이 비지 않고, 정답만 되풀이하지 않음
    const DECL = /^\*\*[^*]+\*\* — (?:묻는 [^ ]+의 |이 문제의 )?정답이에요\.$/;
    const strs = a => Array.isArray(a) && a.length > 0 && a.every(l => typeof l === 'string' && l.trim().length > 0 && l.length <= 400);
    const ovBad = [];
    for (const it of items) {
      const ov = it.overview, why = m => ovBad.push(it.id + ' ' + m);
      if (!ov) { why('카드 없음'); continue; }
      for (const k of ['reason', 'clue', 'context', 'memory', 'contrast']) if (!strs(ov[k])) why(k);
      if (!Array.isArray(ov.refs)) why('refs');
      if (!/^[0-9a-f]{12}$/.test(it.rv || '')) why('풀이 버전');
      const ans = nm(baseOf(ov.answer || ''));
      if ((ov.reason || []).every(l => DECL.test(l) || nm(l) === ans)) why('왜가 정답 되풀이뿐');
      const c = it.options.find(o => o.correct);
      if (it.shape === 'single' && (c.review.length < 2 && !/결정 단서/.test(c.review[0]) || c.review.every(l => DECL.test(l)))) why('정답 풀이가 선언뿐');
      if (it.shape === 'single' && it.options.some(o => !o.correct && o.review.length < 2)) why('오답 풀이가 한 줄뿐');
      if (it.compound) for (const o of it.options.filter(o => !o.correct)) {
        const m = /^(.*?)\(([^)]*)\)$/.exec(o.text);
        if (m && nm(m[2]) !== nm(it.compound.king) && o.review.some(l => new RegExp(m[1].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\S{0,2} \\*\\*' + m[2].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\*\\* 때').test(l))) why('가짜 짝을 사실처럼 씀');
      }
    }
    ok(!ovBad.length, '문항 풀이 카드 ' + items.length + '개: 왜 · 결정 단서 · 흐름 · 외울 말 · 헷갈림 모두 있음 · 정답 되풀이뿐인 풀이 없음 · 오답마다 그 보기의 실제 단서 · 짝 답의 가짜 짝을 사실로 쓰지 않음' + (ovBad.length ? ' (문제 ' + ovBad.length + ': ' + ovBad.slice(0, 6).join(' / ') + ')' : ''));
    const reqPath = process.env.HANQ_REVIEW_REQUIRED || '';
    if (reqPath && fs.existsSync(reqPath)) {
      const reqIds = [...new Set([...fs.readFileSync(reqPath, 'utf8').matchAll(/"((?:legacy-[a-z-]+-\d{3})|check-\d\d-\d\d)"/g)].map(m => m[1]))].filter(id => Q[id]);
      ok(reqIds.length > 0 && reqIds.every(id => { const c = Q[id].options.find(o => o.correct); return c.review.length >= 2 && !ovBad.some(b => b.startsWith(id + ' ')); }), '고쳐야 할 문항 목록(' + reqIds.length + '개): 정답 풀이가 둘 이상의 줄 · 카드 완비');
    }
    // 화면의 출처는 짧게: 원문 행 · 내부 ID · 해시 없이, 정정·문맥 보완이 있을 때만 접힌 ‘출처와 정정 기록’
    const srcBad = [];
    for (const it of items) {
      const sh = RV.sourcesHtml(it), card = RV.renderOverview(it), has = (it.sources || []).some(s => s.correction || s.clarification);
      if (/\d+행|원문 줄|check-\d\d|legacy-|\bo[0-9a-f]{10}\b|[0-9a-f]{12,}|\.js\b|\.json\b/.test(sh + card)) srcBad.push(it.id + ' 내부 표기');
      if (/<details class="qsrc-more">/.test(sh) !== has) srcBad.push(it.id + ' 접힌 기록');
      if ((it.sources || []).length && !/교재 확인 문제 · /.test(sh)) srcBad.push(it.id + ' 짧은 출처');
      if (!/class="qcard"/.test(card)) srcBad.push(it.id + ' 카드');
    }
    ok(!srcBad.length && items.every(it => (it.sources || []).every(s => Number.isInteger(s.line) && typeof s.rawAnswer === 'string')), '화면 출처: ‘교재 확인 문제 · 장 n번 · PDF n쪽’만, 원문 행·내부 ID·해시·파일 이름 없음 · 정정·문맥 보완 문항만 접힌 ‘출처와 정정 기록’ · 원래 기록(sourceRefs)은 카탈로그에 그대로' + (srcBad.length ? ' (문제: ' + srcBad.slice(0, 6).join(' / ') + ')' : ''));
    const qmapPath = path.join(ROOT, 'docs', 'quiz-catalog-map.json'), qmap = fs.existsSync(qmapPath) ? JSON.parse(fs.readFileSync(qmapPath, 'utf8')) : {};
    ok(qmap.overviewEvidence && Array.isArray(qmap.overviewWeak) && qmap.overviewWeak.every(id => Q[id]), '지도 기록: 카드 근거 수(교재 줄 · 흐름 카드 · 강의 행 · 쪽 확인) · 근거가 약한 문항 목록(' + (qmap.overviewWeak || []).length + ')');
    // 쪽 인용: 교재 쪽 = PDF 쪽 − 7(PDF 8–144) · 한 쪽에 몰린 ‘얼어붙은 쪽’ 없음 · 정정·문맥 보완의 원래 증명 쪽은 그대로
    const tbRefs = items.flatMap(it => ((it.overview || {}).refs || []).filter(r => r.kind === 'textbook').map(r => [it.id, r]));
    ok(tbRefs.length > 0 && tbRefs.every(([, r]) => Number.isInteger(r.line) && (r.pdfPage == null ? r.page == null : (Number.isInteger(r.pdfPage) && r.pdfPage >= 8 && r.pdfPage <= 144 && r.page === r.pdfPage - 7))), '카드의 교재 인용 ' + tbRefs.length + '개: 교재 쪽 = PDF 쪽 − 7, PDF 8–144쪽 안(모르면 둘 다 비움)');
    const srcUniq = new Map(); refs.forEach(([, s]) => srcUniq.set(s.id, s));
    const pageHist = {}; for (const s of srcUniq.values()) if (s.pdfPage != null) pageHist[s.pdfPage] = (pageHist[s.pdfPage] || 0) + 1;
    const maxOnPage = Math.max(0, ...Object.values(pageHist)), srcPages = Object.keys(pageHist).map(Number);
    ok([...srcUniq.values()].every(s => s.pdfPage == null ? (s.bookPage == null && s.textbookLine == null) : (Number.isInteger(s.pdfPage) && s.pdfPage >= 8 && s.pdfPage <= 144 && s.bookPage === s.pdfPage - 7 && Number.isInteger(s.textbookLine))) && maxOnPage <= 40 && srcPages.length >= 15 && Math.min(...srcPages) < 30 && Math.max(...srcPages) > 120,
      '교재 확인 문제의 쪽: 증명된 것만(PDF 쪽 · 교재 쪽 · 문제 줄 함께, 아니면 모두 비움) · 한 쪽에 몰리지 않음(가장 많은 쪽 ' + maxOnPage + '문항 · 쪽 ' + srcPages.length + '개 · PDF ' + Math.min(...srcPages) + '–' + Math.max(...srcPages) + ')');
    const tbPagesOf = id => ((Q[id] || {}).overview || { refs: [] }).refs.filter(r => r.kind === 'textbook' && r.pdfPage).map(r => r.pdfPage);
    ok(srcOf('check-26-14').pdfPage !== 39 && (srcOf('check-26-14').pdfPage == null || (srcOf('check-26-14').pdfPage >= 85 && srcOf('check-26-14').pdfPage <= 104)) && !tbPagesOf('legacy-opening-026').includes(39) && !tbPagesOf('legacy-goryeo-087').includes(39) && (pageHist[39] || 0) <= 30,
      '얼어붙은 쪽(PDF 39) 회귀 없음: 조프통상조약(check-26-14)은 개화기 쪽 범위 · 농상집요·조프통상조약 카드의 교재 인용은 39쪽이 아님');
    ok(corrected.every(sid => [30, 50, 84, 92, 101].includes(srcOf(sid).correction.source_pdf_page)) && ['check-21-08', 'check-21-09', 'check-21-10', 'check-21-11'].every(sid => srcOf(sid).clarification.source_pdf_page === 72),
      '정정 18건의 정답표 PDF 쪽(30·50·84·92·101)과 문맥 보완 4건의 표 PDF 72쪽은 원래 증명 그대로(문제 쪽과 따로 표시)');
    const pg = qmap.pagination || {};
    const ANCH = [['[연가7년명 금동여래입상]', 18], ['[금동대향로]', 21], ['[기마인물형토기]', 24], ['[불국사 다보탑]', 33], ['[정혜공주 무덤의 돌사자상]', 36], ['[청자 어룡모양 주전자]', 54], ['[보은 법주사 팔상전]', 77], ['[김득신 파적도]', 79]];
    ok(pg.pdfPages === 144 && pg.formFeeds === 144 && J((pg.anchorsVerified || []).map(a => [a.text, a.pdfPage, a.bookPage])) === J(ANCH.map(([t, p]) => [t, p, p - 7])), '지도 기록: 쪽 나눔 \\f 144개 · 실제 PDF에서 확인한 그림 설명 8곳의 쪽(PDF 18·21·24·33·36·54·77·79)');
    // 교재 원문이 있으면(HANQ_CONFIRMATION_DIR) 생성기와 따로 \f를 세어 모든 인용 줄의 쪽을 다시 맞춘다
    const tbDir = process.env.HANQ_CONFIRMATION_DIR || '', tbPath = tbDir ? path.join(tbDir, 'hanq-full-textbook-original.txt') : '';
    if (tbPath && fs.existsSync(tbPath)) {
      const raw = fs.readFileSync(tbPath, 'utf8'), lines = raw.split('\n'), lp = []; let ffc = 0;
      for (const l of lines) { let k = ffc, first = null; for (const ch of l) { if (ch === '\f') k++; else if (first === null && !/\s/.test(ch)) first = k + 1; } lp.push(first === null ? k + 1 : first); ffc = k; }
      const cmp = s => s.replace(/\s+/g, '');
      ok(ffc === 144 && ANCH.every(([t, p]) => { const i = lines.findIndex(l => cmp(l).includes(cmp(t))); return i >= 0 && lp[i] === p; }), '교재 원문(따로 셈): \\f 144개 · 그림 설명 8곳이 실제 PDF 쪽에');
      const badRef = tbRefs.filter(([, r]) => r.pdfPage != null && lp[r.line - 1] !== r.pdfPage).map(([id, r]) => id + '@' + r.line);
      ok(!badRef.length, '교재 원문(따로 셈): 카드의 교재 인용 ' + tbRefs.length + '줄이 모두 실제 \\f 쪽과 같음' + (badRef.length ? ' (다름: ' + badRef.slice(0, 6).join(', ') + ')' : ''));
      const badSrc = [...srcUniq.values()].filter(s => s.pdfPage != null && !(lp[s.textbookLine - 1] === s.pdfPage && (s.number == null ? /^\s*\(\d{1,2}\)/.test(lines[s.textbookLine - 1].replace(/\f/g, '')) : new RegExp('^\\s*\\(' + s.number + '\\)').test(lines[s.textbookLine - 1].replace(/\f/g, ''))))).map(s => s.id);
      ok(!badSrc.length, '교재 원문(따로 셈): 쪽이 있는 확인 문제 ' + [...srcUniq.values()].filter(s => s.pdfPage != null).length + '개 모두 그 쪽의 ‘(번호) …’ 줄' + (badSrc.length ? ' (다름: ' + badSrc.slice(0, 6).join(', ') + ')' : ''));
      // 음성 대조: 머리글 ‘Ⅲ고려’처럼 붙은 꼴만 세던 예전 방식은 ‘Ⅲ 고려 시대’(띄어 씀)를 놓쳐 쪽이 얼어붙는다 — 원문에 띄어 쓴 머리글이 실제로 있음을 확인
      ok(lines.some((l, i) => /^\s*Ⅲ\s+고려 시대\s*$/.test(l.replace(/\f/g, '')) && lp[i] > 39), '음성 대조: 띄어 쓴 쪽 머리글(‘Ⅲ 고려 시대’)이 PDF 39쪽 뒤에 실제로 있음 — 머리글 세기 대신 \\f로 셈');
    }
    // 카드의 흐름(context)은 범위 이름만이 아니라 실제 시기·인물·사건 줄
    const rangeOnly = items.filter(it => ((it.overview || {}).context || []).every(l => /^범위: /.test(l))).map(it => it.id);
    ok(!rangeOnly.length && J(qmap.overviewContextRangeOnly || []) === J([]), '카드의 흐름 ' + items.length + '개: 범위 이름만 있는 카드 없음(흐름 카드 · 교재 줄 · 핵심 개념)' + (rangeOnly.length ? ' (범위만: ' + rangeOnly.length + ' · ' + rangeOnly.slice(0, 6).join(', ') + ')' : ''));
    const mapCtx = itemsOf('check-12-02').map(it => it.overview.context.join(' '));
    ok(mapCtx.length && mapCtx.every(c => /반무신[^‘’]*김보당/.test(c) && /농민[^‘’]*김사미/.test(c) && /천민[^‘’]*만적/.test(c) && /특수행정구역[^‘’]*망이/.test(c)), '짝짓기(check-12-02): 무신 집권기 봉기를 교재 표의 구분(반무신 김보당·조위총 · 농민 김사미·효심 · 천민 만적 · 특수행정구역 망이·망소이)으로 설명');
    ok(['legacy-joseon-late-059', 'legacy-opening-075', 'legacy-goryeo-024', 'legacy-goryeo-027', 'legacy-goryeo-034'].every(id => { const c = Q[id] && Q[id].options.find(o => o.correct); return c && c.review.length >= 2 && c.review.slice(1).some(l => /교재|흐름/.test(l)); }),
      '묶음 정답 다섯(삼사 · 장인환·전명운 · 김보당·조위총 · 망이·망소이 · 변발·호복): ‘모두 들어 있어야’ 한 줄이 아니라 교재·흐름 근거 줄');
    // 생성기 · 문서 · 앱 연결
    const qgen = rdr('scripts/build_quiz_catalog.py');
    ok(!/\/Users\//.test(qgen + rdr('media/quiz-review.js')) && !/\brandom\b|datetime|time\.time/.test(qgen) && /sys\.argv\[1\]/.test(qgen) && /HANQ_CONFIRMATION_DIR/.test(qgen) && /sys\.exit\(2\)/.test(qgen) && /사용법/.test(qgen), '카탈로그 생성기: 개인 경로·시간·난수 없음, 입력 폴더를 밝혀야 실행(없으면 종료 코드 2)');
    const qdocPath = path.join(ROOT, 'docs', 'quiz-catalog-sources.md'), qdoc = fs.existsSync(qdocPath) ? fs.readFileSync(qdocPath, 'utf8') : '';
    ok(qdoc.includes('d23689f9630e56792697a321c2fea43b621b4592e3d1baf0fd126c9b0eb6a83c') && qdoc.includes('35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442') && qdoc.includes('libfile_9821216813548191af7d24f8e62efb10') && /check-12-02/.test(qdoc) && /check-21-08/.test(qdoc) && /check-05-06/.test(qdoc) && !/\d+\s*%/.test(qdoc), '카탈로그 근거 문서: 원문 읽기본·교재 PDF SHA-256 · 라이브러리 ID · 정정·문맥 보완·묻는 것이 다른 쌍 기록');
    ok(['media/quiz-catalog.js','media/era-recall-quiz.js','media/era-recall-integration.js','media/era-culture.js','media/quiz-review.js'].every(function(f,i,a){return cur.html.indexOf(f)>=0&&(!i||cur.html.indexOf(a[i-1])<cur.html.indexOf(f));}) && cur.html.indexOf('media/quiz-catalog.js') < cur.html.indexOf('(function(){\n    var chapters='), 'index.html: 카탈로그·공용 풀이를 앱 스크립트보다 먼저 불러옴');
    console.log('  · 카탈로그 문항 ' + items.length + ' · 기존 ' + QC.counts.legacy + ' · 교재 ' + QC.counts.source + '(기존 문항에 붙음 ' + QC.counts.sourceAttachedToLegacy + ' · 교재만 ' + QC.counts.sourceOnly + ') · 풀 ' + QC.counts.pool + ' · 모양 ' + J(QC.counts.shapes));
  }
}

section('19. 실전 모의 확장: 실제 기출 500 · 예전 55 보존 · 시대별 풀 · 보기 다섯 풀이 · 그림');
{
  const rdr = f => legacyComic(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  const sha = b => require('crypto').createHash('sha256').update(b).digest('hex');
  const epath = path.join(ROOT, 'media', 'exam-pool.js');
  const EP = fs.existsSync(epath) ? (() => { const c = { window: {} }; vm.createContext(c); vm.runInContext(fs.readFileSync(epath, 'utf8'), c); return c.window.HANQ_EXAM_POOL; })() : null;
  ok(EP && EP.schema === 1 && EP.generatedBy === 'scripts/build_exam_pool.py' && EP.setSize === 20, 'media/exam-pool.js 있음(scripts/build_exam_pool.py가 생성 · 세트 20문항)');
  const mpath = path.join(ROOT, 'docs', 'exam-pool-map.json'), MAP = fs.existsSync(mpath) ? JSON.parse(fs.readFileSync(mpath, 'utf8')) : null;
  ok(!!MAP, 'docs/exam-pool-map.json 있음(생성기 기록)');
  if (EP) {
    const Q = EP.questions, ids = EP.order || [], items = ids.map(id => Q[id]).filter(Boolean);
    const ROUNDS = Array.from({ length: 10 }, (_, i) => 70 + i), CIRC = '①②③④⑤';
    // 500문항: 회차마다 1–50번, 안정 ID exam-RR-NN, 공식 정답 1–5 · 배점 1–3 · 회차 배점 합 100
    ok(ids.length === 500 && new Set(ids).size === 500 && J(Object.keys(Q).sort()) === J(ids.slice().sort()) && ids.every(id => /^exam-(7\d)-(\d\d)$/.test(id)) &&
      ROUNDS.every(r => J(ids.filter(id => id.startsWith('exam-' + r + '-')).map(id => +id.slice(-2)).sort((a, b) => a - b)) === J(Array.from({ length: 50 }, (_, i) => i + 1))),
      '실제 기출 500문항(제70–79회 × 50), ID 겹침 없음 · 회차마다 1–50번 모두');
    ok(items.every(q => q.id === 'exam-' + q.exam + '-' + String(q.number).padStart(2, '0') && Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= 5 && [1, 2, 3].includes(q.points)) &&
      ROUNDS.every(r => items.filter(q => q.exam === r).reduce((a, q) => a + q.points, 0) === 100), '문항마다 공식 정답 1–5 · 배점 1–3, 회차별 배점 합 100');
    // 보기 다섯: 원래 번호 그대로, 보기 ID exam-RR-NN-option-k, 정답 하나 = 공식 정답, 보기마다 풀이
    const obad = [];
    for (const q of items) {
      const o = q.options || [], why = m => obad.push(q.id + ' ' + m);
      if (o.length !== 5) { why('보기 수'); continue; }
      if (!o.every((x, i) => x.number === i + 1 && x.id === q.id + '-option-' + (i + 1) && x.text === CIRC[i])) why('보기 ID·번호');
      if (o.filter(x => x.correct).length !== 1 || !o[q.answer - 1].correct) why('정답 보기');
      if (!o.every(x => Array.isArray(x.review) && x.review.length >= 1 && x.review.every(l => typeof l === 'string' && l.trim().length >= 6 && l.length <= 400))) why('보기 풀이');
    }
    ok(!obad.length && items.reduce((a, q) => a + q.options.length, 0) === 2500, '보기 2500개: 원래 번호 ①–⑤ · 안정 보기 ID · 정답 하나 = 공식 정답 · 보기마다 풀이 줄' + (obad.length ? ' (문제: ' + obad.slice(0, 6).join(' / ') + ')' : ''));
    // 풀이 카드: 정답 · 왜 · 결정 단서 · 흐름 · 외울 말 · 헷갈림, 기출 원문 출처
    const cbad = [];
    for (const q of items) {
      const ov = q.overview || {}, why = m => cbad.push(q.id + ' ' + m);
      if (typeof ov.answer !== 'string' || !ov.answer.startsWith(CIRC[q.answer - 1])) why('정답 줄');
      for (const k of ['reason', 'clue', 'context', 'memory', 'contrast']) if (!Array.isArray(ov[k]) || !ov[k].length || !ov[k].every(l => typeof l === 'string' && l.trim())) why(k);
      if (!Array.isArray(ov.refs) || !ov.refs.some(r => r.kind === 'exam')) why('기출 출처');
      if (!q.v || !q.rv) why('버전');
      if (q.negative && !/(옳지 않은|적절하지 않은)/.test((ov.reason || []).join(' '))) why('옳지 않은 꼴 안내');
    }
    ok(!cbad.length, '풀이 카드 500장: 정답(원래 번호) · 왜 · 결정 단서 · 흐름 · 외울 말 · 헷갈림 · 기출 출처 · ‘옳지 않은/적절하지 않은’ 문항은 그 꼴을 밝힘' + (cbad.length ? ' (문제: ' + cbad.slice(0, 6).join(' / ') + ')' : ''));
    // 시대 분류: 실제 10회분에서 센 수(예측 아님) · 76-02는 고조선과 여러 나라 · 독도·간도는 관련 문항 10
    const WANT = { prehistory: 10, gojoseon: 12, samguk: 38, nambuk: 30, goryeo: 86, 'joseon-early': 44, 'joseon-late': 49, opening: 71, colonial: 86, modern: 56, comprehensive: 18 };
    const byEra = {}; items.forEach(q => { byEra[q.era] = (byEra[q.era] || 0) + 1; });
    ok(J(Object.keys(WANT).map(k => byEra[k] || 0)) === J(Object.values(WANT)) && Object.keys(byEra).every(k => k in WANT), '주 시대 수 ' + J(byEra) + ' (조선 전기+후기 ' + ((byEra['joseon-early'] || 0) + (byEra['joseon-late'] || 0)) + ')');
    ok(Q['exam-76-02'] && Q['exam-76-02'].era === 'gojoseon' && Q['exam-76-02'].classificationNote, '76-02는 고조선과 여러 나라로(분류 메모 보관)');
    const negIds = items.filter(q => q.negative).map(q => q.id);
    ok(negIds.length === 31 && negIds.includes('exam-76-26') && !negIds.includes('exam-76-24') && !negIds.includes('exam-76-29') && (!MAP || (J(MAP.negativeMarked) === J(negIds.slice().sort()) && (MAP.negativeCandidatesNotMarked || []).length === 0)), '‘옳지 않은/적절하지 않은’ 질문 31문항(띄어 쓴 76-26 포함, 지문 속 부정 표현일 뿐인 76-24·76-29 제외)');
    // 같은 사건을 근거 없는 화살표로 잇지 않음: 팔만대장경을 충주성 뒤에, 초조대장경을 귀주 대첩 뒤에, 지계아문을 양전 사업 시작과 한 화살표로 두지 않음
    const ctxAll = items.map(q => [q.id, (q.overview.context || []).join(' ')]);
    ok(!ctxAll.some(([, c]) => /충주[^→]*→\s*팔만대장경/.test(c) || /귀주 대첩\s*→\s*초조대장경/.test(c) || /원수부\s*→\s*양전/.test(c)), '흐름 줄: 몽골 항전(충주성→팔만대장경)·거란(귀주 대첩→초조대장경)·광무개혁(원수부→양전) 거짓 화살표 없음');
    const isl = (EP.eras.islands || {}).pool || [];
    ok(isl.length === 10 && J(isl.slice().sort()) === J(items.filter(q => (q.relatedEras || []).includes('islands')).map(q => q.id).sort()) && ['exam-71-24', 'exam-73-36', 'exam-74-41', 'exam-72-37', 'exam-70-37'].every(id => isl.includes(id)), '독도와 간도: 관련 지역·독립운동 문항 10(예전 5 + 71-24·73-36·74-41·72-37·70-37)');
    ok(!('comprehensive' in (cur.chapters.reduce((a, c) => (a[c.id] = 1, a), {}))) && ((EP.eras.comprehensive || {}).pool || []).length === 18, '통사·복합 18문항은 새 학습 시대 없이 범위 선택으로만');
    // 시대별 풀: 예전 기본 문항 먼저, 주 시대 + 관련 문항, 세트 = ⌈풀/20⌉
    ok(Object.entries(EP.eras).every(([era, E]) => E.pool.length === E.poolCount && new Set(E.pool).size === E.pool.length && E.sets === Math.ceil(E.pool.length / 20) && J(E.pool.slice(0, (E.legacy || []).length)) === J(E.legacy || []) &&
      (E.primary || []).every(id => E.pool.includes(id)) && (E.related || []).every(id => E.pool.includes(id)) && E.pool.every(id => Q[id])),
      '시대별 풀: 예전 기본 문항이 앞 · 주 시대와 관련 문항 모두 · 세트 수 = ⌈풀/20⌉ (' + Object.entries(EP.eras).map(([e, E]) => e + ' ' + E.poolCount).join(', ') + ')');
    // 예전 55문항: 데이터·그림은 그대로, 같은 ID로 이어 붙이고 예전 풀이를 함께
    const legacyIds = [];
    for (const [era, arr] of Object.entries(cur.mocks || {})) for (const m of arr) legacyIds.push(['exam-' + m.exam + '-' + String(m.number).padStart(2, '0'), era, m]);
    ok(legacyIds.length === 55 && legacyIds.every(([id, era, m]) => { const q = Q[id], L = q && q.legacy; return q && q.answer === m.answer && q.points === m.points && L && L.why === m.why && L.remember === m.remember && L.topic === m.topic && q.image === m.image && fs.existsSync(path.join(ROOT, m.image)) && ((EP.eras[era] || {}).legacy || []).includes(id); }),
      '예전 실전 모의 55문항: 같은 ID로 풀에 있고 정답·배점·예전 풀이·그림 경로 그대로, 그 시대의 기본 묶음');
    if (base && fs.existsSync(path.join(BASE, 'media', 'past-exam-quiz.js'))) {
      ok(rdr('media/past-exam-quiz.js') === fs.readFileSync(path.join(BASE, 'media', 'past-exam-quiz.js'), 'utf8'), '예전 기출 데이터 파일(media/past-exam-quiz.js)은 기준본과 바이트 단위로 같음');
      const bdir = path.join(BASE, 'media', 'exam'), bfiles = fs.existsSync(bdir) ? fs.readdirSync(bdir).sort() : [];
      ok(bfiles.length >= 55 && J(fs.readdirSync(path.join(ROOT, 'media', 'exam')).sort()) === J(bfiles) && bfiles.every(f => fs.readFileSync(path.join(bdir, f)).equals(fs.readFileSync(path.join(ROOT, 'media', 'exam', f)))), '예전 기출 그림(media/exam ' + bfiles.length + '개)은 기준본과 바이트 단위로 같음');
    }
    // 새 445문항 그림: media/exam-expanded/RR-NN.webp, 기록한 SHA-256과 같음
    const legacySet = new Set(legacyIds.map(x => x[0]));
    const ibad = items.filter(q => { const f = path.join(ROOT, q.image || ''); if (!fs.existsSync(f)) return true; if (legacySet.has(q.id)) return false; return q.image !== 'media/exam-expanded/' + q.id.slice(5) + '.webp' || sha(fs.readFileSync(f)) !== q.imageSha256; }).map(q => q.id);
    ok(!ibad.length && items.filter(q => !legacySet.has(q.id)).length === 445, '문항 그림 500개 모두 있음 · 새 445개는 media/exam-expanded에 원본 자른 그림 그대로(기록한 SHA-256과 같음), 예전 55개는 media/exam 그대로' + (ibad.length ? ' (문제: ' + ibad.slice(0, 6).join(', ') + ')' : ''));
    // 공통 자료: [47~48] 지문은 원본 PDF 12쪽에서 따로 자른 그림 하나를 72-47·72-48에만 붙임(문항 그림·ID·정답·배점은 그대로)
    const CM_SHA = '777d3364c99fa96f84093ab2438587cdf3f4f3bdd0bdcdb4b2b0ee0f7eb04446', CM_PATH = 'media/exam-expanded/72-common47-48.webp';
    const withCommon = items.filter(q => q.commonImage).map(q => q.id);
    const cmOk = id => { const q = Q[id] || {}, s = q.source || {}, c = s.commonMaterial || {}; return q.commonImage === CM_PATH && q.commonImageSha256 === CM_SHA && fs.existsSync(path.join(ROOT, CM_PATH)) && sha(fs.readFileSync(path.join(ROOT, CM_PATH))) === CM_SHA &&
      c.id === 'exam-72-common47-48' && c.sha256 === CM_SHA && c.page === 12 && c.page === s.page && c.sourceSha256 === s.sha256 && c.sourceFile === s.file && J(c.cropPoints) === J([35, 65, 363.252, 448]) && J(c.pixelCrop) === J([70, 130, 657, 766]) &&
      J(c.questionIDs) === J(['exam-72-47', 'exam-72-48']) && J(q.commonQuestionIDs) === J(c.questionIDs) && /47~48/.test(q.commonLabel || '') && !q.sourceGap && (q.legacy ? q.image === q.legacy.image : q.image === 'media/exam-expanded/' + id.slice(5) + '.webp'); };
    ok(J(withCommon) === J(['exam-72-47', 'exam-72-48']) && withCommon.every(cmOk), '공통 자료(72회 [47~48]): 72-47·72-48 두 문항에만 · 원본 PDF 12쪽·같은 원본 SHA·자른 영역·그림 SHA-256 기록 · 자료 빠짐 안내 없음 · 문항 그림은 그대로');
    const expFiles = fs.existsSync(path.join(ROOT, 'media', 'exam-expanded')) ? fs.readdirSync(path.join(ROOT, 'media', 'exam-expanded')).filter(f => /\.webp$/.test(f)) : [];
    ok(expFiles.length === 446 && expFiles.includes('72-common47-48.webp') && expFiles.filter(f => /common/.test(f)).length === 1, 'media/exam-expanded: 새 문항 그림 445 + 공통 자료 1 = 446개');
    if (MAP) {
      ok(Array.isArray(MAP.unsourcedYears) && MAP.unsourcedYears.length === 0, '풀이에 쓴 연도는 모두 원문·교재·강의·흐름 카드에 있음(근거 없는 연도 0)' + (MAP.unsourcedYears && MAP.unsourcedYears.length ? ' (' + J(MAP.unsourcedYears.slice(0, 6)) + ')' : ''));
      ok(J(MAP.imageSourceGaps || {}) === J({}) && (MAP.commonMaterials || []).length === 1 && MAP.commonMaterials[0].sha256 === CM_SHA && MAP.commonMaterials[0].path === CM_PATH && MAP.inputs && MAP.inputs['hanq-exam-common-material-manifest.json'], '지도 기록: 그림 공백 없음 · 공통 자료 1개(경로·SHA·쪽·자른 영역)와 목록 해시');
    }
    // 생성기 · 문서 · 앱 연결
    const gen = rdr('scripts/build_exam_pool.py');
    ok(!/\/Users\//.test(gen) && !/\brandom\b|datetime|time\.time/.test(gen) && /sys\.exit\(2\)/.test(gen) && /HANQ_EXAM_SOURCE_DIR/.test(gen), '기출 풀 생성기: 개인 경로·시간·난수 없음, 입력 폴더를 밝혀야 실행(없으면 종료 코드 2)');
    ok(ROUNDS.every(r => fs.existsSync(path.join(ROOT, 'docs', 'exam-reviews', 'round-' + r + '.json'))), '풀이 원고 docs/exam-reviews/round-70…79.json 10개');
    const dpath = path.join(ROOT, 'docs', 'exam-pool-sources.md'), ddoc = fs.existsSync(dpath) ? fs.readFileSync(dpath, 'utf8') : '';
    ok(/500/.test(ddoc) && /예측이 아니/.test(ddoc) && /72-47/.test(ddoc) && !/\d+\s*%/.test(ddoc), '기출 풀 근거 문서: 수 · 예측 아님 · 그림 공백 기록, 비율 주장 없음');
    ok(/<script src="media\/exam-pool\.js"><\/script>/.test(cur.html) && cur.html.indexOf('media/exam-pool.js') < cur.html.indexOf('(function(){\n    var chapters='), 'index.html: 기출 풀을 앱 스크립트보다 먼저 불러옴');
    console.log('  · 기출 ' + items.length + ' · 예전 ' + legacyIds.length + ' · 새 그림 ' + items.filter(q => !legacySet.has(q.id)).length + ' · 옳지 않은 꼴 표시 ' + items.filter(q => q.negative).length);
  }
}

if (fs.existsSync(path.join(ROOT, 'media', 'colonial-summary.js'))) {
  section('3-c. 일제 강점기 요약 시기 뼈대(배치표가 원래 자료를 빠짐·중복 없이 가리킴)');
  const cx = { window: {} }; vm.createContext(cx);
  for (const f of ['study-notes.js', 'textbook-notes.js', 'colonial-summary.js']) vm.runInContext(legacyComic(fs.readFileSync(path.join(ROOT, 'media', f), 'utf8')), cx);
  const M = cx.window.HANQ_COLONIAL_SUMMARY, T = cx.window.HANQ_TEXTBOOK.colonial, S = cx.window.HANQ_STUDY.colonial, C = cur.chapters.find(c => c.id === 'colonial');
  const where = {}, put = (ref, place) => { (where[ref] = where[ref] || []).push(place); };
  (M.backboneRefs || []).forEach(e => put(e.ref, 'backbone'));
  M.periods.forEach(p => { p.flow.forEach(r => put(typeof r === 'string' ? r : r.ref, p.id)); if (p.boundary) p.boundary.items.forEach(e => e.ref && put(e.ref, p.id + ':boundary')); ['rule', 'econ', 'move'].forEach(k => (p[k] || []).forEach(e => e.ref && put(e.ref, p.id + ':' + k))); });
  M.cross.forEach(x => x.items.forEach(e => e.ref && put(e.ref, x.id)));
  const want = [].concat(C.note.flatMap((cd, i) => cd.items.map((_, j) => 'card:' + i + ':' + j)), T.core.flatMap((g, i) => g.rows.map((_, j) => 'tb:' + i + ':' + j)), S.flow.map((_, i) => 'st:' + i));
  ok(want.length === 45 + 55 + 8 && want.every(r => (where[r] || []).length === 1) && Object.keys(where).every(r => want.includes(r)), '원래 카드 45문장·교재 55행·흐름 8줄이 모두 정확히 한 곳에(빠짐·중복·없는 곳 가리킴 없음)');
  ok(J(M.backbone.map(b => b.year)) === J(['1910', '1919', '1931', '1937', '1945']) && J(M.periods.map(p => p.range)) === J(['1910–1919', '1919–1930', '1931–1936', '1937–1945']) && M.periods.every(p => p.rule && p.econ && p.move), '뼈대 1910 → 1919 → 1931 → 1937 → 1945 · 네 시기 · 시기마다 통치 → 경제 수탈 → 독립운동');
  const at = r => (where[r] || [])[0] || '';
  ok(at('tb:0:7') === 'cs-p4:rule' && /1938/.test(M.periods[3].rule.find(e => e.ref === 'tb:0:7').tag) && at('card:2:0').startsWith('cs-p4') && /1938/.test(M.periods[3].econ.find(e => e.ref === 'card:2:0').tag), '국가 총동원법은 1938로 ④에(1937 중일 전쟁과 다른 해로 표시)');
  ok(['tb:5:5', 'tb:5:6', 'tb:5:7', 'card:8:0', 'card:8:1', 'tb:3:2', 'card:5:2', 'tb:3:5'].every(r => at(r) === 'cs-p3:move') && ['tb:5:8', 'tb:5:9', 'card:8:2', 'card:8:3'].every(r => at(r) === 'cs-p4:move'), '1930년대 초 무장 투쟁·노동·농촌 계몽은 ③(1931–1936), 조선의용대·한국광복군은 ④ — 1930년대를 모두 1937 뒤로 몰지 않음');
  ok(['tb:6:4', 'tb:6:5', 'card:9:1', 'card:9:0', 'card:9:2'].every(r => at(r) === 'cs-x3') && /1920년대/.test(M.cross.find(x => x.id === 'cs-x3').range), '말·역사·종교는 여러 시기에 걸친 칸(1920년대부터)에, 일제 말로만 몰지 않음');
  ok(at('card:1:0') === 'cs-p2:boundary' && at('tb:1:1') === 'cs-p2:boundary' && at('card:6:3') === 'cs-p1:move' && at('card:0:0') === 'cs-p1:rule', '1919 경계: 배경(2·8 선언)은 ① 끝, 3·1 운동·임시정부 수립은 ②의 경계 칸');
  const tags = [].concat(...M.periods.map(p => [].concat(p.rule, p.econ, p.move, p.boundary ? p.boundary.items : []))).concat(...M.cross.map(x => x.items)).filter(e => e.ref);
  ok(tags.every(e => typeof e.tag === 'string' && e.tag.length > 0), '배치된 항목마다 시기 표시(해·연대·범위)가 있음');
  // 맨 위 요약: 네 시기마다 통치·경제 수탈·독립운동 한 줄 · ③④는 같은 ‘민족 말살 통치’ 아래
  ok(M.periods.every(p => p.brief && ['rule', 'econ', 'move'].every(k => typeof p.brief[k] === 'string' && p.brief[k].length > 4 && p.brief[k].length < 80)) && J(M.periods.map(p => p.category)) === J(['무단 통치', '이른바 문화 통치', '민족 말살 통치', '민족 말살 통치']) && !('backboneRefs' in M && M.backboneRefs.length),
    '맨 위는 기준점 다섯 + 시기 넷 짧은 요약(통치·경제 수탈·독립운동) · ③1931–1936과 ④1937–1945는 같은 민족 말살 통치 · 긴 원래 문장은 아래로');
  // ‘더 정확히’ 설명: 원래 문장은 그대로 두고 확인한 사실을 붙임
  const noteOf = r => { for (const p of M.periods) for (const e of [].concat(p.rule, p.econ, p.move, p.boundary ? p.boundary.items : [], p.flow.filter(x => typeof x !== 'string'))) if (e.ref === r) return e.note; for (const x of M.cross) for (const e of x.items) if (e.ref === r) return e.note; return null; };
  const NT = M.notes || {};
  ok(noteOf('tb:5:0') === 'uiyeol' && noteOf('card:7:0') === 'uiyeol' && /1919/.test(NT.uiyeol.text) && /1920년대/.test(NT.uiyeol.text), '의열단: 1919 창립 · 1920년대 활동으로 나눠 설명');
  ok(noteOf('card:7:3') === 'gando' && noteOf('tb:5:4') === 'gando' && noteOf('st:5') === 'gando' && /1920년 10월에 이미 시작/.test(NT.gando.text) && !/10월 중순/.test(NT.gando.text) && /21~26일/.test(NT.gando.text) && /겹쳤/.test(NT.gando.text) && /시험용으로 줄인 순서/.test(NT.gando.text) && NT.gando.fn.some(i => /경신참변/.test(M.footnotes[i])), '청산리·간도 참변: 봉청간자미는 시험용 순서 · 간도 참변은 1920년 10월에 이미 시작되어 청산리 전투와 겹침(경신참변 근거)');
  ok(/PDF 106–122쪽\(책 99–115쪽/.test(M.footnotes[0]) && J(M.oldFoldNotes) === J(['minrip', 'gando', 'doksa', 'manse', 'changssi', 'jingyong']) && M.oldFoldNotes.every(k => NT[k]), '교재 쪽은 PDF 106–122쪽(책 99–115쪽)으로 · 접힌 원래 정리에 함께 볼 설명 6개(민립·간도·독사신론·만세보·창씨개명·징용)');
  ok(noteOf('card:4:1') === 'minrip' && /탄압/.test(NT.minrip.text) && /모금의 어려움/.test(NT.minrip.text) && /1924/.test(NT.minrip.text), '민립대학: 탄압·모금의 어려움 + 1924 경성제국대학');
  ok(noteOf('card:9:0') === 'doksa' && /1908/.test(NT.doksa.text) && noteOf('card:9:2') === 'manse' && /1906/.test(NT.manse.text) && /대한제국/.test(M.cross.find(x => x.id === 'cs-x3').range), '독사신론(1908)·만세보(1906)는 국권 피탈 전 · 문화 칸 범위가 대한제국 시기부터');
  ok(noteOf('card:2:1') === 'changssi' && /1939/.test(NT.changssi.text) && /1940/.test(NT.changssi.text) && /1939 법령·1940 시행/.test(M.periods[3].rule.find(e => e.ref === 'card:2:1').tag), '창씨개명: 1939 법령 · 1940 시행(1937로 한데 묶지 않음)');
  ok(noteOf('card:2:2') === 'jingyong' && /1939/.test(NT.jingyong.text) && /1942/.test(NT.jingyong.text) && /1944/.test(NT.jingyong.text) && /위안부/.test(NT.jingyong.text) && /다른/.test(NT.jingyong.text), '징용: 1939 국민징용령(제한 시행) → 1942 관 알선 → 1944 일반 징용 · 여자 정신 근로령(노동 동원)과 일본군 위안부(성폭력 피해)는 다름');
  ok(/1936/.test(M.guide) && /1938/.test(M.guide) && /대륙 병참 기지화/.test(M.guide) && /1932/.test(M.periods[2].brief.econ) && /1938/.test(M.periods[3].brief.econ), '경계는 읽기 길잡이: 동화 정책 1936 무렵 · 대륙 병참 기지화 공식 1938 · ③ 공업화 준비와 구분');
  const visible = J({ b: M.backbone, g: M.guide, p: M.periods, x: M.cross, n: M.notes, pn: M.pairNotes });
  ok(!/\(강의\)|근거가 없|원래 자료에 (따로 )?없|이 앱의|구현/.test(visible), '화면에 보이는 글에 구현 사정(“(강의)”, “근거가 없으면”, “원래 자료에 없어요”)을 넣지 않음 — 근거는 각주·문서로');
  ok(Object.keys(NT).every(k => NT[k].fn.every(i => Number.isInteger(i) && i >= 0 && i < M.footnotes.length)) && M.footnotes.length >= 10, '설명마다 참고 자료 번호가 실제 각주를 가리킴');
}

section('4. 동작 검사 (jsdom)');
let JSDOM = null;
try { JSDOM = require(process.env.JSDOM_PATH || 'jsdom').JSDOM; } catch (e) { console.log('  (jsdom 없음 — JSDOM_PATH를 지정하면 실행)'); }
async function dom() {
  const { VirtualConsole } = require(process.env.JSDOM_PATH || 'jsdom');
  const errs = [];
  const { ResourceLoader } = require(process.env.JSDOM_PATH || 'jsdom');
  class FileLoader extends ResourceLoader { fetch(url, opts) { const u = new URL(url); if (u.hostname !== 'hanq.test') return null; const f = path.join(ROOT, decodeURIComponent(u.pathname)); if (!/\.js$/.test(f)) return null; return Promise.resolve(fs.readFileSync(f)); } }
  // jsdom에는 Web Locks(navigator.locks)가 없다: 한 창 안에서 같은 이름의 요청을 차례로 실행하는 최소 LockManager를 넣는다.
  // 앱의 잠금 창구(HanqRun.createSerialized)는 그대로이고 플랫폼 API만 대신한다. 실제 여러 탭 경쟁은 조정자가 실제 Chrome에서 본다.
  function jsdomLockManager() { const tails = {}, log = []; return { log, request(name, o, cb) { if (typeof o === 'function') cb = o; const prev = tails[name] || Promise.resolve(); const p = prev.then(() => { log.push(name); return cb({ name, mode: 'exclusive' }); }); tails[name] = p.then(() => {}, () => {}); return p; } }; }
  // opts.seed: 새로 고침·다시 열기 흉내(앞 창의 localStorage를 그대로 옮겨 담음) · opts.pre(w): 스크립트보다 먼저 창을 바꿈(저장소 막기 등) · opts.noLocks: Web Locks 없는 브라우저
  // 배포본 index.html은 서버 주소(meta hanq-api-base)가 채워져 있다. 이 검사기의 동작 검사는 이 기기만 쓰는 학습·오답노트·회차 동작을
  // 보는 것이므로, 의도된 오프라인 모드(meta를 비운 상태)로 연다(opts.keepApi면 원본 그대로). 서버 연결 쪽은 scripts/test-account-ui.cjs가 본다.
  async function open(file, hash, opts) {
    const vc = new VirtualConsole(); vc.on('jsdomError', e => errs.push(file + ': ' + e.message)); vc.on('error', e => errs.push(file + ': ' + e));
    const url = 'https://hanq.test/' + file + (hash || '');
    let src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    if (file === 'index.html' && !(opts && opts.keepApi)) src = src.replace(/<meta name="hanq-api-base" content="[^"]*">/, '<meta name="hanq-api-base" content="">');
    const d = new JSDOM(src, { url, runScripts: 'dangerously', resources: new FileLoader(), pretendToBeVisual: true, virtualConsole: vc,
      beforeParse(w) { w.scrollTo = () => {}; w.HTMLElement.prototype.scrollIntoView = function () {};
        if (!(opts && opts.noLocks) && !w.navigator.locks) Object.defineProperty(w.navigator, 'locks', { value: jsdomLockManager(), configurable: true });
        if (opts && opts.seed) for (const [k, v] of Object.entries(opts.seed)) w.localStorage.setItem(k, v);
        if (opts && opts.pre) opts.pre(w); } });
    await new Promise(r => d.window.addEventListener('load', r));
    await new Promise(r => setTimeout(r, 0)); // 시작 때 잠금 창구로 부른 일(마감 채점·회차 열기)이 끝나도록
    return d;
  }
  // 목차
  let d = await open('index.html', '#past-exams');
  let w = d.window, doc = w.document;
  const cards = [...doc.querySelectorAll('.period')].map(b => b.querySelector('strong').textContent);
  ok(cards.filter(t => /^조선/.test(t)).length === 1 && cards.includes('조선시대'), '목차 카드 “조선시대” 하나 (' + cards.join(',') + ')');
  // 옛 경로: 조선 전기 빈칸
  d = await open('index.html', '#chapter/joseon-early/quiz'); w = d.window; doc = w.document;
  ok(doc.querySelector('.module-head h1').textContent === '조선시대', '옛 경로 #chapter/joseon-early/quiz → 조선시대');
  ok(!doc.querySelector('input[name="chapterPart"]'), '옛 퀴즈 경로도 단일 시대 퀴즈');
  const joseonQuizCount=w.HANQ_UNIFIED_QUIZ_SELECTION.eras.joseon.length;ok(doc.querySelectorAll('#quizJump option').length === joseonQuizCount+1, '통합 조선 실제문항 + 완료 칸');
  // 빈칸은 객관식: 입력 대신 보기 라디오 그룹. 예전 ‘입력 → 확인’ 검사는 ‘보기 고르기(임시) → 확인(채점)’으로 옮겨 그대로 본다
  const QC0 = w.HANQ_QUIZ_CATALOG || { questions: {} };
  ok(doc.querySelector('#quiz .qchoices[role="radiogroup"]') && !doc.querySelector('#quizAnswer') && doc.querySelectorAll('#quiz .qchoice[role="radio"]').length >= 2, '빈칸은 객관식(보기 라디오 그룹), 입력창 없음');
  const qid0 = doc.querySelector('#quiz .question').getAttribute('data-question'), firstQ = doc.querySelector('.qtext').textContent;
  const wrong0 = ((QC0.questions[qid0] || { options: [] }).options.find(o => !o.correct) || {}).id;
  doc.querySelector('#quiz .qchoice[data-option="' + wrong0 + '"]').click();
  ok(!doc.querySelector('#quizFeedback').className.includes('show') && doc.querySelectorAll('#quiz .qchoice[aria-checked="true"]').length === 1 && !doc.querySelector('#quiz .qexp:not([hidden])') && !doc.querySelector('#quiz .qchoice-row.is-correct'), '보기를 고르기만 하면 채점하지 않음 · 고른 보기 하나만 표시 · 정답·풀이는 아직 숨김');
  doc.querySelector('#checkAnswer').click();
  ok(doc.querySelector('#quizFeedback').className.includes('show'), '답 확인 동작');
  ok(doc.querySelectorAll('#quiz .qexp:not([hidden])').length === 0 && doc.querySelectorAll('#quizFeedback .qb-option.is-selected').length === 1 && doc.querySelector('#quiz .qchoice-row.is-wrong').getAttribute('data-option') === wrong0 && doc.querySelectorAll('#quiz .qchoice-row.is-correct').length === 1,
    '오답 채점 뒤 선택 오답의 짧은 실제 개념 표시 · 고른 오답 × · 정답 ✓ 하나');
  ok(doc.querySelector('#checkAnswer').disabled && doc.querySelector('#quiz .qchoice[data-option="' + wrong0 + '"]').getAttribute('aria-checked') === 'true', '같은 보기를 두 번 채점하지 않음 · 틀려도 고른 답을 지우지 않음');
  const chosenIs = id => (doc.querySelector('#quiz .qchoice[aria-checked="true"]') || { getAttribute: () => '' }).getAttribute('data-option') === id;
  ok(!doc.querySelector('#quizSet,#quizLearningMaterial') && doc.querySelector('.quiz-panel h2').textContent==='퀴즈 '+joseonQuizCount+'문제', '조선 단일퀴즈 실제문항·종류 선택 제거');
  const jump=doc.querySelector('#quizJump');for(const n of [joseonQuizCount-1,Math.floor(joseonQuizCount/2),0,0]){jump.value=String(n);jump.dispatchEvent(new w.Event('change'));ok(doc.querySelector('#quizPosition').textContent===(n+1)+' / '+joseonQuizCount,'첫끝중간반복 이동 '+n);}
  ok(chosenIs(wrong0)&&doc.querySelector('#quizFeedback').className.includes('show'),'왕복해도 답안·채점 보존');
  // 용어 풀이가 답을 말하지 않는지 — 모든 장 모든 문제
  let leak = 0, glq = 0;
  for (const c of cur.chapters.filter(c => !c.parts)) {
    const dd = await open('index.html', '#chapter/' + c.id + '/quiz'); const dw = dd.window, ddoc = dw.document;
    const n = ddoc.querySelectorAll('#quizJump option').length - 1;
    for (let i = 0; i < n; i++) {
      const j = ddoc.querySelector('#quizJump'); j.value = String(i); j.dispatchEvent(new dw.Event('change'));
      const notes = ddoc.querySelector('#quiz .gl-notes'); if (!notes) continue; glq++;
      const pos = ddoc.querySelector('#quizPosition').textContent;

      // 카탈로그 문항의 받는 답(기존 별칭 + 교재 정답 표기)까지 모두 대조: 채점 전 용어 풀이가 어떤 정답 별칭도 말하지 않아야 한다
      const qcItem = (dw.HANQ_QUIZ_CATALOG || { questions: {} }).questions[ddoc.querySelector('#quiz .question').getAttribute('data-question')] || { a: [] };
      const item=qcItem;ok(qcItem.id&&dw.HANQ_UNIFIED_QUIZ_SELECTION.eras[c.id.startsWith('joseon')?'joseon':c.id].includes(qcItem.id),'선별된 기존 문항 '+c.id+' '+i);
      const nt = notes.textContent.replace(/[^가-힣A-Za-z0-9]/g, '');
      for (const a of item.a.concat(qcItem.a)) for (const t of String(a).split(/[^가-힣A-Za-z0-9]+/).map(x => x.replace(/왕$/, '')).filter(x => x.length >= 2)) if (nt.includes(t)) { leak++; console.log('    leak', c.id, pos, t); }
      ok(!ddoc.querySelector('#quiz .qchoices').closest('.gl-notes') && !notes.querySelector('input,button') && !ddoc.querySelector('#quiz .qchoices .gl-notes, #quiz .qchoices .gl-item'), '풀이는 보기 밖·버튼 없음 · 보기 글에는 용어 풀이를 달지 않음');
    }
    dd.window.close();
  }
  ok(leak === 0, '빈칸 용어 풀이에 답 노출 없음 (풀이 달린 문제 ' + glq + '개)');
  // 스토리에 보존된 요약 노트: 전체 14카드, 용어 풀이, 토글
  d = await open('index.html', '#chapter/joseon/webtoon'); w = d.window; doc = w.document;
  ok(doc.querySelectorAll('.summary-panel .note-card').length === 14, '통합 요약 카드 14개');
  ok(doc.querySelectorAll('.summary-panel .study-block').length >= 6, '학습 노트(흐름·짝·떠올리기) 표시');
  const items = [...doc.querySelectorAll('.gl-item')];
  ok(items.length > 0, '요약에 용어 풀이 ' + items.length + '개');
  const terms = items.map(x => x.dataset.term);
  ok(new Set(terms).size === terms.length, '요약 안 같은 용어는 처음 한 번만');
  const gids = [...doc.querySelectorAll('[id]')].map(x => x.id); ok(new Set(gids).size === gids.length, '요약 화면 id 중복 없음');
  const it = items[0], sm = it.querySelector('summary');
  sm.click(); ok(it.open, '용어 풀이 펼침(클릭/탭)'); sm.click(); ok(!it.open, '다시 누르면 닫힘'); sm.click();
  sm.focus(); doc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  const esc = it.querySelector('summary'); esc.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  ok(!it.open, 'Escape로 닫힘');
  ok(items.every(x => x.querySelector('.gl-src a[href^="https://"],.gl-src a[href^="http://encykorea"]')), '모든 풀이에 출처 링크');
  ok(!doc.querySelector('.note-card li .gl-notes, .red .gl-notes'), '본문 문장 안에는 끼워 넣지 않음');
  { const sd = await open('index.html', '#chapter/samguk/webtoon'); const st = [...sd.window.document.querySelectorAll('.gl-item')].map(x => x.dataset.term);
    ok(st.includes('yullyeong') && st.includes('taehak'), '삼국 요약에 율령·태학 풀이 (' + st.join(',') + ')'); sd.window.close(); }
  const dk = items.find(x => x.dataset.term === 'daedong'); ok(dk && /공납/.test(dk.textContent), '대동법 풀이가 요약에 등장');
  const lateOnly = doc.querySelector('input[name="chapterPart"][value="joseon-late"]'); lateOnly.checked = true; lateOnly.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(doc.querySelectorAll('.summary-panel .note-card').length === 9, '후기 범위 요약 카드 9개');
  // 실전 모의 5+5
  d = await open('index.html', '#chapter/joseon/mock'); w = d.window; doc = w.document;
  ok(doc.querySelector('.mock-panel h2').textContent.includes('10문제') && doc.querySelector('#mockPosition').textContent === '1 / 10', '통합 기출 10문제');
  doc.querySelector('.mock-choice[data-choice="2"]').click(); doc.querySelector('#checkMock').click();
  const mr = doc.querySelector('input[name="chapterPart"][value="joseon-early"]'); mr.checked = true; mr.dispatchEvent(new w.Event('change', { bubbles: true }));
  ok(doc.querySelector('#mockPosition').textContent === '1 / 5' && doc.querySelector('.mock-feedback'), '기출 범위 전환 후에도 확인 결과 유지');
  // 실전 모의 확장: 범위(이 시대 · 통사·복합 · 전체) · 묶음(기본 · 20문항 세트 · 전체) · 바로 가기 · 채점 전 풀이 숨김 · 크게 보기 대화 상자
  if (w.HANQ_EXAM_POOL && w.HANQ_EXAM_POOL.order && w.HANQ_EXAM_POOL.order.length === 500) {
    const EPd = w.HANQ_EXAM_POOL;
    const md = await open('index.html', '#chapter/goryeo/mock'); const mw = md.window, mdoc = mw.document;
    const sel = (id, v) => { const s = mdoc.querySelector(id); s.value = v; s.dispatchEvent(new mw.Event('change', { bubbles: true })); };
    const gp = EPd.eras.goryeo.pool.length;
    ok(J([...mdoc.querySelectorAll('#mockScope option')].map(o => o.value)) === J(['era', 'comprehensive', 'all']) && mdoc.querySelector('#mockPosition').textContent === '1 / 5', '고려 실전 모의: 범위 셋(이 시대 · 통사·복합 · 전체), 기본 묶음은 예전 5문항');
    ok(J([...mdoc.querySelectorAll('#mockSet option')].map(o => o.value)) === J(['core'].concat(Array.from({ length: Math.ceil(gp / 20) }, (_, i) => String(i + 1)), ['all'])) && /예측이 아니/.test((mdoc.querySelector('#mockPool') || {}).textContent || ''), '고려 묶음: 기본 · 세트 ' + Math.ceil(gp / 20) + '개 · 전체 ' + gp + ' · 실제 출제 수(예측 아님) 안내');
    const q0 = mdoc.querySelector('.mock-question').getAttribute('data-question');
    mdoc.querySelector('.mock-choice[data-choice="1"]').click();
    ok(!mdoc.querySelector('.mock-feedback') && !mdoc.querySelector('.mock-review') && mdoc.querySelectorAll('.mock-choice[aria-checked="true"]').length === 1 && !mdoc.querySelector('#checkMock').disabled, '보기를 고르기만 하면 채점하지 않음 · 풀이 카드 숨김 · 고른 보기 하나');
    ok(mdoc.querySelectorAll('.mock-choice').length === 5 && [...mdoc.querySelectorAll('.mock-choice')].every((b, i) => b.getAttribute('data-option') === q0 + '-option-' + (i + 1) && b.getAttribute('role') === 'radio'), '보기 버튼 다섯은 원래 번호 순서 · 보기 ID(exam-RR-NN-option-k) · 라디오');
    mdoc.querySelector('#checkMock').click();
    const rv = mdoc.querySelector('.mock-review');
    ok(mdoc.querySelector('.mock-feedback') && rv && rv.querySelector('.qb-core ul') && rv.querySelectorAll('.qb-option').length===5 && mdoc.querySelectorAll('.mock-choice[disabled]').length === 5, '채점 뒤에만: 정답/선택 오답 핵심 · 관련 개념은 접힘 · 다시 채점하지 않음');
    const en = mdoc.querySelector('.mock-enlarge'); en.focus(); en.click();
    const zb = mdoc.querySelector('.mock-zoom[role="dialog"][aria-modal="true"]');
    ok(zb && mdoc.activeElement === zb.querySelector('.mock-zoom-close') && zb.querySelector('img'), '문제 크게 보기: 대화 상자(role=dialog)가 열리고 닫기 버튼에 초점');
    zb.dispatchEvent(new mw.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    ok(!mdoc.querySelector('.mock-zoom') && mdoc.activeElement === mdoc.querySelector('.mock-enlarge'), 'Escape로 닫히고 초점은 크게 보기 버튼으로 돌아옴');
    sel('#mockSet', '1');
    ok(mdoc.querySelector('#mockPosition').textContent === '1 / ' + Math.min(20, gp), '세트 1: 20문항 묶음');
    sel('#mockJump', '3');
    ok(mdoc.querySelector('#mockPosition').textContent === '4 / ' + Math.min(20, gp), '바로 가기 4번(문제를 고르기만 하고 채점하지 않음)');
    sel('#mockScope', 'all');
    ok(mdoc.querySelectorAll('#mockSet option').length === 26 && mdoc.querySelector('#mockPosition').textContent === '1 / 20', '전체 범위: 세트 25개(마지막 세트도 20문항) + 전체');
    sel('#mockSet', '25');
    ok(mdoc.querySelector('#mockPosition').textContent === '1 / 20' && mdoc.querySelector('.mock-question').getAttribute('data-question') === EPd.order[480], '전체 세트 25: 481–500번');
    // 공통 자료 문항(72-47·48): 문항 그림보다 먼저 공통 자료 전체, 크게 보기에는 두 그림 모두, 채점 전 정답·풀이 없음
    for (const cid of ['exam-72-47', 'exam-72-48']) {
      const ix = EPd.order.indexOf(cid);
      sel('#mockSet', String(Math.floor(ix / 20) + 1)); sel('#mockJump', String(ix % 20));
      const art = mdoc.querySelector('.mock-question'), imgs = [...art.querySelectorAll('img.mock-image')];
      ok(art.getAttribute('data-question') === cid && imgs.length === 2 && imgs[0].classList.contains('mock-common-image') && imgs[0].getAttribute('src') === EPd.questions[cid].commonImage && /공통 자료/.test(imgs[0].getAttribute('alt')) && /47~48/.test(imgs[0].getAttribute('alt')) && imgs[1].getAttribute('src') === EPd.questions[cid].image && !art.querySelector('.mock-gap') && /공통 자료/.test(art.querySelector('.mock-common figcaption').textContent),
        cid + ': 공통 자료 [47~48] 전체 그림(대체 글 있음)이 문항 그림 앞에 · 자료 빠짐 안내 없음');
      const st = (mw.HanqMock.state(cid) || {}).checked;
      art.querySelector('.mock-enlarge').click();
      const zb2 = mdoc.querySelector('.mock-zoom'), zi = zb2 ? [...zb2.querySelectorAll('img')] : [];
      ok(zb2 && zi.length === 2 && zi[0].getAttribute('src') === EPd.questions[cid].commonImage && zi[1].getAttribute('src') === EPd.questions[cid].image && !zb2.querySelector('.qcard, .mock-review, .qreview') && !/정답/.test(zb2.textContent) && zb2.getAttribute('aria-label') === '공통 자료와 문제 크게 보기',
        cid + ': 크게 보기에 공통 자료와 문항 그림 둘 다 · 정답·풀이 없음');
      zb2.dispatchEvent(new mw.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      ok(!mdoc.querySelector('.mock-zoom') && mdoc.activeElement === mdoc.querySelector('.mock-enlarge') && (mw.HanqMock.state(cid) || {}).checked === st, cid + ': 닫으면 크게 보기 버튼으로 초점 · 채점 상태 그대로');
    }
    sel('#mockScope', 'comprehensive');
    ok(mdoc.querySelector('#mockPosition').textContent === '1 / 18', '통사·복합 범위 18문항');
    ok(mw.HanqMock && mw.HanqMock.state(q0) && mw.HanqMock.state(q0).checked, '범위·묶음을 바꿔도 채점 기록은 그대로(저장은 하지 않음)');
    // 대화 상자가 열린 채 주소가 바뀌거나 홈으로 가면 닫히고, 새 화면에 초점
    mdoc.querySelector('.mock-enlarge').click();
    ok(!!mdoc.querySelector('.mock-zoom'), '크게 보기 다시 열림');
    mw.location.hash = '#chapter/goryeo/quiz'; await new Promise(r => setTimeout(r, 60));
    ok(!mdoc.querySelector('.mock-zoom') && !mdoc.body.classList.contains('mock-zoom-open') && mdoc.querySelector('.quiz-panel') && mdoc.activeElement && mdoc.activeElement.matches('.module-head h1'), '주소(해시)가 바뀌면 크게 보기가 닫히고 새 화면 제목에 초점');
    mdoc.querySelector('.steps .step[data-step="3"]').click();
    mdoc.querySelector('.mock-enlarge').click();
    mdoc.querySelector('#homeBrand').click();
    ok(!mdoc.querySelector('.mock-zoom') && !mdoc.body.classList.contains('mock-zoom-open') && mdoc.querySelector('#homePastExams') && mdoc.activeElement === mdoc.querySelector('#homeBrand'), '홈으로 가면 크게 보기가 닫히고 홈 버튼에 초점');
    md.window.close();
  } else ok(false, '실전 모의 확장 동작 검사: media/exam-pool.js(500문항)가 앱에 실려야 함');
  // 웹툰: 경로별 iframe 주소
  d = await open('index.html', '#chapter/joseon-late/webtoon'); doc = d.window.document;
  ok(doc.querySelector('.watch').getAttribute('src') === 'media/joseon-all-comic.html#late-part', '후기 웹툰 경로 → 통합 웹툰 2부');
  // 웹툰 페이지
  for (const name of [...COMICS, 'joseon-all']) {
    const cd = await open('media/' + name + '-comic.html'); const cdoc = cd.window.document;
    const sc = [...cdoc.querySelectorAll('.scene')];
    const nums = sc.map(x => (x.querySelector('[data-scene-count]') || {}).textContent);
    ok(nums.every((t, i) => t && t.startsWith(String(i + 1).padStart(2, '0'))), name + ': 번호 = DOM 순서');
    ok(cdoc.documentElement.getAttribute('data-scene-total') === String(sc.length), name + ': 전체 장면 수 ' + sc.length);
    if (/^joseon/.test(name)) ok(sc.every(x => { const im = x.querySelector('.art.panel-img > img'); return im && im.getAttribute('width') && im.getAttribute('height'); }), name + ': DOM 장면마다 크기 지정된 칸 그림');
    const gl = [...cdoc.querySelectorAll('.gl-item')].map(x => x.dataset.term);
    ok(new Set(gl).size === gl.length, name + ': 같은 용어 풀이는 처음 한 번만 (' + gl.length + '개)');
    ok(!cdoc.querySelector('.bubble .gl-notes, .dialogue .gl-notes, a .gl-notes, .art .gl-notes'), name + ': 말풍선·그림·링크 안에 풀이 없음');
    const cids = [...cdoc.querySelectorAll('[id]')].map(x => x.id); ok(new Set(cids).size === cids.length, name + ': id 중복 없음');
    cd.window.close();
  }
  // ---- 6. 교재 요약 화면 동작 ----
  for (const era of APP_ERAS) {
    const sd = await open('index.html', '#chapter/' + era + '/webtoon'); const sw = sd.window, sdoc = sw.document;
    const part = sdoc.querySelector('.summary-part');
    const lec = LEC.notes[era];
    const order = [...part.children].map(c => (c.className.match(/tier-(core|target|support|optional)/) || c.className.match(/era-backbone|era-details|summary-story|o-parts|tb-supplement|study-(flow|core|compare|recall)|source-notes|note-img|part-title/) || [''])[0]).filter(x => x && x !== 'part-title' && x !== 'note-img');
    if (lec) {
      const want = ['era-backbone','era-details'].concat(lec.parts?['summary-story']:[],['study-compare','tb-supplement','source-notes']);
      ok(J(order) === J(want), era + ': 큰 구간 → 시기별 상세 → 비교 → 떠올리기 → 접힌 원래 개념 → 단서 노트 (' + order.join('>') + ')');
      const lb = [...sdoc.querySelectorAll('.lecture-group .core-row strong.tb, .summary-part > .study-compare .cmp-row strong.tb')].map(x => x.textContent.replace(/\s*\([^)]*\)\s*$/, '').replace(/\s/g, ''));
      const lset = new Set((LEC.terms[era] || []).map(t => t.replace(/\s/g, '')));
      ok(lb.length > 0 && lb.every(b => lset.has(b)), era + ': 굵은 말 ' + lb.length + '개 모두 강의 핵심어(먼저 기억·1급 보충 모듈)');
      const tbb = [...sdoc.querySelectorAll('.tb-supplement .core-row strong.tb')].map(x => x.textContent.replace(/\s*\([^)]*\)\s*$/, '').replace(/^참고\s*/, '').replace(/\s/g, ''));
      const allowed = new Set((TB.terms[era] || []).map(t => t.replace(/\s/g, '')));
      ok(tbb.length > 0 && tbb.every(b => allowed.has(b)), era + ': 접힌 교재 정리의 굵은 용어 ' + tbb.length + '개는 교재 굵은 글꼴 기준 그대로');
      ok(!sdoc.querySelector('.tb-supplement').open && sdoc.querySelector('.tb-supplement').querySelectorAll('.core-group').length === TB.notes[era].core.length, era + ': 교재 정리는 접힌 채 원래 묶음 ' + TB.notes[era].core.length + '개 보존');
      ok([...sdoc.querySelectorAll('.lecture-group.tier-optional, .lecture-group.tier-optional_highlight')].every(g => !g.open), era + ': 선택 심화 묶음은 접힌 채 시작');
      ok(!sdoc.querySelector('.lecture-guide') && sdoc.querySelector('.summary-guide') && [...sdoc.querySelectorAll('.era-backbone,.era-details')].every(x => !/자주 나|빈출|반드시 나|매번 나|출제 확률/.test(x.textContent)), era + ': 반복 편집 안내 없이 시대 요약·상세에 출제 빈도 표현 없음(기존 원문 보존)');
    } else if (era === 'colonial' && sw.HANQ_COLONIAL_SUMMARY) {
      // 일제 강점기만 시기 뼈대 요약(docs/colonial-summary-map.md): 한눈에(기준점 다섯·시기 넷) → 시기별 자세히 넷 → 여러 시기 → 비교 → 떠올리기 → 접힌 원래 정리 → 참고 자료 → 단서 노트
      const corder = [...part.children].map(c => (c.className.match(/cs-backbone|cs-detail-h|cs-period|cs-cross|study-compare|study-recall|tb-supplement|cs-footnotes|source-notes/) || [''])[0]).filter(Boolean);
      ok(J(corder) === J(['cs-backbone', 'cs-detail-h', 'cs-period', 'cs-period', 'cs-period', 'cs-period', 'cs-cross', 'study-compare', 'tb-supplement', 'cs-footnotes', 'source-notes']), era + ': 한눈에 → 시기별 자세히 넷 → 여러 시기 → 비교 → 떠올리기 → 접힌 원래 정리 → 참고 자료 → 단서 노트 (' + corder.join('>') + ')');
      ok(sdoc.querySelectorAll('.cs-backbone .cs-mile li').length === 5 && sdoc.querySelectorAll('.cs-backbone .cs-brief').length === 4, era + ': 맨 위 기준점 다섯 · 시기 넷');
      const bold = [...sdoc.querySelectorAll('.core-row strong.tb, .cs-term strong.tb')].map(x => x.textContent.replace(/\s*\([^)]*\)\s*$/, '').replace(/^참고\s*/, '').replace(/\s/g, ''));
      const allowed = new Set((TB.terms[era] || []).map(t => t.replace(/\s/g, '')));
      ok(bold.length > 0 && bold.every(b => allowed.has(b)), era + ': 굵은 용어 ' + bold.length + '개 모두 교재 굵은 글꼴 확인(시기별 자세히·접힌 원래 정리)');
      const sup = sdoc.querySelector('.summary-part > .tb-supplement');
      ok(!sdoc.querySelector('.lecture-group') && !sdoc.querySelector('.lecture-guide') && sup && !sup.open && sup.querySelectorAll('.core-group').length === TB.notes[era].core.length, era + ': 강의 구성 없음 · 원래 교재 묶음 ' + TB.notes[era].core.length + '개는 접힌 원래 정리에 그대로');
    } else {
      ok(J(order) === J(['era-backbone', 'era-details', 'study-compare', 'source-notes']), era + ': 큰 구간 → 시기별 상세 → 비교 → 떠올리기 → 단서 노트 순서 (' + order.join('>') + ')');
      const bold = [...sdoc.querySelectorAll('.core-row strong.tb')].map(x => x.textContent.replace(/\s*\([^)]*\)\s*$/, '').replace(/^참고\s*/, '').replace(/\s/g, ''));
      const allowed = new Set((TB.terms[era] || []).map(t => t.replace(/\s/g, '')));
      ok(bold.length > 0 && bold.every(b => allowed.has(b)), era + ': 굵은 용어 ' + bold.length + '개 모두 교재 굵은 글꼴 확인');
      ok(!sdoc.querySelector('.lecture-group') && !sdoc.querySelector('.lecture-guide') && !sdoc.querySelector('.tb-supplement'), era + ': 강의 구성 없음(교재 구성 그대로)');
    }
    const terms = [...sdoc.querySelectorAll('.summary-panel [data-term]')].map(x => x.dataset.term);
    ok(new Set(terms).size === terms.length, era + ': 같은 용어 풀이는 화면에 한 번 (' + terms.length + ')');
    const ids = [...sdoc.querySelectorAll('[id]')].map(x => x.id); ok(new Set(ids).size === ids.length, era + ': id 중복 없음');
    // 일제 강점기의 참고 자료 각주(.cs-footnotes)만 교재 PDF 쪽을 밝힐 수 있다(출처를 정확히 대려면 필요) — 그 밖의 화면 글에는 여전히 쪽 표시 없음
    const panelText = (() => { const cl = sdoc.querySelector('.summary-panel').cloneNode(true); if (era === 'colonial') cl.querySelectorAll('.cs-footnotes').forEach(x => x.remove()); return cl.textContent; })();
    ok(!panelText.match(/PDF\s?\d|교재 \d+쪽/), era + ': 화면에 교재 쪽 표시 없음(근거는 문서에' + (era === 'colonial' ? ' · 일제 강점기는 참고 자료 각주에만' : '') + ')');
    if (era === 'colonial' && sdoc.querySelector('.cs-footnotes')) ok(/PDF 106–122쪽\(책 99–115쪽/.test(sdoc.querySelector('.cs-footnotes').textContent) && !/\/Users\/|\.txt|docs\//.test(sdoc.querySelector('.cs-footnotes').textContent), era + ': 각주는 교재 PDF·책 쪽을 함께 밝히고 내부 파일 경로는 없음');
    const g = sdoc.querySelector('.core-group:not([open])') || sdoc.querySelector('.core-group'); const sm = g.querySelector('summary'); const was = g.open;
    ok(sm === g.firstElementChild && sm.tagName === 'SUMMARY', era + ': 묶음은 기본 details/summary(키보드 Enter·Space)');
    sm.click(); ok(g.open !== was, era + ': 묶음 펼침'); sm.click(); ok(g.open === was, era + ': 다시 누르면 원래대로');
    const gi = sdoc.querySelector('.gl-inline');
    if (gi) { const s2 = gi.querySelector('summary'); s2.click(); ok(gi.open, era + ': 행 안 용어 풀이 펼침'); s2.dispatchEvent(new sw.KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); ok(!gi.open, era + ': Escape로 닫힘'); ok(gi.querySelector('.gl-src a[href^="https://"]'), era + ': 행 안 풀이에 출처 링크'); }
    sw.close();
  }
  { // 조선 범위
    const jd = await open('index.html', '#chapter/joseon/webtoon'); const jw = jd.window, jdoc = jw.document;
    const nE = LEC.notes['joseon-early'].groups.length, nL = LEC.notes['joseon-late'].groups.length, tE = TB.notes['joseon-early'].core.length, tL = TB.notes['joseon-late'].core.length;
    const LG = '.lecture-group', TG = '.tb-supplement .core-group';
    ok(jdoc.querySelectorAll(LG).length === nE + nL && jdoc.querySelectorAll(TG).length === tE + tL, '조선 전체: 강의 묶음 ' + (nE + nL) + '개 + 접힌 교재 묶음 ' + (tE + tL) + '개');
    const sh = jdoc.querySelector('.lecture-group.sahwa');
    ok(sh && sh.open, '사화 묶음은 펼친 상태로 보임');
    const rowsT = [...sh.querySelectorAll('.core-row')].map(r => ({ dt: r.querySelector('dt').textContent, y: r.querySelector('.sh-year').textContent, k: r.querySelector('.sh-king').textContent, c: r.querySelector('.sh-cause').textContent }));
    ok(J(rowsT.map(r => [r.dt, r.y, r.k])) === J([['무오사화', '1498', '연산군'], ['갑자사화', '1504', '연산군'], ['기묘사화', '1519', '중종'], ['을사사화', '1545', '명종']]), '사화 4개: 연도·왕이 같은 행 안');
    ok(!/중종\s*→\s*명종/.test(jdoc.querySelector('.summary-panel').textContent), '화면에 “중종 → 명종” 없음');
    const mn = jw.HANQ_ERA_RECALL_QUIZ.questions['z-joseon-recall-04']; ok(jdoc.querySelectorAll('#lessonNotes .recall,#lessonNotes .study-recall').length===0 && mn && /중종 → 인종 → 명종/.test(mn.sources[0].a), '조선 본문 중복 복습 제거 · 퀴즈 원문 답에 인종 포함 계승 보존');
    const ep = (() => { const r = jdoc.querySelector('input[name="chapterPart"][value="joseon-early"]'); r.checked = true; r.dispatchEvent(new jw.Event('change', { bubbles: true })); return [...jdoc.querySelectorAll('.lecture-group .core-title')].map(x => x.textContent); })();
    ok(ep.findIndex(t => t.startsWith('선조')) > ep.findIndex(t => t.startsWith('사화')) && ep.findIndex(t => t.startsWith('인조')) > ep.findIndex(t => t.startsWith('광해군')), '화면(전기): 사화 → 선조 → 광해군 → 인조 순서');
    const dl = jdoc.querySelector('.lecture-group.dated'); ok(dl && dl.open && [...dl.querySelectorAll('.core-row')].map(r => r.querySelector('.sh-year').textContent + r.querySelector('.sh-king').textContent).join(',') === '1623인조,1627인조,1636인조', '화면(전기·강의): 인조반정·정묘·병자 연도·왕 행');
    const dg = jdoc.querySelector('.tb-supplement .core-group.dated'); ok(dg && dg.open && [...dg.querySelectorAll('.core-row')].map(r => r.querySelector('.sh-year').textContent + r.querySelector('.sh-king').textContent).join(',') === '1592선조,1623인조,1627인조,1636인조', '화면(전기·교재 정리): 전쟁과 반정 연도·왕 행');
    { const r = jdoc.querySelector('input[name="chapterPart"][value="all"]'); r.checked = true; r.dispatchEvent(new jw.Event('change', { bubbles: true })); }
    const pick = v => { const r = jdoc.querySelector('input[name="chapterPart"][value="' + v + '"]'); r.checked = true; r.dispatchEvent(new jw.Event('change', { bubbles: true })); };
    pick('joseon-early'); ok(jdoc.querySelectorAll(LG).length === nE && jdoc.querySelectorAll(TG).length === tE && jdoc.querySelector('.lecture-group.sahwa') && jw.location.hash === '#chapter/joseon-early/webtoon', '전기 범위: 전기 묶음 ' + nE + '개만·옛 주소');
    pick('joseon-late'); ok(jdoc.querySelectorAll(LG).length === nL && jdoc.querySelectorAll(TG).length === tL && !jdoc.querySelector('.core-group.sahwa') && jw.location.hash === '#chapter/joseon-late/webtoon', '후기 범위: 후기 묶음 ' + nL + '개만·옛 주소');
    const tl = [...jdoc.querySelectorAll('.summary-panel [data-term]')].map(x => x.dataset.term); ok(new Set(tl).size === tl.length, '범위를 바꿔도 용어 풀이 중복 없음');
    pick('all'); ok(jdoc.querySelectorAll(LG).length === nE + nL && jdoc.querySelectorAll(TG).length === tE + tL, '전체로 돌아오면 다시 모두');
    jw.close();
    const od = await open('index.html', '#chapter/joseon-late/webtoon'); ok(od.window.document.querySelectorAll(LG).length === nL && od.window.document.querySelector('.lecture-group').querySelector('.core-title').textContent.startsWith('효종'), '옛 경로 #chapter/joseon-late/webtoon → 후기 강의 묶음(효종부터)'); od.window.close();
  }
  // ---- 7. 강의 구성 화면 ----
  for (const era of ['goryeo', 'joseon']) {
    const ld = await open('index.html', '#chapter/' + era + '/webtoon'); const lw = ld.window, ldoc = lw.document;
    const badges = [...ldoc.querySelectorAll('.lecture-group .tier-badge')].map(x => x.textContent);
    ok(badges.length && badges.every(b => ['먼저 기억', '1급 보충', '흐름 보충', '선택 심화', '선택 심화 · 그중 먼저'].includes(b)), era + ': 묶음 배지는 먼저 기억·1급 보충·흐름 보충·선택 심화만');
    const sup = ldoc.querySelector('.tb-supplement > summary'); sup.click(); ok(ldoc.querySelector('.tb-supplement').open, era + ': 교재 정리 펼침'); sup.click(); ok(!ldoc.querySelector('.tb-supplement').open, era + ': 다시 닫힘');
    const og = ldoc.querySelector('.lecture-group.tier-optional, .lecture-group.tier-optional_highlight'); if (og) { og.querySelector('summary').click(); ok(og.open, era + ': 선택 심화 펼침'); }
    const tl = [...ldoc.querySelectorAll('.summary-panel [data-term]')].map(x => x.dataset.term); ok(new Set(tl).size === tl.length, era + ': 강의 구성에서도 용어 풀이 중복 없음 (' + tl.length + ')');
    ok(lw.location.hash === '#chapter/' + era + '/webtoon', era + ': 펼치기·닫기로 주소 바뀌지 않음');
    lw.close();
  }
  { // 개화기 요약: 105인 사건(1911)은 보이는 행이 아니라 접힌 ‘다음 시대’ 떠올리기에만, 전봉준은 먼저 기억 행
    const od = await open('index.html', '#chapter/opening/webtoon'); const odoc = od.window.document;
    const initOpen = [...odoc.querySelectorAll('.summary-part details[open]')].map(x => x.className); // 아래에서 펼쳐 보기 전, 처음 상태
    ok(![...odoc.querySelectorAll('.lecture-group .core-row, .summary-part > .study-flow, .summary-part > .study-compare')].some(r => /105인|1911/.test(r.textContent)), '개화기 요약 화면: 묶음 행·흐름·비교에 105인/1911 없음');
    // 강의 구성의 떠올리기(.summary-part 바로 아래)와 접힌 교재 정리(.tb-supplement) 안의 기존 떠올리기를 나눠 본다. 교재 쪽은 기준본 그대로 보존 대상.
    const has105 = x => /105인/.test(x.textContent);
    const lecRecall = [...odoc.querySelectorAll('.summary-part > .study-recall details.recall')], rc = lecRecall.filter(has105), rs = rc[0] && rc[0].querySelector('summary');
    ok(lecRecall.length===0 && Object.values(od.window.HANQ_ERA_RECALL_QUIZ.questions).some(q=>q.chapter==='colonial'&&q.answer==='105인 사건'), '개화기 본문 중복 복습 제거');
    const sup = odoc.querySelector('.summary-part > details.tb-supplement'), other = [...odoc.querySelectorAll('.study-recall details')].filter(x => has105(x) && !rc.includes(x));
    ok(other.every(x => sup && sup.contains(x) && !x.open) && sup && !sup.open, '개화기 요약 화면: 그 밖의 105인 떠올리기(' + other.length + '개)는 모두 접힌 교재 정리(.tb-supplement) 안에 닫힌 채 보존');
    if (rs) { rs.click(); ok(rc[0].open && /1911/.test(rc[0].textContent), '개화기 요약 화면: 다음 시대 떠올리기 펼침'); }
    ok([...odoc.querySelectorAll('.lecture-group.tier-core .core-row')].some(r => /전봉준/.test(r.textContent) && /지도자/.test(r.textContent)), '개화기 요약 화면: 먼저 기억 행에 동학 농민군 지도자 전봉준');
    // 세 부분 이야기: 첫 화면에 펼친 채, 자세한 묶음·짝·교재 정리는 처음엔 모두 닫힘
    const op = odoc.querySelector('.summary-story > .o-parts'), cards = op ? [...op.querySelectorAll('.o-part-card')] : [];
    ok(op && !op.closest('.summary-story').open && odoc.querySelector('.summary-part > .study-block').classList.contains('era-backbone') && !odoc.querySelector('.summary-part > .study-flow'), '개화기 요약 화면: 큰 구간이 맨 위 · 기존 세 부분 이야기는 접힌 상세에 보존');
    ok(cards.length === 3 && J(cards.map(c => c.querySelectorAll('li.o-chunk').length)) === J([4, 5, 5]) && J(cards.map(c => c.querySelector('.o-part-h').textContent.replace(/\d{4}–\d{4}$/, ''))) === J(['①나라를 바로잡자', '②나라를 개혁하자', '③나라를 지키자']), '개화기 요약 화면: ① 나라를 바로잡자 4 · ② 나라를 개혁하자 5 · ③ 나라를 지키자 5 덩어리');
    const lis = cards.flatMap(c => [...c.querySelectorAll('li.o-chunk')]);
    ok(lis.every(li => { const ps = li.querySelectorAll('.o-chunk-story > p').length, ks = li.querySelectorAll('.o-key').length, kids = [...li.children].map(x => x.className);
      return !!li.closest('.summary-story') && ps >= 2 && ps <= 4 && ks >= 1 && ks <= 3 && li.querySelector('.o-chunk-w').textContent.trim() && li.querySelector('.o-chunk-story strong.o-em') && kids[0] === 'o-chunk-head' && kids[1] === 'o-chunk-story' && kids[kids.length - 1] === 'o-keys'; }), '개화기 요약 화면: 덩어리마다 사건·왕/시기 → 2–4문장 이야기(접힌 상세에 보존, 용어 굵게) → 마지막에 암기 키워드 1–3개');
    const mm = op && op.querySelector('.o-memo');
    ok(mm && !!mm.closest('.summary-story') && /병제병오신척/.test(mm.textContent) && /시간 순서/.test(mm.textContent) && /병인박해 → 프랑스/.test(mm.textContent), '개화기 요약 화면: 병제병오신척(시간 순서)과 실제 구실을 보존된 이야기 본문에');
    ok(initOpen.length === 0 && odoc.querySelectorAll('.summary-part details').length >= 20, '개화기 요약 화면: 자세한 묶음·헷갈리는 짝·떠올리기·교재 정리는 처음엔 모두 닫힘' + (initOpen.length ? ' (열림: ' + initOpen.join(',') + ')' : ''));
    const jb = op ? [...op.querySelectorAll('button.o-parts-jump')] : [];
    ok(jb.length === 3 && jb.every(b => cards.includes(odoc.getElementById(b.dataset.jump))) && /\.o-parts-jump\{min-height:44px/.test(cur.html), '개화기 요약 화면: 세 부분 바로 가기 버튼 3개(키보드로 누를 수 있는 button · 44px)');
    if (jb[2]) { jb[2].click(); ok(od.window.location.hash === '#chapter/opening/webtoon' && odoc.activeElement === cards[2], '개화기 요약 화면: ③ 바로 가기를 눌러도 주소는 그대로, 초점이 ③으로'); }
    const cmp = odoc.querySelector('.summary-part > details.study-compare');
    if (cmp) { cmp.querySelector('summary').click(); }
    ok(cmp && cmp.open && /병인양요 vs 신미양요/.test(cmp.textContent) && /구실은 박해 → 프랑스, 셔먼호 → 미국/.test(cmp.textContent), '개화기 요약 화면: 헷갈리는 짝은 접혀 있다가 펼치면 보임(양요 순서 = 시간 순서, 구실 구분)');
    const g13 = [...odoc.querySelectorAll('.lecture-group')].find(g => (g.dataset.mod || '').split(' ').includes('O13'));
    if (g13) g13.querySelector('summary').click();
    ok(g13 && g13.open && /황제 직속 최고 군사 기구/.test(g13.textContent) && /황국 중앙 총상회/.test(g13.textContent) && /황국협회와 다름/.test(g13.textContent), '개화기 요약 화면: 대한제국 묶음을 펼치면 원수부(최고 군사 기구) · 황국 중앙 총상회(황국협회와 다름)');
    od.window.close();
  }
  { // 개화기 웹툰: 세 부분 · 22컷 모두 펼친 채 · 흐름이 끊기는 곳마다 ‘이 부분에서 외울 것’ · 바로 링크
    const PJ = (LEC.notes.opening || {}).parts || { list: [] };
    const cd = await open('media/opening-comic.html'); const c0 = cd.window.document;
    const secs = [...c0.querySelectorAll('section.o-psec')], scAll = [...c0.querySelectorAll('.scene')];
    ok(secs.length === 3 && scAll.length === 22 && scAll.every(s => !s.closest('details')) && [...c0.querySelectorAll('details:not(.culture-gallery)')].every(d => !d.open && (d.classList.contains('scene-more') || d.classList.contains('gl-item') || !!d.closest('aside[class$="-mem"]'))) && !c0.querySelector('.o-chunks, .o-part-detail, .o-more'),
      '개화기 웹툰: 세 부분, 22컷 모두 펼친 채(접힌 것은 장면 안 보충·용어 풀이뿐), 만화 앞에 몰아 둔 덩어리 목록 없음');
    ok(J(secs.map(s => s.querySelectorAll('.scene').length)) === J([4, 13, 5]) && J(secs.map(s => s.querySelector('.o-part').id)) === J(['part-fix', 'part-reform', 'part-defend']), '개화기 웹툰: ① 4컷 · ② 13컷(근대 문물 주제별 포함) · ③ 5컷');
    const mems = [...c0.querySelectorAll('aside.o-mem')];
    const wantT = PJ.list.flatMap(p => p.chunks.map(k => k.t).concat(p.id === 'part-reform' ? ['근대 문물 (주제별)'] : []));
    ok(mems.length === 3 && J(mems.flatMap(m => [...m.querySelectorAll('.o-mem-k .o-chunk-t')].map(x => x.textContent))) === J(wantT), '개화기 웹툰: 외울 것 카드가 덩어리 순서대로 모두(14 + 근대 문물)');
    ok(mems.every(m => { const prev = m.previousElementSibling; return prev && prev.classList.contains('scene') && m.id === 'mem-' + prev.id && !m.closest('details') && /이 부분에서 외울 것/.test(m.querySelector('.o-mem-label').textContent) &&
      [...m.querySelectorAll('.o-mem-k')].every(k => { const ps = k.querySelectorAll('.o-chunk-story > p').length; return ps >= 1 && ps <= 4 && k.querySelectorAll('.o-key').length >= 1; }); }), '개화기 웹툰: 카드는 덩어리의 마지막 컷 바로 뒤(펼친 채), 이어지는 이야기 → 키워드');
    ok(secs.every(s => { const sc = [...s.querySelectorAll('.scene')], last = sc[sc.length - 1]; return last.nextElementSibling && last.nextElementSibling.classList.contains('o-mem'); }) && !c0.querySelector('.o-psec > .o-part + .o-mem'), '개화기 웹툰: 부분마다 마지막 컷 뒤에 카드, 컷보다 앞에 오는 요약 카드는 없음');
    const yo = mems.find(m => /양요와 척화비/.test(m.textContent));
    ok(yo && /병제병오신척/.test(yo.textContent) && /시간 순서/.test(yo.textContent) && /병인박해 → 프랑스/.test(yo.textContent) && /제너럴셔먼호 사건 → 미국/.test(yo.textContent) && yo.previousElementSibling.id === 'scene-3', '개화기 웹툰: 양요 카드(신미양요 컷 뒤)에 병제병오신척 = 시간 순서, 구실은 박해 → 프랑스 · 셔먼호 → 미국');
    const xs = PJ.list.flatMap(p => p.chunks).filter(k => k.x).length;
    ok(xs >= 10 && c0.querySelectorAll('.o-mem .o-mem-x').length === xs, '개화기 웹툰: 카드마다 ‘헷갈리지 않기’ 한 줄(' + xs + ')');
    cd.window.close();
    for (const hash of ['#scene-7', '#part-4', '#part-1', '#modern-culture', '#mem-scene-10', '#part-fix-detail', '#part-reform-detail', '#part-defend-detail']) {
      const dd = await open('media/opening-comic.html', hash); const d2 = dd.window.document;
      ok(d2.getElementById(hash.slice(1)) && [...d2.querySelectorAll('details:not(.culture-gallery)')].every(x => !x.open), '개화기 웹툰 바로 링크 ' + hash + ': 대상이 있고, 펼쳐야 할 부모 없이 바로 보임');
      if (/-detail$/.test(hash)) { let el = d2.getElementById(hash.slice(1)); while (el && el.classList.contains('legacy-anchor')) el = el.nextElementSibling;
        const part = hash.slice(1, -'-detail'.length);
        ok(el && el.classList.contains('scene') && el.closest('section.o-psec').querySelector('.o-part').id === part && el === el.closest('section.o-psec').querySelector('.scene'), '예전 앵커 ' + hash + ' → 같은 부분(' + part + ')의 첫 장면'); }
      dd.window.close();
    }
    // 한 페이지 학습(개화기만): 탭 셋, 웹툰 칸 높이 맞춤, 옛 요약 주소는 같은 페이지의 요약 노트로
    const ix = await open('index.html', '#chapter/opening/webtoon'); const iw = ix.window, idoc = iw.document;
    const fr = idoc.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...idoc.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && idoc.querySelector('.steps .step.current').dataset.step === '0' && /학습/.test(idoc.querySelector('.steps .step.current').textContent), '개화기: 탭은 학습(0)·빈칸(2)·실전 모의(3) 셋, 단계 번호 그대로');
    ok(fr && fr.getAttribute('src') === 'media/opening-comic.html' && fr.getAttribute('loading') !== 'lazy' && fr.getAttribute('scrolling') === 'no', '개화기 학습: 웹툰을 바로 싣고, 칸 안쪽 스크롤 없음');
    ok(J([...idoc.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['part-fix', 'part-reform', 'part-defend']) && /\.lesson-jump\{[^}]*min-height:44px/.test(cur.html), '개화기 학습: 세 부분 바로 가기 버튼 3개(44px)');
    const ln = idoc.querySelector('#lessonNotes');
    ok(ln && ln.tagName === 'DETAILS' && !ln.open && ln.querySelector('.summary-panel .summary-part .o-parts') && ln.querySelector('.tb-supplement') && ln.querySelectorAll('.note-card').length === cur.chapters.find(c => c.id === 'opening').note.length, '개화기 학습: 요약 노트 전체(세 부분 이야기·강의 묶음·교재 정리·원래 카드)는 웹툰 아래 접힌 ‘더 보기’로 보존');
    iw.dispatchEvent(new iw.MessageEvent('message', { data: { type: 'hanq:height', h: 5432 }, source: fr.contentWindow }));
    iw.dispatchEvent(new iw.MessageEvent('message', { data: { type: 'hanq:height', h: 999999 }, source: fr.contentWindow }));
    iw.dispatchEvent(new iw.MessageEvent('message', { data: { type: 'hanq:height', h: 7777 }, source: iw }));
    ok(fr.style.height === '5432px', '개화기 학습: 웹툰이 알린 높이로 칸이 늘어남(엉뚱한 값·다른 창의 신호는 무시)');
    iw.dispatchEvent(new iw.MessageEvent('message', { data: { type: 'hanq:height', h: 3100 }, source: fr.contentWindow }));
    ok(fr.style.height === '3100px', '개화기 학습: 보충을 닫아 웹툰이 짧아지면 칸도 줄어듦');
    idoc.querySelector('.steps .step[data-step="2"]').click();
    ok(iw.location.hash === '#chapter/opening/quiz' && idoc.querySelector('.quiz-panel') && idoc.querySelector('.steps .step.current').dataset.step === '2', '개화기 학습 → 빈칸 탭: #chapter/opening/quiz(단계 번호 2)');
    iw.close();
    const is = await open('index.html', '#chapter/opening/summary'); const isd = is.window.document;
    ok(is.window.location.hash === '#chapter/opening/summary' && isd.querySelector('.step[aria-current=step]').dataset.step === '1' && isd.querySelector('#eraFullSummary') && !isd.querySelector('iframe'), 'opening: 요약 주소는 독립된 03 전체요약으로');
    is.window.close();
    // 모든 시대가 한 페이지 학습이 되어 ‘원래 네 탭’으로 남은 시대가 없다: 목차의 모든 시대가 탭 셋
    for (const c of cur.chapters.filter(c => c.active && !c.hidden && !c.partOf)) {
      const gw = await open('index.html', '#chapter/' + c.id + '/webtoon'); const gd = gw.window.document;
      ok(J([...gd.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(c.id==='islands'?['0','5','2','3']:['0','5','1','2','3']) && gd.querySelector('.lesson-frame'), c.id + ': 학습·빈칸·기출 탭 셋(복습은 별도 메뉴) · 한 페이지 학습');
      gw.window.close();
    }
  }
  { // 조선시대 한 페이지 학습: 탭 셋, 다섯 흐름 바로 가기, 범위(전체·전기·후기)·옛 주소 그대로, 웹툰은 모든 컷 펼친 채
    const jw = await open('index.html', '#chapter/joseon/webtoon'); const jd = jw.window.document;
    const jf = jd.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...jd.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && jd.querySelector('.steps .step.current').dataset.step === '0' && jf && jf.getAttribute('src') === 'media/joseon-all-comic.html' && jf.getAttribute('scrolling') === 'no', '조선시대 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 통합 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...jd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1', 'flow-2', 'flow-3', 'flow-4', 'flow-5']) && jd.querySelectorAll('input[name="chapterPart"]').length === 3, '조선시대 학습: 다섯 흐름 바로 가기 버튼 · 범위 고르기(전체·전기·후기) 그대로');
    const jn = jd.querySelector('#lessonNotes');
    ok(jn && jn.tagName === 'DETAILS' && !jn.open && jn.querySelectorAll('.summary-part').length === 2 && jn.querySelectorAll('.note-card').length === 14, '조선시대 학습: 전기·후기 요약 노트 전체(카드 14)는 웹툰 아래 접힌 더 보기로 보존');
    jw.window.dispatchEvent(new jw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 6400 }, source: jf.contentWindow }));
    ok(jf.style.height === '6400px', '조선시대 학습: 웹툰이 알린 높이로 칸을 맞춤');
    const pl = jd.querySelector('input[name="chapterPart"][value="joseon-late"]'); pl.checked = true; pl.dispatchEvent(new jw.window.Event('change', { bubbles: true }));
    ok(jw.window.location.hash === '#chapter/joseon-late/webtoon' && jd.querySelector('.lesson-frame').getAttribute('src') === 'media/joseon-all-comic.html#late-part' && jd.querySelectorAll('#lessonNotes .summary-part').length === 1, '조선시대 학습: 후기 범위를 고르면 옛 주소(#chapter/joseon-late/webtoon)·웹툰 #late-part·후기 노트만');
    jw.window.close();
    const je = await open('index.html', '#chapter/joseon-early/summary'); const jed = je.window.document;
    ok(je.window.location.hash === '#chapter/joseon/summary' && jed.querySelector('#eraFullSummary') && !jed.querySelector('iframe,.part-picker') && jed.querySelector('.step[aria-current="step"]').dataset.step === '1', '옛 조선 요약 주소 → 전기·후기 전체요약 03으로 통합');
    je.window.close();
    { const jw2 = await open('index.html', '#chapter/joseon-late/webtoon'); const d2 = jw2.window.document, fr3 = d2.querySelector('.lesson-frame'), sent = [];
      try { fr3.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      fr3.dispatchEvent(new jw2.window.Event('load')); await new Promise(r => setTimeout(r, 450));
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'late-part'), '옛 학습 주소 #chapter/joseon-late/webtoon: 웹툰이 뜨면 후기 부분(#late-part)으로');
      jw2.window.close(); }
    const jc = await open('media/joseon-all-comic.html'); const jcd = jc.window.document, jsc = [...jcd.querySelectorAll('.scene')];
    ok(jsc.length === 27 && jsc.every(x => !x.closest('details')) && [...jcd.querySelectorAll('details:not(.culture-gallery)')].every(d => !d.open && (d.classList.contains('scene-more') || d.classList.contains('gl-item') || !!d.closest('aside[class$="-mem"]'))), '조선 통합 웹툰: 27컷 모두 펼친 채(접힌 것은 장면 안 보충·용어 풀이뿐)');
    ok(J([...jcd.querySelectorAll('.j-flow')].map(x => x.id)) === J(['flow-1', 'flow-2', 'flow-3', 'flow-4', 'flow-5']) && jcd.querySelectorAll('aside.j-mem').length === 5 && [...jcd.querySelectorAll('aside.j-mem')].every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && !m.closest('details')) && jcd.getElementById('early-part') && jcd.getElementById('late-part'), '조선 통합 웹툰: 다섯 흐름 머리 · 외울 것 카드 5장은 컷 바로 뒤 · 예전 1부·2부 앵커 유지');
    jc.window.close();
  }
  { // 고려 한 페이지 학습: 탭 셋, 다섯 흐름 바로 가기, 강의 노트·교재 정리·원래 카드는 접힌 더 보기, 웹툰은 20컷 모두 펼친 채
    const gw2 = await open('index.html', '#chapter/goryeo/webtoon'); const gd2 = gw2.window.document;
    const gf = gd2.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...gd2.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && gd2.querySelector('.steps .step.current').dataset.step === '0' && gf && gf.getAttribute('src') === 'media/goryeo-comic.html' && gf.getAttribute('scrolling') === 'no', '고려 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...gd2.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1', 'flow-2', 'flow-3', 'flow-4', 'flow-5']) && /네 시기/.test((gd2.querySelector('.lesson-lead') || {}).textContent || ''), '고려 학습: 다섯 흐름 바로 가기 버튼 · 네 시기 + 주제별이라는 안내');
    const gn = gd2.querySelector('#lessonNotes');
    ok(gn && gn.tagName === 'DETAILS' && !gn.open && gn.querySelector('.lecture-group') && gn.querySelector('.tb-supplement') && gn.querySelectorAll('.note-card').length === cur.chapters.find(c => c.id === 'goryeo').note.length && /큰 구간 · 시기별 상세/.test(gn.querySelector('summary').textContent), '고려 학습: 강의 묶음·교재 정리·원래 카드는 웹툰 아래 접힌 더 보기로 보존(안내도 고려에 맞게)');
    gw2.window.dispatchEvent(new gw2.window.MessageEvent('message', { data: { type: 'hanq:height', h: 15000 }, source: gf.contentWindow }));
    gw2.window.dispatchEvent(new gw2.window.MessageEvent('message', { data: { type: 'hanq:height', h: 14200 }, source: gf.contentWindow }));
    ok(gf.style.height === '14200px', '고려 학습: 웹툰이 알린 높이로 칸이 늘고 줄어듦');
    { const sent = []; try { gf.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      gd2.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[2].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'flow-3' && m.focus === true), '고려 학습: ③ 버튼 → 웹툰의 무신 집권기 머리로 이동·초점'); }
    gw2.window.fetch=async()=>({ok:true,json:async()=>JSON.parse(fs.readFileSync(path.join(ROOT,'media/culture-gallery.json'),'utf8'))});
    gd2.querySelector('.steps .step[data-step="5"]').click();
    ok(gw2.window.location.hash === '#chapter/goryeo/culture' && gd2.querySelector('#eraCulture') && gd2.querySelector('.steps .step.current').dataset.step === '5' && !gd2.querySelector('.lesson-frame'), '고려 문화재 탭은 독립 페이지로 전환');
    gd2.querySelector('.steps .step[data-step="0"]').click();
    ok(gw2.window.location.hash === '#chapter/goryeo/webtoon' && gd2.querySelector('.lesson-frame').getAttribute('src') === 'media/goryeo-comic.html', '고려 문화재에서 원래 만화 학습으로 복귀');
    gd2.querySelector('.steps .step[data-step="2"]').click();
    ok(gw2.window.location.hash === '#chapter/goryeo/quiz' && gd2.querySelector('.quiz-panel') && gd2.querySelectorAll('#quizJump option').length === gw2.window.HANQ_UNIFIED_QUIZ_SELECTION.eras.goryeo.length+1, '고려 학습 → 빈칸 탭: #chapter/goryeo/quiz · 단일50문항');
    gw2.window.close();
    const gs2 = await open('index.html', '#chapter/goryeo/summary'); const gsd = gs2.window.document;
    ok(gs2.window.location.hash === '#chapter/goryeo/summary' && gsd.querySelector('.step[aria-current=step]').dataset.step === '1' && gsd.querySelector('#eraFullSummary') && !gsd.querySelector('iframe'), 'goryeo: 요약 주소는 독립된 03 전체요약으로');
    ok(gsd.querySelectorAll('#lessonNotes .study-recall,#lessonNotes .recall').length===0, '고려 본문 아래 복습은 퀴즈 탭으로만 통합');
    gs2.window.close();
    const gm2 = await open('index.html', '#chapter/goryeo/mock');
    ok(gm2.window.document.querySelector('.steps .step.current').dataset.step === '3' && /5문제/.test(gm2.window.document.querySelector('.mock-panel h2').textContent), '옛 주소 #chapter/goryeo/mock → 실전 모의 5문제 그대로');
    gm2.window.close();
    { const od = await open('index.html', '#chapter/opening/webtoon'); ok(/큰 구간 · 시기별 상세/.test(od.window.document.querySelector('#lessonNotes summary').textContent), '개화기 요약 더 보기 안내는 큰 구간·시기별 상세'); od.window.close(); }
    const gc = await open('media/goryeo-comic.html'); const gcd = gc.window.document, gsc = [...gcd.querySelectorAll('.scene')];
    ok(gsc.length === 20 && gsc.every(x => !x.closest('details')) && J([...gcd.querySelectorAll('.g-flow')].map(x => x.id)) === J(['flow-1', 'flow-2', 'flow-3', 'flow-4', 'flow-5']), '고려 웹툰: 20컷 모두 펼친 채, 흐름 머리 다섯');
    const gmem = [...gcd.querySelectorAll('aside.g-mem')];
    ok(gmem.length === 5 && gmem.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && !m.closest('details')), '고려 웹툰: 외울 것 카드 10장은 덩어리 마지막 컷 바로 뒤');
    ok(gsc.every(x => x.querySelector('.artwork.full img') && !x.querySelector('.artwork .dialogue') && x.querySelectorAll('.g-talk > p').length === 2), '고려 웹툰: 그림은 칸 전체, 말풍선은 그림 밖');
    gc.window.close();
    for (const hash of ['#early', '#goryeo-kings-early', '#goryeo-system', '#khitan-2-3', '#sukjong-yejong', '#aristocrat', '#military', '#yuan', '#yuan-kings', '#late', '#goryeo-relief', '#culture', '#goryeo-art', '#goryeo-history', '#flow-4', '#mem-s07']) {
      const dd = await open('media/goryeo-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '고려 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 독도와 간도 한 페이지 학습: 탭 셋, 두 주제 바로 가기, 노트 카드 5장은 접힌 더 보기, 웹툰은 7컷 모두 펼친 채
    const iw = await open('index.html', '#chapter/islands/webtoon'); const idc = iw.window.document;
    const ifr = idc.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...idc.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','2','3']) && idc.querySelector('.steps .step.current').dataset.step === '0' && ifr && ifr.getAttribute('src') === 'media/islands-comic.html' && ifr.getAttribute('scrolling') === 'no', '독도와 간도 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...idc.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['topic-dokdo', 'topic-gando']) && /서로 다른 두 주제/.test((idc.querySelector('.lesson-lead') || {}).textContent || ''), '독도와 간도 학습: 두 주제 바로 가기 버튼(① 독도 · ② 간도) · 두 주제라는 안내');
    const inotes = idc.querySelector('#lessonNotes');
    ok(inotes && inotes.tagName === 'DETAILS' && !inotes.open && inotes.querySelectorAll('.note-card').length === 5, '독도와 간도 학습: 원래 노트 카드 5장은 웹툰 아래 접힌 더 보기로 보존');
    iw.window.dispatchEvent(new iw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 4800 }, source: ifr.contentWindow }));
    ok(ifr.style.height === '4800px', '독도와 간도 학습: 웹툰이 알린 높이로 칸을 맞춤');
    { const sent = []; try { ifr.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      idc.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[1].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'topic-gando' && m.focus === true), '독도와 간도 학습: ② 간도 버튼 → 웹툰의 간도 머리로 이동·초점'); }
    idc.querySelector('.steps .step[data-step="3"]').click();
    ok(iw.window.location.hash === '#chapter/islands/mock' && idc.querySelector('.steps .step.current').dataset.step === '3', '독도와 간도 학습 → 실전 모의 탭: #chapter/islands/mock(단계 번호 3)');
    iw.window.close();
    const isum = await open('index.html', '#chapter/islands/summary'); const isd = isum.window.document;
    ok(isum.window.location.hash === '#chapter/islands/summary' && isd.querySelector('.steps .step.current').dataset.step === '0' && isd.querySelector('#lessonNotes').open && isd.querySelector('.lesson-frame'), '옛 요약 주소 #chapter/islands/summary → 같은 학습 페이지, 노트 카드를 펼친 채');
    isum.window.close();
    const iq = await open('index.html', '#chapter/islands/quiz');
    ok(iq.window.document.querySelector('.quiz-panel') && iq.window.document.querySelector('.steps .step.current').dataset.step === '2', '옛 주소 #chapter/islands/quiz → 빈칸 그대로');
    iq.window.close();
    const ic = await open('media/islands-comic.html'); const icd = ic.window.document, isc = [...icd.querySelectorAll('.scene')];
    ok(isc.length === 7 && isc.every(x => !x.closest('details')) && J([...icd.querySelectorAll('.i-topic')].map(x => x.id)) === J(['topic-dokdo', 'topic-gando']), '독도와 간도 웹툰: 7컷 모두 펼친 채, 주제 머리 둘');
    const imem = [...icd.querySelectorAll('aside.i-mem')];
    ok(imem.length === 2 && imem.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && m.id === 'mem-' + m.previousElementSibling.id && !m.closest('details')), '독도와 간도 웹툰: 외울 것 카드 4장은 각 덩어리 마지막 컷 바로 뒤');
    ok(isc.every(x => !x.querySelector('.art .i-talk, .art b')) && isc.every(x => x.querySelectorAll('.i-talk > p').length === 2), '독도와 간도 웹툰: 말풍선은 그림 밖');
    ic.window.close();
    for (const hash of ['#scene-1', '#scene-2', '#scene-3', '#scene-4', '#stele-mountain', '#treaties-1904', '#independence-battles', '#topic-gando']) {
      const dd = await open('media/islands-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '독도와 간도 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 일제 강점기 한 페이지 학습: 탭 셋, 네 흐름 바로 가기, 원래 노트 카드 10장은 접힌 더 보기, 웹툰은 18컷 모두 펼친 채(SVG 칸 전체)
    const cw = await open('index.html', '#chapter/colonial/webtoon'); const cd = cw.window.document;
    const cf = cd.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...cd.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && cd.querySelector('.steps .step.current').dataset.step === '0' && cf && cf.getAttribute('src') === 'media/colonial-comic.html' && cf.getAttribute('scrolling') === 'no', '일제 강점기 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...cd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1','flow-2','flow-3']) && /통치와 독립운동을 함께/.test((cd.querySelector('.lesson-lead') || {}).textContent || ''), '일제 강점기 학습: 네 흐름 바로 가기 버튼 · 독립운동사는 시기가 겹친다는 안내');
    const cn = cd.querySelector('#lessonNotes');
    ok(cn && cn.tagName === 'DETAILS' && !cn.open && cn.querySelectorAll('.note-card').length === 10, '일제 강점기 학습: 원래 노트 카드 10장(과 교재 정리)은 웹툰 아래 접힌 더 보기로 보존');
    cw.window.dispatchEvent(new cw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 16000 }, source: cf.contentWindow }));
    cw.window.dispatchEvent(new cw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 15200 }, source: cf.contentWindow }));
    ok(cf.style.height === '15200px', '일제 강점기 학습: 웹툰이 알린 높이로 칸이 늘고 줄어듦');
    { const sent = []; try { cf.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      cd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[2].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'flow-3' && m.focus === true), '일제 강점기 학습: ④ 버튼 → 웹툰의 독립운동사 머리로 이동·초점'); }
    cd.querySelector('.steps .step[data-step="2"]').click();
    ok(cw.window.location.hash === '#chapter/colonial/quiz' && cd.querySelector('.quiz-panel'), '일제 강점기 학습 → 빈칸 탭: #chapter/colonial/quiz(단계 번호 2)');
    cw.window.close();
    const cs2 = await open('index.html', '#chapter/colonial/summary'); const csd = cs2.window.document;
    ok(cs2.window.location.hash === '#chapter/colonial/summary' && csd.querySelector('.step[aria-current=step]').dataset.step === '1' && csd.querySelector('#eraFullSummary') && !csd.querySelector('iframe'), 'colonial: 요약 주소는 독립된 03 전체요약으로');
    cs2.window.close();
    const cm2 = await open('index.html', '#chapter/colonial/mock');
    ok(cm2.window.document.querySelector('.steps .step.current').dataset.step === '3' && cm2.window.document.querySelector('.mock-panel'), '옛 주소 #chapter/colonial/mock → 실전 모의 그대로');
    cm2.window.close();
    const cc2 = await open('media/colonial-comic.html'); const ccd = cc2.window.document, csc = [...ccd.querySelectorAll('.scene')];
    ok(csc.length === 18 && csc.every(x => !x.closest('details')) && J([...ccd.querySelectorAll('.c-flow')].map(x => x.id)) === J(['flow-1','flow-2','flow-3']), '일제 강점기 웹툰: 18컷 모두 펼친 채, 흐름 머리 넷');
    ok(csc.every(x => { const v = x.querySelector('svg.c-panel'); return v && v.getAttribute('viewBox').split(' ').length === 4 && v.getAttribute('width') && !x.querySelector('.art, .bubble'); }), '일제 강점기 웹툰: 모든 컷에 원본 칸 SVG(viewBox), 예전 배경 그림·그림 위 말풍선 없음');
    const cmem = [...ccd.querySelectorAll('aside.c-mem')];
    ok(cmem.length === 3 && cmem.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && m.id === 'mem-' + m.previousElementSibling.id && !m.closest('details')), '일제 강점기 웹툰: 외울 것 카드 4장은 큰 흐름 마지막 컷 바로 뒤');
    cc2.window.close();
    for (const hash of ['#scene-1', '#scene-3', '#scene-6', '#scene-9', '#scene-12', '#secret-societies', '#singanhoe', '#social-movements', '#uiyeoldan', '#manchuria-1930s', '#language-history', '#flow-4', '#mem-scene-8']) {
      const dd = await open('media/colonial-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '일제 강점기 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 현대사 한 페이지 학습: 탭 셋, 다섯 흐름 바로 가기, 원래 노트 카드 9장은 접힌 더 보기, 웹툰은 18컷 모두 펼친 채(SVG 칸 전체)
    const mw = await open('index.html', '#chapter/modern/webtoon'); const md = mw.window.document;
    const mf = md.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...md.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && md.querySelector('.steps .step.current').dataset.step === '0' && mf && mf.getAttribute('src') === 'media/modern-comic.html' && mf.getAttribute('scrolling') === 'no', '현대사 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...md.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1', 'flow-2', 'flow-3', 'flow-4', 'flow-5']) && /시기가 겹/.test((md.querySelector('.lesson-lead') || {}).textContent || ''), '현대사 학습: 다섯 흐름 바로 가기 버튼 · 남북 관계·FTA는 주제별이라 시기가 겹친다는 안내');
    const mn = md.querySelector('#lessonNotes');
    ok(mn && mn.tagName === 'DETAILS' && !mn.open && mn.querySelectorAll('.note-card').length === 9, '현대사 학습: 원래 노트 카드 9장(과 교재 정리)은 웹툰 아래 접힌 더 보기로 보존');
    mw.window.dispatchEvent(new mw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 17000 }, source: mf.contentWindow }));
    mw.window.dispatchEvent(new mw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 16100 }, source: mf.contentWindow }));
    ok(mf.style.height === '16100px', '현대사 학습: 웹툰이 알린 높이로 칸이 늘고 줄어듦');
    { const sent = []; try { mf.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      md.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[3].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'flow-4' && m.focus === true), '현대사 학습: ④ 버튼 → 웹툰의 신군부·6월 민주항쟁 머리로 이동·초점'); }
    md.querySelector('.steps .step[data-step="2"]').click();
    ok(mw.window.location.hash === '#chapter/modern/quiz' && md.querySelector('.quiz-panel'), '현대사 학습 → 빈칸 탭: #chapter/modern/quiz(단계 번호 2)');
    mw.window.close();
    const ms2 = await open('index.html', '#chapter/modern/summary'); const msd = ms2.window.document;
    ok(ms2.window.location.hash === '#chapter/modern/summary' && msd.querySelector('.step[aria-current=step]').dataset.step === '1' && msd.querySelector('#eraFullSummary') && !msd.querySelector('iframe'), 'modern: 요약 주소는 독립된 03 전체요약으로');
    ms2.window.close();
    const mm2 = await open('index.html', '#chapter/modern/mock');
    ok(mm2.window.document.querySelector('.steps .step.current').dataset.step === '3' && mm2.window.document.querySelector('.mock-panel'), '옛 주소 #chapter/modern/mock → 실전 모의 그대로');
    mm2.window.close();
    const mc2 = await open('media/modern-comic.html'); const mcd = mc2.window.document, msc = [...mcd.querySelectorAll('.scene')];
    ok(msc.length === 18 && msc.every(x => !x.closest('details')) && J([...mcd.querySelectorAll('.m-flow')].map(x => x.id)) === J(['flow-1', 'flow-2', 'flow-3', 'flow-4', 'flow-5']), '현대사 웹툰: 18컷 모두 펼친 채, 흐름 머리 다섯');
    ok(msc.every(x => { const v = x.querySelector('svg.m-panel'); return v && v.getAttribute('viewBox').split(' ').length === 4 && v.getAttribute('width') && !x.querySelector('.art, .bubble'); }), '현대사 웹툰: 모든 컷에 원본 칸 SVG(viewBox), 예전 배경 그림·그림 위 말풍선 없음');
    const mmem = [...mcd.querySelectorAll('aside.m-mem')];
    ok(mmem.length === 5 && mmem.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && m.id === 'mem-' + m.previousElementSibling.id && !m.closest('details')), '현대사 웹툰: 외울 것 카드 9장은 각 덩어리 마지막 컷 바로 뒤');
    mc2.window.close();
    for (const hash of ['#scene-1', '#scene-3', '#constituent-tasks', '#rhee-amendments', '#scene-6', '#yushin-end', '#scene-8', '#chun-government', '#scene-9', '#ys-government', '#inter-korean', '#scene-12', '#flow-5', '#mem-scene-9']) {
      const dd = await open('media/modern-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '현대사 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 선사시대 한 페이지 학습: 탭 셋, 네 흐름 바로 가기, 원래 노트 카드 5장은 접힌 더 보기, 웹툰은 12컷 모두 펼친 채(그림 전체·원래 비율)
    const pw = await open('index.html', '#chapter/prehistory/webtoon'); const pd = pw.window.document;
    const pf = pd.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...pd.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && pd.querySelector('.steps .step.current').dataset.step === '0' && pf && pf.getAttribute('src') === 'media/prehistory-comic.html' && pf.getAttribute('scrolling') === 'no', '선사시대 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...pd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1','flow-2','flow-3','flow-4']) && /유적지는 몰라도/.test((pd.querySelector('.lesson-lead') || {}).textContent || ''), '선사시대 학습: 네 흐름 바로 가기 버튼 · 생활과 도구로 가르고 유적지는 몰라도 된다는 안내');
    const pn = pd.querySelector('#lessonNotes');
    ok(pn && pn.tagName === 'DETAILS' && !pn.open && pn.querySelectorAll('.note-card').length === 5, '선사시대 학습: 원래 노트 카드 5장(과 교재 정리)은 웹툰 아래 접힌 더 보기로 보존');
    pw.window.dispatchEvent(new pw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 12000 }, source: pf.contentWindow }));
    pw.window.dispatchEvent(new pw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 11400 }, source: pf.contentWindow }));
    ok(pf.style.height === '11400px', '선사시대 학습: 웹툰이 알린 높이로 칸이 늘고 줄어듦');
    { const sent = []; try { pf.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      pd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[2].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'flow-3' && m.focus === true), '선사시대 학습: ③ 버튼 → 웹툰의 청동기 머리로 이동·초점'); }
    pd.querySelector('.steps .step[data-step="2"]').click();
    ok(pw.window.location.hash === '#chapter/prehistory/quiz' && pd.querySelector('.quiz-panel') && pd.querySelectorAll('#quizJump option').length === pw.window.HANQ_UNIFIED_QUIZ_SELECTION.eras.prehistory.length+1, '선사시대 학습 → 빈칸 탭: #chapter/prehistory/quiz · 단일50문항');
    pw.window.close();
    const ps2 = await open('index.html', '#chapter/prehistory/summary'); const psd = ps2.window.document;
    ok(ps2.window.location.hash === '#chapter/prehistory/summary' && psd.querySelector('.step[aria-current=step]').dataset.step === '1' && psd.querySelector('#eraFullSummary') && !psd.querySelector('iframe'), 'prehistory: 요약 주소는 독립된 03 전체요약으로');
    ps2.window.close();
    const pm2 = await open('index.html', '#chapter/prehistory/mock');
    ok(pm2.window.document.querySelector('.steps .step.current').dataset.step === '3' && pm2.window.document.querySelector('.mock-panel'), '옛 주소 #chapter/prehistory/mock → 실전 모의 그대로');
    pm2.window.close();
    const pc2 = await open('media/prehistory-comic.html'); const pcd = pc2.window.document, psc = [...pcd.querySelectorAll('.scene')];
    ok(psc.length === 12 && psc.every(x => !x.closest('details')) && J([...pcd.querySelectorAll('.p-flow')].map(x => x.id)) === J(['flow-1','flow-2','flow-3','flow-4']), '선사시대 웹툰: 12컷 모두 펼친 채, 흐름 머리 넷');
    ok(psc.every(x => { const im = x.querySelector('.p-art > img'); return im && im.getAttribute('width') === '539' && im.getAttribute('height') === '358' && !im.getAttribute('style') && /--p-ar:539 \/ 358/.test(x.querySelector('.p-art').getAttribute('style')) && !x.querySelector('.art, .bubble'); }), '선사시대 웹툰: 모든 컷에 그림 전체(539×358, 확대 없음) · 칸 비율 미리 잡음 · 그림 위 말풍선 없음');
    const pmem = [...pcd.querySelectorAll('aside.p-mem')];
    ok(pmem.length === 4 && pmem.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && m.id === 'mem-' + m.previousElementSibling.id && !m.closest('details')), '선사시대 웹툰: 외울 것 카드 4장은 각 시대 마지막 컷 바로 뒤');
    ok(pcd.getElementById('progress'), '선사시대 웹툰: 예전 진행 막대 요소 그대로(스크립트 오류 없음)');
    pc2.window.close();
    for (const hash of ['#scene-1', '#scene-2', '#paleo-sites', '#scene-3', '#scene-4', '#neo-village', '#scene-5', '#scene-6', '#bronze-village', '#scene-7', '#scene-8', '#iron-trade', '#flow-4', '#mem-scene-7']) {
      const dd = await open('media/prehistory-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '선사시대 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 고조선과 여러 나라 한 페이지 학습: 탭 셋, 두 흐름 바로 가기, 원래 노트 카드 5장은 접힌 더 보기, 웹툰은 12컷 모두 펼친 채(그림 전체·원래 비율)
    const gw3 = await open('index.html', '#chapter/gojoseon/webtoon'); const gd3 = gw3.window.document;
    const gf3 = gd3.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...gd3.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && gd3.querySelector('.steps .step.current').dataset.step === '0' && gf3 && gf3.getAttribute('src') === 'media/gojoseon-comic.html' && gf3.getAttribute('scrolling') === 'no', '고조선과 여러 나라 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...gd3.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1', 'flow-2']) && /차례로 이어진 나라가 아니/.test((gd3.querySelector('.lesson-lead') || {}).textContent || ''), '고조선과 여러 나라 학습: 두 흐름 바로 가기 버튼 · 여러 나라는 나란히 있던 나라라는 안내');
    const gn3 = gd3.querySelector('#lessonNotes');
    ok(gn3 && gn3.tagName === 'DETAILS' && !gn3.open && gn3.querySelectorAll('.note-card').length === 5, '고조선과 여러 나라 학습: 원래 노트 카드 5장(과 교재 정리)은 웹툰 아래 접힌 더 보기로 보존');
    gw3.window.dispatchEvent(new gw3.window.MessageEvent('message', { data: { type: 'hanq:height', h: 12500 }, source: gf3.contentWindow }));
    gw3.window.dispatchEvent(new gw3.window.MessageEvent('message', { data: { type: 'hanq:height', h: 11900 }, source: gf3.contentWindow }));
    ok(gf3.style.height === '11900px', '고조선과 여러 나라 학습: 웹툰이 알린 높이로 칸이 늘고 줄어듦');
    { const sent = []; try { gf3.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      gd3.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[1].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'flow-2' && m.focus === true), '고조선과 여러 나라 학습: ② 버튼 → 웹툰의 여러 나라 머리로 이동·초점'); }
    gd3.querySelector('.steps .step[data-step="2"]').click();
    ok(gw3.window.location.hash === '#chapter/gojoseon/quiz' && gd3.querySelector('.quiz-panel') && gd3.querySelectorAll('#quizJump option').length === gw3.window.HANQ_UNIFIED_QUIZ_SELECTION.eras.gojoseon.length+1, '고조선과 여러 나라 학습 → 빈칸 탭: #chapter/gojoseon/quiz · 단일50문항');
    gw3.window.close();
    const gs3 = await open('index.html', '#chapter/gojoseon/summary'); const gsd3 = gs3.window.document;
    ok(gs3.window.location.hash === '#chapter/gojoseon/summary' && gsd3.querySelector('.step[aria-current=step]').dataset.step === '1' && gsd3.querySelector('#eraFullSummary') && !gsd3.querySelector('iframe'), 'gojoseon: 요약 주소는 독립된 03 전체요약으로');
    gs3.window.close();
    const gm3 = await open('index.html', '#chapter/gojoseon/mock');
    ok(gm3.window.document.querySelector('.steps .step.current').dataset.step === '3' && gm3.window.document.querySelector('.mock-panel'), '옛 주소 #chapter/gojoseon/mock → 실전 모의 그대로');
    gm3.window.close();
    const gc3 = await open('media/gojoseon-comic.html'); const gcd3 = gc3.window.document, gsc3 = [...gcd3.querySelectorAll('.scene')];
    ok(gsc3.length === 12 && gsc3.every(x => !x.closest('details')) && J([...gcd3.querySelectorAll('.gj-flow')].map(x => x.id)) === J(['flow-1', 'flow-2']), '고조선과 여러 나라 웹툰: 12컷 모두 펼친 채, 흐름 머리 둘');
    ok(gsc3.every(x => { const im = x.querySelector('.gj-art > img'); return im && im.getAttribute('width') === '508' && im.getAttribute('height') === '380' && !im.getAttribute('style') && /--gj-ar:508 \/ 380/.test(x.querySelector('.gj-art').getAttribute('style')) && !x.querySelector('.art, .bubble'); }), '고조선과 여러 나라 웹툰: 모든 컷에 그림 전체(508×380, 확대 없음) · 칸 비율 미리 잡음 · 그림 위 말풍선 없음');
    const gmem3 = [...gcd3.querySelectorAll('aside.gj-mem')];
    ok(gmem3.length === 5 && gmem3.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && m.id === 'mem-' + m.previousElementSibling.id && !m.closest('details')), '고조선과 여러 나라 웹툰: 외울 것 카드 5장은 각 덩어리 마지막 컷 바로 뒤');
    ok(gcd3.getElementById('progress'), '고조선과 여러 나라 웹툰: 예전 진행 막대 요소 그대로(스크립트 오류 없음)');
    gc3.window.close();
    for (const hash of ['#scene-1', '#gojoseon-law', '#scene-2', '#scene-3', '#wiman-trade', '#scene-4', '#scene-5', '#scene-6', '#eupgun-samno', '#scene-7', '#scene-8', '#samhan-rites', '#flow-2', '#mem-scene-7']) {
      const dd = await open('media/gojoseon-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '고조선과 여러 나라 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 남북국 한 페이지 학습: 탭 셋, 네 흐름 바로 가기, 원래 노트 카드는 접힌 더 보기, 웹툰은 32컷 모두 펼친 채(그림판 칸 전체 SVG)
    const nw = await open('index.html', '#chapter/nambuk/webtoon'); const nd = nw.window.document;
    const nf = nd.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...nd.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && nd.querySelector('.steps .step.current').dataset.step === '0' && nf && nf.getAttribute('src') === 'media/nambuk-comic.html' && nf.getAttribute('scrolling') === 'no', '남북국 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...nd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1','flow-2','flow-3','flow-4']) && /나란히/.test((nd.querySelector('.lesson-lead') || {}).textContent || ''), '남북국 학습: 네 흐름 바로 가기 버튼 · 신라와 발해는 나란히 있던 나라라는 안내');
    const nn = nd.querySelector('#lessonNotes');
    ok(nn && nn.tagName === 'DETAILS' && !nn.open && nn.querySelectorAll('.note-card').length === cur.chapters.find(c => c.id === 'nambuk').note.length, '남북국 학습: 원래 노트 카드(와 교재 정리)는 웹툰 아래 접힌 더 보기로 보존');
    nw.window.dispatchEvent(new nw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 26000 }, source: nf.contentWindow }));
    nw.window.dispatchEvent(new nw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 25200 }, source: nf.contentWindow }));
    ok(nf.style.height === '25200px', '남북국 학습: 웹툰이 알린 높이로 칸이 늘고 줄어듦');
    { const sent = []; try { nf.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      nd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[1].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'flow-2' && m.focus === true), '남북국 학습: ② 버튼 → 웹툰의 발해 머리로 이동·초점'); }
    nd.querySelector('.steps .step[data-step="2"]').click();
    ok(nw.window.location.hash === '#chapter/nambuk/quiz' && nd.querySelector('.quiz-panel') && nd.querySelectorAll('#quizJump option').length === nw.window.HANQ_UNIFIED_QUIZ_SELECTION.eras.nambuk.length+1, '남북국 학습 → 빈칸 탭: #chapter/nambuk/quiz · 단일50문항');
    nw.window.close();
    const ns2 = await open('index.html', '#chapter/nambuk/summary'); const nsd = ns2.window.document;
    ok(ns2.window.location.hash === '#chapter/nambuk/summary' && nsd.querySelector('.step[aria-current=step]').dataset.step === '1' && nsd.querySelector('#eraFullSummary') && !nsd.querySelector('iframe'), 'nambuk: 요약 주소는 독립된 03 전체요약으로');
    ns2.window.close();
    const nm2 = await open('index.html', '#chapter/nambuk/mock');
    ok(nm2.window.document.querySelector('.steps .step.current').dataset.step === '3' && nm2.window.document.querySelector('.mock-panel'), '옛 주소 #chapter/nambuk/mock → 실전 모의 그대로');
    nm2.window.close();
    const nc2 = await open('media/nambuk-comic.html'); const ncd = nc2.window.document, nsc = [...ncd.querySelectorAll('.scene')];
    ok(nsc.length === 32 && nsc.every(x => !x.closest('details')) && J([...ncd.querySelectorAll('.n-flow')].map(x => x.id)) === J(['flow-1','flow-2','flow-3','flow-4']) && [...ncd.querySelectorAll('details:not(.culture-gallery)')].every(d => !d.open), '남북국 웹툰: 32컷 모두 펼친 채(접힌 것은 장면 안 보충·예전 설명·용어 풀이뿐, 처음엔 모두 닫힘), 흐름 머리 넷');
    ok(nsc.every(x => { const v = x.querySelector('svg.n-panel'), im = v && v.querySelector('image'); const vb = v ? v.getAttribute('viewBox').split(' ') : [];
      return v && vb.length === 4 && v.getAttribute('width') === vb[2] && v.getAttribute('height') === vb[3] && /--n-ar:\d+ \/ \d+/.test(v.getAttribute('style') || '') && im && /^nambuk-sheets\/[0-3]\.png$/.test(im.getAttribute('href')) && im.getAttribute('width') === '1086' && im.getAttribute('height') === '1448' && !x.querySelector('.frame, .dialogue, .bubble, .beat'); }),
      '남북국 웹툰: 모든 컷에 그림판 칸 전체 SVG(viewBox = 칸, width·height·비율 자리 = 칸 크기), 예전 배경 그림·그림 위 말풍선 없음');
    const nmem = [...ncd.querySelectorAll('aside.n-mem')];
    ok(nmem.length === 4 && nmem.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && m.id === 'mem-' + m.previousElementSibling.id && !m.closest('details')), '남북국 웹툰: 외울 것 카드 15장은 각 덩어리 마지막 컷 바로 뒤');
    ok(ncd.getElementById('progress') && ncd.querySelectorAll('nav:not(.artifact-nav):not(.study-cut-links)').length === 1, '남북국 웹툰: 예전 진행 막대 요소 그대로(스크립트 오류 없음) · 바로 가기 줄 하나');
    nc2.window.close();
    for (const hash of ['#s1', '#s2', '#s8', '#s9', '#s12', '#s15', '#s20', '#s25', '#s30', '#s31', '#s32', '#flow-2', '#flow-3', '#mem-s12', '#mem-s32']) {
      const dd = await open('media/nambuk-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '남북국 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 삼국 한 페이지 학습: 탭 셋, 네 흐름 바로 가기, 원래 노트 카드·요약 이미지는 접힌 더 보기, 웹툰은 32컷 모두 펼친 채(그림판 칸 전체 SVG)
    const sw = await open('index.html', '#chapter/samguk/webtoon'); const sd = sw.window.document;
    const sf = sd.querySelector('.lesson-panel iframe.watch.lesson-frame');
    ok(J([...sd.querySelectorAll('.steps .step')].map(b => b.dataset.step)) === J(['0','5','1','2','3']) && sd.querySelector('.steps .step.current').dataset.step === '0' && sf && sf.getAttribute('src') === 'media/samguk-comic.html' && sf.getAttribute('scrolling') === 'no', '삼국 학습: 학습·빈칸·기출 탭 셋(복습은 별도 메뉴), 웹툰을 칸 안쪽 스크롤 없이');
    ok(J([...sd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')].map(b => b.dataset.target)) === J(['flow-1','flow-2','flow-3','flow-4']) && /나란히/.test((sd.querySelector('.lesson-lead') || {}).textContent || ''), '삼국 학습: 네 흐름 바로 가기 버튼 · 세 나라는 나란히 있던 나라라는 안내');
    const sn = sd.querySelector('#lessonNotes');
    ok(sn && sn.tagName === 'DETAILS' && !sn.open && sn.querySelectorAll('.note-card').length === cur.chapters.find(c => c.id === 'samguk').note.length && sn.querySelector('img.note-img[src="media/samguk-summary.png"]'), '삼국 학습: 원래 노트 카드·휴대폰용 요약 이미지(와 교재 정리)는 웹툰 아래 접힌 더 보기로 보존');
    sw.window.dispatchEvent(new sw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 26000 }, source: sf.contentWindow }));
    sw.window.dispatchEvent(new sw.window.MessageEvent('message', { data: { type: 'hanq:height', h: 25300 }, source: sf.contentWindow }));
    ok(sf.style.height === '25300px', '삼국 학습: 웹툰이 알린 높이로 칸이 늘고 줄어듦');
    { const sent = []; try { sf.contentWindow.postMessage = m => sent.push(m); } catch (e) {}
      sd.querySelectorAll('.lesson-jump:not([data-target="culture-gallery"])')[3].click();
      ok(sent.some(m => m && m.type === 'hanq:goto' && m.id === 'flow-4' && m.focus === true), '삼국 학습: ④ 버튼 → 웹툰의 7세기 전쟁 머리로 이동·초점'); }
    sd.querySelector('.steps .step[data-step="2"]').click();
    ok(sw.window.location.hash === '#chapter/samguk/quiz' && sd.querySelector('.quiz-panel') && sd.querySelectorAll('#quizJump option').length === sw.window.HANQ_UNIFIED_QUIZ_SELECTION.eras.samguk.length+1, '삼국 학습 → 빈칸 탭: #chapter/samguk/quiz · 단일50문항');
    sw.window.close();
    const ss2 = await open('index.html', '#chapter/samguk/summary'); const ssd = ss2.window.document;
    ok(ss2.window.location.hash === '#chapter/samguk/summary' && ssd.querySelector('.step[aria-current=step]').dataset.step === '1' && ssd.querySelector('#eraFullSummary') && !ssd.querySelector('iframe'), 'samguk: 요약 주소는 독립된 03 전체요약으로');
    ss2.window.close();
    const sm2 = await open('index.html', '#chapter/samguk/mock');
    ok(sm2.window.document.querySelector('.steps .step.current').dataset.step === '3' && sm2.window.document.querySelector('.mock-panel'), '옛 주소 #chapter/samguk/mock → 실전 모의 그대로');
    sm2.window.close();
    const sc2 = await open('media/samguk-comic.html'); const scd = sc2.window.document, ssc = [...scd.querySelectorAll('.scene')];
    ok(ssc.length === 32 && ssc.every(x => !x.closest('details')) && J([...scd.querySelectorAll('.s-flow')].map(x => x.id)) === J(['flow-1','flow-2','flow-3','flow-4']) && [...scd.querySelectorAll('details:not(.culture-gallery)')].every(d => !d.open), '삼국 웹툰: 32컷 모두 펼친 채(접힌 것은 장면 안 보충·예전 설명·용어 풀이뿐, 처음엔 모두 닫힘), 흐름 머리 넷');
    ok(ssc.every(x => { const v = x.querySelector('svg.s-panel'), im = v && v.querySelector('image'); const vb = v ? v.getAttribute('viewBox').split(' ') : [];
      return v && vb.length === 4 && v.getAttribute('width') === vb[2] && v.getAttribute('height') === vb[3] && /--s-ar:\d+ \/ \d+/.test(v.getAttribute('style') || '') && im && /^samguk-sheets\/[0-3]\.png$/.test(im.getAttribute('href')) && im.getAttribute('width') === '1086' && im.getAttribute('height') === '1448' && !x.querySelector('.frame, .dialogue, .bubble, .beat'); }),
      '삼국 웹툰: 모든 컷에 그림판 칸 전체 SVG(viewBox = 칸, width·height·비율 자리 = 칸 크기), 예전 배경 그림·그림 위 말풍선 없음');
    const smem = [...scd.querySelectorAll('aside.s-mem')];
    ok(smem.length === 4 && smem.every(m => m.previousElementSibling && m.previousElementSibling.classList.contains('scene') && m.id === 'mem-' + m.previousElementSibling.id && !m.closest('details')), '삼국 웹툰: 외울 것 카드 13장은 각 덩어리 마지막 컷 바로 뒤');
    ok(scd.getElementById('progress') && scd.querySelectorAll('nav:not(.artifact-nav):not(.study-cut-links)').length === 1, '삼국 웹툰: 예전 진행 막대 요소 그대로(스크립트 오류 없음) · 바로 가기 줄 하나');
    sc2.window.close();
    for (const hash of ['#s1', '#s3', '#s8', '#s12', '#s14', '#s19', '#s22', '#s24', '#s28', '#s30', '#s31', '#s32', '#flow-2', '#flow-3', '#mem-s13', '#mem-s32']) {
      const dd = await open('media/samguk-comic.html', hash);
      ok(dd.window.document.getElementById(hash.slice(1)), '삼국 웹툰 바로 링크 ' + hash + ' 대상 있음');
      dd.window.close();
    }
  }
  { // 퀴즈 진행·바로 가기는 강의 구성과 무관하게 그대로
    const qd = await open('index.html', '#chapter/goryeo/quiz'); const qw = qd.window, qdoc = qw.document;
    const n = qdoc.querySelectorAll('#quizJump option').length - 1; ok(n === qw.window.HANQ_UNIFIED_QUIZ_SELECTION.eras.goryeo.length, '고려 단일퀴즈 실제문항');
    // 예전 ‘입력 → 바로 가기 → 입력 유지’를 객관식으로: 고른 답(임시)과 보기 순서가 바로 가기 뒤에도 그대로
    const QCg = qw.HANQ_QUIZ_CATALOG, orderOf = () => [...qdoc.querySelectorAll('#quiz .qchoice')].map(b => b.getAttribute('data-option'));
    const ord0 = orderOf(), pick0 = ord0[ord0.length - 1];
    qdoc.querySelector('#quiz .qchoice[data-option="' + pick0 + '"]').click();
    const j = qdoc.querySelector('#quizJump'); j.value = '5'; j.dispatchEvent(new qw.Event('change')); j.value = '0'; j.dispatchEvent(new qw.Event('change'));
    ok((qdoc.querySelector('#quiz .qchoice[aria-checked="true"]') || { getAttribute: () => '' }).getAttribute('data-option') === pick0 && J(orderOf()) === J(ord0) && !qdoc.querySelector('#quizFeedback').className.includes('show'), '고려 빈칸: 바로 가기 뒤에도 고른 답(채점 전)·보기 순서 유지');
    // 보기 순서는 문항마다 시드로 섞여 정답 자리가 한쪽으로 몰리지 않음(기본 20문항의 정답 자리 분포)
    const firstSlot = []; for (let i = 0; i < n; i++) { j.value = String(i); j.dispatchEvent(new qw.Event('change')); const qid = qdoc.querySelector('#quiz .question').getAttribute('data-question'); firstSlot.push(orderOf().indexOf(QCg.questions[qid].options.find(o => o.correct).id)); }
    ok(new Set(firstSlot).size >= 2 && firstSlot.filter(x => x === 0).length < n, '정답 자리가 모두 첫째가 아님(보기 순서를 섞음): ' + firstSlot.join(''));
    const ch={pool:qw.HANQ_UNIFIED_QUIZ_SELECTION.eras.goryeo};ok(!qdoc.querySelector('#quizSet,#quizGlobal,#quizLearningMaterial'),'묶음·종류선택 없음');j.value='0';j.dispatchEvent(new qw.Event('change'));
    // 채점 이벤트 · 정답 뒤 명시적 다음만 이동 · 바로 가기가 대기 중인 넘김을 취소
    const evts = []; qdoc.addEventListener('hanq:quiz', e => evts.push(e.detail));
    const qidA = qdoc.querySelector('#quiz .question').getAttribute('data-question'), corrA = QCg.questions[qidA].options.find(o => o.correct).id;
    qdoc.querySelector('#quiz .qchoice[data-option="' + corrA + '"]').click(); qdoc.querySelector('#checkAnswer').click();
    const g = evts.find(e => e.type === 'graded');
    ok(evts.some(e => e.type === 'select' && e.optionId === corrA) && g && g.questionId === qidA && g.optionId === corrA && g.correct === true && g.contentVersion === QCg.questions[qidA].v && g.review && g.review.options.length === QCg.questions[qidA].options.length && g.review.correctOptionId === corrA,
      '고르기·채점은 hanq:quiz 이벤트(문항 ID·버전·보기 ID·공용 풀이 계약)로 알림 · 저장은 하지 않음');
    ok(qdoc.querySelectorAll('#quiz .qchoice:disabled').length === QCg.questions[qidA].options.length && qdoc.querySelector('#quiz .qchoice-row.is-correct').getAttribute('data-option') === corrA, '정답이면 보기 잠김 · ✓ 표시');
    await new Promise(r => setTimeout(r,2200));
    ok(qdoc.querySelector('#quiz .question').getAttribute('data-question')===qidA && qdoc.querySelector('#quizFeedback').classList.contains('good'), '정답 확인 뒤2초가 지나도 해설과 문항을 유지');
    const jj = qdoc.querySelector('#quizJump'); jj.value = '3'; jj.dispatchEvent(new qw.Event('change'));
    await new Promise(r => setTimeout(r, 1150));
    ok(qdoc.querySelector('#quizPosition').textContent === '4 / ' + ch.pool.length, '바로 가기로 이동한 위치가 유지됨');
    jj.value = '0'; jj.dispatchEvent(new qw.Event('change'));
    ok(qdoc.querySelector('#quiz .qchoice-row.is-correct') && qdoc.querySelector('#checkAnswer').disabled, '채점한 문제로 돌아오면 채점 결과 그대로(다시 채점 안 됨)');
    ok(!qdoc.querySelector('#firstQuestion,#unansweredQuestion,#randomQuestion'), '수동 처음·안 푼·아무 문제 선택 버튼 제거');
    qdoc.querySelector('#nextQuestion').click();
    ok(qdoc.querySelector('#quizPosition').textContent === '2 / ' + ch.pool.length, '안 푼 문제로: 다음 미채점 문제');
    qdoc.querySelector('#checkAnswer').click();
    ok(/보기를 먼저 골라/.test(qdoc.querySelector('#quizFeedback').textContent) && !evts.some(e => e.type === 'graded' && e.questionId !== qidA), '고르지 않고 확인하면 채점하지 않고 안내만');
    { // 채점 전에는 카드·풀이가 없고, 오답 채점 뒤에 카드 + 보기마다 풀이(✓ 정답 · × 고른 답) · 보기 순서·ID 그대로
      const qidB = qdoc.querySelector('#quiz .question').getAttribute('data-question'), itB = QCg.questions[qidB], ordB = orderOf(), wrongB = itB.options.find(o => !o.correct).id;
      qdoc.querySelector('#quiz .qchoice[data-option="' + wrongB + '"]').click();
      ok(!qdoc.querySelector('#quiz .qcard') && [...qdoc.querySelectorAll('#quiz .qexp')].every(x => x.hidden && !x.innerHTML) && !qdoc.querySelector('#quiz .qchoice-row.is-correct'), '채점 전: 문항 풀이 카드·보기 풀이·정답 표시 없음(고르기만으로는 드러나지 않음)');
      qdoc.querySelector('#checkAnswer').click();
      const fbB = qdoc.querySelector('#quizFeedback'), rowsB = [...qdoc.querySelectorAll('#quiz .qchoice-row')];
      ok(fbB.querySelector('.qb-core ul') && fbB.querySelectorAll('.qb-option').length===itB.options.length && fbB.querySelectorAll('.qb-option.is-selected').length===1 && rowsB.every(r => { const x = r.querySelector('.qexp'); return x.hidden && x.textContent.trim().length > 0; }) &&
        qdoc.querySelector('#quiz .qchoice-row.is-correct').getAttribute('data-option') === itB.options.find(o => o.correct).id && qdoc.querySelector('#quiz .qchoice-row.is-wrong').getAttribute('data-option') === wrongB && J(orderOf()) === J(ordB) && !/\d+행|check-\d\d|legacy-/.test(fbB.textContent),
        '오답 채점 뒤: 정답/선택 오답 핵심 · 관련 개념은 접힘 · ✓ 정답 · × 고른 답 · 보기 순서 그대로 · 원문 행·내부 ID 없음');
      const otherB = itB.options.find(o => !o.correct && o.id !== wrongB);
      if (otherB) { qdoc.querySelector('#quiz .qchoice[data-option="' + otherB.id + '"]').click(); ok(!qdoc.querySelector('#quiz .qcard') && !qdoc.querySelector('#quiz .qchoice-row.is-correct'), '다른 보기를 다시 고르면 채점 전처럼 카드·정답 표시가 사라짐'); }
    }
    ok(!qdoc.querySelector('#resetSet,#retryQuiz'), '퀴즈 기록 초기화·재풀이 버튼 없음');
    qw.close();
    // 다른 시대로 옮겨도 이전 시대의 채점·고른 답이 새 시대 문항에 섞이지 않음(ID가 다름)
    const qd2 = await open('index.html', '#chapter/samguk/quiz'); const q2 = qd2.window.document;
    ok(qd2.window.HANQ_UNIFIED_QUIZ_SELECTION.eras.samguk.includes(q2.querySelector('#quiz .question').getAttribute('data-question')) && !q2.querySelector('#quiz .qchoice[aria-checked="true"]') && !q2.querySelector('#quizFeedback').className.includes('show'), '삼국 빈칸: 새 시대 문항은 고른 답·채점 없이 시작');
    qd2.window.close();
    const cd = await open('media/goryeo-comic.html'); const cdoc = cd.window.document;
    ok([...cdoc.querySelectorAll('.scene')].every((x, i) => x.querySelector('[data-scene-count]').textContent === String(i + 1).padStart(2, '0')) && cdoc.querySelectorAll('.art-pending').length === (LMAP.art_needed || []).filter(a => a.file === 'goryeo-comic.html').length, '고려 웹툰: 번호 = DOM 순서 · 그림 준비 상자 수 = 요청 수');
    const more = cdoc.querySelector('.scene-more'); more.querySelector('summary').click(); ok(more.open, '웹툰 접힌 보충 펼침');
    cd.window.close();
  }
  { // Retired local wrong-note/run UI is replaced by the premium server study contract.
    // Core immutable storage/run behavior remains covered by test-learning-progress/test-run-controller.
    for (const hash of ['#wrongnotes','#exams','#run/rlegacy001','#account/run/44444444-4444-4444-8444-444444444444']) {
      const d=await open('index.html',hash,{seed:{'other:keep':'yes'}});
      await new Promise(r=>setTimeout(r,10));
      ok(d.window.document.querySelector('.module-head h1').textContent==='나만의 오답노트','예전 오답/모의 주소는 유효 오답노트: '+hash);
      ok(!d.window.document.querySelector('#rcCreate,#acRunCreate,#acReplayRandom,.rc-builder'),'제거된 생성·무작위 UI 없음: '+hash);
      ok(d.window.localStorage.getItem('other:keep')==='yes','기존 다른 저장 기록 보존: '+hash);d.window.close();
    }
  }
  if (fs.existsSync(path.join(ROOT, 'media', 'read-progress.js'))) { // 웹툰 읽음 표시: 실제 웹툰 문서 + 앱의 흐름 목록으로 만든 컷 목록
    ok(cur.html.indexOf('media/read-progress.js') > cur.html.indexOf('media/lecture-notes-opening.js') && cur.html.indexOf('media/lecture-notes.js') < cur.html.indexOf('media/lecture-notes-opening.js') && cur.html.indexOf('media/read-progress.js') < cur.html.indexOf('(function(){\n    var chapters='), 'index.html: 읽음 모듈은 흐름 자료(강의 노트 → 개화기 노트 순) 뒤, 앱보다 먼저');
    const ra = await open('index.html'); const rw = ra.window, RP = rw.HanqRead;
    const EXPECT = { prehistory: [3, 3, 4, 2], gojoseon: [5, 7], samguk: [7, 6, 8, 11], nambuk: [8, 6, 10, 8], goryeo: [4, 3, 4, 4, 5], joseon: [7, 4, 6, 4, 6], islands: [3, 4], opening: [4, 13, 5], colonial: [5, 7, 6], modern: [4, 4, 2, 3, 5] };
    let chapterSum = 0;
    for (const [era, counts] of Object.entries(EXPECT)) {
      const ch = cur.chapters.find(c => c.id === era), flows = rw.HanqReadUI.flows(era);
      const cd = new JSDOM(fs.readFileSync(path.join(ROOT, ch.comic.split('#')[0]), 'utf8')), cdoc = cd.window.document;
      const ents = RP.extractEntries(cdoc, flows.map(f => f.id)), man = RP.buildManifest(era, flows, ents);
      const keys = man.flows.flatMap(f => f.scenes.map(s => s.key));
      ok(J(man.flows.map(f => f.total)) === J(counts) && man.pre.length === 0 && man.flows.every(f => f.total > 0 && f.threshold === Math.ceil(f.total / 2)) && new Set(keys).size === keys.length && man.chapter.total === cdoc.querySelectorAll('.scene').length && man.chapter.threshold === Math.ceil(man.chapter.total / 2),
        era + ': 흐름 ' + flows.length + '개 컷 ' + J(man.flows.map(f => f.total)) + ' (기준 ceil(n/2)) · 장 ' + man.chapter.total + '컷(기준 ' + man.chapter.threshold + ') · 키 겹침 없음 · 흐름 앞 컷 없음');
      ok(man.flows.every(f => f.scenes.every(s => (cdoc.getElementById(s.key) && cdoc.getElementById(s.key).classList.contains('scene')) || /^x[0-9a-f]{8}/.test(s.key))), era + ': 컷 키는 웹툰 문서의 실제 컷 id(없으면 흐름·순서·제목으로 만든 키)');
      chapterSum += man.chapter.total;
      const scenesE = ents.filter(e => e.type === 'scene'), svgE = scenesE.filter(e => e.artInfo && e.artInfo.kind === 'svg-image');
      ok(scenesE.every(e => e.artInfo && e.artInfo.el && e.art) && svgE.every(e => /^svg\|[^|]+\|[^|]+\|/.test(e.art)) && J(RP.buildManifest(era, flows, RP.extractEntries(cdoc, flows.map(f => f.id))).v) === J(man.v),
        era + ': 컷마다 실제 그림(그림 틀 안 img 또는 SVG 외부 image) · SVG 서명에 viewBox·주소·자리 포함(' + svgE.length + '컷) · 같은 문서면 같은 버전');
      const bgE = scenesE.filter(e => e.artInfo && e.artInfo.kind === 'bg');
      if (era === 'islands') ok(bgE.length === 7 && bgE.every(e => /^bg\|[^|]+\.(png|webp|jpe?g)\|[^|]*\|.*--[a-z]/.test(e.art) && e.artInfo.el.classList.contains('art')), 'islands: CSS 배경 그림 컷 7개를 그림 컷(bg)으로 인식 · 서명에 그림판 주소·크기·자르기 값(--x·--y)');
      const comicSrc = fs.readFileSync(path.join(ROOT, ch.comic.split('#')[0]), 'utf8');
      ok(/<script src="comic-scenes\.js"><\/script>/.test(comicSrc) && (era === 'opening' ? fs.existsSync(path.join(ROOT, 'media', 'lecture-notes-opening.js')) : fs.existsSync(path.join(ROOT, 'media', 'lecture-flow-' + era + '.js'))), era + ': 혼자 연 웹툰도 comic-scenes.js와 같은 흐름 자료로 읽음 표시');
      cd.window.close();
    }
    ok(chapterSum === 200, '10개 시대 웹툰의 서로 다른 컷 모두 200(조선은 통합본 하나만 셈)');
    const csSrc = fs.readFileSync(path.join(ROOT, 'media', 'comic-scenes.js'), 'utf8');
    ok(/if\(window\.self!==window\.top\)return;/.test(csSrc) && /attachStandalone/.test(csSrc) && !/'joseon-comic\.html'|'joseon-late-comic\.html'/.test(csSrc), '혼자 연 웹툰 추적은 맨 위 창일 때만 · 조선 전기·후기 단독 웹툰은 세지 않음(통합본 27컷과 겹치지 않게)');
    const samF = rw.HanqReadUI.flows('samguk');
    ok(samF.length === 4 && samF[0].id === 'flow-1' && rw.HanqReadUI.flows('opening').map(f => f.id).join(',') === 'part-fix,part-reform,part-defend', '흐름 목록은 바로 가기와 같은 자료(삼국 flow-1… · 개화기 part-fix·part-reform·part-defend)');
    ok(rw.HanqReadUI.summary('samguk') === null && !rw.document.querySelector('.rp-home'), '처음에는 읽음 표시 없음(들어온 것·위치만으로는 읽음이 아님)');
    rw.close();
  }
  if (fs.existsSync(path.join(ROOT, 'media', 'colonial-summary.js'))) { // 일제 강점기 요약: 뼈대 먼저 · 네 시기 · 원래 정리 보관 · 다른 시대 그대로
    const ca = await open('index.html', '#chapter/colonial/webtoon'); const cd2 = ca.window.document, sp = cd2.querySelector('.summary-panel');
    const bb = sp && sp.querySelector('.cs-backbone'), per = sp ? [...sp.querySelectorAll('.cs-period')] : [];
    ok(bb && per.length === 4 && (bb.compareDocumentPosition(per[0]) & 4) && bb.querySelectorAll('.cs-mile li').length === 5 && /1910[\s\S]*1919[\s\S]*1931[\s\S]*1937[\s\S]*1945/.test(bb.querySelector('.cs-mile').textContent), '일제 강점기 요약: 뼈대(1910·1919·1931·1937·1945)가 네 시기보다 먼저');
    const briefs = bb ? [...bb.querySelectorAll('.cs-brief')] : [];
    ok(briefs.length === 4 && briefs.every(b => J([...b.querySelectorAll('dt')].map(d => d.textContent)) === J(['일본의 통치', '경제 수탈', '우리의 독립운동']) && b.querySelector('.cs-more')) && !bb.querySelector('.cs-card, .cs-tb, .cs-flow') &&
      J([...bb.querySelectorAll('.cs-cat-h')].map(h => h.textContent)) === J(['1910년대무단 통치', '1920년대이른바 문화 통치', '1930년대 이후민족 말살 통치']) && bb.querySelectorAll('.cs-cat-group')[2].querySelectorAll('.cs-brief').length === 2,
      '맨 위는 기준점 다섯 + 시기 넷 짧은 요약만(시기마다 통치 → 경제 수탈 → 독립운동) · ③④는 한 ‘민족 말살 통치’ 묶음 · 긴 원래 문장은 위에 없음');
    ok(per.every(p => J([...p.querySelectorAll('.cs-topic:not(.cs-boundary) > h4')].map(h => h.textContent)) === J(['일본의 통치', '경제 수탈', '우리의 독립운동'])) && per[1].querySelector('.cs-boundary h4') && /1919/.test(per[1].querySelector('.cs-boundary h4').textContent), '시기별 자세히: 시기마다 일본의 통치 → 경제 수탈 → 우리의 독립운동 · ②에 1919 경계 칸');
    ok(sp.querySelectorAll('.cs-card').length === 45 && sp.querySelectorAll('.cs-tb').length === 55 && sp.querySelectorAll('.cs-flow').length === 8 && [...sp.querySelectorAll('.cs-card, .cs-tb')].every(li => li.querySelector('.cs-tag')) && sp.querySelector('.cs-tb .cs-term strong.tb'), '원래 카드 45문장·교재 55행·흐름 8줄이 모두 시기 표시와 함께 · 교재 굵은 글씨 그대로');
    ok(new Set([...sp.querySelectorAll('.cs-note[data-note]')].map(n => n.getAttribute('data-note'))).size >= 9 && /간도 참변/.test(sp.querySelector('.cs-note[data-note="gando"]').textContent) && !/\(강의\)|근거가 없|원래 자료에 (따로 )?없/.test(sp.textContent), '‘더 정확히’ 설명이 해당 문장 옆에 · 구현 사정 글 없음');
    ok(sp.querySelectorAll('.cs-compare .pair').length === 5 && sp.querySelectorAll('.cs-recall .recall-list > li').length === 0 &&
      ['.cs-compare'].every(s => { const d = sp.querySelector(s).closest('details'); return !d || d.id === 'lessonNotes'; }) && (per[3].compareDocumentPosition(sp.querySelector('.cs-compare')) & 4),
      '헷갈리는 짝 5·떠올려 보기 7은 시기별 자세히 아래에 펼쳐 둠(학습 화면의 요약 노트 칸 말고는 다른 접힌 칸 안에 넣지 않음)');
    ok(sp.querySelector('details.cs-archive .study-core') && sp.querySelector('details.cs-archive .study-compare') && !sp.querySelector('details.cs-archive .study-recall') && sp.querySelector('details.source-notes') && sp.querySelectorAll('.cs-more').length === 4 && per.every(p => p.getAttribute('tabindex') === '-1') && sp.querySelectorAll('.cs-footnotes li').length >= 10 && !sp.querySelector('.cs-backbone a[href^="#"]'),
      '시기 구분 전 원래 정리와 원래 카드 10장은 접힌 보관 칸에 그대로 · 시기 자세히 가기 4개 · 참고 자료 각주(주소를 바꾸는 링크 없음)');
    const foldKeys = sel => J([...sp.querySelectorAll(sel + ' .cs-oldnotes .cs-note[data-note]')].map(n => n.getAttribute('data-note')));
    const sixKeys = J(['minrip', 'gando', 'doksa', 'manse', 'changssi', 'jingyong']);
    ok(foldKeys('details.cs-archive') === sixKeys && foldKeys('details.source-notes') === sixKeys && sp.querySelector('details.source-notes .cs-oldnotes').compareDocumentPosition(sp.querySelector('details.source-notes .note-card')) & 4 && sp.querySelectorAll('details.source-notes .note-card').length === 10,
      '접힌 원래 정리·원래 카드 칸을 따로 읽어도: 맨 앞 ‘옛 표현과 함께 확인’에 민립·간도·독사신론·만세보·창씨개명·징용 설명 · 원래 카드 10장 그대로');
    ok(/1920년 10월에 이미 시작/.test(sp.querySelector('details.source-notes .cs-note[data-note="gando"]').textContent) && /위안부/.test(sp.querySelector('details.source-notes .cs-note[data-note="jingyong"]').textContent), '원래 카드 칸의 설명도 같은 글(간도 겹침 · 여자 정신 근로령과 위안부 구분)');
    ca.window.close();
    const oa = await open('index.html', '#chapter/samguk/webtoon'); ok(!oa.window.document.querySelector('.cs-backbone, .cs-period, .cs-oldnotes') && oa.window.document.querySelector('.summary-panel'), '다른 시대(삼국) 요약에는 일제 강점기 뼈대·설명이 없음(다른 시대 그대로)'); oa.window.close();
  }
  { const score=await open('index.html');ok(!score.window.document.querySelector('#homeGrowth')&&!score.window.document.querySelector('.st-grass'),'홈 본문의 중복 성장점수 영역 제거, 기존 계산 모듈·기록은 유지');score.window.close(); }
  // 마이페이지(최소 화면 · 성장점수 기록 창 · 헤더 로그아웃)와 계정 기록 자동 동기화(계정 표시 기록만 · 세대/epoch · 서버 확인) — 각 25초 제한
  for (const f of ['test-account-sync.cjs', 'test-mypage.cjs', 'test-mypage-monster.cjs', 'test-practice-growth-client.cjs', 'test-islands-integration.cjs', 'test-progress-recovery.cjs', 'test-run-draft.cjs', 'test-period-goryeo.cjs', 'test-period-joseon.cjs', 'test-goryeo-learning.cjs', 'test-ancient-learning.cjs', 'test-baekje-learning.cjs', 'test-samguk-nambuk-learning.cjs', 'test-growth-exam-result.cjs', 'test-joseon-core-review.cjs', 'test-cbt-result-analysis.cjs', 'test-auth-restoration.cjs', 'test-cbt-batch-drafts.cjs','test-cbt-stars.cjs','test-cbt-final-submit.cjs', 'test-cbt-explanations.cjs', 'test-cbt-notebook-explanations.cjs', 'test-cbt-auth-transitions.cjs', 'test-cbt-multiple-rounds.cjs', 'test-cbt-public-assets.cjs', 'test-mixed-review-quiz.cjs', 'test-goryeo-joseon-comparison.cjs', 'test-integrated-blank-practice.cjs', 'test-joseon-tabs.cjs','test-joseon-full-summary.cjs','test-era-full-summary.cjs','test-summary-ruler-groups.cjs','test-goryeo-tabs.cjs','test-ancient-artifact-photos.cjs','test-final-era-structure.cjs','test-partial-grading.cjs','test-wrong-view.cjs','test-exam-brief-core.cjs','test-reviewed-quiz.cjs','test-confusion-review.cjs','test-era-study-review.cjs','test-quiz-brief-feedback.cjs','test-connection-choice-quality.cjs']) {
    const r = require('child_process').spawnSync(process.execPath, [path.join(ROOT, 'scripts', f)], { encoding: 'utf8', timeout: 25000, env: process.env });
    ok(r.status === 0, '마이페이지·계정 동기화 검사 ' + f + ' 통과' + (r.status === 0 ? '' : ' — ' + ((r.stdout || '') + (r.stderr || '') + (r.error ? ' ' + r.error.code : '')).trim().split('\n').slice(-4).join(' | ')));
  }
  ok(errs.length === 0, '스크립트 오류 없음' + (errs.length ? ': ' + errs.slice(0, 5).join(' | ') : ''));
}

(async () => {
  if (JSDOM) { try { await dom(); } catch (e) { ok(false, 'DOM 검사 예외: ' + e.stack); } }
  console.log('\n장면 수: ' + Object.entries(counts).map(([k, v]) => k + ' ' + v).join(', ') + ', joseon-all ' + allScenes.length);
  console.log('검사 ' + checks + '개 · 실패 ' + failures + '개');
  process.exit(failures ? 1 : 0);
})();
