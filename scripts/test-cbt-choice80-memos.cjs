'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const window={};for(const f of ['cbt-explanation-data','cbt-explanation80-data','cbt-explanations','cbt-round-materials'])vm.runInNewContext(fs.readFileSync('media/'+f+'.js','utf8'),{window});
const copy=x=>JSON.parse(JSON.stringify(x));
function question(item){
 const old=copy(item);old.options.forEach(o=>{delete o.studyMemo;});
 return {questionId:item.id,version:item.v,exam:80,number:item.number,points:item.points,options:copy(old.options),review:{status:'unanswered',correctNumber:item.answer,correctOptionId:item.options[item.answer-1].id,item:old,options:copy(old.options)}};
}
const data=window.HANQ_CBT_EXPLANATIONS_80.items,notes=window.HanqCbtRoundMaterials.choiceNotes;
let total=0,memos=0,correct=0,questions=0;
for(const item of Object.values(data)){
 const q=question(item),before=JSON.stringify(q),original=JSON.stringify(item);
 assert(window.HanqCbtExplanations.resolve(q,'final'));const lines=notes(q);assert.equal(lines.length,5);
 let matched=false;
 item.options.forEach((o,i)=>{
  total++;
  if(o.studyMemo){
   memos++;correct+=Number(o.correct);matched=true;
   const base=o.studyMemo.clue+' · '+o.studyMemo.subject;
   assert(lines[i].startsWith(base+' · '),o.id+': '+lines[i]);
   const extras=lines[i].slice(base.length+3).split(', ');assert(extras.length>=1&&extras.length<=3);assert.equal(new Set(extras).size,extras.length);
  }else assert.equal(lines[i],o.review[0].replace(/\*\*/g,'').replace(/\s+/g,' ').trim().split(/[.!?](?: |$)/)[0],o.id+' untouched prose');
 });
 questions+=Number(matched);
 assert.equal(JSON.stringify(q),before);assert.equal(JSON.stringify(item),original);
 // Display-only memos must not bypass any authoritative resolver identity check.
 for(const change of [x=>x.version='wrong',x=>x.review.item.v='wrong',x=>x.options[0].id='wrong',x=>x.review.correctOptionId='wrong']){
  const bad=copy(q);change(bad);assert.equal(window.HanqCbtExplanations.resolve(bad,'final'),null);
  // Even if old stored data contains a memo, fallback may only use old prose.
  bad.review.item.options.forEach(o=>o.studyMemo={clue:'FORGED',subject:'숙종'});
  assert(notes(bad).every(x=>!x.includes('FORGED')));
 }
}
assert.equal(notes(question(data['exam-80-27']))[1],'백두산정계비(1712)·조청 경계 · 숙종 · 환국, 금위영, 초량왜관');
assert.equal(notes(question(data['exam-80-42']))[2],'북간도 중광단 조직 · 대종교 · 나철, 단군 숭배');
assert.equal(notes(question(data['exam-80-06']))[1],'국학 설치 · 신문왕 · 김흠돌의 난, 관료전, 녹읍 폐지');
assert.equal(notes(question(data['exam-80-11']))[2],'광덕·준풍 · 고려 광종 · 노비안검법, 과거제');
assert.equal(total,250);assert.equal(memos,28);assert(correct>0&&correct<memos);
console.log('PASS actual 80th resolver fixtures: '+memos+'/'+total+' memo choices ('+correct+' correct, '+(memos-correct)+' wrong), '+questions+'/50 questions; '+(total-memos)+' untouched prose; exact identity guards and immutable original data.');
