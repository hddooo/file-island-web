'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom'),css=require('css-tree');
const source=fs.readFileSync('media/cbt-wrong-print.js','utf8'),materials=fs.readFileSync('media/cbt-round-materials.js','utf8');
const runId='11111111-1111-4111-8111-111111111111';
function q(exam,number){const questionId=`exam-${exam}-${String(number).padStart(2,'0')}`,options=Array.from({length:5},(_,i)=>({id:`o${i+1}`,number:i+1}));return{questionId,version:'v1',exam,number,runId,position:number-1,points:2,selectedOptionId:'o2',image:`/api/v1/cbt/runs/${runId}/questions/${number-1}/image`,common:null,options,review:{status:'wrong',correct:false,correctNumber:1,correctOptionId:'o1',explanation:'SECRET EXPLANATION',options:[{selected:true,correct:false}]}};}
const newer='11111111-1111-4111-8111-111111111112',older='11111111-1111-4111-8111-111111111113';
const runs=[{id:newer,round:69,status:'final',finalAt:'2026-11-20T00:00:00.000Z'},{id:older,round:69,status:'final',finalAt:'2026-11-19T00:00:00.000Z'}];
function detail(run){
 return {run,items:Array.from({length:50},(_,i)=>{
  const item=q(run.round,i+1),blank=run.id===older&&i===3,wrong=run.id===older&&i===1;
  item.image='/api/v1/cbt/runs/'+run.id+'/questions/'+i+'/image';
  item.selectedOptionId=blank?null:wrong?'o2':'o1';
  item.review.status=blank?'unanswered':wrong?'wrong':'correct';
  item.review.correct=!blank&&!wrong;
  return item;
 })};
}
function fixture(){const dom=new JSDOM('<main></main>',{url:'https://fixture.test/#history',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};let state={signedIn:true,ownerId:'a',epoch:1},handlers=[],calls=[],deferred=null,revoked=[],serial=0,custom=null;w.URL.createObjectURL=()=>`blob:fixture-${++serial}`;w.URL.revokeObjectURL=x=>revoked.push(x);w.eval(materials);w.eval(source);
 const api={state:()=>state,onChange(fn){handlers.push(fn);return()=>handlers=handlers.filter(x=>x!==fn);},async cbt(method,p){calls.push([method,p]);if(deferred)await deferred;
  if(custom)return custom(method,p);if(p.endsWith('/runs'))return {runs};if(p.includes('/review-materials/')){const r=Number(p.split('/').pop()),s=q(r,2);s.starred=true;s.everWrong=r===69;if(!s.everWrong){s.selectedOptionId='o1';s.review.status='correct';s.review.correct=true;}
    return {scope:'exam-starred-or-ever-wrong',round:r,hasMore:false,pendingStarCount:0,items:[s]};}
  const run=runs.find(x=>p.endsWith(x.id));if(run)return detail(run);throw Error('Unexpected API path');
 }, cbtImage:async(...a)=>{calls.push(['IMAGE',...a]);return new w.Blob(['image'],{type:'image/png'});}};
 return{w,dom,api,calls,revoked,respond(fn){custom=fn;},delay(p){deferred=p;},switch(){state={signedIn:true,ownerId:'b',epoch:2};handlers.slice().forEach(f=>f(state));},close(){w.HanqCbtWrongPrint.open&&w.document.querySelector('dialog .wp-controls button')?.click();dom.window.close();}};}
const tick=async()=>{for(let i=0;i<100;i++)await Promise.resolve();await new Promise(r=>setImmediate(r));};
function click(w,text){const b=Array.from(w.document.querySelectorAll('button')).find(b=>b.textContent===text);assert(b,text);b.click();}
test('round-only entry defaults to all and print is immediately actionable; 69 + 78 combined into one frame',async()=>{const f=fixture();try{
 const c=f.w.HanqCbtWrongPrint.open({api:f.api});await c.ready;const d=f.w.document;
 assert.equal(d.querySelectorAll('fieldset input').length,14);assert.equal(d.querySelectorAll('fieldset input:checked').length,14);
 assert.equal(d.querySelector('iframe'),null);assert.equal(f.calls.length,0);
 click(f.w,'선택 해제');assert([...d.querySelectorAll('button')].find(b=>b.textContent==='인쇄 / PDF 저장').disabled);
 d.querySelector('input[value="69"]').click();d.querySelector('input[value="78"]').click();
 const opened=[];Object.defineProperty(f.w.HTMLIFrameElement.prototype,'contentWindow',{get(){return {focus(){},print(){opened.push(1);}};}});
 f.w.Image=function(){return{naturalWidth:600,naturalHeight:600,set src(_){Promise.resolve().then(()=>this.onload());}};};
 Object.defineProperty(f.w.HTMLImageElement.prototype,'decode',{value(){return Promise.resolve();}}); // iframe has separate realm; decoded synthetic images below
 const append=f.w.HTMLElement.prototype.appendChild;
 f.w.HTMLElement.prototype.appendChild=function(e){const r=append.call(this,e);if(e.tagName==='IFRAME'){Object.defineProperty(e.contentDocument.defaultView.HTMLImageElement.prototype,'decode',{value(){return Promise.resolve();}});}return r;};
 click(f.w,'인쇄 / PDF 저장');await tick();
 const frame=d.querySelector('iframe');assert(frame);assert.equal(opened.length,1);
 assert.deepEqual([...frame.contentDocument.querySelectorAll('.wp-question h2')].map(x=>x.textContent),['1','2','3']);
 assert.deepEqual([...frame.contentDocument.querySelectorAll('.wp-question-origin')].map(x=>x.textContent),['(69회-2번)','(69회-4번)','(78회-2번)']);assert.deepEqual([...frame.contentDocument.querySelectorAll('.wp-answer-cell span')].map(x=>x.textContent),['1번 ','2번 ','3번 ']);assert.equal(frame.contentDocument.querySelectorAll('.wp-answer-cell').length,3);assert.equal(frame.contentDocument.querySelectorAll('.wp-answer-sheet').length,1);
 assert(f.calls.every(x=>x[0]==='GET'||x[0]==='IMAGE'));assert(f.calls.some(x=>x.includes('/api/v1/cbt/runs/'+older)));
 }finally{f.close();}});
test('full-history union keeps older blank despite later correct, stored starred correct, deduplicates wrong+star',async()=>{const f=fixture();try{
 const a=await f.w.HanqCbtWrongPrint.collect(f.api,[69,78],()=>{});assert.deepEqual(Array.from(a,x=>x.questionId),['exam-69-02','exam-69-04','exam-78-02']);
 f.respond(()=>({runs:Array(100).fill(runs[0])}));await assert.rejects(f.w.HanqCbtWrongPrint.collect(f.api,[69],()=>{}),e=>e.code==='history_limit');
 }finally{f.close();}});
test('account change closes dialog and discards in-flight snapshot; no print after signout',async()=>{const f=fixture();try{let resolve;f.delay(new Promise(r=>resolve=r));const c=f.w.HanqCbtWrongPrint.open({api:f.api});await c.ready;click(f.w,'인쇄 / PDF 저장');f.switch();resolve();await tick();assert.equal(f.w.document.querySelector('dialog'),null);assert.equal(f.calls.length,1);}finally{f.close();}});
test('question pages only contain original images and unmarked choices; ALL answers on last single page',()=>{const f=fixture();try{const d=f.w.document.implementation.createHTMLDocument(),items=[q(70,1),q(71,2)];items[0].common={image:'/common',questionNumbers:[1,2]};const pics=new Map(items.map(x=>[x.image,{url:'blob:original',ratio:1}]));pics.set('/common',{url:'blob:common',ratio:.5});const last=f.w.HanqCbtWrongPrint.renderSheet(d,items,pics);assert.equal(d.querySelectorAll('.wp-question').length,2);assert.equal(d.querySelectorAll('.wp-answer-sheet').length,1);assert.equal(d.body.lastElementChild,last);assert.equal(last.querySelectorAll('.wp-answer-cell').length,2);for(const page of d.querySelectorAll('.wp-question')){assert(!page.textContent.includes('정답'));assert(!page.textContent.includes('SECRET'));assert(!page.innerHTML.includes('o2'));assert(page.textContent.includes('①   ②   ③   ④   ⑤'));}assert.equal(d.querySelectorAll('img').length,3);assert(!d.querySelector('script'));assert(!d.body.innerHTML.includes('SECRET'));assert(!source.includes('FontDescriptor'));assert(!source.includes('localStorage'));}finally{f.close();}});
test('all700 answer items are preserved after questions, answer sections paginate on A4',()=>{const f=fixture();try{const items=[];for(let r=67;r<=80;r++)for(let n=1;n<=50;n++)items.push(q(r,n));const d=f.w.document.implementation.createHTMLDocument(),pics=new Map(items.map(x=>[x.image,{url:'blob:original',ratio:1}]));f.w.HanqCbtWrongPrint.renderSheet(d,items,pics);assert.equal(d.querySelectorAll('.wp-answer-cell').length,700);assert.equal(d.querySelectorAll('.wp-answer-group').length,14);assert.equal(d.querySelectorAll('.wp-answer-sheet').length,2);assert.equal(d.querySelectorAll('.wp-answer-sheet ~ .wp-question-page').length,0);assert(d.querySelector('style').textContent.includes('grid-template-columns:repeat(3'));assert(d.querySelector('style').textContent.includes('font-size:8pt'));}finally{f.close();}});
test('mobile CSS parses with44px controls; print uses native system fonts and no outside requests',()=>{const text=fs.readFileSync('media/cbt-wrong-print.css','utf8');const errors=[];css.parse(text,{onParseError:e=>errors.push(e)});assert.deepEqual(errors,[]);assert(text.includes('min-height:44px'));assert(text.includes('@media(max-width:400px)'));assert(!source.includes("api.cbt('POST'"));assert(!source.includes('https://'));assert(source.includes('frame.contentWindow.print()'));assert(source.includes("querySelector('.fe-active-run')"));assert(source.includes("root.addEventListener('hashchange',stop)"));});
test('compact packing keeps blocks whole, common context once per page, repeats on later page',()=>{const f=fixture();try{const items=[1,2,3,4,5,6].map(n=>q(70,n));for(const x of items)x.common={image:'/common',questionNumbers:[1,2,3,4,5,6]};const pics=new Map(items.map(x=>[x.image,{url:'blob:original',ratio:.8}]));pics.set('/common',{url:'blob:common',ratio:.4});const d=f.w.document.implementation.createHTMLDocument();f.w.HanqCbtWrongPrint.renderSheet(d,items,pics);assert(d.querySelectorAll('.wp-question-page').length<items.length);for(const page of d.querySelectorAll('.wp-question-page')){assert.equal(page.querySelectorAll('img[alt="공통 자료"]').length,1);assert(page.querySelectorAll('.wp-question').length>=1);}assert.equal(d.querySelectorAll('.wp-question').length,6);assert(d.querySelector('.wp-common-ref'));}finally{f.close();}});
test('account change during image decoding revokes private blobs and never opens a print frame',async()=>{const f=fixture();try{f.w.Image=function(){return{naturalWidth:600,naturalHeight:600,set src(v){const self=this;f.switch();Promise.resolve().then(()=>self.onload());}};};const c=f.w.HanqCbtWrongPrint.open({api:f.api});await c.ready;click(f.w,'인쇄 / PDF 저장');await tick();assert.equal(f.w.document.querySelector('dialog'),null);assert.equal(f.w.document.querySelector('iframe'),null);assert(f.revoked.length>=1);assert(f.calls.every(x=>x[0]==='GET'||x[0]==='IMAGE'));}finally{f.close();}});
