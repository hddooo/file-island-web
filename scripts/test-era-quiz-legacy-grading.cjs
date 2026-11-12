'use strict';
// Compare current grading with the last production FE. Optional private fixtures stay local.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),cp=require('node:child_process');
const base=cp.execFileSync('git',['show','aba1d25c5d5509f2a29d11018e3ce883cd2da8ca:media/textbook-source-quiz.js'],{encoding:'utf8'}),current=fs.readFileSync('media/textbook-source-quiz.js','utf8');
const slice=(s,a,b)=>s.slice(s.indexOf(a),s.indexOf(b,s.indexOf(a)));
assert.equal(slice(current,'  function sequenceNumbersMatch','  function answerFeedback'),slice(base,'  function sequenceNumbersMatch','  function answerFeedback'));
assert.equal(slice(current,'  function gradePractice','  // Presentation only.'),slice(base,'  function gradePractice','  // Presentation only.'));
function api(source){const c={};vm.runInNewContext(source,c);return c.HanqTextbookSourceQuiz;}
const old=api(base),now=api(current),root=process.argv[2];let cases=0,items=0;
if(root)for(const era of ['prehistory','ancient','nambuk','goryeo','joseon','opening','colonial','modern']){
 const model=JSON.parse(fs.readFileSync(path.join(root,'quizzes',era+'.json'),'utf8'));
 for(const item of model.items){items++;const original=JSON.stringify(item),values=now.practiceSlots(item).map(slot=>slot.answerIds.map(id=>item.answers.find(a=>a.id===id).text).join(item.kind==='sequence'?(item.answer.sequenceSeparator||''):', '));
  const variants=[values,values.map(v=>v.normalize('NFD')),values.map(v=>' '+v+' '),values.map(()=>''),values.map(()=> '오답'),values.map(v=>v.replace(/\s+/g,'')),values.map(v=>v.replace(/\s*\(=?([^()]+)\)/g,', $1')),values.map(v=>v.replace(/\s*\(=?([^()]+)\)/g,' / $1')),values.map(v=>v.match(/\(=([^()]+)\)/)?.[1]||v),values.map((v,i)=>i?'':v)];
  for(const answers of variants){assert.equal(JSON.stringify(now.gradePractice(item,answers)),JSON.stringify(old.gradePractice(item,answers)),era+' '+item.id);cases++;}assert.equal(JSON.stringify(item),original);
 }
}
console.log(JSON.stringify({passed:true,identicalGradingFunctions:true,items,cases,productionWrites:0,scope:'old-production FE grading, independently matched to live API sourceGrade; pending extensions excluded'}));
