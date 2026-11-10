'use strict';
// Runtime private input only. This DOM test does not perform browser layout QA.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),bundle=JSON.parse(fs.readFileSync(process.argv[2],'utf8')),original=JSON.stringify(bundle);
async function fixture(readerPath){
 const dom=new JSDOM('<main id="app"><section id="goryeoScript"></section></main>',{url:'https://synthetic.invalid/#chapter/goryeo/webtoon',runScripts:'outside-only'}),w=dom.window;
 w.TextEncoder=TextEncoder;w.TextDecoder=TextDecoder;Object.defineProperty(w,'crypto',{value:crypto.webcrypto});w.HTMLElement.prototype.scrollIntoView=function(){};
 for(const f of ['goryeo-script-structure-data','goryeo-script-presentation-data','goryeo-script-structure','history81-term-data','history81-terms'])w.eval(fs.readFileSync(path.join(root,'media',f+'.js'),'utf8'));
 w.eval(fs.readFileSync(readerPath,'utf8'));
 const prepared=await w.HanqGoryeoStructure.prepare(bundle),host=w.document.querySelector('#goryeoScript'),app=w.HanqGoryeoScriptReader.mount(host,prepared,{initialTopic:'culture'});
 return {dom,w,host,app};
}
const signature=host=>Array.from(host.querySelectorAll('table[data-structure]'),t=>({id:t.dataset.structure,cells:Array.from(t.querySelectorAll('[data-cell]'),c=>({id:c.id,html:c.innerHTML,text:c.textContent,span:[c.rowSpan,c.colSpan],headers:c.getAttribute('headers'),scope:c.getAttribute('scope'),owner:c.dataset.sourceOwner}))}));
(async()=>{
 const current=await fixture(path.join(root,'media/goryeo-script-reader.js')),baseline=await fixture(path.resolve(process.argv[3]));let views=0;
 for(const topic of bundle.topics)for(const mode of ['study','exam']){
  for(const f of [current,baseline]){f.host.querySelector('[data-topic="'+topic.id+'"]').click();f.host.querySelector('[data-mode="'+mode+'"]').click();}
  assert.deepEqual(signature(current.host),signature(baseline.host));views++;
 }
 current.host.querySelector('[data-topic="culture"]').click();current.host.querySelector('[data-mode="study"]').click();
 const table=current.host.querySelector('table[data-structure="table22"]'),terms=Array.from(table.querySelectorAll('.history81-term'));
 assert.equal(table.querySelectorAll('[data-cell]').length,30);assert.equal(current.host.querySelectorAll('.gsr-culture-gallery figure').length,17);assert.equal(terms.length,29);
 const rows=terms.map(n=>Number(n.closest('[data-cell]').style.getPropertyValue('--gsr-culture-row')));
 assert(rows.every((row,i)=>!i||row>=rows[i-1]),'actual glossary DOM/Tab order follows mobile grid rows');
 for(const n of terms){n.focus();assert.equal(current.w.document.activeElement,n);n.dispatchEvent(new current.w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));}
 assert.equal(JSON.stringify(bundle),original);
 current.app.stop();baseline.app.stop();assert.equal(current.w.document.querySelectorAll('[role="tooltip"]').length,0);current.dom.window.close();baseline.dom.window.close();
 console.log(JSON.stringify({pass:true,actualPrivateBundle:true,views,cultureCells:30,galleryFigures:17,glossaryTerms:29,mobileFocusOrder:rows,sourceUnchanged:true,baselineContentIdsSpansAndHeadersEqual:true,renderedLayout:false}));
})().catch(e=>{console.error(e);process.exitCode=1;});
