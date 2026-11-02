'use strict';
// Private source-backed assertions. No accounts, API, DB or external assets.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(process.argv[2]||''),out=path.resolve(process.argv[3]||'');
assert(root.includes('private-data')&&out!==process.cwd());fs.mkdirSync(out,{recursive:true});
const semantic=path.join(root,'semantic'),front=path.resolve(__dirname,'..');
const review=JSON.parse(fs.readFileSync(path.join(root,'validation/source-relation-reviews.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(semantic,'manifest.json')));
const figures=Object.fromEntries(manifest.figures.map(f=>[f.id,f]));
const transport=process.env.HISTORY_QA_ASSET_TRANSPORT||'url';assert(['url','blob'].includes(transport));
(async()=>{const results=[];
for(const [engine,type] of [['Chromium',chromium],['WebKit',webkit]]){
 const browser=await type.launch({headless:true});
 for(const width of [320,390,1440]){
  const page=await browser.newPage({viewport:{width,height:1000},reducedMotion:'reduce'});
  const html='<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:12px;font-family:Arial,"Apple SD Gothic Neo",sans-serif}main{max-width:760px;margin:auto}</style><main></main></html>';
  await page.route('**/*',async route=>{const u=new URL(route.request().url()),f=figures[u.pathname.slice(1)];if(u.hostname!=='history-source.invalid')return route.abort();if(u.pathname==='/')return route.fulfill({contentType:'text/html',body:html});if(!f)return route.abort();return route.fulfill({contentType:f.extension==='png'?'image/png':'image/jpeg',body:fs.readFileSync(path.join(semantic,'assets',`${f.id}.${f.extension}`))});});
  await page.goto('https://history-source.invalid/');
  for(const file of ['textbook-semantic.css'])await page.addStyleTag({path:path.join(front,'media',file)});
  for(const file of ['textbook-figure-groups.js','textbook-semantic.js'])await page.addScriptTag({path:path.join(front,'media',file)});
  for(const rec of review.records){
   const data=JSON.parse(fs.readFileSync(path.join(semantic,'pages',`page-${String(rec.pdfPage).padStart(3,'0')}.json`)));
   const checks=await page.evaluate(async({data,rec,available,transport})=>{
    const controller=HanqTextbookSemantic.render(document.querySelector('main'),data,{compactReviewStatus:true,isFigureAvailable:f=>available.includes(f.assetId),resolveFigure:async f=>transport==='blob'?(await fetch('https://history-source.invalid/'+f.assetId)).blob():'https://history-source.invalid/'+f.assetId});
    const ready=await controller.ready;for(const i of document.querySelectorAll('img')){i.loading='eager';await i.decode().catch(()=>{});}
    await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
    const cell=id=>document.querySelector('[data-source-cell="'+id+'"]');
    const text=x=>(x||'').replace(/\s+/g,'');let relations=0,credits=0;
    if(rec.kind==='figure-cell-association')for(const pair of rec.pairs){
     const target=cell(pair.targetCellId);if(!target||target.querySelectorAll('img').length!==1)throw Error('Portrait not in exact name cell: '+JSON.stringify({assetId:pair.assetId,targetPresent:!!target,imageCount:target&&target.querySelectorAll('img').length,states:target&&[...target.querySelectorAll('[data-figure-state]')].map(x=>x.getAttribute('data-figure-state')),warnings:ready.warnings}));
     const table=data.blocks.find(b=>b.id===rec.tableId),f=table.figures.find(f=>f.assetId===pair.assetId);
     if(!f||f.sourceCaptionCellId!==pair.targetCellId)throw Error('Portrait relation mismatch');relations++;
    }
    if(rec.kind==='split-credit-panels')for(const panel of rec.panels){
     const block=data.blocks.find(b=>b.id===panel.blockId),el=document.querySelector('[data-source-block="'+panel.blockId+'"] table');
     if(!block||block.columnCount!==3||block.rows.length!==panel.expectedRecords+1||!el||el.querySelectorAll('thead th').length!==3)throw Error('Credit grid shape mismatch');
     for(const expected of panel.sourceCheckedRecords){
      const photo=cell(expected.photoCellId),source=cell(expected.sourceCellId),group=cell(expected.pageCellId);
      if(!photo||!source||!group||text(photo.textContent)!==text(expected.photo)||text(source.textContent)!==text(expected.source)||text(group.textContent)!==text(expected.printedPage))throw Error('Credit source relationship mismatch: '+expected.photoCellId);credits++;
     }
    }
    if(rec.kind==='timeline-boundary'){
     const block=data.blocks.find(b=>b.id===rec.blockId),actual=block.sourceTimeline.boundaries[rec.boundaryIndex].lines;
     if(JSON.stringify(actual)!==JSON.stringify(rec.sourceCheckedLines)||document.querySelector('main').textContent.includes('**'))throw Error('Timeline wording mismatch');relations++;
    }
    return {relations,credits,overflow:document.documentElement.scrollWidth>innerWidth+1,brokenImages:[...document.images].filter(i=>!i.complete||!i.naturalWidth).length,failedFigureStates:document.querySelectorAll('[data-figure-state="figure_load_failed"]').length,warnings:ready.warnings};
   },{data,rec,available:Object.keys(figures),transport}).catch(error=>{throw Error(`${engine}/${width}/p${rec.pdfPage}: ${error.message}`);});
   assert.equal(checks.overflow,false);assert.equal(checks.brokenImages,0);assert.equal(checks.failedFigureStates,0);assert(!checks.warnings.includes('figure_load_failed'));
   results.push({engine,width,pdfPage:rec.pdfPage,...checks});
   if(width===320)await page.screenshot({path:path.join(out,`${engine}-${width}-p${rec.pdfPage}.png`),fullPage:true});
  }await page.close();
 }await browser.close();
}
fs.writeFileSync(path.join(out,'relation-browser-results.json'),JSON.stringify({reviewId:review.reviewId,sourceSha256:review.sourceSha256,figureTransport:transport,views:results.length,failures:0,results},null,2)+'\n');console.log(`Source relation QA passed: ${results.length} real-renderer views (${transport})`);
})().catch(e=>{console.error(e);process.exitCode=1;});
