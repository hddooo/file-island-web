'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const source=fs.readFileSync(process.env.PAPER_SOURCE||'media/formal-exams.js','utf8');
const endpoint='/api/v1/cbt/runs/paper-import';
const settle=async()=>{for(let i=0;i<5;i++)await new Promise(resolve=>setTimeout(resolve,1));};
function fixture(handler,signedIn=true,detail=null){
 const d=new JSDOM('<main></main>',{url:'https://fixture.test/#history',runScripts:'outside-only'}),w=d.window,doc=w.document;
 let state={signedIn,ownerId:signedIn?'owner-one':null,epoch:1};const observers=[],posts=[],reads=[],runs=[];
 Object.defineProperty(w.crypto,'subtle',{value:require('node:crypto').webcrypto.subtle});w.TextEncoder=TextEncoder;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;};
 const api={enabled:()=>true,state:()=>state,ensureSession:async()=>{},onChange(f){observers.push(f);return()=>{};},cbt:async function(method,path,body){
  if(method==='POST'){assert.equal(path,endpoint);posts.push(JSON.parse(JSON.stringify(body)));return handler(body,runs);}
  reads.push(path);
  if(detail&&path==='/api/v1/cbt/runs/'+detail.run.id)return detail;
  if(detail&&path.endsWith('/stars'))return {flags:[false,false],signature:'',resetAt:null};
  if(path.endsWith('/rounds'))return {imagesConfigured:true,rounds:[{round:80,available:false},{round:78,available:true},{round:69,available:true}]};
  if(path.endsWith('/runs'))return {runs};
  throw Error('unexpected '+path);
 }};
 w.HanqCbtResultAnalysis={analyze(items){return {rows:items.map(q=>({number:q.number,era:'modern',status:q.review.status})),eras:[{key:'modern',label:'현대사'}]};}};
 w.eval(source);function remount(){w.HanqFormalExams.mount(doc.querySelector('main'),{api,onHome(){},onAccount(){},onRoute(){}},detail?.run.id);}remount();
 const get=id=>doc.getElementById('fePaper'+id);
 const click=id=>get(id).click();
 function form(round='69',wrong='20',stars=''){click('Open');get('Round').value=round;get('Wrong').value=wrong;get('Stars').value=stars;}
 function submit(){get('Form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
 function account(ownerId){state={signedIn:!!ownerId,ownerId,epoch:state.epoch+1};observers.forEach(f=>f(state));}
 return {doc,w,get,click,form,submit,account,remount,posts,reads,close(){w.HanqFormalExams.stop();w.close();}};
}
const row=(b,more)=>Object.assign({runId:'uuid',round:b.round,status:'final',score:82,correctCount:47,wrongCount:b.wrongQuestionNumbers.length,starredCount:b.starredQuestionNumbers.length,reused:false},more);
test('ordinary formal exams list opens, parses fullwidth and duplicates, persists own two independent lists and reloads record',async()=>{
 const f=fixture(async(b,runs)=>{runs.push({id:'11111111-1111-4111-8111-111111111111',round:b.round,status:'final',result:{score:82,maxScore:100,total:50,correct:41},finalAt:'2026-11-22T00:00:00.000Z'});return row(b);});
 try{await settle();assert(f.get('Open'));assert.deepEqual([...f.get('Round').options].map(x=>x.value),['','78','69']);f.form('69','２０， 5,20, ','50, 5，');f.submit();f.submit();await settle();
 assert.equal(f.posts.length,1);
 assert.match(f.posts[0].idempotencyKey,/^[a-f0-9-]{36}$/);
 const {idempotencyKey,...rest}=f.posts[0];assert.deepEqual(rest,{round:69,wrongQuestionNumbers:[5,20],starredQuestionNumbers:[5,50]});
 assert.match(f.doc.querySelector('#feMaterialStatus').textContent,/제69회 82점.*내 기록에 추가/);assert.equal(f.reads.filter(x=>x.endsWith('/runs')).length,2);assert(!f.get('Dialog').open);
 assert.match(f.doc.querySelector('[data-run]').getAttribute('data-run'),/^11111111/);assert.equal(f.doc.querySelector('[data-run]').textContent,'82점');
 }finally{f.close();}
});
test('invalid inputs, unavailable round, distinct empty lists, and cancellation do not make unexpected writes',async()=>{
 const f=fixture(async b=>row(b));try{await settle();f.form('80');f.submit();await settle();assert.equal(f.posts.length,0);assert.match(f.get('Error').textContent,/회차/);
 f.get('Round').value='69';
 for(const invalid of ['0','51','3-4','3,,4','3,,','3e1','2.0']){f.get('Wrong').value=invalid;f.submit();await settle();assert.match(f.get('Error').textContent,/오답 번호/);}
 f.get('Wrong').value='';f.get('Stars').value='52';f.submit();assert.match(f.get('Error').textContent,/별표 번호/);assert.equal(f.posts.length,0);
 f.click('Cancel');assert(!f.get('Dialog').open);f.submit();assert.equal(f.posts.length,0);
 f.form('69','','');f.submit();await settle();assert.deepEqual(f.posts.map(b=>[b.wrongQuestionNumbers,b.starredQuestionNumbers]),[[[],[]]]);
 }finally{f.close();}
});
test('retry is idempotent, changed payload has new key and active attempt conflict stays open',async()=>{
 let n=0;const f=fixture(async b=>{n++;if(n===1)throw {code:'timeout'};if(n===2)throw {code:'paper_import_active_run',status:409};return row(b,{reused:true});});try{
 await settle();f.form('78','50, 2','2');f.submit();await settle();assert.match(f.get('Error').textContent,/같은 내용이면 중복 저장 없이/);
 f.get('Wrong').value='2,50';f.submit();await settle();assert.match(f.get('Error').textContent,/진행 중인 시험/);assert(f.get('Dialog').open);assert.equal(f.posts[0].idempotencyKey,f.posts[1].idempotencyKey);
 f.get('Wrong').value='2,49';f.submit();await settle();assert.notEqual(f.posts[1].idempotencyKey,f.posts[2].idempotencyKey);assert.match(f.doc.querySelector('#feMaterialStatus').textContent,/이미 등록/);
 f.form('78','2,49','2');f.submit();await settle();assert.notEqual(f.posts[2].idempotencyKey,f.posts[3].idempotencyKey);
 }finally{f.close();}
});
test('signed out cannot open and a response from a previous owner is not displayed',async()=>{
 const a=fixture(()=>{throw Error('unexpected');},false);try{await settle();assert.equal(a.get('Open'),null);assert.equal(a.posts.length,0);}finally{a.close();}
 let release;const b=fixture(body=>new Promise(resolve=>{release=()=>resolve(row(body));}));try{
 await settle();b.form();b.submit();await settle();assert.equal(b.posts.length,1);b.account('owner-two');release();await settle();
 assert.equal(b.doc.querySelector('#feMaterialStatus').textContent,'');assert(!b.get('Dialog').open);
 }finally{b.close();}
});
test('paper results show wrong and no chosen number, and paper misses enter the notebook without weakening ordinary blank guard',async()=>{
 const id='11111111-1111-4111-8111-111111111111',options=Array.from({length:5},(_,i)=>({id:'x'+(i+1),number:i+1}));
 const run={id,status:'final',round:69,result:{paperImported:true,paperWrongCount:1,score:98,maxScore:100,correct:49,total:50,growthReward:0}};
 const item=(number,paperWrong)=>{const position=number-1;return {questionId:'exam-69-'+number,version:'pinned',number,exam:69,runId:id,position,points:2,options,selectedOptionId:null,paperWrong,image:'/api/v1/cbt/runs/'+id+'/questions/'+position+'/image',review:{status:paperWrong?'wrong':'correct',correct:!paperWrong,earned:paperWrong?0:2,correctNumber:2,correctOptionId:'x2'}};};
 const detail={run,items:[item(20,true),item(21,false)]};
 const f=fixture(()=>{throw Error('unexpected write');},true,detail);
 try{await settle();assert.equal(f.doc.querySelector('.fe-review-status').textContent,'오답');
 assert.match(f.doc.querySelector('.fe-answer-compare').textContent,/선택답 번호 미기록.*정답 2/);
 assert.match(f.doc.querySelector('.fe-era-ring-item').getAttribute('aria-label'),/오답 1/);
 assert(!f.doc.querySelector('.fe-era-ring-item').getAttribute('aria-label').includes('미응답'));
 const route=process.env.PAPER_NOTEBOOK||'media/cbt-wrong-notebook.js';
 f.w.eval(fs.readFileSync(route,'utf8'));
 const raw={scope:'finalized-exam-selected-wrong',items:[{...detail.items[0],paperImported:true},{...item(22,true)}]};
 const result=f.w.HanqCbtWrongNotebook.normalize(raw);
 assert.equal(result.items.length,1);assert.equal(result.rejected,1);assert.equal(result.items[0].selectedOptionId,null);
 f.w.eval(fs.readFileSync(process.env.PAPER_MATERIALS||'media/cbt-round-materials.js','utf8'));
 const reviewPayload={scope:'exam-starred-or-ever-wrong',round:69,hasMore:false,pendingStarCount:0,items:detail.items.map(q=>({...q,paperImported:true,starred:!q.paperWrong,everWrong:q.paperWrong}))};
 assert.equal(f.w.HanqCbtRoundMaterials.normalize(reviewPayload,69).items.length,2);
 const unavailable={...reviewPayload,items:reviewPayload.items.map(({paperImported,...q})=>q)};
 assert.throws(()=>f.w.HanqCbtRoundMaterials.normalize(unavailable,69));
 }finally{f.close();}
});
test('lost response survives a remount, retries original opaque UUID, isolates account and clears after success',async()=>{
 let call=0;
 const f=fixture(async b=>{if(++call===1)throw {code:'timeout'};if(call===2)throw {code:'timeout'};return row(b,{reused:true});});
 try{
  await settle();f.form('69','20, 19,','18');f.submit();for(let i=0;i<20&&f.posts.length<1;i++)await settle();
  assert.equal(f.posts.length,1);
  const key=f.w.sessionStorage.key(0);assert.match(key,/^hanq-paper-import-v1:[a-f0-9]{64}$/);
  assert.deepEqual(Object.keys(JSON.parse(f.w.sessionStorage.getItem(key))),['id']);
  f.remount();await settle();f.account('owner-two');await settle();f.form('69','19,20','18');f.submit();for(let i=0;i<20&&f.posts.length<2;i++)await settle();
  assert.notEqual(f.posts[0].idempotencyKey,f.posts[1].idempotencyKey);
  f.account('owner-one');await settle();f.form('69','19,20','18');f.submit();for(let i=0;i<20&&f.posts.length<3;i++)await settle();
  assert.equal(f.posts[0].idempotencyKey,f.posts[2].idempotencyKey);assert.equal(f.w.sessionStorage.getItem(key),null);
 }finally{f.close();}
});
