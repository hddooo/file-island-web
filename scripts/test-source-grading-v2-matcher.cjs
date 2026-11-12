'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {prepare}=require('../media/source-grading-v2'),{sourceParenthesisVectors:vectors}=require('./source-grading-v2-matcher-vectors.cjs');
// Extract only existing pure legacy comparator functions, never mount UI or call API.
const legacySource=fs.readFileSync(require.resolve('../media/textbook-source-quiz'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext("function normalize(v){return v.normalize('NFC').replace(/\\s+/g,'');}\n"+legacySource.slice(legacySource.indexOf('function sequenceNumbersMatch'),legacySource.indexOf('function answerFeedback')),ctx);
function fixture(expected,c={}){const slot={id:c.slotId||'slot',answerIds:[c.answerId||'answer']},item={id:c.itemId||'item',kind:'blank',verification:{status:'source-verified'},blanks:[slot],answers:[{id:slot.answerIds[0],text:expected}],answer:{text:expected,orderMatters:c.ordered??true}};return {slot,item,model:{schemaVersion:'hanq-source-quiz/1',items:[item]},version:c.sourceVersion||'a'.repeat(64)};}
let checks=0;function eq(a,b){assert.deepEqual(a,b);checks++;}
(async()=>{
for(const [expected,value,wanted,c] of vectors){const f=fixture(expected,c),before=JSON.stringify(f),m=await prepare(f.model,f.version);eq(m.gradeSlot(f.item,f.slot,value,ctx.compare)==='match',wanted);eq(JSON.stringify(f),before);eq(m.gradeSlot(f.item,{id:f.slot.id,answerIds:f.slot.answerIds.slice(),orderMatters:f.item.answer.orderMatters},value,ctx.compare)==='match',wanted);}
const contextual=vectors.find(v=>v[0]==='왜(일본)'&&v[1]==='왜');
for(const key of ['sourceVersion','itemId','answerId','slotId','ordered']){const c={...contextual[3]};c[key]=key==='ordered'?!c[key]:key==='sourceVersion'?'b'.repeat(64):c[key]+'-wrong';const f=fixture(contextual[0],c),m=await prepare(f.model,f.version);eq(m.gradeSlot(f.item,f.slot,'왜',ctx.compare),'different');}
{const f=fixture('왜(다른나라)',contextual[3]),m=await prepare(f.model,f.version);eq(m.gradeSlot(f.item,f.slot,'왜',ctx.compare),'different');f.item.answers[0].text='왜(일본)';assert.throws(()=>m.gradeSlot(f.item,f.slot,'왜',ctx.compare),/binding/);checks++;}
for(const kind of ['sequence','blank','classification']){const f=fixture('1');f.item.kind=kind;f.item.answers.push({id:'answer2',text:'2'});f.slot.answerIds.push('answer2');if(kind==='classification')f.item.responseSlots=[f.slot];const m=await prepare(f.model,f.version);eq(m.gradeSlot(f.item,f.slot,'1/2',ctx.compare),kind==='sequence'?'different':'match');eq(m.gradeSlot(f.item,f.slot,'2/1',ctx.compare),'different');eq(m.gradeSlot(f.item,f.slot,'1/1',ctx.compare),'different');eq(m.gradeSlot(f.item,f.slot,'',ctx.compare),'empty');}
{const f=fixture('Alpha(Beta)');f.item.answer.sequenceTokens=['x'];f.item.answer.text='Annotated answer';f.item.kind='sequence';const m=await prepare(f.model,f.version);eq(m.gradeSlot(f.item,f.slot,'Annotated answer',ctx.compare),'match');eq(m.gradeSlot(f.item,f.slot,'Alpha/Beta',ctx.compare),'different');}
{const f=fixture('Alpha');f.slot.parts=[{id:'part',answerIds:['answer'],answer:{orderMatters:false}}];const m=await prepare(f.model,f.version);eq(m.gradeSlot(f.item,{id:'part',answerIds:['answer'],orderMatters:false},'Alpha',ctx.compare),'match');assert.throws(()=>m.gradeSlot(f.item,{id:'part',answerIds:['answer'],orderMatters:true},'Alpha',ctx.compare),/binding/);checks++;}
await assert.rejects(prepare({schemaVersion:'wrong',items:[]},'a'.repeat(64)),/binding/);checks++;
eq(Object.isFrozen(await prepare(fixture('A').model,'a'.repeat(64))),true);
{const f=fixture('Alpha(Beta)'),m=await prepare(f.model,f.version);f.model.source={sha256:'changed'};assert.throws(()=>m.gradeSlot(f.item,f.slot,'Alpha/Beta',ctx.compare),/binding/);checks++;}
{const browser={crypto:require('node:crypto').webcrypto,TextEncoder};vm.createContext(browser);vm.runInContext(fs.readFileSync(require.resolve('../media/source-grading-v2'),'utf8'),browser);eq(typeof browser.HanqSourceGradingV2.prepare,'function');const f=fixture('Alpha(Beta)'),m=await browser.HanqSourceGradingV2.prepare(f.model,f.version);eq(m.gradeSlot(f.item,f.slot,'Alpha/Beta',ctx.compare),'match');}
console.log(JSON.stringify({checks,sharedVectors:vectors.length,failures:0,scope:'held matcher only; no activation or network; raw data preserved'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
