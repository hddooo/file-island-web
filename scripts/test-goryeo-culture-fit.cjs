'use strict';
// Synthetic text with the actual source cell map. No private textbook bytes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
function fixture(reader){
 const dom=new JSDOM('<main id="app"><section id="goryeoScript"></section></main>',{url:'https://synthetic.invalid/#chapter/goryeo/webtoon',runScripts:'outside-only'}),w=dom.window;
 w.eval(read('media/goryeo-script-structure-data.js'));
 const t=w.HanqGoryeoStructureData.tables.find(t=>t.id==='table22');
 const table={...t,captionMarkdown:'합성 문화 비교표',cells:t.cells.map(c=>({...c,id:'gs-table22-'+c.row+'-'+c.column,markdown:(c.isHeader?'항목 ':'- **합성 내용** ')+c.sourceId+'\n긴한국어줄바꿈검사 LongUnbrokenExampleWordForWrapping',bands:[],figures:[],noteMarkdown:''}))};
 const prepared={bundle:{schema:'hanq-goryeo-script/1',source:{sha256:'0'.repeat(64)},segments:[],topics:[{id:'culture',title:'문화',from:55,to:55}],figures:[]},tables:[table],segments:[{id:'culture-fixture',kind:'study',page:55,markdown:'@@table22@@'}],rootTitle:'합성 문화',orientationMarkdown:'',review:[],figures:[]};
 w.HanqGoryeoStructure={isPrepared:p=>p===prepared};w.eval(reader);
 const host=w.document.querySelector('#goryeoScript'),app=w.HanqGoryeoScriptReader.mount(host,prepared);
 return {dom,w,host,app,table};
}
const current=fixture(read('media/goryeo-script-reader.js'));
const signature=host=>Array.from(host.querySelectorAll('[data-cell]'),c=>({id:c.id,text:c.textContent,html:c.innerHTML,span:[c.rowSpan,c.colSpan],role:c.getAttribute('role'),scope:c.getAttribute('scope'),headers:c.getAttribute('headers'),owner:c.dataset.sourceOwner}));
assert.equal(current.host.querySelectorAll('[data-cell]').length,30);
assert.deepEqual(Array.from(current.host.querySelectorAll('col'),c=>c.style.width),['13%','37%','13%','37%']);
for(const c of current.table.cells){
 const n=current.w.document.getElementById(c.id);
 assert.equal(n.style.getPropertyValue('--gsr-culture-column'),String((c.column-1)%2+1));
 assert.equal(n.style.getPropertyValue('--gsr-culture-row'),String((c.row-1)*2+Math.floor((c.column-1)/2)+1));
 assert.equal(n.rowSpan,c.rowspan);assert.equal(n.colSpan,c.colspan);
 for(const ref of (n.getAttribute('headers')||'').split(' ').filter(Boolean))assert(current.w.document.getElementById(ref));
}
const before=current.host.querySelector('table');
const visualRows=Array.from(current.host.querySelectorAll('[data-cell]'),c=>Number(c.style.getPropertyValue('--gsr-culture-row')));
assert(visualRows.every((row,i)=>!i||row>=visualRows[i-1]),'mobile visual order follows DOM reading and keyboard order');
for(let n=0;n<3;n++)current.host.querySelector('[data-topic="culture"]').click();
assert.notEqual(current.host.querySelector('table'),before);
assert.equal(current.host.querySelectorAll('[data-cell]').length,30);
if(process.argv[2]){const baseline=fixture(fs.readFileSync(process.argv[2],'utf8'));assert.deepEqual(signature(current.host),signature(baseline.host));baseline.app.stop();baseline.dom.window.close();}
const css=read('media/goryeo-script-reader.css');
assert(!css.includes('min-width:1160px'));assert(!css.includes('200cqw'));
assert(css.includes('.gsr-independent-grid>tbody{display:grid;grid-template-columns:minmax(0,24%) minmax(0,1fr)'));
assert(!/gsr-independent-grid[^{}]*\{[^}]*transform\s*:/.test(css));
assert(css.includes('.gsr-structure-scroll{overflow-x:auto'));
current.app.stop();current.dom.window.close();
console.log(JSON.stringify({pass:true,cells:30,sourceIdsSpansHeadersAndContentPreserved:true,baselineCompared:!!process.argv[2],repeatMounts:3}));
