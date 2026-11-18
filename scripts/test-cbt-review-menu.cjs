'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),{JSDOM}=require(process.env.HANQ_JSDOM_PATH);
const site=fs.readFileSync('index.html','utf8');
const routeLines=site.match(/\/\^#formal-exams[^;]+?\$\/\)/g)||[];
assert.equal(routeLines.filter(t=>t.includes('history-')).length,2);
(async()=>{
 const dom=new JSDOM('<main id="formalExamHost"></main>',{url:'https://review.test',runScripts:'outside-only'}),w=dom.window,host=w.document.querySelector('main');
 const date='2026-11-17T15:00:00.000Z',rates={80:80,79:70,78:60,77:59,76:92};
 let opts,route;
 w.HanqCbtRoundMaterials={latest:(_owner,r)=>r in rates?{at:date,right:rates[r],total:100,marked:false}:null,mount:(_el,o)=>{opts=o;return {stop(){}};}};
 w.eval(fs.readFileSync('media/formal-exams.js','utf8'));
 const api={state:()=>({signedIn:true,ownerId:'test',epoch:1}),enabled:()=>true,onChange:()=>()=>{},ensureSession:async()=>{},cbt:async(_,path)=>path.endsWith('/rounds')?{rounds:Array.from({length:11},(_,i)=>({round:70+i,available:true})),imagesConfigured:true}:{runs:[]}};
 const settings={api,onRoute:r=>route=r},tick=()=>new Promise(r=>setImmediate(r));
 w.HanqFormalExams.mount(host,settings);await tick();
 for(const [round,color] of [[80,'green'],[79,'orange'],[78,'yellow'],[77,'red'],[76,'green']]){
   const row=host.querySelector('#feRound'+round).parentNode.querySelector('.fe-round-material-actions'),recent=row.firstElementChild;
   assert.equal(recent.tagName,'BUTTON');assert.equal(recent.dataset.materialAction,'history');
   assert.equal(recent.nextElementSibling.dataset.materialAction,'review');
   assert(recent.querySelector('b').classList.contains('fe-round-rate-'+color));
   assert.equal(recent.querySelector('time').textContent,'11.18 (수)');
 }
 host.querySelector('[data-material-round="80"][data-material-action="history"]').click();
 assert.equal(route,'materials-history-80');assert(opts.history&&!opts.restart);
 w.HanqFormalExams.stop();w.HanqFormalExams.mount(host,settings,'materials-history-80');await tick();
 assert.equal(opts.round,80);assert(opts.history&&!opts.restart);
 opts.onBack();await tick();
 host.querySelector('[data-material-round="80"][data-material-action="review"]').click();
 assert.equal(route,'materials-80');assert(opts.restart&&!opts.history);
 w.HanqFormalExams.stop();w.HanqFormalExams.mount(host,settings,'materials-80');await tick();
 assert.equal(opts.round,80);assert(!opts.restart&&!opts.history);
 w.HanqFormalExams.stop();dom.window.close();
 console.log('PASS recent review four colors, date in Seoul with weekday, latest archive action vs fresh retry');
})().catch(e=>{console.error(e);process.exitCode=1;});
