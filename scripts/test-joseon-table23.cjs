'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process'),{JSDOM}=require('jsdom');
const bytes=fs.readFileSync(process.argv[2]),bundle=require('./build-joseon-script.cjs').convert(bytes);
const baseline='65675ab4afae4a920aaca28ed89d36a4b673a7f6';
function setup(code){const dom=new JSDOM('<main></main>',{url:'https://synthetic.invalid/',runScripts:'outside-only'});dom.window.URL.revokeObjectURL=()=>{};dom.window.HTMLElement.prototype.scrollIntoView=function(){};dom.window.eval(code);const host=dom.window.document.querySelector('main'),app=dom.window.HanqJoseonScriptReader.mount(host,bundle);return {dom,host,app};}
const before=setup(cp.execFileSync('git',['show',baseline+':media/joseon-script-reader.js'],{encoding:'utf8'}));
const after=setup(fs.readFileSync(require.resolve('../media/joseon-script-reader.js'),'utf8'));
function text(node){const copy=node.cloneNode(true);copy.querySelectorAll('.jsr-inline-figure').forEach(f=>f.replaceWith(copy.ownerDocument.createTextNode(f.dataset.studyLabel)));copy.querySelectorAll('figure,.jsr-row-source,.jsr-source-label').forEach(e=>e.remove());return copy.textContent.replace(/\s+/g,'');}
function emphasis(node){return [...node.querySelectorAll('strong,u,[data-source-color]')].map(e=>[e.tagName,e.dataset.sourceColor||'',e.textContent]);}
const expected=[];
for(const page of [60,61]){const article=[...before.host.querySelectorAll('.jsr-source-card')].find(a=>a.querySelector('.jsr-source-label').textContent.startsWith('PDF '+page+'쪽'));let active=false,row=null;for(const node of article.children){if(node.tagName==='H3'&&/^〈표 23〉/.test(node.textContent)){active=true;continue;}if(!active)continue;if(node.tagName==='H4'){row=before.dom.window.document.createElement('div');expected.push(row);}if(row)row.append(node.cloneNode(true));}}
assert.equal(expected.length,10);assert.equal(after.host.querySelectorAll('.jsr-king-table').length,1);
const actual=[...after.host.querySelectorAll('.jsr-king-table>tbody>tr')];assert.equal(actual.length,10);
const oldIntro=before.host.querySelector('[data-page="60"]')||[...before.host.querySelectorAll('.jsr-source-card')].find(a=>a.querySelector('.jsr-source-label').textContent.startsWith('PDF 60'));
const originalIntro=oldIntro.cloneNode(true);let inTable=false;[...originalIntro.children].forEach(n=>{if(n.tagName==='H3'&&n.textContent.includes('23'))inTable=true;if(inTable)n.remove();});
const newIntro=after.host.querySelector('[data-page="60"]').cloneNode(true);newIntro.querySelectorAll('.jsr-transcription>summary').forEach(n=>n.remove());
assert.equal(text(newIntro),text(originalIntro));assert.deepEqual(emphasis(newIntro),emphasis(originalIntro));
assert.equal(after.host.querySelectorAll('.jsr-transcription:not([open])').length,2);assert.equal(after.host.querySelector('.jsr-king-table').closest('details'),null);
actual.forEach((row,i)=>{assert.equal(text(row),text(expected[i]),'Learning text/order changed in row '+i);assert.deepEqual(emphasis(row),emphasis(expected[i]),'Source emphasis changed in row '+i);assert.equal(row.querySelector('th').scope,'row');});
assert(after.host.querySelector('.jsr-subperson').textContent.includes('태조 이성계 → 정도전'));
assert.equal(after.host.querySelector('[data-figure="p060-03.png"]').closest('tr'),actual[1]);assert.equal(after.host.querySelector('[data-figure="p061-01.png"]').closest('tr'),actual[2]);
for(const [name,index] of [['p061-03.png',7],['p061-02.png',7],['p061-04.png',8],['p061-05.png',9]]){const f=after.host.querySelector('[data-figure="'+name+'"]');assert.equal(f.closest('tr'),actual[index]);assert(f.closest('li'));assert(f.classList.contains('jsr-inline-figure'));assert(f.querySelector('figcaption').hidden);assert(f.querySelector('[data-source-color="#ed7d31"]'));}
let figures=0;
for(const topic of bundle.topics){before.host.querySelector('[data-topic="'+topic.id+'"]').click();after.host.querySelector('[data-topic="'+topic.id+'"]').click();const oldFigures=[...before.host.querySelectorAll('figcaption')].map(c=>c.textContent).sort(),newFigures=[...after.host.querySelectorAll('figcaption')].map(c=>c.textContent).sort();assert.deepEqual(newFigures,oldFigures);figures+=newFigures.length;
 for(const article of after.host.querySelectorAll('.jsr-source-card')){if(['60','60–61'].includes(article.dataset.page))continue;const original=before.host.querySelector('[id="'+article.id+'"]');assert(original);assert.equal(text(article),text(original));assert.deepEqual(emphasis(article),emphasis(original));}
 for(const button of after.host.querySelectorAll('.jsr-toc button')){button.click();assert(after.dom.window.document.activeElement.isConnected);assert(after.host.querySelector('.jsr-body').contains(after.dom.window.document.activeElement));}
}
assert.equal(figures,38);assert.deepEqual(fs.readFileSync(process.argv[2]),bytes);before.app.stop();after.app.stop();before.dom.window.close();after.dom.window.close();
console.log(JSON.stringify({table23:1,orderedRows:10,rowTextExact:true,rowEmphasisExact:true,inlineBadges:4,figures,otherStudyTextExact:true,tocTargetsConnected:true,sourceUnchanged:true}));
