'use strict';
// Browser fixtures contain only synthetic questions and workspaces.
const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
const html=fs.readFileSync('index.html','utf8'),css=[...html.matchAll(/<link[^>]+href="\/?(media\/[^"?]+\.css)[^"]*"/g)].map(m=>fs.readFileSync(m[1],'utf8')).join('\n')+'\n'+[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});let cases=0;
 try{for(const width of [320,390,1440,844]){
  const page=await browser.newPage({viewport:{width,height:width===844?420:900}});await page.route('**/*',r=>r.abort());
  await page.setContent('<html data-hanq-theme="terminal"><head><meta name="hanq-source-grading" content="2"><style>'+css+'</style></head><body><div id="app"><main class="toc"><button class="period ready" data-id="samguk"><strong>삼국시대</strong></button></main></div></body></html>');
  for(const name of ['ui-locks','textbook-source-quiz','source-grading-v2-session','era-study-progress','hongmungwan'])await page.addScriptTag({path:'media/'+name+'.js'});
  await page.evaluate(()=>{
   const source='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de',version='a'.repeat(64);window.writes=0;
   window.fixtureApi={state:()=>({signedIn:true,ownerId:'synthetic',epoch:1}),onChange:()=>()=>{},hongmungwan:async()=>({items:[]}),textbookSemanticQuiz:async id=>({id,version,source:{sha256:source},items:[{id:'q',kind:'fill-in',originalNumber:1,verification:{status:'source-verified',textVerified:true,answerPairVerified:true},segments:[{type:'text',text:'합성 문항 '},{type:'blank',id:'b'}],blanks:[{id:'b',answerIds:['a']}],answers:[{id:'a',text:'합성 정답'}],answer:{text:'합성 정답'}}]}),textbookSourceWorkspaceV2:async()=>({version,revision:0,gradingVersion:2,supportedGradingVersions:[1,2],gradingStorageScope:'isolated-v2',workspace:{status:'active',responses:{}}}),textbookSourceWorkspace:async()=>({version,revision:0,workspace:{status:'completed',responses:{q:{submitted:true,correct:false,values:['합성 이전 답'],checkedSlots:[true]}}}}),saveTextbookSourceWorkspaceV2:()=>{writes++;throw Error('forbidden');}};
   window.host=document.querySelector('main');return HanqEraProgress.mount(host,{api:fixtureApi}).ready;
  });
  assert.equal(await page.locator('.era-progress-score').innerText(),'정답률 0%');assert.equal(await page.locator('time').count(),0);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  if(process.env.ERA_SCREENSHOTS)await page.screenshot({path:process.env.ERA_SCREENSHOTS+'/menu-'+width+'.png'});
  await page.evaluate(()=>{HanqEraProgress.stop();host.className='';return HanqHongmungwan.mount(host,{api:fixtureApi}).ready;});
  await page.waitForFunction(()=>document.querySelector('[data-review-era="samguk"]')?.textContent.includes('정답률'));
  assert.equal(await page.locator('.era-wrong-review').count(),8);await page.locator('[data-era="samguk"]').click();await page.waitForSelector('.era-practice-input');assert.equal(await page.locator('.era-practice-input').inputValue(),'');
  await page.locator('.era-practice-input').fill('합성 정답');await page.locator('.era-practice-input').press('Enter');assert.equal(await page.locator('.era-practice-feedback').innerText(),'✓ 정답');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert(await page.locator('.era-practice-input').evaluate(n=>n.getBoundingClientRect().height>=44));
  if(width<480)assert.equal(await page.locator('.era-practice-input').evaluate(n=>getComputedStyle(n).fontSize),'16px');
  if(process.env.ERA_SCREENSHOTS)await page.screenshot({path:process.env.ERA_SCREENSHOTS+'/practice-'+width+'.png'});
  await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').count(),0);assert.equal(await page.evaluate(()=>writes),0);await page.close();cases++;
 }}finally{await browser.close();}
 console.log(JSON.stringify({cases,browser:'Chromium',widths:[320,390,1440,844],legacyRevisionZero:true,writes:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
