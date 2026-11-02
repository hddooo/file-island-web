'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {JSDOM} = require('../.test-tools/node_modules/jsdom');
const renderer = require('../media/textbook-four-choice');
const library = require('../media/textbook-semantic-library');
let checks=0; function ok(v,m){assert.ok(v,m);checks++;}
const item = n => ({id:'i'+n,reviewStatus:'verified',sourceQuestion:{sourceText:'('+n+') <script> 그대로 (    )',source:{pdfPage:14,printedPage:7}},options:['a','b','c','d'].map(id=>({id,text:'보기 '+id,whyIncorrect:id==='a'?null:'원문 근거 확인'})),correctOptionId:'a'});
const OLD='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442',QUIZ_DIGEST='a'.repeat(64);
const data={sourceSha256:OLD,sourceQuizSha256:QUIZ_DIGEST,schemaVersion:'hanq-source-four-choice/1',id:'prehistory-initial-four-choice',eraId:'prehistory',items:[item(1),item(2)]};
(async()=>{
const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main');
let child=renderer.render(host,data);
ok(!host.querySelector('script'),'no HTML injection');
ok(host.textContent.includes('<script> 그대로'),'original source string preserved');
ok(host.querySelectorAll('input').length===4,'exactly four choices');
const byText=t=>[...host.querySelectorAll('button')].find(b=>b.textContent===t);
ok(byText('정답 확인').disabled,'answer required');
let input=host.querySelector('input[value=b]');input.checked=true;input.dispatchEvent(new dom.window.Event('change'));
byText('정답 확인').click();ok(host.querySelector('[data-choice-result]').textContent.includes('다시 확인'),'wrong marked');
ok([...host.querySelectorAll('input')].every(i=>i.disabled),'graded choices frozen');
ok(host.textContent.includes('교재 정답: 보기 a'),'source answer shown');
byText('다음').click();ok(host.querySelector('[data-choice-position]').textContent.startsWith('2 /'),'next');
byText('이 화면에서 틀린 문제 다시 풀기').click();ok(host.querySelector('[data-choice-position]').textContent.startsWith('1 / 1'),'only wrong retry');
ok(!host.querySelector('[data-choice-result]'),'retry unanswered');
child.cleanup();ok(!host.textContent,'cleanup removes private questions');
for(const mutate of [d=>d.items[0].options.pop(),d=>d.items[0].options[1].text='보기 a',d=>d.items[0].correctOptionId='x',d=>d.items[0].reviewStatus='pending']){const d=JSON.parse(JSON.stringify(data));mutate(d);ok(!renderer.valid(d),'invalid data rejected');}
for(const file of process.argv.slice(2)){const d=JSON.parse(fs.readFileSync(file));ok(renderer.valid(d),'actual source schema');child=renderer.render(host,d);
for(const item of d.items){
 ok(host.querySelector('[data-source-question]').textContent===item.sourceQuestion.sourceText,'actual source string exact');
 ok(host.querySelector('[data-source-question]').getAttribute('data-source-item-id')===item.sourceItemId,'stable original blank ID');
 const radios=[...host.querySelectorAll('input')];ok(radios.length===4,'actual four options');
 const correct=radios.find(r=>r.value===item.correctOptionId);correct.checked=true;correct.dispatchEvent(new dom.window.Event('change'));byText('정답 확인').click();
 ok(host.querySelector('[data-choice-result]').textContent.includes('정답이에요.'),'actual answer graded');
 for(const o of item.options)ok(host.textContent.includes(o.text),'actual option copied');
 byText('다음').click();
}child.cleanup();}
let listener, state={signedIn:true,ownerId:'member',epoch:1};const calls=[];
const api={state:()=>state,onChange:f=>{listener=f;return()=>{};},textbookSemanticManifest:async()=>({source:{sha256:OLD,totalPdfPages:144},schemaVersion:'hanq-semantic-manifest/1',pages:[],quizzes:[],fourChoices:[{id:'prehistory',itemCount:2,sourceQuizSha256:QUIZ_DIGEST}]}),textbookSemanticChoices:async id=>{calls.push(id);return data;}};
const coordinator=library.create({api,document:dom.window.document,eraFor:()=>({id:'prehistory',from:8,to:15}),choiceRenderer:renderer});
await coordinator.mount(host,'prehistory');host.querySelector('[data-mode=choices]').click();await new Promise(r=>setTimeout(r,10));
ok(calls.length===1,'coordinator uses authenticated choices method');ok(host.querySelectorAll('input').length===4,'coordinator renders choices');
state={signedIn:false,epoch:2};listener();ok(!host.querySelector('[data-source-question]'),'logout clears source');ok(host.textContent.includes('로그인'),'logout gate');
coordinator.stop();dom.window.close();console.log(JSON.stringify({checks,failures:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
