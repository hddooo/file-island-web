'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{webcrypto}=require('node:crypto'),{execFileSync}=require('node:child_process');
const {JSDOM}=require(process.env.JSDOM_PATH||'jsdom');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/practice-audio-unit');fs.mkdirSync(out,{recursive:true});
const dom=new JSDOM('<main id="host" class="tc"></main>',{url:'https://synthetic.invalid',runScripts:'outside-only'}),w=dom.window;
w.Blob=Blob;w.TextEncoder=TextEncoder;w.AbortController=AbortController;Object.defineProperty(w,'crypto',{value:webcrypto});
const stores=new Map(),downloads=[],revoked=[];let seq=0;
w.URL.createObjectURL=b=>{let u='blob:synthetic-'+(++seq);stores.set(u,b);return u;};w.URL.revokeObjectURL=u=>{revoked.push(u);stores.delete(u);};
w.HTMLAnchorElement.prototype.click=function(){downloads.push({name:this.download,blob:stores.get(this.href)});};
w.HTMLElement.prototype.scrollIntoView=function(){};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};
for(const f of ['toeic-practice-audio','toeic-practice-pdf','toeic-cbt'])w.eval(fs.readFileSync(path.join(root,'media',f+'.js'),'utf8'));
const Audio=w.HanqToeicPracticeAudio,PDF=w.HanqToeicPracticePdf,id='11111111-1111-4111-8111-111111111111';
let owner='a',epoch=1,restoring=false,delay=0,failure=false,payload='group',callbacks=[],calls=[],items=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));async function until(fn){for(let i=0;i<500;i++){if(fn())return;await sleep(5);}throw Error('timeout');}
function q(part,n,extra={}){return{part,number:n,displayNumber:String(n).padStart(4,'0'),collectionId:id,groupId:'p'+part+'q'+n,sourceTitle:'합성 TEST 1',groupQuestionNumbers:[n],options:[{id:'A',text:'A'},{id:'B',text:'B'}],audioUrl:part<=4?'https://synthetic.invalid/p'+part+'q'+n+'.mp3':null,originalWrong:true,available:true,...extra};}
const api={state:()=>({signedIn:!!owner,ownerId:owner,epoch,restoring}),onChange:fn=>{callbacks.push(fn);return()=>callbacks=callbacks.filter(x=>x!==fn);},ensureSession:async()=>{},toeicCbt:async(method,p)=>{assert.equal(method,'GET');assert.equal(p,'/practice');return{items};},toeicCbtAudio:async(cid,g,signal)=>{calls.push({cid,g,signal});assert.equal(cid,id);if(delay)await new Promise((resolve,reject)=>{const t=setTimeout(resolve,delay);signal&&signal.addEventListener('abort',()=>{clearTimeout(t);reject(Error('aborted'));},{once:true});});if(failure)throw Error('network');return payload instanceof Blob?payload:new Blob(['ID3'+(payload==='group'?g:payload)],{type:'audio/mpeg'});}};
function reset(){calls=[];delay=0;failure=false;payload='group';}
function emit(){callbacks.slice().forEach(fn=>fn());}
(async()=>{
 let checks=0;
 let shared=[q(3,39,{groupId:'group',audioUrl:'https://synthetic.invalid/shared.mp3'}),q(3,40,{groupId:'group',audioUrl:'https://synthetic.invalid/shared.mp3',originalWrong:false}),q(4,71)];
 assert.equal(Audio.plan(shared,[3,4]).tracks.length,2);assert.equal(Audio.plan(shared,[3,4]).tracks[0].references[0].numbers.length,2);checks+=2;
 shared.push(q(3,41,{groupId:'second',audioUrl:'https://synthetic.invalid/shared.mp3'}));assert.equal(Audio.plan(shared,[3,4]).tracks.length,2);checks++;
 const result=await Audio.generate(shared,[3,4],{api});assert.equal(result.count,2);assert.equal(calls.length,2);assert.equal(result.filename,'HanQ-Practice-Parts-3-4-Audio.zip');assert.equal(result.blob.type,'application/zip');checks+=4;
 fs.writeFileSync(path.join(out,'parts3-4.zip'),Buffer.from(await result.blob.arrayBuffer()));
 const inspected=JSON.parse(execFileSync('python3',['-c',`import zipfile,json,sys\nz=zipfile.ZipFile(sys.argv[1]);assert z.testzip() is None\nprint(json.dumps({'names':z.namelist(),'manifest':z.read('음원-목록.txt').decode('utf-8-sig'),'audio':[z.read(n).decode() for n in z.namelist() if n.endswith('.mp3')]}))`,path.join(out,'parts3-4.zip')],{encoding:'utf8'}));
 assert.equal(inspected.names.length,3);assert(inspected.names.some(n=>n.startsWith('Part3/')));assert(inspected.names.some(n=>n.startsWith('Part4/')));assert(inspected.manifest.includes('0039·0040'));assert(inspected.manifest.includes('0041'));assert(!inspected.manifest.includes('https://'));assert(!inspected.manifest.includes(id));checks+=7;
 reset();payload='identical';assert.equal((await Audio.generate([q(1,1),q(1,2)],[1],{api})).count,1);assert.equal(calls.length,2);checks+=2;
 reset();await assert.rejects(()=>Audio.generate([q(2,1),q(2,2,{audioUrl:null})],[2],{api}),/missing_audio/);assert.equal(calls.length,0);checks+=2;
 await assert.rejects(()=>Audio.generate([q(5,101)],[5,6],{api}),/empty/);assert.equal(calls.length,0);checks+=2;
 await assert.rejects(()=>Audio.generate([q(1,1,{originalWrong:false})],[1],{api}),/empty/);checks++;
 assert.throws(()=>Audio.plan([q(3,39,{groupId:'g'}),q(3,40,{groupId:'g'})],[3,4]),/invalid_audio/);checks++;
 for(const url of ['http://synthetic.invalid/x','javascript:alert(1)','https://user:secret@synthetic.invalid/x'])assert.throws(()=>Audio.plan([q(1,1,{audioUrl:url})],[1]),/invalid_audio/);checks+=3;
 for(const blob of [new Blob(['html'],{type:'text/html'}),new Blob([],{type:'audio/mpeg'}),new Blob([new Uint8Array(20*1024*1024+1)],{type:'audio/mpeg'})]){payload=blob;await assert.rejects(()=>Audio.generate([q(1,1)],[1],{api}),/invalid_audio|too_large/);checks++;}
 reset();owner=null;await assert.rejects(()=>Audio.generate([q(1,1)],[1],{api}),/signed_out/);assert.equal(calls.length,0);owner='a';checks+=2;
 restoring=true;await assert.rejects(()=>Audio.generate([q(1,1)],[1],{api}),/signed_out/);restoring=false;checks++;
 delay=30;let pending=Audio.generate([q(1,1),q(1,2)],[1],{api});owner='b';epoch++;await assert.rejects(()=>pending,/cancelled/);assert.equal(calls.length,1);checks+=2;
 reset();delay=30;const abort=new AbortController();pending=Audio.generate([q(1,1),q(1,2)],[1],{api,signal:abort.signal});abort.abort();await assert.rejects(()=>pending,/aborted|cancelled/);assert.equal(calls.length,1);checks+=2;
 reset();let active=true;pending=Audio.generate([q(1,1)],[1],{api,isCurrent:()=>active,onProgress:t=>{if(t.includes('ZIP'))active=false;}});await assert.rejects(()=>pending,/cancelled/);checks++;
 // Actual Practice menu and PDF integration, with synthetic authenticated reads.
 reset();items=[q(1,1),q(2,2),q(3,39),q(4,71),q(5,101),q(7,150)];const host=w.document.querySelector('#host');w.HanqToeicCbt.mount(host,{api,onAccount:()=>{}});await until(()=>host.querySelectorAll('.tc-audio-export').length===5);
 assert.equal(host.querySelectorAll('.tc-pdf-export').length,10);assert.equal(host.querySelectorAll('.tc-audio-export:disabled').length,2);assert.equal(host.querySelectorAll('.tc-audio-export')[3].textContent,'음원 없음');assert.equal(host.querySelectorAll('.tc-group button').length,0);checks+=4;
 let b=host.querySelector('.tc-audio-export');const footer=b.parentElement;assert.equal(b.previousElementSibling.dataset.mode,'answers');checks++;
 delay=50;b.click();b.click();assert.equal(calls.length,1);assert(b.disabled);host.querySelectorAll('.tc-audio-export')[1].click();assert(host.textContent.includes('다른 파트의 음원'));footer.querySelector('.tc-audio-export-cancel').click();await sleep(80);assert.equal(downloads.length,0);assert(!b.disabled);assert(calls[0].signal.aborted);checks+=6;
 reset();failure=true;b.click();await until(()=>footer.textContent.includes('ZIP을 만들지 않았어요'));assert.equal(downloads.length,0);assert(!b.disabled);checks+=2;
 reset();b.click();await until(()=>downloads.length===1);assert.equal(stores.size,1);assert.equal(footer.querySelector('.tc-audio-download').download,'HanQ-Practice-Part-1-Audio.zip');checks+=2;
 const old=footer.querySelector('.tc-audio-download').href;b.click();await until(()=>downloads.length===2);assert(revoked.includes(old));assert.equal(stores.size,1);checks+=2;
 w.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:true}));assert(b.disabled);assert.equal(stores.size,0);assert.equal(host.querySelectorAll('.tc-audio-download').length,0);checks+=3;
 w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:true}));assert(!b.disabled);b.click();await until(()=>downloads.length===3);checks++;
 delay=40;b.click();w.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:true}));w.dispatchEvent(new w.PageTransitionEvent('pageshow',{persisted:true}));await sleep(80);assert.equal(downloads.length,3);assert(!b.disabled);checks+=2;
 b.click();owner='c';epoch++;emit();await sleep(80);assert.equal(downloads.length,3);assert.equal(stores.size,0);checks+=2;
 reset();await until(()=>host.querySelector('.tc-audio-export'));b=host.querySelector('.tc-audio-export');b.click();await until(()=>downloads.length===4);host.querySelector('.tc-group').click();await sleep(20);assert.equal(stores.size,0);assert.equal(host.querySelectorAll('.tc-audio-export').length,0);checks+=2;
 w.HanqToeicCbt.stop();assert.equal(stores.size,0);checks++;
 const standalone=w.document.createElement('div');host.appendChild(standalone);PDF.mount(standalone,{items,parts:[1],api});delay=40;standalone.querySelector('.tc-audio-export').click();w.dispatchEvent(new w.PageTransitionEvent('pagehide',{persisted:false}));await sleep(70);assert.equal(downloads.length,4);assert.equal(standalone.querySelectorAll('.tc-audio-export').length,0);checks+=2;
 assert(calls.every(c=>c.cid===id));checks++;
 const summary={passed:true,checks,synthetic:true,productionWrites:0,zipIntegrity:'Python zipfile.testzip; UTF-8 names; unchanged MP3 bytes',engine:'JSDOM + Node WebCrypto'};fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(summary));dom.window.close();
})().catch(e=>{console.error(e.stack);dom.window.close();process.exitCode=1;});
