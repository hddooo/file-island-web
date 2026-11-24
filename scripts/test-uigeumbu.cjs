'use strict';
// 의금부 menu, history labels (KST date, accuracy), start options and request bodies with a fake owner API.
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
(async()=>{
const w=new JSDOM('<main id="formalExamHost"></main>',{url:'https://synthetic.invalid/',runScripts:'outside-only',pretendToBeVisual:true}).window;
w.eval(fs.readFileSync('media/uigeumbu.js','utf8'));
const U=w.HanqUigeumbu;
assert.equal(U.kstDate('2026-11-23T05:00:00.000Z'),'2026/11/23 (월)');
assert.equal(U.kstDate('2026-11-23T15:30:00.000Z'),'2026/11/24 (화)','dates are Korean time');
assert.equal(U.score(17,20),'85% (17/20)');assert.equal(U.score(0,3),'0% (0/3)');
const calls=[],summary={resetAt:null,pool:{all:42,hasMore:false},last:{id:'00000000-0000-4000-8000-000000000002',sequence:2,wrong:3},active:null,rounds:[
 {id:'00000000-0000-4000-8000-000000000002',sequence:2,scope:'last-wrong',finalAt:'2026-11-23T03:00:00.000Z',total:20,missed:3,correct:17,wrong:2,unanswered:1,reviews:[{id:'00000000-0000-4000-8000-000000000003',finalAt:'2026-11-24T01:00:00.000Z',total:4,correct:3}]},
 {id:'00000000-0000-4000-8000-000000000001',sequence:1,scope:'all',finalAt:'2026-11-22T03:00:00.000Z',total:42,missed:0,correct:42,wrong:0,unanswered:0,reviews:[]}]};
const api={state:()=>({signedIn:true,ownerId:'owner-1'}),newSubmissionId:p=>p+'-0123456789',cbt:(m,p,b)=>{calls.push([m,p,b]);if(m==='GET'&&p==='/api/v1/cbt/uigeumbu')return Promise.resolve(summary);return Promise.reject(Object.assign(new Error('x'),{code:'review_empty',status:409}));}};
const host=w.document.getElementById('formalExamHost');let home=0;U.mount(host,{api,onHome:()=>home++});
await new Promise(r=>setTimeout(r,20));
assert.equal(host.querySelector('h1').textContent,'의금부');assert.ok(host.querySelector('#uigStart'),'start button first');assert.equal(host.querySelector('#uigAll'),null);
const rows=[...host.querySelectorAll('.uig-round>.uig-row')].map(r=>[r.querySelector('.uig-row-label').textContent,r.querySelector('.uig-row-score').textContent]);
assert.deepEqual(rows,[['2회차 (직전오답) · 2026/11/23 (월)','85% (17/20)'],['1회차 (전체) · 2026/11/22 (일)','100% (42/42)']]);
assert.equal(host.querySelector('.uig-reviews .uig-row-label').textContent,'복습 · 2026/11/24 (화)');assert.equal(host.querySelector('.uig-reviews .uig-row-score').textContent,'75% (3/4)');
assert.equal(host.querySelectorAll('[data-review]').length,2);
assert.equal(host.querySelectorAll('[data-pdf="questions"]:disabled').length,1,'a round without mistakes has no wrong-answer PDF');
host.querySelector('#uigStart').click();
assert.match(host.querySelector('#uigAll').textContent,/모든 문제 다시 풀기.*42문항/);assert.match(host.querySelector('#uigLast').textContent,/직전 회차 오답 다시 풀기.*2회차 오답 3문항/);
host.querySelector('#uigLast').click();await new Promise(r=>setTimeout(r,20));
assert.equal(JSON.stringify(calls.at(-1)),JSON.stringify(['POST','/api/v1/cbt/uigeumbu/sessions',{scope:'last-wrong',idempotencyKey:'uigeumbu-0123456789'}]));
assert.match(host.querySelector('[role=alert]').textContent,/다시 풀 오답이 없어요/);
host.querySelector('#uigRetry').click();await new Promise(r=>setTimeout(r,20));host.querySelector('#uigHome').click();assert.equal(home,1);
w.close();console.log('PASS 의금부 menu: start → two options, KST dated recent rounds with accuracy, review records, request bodies');
})().catch(e=>{console.error(e);process.exit(1);});
