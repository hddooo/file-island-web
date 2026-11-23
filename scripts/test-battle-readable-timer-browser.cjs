'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT || 'playwright');
const file=n=>path.resolve(__dirname,'../media',n);
(async()=>{
 for(const [engine,width,height] of [[chromium,320,650],[chromium,1440,900],[webkit,390,844]]){
  const browser=await engine.launch({headless:true,...(engine===chromium&&process.env.HANQ_CHROMIUM_PATH?{executablePath:process.env.HANQ_CHROMIUM_PATH}:{})});
  try{
   const p=await browser.newPage({viewport:{width,height},hasTouch:width<500});
   await p.setContent('<meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1"><html data-hanq-theme=terminal><body style="margin:0"><main id=app></main></body>');
   await p.addStyleTag({path:file('battle-island.css')});
   await p.addScriptTag({path:file('battle-island.js')});
   await p.evaluate(()=>{
    crypto.randomUUID=()=> 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
    const base=Date.now();window.delta=0;Date.now=()=>base+window.delta;
    const id='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',f={name:'fixture',character:'botamon',characterName:'fixture',hp:50,maxHp:50,atk:10,def:5,luk:1,stageIndex:1};
    const d={id,subject:'history',side:'left',status:'playing',fighters:{left:f,right:f},ready:{left:true,right:true},round:1,start:base-1000,deadline:base+30000,submitted:{left:false,right:false},locked:{left:[],right:[]},myAnswers:[],question:{part:0,prompt:'원본',items:[{id:'1',number:47,prompt:'문제',choices:[1,2,3,4,5].map(n=>({id:'o'+n,text:String(n)}))}],images:[],audio:null},result:null,winner:null,grace:null};
    let publish;let revision=0;const push=override=>({...d,...override,serverNow:Date.now(),revision:++revision});
    window.publishBattle=override=>publish('snapshot',push(override));
    const api={state:()=>({signedIn:true,ownerId:'fixture'}),onChange:()=>()=>{},battleStream:fn=>{publish=fn;return()=>{};},battle:async(_,pathname)=>pathname==='/enter'?{matchId:id,serverNow:Date.now()}:push()};
    HanqBattle.mount(document.querySelector('main'),api,()=>{});
   });
   const timer=p.locator('.bi-modal-time'),final=p.locator('.bi-final-countdown');
   const expectFinal=async n=>p.waitForFunction(n=>{const el=document.querySelector('.bi-final-countdown');return el&&!el.hidden&&el.textContent===String(n);},n);
   const waitDelta=async n=>p.evaluate(n=>{window.delta=n;},n);
   await p.waitForFunction(()=>document.querySelector('.bi-modal-time')?.textContent==='30초');
   assert(!(await final.isVisible()));
   const normal=await timer.evaluate(e=>({size:parseFloat(getComputedStyle(e).fontSize),left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right,mid:innerWidth/2,toggle:e.parentNode.querySelector('.bi-fullscreen-toggle').getBoundingClientRect().left}));
   assert(normal.size>=24); assert(Math.abs((normal.left+normal.right)/2-normal.mid)<8&&normal.right<normal.toggle);
   await p.evaluate(()=>window.publishBattle({deadline:Date.now()+5000,submitted:{left:false,right:true}}));await expectFinal(5);
   const overlay=await final.evaluate(e=>({x:e.getBoundingClientRect().x+e.getBoundingClientRect().width/2,y:e.getBoundingClientRect().y+e.getBoundingClientRect().height/2,hit:getComputedStyle(e).pointerEvents,bg:getComputedStyle(e).backgroundColor, z:Number(getComputedStyle(e).zIndex)}));
   assert(Math.abs(overlay.x-width/2)<3&&Math.abs(overlay.y-height/2)<3&&overlay.hit==='none'&&overlay.z>10020&&/^rgba/.test(overlay.bg));
   await p.locator('.bi-choice').first().click();assert(await p.locator('.bi-choice').first().getAttribute('aria-pressed')==='true');
   for(const n of [4,3,2,1]){await waitDelta((5-n)*1000);await expectFinal(n);}
   await waitDelta(5000);await final.waitFor({state:'hidden'});assert.equal(await final.textContent(),'');
   await p.evaluate(()=>window.publishBattle({deadline:Date.now()+4000,submitted:{left:true,right:false}}));assert(!(await final.isVisible()));
   await p.evaluate(()=>window.publishBattle({deadline:Date.now()+4000,grace:{end:Date.now()+2000}}));assert(!(await final.isVisible()));
   await p.evaluate(()=>window.publishBattle({status:'playing',start:Date.now()+3000,deadline:Date.now()+4000}));assert(!(await final.isVisible()));
   await p.evaluate(()=>HanqBattle.stop()); assert.equal(await p.locator('.bi-final-countdown:visible').count(),0);
   console.log(`PASS ${engine.name()} ${width}×${height}: prominent timer, 5→1, no zero, no blocked touch/answers, own/ready/grace cleanup`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
