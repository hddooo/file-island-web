'use strict';
// All responses and identities are synthetic. Every browser request is intercepted.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.ARTIFACT_DIR||path.join(root,'../evidence/admin-readability'));
fs.mkdirSync(out,{recursive:true});
const assets=new Map(['admin-dashboard.css','admin-dashboard.js','admin-xp.js','portal-ui.js'].map(f=>['/media/'+f,fs.readFileSync(path.join(root,'media',f),'utf8')]));
async function fixture(browser,width,mode='normal',height=1000){
 const page=await browser.newPage({viewport:{width,height}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(({mode})=>{
  window.qaMode=mode;window.qaCalls=[];window.qaPending=[];
  const member={id:'synthetic-member',nickname:'합성 회원 · 아주 긴 이름을 가진 테스트 계정입니다',email:'synthetic-long-name-for-layout@example.invalid',xp:'1234567',created_at:'2026-10-28T00:00:00Z'};
  const analytics=()=>({recordedLoginCount:12345,recordedUniqueUsers:1234,firstRecordedLoginAt:null,generatedAt:'2026-11-03T00:00:00Z',daily:Array.from({length:7},(_,i)=>({date:'2026-10-'+(22+i),recordedLogins:i<2?null:i*9,recordedUsers:i<2?null:i}))});
  window.HanqApi={init:async()=>{},state:()=>({signedIn:mode!=='guest',ownerId:mode==='guest'?null:'synthetic-admin',user:{id:'synthetic-admin',displayName:'합성 관리자'}}),onChange:()=>()=>{},portal:async(method,url,body)=>{
   window.qaCalls.push({method,url,body});if(method!=='GET')throw Error('Read-only layout fixture received a write');
   if(window.qaMode==='denied')throw {status:403};if(url==='/api/v1/ops')return {admin:true};
   if(url.includes('login-analytics')){if(window.qaMode==='pending')return new Promise(r=>window.qaPending.push(()=>r(analytics())));if(window.qaMode==='error')throw {status:503};if(window.qaMode==='empty')return {...analytics(),recordedLoginCount:null,recordedUniqueUsers:null,daily:[]};return analytics();}
   if(url.includes('/members?'))return {items:window.qaMode==='empty'?[]:[member],total:window.qaMode==='empty'?0:1};
   if(url.includes('/members/'))return {user:member,access:[],attempts:[],adjustments:[]};
   if(url.includes('/inquiries?'))return {items:[{id:'synthetic-inquiry',title:'합성 문의 제목 · 긴 문장에서도 목록과 상세 이동이 보이는지 확인합니다',created_at:'2026-11-03T00:00:00Z'}],total:1};
   return {inquiry:{title:'합성 문의'},messages:[{sender_role:'member',body:'합성 문의 본문입니다. '.repeat(18),created_at:'2026-11-03T00:00:00Z'}]};
  }};
 },{mode});
 await page.route('**/*',r=>{
  const u=new URL(r.request().url());
  if(u.origin!=='https://admin-fixture.invalid')return r.abort();
  if(u.pathname==='/ops/')return r.fulfill({contentType:'text/html',body:fs.readFileSync(path.join(root,'ops/index.html'),'utf8')});
  if(u.pathname==='/media/api-client.js')return r.fulfill({contentType:'application/javascript',body:'/* synthetic API installed before scripts */'});
  if(assets.has(u.pathname))return r.fulfill({contentType:u.pathname.endsWith('.css')?'text/css':'application/javascript',body:assets.get(u.pathname)});
  return r.abort();
 });
 await page.goto('https://admin-fixture.invalid/ops/');
 return {page,errors};
}
async function fits(page){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no page overflow');}
async function targets(page){const bad=await page.locator('button:visible').evaluateAll(nodes=>nodes.filter(n=>n.getBoundingClientRect().height<43.9).map(n=>n.textContent));assert.deepEqual(bad,[],'44px visible buttons');}
(async()=>{
 const browser=await chromium.launch({headless:true}),results=[];
 try{
  for(const [width,height] of [[320,1000],[390,1000],[1440,1000],[740,390]]){
   const {page,errors}=await fixture(browser,width,'normal',height);await page.locator('.profile-card').waitFor();await fits(page);await targets(page);
   assert.equal(await page.locator('.stat-card h2').count(),3);
   if(width<=540)assert.equal(await page.locator('.dash-summary').evaluate(n=>getComputedStyle(n).gridTemplateColumns.split(' ').length),1);
   await page.screenshot({path:path.join(out,`${width}-dashboard.png`),fullPage:true});
   if(width<=760){await page.locator('.mobile-menu').click();assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'),'true');}
   await page.locator('[data-admin-section=members]').click();await page.locator('.portal-panel table').waitFor();await fits(page);await targets(page);
   const search=page.locator('[name=search]');assert.equal(await search.evaluate(n=>getComputedStyle(n).fontSize),'16px');
   await search.fill('합성 검색');await search.press('Enter');await page.locator('table').waitFor();
   assert.ok(await page.evaluate(()=>window.qaCalls.some(x=>x.url.endsWith('search='+encodeURIComponent('합성 검색')))));
   assert.equal(await page.locator('.mobile-menu').getAttribute('aria-expanded'),'false');
   if(width<=760){
    const action=page.getByRole('button',{name:'보기',exact:true}),wrap=page.locator('.portal-panel .scroll');
    const box=await action.boundingBox(),bounds=await wrap.boundingBox();assert.ok(box.x>=bounds.x&&box.x+box.width<=bounds.x+bounds.width+1,'detail action remains visible beside wide table');
    await wrap.evaluate(n=>{n.scrollLeft=n.scrollWidth});const moved=await action.boundingBox();assert.ok(moved.x+moved.width<=bounds.x+bounds.width+1,'detail action stays visible after horizontal scroll');await wrap.evaluate(n=>{n.scrollLeft=0});
   }
   await page.screenshot({path:path.join(out,`${width}-members.png`),fullPage:true});
   await page.getByRole('button',{name:'보기',exact:true}).click();await page.locator('.admin-xp').waitFor();await fits(page);await targets(page);
   assert.equal(await page.locator('[name=xpDelta]').evaluate(n=>getComputedStyle(n).fontSize),'16px');
   assert.equal(await page.locator('.admin-xp-preview').isVisible(),false,'confirmation stays hidden');
   await page.screenshot({path:path.join(out,`${width}-detail.png`),fullPage:true});
   await page.getByRole('button',{name:'목록으로',exact:true}).click();await page.locator('table').waitFor();
   if(width<=760)await page.locator('.mobile-menu').click();await page.locator('[data-admin-section=inquiries]').click();await page.locator('table').waitFor();
   await page.getByRole('button',{name:'보기',exact:true}).click();await page.locator('.message').waitFor();await fits(page);await targets(page);
   assert.equal(await page.getByLabel('답변',{exact:true}).evaluate(n=>getComputedStyle(n).fontSize),'16px');
   await page.emulateMedia({reducedMotion:'reduce'});await fits(page);
   assert.ok(await page.evaluate(()=>window.qaCalls.every(x=>x.method==='GET')));assert.deepEqual(errors,[]);
   results.push({width,height,dashboard:true,memberSearch:true,detail:true,inquiry:true,touch44:true,input16:true,reducedMotion:true,pageOverflow:false,writes:0});await page.close();
  }
  for(const mode of ['pending','error','empty','guest','denied']){
   const {page,errors}=await fixture(browser,320,mode);
   if(mode==='pending'){
    await page.locator('.dashboard-loading').waitFor();assert.equal(await page.locator('.dashboard-loading').getAttribute('role'),'status');await page.screenshot({path:path.join(out,'320-loading.png')});
    await page.locator('.mobile-menu').click();await page.locator('[data-admin-section=members]').click();await page.locator('table').waitFor();
    await page.evaluate(()=>window.qaPending.forEach(r=>r()));assert.equal(await page.locator('.profile-card').count(),0);assert.notEqual(await page.locator('#content').getAttribute('aria-busy'),'true');
   }else if(mode==='error'){
    await page.locator('.card-error').waitFor();assert.equal(await page.locator('.member-list li').count(),1);await page.screenshot({path:path.join(out,'320-error.png'),fullPage:true});
    await page.evaluate(()=>{window.qaMode='normal'});await page.getByRole('button',{name:'다시 불러오기',exact:true}).click();await page.locator('.login-chart').waitFor();
   }else if(mode==='empty'){
    await page.locator('.chart-empty').waitFor();assert.equal(await page.locator('.stat-value').first().innerText(),'확인 불가');
   }else{
    await page.getByRole('button',{name:'다시 시도',exact:true}).waitFor();assert.equal(await page.locator('.profile-card').count(),0);
    if(mode==='guest')assert.equal(await page.evaluate(()=>window.qaCalls.length),0);
   }
   await fits(page);await targets(page);assert.deepEqual(errors,[]);results.push({mode,passed:true,writes:0});await page.close();
  }
 }finally{await browser.close();}
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,isolated:true,engine:'chromium',operatingApiRequests:0,results},null,2));console.log(JSON.stringify({passed:true,scenarios:results.length,artifactDir:out,operatingWrites:0}));
})().catch(e=>{console.error(e);process.exitCode=1;});
