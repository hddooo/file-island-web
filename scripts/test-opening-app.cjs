'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
(async()=>{
 const dom=new JSDOM('<main id="openingScript"></main>',{url:'https://synthetic.invalid/#chapter/opening/webtoon',runScripts:'outside-only'}),w=dom.window;
 for(const name of ['session','app'])w.eval(fs.readFileSync(path.join(__dirname,'../media/opening-script-'+name+'.js'),'utf8'));
 let checks=0;const ok=x=>{assert(x);checks++;};let state={signedIn:true,ownerId:'a',epoch:1},change;
 const api={state:()=>state,onChange:fn=>{change=fn;return()=>{change=null;};}},host=w.document.querySelector('main');
 const app=w.HanqOpeningScriptApp.create({document:w.document,api,workspaceFactory:()=>({}),adapter:{fromDocument:()=>({ready:true})}});
 ok(!w.HanqOpeningScriptApp.create({document:w.document,api,adapter:{fromDocument:()=>({ready:true})}}).available('opening',0));
 ok(app.available('opening',0));ok(app.available('opening',7));ok(app.available('opening',8));for(const [era,step]of [['joseon',0],['goryeo',0],['opening',6],['opening',1]])ok(!app.available(era,step));
 w.history.replaceState(null,'','?textbookSource=legacy#chapter/opening/webtoon');ok(!app.available('opening',0));w.history.replaceState(null,'','/#chapter/opening/webtoon');
 for(const action of ['retry','stop','account','route']){
  let loads=0,mounts=0;const session=w.HanqOpeningScriptSession.create({document:w.document,api,renderer:{prepare:async b=>b,mount:()=>{mounts++;return{stop(){},handlePopState(){return true;}};}}});
  const transport={ready:true,sourceSha256:'a'.repeat(64),loadBundle:async()=>{loads++;if(loads===1)throw Error('offline');return{source:{sha256:'a'.repeat(64)}};},loadStructure:async()=>({}),loadFigure:async()=>{}};
  await session.mount(host,transport);const retry=host.querySelector('.osr-bundle-retry');ok(retry);if(action==='stop')session.stop();if(action==='account')state={...state,ownerId:'b',epoch:2};if(action==='route')w.history.replaceState(null,'','/#history');retry.click();await new Promise(r=>setImmediate(r));ok(loads===(action==='retry'?2:1));ok(mounts===(action==='retry'?1:0));session.stop();state={signedIn:true,ownerId:'a',epoch:1};w.history.replaceState(null,'','/#chapter/opening/webtoon');
 }
 dom.window.close();console.log(JSON.stringify({checks,retryAfterStopBlocked:true,otherEraTabsUnchanged:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
