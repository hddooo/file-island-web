'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),test=require('node:test'),{JSDOM}=require('jsdom'),crypto=require('node:crypto');
const code=process.env.HANQ_PRINT31_CODE||fs.readFileSync('media/cbt-wrong-print.js','utf8');
const base=process.env.HANQ_QUESTION_ASSETS||'media';
const manifest=JSON.parse(fs.readFileSync(base+'/cbt-originals/manifest.json','utf8'));
const examSource=fs.readFileSync(base+'/cbt-explanation-data.js','utf8');
const selects=[1,2,3,4,5].map(i=>({id:'a'+i,number:i}));
const settle=async()=>{for(let i=0;i<7;i++)await new Promise(r=>setTimeout(r,1));};
function row(round,number,override){
 const questionId='exam-'+round+'-'+String(number).padStart(2,'0'),position=number-1,id='f1d810cd-0000-4000-8000-1111111111'+round;
 return {questionId,version:'fixture',exam:round,number,position,runId:id,source:'exam',starred:true,everWrong:true,selectedOptionId:null,paperImported:true,image:'/api/v1/cbt/runs/'+id+'/questions/'+position+'/image',options:selects,review:{status:'wrong',correctNumber:2,correctOptionId:'a2'},...override};
}
function raw(round,items=[],resetAt=null){return {scope:'exam-starred-or-ever-wrong',includesUnanswered:true,round,hasMore:false,pendingStarCount:0,items,resetAt};}
function harness(){
 const d=new JSDOM('<main/>',{url:'https://fixture.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=d.window,doc=w.document;
 const handlers=[],requests=[],images=[],downloads=[],writerCalls=[],http=[],urls=new Map(),revocations=[],scriptLoads=[];
 let owner=0,serial=0,reply=(_n,q)=>q(),imageReply=()=>new w.Blob(['protected-valid'],{type:'image/webp'}),staticReply=null;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
 w.HTMLAnchorElement.prototype.click=function(){downloads.push({url:this.href,name:this.download});};
 w.URL.createObjectURL=b=>{const key='blob:test-'+(++serial);urls.set(key,b);return key;};w.URL.revokeObjectURL=u=>{revocations.push(u);urls.delete(u);};
 w.Image=function(){return {naturalWidth:657,naturalHeight:1077,set src(u){queueMicrotask(()=>{if(urls.get(u)?.size===7)this.onerror();else this.onload();});}};};
 Object.defineProperty(w.crypto,'subtle',{value:crypto.webcrypto.subtle});
 w.eval(examSource);
 const pin=w.HANQ_CBT_EXPLANATIONS.items['exam-76-27'];
 assert(pin&&pin.id==='exam-76-27');
 const actual=row(76,27,{version:pin.v,review:{status:'wrong',correctNumber:pin.answer,correctOptionId:'a'+pin.answer}});
 w.HanqCbtExplanations={reviewParts:r=>({stem:['검증 단서'],conclusion:'결론'}),resolve:()=>null};
 const append=doc.head.appendChild.bind(doc.head);
 doc.head.appendChild=function(s){const child=append(s);scriptLoads.push(s.getAttribute('src'));queueMicrotask(()=>{
   if(s.getAttribute('src').includes('worksheet-pdf')){w.HanqCbtWorksheetPdf={create:async(_w,rows,pics,mode,guard)=>{guard();writerCalls.push({rows,pics,mode});return new w.Blob(['%PDF-1.4\nfixture'],{type:'application/pdf'});}};s.onload();}
   else s.onerror();
 });return child;};
 w.fetch=async function(path){http.push(path);
  if(staticReply){const override=staticReply(path);if(override)return override;}
  if(path.endsWith('manifest.json'))return {ok:true,json:async()=>manifest};
  const publicBytes=fs.readFileSync(base+'/cbt-originals/'+path.split('/').at(-1));
  return {ok:true,headers:{get:()=> 'image/webp'},arrayBuffer:async()=>publicBytes.buffer.slice(publicBytes.byteOffset,publicBytes.byteOffset+publicBytes.byteLength)};
 };
 w.eval(code);
 const api={state:()=>({signedIn:true,ownerId:owner,epoch:1}),onChange(f){handlers.push(f);return()=>{};},async cbt(m,p){assert.equal(m,'GET');requests.push(p);const round=Number(p.split('/').at(-1));return reply(round,()=>raw(round,round===76?[actual]:[]));},async cbtImage(p){images.push(p);return imageReply(p);}};
 const check=r=>doc.querySelector('input[value="'+r+'"]'),count=r=>check(r).parentNode.textContent;
 const button=label=>[...doc.querySelectorAll('button')].find(e=>e.textContent===label);
 return {w,doc,requests,images,http,downloads,writerCalls,revocations,scriptLoads,actual,open(round){return w.HanqCbtWrongPrint.open({api,round});},check,count,button,reply(f){reply=f;},imageReply(f){imageReply=f;},staticReply(f){staticReply=f;},logout(){owner++;handlers.forEach(f=>f());},close(){button('닫기')?.click();w.close();}};
}
test('generic opens empty; material loads on selection only; two independent true download paths',async()=>{const h=harness();try{h.open();assert.equal(h.requests.length,0);assert.equal(h.scriptLoads.length,0);h.check(76).click();await settle();assert.match(h.count(76),/1문항/);assert.equal(h.images.length,0);assert.equal(h.scriptLoads.length,0);
 h.button('문제지 PDF').click();await settle();assert.equal(h.images.length,0);assert.equal(h.writerCalls[0].mode,'questions');assert.equal(h.writerCalls[0].pics.size,1);assert.match(h.downloads[0].name,/문제지.pdf$/);assert(h.doc.querySelector('a[download]'));
 h.button('해설지 PDF').click();await settle();assert.equal(h.images.length,0);assert.equal(h.writerCalls[1].mode,'explanations');assert.equal(h.writerCalls[1].pics.size,0);assert.match(h.downloads[1].name,/해설지.pdf$/);assert.equal(h.requests.length,1);assert(h.revocations.includes(h.downloads[0].url));
 }finally{h.close();}});

test('round 76 all 50 exact canonical originals, arbitrary historical content versions and mixed 80 protected-only',async()=>{const h=harness();try{
 h.reply(r=>raw(r,r===76?Array.from({length:50},(_,i)=>row(r,i+1,{version:'historical-'+(i+1)})):[row(80,20)]));
 h.open();h.check(76).click();h.check(80).click();await settle();
 assert.match(h.count(76),/50문항/);assert.match(h.count(80),/1문항/);
 h.button('문제지 PDF').click();for(let i=0;i<40&&!h.downloads.length;i++)await settle();
 assert.equal(h.downloads.length,1);assert.equal(h.writerCalls[0].rows.length,51);assert.equal(h.writerCalls[0].pics.size,51);
 assert.equal(h.http.length,51);assert(h.http.includes('media/cbt-originals/76-20.webp'));assert(h.http.includes('media/cbt-originals/76-27.webp'));
 assert.equal(h.http.filter(u=>u.endsWith('manifest.json')).length,1);
 assert.equal(h.images.length,1);assert(!h.http.some(x=>x.includes('/80-')));
 }finally{h.close();}});
test('only non-auth static failures use protected image, protected auth failures and stale auth stop without partial file',async()=>{
 for(const fail of ['missing','hash','mime','auth-static','auth-manifest','auth-protected','all-fail']){
 const h=harness();try{
 h.staticReply(p=>{
  if(p.endsWith('manifest.json'))return fail==='auth-manifest'?{ok:false,status:401}:null;
  if(fail==='auth-static')return {ok:false,status:403};
  if(fail==='hash')return {ok:true,headers:{get:()=> 'image/webp'},arrayBuffer:async()=>new TextEncoder().encode('RIFFbyt3WEBPwrong').buffer};
  if(fail==='mime')return {ok:true,headers:{get:()=> 'text/html'}};
  return {ok:false,status:404};
 });
 if(fail==='auth-protected')h.imageReply(()=>{throw {status:403};});
 if(fail==='all-fail')h.imageReply(()=>{throw {status:0,code:'network'};});
 h.open(76);await settle();h.button('문제지 PDF').click();for(let i=0;i<25&&!h.downloads.length&&!/불러오지|로그인/.test(h.doc.querySelector('[role=status]').textContent);i++)await settle();
 assert.equal(h.images.length,fail==='auth-static'||fail==='auth-manifest'?0:1,fail);
 assert.equal(h.downloads.length,['missing','hash','mime'].includes(fail)?1:0,fail);
 if(fail==='all-fail')assert.match(h.doc.querySelector('[role=status]').textContent,/76회 27번 원본/);
 }finally{h.close();}
 }});
test('all rounds explicit limits metadata concurrency; lost selection/auth invalidates outstanding result',async()=>{const h=harness();try{
 let active=0,peak=0;const waiting=[];
 h.reply(r=>new Promise(resolve=>{active++;peak=Math.max(peak,active);waiting.push(()=>{active--;resolve(raw(r,[row(r,27)]));});}));
 h.open();h.button('전체 회차 선택').click();assert.equal(h.requests.length,4);assert.equal(h.images.length,0);
 for(let i=0;i<14;i++){while(!waiting.length)await settle();waiting.shift()();await settle();}
 assert.equal(peak,4);assert.equal(h.requests.length,14);assert.equal(h.images.length,0);
 h.button('해설지 PDF').click();await settle();assert.equal(h.writerCalls[0].rows.length,14);assert.deepEqual(Array.from(h.writerCalls[0].rows,x=>x.exam),Array.from({length:14},(_,i)=>67+i));assert.equal(h.images.length,0);
 h.open();h.check(76).click();h.check(76).click();waiting.shift()();await settle();assert.doesNotMatch(h.count(76),/문항/);
 h.check(78).click();h.logout();waiting.shift()();await settle();assert.equal(h.doc.querySelector('dialog'),null);
 }finally{h.close();}});
test('failed count cannot create partial PDF; account switch during download suppresses files',async()=>{const h=harness();try{
 let fail=true;h.reply((r,q)=>{if(r===78&&fail)throw Error('incomplete');return q();});h.open();h.check(76).click();h.check(78).click();await settle();
 assert.match(h.count(78),/조회 실패/);assert(h.button('문제지 PDF').disabled);assert.equal(h.downloads.length,0);
 fail=false;h.doc.querySelector('[aria-label="제78회 다시 시도"]').click();await settle();assert.match(h.count(78),/0문항/);
 h.staticReply(p=>p.endsWith('manifest.json')?null:{ok:false,status:404});
 let release;h.imageReply(()=>new Promise(r=>{release=r;}));h.button('문제지 PDF').click();await settle();assert.equal(h.images.length,1);h.logout();release(new h.w.Blob(['protected-valid'],{type:'image/webp'}));await settle();assert.equal(h.downloads.length,0);
 }finally{h.close();}});
test('rejects duplicate ids, invalid protected origin and mixed history-reset snapshots',async()=>{const h=harness();try{
 const w=h.w.HanqCbtWrongPrint,q=h.actual;
 assert.throws(()=>w.worksheetRows(raw(76,[q,q]),76));
 assert.throws(()=>w.worksheetRows(raw(76,[{...q,source:'review'}]),76));
 const review={...q,source:'review',image:q.image.replace('/runs/','/reviews/')};
 assert.equal(w.worksheetRows(raw(76,[review]),76).length,1);
 h.reply(r=>raw(r,[row(r,27)],r===78?'2026-11-22T00:00:00Z':null));h.open();h.check(76).click();h.check(78).click();await settle();
 h.button('해설지 PDF').click();await settle();assert.equal(h.downloads.length,0);assert.match(h.doc.querySelector('[role=status]').textContent,/기록 상태가 바뀌었어요/);
 }finally{h.close();}});
