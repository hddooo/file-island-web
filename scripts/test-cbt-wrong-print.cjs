'use strict';
const nodeTest=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require('jsdom');
const code=process.env.WORKSHEET_SOURCE||fs.readFileSync('media/cbt-wrong-print.js','utf8');
const uuid='11111111-1111-4111-8111-111111111111';
function question(r,n,{star=false,blank=false}={}){
 const options=Array.from({length:5},(_,i)=>({id:'a'+i,number:i+1}));
 return {questionId:'exam-'+r+'-'+String(n).padStart(2,'0'),version:'frozen',exam:r,number:n,position:n-1,runId:uuid,source:'exam',starred:star,everWrong:!star,selectedOptionId:blank?null:star?'a1':'a3',image:'/api/v1/cbt/runs/'+uuid+'/questions/'+(n-1)+'/image',options,review:{item:{arbitrary:'legacy nested shape not needed for print'},status:blank?'unanswered':star?'correct':'wrong',correctNumber:2,correctOptionId:'a1'}};
}
function response(round,items=[],pending=0,resetAt=null){return{scope:'exam-starred-or-ever-wrong',includesUnanswered:true,round,hasMore:false,pendingStarCount:pending,items,resetAt};}
function harness(){
 const d=new JSDOM('<main></main>',{url:'https://fixture.test',runScripts:'outside-only',pretendToBeVisual:true}),w=d.window,doc=w.document,requests=[],prints=[],images=[],handlers=[];
 let owner='x',fetchOverride=null,missing=null;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.URL.createObjectURL=()=> 'blob:synthetic-'+images.length;
 w.URL.revokeObjectURL=()=>{};
 w.Image=function(){return {naturalWidth:600,naturalHeight:600,set src(_){Promise.resolve().then(()=>this.onload());}};};
 Object.defineProperty(w.HTMLIFrameElement.prototype,'contentWindow',{get(){return {focus(){},print(){prints.push(1);}};}});
 const append=w.HTMLElement.prototype.appendChild;
 w.HTMLElement.prototype.appendChild=function(e){const x=append.call(this,e);if(e.tagName==='IFRAME')Object.defineProperty(e.contentDocument.defaultView.HTMLImageElement.prototype,'decode',{value(){return Promise.resolve();}});return x;};
 w.HanqCbtExplanations={reviewParts:q=>q.exam===69?{stem:['검증된 지문'],conclusion:'검증된 결론'}:null,resolve:q=>q.exam===69?{options:q.options.map((_,i)=>({review:['검증 보기 '+(i+1)]}))}:null};
 w.eval(code);
 const api={state:()=>({signedIn:true,ownerId:owner,epoch:1}),onChange:f=>{handlers.push(f);return()=>{};},async cbt(m,p){
  assert.equal(m,'GET');requests.push(p);assert.match(p,/^\/api\/v1\/cbt\/worksheet-materials\/\d{2}$/);
  if(fetchOverride)return fetchOverride(p);
  const round=Number(p.split('/').pop());
  return response(round,round===69?[question(69,20,{blank:true})]:round===78?[question(78,4,{star:true})]:[],round===78?1:0);
 },async cbtImage(p){images.push(p);if(missing)throw Object.assign(new Error('missing'),missing);return new w.Blob(['x'],{type:'image/webp'});}};
 const click=(label)=>{const b=[...doc.querySelectorAll('button')].find(x=>x.textContent===label);assert(b,label);b.click();return b;};
 function select(){click('선택 해제');doc.querySelector('input[value="69"]').click();doc.querySelector('input[value="78"]').click();}
 return {d,w,doc,requests,prints,images,api,click,select,missing(status=404,code){missing={status,code};},override(fn){fetchOverride=fn;},logout(){owner='y';handlers.forEach(f=>f());},close(){doc.querySelector('.wp-controls button')?.click();w.close();}};
}
const settle=async()=>{for(let i=0;i<3;i++)await new Promise(r=>setImmediate(r));};
nodeTest('real entry flow treats 69 blanks and 78 saved stars as eligible and prints two separate files with matching numbering',async ()=>{
 const h=harness();try{
  const {w,doc,requests,images,prints}=h;w.HanqCbtWrongPrint.open({api:h.api});assert.equal(doc.querySelectorAll('input:checked').length,14);h.select();
  h.click('문제지 PDF');await settle();let f=doc.querySelector('iframe').contentDocument;
  assert.deepEqual([...f.querySelectorAll('.wp-question h2')].map(x=>x.textContent),['1','2']);
  assert.deepEqual([...f.querySelectorAll('.wp-question-origin')].map(x=>x.textContent),['(69회-20번)','(78회-4번)']);
  assert(!f.querySelector('.wp-answer-grid'));assert(!f.body.textContent.includes('검증된 지문'));assert.equal(images.length,2);
  assert.match(doc.querySelector('[role=status]').textContent,/별표 1개는 제출 후/);
  h.click('해설지 PDF');await settle();f=doc.querySelector('iframe').contentDocument;
  assert.equal(f.querySelectorAll('.wp-question,img').length,0);
  assert.equal(f.querySelectorAll('.wp-answer-sheet').length,1);
  assert.equal(f.body.firstElementChild.className,'wp-page wp-answer-sheet');
  assert.deepEqual([...f.querySelectorAll('.wp-answer-entry')].map(x=>x.textContent),['1②','2②']);
  assert.deepEqual([...f.querySelectorAll('.wp-explanation h2')].map(x=>x.textContent),['1','2']);
  assert.match(f.querySelector('.wp-explanations').textContent,/검증된 지문.*검증 보기 1.*검증된 결론.*확인된 해설이 없습니다/);
  assert.equal(prints.length,2);assert.equal(images.length,2);
  assert.equal(requests.length,2,'same immutable selected-set snapshot for both PDFs');
 }finally{h.close();}
});
nodeTest('all 700 answers fit declared A4 dimensions in one continuous sheet',()=>{
 const h=harness();try{
 const items=Array.from({length:700},(_,i)=>question(67+Math.floor(i/50),1+i%50));
 const doc=h.doc.implementation.createHTMLDocument();h.w.HanqCbtWrongPrint.renderSheet(doc,items,new Map(),'explanations');
 const grid=doc.querySelector('.wp-answer-grid');const cols=Number(grid.style.getPropertyValue('--cols'));
 assert.equal(cols,20);assert.equal(doc.querySelectorAll('.wp-answer-sheet').length,1);
 assert(Math.ceil(items.length/cols)*7+12<267);assert.equal(grid.children.length,700);assert.equal(grid.lastElementChild.textContent,'700②');
 assert.equal(doc.querySelectorAll('.wp-explanation').length,700);
 }finally{h.close();}
});
nodeTest('missing old-route compatibility marker and mixed reset epochs refuse incomplete downloads',async ()=>{
 const h=harness();try{
  h.override(()=>({...response(69,[question(69,1)]),includesUnanswered:false}));
  await assert.rejects(h.w.HanqCbtWrongPrint.collect(h.api,[69],()=>{}),e=>e.code==='materials_shape');
  h.override(p=>{const n=Number(p.split('/').pop());return response(n,[],0,n===69?null:'2026-11-21T00:00:00Z');});
  await assert.rejects(h.w.HanqCbtWrongPrint.collect(h.api,[69,78],()=>{}),e=>e.code==='changed');
  const q=question(69,20);assert.throws(()=>h.w.HanqCbtWrongPrint.worksheetRows(response(69,[q,q]),69));
  assert.throws(()=>h.w.HanqCbtWrongPrint.worksheetRows(response(69,[{...q,image:'https://offsite.invalid/x'}]),69));
 }finally{h.close();}
});
nodeTest('original 404 tells exact affected question, nothing silently skipped, explanation still works',async ()=>{
 const h=harness();try{h.w.HanqCbtWrongPrint.open({api:h.api});h.select();h.missing();h.click('문제지 PDF');await settle();
 assert.equal(h.prints.length,0);assert.equal(h.doc.querySelector('iframe'),null);assert.match(h.doc.querySelector('[role=status]').textContent,/제(?:69회 20|78회 4)번 원본/);
 h.click('해설지 PDF');await settle();assert.equal(h.prints.length,1);assert.equal(h.doc.querySelector('iframe').contentDocument.querySelectorAll('.wp-answer-entry').length,2);
 }finally{h.close();}
});
nodeTest('sign out during reads discards pending data',async ()=>{
 const h=harness();try{let resume;h.override(()=>new Promise(r=>{resume=r;}));h.w.HanqCbtWrongPrint.open({api:h.api,round:69});h.click('문제지 PDF');h.logout();resume(response(69,[question(69,20,{blank:true})]));await settle();assert.equal(h.doc.querySelector('dialog'),null);assert.equal(h.prints.length,0);assert.equal(h.images.length,0);
 }finally{h.close();}
});

