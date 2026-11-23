'use strict';
/* Isolated local Chrome fixture. Real page styles, control code and exam image;
 * account and grading data are intentionally synthetic. No production access. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {spawn}=require('node:child_process'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const chrome=process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const profile=fs.mkdtempSync(path.join(os.tmpdir(),'hanq-review-dock-'));
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const styles=[...html.matchAll(/<style\b[^>]*>[\s\S]*?<\/style>|<link\b[^>]*rel=["']stylesheet["'][^>]*>/gi)].map(m=>m[0]).filter(v=>v.startsWith('<style')||/href=["'](?:\.?\/)?media\//.test(v));
function fixtures(){
 const w=window,host=document.querySelector('#formalExamHost'),id='10000000-0000-4000-8000-000000000001';
 const board=w.createCbtStarsFixture(w),base=board.api,real=board.create(72,true);
 const opts=[1,2,3,4,5].map(number=>({id:'choice'+number,number}));
 const text='길게 쓰인 가상 해설을 끝까지 읽을 수 있고 문제 이동과 답안 표시가 유지되는지 검증합니다. '.repeat(10);
 const one=n=>({questionId:'exam-72-'+n,version:'synthetic',exam:72,number:n,position:n-1,points:2,runId:id,
  starred:true,everWrong:true,selectedOptionId:'choice2',options:opts,
  image:'/api/v1/cbt/runs/'+id+'/questions/'+(n-1)+'/image',common:{image:'/api/v1/cbt/runs/'+id+'/questions/'+(n-1)+'/common',questionNumbers:[47,48]},
  review:{status:'wrong',correct:false,correctNumber:1,correctOptionId:'choice1'}});
 const wrong=[one(47),one(48)], routes=[];
 const sourceStar={...one(47),questionId:'exam-69-11',exam:69,number:11,position:10,
  paperImported:true,starred:true,everWrong:false,selectedOptionId:null,common:null,image:'/api/v1/cbt/runs/'+id+'/questions/10/image',
  review:{status:'correct',correct:true,correctNumber:2,correctOptionId:'choice2'}};
 w.HanqCbtExplanations={reviewParts:()=>({stem:[text,text,text],conclusion:text})};
 const api={...base,state:()=>({signedIn:true,ownerId:'fixture',epoch:1}),
  cbtImage:p=>fetch('/media/cbt-originals/'+(p.endsWith('/common')?'72-common47-48.webp':p.includes('/questions/47/')?'72-48.webp':p.includes('/questions/10/')?'69-11.webp':'72-47.webp')).then(r=>r.blob()),
  cbt:(m,p,b,o)=>{
   if(p.endsWith('/review-materials/69'))return Promise.resolve({scope:'exam-starred-or-ever-wrong',round:69,items:[sourceStar],hasMore:false,pendingStarCount:0,resetAt:null});
   if(p.endsWith('/review-materials/72'))return Promise.resolve({scope:'exam-starred-or-ever-wrong',round:72,items:wrong,hasMore:false,pendingStarCount:0,resetAt:null});
   if(p.endsWith('/notebook'))return Promise.resolve({scope:'finalized-exam-selected-wrong',limit:500,items:wrong,hasMore:false,resetAt:null});
   if(p.endsWith('/rounds'))return Promise.resolve({imagesConfigured:true,rounds:Array.from({length:14},(_,i)=>({round:67+i,available:true}))});
   if(p.endsWith('/claim'))return Promise.resolve(board.snapshot(real));
   return base.cbt(m,p,b,o);
  }};
 const config={...board.opts(),api,onRoute:r=>routes.push(r)};
 w.mountReview=(route)=>w.HanqFormalExams.mount(host,config,route);
 w.realFixture=real;w.reviewRoutes=routes;
}
const page=()=> '<!doctype html><html data-hanq-theme="terminal"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+styles.join('')+'</head><body class="study-global-footer"><main id="app" class="shell digivice-v2"><div class="device-content"><div id="formalExamHost"></div></div></main><nav id="fixtureGlobal" style="position:fixed;bottom:0;left:0;right:0;height:76px;pointer-events:none" aria-hidden="true"></nav>'+['scripts/fixtures/cbt-stars-fixture.js','media/formal-exams.js','media/cbt-wrong-notebook.js','media/grade-feedback.js','media/cbt-round-materials.js'].map(f=>'<script src="/'+f+'"></script>').join('')+'<script>('+fixtures.toString()+')();</script></body></html>';
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});return res.end(page());}
 const p=path.resolve(root,'.'+url.pathname);
 if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}
 res.writeHead(200,{'Content-Type':p.endsWith('.webp')?'image/webp':p.endsWith('.css')?'text/css; charset=utf-8':p.endsWith('.js')?'application/javascript; charset=utf-8':'application/octet-stream'});
 fs.createReadStream(p).pipe(res);
});
function cdp(url){
 const ws=new WebSocket(url);let seq=0;const pending=new Map();
 ws.addEventListener('message',e=>{const msg=JSON.parse(e.data),v=pending.get(msg.id);if(v){pending.delete(msg.id);if(msg.error)v.reject(Error(JSON.stringify(msg.error)));else v.resolve(msg.result);}});
 return new Promise((resolve,reject)=>{ws.addEventListener('error',reject,{once:true});ws.addEventListener('open',()=>resolve({
  send:(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));}),
  close:()=>ws.close()
 }),{once:true});});
}
(async()=>{
 let child,c;
 try{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const local='http://127.0.0.1:'+server.address().port;
  child=spawn(chrome,['--headless','--no-first-run','--disable-background-networking','--disable-default-apps','--disable-sync','--disable-extensions','--mute-audio','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
  let port;
  for(let i=0;i<150;i++){try{port=fs.readFileSync(path.join(profile,'DevToolsActivePort'),'utf8').split('\n')[0];break;}catch{await delay(100);}}
  assert(port,'isolated Chrome started');
  const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
  c=await cdp(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);const command=c.send;
  const value=async expression=>{const r=await command('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||JSON.stringify(r.exceptionDetails));return r.result.value;};
  async function ready(expr){for(let i=0;i<100;i++){if(await value(expr))return;await delay(50);}throw Error('not ready: '+expr+' '+await value('document.querySelector("#formalExamHost")?.innerText'));}
  function click(sel){return value('document.querySelector('+JSON.stringify(sel)+').click();true');}
  const metric=(dock,scroll)=>value('(()=>{const d=document.querySelector('+JSON.stringify(dock)+'),p=document.querySelector('+JSON.stringify(scroll)+');const a=d.getBoundingClientRect(),b=p.getBoundingClientRect(),children=[...d.querySelectorAll("nav button")].map(n=>{const t=n.getBoundingClientRect();return {text:n.textContent,top:t.top,bottom:t.bottom,left:t.left,right:t.right,height:t.height};});return {a:{left:a.left,right:a.right,top:a.top,bottom:a.bottom},b:{top:b.top,bottom:b.bottom},children,width:innerWidth,height:innerHeight,scrolled:p.scrollTop,available:p.scrollHeight-p.clientHeight,outside:document.querySelector(".device-content").scrollTop};})()');
  const cases=[];
  for(const [width,height,mobile] of [[320,590,true],[390,695,true],[1440,900,false]])for(const company of [false,true]){
   await command('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile});
   await command('Emulation.setTouchEmulationEnabled',{enabled:mobile});
   await command('Page.navigate',{url:local+'/?'+width+String(company)});await ready('typeof window.mountReview==="function"');
   await value('localStorage.clear();document.documentElement.style.setProperty("--study-footer-height","76px");document.documentElement.setAttribute("data-company-mode",'+JSON.stringify(company?'on':'off')+');mountReview();true');
   await ready('!!document.querySelector('+JSON.stringify('[data-material-round="72"][data-material-action="review"]')+')');
   async function parityRoute(label,open){
    await open();
    const query='.fe-round-review-scroll',dock='.fe-round-review-dock';
    await ready('document.querySelector("'+query+' img")?.naturalHeight===766 && document.querySelector(".fe-round-question-image img")?.naturalWidth>0');
    const pre=await metric(dock,query);
    if(process.env.DEBUG_DOCK)console.error(JSON.stringify(await value('(()=>({view:[innerWidth,innerHeight,visualViewport.height], vars:getComputedStyle(document.documentElement).getPropertyValue("--study-viewport-height"),dims:["body","#app",".device-content","#formalExamHost","#feRoundMaterials",".fe-round-review-workspace",".fe-round-review-scroll",".fe-round-review-dock"].map(s=>{const n=document.querySelector(s),c=getComputedStyle(n),r=n.getBoundingClientRect();return [s,r.top,r.bottom,c.height,c.minHeight,c.maxHeight,c.display,c.flex,c.position,c.marginTop,c.paddingTop,c.overflowY,c.boxSizing]}),styles:[...document.styleSheets].map(s=>s.href).filter(u=>u?.includes("cbt-results"))}))()')));
    assert.deepEqual(pre.children.map(x=>x.text),['‹','1','2','3','4','5','★★','확인']);
    assert(pre.available>60,JSON.stringify({label,width,pre}));
    assert(pre.children.every(x=>x.height>=43&&x.left>=0&&x.right<=width&&Math.abs(x.top-pre.children[0].top)<1));
    assert(pre.a.bottom<=height&&pre.a.bottom>=height-(mobile?118:46),JSON.stringify({label,width,pre}));
    await value('document.querySelector("'+query+'").scrollTop=10000;true');
    const down=await metric(dock,query);assert(down.scrolled>60);assert.equal(down.a.top,pre.a.top);assert.equal(down.a.bottom,pre.a.bottom);
    await click('[data-review-choice]:nth-child(2)');
    assert.equal(await value('!!document.querySelector(".fe-round-review-explanation")'),false);
    await click('[data-round-review-action=check]');
    await ready('document.querySelector(".fe-round-review-feedback")?.textContent.includes("오답")');
    const g=await value('(()=>{const overlay=document.querySelector(".fe-round-review-stage>.is-review-centered.is-wrong"),pane=document.querySelector(".fe-round-review-scroll"),svg=overlay.querySelector("svg"),a=pane.getBoundingClientRect(),b=svg.getBoundingClientRect();return {dx:Math.abs((b.left+b.right-a.left-a.right)/2),dy:Math.abs((b.top+b.bottom-a.top-a.bottom)/2),width:b.width,pointer:getComputedStyle(overlay).pointerEvents,pen:getComputedStyle(svg.querySelector(".hgf-first")).animationName};})()');
    assert.ok(g.dx<=2&&g.dy<=2&&g.width>=84&&g.width<=136&&g.pointer==='none'&&g.pen===(company?'none':'hgf-first'),JSON.stringify({width,company,g}));
    assert.equal(await value('document.querySelector(".fe-round-practice-position svg")'),null);
    const after=await metric(dock,query);
    assert.equal(after.children.at(-1).text,'›');assert.deepEqual(after.a,pre.a,JSON.stringify({label,width,company,after,pre}));
    assert(after.scrolled>60&&after.available>pre.available);assert.equal(after.outside,pre.outside);
    await value('document.querySelector("'+query+'").scrollTop=10000;true');
    const bottom=await metric(dock,query);assert(bottom.scrolled>=bottom.available-2);assert.equal(bottom.a.top,after.a.top);assert.equal(bottom.a.bottom,after.a.bottom);
    await click('[data-round-review-action=next]');
    await ready('document.querySelector(".fe-round-practice-position")?.textContent==="2/2"');
    assert.equal(await value('document.querySelector("'+query+'").scrollTop'),0);
    await click('[data-review-choice]:nth-child(1)');await click('[data-round-review-action=check]');
    await ready('document.querySelector(".fe-round-review-feedback")?.textContent.includes("정답")');
    assert.equal(await value('document.querySelector(".fe-round-review-stage>.hanq-grade-burst")?.classList.contains("is-right")'),true);
    assert.equal(await value('getComputedStyle(document.querySelector(".fe-round-review-stage .hgf-correct")).animationName'),company?'none':'hgf-pen');
    await value('Array.from(document.querySelectorAll(".fe-full-answer-submit button")).find(b=>b.textContent==="최종 제출").click();true');
    await ready('document.querySelector(".fe-round-review-percent strong")?.textContent==="50%"');
    cases.push({width,company,label,dockBottom:pre.a.bottom,questionScroll:down.scrolled,expandedScroll:bottom.scrolled});
   }
   await parityRoute('회차별',()=>click('[data-material-round="72"][data-material-action="review"]'));
   await value('mountReview("materials-69");true');
   await ready('document.querySelector(".fe-round-question-image img")?.naturalWidth>0');
   const mark='.fe-round-review-dock .fe-round-review-mark';
   assert.equal(await value('document.querySelector(".fe-round-saved-star")?.textContent'),'★ 원본 별표');
   assert.equal(await value('document.querySelector('+JSON.stringify(mark)+').getAttribute("aria-pressed")'),'false');
   await click(mark);
   await value('mountReview("materials-69");true');
   await ready('!!document.querySelector(".fe-round-saved-star")');
   assert.equal(await value('document.querySelector('+JSON.stringify(mark)+').getAttribute("aria-pressed")'),'true');
   await click(mark);
   await value('mountReview("materials-69");true');
   await ready('!!document.querySelector(".fe-round-saved-star")');
   assert.equal(await value('document.querySelector('+JSON.stringify(mark)+').getAttribute("aria-pressed")'),'false');
   await value('mountReview();true');await ready('!!document.querySelector("#feAllWrongPractice")');
   await parityRoute('전체',()=>click('#feAllWrongPractice'));
   await value('mountReview();true');await ready('!!document.querySelector('+JSON.stringify('[data-material-round="72"][data-material-action="history"]')+')');
   await click('[data-material-round="72"][data-material-action="history"]');
   await ready('document.querySelector(".fe-round-review-result")?.innerText.includes("최근 제출한 복습 결과")');
   assert.equal(await value('!!document.querySelector(".fe-round-review-dock")'),false);
   await value('Array.from(document.querySelectorAll("#feRoundMaterials button")).find(b=>b.textContent==="다시 풀기").click();true');
   await ready('!!document.querySelector(".fe-round-review-dock")');
   if(await value('document.querySelector(".fe-round-review-dock .fe-round-review-mark").getAttribute("aria-pressed")==="false"'))await click('.fe-round-review-dock .fe-round-review-mark');
   await click('[data-round-star-filter]');
   await ready('document.querySelector(".fe-round-practice-position")?.textContent==="1/1"');
   assert.equal(await value('document.querySelector(".fe-round-review-dock .fe-round-review-mark").getAttribute("aria-pressed")'),'true');
   assert.equal((await metric('.fe-round-review-dock','.fe-round-review-scroll')).children.length,8);
   await value('mountReview(realFixture);true');await ready('!!document.querySelector(".fe-active-run .fe-full-answer-dock")');
   const formal=await metric('.fe-active-run .fe-full-answer-dock','#feImage');
   assert.deepEqual(formal.children.map(x=>x.text),['‹','1','2','3','4','5','☆','›']);
   assert(cases.slice(-2).every(x=>Math.abs(formal.a.bottom-x.dockBottom)<=3),JSON.stringify({width,company,formal,review:cases.slice(-2)}));
   await click('#feNext');await ready('!document.querySelector("#fePrev")?.disabled');
  }
  console.log(JSON.stringify({count:cases.length,cases,regularMock:'matching dock baseline and next navigation',archives:'history retry/double-star tested',source:'original 72-47 + shared 47–48 WebPs, synthetic account, no production'}));
 }finally{if(c)c.close();if(child){child.kill();await delay(300);}await new Promise(r=>server.close(r));fs.rmSync(profile,{recursive:true,force:true});}
})().catch(e=>{console.error(e);process.exitCode=1});
