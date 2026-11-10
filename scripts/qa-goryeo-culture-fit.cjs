'use strict';
// Private bundle is provided at runtime and must never be added to Git.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{chromium,webkit}=require('playwright');
const root=path.resolve(process.env.QA_BASELINE_ROOT||path.join(__dirname,'..')),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const bundle=process.argv[2]==='--synthetic'?null:JSON.parse(fs.readFileSync(process.argv[2],'utf8')),out=path.resolve(process.argv[3]);
const html=read('index.html'),css=[...html.matchAll(/<link\b[^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>{if(m[0].startsWith('<style'))return m[0].replace(/^<style[^>]*>|<\/style>$/g,'');const f=m[0].match(/href="\/?(media\/[^"?]+\.css)/);return f?read(f[1]):''}).join('\n');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const engine=process.env.QA_BROWSER==='webkit'?'webkit':'chromium',browser=await ({chromium,webkit}[engine]).launch({headless:true,...(process.env.QA_EXECUTABLE?{executablePath:process.env.QA_EXECUTABLE}:{}),...(engine==='chromium'?{args:['--no-sandbox']}: {})});const results=[],errors=[];
 try{
  for(const width of [320,390,768,1024,1440])for(const company of ['off','on'])for(const height of [900,420]){
   const p=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/*',r=>r.request().url().startsWith('https://culture.test/')?r.fulfill({contentType:'text/html',body:'<!doctype html><html data-hanq-theme="terminal"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style></head><body data-island="history"><main id="app" class="shell"><section id="goryeoScript"></section></main></body></html>'}):r.abort());
   await p.goto('https://culture.test/#chapter/goryeo/webtoon');
   for(const f of ['goryeo-script-structure-data.js','goryeo-script-presentation-data.js','goryeo-script-structure.js','history81-term-data.js','history81-terms.js','goryeo-script-reader.js','display-mode.js'])await p.addScriptTag({content:read('media/'+f)});
   await p.evaluate(async({bundle,company})=>{
    if(bundle)window.prepared=await HanqGoryeoStructure.prepare(bundle);
    else{
     const t=HanqGoryeoStructureData.tables.find(t=>t.id==='table22');
     const table={...t,captionMarkdown:'합성 문화 비교표',cells:t.cells.map(c=>({...c,id:'gs-table22-'+c.row+'-'+c.column,markdown:'**초조대장경** '+(c.isHeader?'합성 항목 '+c.sourceId:'\n- '+('합성 내용의 줄바꿈과 가로 잘림을 확인합니다. LongUnbrokenExampleWordForWrapping ').repeat(5)),bands:[],figures:[],noteMarkdown:''}))};
     window.prepared={bundle:{schema:'hanq-goryeo-script/1',source:{sha256:HanqHistory81TermData.sources.goryeo},segments:[],topics:[{id:'society',title:'사회',from:54,to:54},{id:'culture',title:'문화',from:55,to:55}],figures:[]},tables:[table],segments:[{id:'culture-fixture',kind:'study',page:55,markdown:'@@table22@@'}],rootTitle:'합성 문화',orientationMarkdown:'',review:[],figures:[]};
     HanqGoryeoStructure.isPrepared=p=>p===prepared;
    }
    window.app=HanqGoryeoScriptReader.mount(document.querySelector('#goryeoScript'),prepared,{initialTopic:'culture'});HanqDisplayMode.select(company==='on'?'company':'default');
   },{bundle,company});
   // Repeated theme and topic changes must not leave stale widths or duplicate cells.
   for(let i=0;i<2;i++)await p.evaluate(company=>{HanqDisplayMode.select(company==='on'?'default':'company');document.querySelector('[data-topic="society"]').click();document.querySelector('[data-topic="culture"]').click();HanqDisplayMode.select(company==='on'?'company':'default');},company);
   await p.waitForTimeout(150);await p.locator('#gs-table22-title').scrollIntoViewIfNeeded();
   const result=await p.evaluate(()=>{
    const wrap=document.querySelector('.gsr-structure-scroll[data-structure="table22"]'),table=wrap.querySelector('table'),rect=wrap.getBoundingClientRect(),cells=[...table.querySelectorAll('[data-cell]')];
    const bounds=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height};};
    return {pageWidth:document.documentElement.scrollWidth,viewport:innerWidth,wrap:{client:wrap.clientWidth,scroll:wrap.scrollWidth,...bounds(wrap)},table:bounds(table),hint:!document.querySelector('#gs-table22-hint').hidden,cells:cells.map(n=>({id:n.id,owner:n.dataset.sourceOwner,...bounds(n),client:n.clientWidth,scroll:n.scrollWidth,font:getComputedStyle(n).fontSize,rowspan:n.rowSpan,colspan:n.colSpan})),gallery:document.querySelectorAll('.gsr-culture-gallery figure').length,sourceCount:cells.length,mode:document.documentElement.dataset.companyMode};
   });results.push({width,height,company,...result});
   assert.equal(result.sourceCount,30);assert.equal(result.gallery,bundle?17:0);assert.equal(result.mode,company);
   if(!process.env.QA_BASELINE){
    assert(result.pageWidth<=width+1,'page overflow '+JSON.stringify(results.at(-1)));
    assert(result.wrap.scroll<=result.wrap.client+1,'culture overflow '+JSON.stringify(results.at(-1)));
    assert(!result.hint,'no sideways reading hint when fitted');
    assert(result.cells.every(c=>c.left>=result.wrap.left-1&&c.right<=result.wrap.right+1&&c.scroll<=c.client+1&&parseFloat(c.font)>=13),'every source cell fits with readable type '+JSON.stringify(results.at(-1)));
    if(width<=700){assert(result.cells.every((c,i)=>!i||c.top>=result.cells[i-1].top-1),'mobile cells follow DOM order');assert.equal(result.cells.find(c=>c.owner==='t22-left-7-content').rowspan,2);}
    const terms=p.locator('table[data-structure="table22"] .history81-term');assert(await terms.count()>1,'real glossary terms are mounted');
    await terms.first().focus();let lastY=-Infinity;
    for(let i=0;i<await terms.count();i++){
     const state=await terms.nth(i).evaluate(n=>({focused:document.activeElement===n,y:n.getBoundingClientRect().top+scrollY}));
     assert(state.focused,'native Tab follows every term');if(width<=700)assert(state.y>=lastY-1,'Tab follows visual reading order');lastY=state.y;
     await p.keyboard.press('Escape');if(i+1<await terms.count())await p.keyboard.press('Tab');
    }
    result.terms=await terms.count();await p.locator('#gs-table22-title').scrollIntoViewIfNeeded();
   }
   if([320,390,1440].includes(width)&&height===900)await p.screenshot({path:path.join(out,width+'-'+company+'.png')});
   await p.evaluate(()=>app.stop());assert.equal(await p.locator('.goryeo-script-reader').count(),0);await p.close();
  }
  assert.equal(errors.length,0);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({engine:'isolated headless '+engine,actualPrivateBundle:!!bundle,authenticatedProduction:false,reducedMotion:true,cases:results.length,errors,results},null,2));console.log(JSON.stringify({pass:true,cases:results.length,errors,baseline:!!process.env.QA_BASELINE,output:out}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
