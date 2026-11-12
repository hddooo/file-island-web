'use strict';
// Synthetic coordinates/text only. Requires an isolated Playwright WebKit installation.
const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{webkit}=require('playwright');
const root=process.argv[2],out=process.argv[3],read=f=>fs.readFileSync(path.join(root,f),'utf8');
const html=read('index.html'),css=[...html.matchAll(/<link\b[^>]*>|<style\b[^>]*>[\s\S]*?<\/style>/g)].map(m=>{if(m[0].startsWith('<style'))return m[0].replace(/^<style[^>]*>|<\/style>$/g,'');const f=m[0].match(/href="\/?(media\/[^"?]+\.css)/);return f?read(f[1]):''}).join('\n')+'\n'+read('media/blank-recall.css');
(async()=>{
 fs.mkdirSync(out,{recursive:true});const b=await webkit.launch({headless:true}),results=[],errors=[];
 try{
  for(const width of [320,390,768,1024,1440])for(const company of ['off','on'])for(const height of [900,420]){
   const p=await b.newPage({viewport:{width,height},reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
   await p.route('**/*',r=>r.request().url().startsWith('https://table.test/')?r.fulfill({contentType:'text/html',body:'<!doctype html><html data-hanq-theme="terminal"><head><style>'+css+'</style></head><body data-island="history"><main id="app" class="shell"><section id="goryeoScript"></section></main></body></html>'}):r.abort());await p.goto('https://table.test/#chapter/goryeo/webtoon');
   for(const f of ['goryeo-script-structure-data','goryeo-script-reader','display-mode','blank-recall'])await p.addScriptTag({content:read('media/'+f+'.js')});
   await p.evaluate(company=>{
    const ids=['table18',...HanqGoryeoStructureData.tables.filter(t=>t.columns<=3&&t.id!=='table18').map(t=>t.id)];
    const tables=HanqGoryeoStructureData.tables.filter(t=>ids.includes(t.id)).map(t=>({...t,captionMarkdown:t.id+' 합성 비교표',cells:t.cells.map(c=>({...c,id:'gs-'+t.id+'-'+c.row+'-'+c.column,figure:null,contentFigure:null,insets:[],markdown:c.column===1?'**'+(['전체 흐름','최씨 정권','사회 혼란','기타'][c.row-1]||'항목')+'**':'**최충헌** '+('합성 긴 설명과 LongUnbrokenExampleWordForWrapping 줄바꿈을 확인합니다. ').repeat(3)+' **정방**',bands:[],figures:[],noteMarkdown:''}))}));
    window.prepared={bundle:{schema:'hanq-goryeo-script/1',source:{sha256:'0'.repeat(64)},segments:[],topics:[{id:'politics',title:'정치',from:41,to:54}],figures:[]},tables,segments:[{id:'synthetic',kind:'study',page:45,markdown:ids.map(id=>'@@'+id+'@@').join('\n')}],rootTitle:'합성 고려 개념 학습',orientationMarkdown:'',review:[],figures:[]};window.HanqGoryeoStructure={isPrepared:x=>x===prepared};window.app=HanqGoryeoScriptReader.mount(document.querySelector('#goryeoScript'),prepared,{initialTopic:'politics',initialMode:'recall'});HanqDisplayMode.select(company==='on'?'company':'default');
   },company);
   await p.waitForTimeout(100);await p.locator('#gs-table18-title').scrollIntoViewIfNeeded();
   const metric=await p.evaluate(()=>({page:document.documentElement.scrollWidth,viewport:innerWidth,tables:[...document.querySelectorAll('.gsr-structure-scroll')].map(w=>{const r=w.getBoundingClientRect();return{id:w.dataset.structure,client:w.clientWidth,scroll:w.scrollWidth,tableWidth:w.querySelector('table').getBoundingClientRect().width,slots:w.querySelectorAll('textarea').length,outside:[...w.querySelectorAll('textarea')].filter(n=>{const q=n.getBoundingClientRect();return q.left<r.left-1||q.right>r.right+1}).length}})}));
   assert(metric.tables.every(t=>t.scroll<=t.client+1&&t.outside===0),'table/slot overflow '+JSON.stringify({width,height,company,...metric}));
   assert.equal(await p.locator('textarea,[data-mode="recall"]').count(),0,'removed blank test falls back to concept study');
   const source=await p.locator('.gsr-body').innerText();assert(source.includes('합성 긴 설명'),'source text remains visible');
   await p.setViewportSize({width:320,height:420});await p.waitForTimeout(60);assert(await p.evaluate(()=>[...document.querySelectorAll('.gsr-structure-scroll')].every(n=>n.scrollWidth<=n.clientWidth+1)),'table resize clipping');await p.setViewportSize({width,height});await p.waitForTimeout(60);
   await p.locator('[data-mode="exam"]').click();const exam=await p.evaluate(()=>[...document.querySelectorAll('.gsr-structure-scroll')].map(w=>({id:w.dataset.structure,client:w.clientWidth,scroll:w.scrollWidth})));assert.equal(exam.length,6);assert(exam.every(t=>t.scroll<=t.client+1),'exam overflow');
   for(let i=0;i<2;i++){await p.locator('[data-mode="study"]').click();await p.locator('[data-mode="exam"]').click();}await p.locator('[data-mode="study"]').click();assert.equal(await p.locator('.gsr-body').innerText(),source,'repeat navigation preserves source');await p.locator('#gs-table18-title').scrollIntoViewIfNeeded();results.push({width,height,company,...metric,exam,interaction:'removed legacy mode becomes study; long source text, resize to320 and restore, repeat study/exam preserve source'});await p.screenshot({path:path.join(out,width+'-'+company+'-'+height+'.png')});await p.evaluate(()=>app.stop());await p.close();
  }
  assert.equal(errors.length,0);fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({synthetic:true,engine:'WebKit',errors,results},null,2));console.log(JSON.stringify({pass:true,cases:results.length,errors,output:out}));
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
