'use strict';
// Synthetic source text only. The public mapping supplies real cell coordinates/spans.
// This checks rendering contracts and CSS rules, not browser layout or private content.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const reader=read('media/goryeo-script-reader.js'),css=read('media/goryeo-script-reader.css');
let checks=0;
const ok=(value,message)=>{assert(value,message);checks++;};
function fixture(source=reader){
 const dom=new JSDOM('<html><body><main id="app"><div class="device-content"><section id="goryeoScript"></section></div></main></body></html>',{url:'https://synthetic.invalid/#chapter/goryeo/webtoon',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.eval(read('media/goryeo-script-structure-data.js'));
 const tableIds=['table15','table16'],tables=w.HanqGoryeoStructureData.tables.filter(t=>tableIds.includes(t.id)).map(t=>({...t,captionMarkdown:'합성 비교표 '+t.id,cells:t.cells.map(c=>({...c,id:'gs-'+t.id+'-'+c.row+'-'+c.column,markdown:c.label?'':c.row===1?'**시대 '+c.column+'**':c.column===1?'항목 '+c.row:'**합성 내용** '+c.row+':'+c.column+' → 긴한국어문구줄바꿈검사 (1234~1456)\n추가 줄과 영문LongUnbrokenWordForWrapping',bands:[],figures:[],noteMarkdown:''}))}));
 const bundle={schema:'hanq-goryeo-script/1',source:{sha256:'0'.repeat(64)},segments:[],topics:[{id:'politics',title:'합성 학습',from:41,to:41}],figures:[]};
 const prepared={bundle,tables,rootTitle:'합성 고려 표 검사',orientationMarkdown:'',review:[],figures:[],segments:[{id:'synthetic-table-page',kind:'study',page:41,markdown:'@@table15@@\n@@table16@@'}]};
 w.HanqGoryeoStructure={isPrepared:value=>value===prepared};
 const observers=[];w.ResizeObserver=class{constructor(callback){this.callback=callback;this.targets=[];this.disconnected=false;observers.push(this);}observe(e){this.targets.push(e);}disconnect(){this.disconnected=true;}};
 w.eval(source);const host=d.querySelector('#goryeoScript'),app=w.HanqGoryeoScriptReader.mount(host,prepared);
 return {dom,w,d,host,app,tables,observers};
}
const current=fixture(),table=current.host.querySelector('.gsr-period-grid');
ok(table,'table15 uses its own period grid');
ok(table.querySelectorAll('tr').length===5,'five logical rows retained');
ok(table.querySelectorAll('[data-cell]').length===29,'all 29 source cells retained');
ok(table.querySelector('[data-cell="5:4"]').colSpan===2,'shared last-row cell retains colspan=2');
const widths=Array.from(table.querySelectorAll('col'),c=>c.style.width);
assert.deepEqual(widths,['12%','17.6%','17.6%','17.6%','17.6%','17.6%']);checks++;
ok(Math.abs(widths.reduce((sum,width)=>sum+parseFloat(width),0)-100)<.001,'columns share exactly the available width');
assert.deepEqual(Array.from(current.host.querySelectorAll('.gsr-ruler-grid col'),c=>c.style.width),['17%','52%','31%']);checks++;
for(const spec of current.tables){
 const rendered=current.host.querySelector('table[data-structure="'+spec.id+'"]');
 for(const cell of spec.cells){
  const e=current.d.getElementById(cell.id);ok(e&&e.closest('table')===rendered,'stable source cell ID '+cell.id);
  ok(e.rowSpan===cell.rowspan&&e.colSpan===cell.colspan,'source spans '+cell.id);
  for(const ref of (e.getAttribute('headers')||'').split(' ').filter(Boolean))ok(current.d.getElementById(ref),'header association '+ref);
 }
}
const merged=table.querySelector('[data-cell="5:4"]');
assert.deepEqual(merged.getAttribute('headers').split(' '),['gs-table15-5-1','gs-table15-1-4','gs-table15-1-5']);checks++;
ok(!table.querySelector('[data-period-label],.gsr-mobile-label'),'no duplicate generated source labels');
for(const observer of current.observers){
 const wrap=observer.targets[0];Object.defineProperties(wrap,{clientWidth:{get:()=>300},scrollWidth:{get:()=>300,configurable:true}});observer.callback();
 ok(current.d.getElementById(wrap.getAttribute('aria-describedby')).hidden,'fitted table does not advertise horizontal scrolling');
 Object.defineProperty(wrap,'scrollWidth',{get:()=>600,configurable:true});observer.callback();
 ok(!current.d.getElementById(wrap.getAttribute('aria-describedby')).hidden,'overflow safety hint remains functional');
}
function signature(host){return Array.from(host.querySelectorAll('table[data-structure]'),t=>({id:t.dataset.structure,caption:t.querySelector('caption').textContent,cells:Array.from(t.querySelectorAll('[data-cell]'),c=>({id:c.id,tag:c.tagName,html:c.innerHTML,rowspan:c.rowSpan,colspan:c.colSpan,scope:c.getAttribute('scope'),role:c.getAttribute('role'),headers:c.getAttribute('headers')}))}));}
if(process.argv[2]){const before=fixture(fs.readFileSync(process.argv[2],'utf8'));assert.deepEqual(signature(current.host),signature(before.host));checks++;before.app.stop();before.dom.window.close();}
const styles=new JSDOM('<style></style>').window.document;styles.querySelector('style').textContent=css;
const rules=Array.from(styles.styleSheets[0].cssRules),normal=rules.filter(r=>r.selectorText),mobile=rules.find(r=>r.conditionText==='(max-width:700px)'&&Array.from(r.cssRules).some(c=>c.selectorText==='.goryeo-script-reader .gsr-period-grid'));
const rule=(selector,list=normal)=>{const found=list.find(r=>r.selectorText===selector);ok(found,'scoped CSS '+selector);return found.style;};
const period=rule('.goryeo-script-reader .gsr-period-grid');
ok(parseFloat(period.getPropertyValue('min-width'))===0&&period.getPropertyValue('max-width')==='100%','no forced 1120px minimum');
ok(period.getPropertyValue('font-size')==='14px','compact desktop reading size');
const cells=rule('.goryeo-script-reader .gsr-period-grid :is(th,td)');
ok(cells.getPropertyValue('padding')==='6px 4px','compact desktop cell padding');
ok(cells.getPropertyValue('overflow-wrap')==='anywhere'&&cells.getPropertyValue('word-break')==='normal','long labels and words can wrap without clipping');
ok(!cells.getPropertyPriority('font-size'),'company-mode 13px can retain priority');
ok(rule('.goryeo-script-reader .gsr-period-grid :is(p,li)').getPropertyValue('font-size')==='inherit','source paragraphs inherit compact cell size');
ok(mobile,'narrow-screen rules are present');
ok(rule('.goryeo-script-reader .gsr-period-grid',Array.from(mobile.cssRules)).getPropertyValue('font-size')==='13px','narrow layout uses readable 13px, not scaled transform');
ok(rule('.goryeo-script-reader .gsr-period-grid :is(th,td)',Array.from(mobile.cssRules)).getPropertyValue('padding')==='5px 2px','narrow layout saves horizontal padding');
ok(rule('.goryeo-script-reader .gsr-structure-scroll').getPropertyValue('overflow-x')==='auto','overflow remains recoverable rather than hidden');
ok(rule('.goryeo-script-reader :is(.gsr-ruler-grid,.gsr-exam-grid)').getPropertyValue('min-width')==='0','other source tables also fit the reading width');
ok(rule('.goryeo-script-reader .gsr-independent-grid').getPropertyValue('min-width')==='0','table22 fits the reading width under its own responsive contract');
const company=read('media/company-mode.css');
ok(company.includes(':is(p,li,dt,dd,td,th,label,blockquote){font-size:13px!important;line-height:1.8!important}'),'company-mode cell and paragraph size remains 13px');
ok(!css.match(/gsr-period-grid[^{}]*\{[^}]*font-family/),'no company font override');
ok(!css.match(/gsr-period-grid[^{}]*\{[^}]*(?:overflow(?:-x)?:hidden|transform:scale)/),'no clipping or scaling workaround');
// JSDOM has no geometry engine. Expand width media rules explicitly to test the
// real stylesheet cascade at each target width without calling it visual QA.
const companyStyle=styles.createElement('style');companyStyle.textContent=company.replace(/^@import[^;]+;/,'');styles.head.append(companyStyle);
function atWidth(list,width){return Array.from(list).map(r=>{
 if(r.media){const maxima=Array.from(r.conditionText.matchAll(/max-width:\s*(\d+)px/g),m=>Number(m[1])),minima=Array.from(r.conditionText.matchAll(/min-width:\s*(\d+)px/g),m=>Number(m[1]));return maxima.every(n=>width<=n)&&minima.every(n=>width>=n)&&!/prefers-/.test(r.conditionText)?atWidth(r.cssRules,width):'';}
 return r.cssText;
}).join('\n');}
for(const width of [320,390,768,1440]){
 const style=current.d.createElement('style');style.textContent=atWidth(rules,width)+'\n'+atWidth(companyStyle.sheet.cssRules,width);current.d.head.append(style);
 for(const companyMode of ['off','on']){
  current.d.documentElement.dataset.companyMode=companyMode;
  const expected=companyMode==='on'||width<=700?'13px':'14px';
  for(const selector of ['[data-cell="2:2"]','[data-cell="2:2"] p']){
   const computed=current.w.getComputedStyle(table.querySelector(selector));ok(computed.fontSize===expected,'computed type size '+width+'/'+companyMode+'/'+selector);
   if(companyMode==='on')ok(computed.fontFamily.includes('--company-font'),'company code-font cascade '+width+'/'+selector);
  }
  const cellStyle=current.w.getComputedStyle(table.querySelector('[data-cell="2:2"]'));
  ok(cellStyle.paddingLeft===(width<=700?'2px':'4px'),'computed horizontal padding '+width+'/'+companyMode);
 }
 style.remove();
}
current.app.stop();ok(current.observers.every(o=>o.disconnected),'layout observers stop on unmount');current.dom.window.close();
console.log(JSON.stringify({pass:true,checks,source:'synthetic text with actual table15/table16 coordinate mapping',baselineCompared:!!process.argv[2],scope:'DOM text/styles/ID/header/span preservation, proportional columns, compact CSS, company size priority, overflow hint and cleanup; not rendered viewport QA'}));
