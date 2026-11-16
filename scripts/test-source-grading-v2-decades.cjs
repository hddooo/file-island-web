'use strict';
// Synthetic public numeric fixtures only. No private content, network, storage or XP changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {prepare}=require('../media/source-grading-v2');
const source=fs.readFileSync(require.resolve('../media/textbook-source-quiz'),'utf8'),ctx={};
vm.createContext(ctx);
vm.runInContext("function normalize(v){return v.normalize('NFC').replace(/\\s+/g,'');}\n"+source.slice(source.indexOf('function sequenceNumbersMatch'),source.indexOf('function answerFeedback')),ctx);
const version='a'.repeat(64);
function fixture(text){const slot={id:'slot',answerIds:['answer']},item={id:'synthetic-decade',kind:'fill-in',verification:{status:'source-verified',textVerified:true,answerPairVerified:true},blanks:[slot],answers:[{id:'answer',text}],answer:{text,parts:[text],orderMatters:false}};return {slot,item,model:{schemaVersion:'hanq-source-quiz/1',source:{sha256:'b'.repeat(64)},items:[item]}};}
const vectors=[];
for(const digits of ['190','990','1000','1920','1930','2000','9990']){
 for(const suffix of ['','년','년도','년대'])vectors.push([digits+'년대',String(Number(digits)+10)+suffix,false]);
 for(const suffix of ['','년','년도','년대'])for(const value of [digits+suffix,' '+digits+' '+suffix+' ',(digits+suffix).normalize('NFD')])vectors.push([digits+'년대',value,true]);
 for(const value of ['','1921','1931년','1910','1940년대','일제 말','일제말','1930년대 말','1920년 1월','1920.1.1','1920년대/1930년대','1920년대,1920년대','+1920','01920','1920대','1920년대도','１９２０'])vectors.push([digits+'년대',value,false]);
}
for(const expected of ['1920','1920년','1920년도','1921년대','20년대','10000년대','0190년대','일제 말','일제말','1920년대 말','1920년대(시기)','1920년대/1930년대','1920년 1월','1920.1.1'])vectors.push([expected,'1920',expected==='1920']);
let checks=0,parityChecks=0;
const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;};
async function run(){
 const server=process.env.HANQ_GRADING_API_RUNTIME?require(process.env.HANQ_GRADING_API_RUNTIME):null;
 for(const [expected,value,wanted] of vectors){
  const f=fixture(expected),before=JSON.stringify(f.model),matcher=await prepare(f.model,version);
  eq(matcher.gradeSlot(f.item,f.slot,value,ctx.compare)==='match',wanted,JSON.stringify([expected,value]));
  eq(matcher.gradeSlot(f.item,{id:'slot',answerIds:['answer'],orderMatters:false},value,ctx.compare)==='match',wanted,'renderer slot projection');
  eq(JSON.stringify(f.model),before,'raw model unchanged');
  if(server){eq(server.sourceGrade(f.item,[value],2,version),wanted,'API parity');parityChecks++;}
 }
 for(const change of [
  f=>{f.item.kind='sequence';},
  f=>{f.item.kind='classification';f.item.responseSlots=[f.slot];},
  f=>{f.item.kind='blank';},
  f=>{f.item.blanks=[{id:'outer',answerIds:['answer'],parts:[f.slot]}];},
  f=>{f.item.blanks.push({id:'second',answerIds:['second-answer']});f.item.answers.push({id:'second-answer',text:'1930년대'});},
  f=>{f.slot.answerIds.push('second-answer');f.item.answers.push({id:'second-answer',text:'시기'});f.item.answer.parts.push('시기');},
  f=>{f.item.answer.sequenceTokens=['1920년대'];}
 ]){
  const f=fixture('1920년대');change(f);const matcher=await prepare(f.model,version);
  eq(matcher.gradeSlot(f.item,f.slot,'1920',ctx.compare),'different','no widening for other shapes');
 }
 for(const change of [
  f=>{f.item.id+='-wrong';},f=>{f.slot.id+='-wrong';},f=>{f.slot.answerIds=['other'];},
  f=>{f.item.kind='classification';},f=>{f.item.answer.orderMatters=true;},
  f=>{f.item.answers[0].text='1930년대';},f=>{f.item.blanks.push({id:'second',answerIds:['answer']});},
  f=>{f.slot.parts=[{id:'part',answerIds:['answer']}];},f=>{f.model.source.sha256='c'.repeat(64);}
 ]){
  const f=fixture('1920년대'),matcher=await prepare(f.model,version);change(f);
  assert.throws(()=>matcher.gradeSlot(f.item,f.slot,'1920',ctx.compare),/binding/);checks++;
 }
 for(const expected of ['1920년대','1930년대','일제 말','1920년','1920년대(시기)']){
  const f=fixture(expected),matcher=await prepare(f.model,version);
  eq(matcher.gradeSlot(f.item,f.slot,expected,ctx.compare),'match','canonical literal preserved');
 }
 eq(ctx.compare('1920',['1920년대'],false,'fill-in',''),'different','legacy v1 comparator unchanged');
 eq(ctx.compare('1920년대',['1920년대'],false,'fill-in',''),'match');
 eq(fs.readFileSync('index.html','utf8').includes('<meta name="hanq-source-grading" content="2">'),true,'existing V2 activation');
 const practice=fs.readFileSync('media/history81-workspace.js','utf8');
 eq(practice.includes('gradingVersion:grading?2:1'),true,'existing practice uses selected V2 renderer');
 eq(practice.includes("if(practice)throw Error('practice_persistence_disabled')"),true,'practice remains nonpersistent');
 console.log(JSON.stringify({vectors:vectors.length,checks,parityChecks,failures:0,scope:'directional single ordinary fill-in only; legacy/storage/XP untouched; synthetic fixtures'}));
}
module.exports={fixture,vectors,version};
if(require.main===module)run().catch(error=>{console.error(error);process.exitCode=1;});
