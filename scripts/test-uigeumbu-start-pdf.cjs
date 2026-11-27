'use strict';
// 의금부 시작 메뉴 3개(모든 문제 · 직전 회차 오답 · 실전 회차별 최근 오답)의 문제지·해설지 PDF:
// GET /preview/:scope 만 부르고 세션을 만들지 않으며, 같은 PDF 도구(downloadItems)에 문항을 그대로 넘긴다.
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
(async()=>{
const w=new JSDOM('<main id="formalExamHost"></main>',{url:'https://synthetic.invalid/',runScripts:'outside-only',pretendToBeVisual:true}).window;
w.eval(fs.readFileSync('media/uigeumbu.js','utf8'));
const item=(exam,number)=>({position:0,questionId:'exam-'+exam+'-'+String(number).padStart(2,'0'),version:'v',exam,number,image:'/api/v1/cbt/uigeumbu/preview/all/questions/exam-'+exam+'-'+String(number).padStart(2,'0')+'/image',common:null,review:{status:'unanswered',correctNumber:2,correctOptionId:'o2',item:{}}});
const summary={resetAt:null,pool:{all:2,hasMore:false},last:{id:'00000000-0000-4000-8000-000000000002',sequence:2,wrong:1},active:null,rounds:[],mock:null};
const calls=[],pdfs=[];
const api={state:()=>({signedIn:true,ownerId:'owner-1'}),newSubmissionId:p=>p+'-0123456789',cbt:(m,p,b)=>{calls.push([m,p,b]);
 if(m==='GET'&&p==='/api/v1/cbt/uigeumbu')return Promise.resolve(summary);
 if(m==='GET'&&p==='/api/v1/cbt/uigeumbu/preview/all')return Promise.resolve({scope:'all',total:2,hasMore:false,items:[item(78,10),item(79,2)]});
 if(m==='GET'&&p==='/api/v1/cbt/uigeumbu/preview/last-wrong')return Promise.resolve({scope:'last-wrong',total:1,hasMore:false,items:[item(79,5)]});
 return Promise.reject(Object.assign(new Error('x'),{code:'review_empty',status:409}));}};
w.HanqCbtWrongPdf={downloadItems:o=>{pdfs.push(o);return Promise.resolve({filename:o.filename,count:o.items.length,pages:1});}};
const host=w.document.getElementById('formalExamHost');w.HanqUigeumbu.mount(host,{api});
await new Promise(r=>setTimeout(r,20));
assert.equal(host.querySelectorAll('[data-start-pdf]').length,0,'PDF buttons sit with the start options');
host.querySelector('#uigStart').click();
const btn=(scope,mode)=>host.querySelector('[data-start-pdf="'+mode+'"][data-scope="'+scope+'"]');
for(const scope of ['all','last-wrong','mock-wrong'])for(const mode of ['questions','answers'])assert.ok(btn(scope,mode),scope+' '+mode+' button');
assert.equal(btn('all','questions').disabled,false);assert.equal(btn('last-wrong','answers').disabled,false);
assert.equal(btn('mock-wrong','questions').disabled,true,'no submitted mock exam → disabled');assert.equal(btn('mock-wrong','answers').disabled,true);
btn('all','questions').click();await new Promise(r=>setTimeout(r,20));
assert.deepEqual(calls.at(-1),['GET','/api/v1/cbt/uigeumbu/preview/all',undefined]);
assert.equal(pdfs.length,1);assert.equal(pdfs[0].mode,'questions');assert.equal(pdfs[0].items.length,2);assert.equal(pdfs[0].title,'의금부 모든 문제 문제지');assert.equal(pdfs[0].filename,'의금부_모든_문제_문제지.pdf');
assert.match(host.querySelector('#uigStatus').textContent,/저장을 시작했어요 · 2문항/);
btn('last-wrong','answers').click();await new Promise(r=>setTimeout(r,20));
assert.equal(pdfs.length,2);assert.equal(pdfs[1].mode,'answers');assert.equal(pdfs[1].title,'의금부 직전 회차 오답 해설지');assert.deepEqual(pdfs[1].items.map(q=>[q.exam,q.number]),[[79,5]]);
assert.ok(!calls.some(c=>c[0]==='POST'),'printing never creates a session');
// The shared image fetcher must accept exactly the preview image path.
const client=fs.readFileSync('media/api-client.js','utf8');
assert.ok(client.includes('uigeumbu\\/preview\\/(?:all|last-wrong|mock-wrong)\\/questions\\/exam-\\d\\d-\\d\\d\\/(?:image|common)$'),'api-client allows preview images');
w.close();console.log('PASS 의금부 start-menu PDFs: 3 scopes × 문제지/해설지, preview only, no session');
})().catch(e=>{console.error(e);process.exit(1);});
