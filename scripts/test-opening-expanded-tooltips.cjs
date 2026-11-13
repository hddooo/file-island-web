'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
(async()=>{
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
let tested=0,rendered=0;const errors=[];
try{for(const width of [320,390,1440])for(const company of ['off','on']){
const p=await browser.newPage({viewport:{width,height:900}});p.on('pageerror',e=>errors.push(e.message));
await p.route('**/*',r=>r.fulfill({contentType:'text/html',body:'<html><body><main id="host"></main></body></html>'}));await p.goto('https://opening.test/');
await p.evaluate(c=>{document.documentElement.dataset.companyMode=c;document.documentElement.dataset.companyHistory='history';},company);
for(const n of ['opening-script-reader','history81-terms','company-mode','general-typography'])await p.addStyleTag({content:fs.readFileSync('media/'+n+'.css','utf8').replace(/@import[^;]+;/g,'')});
for(const n of ['glossary-data','history81-term-data','history81-terms','history81-verified-glossary','history81-glossary','opening-script-structure','opening-script-reader'])await p.addScriptTag({path:'media/'+n+'.js'});
const entries=await p.evaluate(()=>HanqHistory81VerifiedGlossary.definitions.filter(e=>e.id.startsWith('verified-opening-expanded-')));
assert.equal(entries.length,28);
for(const e of entries){for(const phrase of e.aliases){
await p.evaluate(({e,phrase})=>{const h=document.querySelector('main');h.replaceChildren();const a=document.createElement('article');a.dataset.page=e.pages[0];const s=document.createElement('p');s.textContent=phrase;a.append(s);h.append(a);window.before=h.innerHTML;window.v=HanqHistory81Glossary.mount(h,'opening',HanqHistory81VerifiedGlossary.sourceOpening);},{e,phrase});
await p.mouse.move(0,0); const term=p.locator('[data-term-id="'+e.id+'"]');assert.equal(await term.count(),1,e.id+' '+phrase);await term.focus();await p.keyboard.press('Enter');const tip=p.locator('[role=tooltip]');assert(await tip.isVisible(),e.id);const box=await tip.boundingBox();assert(box.x>=0&&box.x+box.width<=width+1);await p.keyboard.press('Escape');await tip.waitFor({state:'hidden'});await term.click();assert(await tip.isVisible());await p.evaluate(()=>v.stop());assert.equal(await p.locator('main').innerHTML(),await p.evaluate(()=>before));tested++;
}}
if(process.argv[2]){
const dir=process.argv[2],input=Object.fromEntries(['bundle','structure','presentation'].map(n=>[n,JSON.parse(fs.readFileSync(path.join(dir,n+'.json'),'utf8'))]));
await p.evaluate(async x=>{document.querySelector('main').replaceChildren();window.prepared=await HanqOpeningStructure.prepare(x.bundle,x.structure,x.presentation.presentation||x.presentation);},input);
for(const topic of await p.evaluate(()=>prepared.bundle.topics)){
await p.evaluate(id=>{window.reader?.stop();window.reader=HanqOpeningScriptReader.mount(document.querySelector('main'),prepared,{initialTopic:id,initialMode:'study',externalNavigation:true});},topic.id);
const ids=await p.locator('[data-term-id^="verified-opening-expanded-"]').evaluateAll(es=>es.map(e=>e.dataset.termId));
assert(ids.length>0,topic.id);
if(await p.locator('[data-term-id="verified-opening-expanded-solar"]').count()){const term=p.locator('[data-term-id="verified-opening-expanded-solar"]').first();assert.equal(await term.count(),1);await term.scrollIntoViewIfNeeded();await term.click();assert(await p.locator('[role=tooltip]').isVisible());fs.mkdirSync('evidence/opening-expanded',{recursive:true});await p.screenshot({path:'evidence/opening-expanded/solar-'+company+'-'+width+'.png'});await p.keyboard.press('Escape');}
console.log(JSON.stringify({topic:topic.id,width,company,expandedTriggers:ids.length,unique:new Set(ids).size}));rendered++;
}
await p.evaluate(()=>reader.stop());
}await p.close();
}}finally{await browser.close();}
assert.deepEqual(errors,[]);console.log(JSON.stringify({aliasKeyboardClickCases:tested,realSourceViews:rendered,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
