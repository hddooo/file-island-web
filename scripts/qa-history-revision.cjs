'use strict';
// Isolated real-renderer QA. No accounts, API or production storage are used.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const revision=path.resolve(process.argv[2]||''),output=path.resolve(process.argv[3]||'');
assert(revision.includes('private-data')&&output!==process.cwd(),'Provide private revision and QA output directories');
fs.mkdirSync(output,{recursive:true});
const front=path.resolve(__dirname,'..'),semantic=path.join(revision,'semantic');
const manifest=JSON.parse(fs.readFileSync(path.join(semantic,'manifest.json')));
assert.equal(manifest.source.sha256,'d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de');
const figures=Object.fromEntries(manifest.figures.map(f=>[f.id,f]));
const pages=manifest.pages.map(p=>JSON.parse(fs.readFileSync(path.join(semantic,'pages',`page-${String(p.pdfPage).padStart(3,'0')}.json`))));
const selected=new Set([2,5,6,7,9,17,18,36,60,65,89,124,140,147]);
(async()=>{
 const results=[],failures=[];
 for(const [engine,type] of [['Chromium',chromium],['WebKit',webkit]]){
  const browser=await type.launch({headless:true});
  for(const [width,height] of [[320,900],[390,900],[1440,1000],[844,390]]){
   const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
   await page.route('**/*',async route=>{
    const u=new URL(route.request().url()),id=decodeURIComponent(u.pathname.slice(1)),f=figures[id];
    if(u.hostname!=='history-source.invalid'||!f)return route.abort();
    await route.fulfill({status:200,contentType:f.extension==='png'?'image/png':'image/jpeg',headers:{'Access-Control-Allow-Origin':'*'},body:fs.readFileSync(path.join(semantic,'assets',`${id}.${f.extension}`))});
   });
   await page.setContent('<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:12px;background:#08110d;color:#f1f5f0;font-family:Arial,"Apple SD Gothic Neo",sans-serif}main{max-width:760px;margin:auto}</style><main></main></html>');
   await page.addStyleTag({path:path.join(front,'media/textbook-semantic.css')});
   await page.addScriptTag({path:path.join(front,'media/textbook-figure-groups.js')});
   await page.addScriptTag({path:path.join(front,'media/textbook-semantic.js')});
   const views=[];
   for(const data of pages){
    if(width===844&&!selected.has(data.pdfPage))continue;
    if(width===390)views.push({data,section:'all'});
    else for(const section of ['concept','exam'])if(data.blocks.some(b=>b.studySection===section))views.push({data:{...data,blocks:data.blocks.filter(b=>b.studySection===section)},section});
   }
   for(const {data,section} of views){
    const result=await page.evaluate(async({data,ids})=>{
     const c=HanqTextbookSemantic.render(document.querySelector('main'),data,{compactReviewStatus:true,isFigureAvailable:f=>ids.includes(f.assetId),resolveFigure:async f=>{const r=await fetch('https://history-source.invalid/'+encodeURIComponent(f.assetId));if(!r.ok)throw Error('asset');return r.blob();}});
     const ready=await c.ready;
     for(const i of document.querySelectorAll('img')){i.loading='eager';await i.decode().catch(()=>{});}
     await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
     const font=document.querySelector('.textbook-semantic-text,.textbook-semantic-table td');
     return {overflow:document.documentElement.scrollWidth>innerWidth+1,scrollWidth:document.documentElement.scrollWidth,brokenImages:[...document.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth).length,images:document.querySelectorAll('img').length,canvases:document.querySelectorAll('canvas').length,unavailable:document.querySelectorAll('[data-figure-unavailable]').length,warnings:ready.warnings,font:font?getComputedStyle(font).fontSize:null,reducedMotion:matchMedia('(prefers-reduced-motion:reduce)').matches,scrollRegions:[...document.querySelectorAll('[tabindex="0"]')].map(e=>({role:e.getAttribute('role'),label:e.getAttribute('aria-label')}))};
    },{data,ids:Object.keys(figures)});
    const entry={engine,width,height,pdfPage:data.pdfPage,section,...result};results.push(entry);
    if(result.overflow||result.brokenImages||result.warnings.includes('figure_load_failed'))failures.push(entry);
    if(selected.has(data.pdfPage)&&((engine==='Chromium'&&width===320)||(engine==='WebKit'&&width===390)))await page.screenshot({path:path.join(output,`${engine}-${width}-p${data.pdfPage}-${section}.png`),fullPage:true});
   }
   console.log(`${engine} ${width}x${height}: ${views.length} source views checked`);await page.close();
  }
  await browser.close();
 }
 const report={sourceSha256:manifest.source.sha256,scope:'Isolated unchanged semantic renderer/CSS, local intercepted assets, real candidate pages. Full application, source selector/archive, source-original viewer, authentication and deployment are separate.',views:results.length,failures:failures.length,results};
 fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(report,null,2));
 assert.equal(failures.length,0,JSON.stringify(failures.map(f=>({engine:f.engine,width:f.width,page:f.pdfPage,section:f.section,overflow:f.overflow,warnings:f.warnings}))));
})().catch(e=>{console.error(e);process.exitCode=1;});
