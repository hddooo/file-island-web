'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {prepare}=require('../media/source-grading-v2');
const version='a'.repeat(64),compare=(v,e)=>v.replace(/\s/g,'')===e[0].replace(/\s/g,'')?'match':'different';
const {positive:groups,negative:negatives}=require('../test/canonical-input-aliases.json');
function fixture(text){const slot={id:'b',answerIds:['a']},item={id:'synthetic',kind:'fill-in',verification:{status:'source-verified'},blanks:[slot],answers:[{id:'a',text}],answer:{text,orderMatters:false}};return {item,slot,model:{schemaVersion:'hanq-source-quiz/1',source:{sha256:'b'.repeat(64)},items:[item]}};}
(async()=>{
const server=process.env.HANQ_GRADING_API_RUNTIME?require(process.env.HANQ_GRADING_API_RUNTIME):null;let checks=0,real=0;
for(const [canonical,value,wanted] of [...groups.flatMap(([c,vs])=>vs.flatMap(v=>[[c,v,true],[c,' '+v.normalize('NFD')+' ',true]])),...negatives.map(([c,v])=>[c,v,false])]){
const f=fixture(canonical),before=JSON.stringify(f.model),matcher=await prepare(f.model,version);
assert.equal(matcher.gradeSlot(f.item,f.slot,value,compare)==='match',wanted,JSON.stringify([canonical,value]));if(server)assert.equal(server.sourceGrade(f.item,[value],2,version),wanted,'API parity '+canonical+' / '+value);
assert.equal(JSON.stringify(f.model),before);checks++;
}
for(const kind of ['sequence','classification']){const f=fixture('5·18 민주화운동');f.item.kind=kind;if(kind==='classification')f.item.responseSlots=[f.slot];const m=await prepare(f.model,version);assert.notEqual(m.gradeSlot(f.item,f.slot,'518',compare),'match');checks++;}
for(const file of (process.env.HANQ_ALIAS_QUIZ_FIXTURES||'').split(';').filter(Boolean)){
const model=JSON.parse(fs.readFileSync(file)),before=JSON.stringify(model),matcher=await prepare(model,version);
for(const item of model.items){const group=groups.find(([c])=>c.replace(/\s/g,'')===item.answer.text.replace(/\s/g,''));if(!group)continue;
for(const value of group[1]){assert.equal(matcher.gradeSlot(item,item.blanks[0],value,compare),'match');if(server)assert(server.sourceGrade(item,[value],2,version));real++;}}
assert.equal(JSON.stringify(model),before);
}
console.log(JSON.stringify({checks,realFixtureInputs:real,serverParity:!!server,failures:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
