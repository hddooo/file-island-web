'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
require('../media/textbook-source-quiz');
const original='해당되는 정부를 쓰세요(ex: 이승만/ 전두환/ 김대중)',corrected='각 항목에 해당하는 정부를 쓰세요.';
const sha='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
function fixture(){
const id='synthetic-government',aid=id+':answer:0',bid=id+':blank';
return {schemaVersion:'hanq-source-quiz/1',id:'modern',title:'Synthetic',source:{sha256:sha,pdfPages:[137],printedPages:[130]},subtopics:[{id:'government',title:original}],items:[{id,order:1,subtopicId:'government',originalNumber:1,pdfPage:137,printedPage:130,kind:'fill-in',text:'Synthetic question',sourceText:'(1) Synthetic question (   )',segments:[{type:'text',text:'Synthetic question '},{type:'blank',id:bid,placeholder:'(   )',answerIds:[aid]}],blanks:[{id:bid,placeholder:'(   )',answerIds:[aid]}],answer:{text:'노태우',parts:['노태우'],orderMatters:false},answers:[{id:aid,text:'노태우'}],verification:{status:'source-verified',textVerified:true,answerPairVerified:true}}]};
}
(async()=>{
const dom=new JSDOM('<div id="app"></div>',{url:'https://synthetic.test'}),host=dom.window.document.getElementById('app');
dom.window.HTMLElement.prototype.scrollIntoView=function(){};
const options={loadProgress:async()=>({version:'fixture',revision:0,workspace:{cursor:0,status:'active',responses:{}}}),saveProgress:async()=>{throw Error('No writes allowed')}};
let data=fixture(),before=JSON.stringify(data),c=HanqTextbookSourceQuiz.render(host,data,options);await c.ready;
assert.equal(host.querySelector('.textbook-source-quiz-instruction').textContent,corrected);
assert.equal(JSON.stringify(data),before);assert.equal(data.items[0].answer.text,'노태우');c.cleanup();
for(const alter of [d=>d.id='other',d=>d.source.sha256='0'.repeat(64),d=>d.subtopics[0].title='Another instruction']){
data=fixture();alter(data);c=HanqTextbookSourceQuiz.render(host,data,options);await c.ready;assert.equal(host.querySelector('.textbook-source-quiz-instruction').textContent,data.subtopics[0].title);c.cleanup();
}
if(process.env.GOVERNMENT_QUIZ_FIXTURE){
data=JSON.parse(fs.readFileSync(process.env.GOVERNMENT_QUIZ_FIXTURE));before=JSON.stringify(data);const answerSignature=JSON.stringify(data.items.map(i=>[i.id,i.answer,i.answers,i.blanks]));
c=HanqTextbookSourceQuiz.render(host,data,options);await c.ready;
assert.equal(host.querySelector('.textbook-source-quiz-instruction').textContent,corrected);assert.equal(host.querySelectorAll('[data-source-item-id]').length,data.items.length);
assert.equal(JSON.stringify(data),before);assert.equal(JSON.stringify(data.items.map(i=>[i.id,i.answer,i.answers,i.blanks])),answerSignature);
assert(data.items.some(i=>i.answer.text.includes('노태우')));c.cleanup();
}
dom.window.close();console.log('PASS government instruction only: era/source/title guards; original answers, IDs and data unchanged; no writes');
})().catch(e=>{console.error(e);process.exitCode=1;});
