'use strict';
// Optional local authorized source data. Never copy textbook bytes into this repository.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const dir=process.argv[2];assert(dir,'Pass the local 81-edition semantic directory');
const revision='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
assert.equal(JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'))).source.sha256,revision);
const targets=[
 {key:'불국사3층석탑석가탑',answers:['석가탑','불국사 3층 석탑']},
 {key:'촌락문서',answers:['촌락문서','민정 문서']},
 {key:'9산선문9산문',answers:['9산 선문','9산문']},
 {key:'대조영고왕',answers:['대조영','고왕']}
];let checked=0,guards=0;const found=new Set();
for(const n of [32,35]){
 const file=path.join(dir,'pages/page-'+String(n).padStart(3,'0')+'.json'),bytes=fs.readFileSync(file),data=JSON.parse(bytes);assert.equal(data.sourceSha256,revision);data.blocks=data.blocks.filter(b=>b.studySection==='concept');
 const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://recall-source.invalid'}).window,host=w.document.querySelector('main');
 for(const f of ['blank-recall','textbook-semantic'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
 const renderer=w.HanqTextbookSemantic.render(host,data,{}),before=host.innerHTML,recall=w.HanqBlankRecall.decorate(host);recall.grade();
 for(const slot of host.querySelectorAll('.blank-recall-slot')){
  const source=slot.querySelector('.blank-recall-feedback').textContent.slice(2),key=w.HanqBlankRecall.normalize(source),target=targets.find(t=>t.key===key),input=slot.querySelector('textarea');
  if(target){for(const answer of target.answers){input.value=answer;input.dispatchEvent(new w.Event('blur'));assert(slot.classList.contains('is-correct'),JSON.stringify({page:n,answer}));checked++;}found.add(target.key);}
  if(key==='당의등주공격장문휴'){for(const answer of ['장문휴','당의 등주 공격']){input.value=answer;input.dispatchEvent(new w.Event('blur'));assert(slot.classList.contains('is-wrong'));guards++;}}
 }
 recall.stop();assert.equal(host.innerHTML,before);renderer.cleanup();assert.equal(host.children.length,0);assert.deepEqual(fs.readFileSync(file),bytes);w.close();
}
assert.equal(found.size,targets.length);assert.equal(guards,2);
console.log(JSON.stringify({sourceRevision:revision,pages:[32,35],synonymGroups:found.size,accepted:checked,contextGuards:guards,sourceBytesUnchanged:true,noPersistentWrites:true}));
