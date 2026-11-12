'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom'),crypto=require('crypto');
(async()=>{
 let total=0,views=0;
 const dom=new JSDOM('<main><p>앞 <strong>태</strong><strong>학</strong> 뒤 <b>소수림왕</b></p><p>원문 유지</p></main>',{runScripts:'outside-only',url:'https://synthetic.invalid/'}),w=dom.window,h=w.document.querySelector('main');w.eval(fs.readFileSync('media/blank-recall.js','utf8'));let original=h.innerHTML,c=w.HanqBlankRecall.decorate(h);assert.equal(c.count,2);assert(!h.textContent.includes('소수림왕'));let inputs=h.querySelectorAll('textarea');inputs[0].value='태 학';inputs[1].value='틀림';c.grade();assert.equal(h.querySelectorAll('.is-correct').length,1);assert.equal(h.querySelectorAll('.is-wrong').length,1);assert(h.textContent.includes('✕ 소수림왕'));c.reset();assert(!h.textContent.includes('소수림왕'));c.stop();assert.equal(h.innerHTML,original);w.close();
 const dir=process.argv[2];assert(dir,'private semantic directory required');
 for(const n of [9,11,12,17,18,20,21,23,24,26,31,32,35,36,109,111,116,117,118,123,124,127,129,131,133,134]){
  const page=JSON.parse(fs.readFileSync(dir+'/pages/page-'+String(n).padStart(3,'0')+'.json'));page.blocks=page.blocks.filter(b=>b.studySection==='concept');
  const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid/'}).window;
  for(const f of ['blank-recall','textbook-semantic'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
  const host=w.document.querySelector('main'),base=w.HanqTextbookSemantic.render(host,page,{}),headings=new Map([...host.querySelectorAll('[data-source-block]')].map(n=>[n.dataset.sourceBlock,n.textContent]));base.cleanup();const c=w.HanqTextbookSemantic.render(host,page,{blankRecall:true});await c.ready;
  for(const b of page.blocks){const spans=(b.lines||[]).flatMap(l=>l.spans||[]),text=spans.map(s=>s.text).join('');if(b.type==='heading'||(b.type==='text'&&(/^\s*<표\s*\d+>/.test(text)||spans.some(s=>s.fontSize>=13)))){const node=host.querySelector('[data-source-block="'+b.id+'"]');assert(node,'heading exists');assert.equal(node.querySelectorAll('textarea').length,0,b.id);assert.equal(node.textContent,headings.get(b.id),b.id);}}
  const count=host.querySelectorAll('textarea').length;assert(count>0,'bolds page '+n);total+=count;views++;assert.equal(host.querySelectorAll('[data-term-id]').length,0);c.cleanup();assert.equal(host.children.length,0);w.close();
 }
 for(const [era,hash] of [['goryeo','245d166b2a25'],['joseon','8d0944e32d86']]){
  const bundle=JSON.parse(fs.readFileSync(`C:/Users/INNOGRID/local-dev/hanq-api-private/${era}-script/history/${era}/81-2026/${hash}/bundle.json`));
  const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid/'}).window;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.defineProperty(w,'crypto',{value:crypto.webcrypto});
  w.eval(fs.readFileSync('media/blank-recall.js','utf8'));for(const f of era==='goryeo'?['goryeo-script-structure-data','goryeo-script-presentation-data','goryeo-script-structure']:[])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));w.eval(fs.readFileSync('media/'+era+'-script-reader.js','utf8'));
  const reader=w[era==='goryeo'?'HanqGoryeoScriptReader':'HanqJoseonScriptReader'],host=w.document.querySelector('main');const prepared=era==='goryeo'?await reader.prepare(bundle):bundle;let writes=0;const app=reader.mount(host,prepared,{initialMode:'recall',workspace:{show(){writes++;}}});
  for(const t of bundle.topics){host.querySelector('[data-topic="'+t.id+'"]').click();assert.equal(host.querySelectorAll('[data-mode="recall"],.blank-recall textarea').length,0,'removed mode opens source study');const body=host.querySelector(era==='goryeo'?'.gsr-body':'.jsr-body'),before=body.innerHTML;host.querySelector('[data-mode="study"]').click();assert.equal(body.innerHTML,before,'legacy mode and current study preserve identical source');views++;}
  assert.equal(writes,0);app.stop();w.close();
 }

 {
 const base='C:/Users/INNOGRID/local-dev/hanq-api-private/opening-script/history/opening/81-2026/255c37fb6812/';const b=JSON.parse(fs.readFileSync(base+'bundle.json')),d=JSON.parse(fs.readFileSync(base+'structure.json')),presentation=JSON.parse(fs.readFileSync('C:/Users/INNOGRID/Documents/Codex/2026-11-08/opening-browser-qa-private/presentation.private.json'));
 const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://synthetic.invalid/'}).window;w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.defineProperty(w,'crypto',{value:crypto.webcrypto});for(const f of ['blank-recall','opening-script-structure','opening-script-reader'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));const prepared=await w.HanqOpeningStructure.prepare(b,d,presentation),host=w.document.querySelector('main');let writes=0;const app=w.HanqOpeningScriptReader.mount(host,prepared,{initialMode:'recall',workspace:{show(){writes++;}}});for(const t of prepared.bundle.topics){host.querySelector('[data-topic="'+t.id+'"]').click();assert.equal(host.querySelectorAll('[data-mode="recall"],.blank-recall textarea').length,0,'opening legacy mode opens source study');const body=host.querySelector('.osr-body'),before=body.innerHTML;host.querySelector('[data-mode="study"]').click();assert.equal(body.innerHTML,before);views++;}assert.equal(writes,0);app.stop();w.close();
 }
 console.log(JSON.stringify({passed:true,views,isolatedDecoratorBlanks:total,removedReaderMode:true,sourceRestored:true,noPersistentWrites:true}));
})();
