// Ice-island connection light: driven only by the real stream/HTTP callbacks, never by a timer guess.
const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom'),nap=ms=>new Promise(r=>setTimeout(r,ms));
const sources=['media/battle-connection.js','media/battle-island.js'].map(f=>fs.readFileSync(f,'utf8'));
function dom(){const d=new JSDOM('<main></main>',{url:'https://fixture.test',runScripts:'outside-only',pretendToBeVisual:true});d.window.matchMedia=()=>({matches:true,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}});sources.forEach(s=>d.window.eval(s));return d;}
(async()=>{const d=dom(),w=d.window,doc=w.document;let listener,onError,opens=0,stops=0;
 const lobby={serverNow:Date.now(),participants:[],matchId:null};
 const api={state:()=>({signedIn:true,ownerId:'a'}),onChange:()=>()=>{},battleStream:(cb,fail)=>{opens++;listener=cb;onError=fail;return()=>stops++;},battle:async(method,path)=>path==='/enter'||path==='/lobby'?lobby:{}};
 const light=()=>doc.querySelector('.bi-connection'),notice=()=>doc.querySelector('.bi-notice'),retry=()=>Array.from(doc.querySelectorAll('button')).find(b=>b.textContent==='다시 연결'&&!b.hidden);
 try{
  w.HanqBattle.mount(doc.querySelector('main'),api,()=>{});await nap(20);
  // Sits next to the title; normal progress text is no longer printed as a notice.
  assert.equal(light().previousElementSibling.textContent,'얼음섬');
  assert.equal(light().dataset.state,'connecting');assert.equal(notice().textContent,'');assert.equal(notice().hidden,true);
  assert.equal(opens,1);listener('waiting',{});
  assert.equal(light().dataset.state,'connected');assert(!doc.body.textContent.includes('대기실에 연결됐어요'));
  const toggle=light().querySelector('button'),detail=light().querySelector('[role=tooltip]');
  assert.equal(toggle.getAttribute('aria-describedby'),detail.id);assert(toggle.getAttribute('aria-label').includes('연결됨'));assert(detail.textContent.includes('연결됨'));
  // Tap opens the same explanation; Escape and blur close it.
  toggle.click();assert.equal(toggle.getAttribute('aria-expanded'),'true');assert(light().classList.contains('is-open'));
  toggle.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(toggle.getAttribute('aria-expanded'),'false');
  // Transient drop: yellow while the existing reconnect logic retries.
  onError({status:0,code:'network'});assert.equal(light().dataset.state,'connecting');assert(detail.textContent.includes('다시 연결하고 있어요'));
  // Stale callbacks from the closed stream are ignored; the next failure must come from the reopened stream.
  await nap(1000);assert.equal(opens,2);assert.equal(light().dataset.state,'connecting');
  // A non-transient failure is red, and the visible notice plus retry button stay (important errors are not hidden).
  onError({status:400,code:'stream_rejected'});assert.equal(light().dataset.state,'disconnected');
  assert.equal(notice().hidden,false);assert(notice().textContent.includes('연결이 끊겼어요'));assert(retry(),'retry action stays visible');assert(detail.textContent.includes('다시 연결 버튼'));
  w.HanqBattle.stop();await nap(10);assert.equal(doc.querySelectorAll('.bi-connection').length,0);assert(stops>=1);
 }finally{w.close();}
 console.log('PASS light beside title, connecting→connected→reconnecting→disconnected from real callbacks, tap/Escape explanation, errors kept visible, cleanup');
})().catch(e=>{console.error(e);process.exitCode=1;});
