'use strict';
// Reuse the actual index/authenticated-route harness, with additional simultaneous geometry evidence.
const fs=require('fs'),path=require('path'),Module=require('module');
let source=fs.readFileSync(path.join(__dirname,'qa-goryeo-app-route.cjs'),'utf8');
const marker=' assert.equal(views,9);';
const probe=`
 const geometry=[],previousTables=[];
 for(const width of [320,390]){
  await page.setViewportSize({width,height:900});await page.click('[data-topic="politics"]');await page.waitForFunction(()=>document.querySelectorAll('.gsr-body figure img').length===4);
  for(const wrap of await page.locator('.gsr-structure-scroll').all()){
   const metric=await wrap.evaluate(w=>({id:w.dataset.structure,visible:w.clientWidth,scroll:w.scrollWidth,fonts:[...w.querySelectorAll('td,th')].map(e=>getComputedStyle(e).fontSize),textFits:[...w.querySelectorAll('p,li')].every(e=>e.scrollWidth<=e.clientWidth+1)}));assert(metric.fonts.every(f=>f==='18px'));if(metric.id!=='table15'){assert(metric.scroll<=metric.visible+1);assert(metric.textFits);}else assert(metric.scroll>metric.visible);previousTables.push({width,...metric});
  }
 }
 fs.writeFileSync(path.join(out,'stage2-mobile-regression.json'),JSON.stringify(previousTables,null,2));
 await page.click('[data-topic="culture"]');await page.waitForFunction(()=>document.querySelectorAll('.gsr-body figure img').length===17);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:900});await page.evaluate(()=>document.fonts.ready);
  const wrap=page.locator('.gsr-structure-scroll[data-structure="table22"]'),table=wrap.locator('table');
  assert.equal(await table.locator('thead th').count(),4);assert.equal(await table.locator('thead th').nth(3).textContent(),'');
  for(const id of ['t22-left-7-label','t22-left-7-content'])assert.equal(await table.locator('[data-source-owner="'+id+'"]').evaluate(e=>e.rowSpan),2);
  for(const [panel,column,last] of [['left',2,7],['right',4,8]])for(const [section,row] of [['first',1],['middle',4],['last',last]]){
   const cell=table.locator('[data-cell="'+row+':'+column+'"]');
   await cell.evaluate(e=>{e.scrollIntoView({block:'start',inline:'nearest'});const w=e.closest('.gsr-structure-scroll');w.scrollLeft+=e.getBoundingClientRect().left-w.getBoundingClientRect().left-w.clientLeft;});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const sample=()=>cell.evaluate(e=>{const w=e.closest('.gsr-structure-scroll'),rect=n=>{const r=n.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,width:r.width,height:r.height};};return {viewport:innerWidth,visibleWidth:w.clientWidth,scrollLeft:w.scrollLeft,region:rect(w),cell:rect(e),font:getComputedStyle(e).fontSize,headers:e.getAttribute('headers'),text:[...e.querySelectorAll('p,li')].map(n=>({rect:rect(n),client:n.clientWidth,scroll:n.scrollWidth,font:getComputedStyle(n).fontSize}))};});
   const before=await sample();assert(before.cell.width<=before.visibleWidth+1);assert(before.cell.left>=before.region.left-.5);assert(before.cell.right<=before.region.right+.5);assert.equal(before.font,'18px');assert(before.text.every(t=>t.scroll<=t.client+1&&t.rect.width<=before.visibleWidth&&parseFloat(t.font)>=18));
   const file=width+'-table22-'+panel+'-'+section+'.png';await page.screenshot({path:path.join(out,file)});const after=await sample();assert.deepEqual(after,before);geometry.push({file,panel,section,row,column,before,after});
  }
  assert(await page.locator('#gs-table22-hint').isVisible());await page.locator('#gs-table22-title').evaluate(e=>e.scrollIntoView({block:'start'}));const title=await page.locator('#gs-table22-title').boundingBox();assert(title.x>=0&&title.x+title.width<=width+1);await page.screenshot({path:path.join(out,width+'-table22-title.png')});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }
 const ax=await page.context().newCDPSession(page);fs.writeFileSync(path.join(out,'table22-ax.json'),JSON.stringify(await ax.send('Accessibility.getFullAXTree'),null,2));await ax.detach();
 fs.writeFileSync(path.join(out,'table22-geometry.json'),JSON.stringify(geometry,null,2));
`;
if(!source.includes(marker))throw Error('Route harness insertion point changed');source=source.replace(marker,probe+marker);
const runner=new Module(__filename,module);runner.filename=__filename;runner.paths=module.paths;runner._compile(source,__filename);