nodeTest('canonical hashed public original rescues protected asset_unavailable but not other 503 errors', async()=>{
 const h=harness();try{
  const crypto=require('node:crypto'),b=Buffer.from('synthetic WebP body'),hash=crypto.createHash('sha256').update(b).digest('hex'),requests=[];
  Object.defineProperty(h.w.crypto,'subtle',{value:crypto.webcrypto.subtle});
  h.w.HANQ_CBT_EXPLANATIONS_67_69={items:{'exam-69-20':{exam:69,number:20,answer:2,v:'frozen'}}};
  h.w.fetch=async function(path){
   requests.push(path);
   return path.endsWith('manifest.json')?{ok:true,json:async()=>({files:{'69-20.webp':hash}})}:{ok:true,headers:{get:()=> 'image/webp'},arrayBuffer:async()=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength)};
  };
  h.missing(503,'asset_unavailable');h.w.HanqCbtWrongPrint.open({api:h.api,round:69});h.click('문제지 PDF');await settle();
  assert.deepEqual(requests,['media/cbt-originals/manifest.json','media/cbt-originals/69-20.webp']);assert.equal(h.prints.length,1);
 }finally{h.close();}
 const denied=harness();try{denied.missing(503,'other');let fallbackAttempts=0;denied.w.fetch=async()=>{fallbackAttempts++;throw Error('unexpected fallback')};denied.w.HanqCbtWrongPrint.open({api:denied.api,round:69});denied.click('문제지 PDF');await settle();assert.equal(denied.prints.length,0);assert.equal(fallbackAttempts,0);}finally{denied.close();}
});

