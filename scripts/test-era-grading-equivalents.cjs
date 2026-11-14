'use strict';
// Synthetic fixtures only. Optional API runtime path enables actual cross-repo parity.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {prepare}=require('../media/source-grading-v2');
const {vectors}=require('./era-grading-equivalents.json');
const server=process.env.HANQ_GRADING_API_RUNTIME?require(process.env.HANQ_GRADING_API_RUNTIME):null;
const source=fs.readFileSync(require.resolve('../media/textbook-source-quiz'),'utf8'),ctx={};
vm.createContext(ctx);
vm.runInContext("function normalize(v){return v.normalize('NFC').replace(/\\s+/g,'');}\n"+source.slice(source.indexOf('function sequenceNumbersMatch'),source.indexOf('function answerFeedback')),ctx);
(async()=>{
 let checks=0,parityChecks=0;
 for(const [index,v] of vectors.entries())for(const shape of ['blank','parts','classification']){
  const answers=v.expected.map((text,i)=>({id:`answer-${i}`,text})),slot={id:'slot',answerIds:answers.map(a=>a.id)};
  const item={id:'synthetic',kind:shape==='classification'?shape:'blank',verification:{status:'source-verified'},answers,answer:{text:v.expected.join(','),orderMatters:v.ordered},blanks:shape==='parts'?[{id:'outer',answerIds:[],parts:[slot]}]:[slot],...(shape==='classification'?{responseSlots:[slot]}:{})};
  const model={schemaVersion:'hanq-source-quiz/1',items:[item]},before=JSON.stringify(model);
  const matcher=await prepare(model,'a'.repeat(64)),actual=matcher.gradeSlot(item,slot,v.value,ctx.compare)==='match';
  assert.equal(actual,v.correct,`${index} ${v.label} ${shape}`);
  assert.equal(JSON.stringify(model),before);checks+=2;
  if(server){assert.equal(server.sourceGrade(item,[v.value],2),actual,`API parity ${index} ${shape}`);parityChecks++;}
 }
 console.log(JSON.stringify({vectors:vectors.length,checks,parityChecks,failures:0,scope:'public terms and synthetic fixtures; no network or private quiz data'}));
})().catch(error=>{console.error(error);process.exitCode=1;});
