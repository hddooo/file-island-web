'use strict';
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const eras=['prehistory','samguk','nambuk','goryeo','joseon','opening','colonial','modern'];
const states=['active-empty','paused-partial','completed-empty','completed-partial','active-full'];
function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
(async()=>{
 let cases=0;
 for(const status of states){
  const dom=new JSDOM('<main>'+eras.map(id=>'<button class="period ready" data-id="'+id+'"><strong>'+id+'</strong></button>').join('')+'</main>',{url:'https://fixture.test',runScripts:'outside-only'}),w=dom.window,d=w.document;
  w.eval(fs.readFileSync('media/era-study-progress.js','utf8'));
  const models={},records={},calls=[];
  for(const id of eras.map(id=>id==='samguk'?'ancient':id)){
   models[id]=freeze({id,version:'v',source:{sha256:source},items:[1,2].map(n=>({id:id+n,blanks:[{id:'b'+n}]}))});
   const responses={};if(status.endsWith('partial')||status.endsWith('full'))responses[id+'1']={values:['synthetic'],submitted:true,correct:false,checkedSlots:[true]};
   if(status.endsWith('full'))responses[id+'2']={values:['synthetic'],submitted:true,correct:true,checkedSlots:[true]};
   records[id]=freeze({version:'v',workspace:{status:status.split('-')[0],responses}});
  }
  const before=JSON.stringify({models,records});
  const api={state:()=>({signedIn:true,ownerId:'synthetic',epoch:1}),onChange:()=>()=>{},textbookSemanticQuiz:async id=>{calls.push(['model',id]);return models[id];},textbookSourceWorkspace:async id=>{calls.push(['workspace',id]);return records[id];}};
  const host=d.querySelector('main'),cards=[...host.children],controller=w.HanqEraProgress.mount(host,{api});await controller.ready;
  assert.equal(d.querySelectorAll('.era-progress-row').length,8);assert.equal(d.querySelectorAll('.era-complete,.hanq-completion-check').length,0);assert(!/[✓✔✅]/.test(host.textContent));assert.equal(d.querySelectorAll('.era-wrong-review:not([disabled])').length,8);
  for(const [i,id] of eras.entries()){
   assert.equal(d.querySelectorAll('.period')[i],cards[i]);const canonical=id==='samguk'?'ancient':id,stats=w.HanqEraProgress.summary(models[canonical],records[canonical]);
   assert.equal(stats.complete,status.startsWith('completed')||status.endsWith('full'));assert.equal(stats.done,status.endsWith('full')?2:status.endsWith('partial')?1:0);assert.equal(stats.wrong.length,status.endsWith('partial')||status.endsWith('full')?1:0);cases++;
  }
  assert.equal(calls.length,16);assert(!calls.some(call=>call[1]==='samguk'));assert.equal(JSON.stringify({models,records}),before);
  controller.stop();assert.equal(host.children.length,8);assert(cards.every((card,i)=>host.children[i]===card));dom.window.close();
 }
 const html=fs.readFileSync('index.html','utf8'),badge=html.split(/\r?\n/).find(line=>line.includes('function rpHomeBadge(id)'));
 const readBadge=vm.runInNewContext(badge+';rpHomeBadge("goryeo")',{rpSummary:()=>({chapter:{read:true},flows:[]})});
 assert.equal(readBadge,'<span class="rp-home">웹툰 읽음</span>');
 console.log(JSON.stringify({cases,allEras:true,checkmarks:0,progressPreserved:true,readBadgePreserved:true,productionWrites:0}));
})().catch(error=>{console.error(error);process.exitCode=1;});
