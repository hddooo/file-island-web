'use strict';
const assert=require('node:assert/strict'), fs=require('node:fs'), path=require('node:path');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT || 'playwright');
const sys=path.resolve(__dirname,'..'), host='https://toeic-release-fixture.invalid';
const apiOverride=`;window.HanqApi.state=()=>({signedIn:!!window.signedFixture,ownerId:window.signedFixture?'synthetic-member':null,epoch:1,ready:true,restoring:false,premium:{active:true},user:{id:'synthetic-member',displayName:'Fixture'}});HanqApi.init=async()=>HanqApi.state();HanqApi.toeicCbt=async(method,route)=>{if(method!=='GET')throw Error('fixture read only');return {items:[]};};`;
(async()=>{for(const [engine,width,height] of [[chromium,1440,940],[chromium,320,650],[webkit,390,844]]){
 const b=await engine.launch({headless:true,...(engine===chromium&&process.env.HANQ_CHROMIUM_PATH?{executablePath:process.env.HANQ_CHROMIUM_PATH}:{})});
 try{
  const p=await b.newPage({viewport:{width,height},hasTouch:width<500,reducedMotion:'reduce'});
  p.on('pageerror',e=>console.error('browser:',e.message));
  await p.route('**/*',r=>{
   const req=r.request(),u=new URL(req.url());if(u.origin!==host)return r.abort();
   if(u.pathname.startsWith('/api/'))return r.fulfill({status:401,contentType:'application/json',body:'{}'});
   const f=path.resolve(sys,u.pathname.slice(1)||'index.html');if(!f.startsWith(sys+'/')||!fs.existsSync(f)||!fs.statSync(f).isFile())return r.fulfill({status:404,body:''});
   if(u.pathname==='/media/api-client.js')return r.fulfill({contentType:'text/javascript',body:fs.readFileSync(f,'utf8')+apiOverride});
   return r.fulfill({path:f});
  });
  let pageLoad=0;async function goto(hash){await p.goto(host+'/?fixture='+ ++pageLoad+hash,{waitUntil:'domcontentloaded'});}
  for(const target of ['#toeic/player','#toeic-cbt']){await goto(target);await p.waitForURL(u=>u.hash==='#account');assert.equal(await p.locator('#toeicSection,#toeicCbtHost').count(),0);}
  await p.addInitScript(()=>{window.signedFixture=true;});
  await goto('#subjects');const marker=p.locator('#subjectToeic');
  await marker.waitFor({state:'visible'});await p.locator('#fiEntrySplash').waitFor({state:'hidden'});assert(await marker.isEnabled());assert(!/점검/.test(await marker.textContent()));
  if(width<500)await marker.tap();else{await marker.focus();await p.keyboard.press('Enter');}
  const nav=p.getByRole('navigation',{name:'영어섬 학습 지도'});
  await nav.waitFor({state:'visible',timeout:8000}).catch(async e=>{console.error(p.url(),await p.locator('#app').innerText(),await p.evaluate(()=>({a:!!window.HanqAdventure,body:document.body.className})));throw e;});assert.equal(await nav.locator('button').count(),4);
  await nav.getByRole('button',{name:/Listening/}).click();await p.getByRole('heading',{name:'TOEIC Listening'}).waitFor();await p.locator('.lc-player-host').waitFor({state:'visible'});
  await p.goBack();await nav.waitFor();
  for(const [url,title] of [['#toeic/notebook','TOEIC Vocabulary'],['#toeic/grammar','TOEIC Grammar'],['#toeic/wrongnotes','TOEIC Practice']]){await goto(url);await p.getByRole('heading',{name:title,exact:true}).waitFor();}
  await goto('#toeic-cbt');await p.locator('#toeicCbtHost').waitFor({state:'visible'});assert.equal(new URL(p.url()).hash,'#toeic-cbt');
  await goto('#history');await p.locator('#homeFormalExams').waitFor({state:'visible'});
  console.log('PASS',engine.name(),width,'map tap/keyboard, four English routes and back, legacy CBT, signed-out gates, history untouched');
 }finally{await b.close();}
}})().catch(e=>{console.error(e);process.exitCode=1});