nodeTest('validated finalized review routes keep their image and common origin and reject mismatched routes',()=>{
 const h=harness();try{
  const q=question(72,47),path='/api/v1/cbt/reviews/'+uuid+'/questions/46',review={...q,source:'review',image:path+'/image',common:{image:path+'/common',questionNumbers:[47,48]}};
  assert.equal(h.w.HanqCbtWrongPrint.worksheetRows(response(72,[review]),72)[0].image,path+'/image');
  assert.throws(()=>h.w.HanqCbtWrongPrint.worksheetRows(response(72,[{...review,source:'exam'}]),72));
  assert.throws(()=>h.w.HanqCbtWrongPrint.worksheetRows(response(72,[{...review,common:{...review.common,image:q.image.replace('/image','/common')}}]),72));
 }finally{h.close();}
});
nodeTest('problem pages keep shared source once on a page, no answer content ever',()=>{
 const h=harness();try{
 const items=Array.from({length:6},(_,i)=>question(72,i+1)),pics=new Map();
 for(const item of items){item.common={image:'/common',questionNumbers:[1,2,3,4,5,6]};pics.set(item.image,{url:'blob:test',ratio:.8});}
 pics.set('/common',{url:'blob:common',ratio:.4});
 const doc=h.doc.implementation.createHTMLDocument();h.w.HanqCbtWrongPrint.renderSheet(doc,items,pics,'questions');
 assert.equal(doc.querySelectorAll('.wp-question').length,6);
 assert(doc.querySelector('.wp-common-ref'));
 for(const page of doc.querySelectorAll('.wp-question-page'))assert.equal(page.querySelectorAll('img[alt="공통 자료"]').length,1);
 assert(!doc.querySelector('.wp-answer-sheet,.wp-explanations'));
 const css=require('css-tree'),errors=[];css.parse(doc.querySelector('style').textContent,{onParseError:e=>errors.push(e.message)});assert.deepEqual(errors,[]);
 }finally{h.close();}
});
