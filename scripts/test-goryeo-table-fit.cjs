'use strict';
// Runtime private input only. This compares real content and recall behavior, not browser geometry.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),bundle=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),original=JSON.stringify(bundle);
async function fixture(reader){
 const dom=new JSDOM('<main id="app"><section id="goryeoScript"></section></main>',{url:'https://synthetic.invalid/#chapter/goryeo/webtoon',runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.defineProperty(w,'crypto',{value:crypto.webcrypto});w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const f of ['goryeo-script-structure-data','goryeo-script-presentation-data','goryeo-script-structure','history81-term-data','history81-terms','blank-recall'])w.eval(read('media/'+f+'.js'));
 w.eval(reader);const prepared=await w.HanqGoryeoStructure.prepare(bundle),host=w.document.querySelector('#goryeoScript'),app=w.HanqGoryeoScriptReader.mount(host,prepared);
 return {dom,w,host,app};
}
const signature=host=>Array.from(host.querySelectorAll('table[data-structure]'),t=>({id:t.dataset.structure,cells:Array.from(t.querySelectorAll('[data-cell]'),c=>({id:c.id,html:c.innerHTML,span:[c.rowSpan,c.colSpan],headers:c.getAttribute('headers'),scope:c.getAttribute('scope'),owner:c.dataset.sourceOwner}))}));
(async()=>{
 const current=await fixture(read('media/goryeo-script-reader.js')),baseline=await fixture(fs.readFileSync(process.argv[3],'utf8')),results=[];
 for(const topic of bundle.topics)for(const mode of ['study','exam']){
  for(const f of [current,baseline]){f.host.querySelector('[data-topic="'+topic.id+'"]').click();f.host.querySelector('[data-mode="'+mode+'"]').click();}
  const before=signature(current.host);assert.deepEqual(before,signature(baseline.host));
  for(const table of current.host.querySelectorAll('table[data-structure]')){
   const cols=Array.from(table.querySelectorAll('col'),c=>c.style.width);assert(cols.every(c=>c.endsWith('%')));assert(Math.abs(cols.reduce((n,c)=>n+parseFloat(c),0)-100)<.01);
  }
  const recalls=[current,baseline].map(f=>f.w.HanqBlankRecall.decorate(f.host.querySelector('.gsr-body')));assert.equal(recalls[0].count,recalls[1].count);
  const fields=[current,baseline].map(f=>Array.from(f.host.querySelectorAll('.blank-recall-slot textarea')));
  assert.deepEqual(fields[0].map(n=>n.getAttribute('aria-label')),fields[1].map(n=>n.getAttribute('aria-label')));
  for(const inputs of fields)for(const input of inputs){input.value='긴 합성 오답 LongUnbrokenExampleWordForWrapping';input.dispatchEvent(new input.ownerDocument.defaultView.Event('input',{bubbles:true}));}
  assert.equal(recalls[0].grade(),recalls[1].grade());assert.deepEqual(Array.from(current.host.querySelectorAll('.blank-recall-feedback'),n=>n.textContent),Array.from(baseline.host.querySelectorAll('.blank-recall-feedback'),n=>n.textContent));
  recalls.forEach(r=>r.reset());assert(fields.flat().every(n=>n.value===''));
  recalls.forEach(r=>r.stop());assert.deepEqual(signature(current.host),before);assert.deepEqual(signature(baseline.host),before);
  results.push({topic:topic.id,mode,tables:before.map(t=>t.id),cells:before.reduce((n,t)=>n+t.cells.length,0),recallFields:fields[0].length});
 }
 assert.equal(JSON.stringify(bundle),original);for(const f of [current,baseline]){f.app.stop();assert.equal(f.host.children.length,0);f.dom.window.close();}
 const css=read('media/goryeo-script-reader.css');assert(!/gsr-(?:ruler|exam)-grid\{min-width:(?:760|900)px/.test(css));
 console.log(JSON.stringify({pass:true,actualPrivateBundle:true,sourceUnchanged:true,baselineContentIdsSpansHeadersAndRecallEqual:true,renderedLayout:false,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
