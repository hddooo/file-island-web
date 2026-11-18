'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH||'jsdom');
(async()=>{
const dom=new JSDOM('<main></main>',{url:'https://fixture.invalid',runScripts:'outside-only'}),w=dom.window,host=w.document.querySelector('main');
w.eval(fs.readFileSync('media/cbt-round-materials.js','utf8'));
const snapshot={round:75,right:1,total:2,marked:false,at:'2026-11-18T10:00:00.000Z',resetAt:null,rows:[1,2].map((number,i)=>({questionId:'exam-75-0'+number,version:'v1',exam:75,number,status:i?'wrong':'correct'}))};
let requests=[];const api={state:()=>({signedIn:true,ownerId:'fixture',epoch:1}),onChange:()=>()=>{},cbt:async(method,path)=>{requests.push([method,path]);if(path==='/api/v1/cbt/rehearsal-results')return {results:[snapshot],resetAt:null};if(path==='/api/v1/cbt/review-materials/75')return {scope:'exam-starred-or-ever-wrong',round:75,items:[],hasMore:false,pendingStarCount:0,resetAt:null};throw Error('Unexpected request');}};
const view=w.HanqCbtRoundMaterials.mount(host,{api,round:75,history:true});await view.ready;
assert(host.textContent.includes('최근 제출한 복습 결과'));assert(host.textContent.includes('50%'));assert(host.textContent.includes('1번'));assert(host.textContent.includes('O 정답'));assert(host.textContent.includes('X 오답'));assert.equal(requests.length,1,'history must not depend on present materials');
const original=w.localStorage.getItem('hanq:round-material-rehearsal:v1:fixture:75:server-latest');
[...host.querySelectorAll('button')].find(b=>b.textContent==='다시 풀기').click();await new Promise(r=>setTimeout(r,0));
assert(requests.some(([,path])=>path==='/api/v1/cbt/review-materials/75'));assert(!host.textContent.includes('최근 제출한 복습 결과'));assert.equal(w.localStorage.getItem('hanq:round-material-rehearsal:v1:fixture:75:server-latest'),original);assert(requests.every(([method])=>method==='GET'));view.stop();dom.window.close();
console.log('PASS new-device archived result without current materials; retry loads fresh, preserves snapshot and makes no scoring requests');
})().catch(e=>{console.error(e);process.exitCode=1;});
