'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const w=new JSDOM('<main></main>',{runScripts:'outside-only',url:'https://test.invalid'}).window,d=w.document,h=d.querySelector('main');
for(const file of ['glossary-data','history81-term-data','history81-terms','history81-glossary','textbook-semantic','opening-script-reader'])w.eval(fs.readFileSync('media/'+file+'.js','utf8'));
const original=JSON.stringify(w.HanqHistory81TermData),g=w.HanqHistory81Glossary,data=g.data();let count=0;
for(const e of data.entries){
 const native=w.HANQ_GLOSSARY.find(v=>e.id.endsWith('-'+v.id));assert.equal(e.summary,native.short);assert.ok([...e.summary].length<=150);
 h.innerHTML='<p><strong data-history-source-emphasis></strong></p>';h.querySelector('strong').textContent=e.phrase;const text=h.textContent;
 let c=g.mount(h,e.era,data.sources[e.era]);assert.equal(c.count,1,e.phrase);h.querySelector('.history81-term').click();assert.equal(d.querySelector('[role=tooltip]').textContent,e.summary);c.stop();c.stop();assert.equal(d.querySelectorAll('[role=tooltip]').length,0);assert.equal(h.textContent,text);assert.equal(h.querySelectorAll('.history81-term').length,0);
 c=g.mount(h,e.era,'wrong');assert.equal(c.count,0);c.stop();count++;
}
for(const html of ['고인<strong data-history-source-emphasis>돌</strong>','<strong data-history-source-emphasis>고인돌</strong>무덤','<strong>고인돌</strong>','<button><strong data-history-source-emphasis>고인돌</strong></button>']){h.innerHTML=html;const c=g.mount(h,'prehistory',data.sources.prehistory);assert.equal(c.count,0);c.stop();}
assert.equal(JSON.stringify(w.HanqHistory81TermData),original);
for(const n of [41,60,94,140,141,142,144])assert.equal(g.pageEra({pdfPage:n}),null);
const page={schemaVersion:'hanq-semantic/1',sourceSha256:data.sources.prehistory,pdfPage:8,reviewStatus:'unverified',blocks:[{id:'fixture',type:'text',lines:[{spans:[{text:'고인돌',bold:true}]}]}],sourceBlanks:[],generatedPractice:[]};
let c=w.HanqTextbookSemantic.render(h,page);assert.equal(h.querySelectorAll('[data-history-source-emphasis]').length,1);assert.equal(h.querySelectorAll('.history81-term').length,1);h.querySelector('.history81-term').click();c.cleanup();assert.equal(d.querySelectorAll('[role=tooltip]').length,0);
page.sourceSha256='35d850c6e9d9910c24cccce4b2ae37b963ee1ecd24f1926033f48d98f9de0442';c=w.HanqTextbookSemantic.render(h,page);assert.equal(h.querySelectorAll('.history81-term').length,0);c.cleanup();
h.replaceChildren();w.HanqOpeningScriptReader.inline(d,h,'**당백전**');let terms=g.mount(h,'opening',data.sources.opening);assert.equal(terms.count,1);const trigger=h.querySelector('.history81-term');Object.defineProperty(w,'innerWidth',{value:320,configurable:true});Object.defineProperty(w,'innerHeight',{value:480,configurable:true});trigger.click();assert.ok(parseFloat(d.querySelector('[role=tooltip]').style.maxWidth)<=296);d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.ok(d.querySelector('[role=tooltip]').hidden);terms.stop();
console.log('PASS: '+count+' exact verified aliases; source binding, unchanged definitions, no substring, cleanup, renderer and mobile tooltip guards');w.close();
