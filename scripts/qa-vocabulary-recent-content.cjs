'use strict';
// Isolated synthetic API: never logs in or writes to production.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const {setup}=require('./qa-vocabulary-video-bar.cjs');
const root=path.resolve(__dirname,'..'),out=process.env.ARTIFACT_DIR||path.join(root,'evidence/vocabulary-recent-content');
fs.mkdirSync(out,{recursive:true});
const fixtures=[
 {expression:'paved walkway',meaning:'포장된 보행로·산책로',example:"There's a paved walkway next to a road.",translation:'도로 옆에 포장된 보행로가 있어.',structure:'paved = 포장된, walkway = 보행로'},
 {expression:'podcast episode',meaning:'팟캐스트 한 회분·개별 방송 편',example:"How long should the podcast episode I'm creating be?",translation:'내가 만들고 있는 팟캐스트 한 편은 길이가 어느 정도여야 할까?',structure:'podcast = 인터넷으로 듣거나 보는 연재 방송, episode = 방송·시리즈의 한 편/한 회'},
 {expression:'a lot to cover',meaning:'다뤄야 할 내용이 많다/할 이야기가 많다.',example:"There's a lot to cover.",translation:'다뤄야 할 내용이 많다.',structure:'cover = (주제·내용을) 다루다, 설명하다.'},
 {expression:'blank content',meaning:'빈 필드 검수',example:'',translation:'',structure:''},
 {expression:'safe text',meaning:'텍스트 안전성',example:'<img src=x onerror=alert(1)>',translation:'문자 그대로 표시',structure:'<script>alert(1)</script>'}
].map((n,i)=>({...n,id:'recent-content-'+i,part:'unclassified',partOfSpeech:'명사구',confusion:'',synonyms:[],revision:1,createdAt:'2026-11-03T00:00:00Z'}));
(async()=>{
 const results=[];
 for(const engine of [chromium,webkit]){
  const browser=await engine.launch();
  try{for(const width of [320,390,1440]){
   const s=await setup(browser,width,root,{reducedMotion:'reduce'});
   try{
    await s.context.route('**/api/v1/toeic-notes',r=>r.fulfill({json:{notes:fixtures,archived:[],visibility:'members',canManage:false}}));
    await s.p.reload();await s.p.locator('.tn-recent-primary').waitFor();
    for(const n of fixtures){
     const item=s.p.locator('.tn-recent-primary .tn-recent-item[data-recent-word-id="'+n.id+'"]');
     await item.click();const dialog=s.p.locator('.tn-recent-dialog');await dialog.waitFor();
     assert.equal(await dialog.getAttribute('data-vocabulary-id'),n.id);
     assert((await dialog.innerText()).includes(n.meaning));
     if(n.example){assert.equal(await dialog.locator('.tn-recent-example').textContent(),n.example);assert.equal(await dialog.locator('.tn-translation').textContent(),n.translation);}
     else{assert.equal(await dialog.locator('.tn-recent-example,.tn-translation').count(),0);}
     assert.equal(await dialog.locator('.tn-recent-tips').count(),n.structure?1:0);
     if(n.structure)assert((await dialog.locator('.tn-recent-tips').textContent()).includes(n.structure.split(',')[0]));
     assert.equal(await dialog.locator('script,img').count(),0);
     assert.equal(await dialog.evaluate(n=>n.scrollWidth>n.clientWidth),false);
     if(n.expression==='podcast episode')await s.p.screenshot({path:path.join(out,engine.name()+'-'+width+'-popup.png')});
     await s.p.keyboard.press('Escape');assert.equal(await dialog.count(),0);
     assert(await item.evaluate(n=>n===document.activeElement));
    }
    assert.equal(await s.p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(s.errors,[]);assert.deepEqual(s.writes,[]);
    results.push({engine:engine.name(),width,examplesAndTips:true,blankFieldsOmitted:true,textSafe:true,focusRestored:true,writes:0});
   }catch(e){fs.writeFileSync(path.join(out,'failure-'+engine.name()+'-'+width+'.txt'),await s.p.locator('body').innerText());await s.p.screenshot({path:path.join(out,'failure-'+engine.name()+'-'+width+'.png')});throw e;}finally{await s.context.close();}
  }}finally{await browser.close();}
 }
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,synthetic:true,results},null,2));
 console.log('PASS',results.length,'recent-word example / translation / Tip scenarios');
})().catch(e=>{console.error(e.stack);process.exitCode=1});
