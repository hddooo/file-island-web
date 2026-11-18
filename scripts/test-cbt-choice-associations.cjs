'use strict';
const assert=require('assert/strict'),fs=require('fs'),vm=require('vm');
const window={};vm.runInNewContext(fs.readFileSync('media/cbt-round-materials.js','utf8'),{window});
const note=(raw,extra={})=>window.HanqCbtRoundMaterials.choiceNotes({options:[{id:'c1'}],review:{item:{options:[{id:'c1',review:raw==null?[]:[raw],...extra}]}}})[0];
assert.equal(note('**백두산정계비** — 숙종: 설명'),'백두산정계비 · 숙종 · 환국, 금위영, 초량왜관');
assert.equal(note('**중광단 조직** — 대종교: 설명'),'중광단 조직 · 대종교 · 나철, 단군 숭배');
assert.equal(note('**해동통보** — 고려 숙종: 설명'),'해동통보 · 고려 숙종 · 별무반, 서적포');
assert.equal(note('**평양천도** — 고구려 장수왕: 설명'),'평양천도 · 고구려 장수왕 · 남진, 한성 함락');
assert.equal(note('**환국·금위영·초량 왜관** — 조선 숙종: 설명'),'환국·금위영·초량 왜관 · 조선 숙종');
for(const raw of ['숙종 — 알 수 없는 주제: 설명','단서 — 숙종의 정책: 설명','단서 — 조선 숙종과 고려 숙종: 설명','단서 — 조선 후기: 설명','단서 — 성종: 설명','숙종: 설명'])assert.equal(note(raw),raw.split(': ')[0].replace(/ — /g,' · '));
assert.equal(note(null),'확인된 해설 없음');
assert.equal(note('숙종',{id:'wrong-id'}),'확인된 해설 없음');
assert.equal(note('**중광단 조직** — 대종교: 설명',{correct:true}),note('**중광단 조직** — 대종교: 설명',{correct:false}));
// Resolver remains authoritative over the fallback; no guessing from clue or q text.
window.HanqCbtExplanations={resolve:()=>({options:[{id:'c1',review:['단서 — 고려 숙종: 설명']}]})};
assert.equal(note('단서 — 숙종: 설명'),'단서 · 고려 숙종 · 해동통보, 별무반, 서적포');
delete window.HanqCbtExplanations;
// Check all curated aliases: bounded additions, no source mutation, useful coverage.
const script=fs.readFileSync('media/cbt-round-materials.js','utf8');
const rows=script.match(/\['[^'\n]+',\s*\[[^\n]+\]\]/g).filter(x=>x.includes("'],")||x.endsWith(']]'));
assert.equal(rows.length,77);
for(const row of rows){const [aliases,hints]=vm.runInNewContext(row);for(const alias of aliases.split('|')){
 const raw='연결 단서 — '+alias+': 설명';
 const extra=hints.filter(h=>!alias.replace(/\s/g,'').includes(h.replace(/\s/g,'')));assert.equal(note(raw),'연결 단서 · '+alias+(extra.length?' · '+extra.join(', '):''));assert(hints.length>=1&&hints.length<=3);assert.equal(new Set(hints).size,hints.length);
}}
console.log('PASS exact-subject associations, no fallback guesses, dedupe, correct/wrong parity, '+rows.length+' entity groups');
