'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{const input=process.argv[2],out=process.argv[3];fs.mkdirSync(out,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const p=await browser.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));let cases=0;
try{for(const width of [320,390,1440])for(const state of ['loaded','failed','pending']){
await p.setViewportSize({width,height:900});await p.setContent('<meta charset="utf-8"><main id="app" data-company-history><div id="privateTextbook"></div></main>');
for(const name of ['file-island','textbook-semantic','history-typography','company-mode'])await p.addStyleTag({path:'media/'+name+'.css'});
for(const name of ['textbook-figure-groups','textbook-semantic'])await p.addScriptTag({path:'media/'+name+'.js'});
const data=JSON.parse(fs.readFileSync(path.join(input,'page-023.json'),'utf8'));
await p.evaluate(({data,state})=>{document.documentElement.setAttribute('data-company-history','');window.source=JSON.stringify(data);window.data=data;const good='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aUrkAAAAASUVORK5CYII=';window.reader=HanqTextbookSemantic.render(document.querySelector('#privateTextbook'),data,{resolveFigure:()=>state==='pending'?new Promise(()=>{}):state==='failed'?Promise.reject(Error('test')):fetch(good).then(r=>r.blob())});}, {data,state});await p.waitForTimeout(100);
assert.equal(await p.locator('[data-company-image-only]').count(),6);let sourceText=await p.locator('main').textContent();
for(let cycle=0;cycle<3;cycle++){
await p.evaluate(()=>document.documentElement.dataset.companyMode='on');
assert(await p.locator('[data-company-image-only]').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().height===0&&getComputedStyle(n).display==='none')));
assert(await p.locator('.textbook-semantic-table-group:not([data-company-image-only])').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().height>0)));
assert.equal(await p.locator('main').textContent(),sourceText);assert(await p.evaluate(()=>JSON.stringify(data)===source));
await p.screenshot({path:path.join(out,state+'-'+width+'-on.png'),fullPage:true});
await p.evaluate(()=>document.documentElement.dataset.companyMode='off');
assert(await p.locator('[data-company-image-only]').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().height>0)));
assert.equal(await p.locator('main').textContent(),sourceText);
}
// A gallery containing real text must stay readable, even beside artwork.
await p.evaluate(data=>{reader.cleanup();const b=data.blocks.find(b=>b.layoutRole==='source-illustration-gallery');b.rows[0].cells[0].lines=[{spans:[{text:'visible source caption'}]}];reader=HanqTextbookSemantic.render(document.querySelector('#privateTextbook'),data);document.documentElement.dataset.companyMode='on';},data);
assert.equal(await p.locator('[data-company-image-only]').count(),5);assert(await p.getByText('visible source caption',{exact:true}).isVisible());
await p.evaluate(()=>reader.cleanup());cases++;
}
}finally{await browser.close()}assert.deepEqual(errors,[]);console.log(JSON.stringify({cases,toggleCycles:27,sourcePage:23,hiddenImageOnlyTables:6,textGalleryPreserved:true,normalModeRestored:true,errors}));})().catch(e=>{console.error(e);process.exitCode=1});