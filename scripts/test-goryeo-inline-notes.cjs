'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),crypto=require('node:crypto'),{JSDOM}=require('jsdom');
(async()=>{
 const bundle=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),originalBundle=JSON.stringify(bundle);
 const dom=new JSDOM('<main></main>',{url:'https://goryeo-notes.invalid',runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.defineProperty(w,'crypto',{value:crypto.webcrypto});
 for(const file of ['goryeo-script-structure-data','goryeo-script-presentation-data','goryeo-script-structure','history81-term-data','history81-terms','goryeo-script-reader'])w.eval(fs.readFileSync('media/'+file+'.js','utf8'));
 const prepared=await w.HanqGoryeoScriptReader.prepare(bundle),host=w.document.querySelector('main'),mount=w.HanqHistory81Terms.mount;let moved=0,views=0;
 for(const topic of bundle.topics)for(const mode of ['study','exam']){
  w.history.replaceState(null,'');w.HanqHistory81Terms.mount=()=>({stop(){}});
  const reader=w.HanqGoryeoScriptReader.mount(host,prepared,{initialTopic:topic.id,initialMode:mode});w.HanqHistory81Terms.mount=mount;
  const original=host.innerHTML,elements=[...host.querySelectorAll('*')];
  const wrong=mount(host,'goryeo','wrong');assert.equal(wrong.count,0);assert.equal(host.innerHTML,original);wrong.stop();
  for(let repeat=0;repeat<2;repeat++){
   const view=mount(host,'goryeo',bundle.source.sha256),notes=[...host.querySelectorAll('[data-goryeo-source-note]')];
   assert.equal(notes.length,mode==='study'?(topic.id==='politics'?14:topic.id==='society'?4:0):0);
   for(const note of notes){const trigger=note.closest('.history81-term');assert(trigger);assert.equal(trigger.querySelectorAll('.history81-term').length,0);trigger.focus();const popup=w.document.querySelector('[role=tooltip]:not([hidden])');assert(popup&&Array.from(popup.textContent).length<=150);}
   if(!repeat)moved+=notes.length;view.stop();assert.equal(host.innerHTML,original);assert.deepEqual([...host.querySelectorAll('*')],elements,'original element identities restored');
  }
  reader.stop();assert.equal(w.document.querySelectorAll('[role=tooltip]').length,0);views++;
 }
 assert.equal(JSON.stringify(bundle),originalBundle,'source bundle, question IDs and answers stay unchanged');dom.window.close();console.log(JSON.stringify({views,moved,repeatedMount:true,sourceBundleUnchanged:true,originalNodesRestored:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
