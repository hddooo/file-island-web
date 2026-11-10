'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const {matchesAnswer}=require('../media/blank-recall');
const groups=[
  {sources:['석가탑(불국사 3층 석탑)','불국사3층석탑 (석가탑)','석가탑（불국사 삼층 석탑）','석가탑','불국사 3층 석탑'],answers:['석가탑','불국사3층석탑','불국사 삼층 석탑','불국사 3층 석탑']},
  {sources:['촌락 문서(민정 문서)','민정문서 (촌락문서)','촌락문서','민정문서'],answers:['촌락문서','촌락 문서','민정문서','민정 문서']},
  {sources:['9산 선문(9산문)','9산문(9산 선문)'],answers:['9산 선문','9산문']},
  {sources:['대조영(고왕)','고왕(대조영)'],answers:['대조영','고왕']}
];
let positives=0,negatives=0;
for(const {sources,answers} of groups)for(const source of sources){
 for(const answer of answers){assert(matchesAnswer(answer,source),JSON.stringify({source,answer}));positives++;}
 assert(matchesAnswer(source,source));positives++;
 assert(matchesAnswer(source.normalize('NFD'),source));positives++;
 for(const answer of ['','   ','다보탑','불국사','3층 석탑','촌락','문서','석가탑, 민정문서','석가탑?','민정 문서!']){assert(!matchesAnswer(answer,source),JSON.stringify({source,answer}));negatives++;}
}
// Parenthetical context is not automatically an alias. Keep meaningful punctuation/order.
for(const [answer,source] of [
 ['백제','백제(무령왕릉)'],['무령왕릉','백제(무령왕릉)'],['신문왕','신문왕(녹읍 폐지)'],
 ['668','고구려 멸망(668)'],['녹읍 폐지','신문왕(녹읍 폐지)'],
 ['석가탑','석가탑(다보탑)'],['다보탑','석가탑(다보탑)'],
 ['민정문서','촌락문서(인구 조사)'],['석가탑','석가탑(불국사 3층 석탑)의 특징'],
 ['석가탑','석가탑(불국사 3층 석탑)(통일 신라)'],['석가탑','석가탑(불국사 3층 석탑'],
 ['민정문서','촌락문서(민정문서, 호적)'],['123','1,2,3'],['2,1','1,2'],['625','6.25'],['장문휴','당의 등주 공격(장문휴)'],['당의 등주 공격','당의 등주 공격(장문휴)']
]){assert(!matchesAnswer(answer,source),JSON.stringify({source,answer}));negatives++;}
assert(matchesAnswer('백제무령왕릉','백제(무령왕릉)'),'existing punctuation behavior');
assert(matchesAnswer('왕','“왕”'));
const dom=new JSDOM('<main><p><strong>석가탑</strong><b>(불국사 3층 석탑)</b></p><p><strong>촌락 문서 (민정 문서)</strong></p><p><strong>백제(무령왕릉)</strong></p></main>',{runScripts:'outside-only',url:'https://recall-alias.invalid'}),w=dom.window,host=w.document.querySelector('main'),original=host.innerHTML;
w.eval(fs.readFileSync('media/blank-recall.js','utf8'));
let recall=w.HanqBlankRecall.decorate(host),inputs=host.querySelectorAll('textarea');assert.equal(recall.count,3);
inputs[0].value='석가탑';inputs[0].dispatchEvent(new w.Event('blur'));assert.equal(host.querySelectorAll('.is-correct').length,1);
inputs[1].value='민정문서';inputs[1].dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));assert.equal(host.querySelectorAll('.is-correct').length,2);
inputs[2].value='백제';assert.equal(recall.grade(),2);assert.equal(inputs[2].getAttribute('aria-invalid'),'true');
inputs[0].value='다보탑';inputs[0].dispatchEvent(new w.Event('input'));assert(!inputs[0].closest('.blank-recall-slot').classList.contains('is-correct'));assert.equal(recall.grade(),1);
inputs[0].value='불국사 3층 석탑';inputs[2].value='백제(무령왕릉)';assert.equal(recall.grade(),3);
recall.reset();assert([...inputs].every(n=>n.value===''&&!n.hasAttribute('aria-invalid')));assert.equal(host.querySelectorAll('.is-correct,.is-wrong').length,0);
inputs[0].value='석가탑';inputs[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true}));assert.equal(host.querySelectorAll('.is-correct,.is-wrong').length,0);
recall.stop();assert.equal(host.innerHTML,original);recall=w.HanqBlankRecall.decorate(host);inputs=host.querySelectorAll('textarea');assert([...inputs].every(n=>n.value===''));recall.stop();assert.equal(host.innerHTML,original);w.close();
console.log(JSON.stringify({positives,negatives,dom:true,sourceRestored:true,scope:'ephemeral recall only; no persisted quiz, API or XP changes'}));
