const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('media/cbt-paper-results.js','utf8');
let checks=0;const ok=(v)=>{assert(v);checks++;};
function fixture(){const dom=new JSDOM('<button id="origin">open</button>',{url:'https://study.test',runScripts:'outside-only'}),w=dom.window;w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};let state={signedIn:true,ownerId:'alice',epoch:1},listener,calls=[],items=[],post;
 const summary=b=>({id:'result-1',examRound:b.examRound,wrongNumbers:b.wrongNumbers,wrongCount:b.wrongNumbers.length,correctCount:50-b.wrongNumbers.length,score:b.wrongNumbers.length?75:100,maxScore:100,source:'paper-reported',selectedAnswersKnown:false,reportedAt:'2026-11-16T12:00:00Z'});
 const api={state:()=>state,onChange:fn=>{listener=fn;return()=>{listener=null}},cbt:async(m,p,b)=>{calls.push({m,p,b});if(m==='GET')return {items};if(post)return post(b);const r=summary(b);items.push(r);return {result:r};}};w.eval(source);return{w,dom,api,calls,summary,setPost:f=>post=f,setItems:v=>items=v,change:s=>{state=s;if(listener)listener(s);},get module(){return w.HanqCbtPaperResults}};}
const tick=async()=>{for(let i=0;i<10;i++)await Promise.resolve();};
function fill(f,value,perfect=false){let d=f.w.document;d.querySelector('#prWrong').value=value;d.querySelector('#prPerfect').checked=perfect;d.querySelector('#prCompleted').checked=true;d.querySelector('#prCompleted').dispatchEvent(new f.w.Event('change'));}
function submit(f){f.w.document.querySelector('form').dispatchEvent(new f.w.Event('submit',{bubbles:true,cancelable:true}));}
(async()=>{
 let f=fixture(),p=f.module.parseNumbers;
 assert.deepEqual(Array.from(p('5, 3 5，9',false).values),[3,5,9]);ok(p('5, 3 5，9',false).duplicates===1);
 for(const v of ['0','51','1.5','-1','1-3','1,x','NaN','1,'])assert.throws(()=>p(v,false));checks+=8;
 assert.throws(()=>p('',false));assert.throws(()=>p('3',true));ok(p('',true).values.length===0);
 await f.module.open({api:f.api});ok(f.w.document.querySelector('button[type=submit]').disabled);
 fill(f,'5 3 5');submit(f);submit(f);await tick();ok(f.calls.filter(x=>x.m==='POST').length===1);let b=f.calls.find(x=>x.m==='POST').b;assert.deepEqual(Array.from(b.wrongNumbers),[3,5]);ok(b.completed===true&&!!b.idempotencyKey&&b.examRound===80);ok(f.w.document.body.textContent.includes('종이 풀이 기록을 저장했어요'));ok(!Object.keys(b).some(k=>/answer|time|xp/i.test(k)));ok(f.w.sessionStorage.length===0);f.dom.window.close();
 f=fixture();await f.module.open({api:f.api});fill(f,'',true);submit(f);await tick();ok(f.calls.find(x=>x.m==='POST').b.wrongNumbers.length===0);f.dom.window.close();
 f=fixture();f.setPost(()=>Promise.reject(new Error('network')));await f.module.open({api:f.api});fill(f,'4, 6');submit(f);await tick();ok(f.w.document.querySelector('#prWrong').disabled);let key=f.calls.find(x=>x.m==='POST').b.idempotencyKey;f.module.stop();await f.module.open({api:f.api});ok(f.w.document.querySelector('#prWrong').value==='4, 6');f.setPost(b=>Promise.resolve({result:f.summary(b)}));Array.from(f.w.document.querySelectorAll('button')).find(x=>x.textContent==='같은 결과 저장 확인').click();await tick();ok(f.calls.filter(x=>x.m==='POST')[1].b.idempotencyKey===key);ok(f.w.sessionStorage.length===0);f.dom.window.close();
 f=fixture();let resolve;f.setPost(b=>new Promise(r=>resolve=()=>r({result:f.summary(b)})));await f.module.open({api:f.api});fill(f,'3');submit(f);await tick();f.change({signedIn:true,ownerId:'bob',epoch:2});resolve();await tick();ok(!f.w.document.querySelector('dialog'));ok(f.w.sessionStorage.length===1);await f.module.open({api:f.api});ok(f.w.document.querySelector('#prWrong').value==='');f.dom.window.close();
 f=fixture();f.api.cbt=async()=>{throw {status:404}};await f.module.open({api:f.api});fill(f,'3');submit(f);await tick();ok(f.w.document.querySelector('button[type=submit]').disabled);ok(f.w.document.body.textContent.includes('아직 서버에 준비되지'));f.dom.window.close();
 f=fixture();await f.module.open({api:f.api});fill(f,'3');f.w.document.querySelector('#prCompleted').checked=false;submit(f);await tick();ok(!f.calls.some(x=>x.m==='POST'));f.dom.window.close();
 f=fixture();f.setItems([{id:'bad'}]);await f.module.open({api:f.api});ok(f.w.document.querySelector('button[type=submit]').disabled);f.dom.window.close();
 f=fixture();f.w.document.querySelector('#origin').focus();await f.module.open({api:f.api});f.w.dispatchEvent(new f.w.Event('hashchange'));ok(!f.w.document.querySelector('dialog'));ok(f.w.document.activeElement.id==='origin');f.dom.window.close();
 ok(fs.readFileSync('index.html','utf8').includes('media/cbt-paper-results.js'));ok(fs.readFileSync('media/formal-exams.js','utf8').includes('fePaperResults'));
 console.log('Paper results: '+checks+' validation, lifecycle, auth, safe retry and entry assertions passed');
})().catch(e=>{console.error(e);process.exitCode=1});
