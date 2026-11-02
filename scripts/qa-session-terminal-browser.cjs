'use strict';
// Headless disposable profiles; every HTTP request is fulfilled locally. No live API/DB.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence/session-terminal');
fs.mkdirSync(out,{recursive:true});
const origin='https://session-fixture.test';
const source=JSON.parse(fs.readFileSync(path.resolve(root,'../api/private-textbook-semantic-data/quizzes/prehistory.json')));
const note={id:'11111111-1111-4111-8111-111111111111',part:'unclassified',expression:'keep track of',meaning:'진행 상황을 계속 파악하다',partOfSpeech:'구문',synonyms:['monitor'],example:'Please keep track of the shipment.',translation:'배송 상황을 계속 확인해 주세요.',structure:'keep track of + 명사',confusion:'',sourceText:'',sourceReference:'synthetic fixture',revision:1,createdAt:'2026-10-20T00:00:00Z'};
let checks=0;const eq=(a,b,m)=>{assert.deepEqual(a,b,m);checks++;},ok=(a,m)=>{assert.ok(a,m);checks++;};
async function fixture(browser,width,{hint=true,refresh='ok',reduced=false,mode='terminal'}={}){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:reduced?'reduce':'no-preference'});
  const state={owner:'A',loginOwner:'A',refresh,protected:'ok',signinHold:null,writeHold:null,delayRead:null,refreshes:0,signins:0,writes:0,cbtRequests:0,external:0,errors:[],noteFailure:false};
  page.on('pageerror',e=>state.errors.push(e.message));page.on('dialog',d=>d.accept());
  if(hint)await page.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
  await page.addInitScript(value=>{if(!localStorage.getItem('hanq:display-mode:v1'))localStorage.setItem('hanq:display-mode:v1',value);localStorage.setItem('fixture-existing-record','keep');},mode);
  const session=()=>({accessToken:'fixture-'+state.owner,accessTokenExpiresAt:new Date(Date.now()+600000).toISOString(),user:{id:state.owner,displayName:'fixture'}});
  await page.route('**/*',async route=>{
    const request=route.request(),url=new URL(request.url()),p=url.pathname;
    if(url.origin!==origin){state.external++;return route.fulfill({status:503,body:'outside transport blocked'});}
    const json=(data,status=200)=>route.fulfill({status,json:data});
    if(p.startsWith('/api/v1/')){
      if(p.includes('/cbt/'))state.cbtRequests++;
      if(p==='/api/v1/auth/refresh'){
        state.refreshes++;
        if(state.refresh==='network')return route.abort('internetdisconnected');
        if(state.refresh==='hang')return;
        if(state.refresh==='503')return json({error:{code:'server_unavailable'}},503);
        if(state.refresh==='expired')return json({error:{code:'invalid_refresh'}},401);
        return json(session());
      }
      if(p==='/api/v1/auth/signin'){
        state.signins++;if(state.signinHold)await state.signinHold;
        state.owner=state.loginOwner;state.refresh='ok';state.protected='ok';return json(session());
      }
      if(p==='/api/v1/premium/plan')return json({plan:{priceKRW:5000},checkout:{available:false}});
      if(state.protected==='401')return json({error:{code:'invalid_token'}},401);
      if(state.protected==='network')return route.abort('internetdisconnected');
      if(state.protected==='503')return json({error:{code:'server_unavailable'}},503);
      if(p==='/api/v1/me')return json({user:{id:state.owner,displayName:'fixture'},premium:{active:true},growth:{points:1000},access:{total:20,freeSlots:[]}});
      if(p==='/api/v1/toeic-notes'){if(state.delayRead)await state.delayRead;return json({notes:state.owner==='A'?[note]:[]});}
      if(p==='/api/v1/toeic-recall')return json({progress:[],view:{part:'',batch:0}});
      if(p.startsWith('/api/v1/toeic-recall/'))return json({progress:{...request.postDataJSON(),revision:1}});
      if(p.startsWith('/api/v1/toeic-notes/')){state.writes++;if(state.writeHold)await state.writeHold;if(state.noteFailure)return json({error:{code:'server_unavailable'}},503);return json({note:{...note,...request.postDataJSON(),revision:2}});}
      if(p==='/api/v1/textbook/semantic/quizzes/prehistory')return json(source);
      if(p==='/api/v1/textbook/semantic/manifest')return json(JSON.parse(fs.readFileSync(path.resolve(root,'../api/private-textbook-semantic-data/manifest.json'))));
      if(/^\/api\/v1\/textbook\/semantic\/pages\/\d+$/.test(p)){const n=p.split('/').pop(),file=path.resolve(root,'../api/private-textbook-semantic-data/pages/page-'+String(n).padStart(3,'0')+'.json');return fs.existsSync(file)?json(JSON.parse(fs.readFileSync(file))):json({},404);}
      if(p==='/api/v1/textbook/semantic/workspaces/prehistory')return json({version:'fixture',revision:0,workspace:{cursor:0,status:'active',responses:{}}});
      if(p==='/api/v1/quiz/progress'||p==='/api/v1/mock/progress')return json({items:request.postDataJSON().questions.map(q=>({...q,answered:false}))});
      return json({},404);
    }
    const file=path.join(root,p==='/'?'index.html':p);
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||fs.statSync(file).isDirectory())return route.fulfill({status:404});
    if(p==='/')return route.fulfill({contentType:'text/html; charset=utf-8',body:fs.readFileSync(file,'utf8').replaceAll('https://hanq-api.onrender.com',origin)});
    return route.fulfill({path:file});
  });
  return {page,state};
}
async function noOverflow(page){eq(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal page overflow');}
async function login(page){await page.locator('#acEmail').fill('fixture@example.test');await page.locator('#acPw').fill('synthetic fixture password');await page.locator('#acAuthSubmit').click();}
async function routeTo(page,hash){await page.evaluate(h=>{history.pushState(null,'',h);dispatchEvent(new PopStateEvent('popstate',{state:null}));},hash);}
(async()=>{
  const browser=await chromium.launch({headless:true}),results=[];
  try{for(const width of [390,1440]){
    // Greymon still opens the profile directly; company mode lives inside the profile.
    let test=await fixture(browser,width,{mode:'default'}),page=test.page,state=test.state;
    await page.goto(origin+'/#history');await page.locator('#headerAccount.is-member').waitFor();
    eq(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(247, 245, 240)');ok(await page.locator('.hero-art').isVisible());
    await page.screenshot({path:path.join(out,'default-'+width+'.png'),animations:'disabled'});
    await page.locator('#headerAccount').click();await page.locator('#acMeTitle').waitFor();eq(new URL(page.url()).hash,'#account');
    const company=page.getByRole('button',{name:'블랙 모드 켜기',exact:true});await company.click();
    eq(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(5, 7, 6)');
    eq(await page.locator('#acNameNow').evaluate(n=>getComputedStyle(n).color),'rgb(244, 247, 245)','profile name remains readable in company mode');
    eq(await page.locator('[data-company-mode]').getAttribute('aria-pressed'),'true');eq(await page.evaluate(()=>localStorage.getItem('fixture-existing-record')),'keep');
    await page.screenshot({path:path.join(out,'company-mode-'+width+'.png'),animations:'disabled'});
    await page.keyboard.press('Space');eq(await page.evaluate(()=>HanqDisplayMode.current()),'default');
    await page.keyboard.press('Space');eq(await page.evaluate(()=>HanqDisplayMode.current()),'terminal');
    await page.reload();await page.locator('#acMeTitle').waitFor();eq(await page.evaluate(()=>HanqDisplayMode.current()),'terminal','mode persists after reload');
    eq(await page.locator('[data-company-mode]').textContent(),'블랙 모드 끄기');
    await page.locator('[data-subject=history]').click();await page.locator('#homePastExams').waitFor();eq(await page.locator('.hero-art').isVisible(),false);
    eq(await page.locator('a.wn-entry').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(8, 13, 10)','terminal links keep dark surfaces');
    await page.screenshot({path:path.join(out,'terminal-home-'+width+'.png'),animations:'disabled'});
    eq(state.writes,0);await noOverflow(page);eq(state.errors,[]);await page.close();
    // Shared navigation and the latest notebook UI, with original image palette.
    ({page,state}=await fixture(browser,width));await page.goto(origin+'/#subjects');
    eq(await page.locator('.subject-grid strong').allTextContents(),['한국사','TOEIC']);await page.locator('#subjectToeic').click();
    eq(await page.locator('.toeic-sections button').allTextContents(),['단어장','오답노트']);
    await page.locator('[data-toeic-view=wrongnotes]').click();await page.getByRole('status').filter({hasText:'등록된 토익 회차'}).waitFor();eq(state.cbtRequests,0,'no unpublished CBT endpoint');
    await page.locator('[data-toeic-view=notebook]').click();await page.locator('.tn-word-card').waitFor();
    eq(new URL(page.url()).hash,'#toeic/notebook');eq(await page.locator('.tn-word-card').count(),1);eq(await page.locator('.tr-input,.tr-evaluations').count(),0,'read-only cards retain no practice controls');eq(await page.locator('.tn-tabs').count(),0,'input and editing share one list');
    await page.getByRole('button',{name:'보기',exact:true}).click();await page.locator('.tn-translation').waitFor();
    ok((await page.locator('.tn-word-card').innerText()).includes(note.translation));await page.getByRole('button',{name:'가리기',exact:true}).click();eq(await page.locator('.tn-translation').isVisible(),false);
    eq(await page.evaluate(()=>getComputedStyle(document.body).backgroundColor),'rgb(5, 7, 6)');
    eq(await page.locator('.tn-card-meaning').evaluate(n=>getComputedStyle(n).color),'rgb(244, 247, 245)');await noOverflow(page);
    await page.screenshot({path:path.join(out,'notebook-'+width+'.png'),animations:'disabled'});
    await page.locator('[data-subject=history]').click();await page.locator('#homePastExams').waitFor();await page.goBack();await page.locator('.tn-word-card').waitFor();await page.goForward();await page.locator('#homePastExams').waitFor();
    await page.locator('#homePastExams').click();await page.locator('.period[data-id=prehistory]').click();
    await page.locator('.textbook-semantic table').first().waitFor();
    eq(await page.locator('.textbook-semantic td').first().evaluate(n=>getComputedStyle(n).color),'rgb(244, 247, 245)','long-table text is white');
    await noOverflow(page);await page.screenshot({path:path.join(out,'history-'+width+'.png'),animations:'disabled'});
    eq(state.errors,[]);await page.close();
    // A slow login is bounded, keyboard-dismissible, and duplicate submit is ignored.
    ({page,state}=await fixture(browser,width,{hint:false,reduced:true}));await page.goto(origin+'/#account');await page.locator('#acEmail').waitFor();
    let release;state.signinHold=new Promise(r=>release=r);await login(page);
    await page.locator('.request-wait:not([hidden])').waitFor();
    eq(await page.locator('#app').evaluate(n=>n.inert),true);eq(await page.locator('#app').evaluate(n=>getComputedStyle(n).filter),'blur(2px)');
    ok((await page.locator('.request-wait').evaluate(n=>getComputedStyle(n).backgroundColor)).startsWith('rgba('),'waiting backdrop stays translucent');
    eq(await page.locator('.request-wait .hanq-mascot').evaluate(n=>n.getBoundingClientRect().width),56,'terminal loading mascot is restrained');
    eq(await page.locator('.request-wait .hanq-mascot').evaluate(n=>getComputedStyle(n).animationName),'none');
    ok((await page.locator('.request-wait .hanq-mascot').evaluate(n=>getComputedStyle(n).backgroundImage)).includes('agumon-idle-sprite.png'));
    await page.evaluate(()=>document.querySelector('#acAuthForm').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));eq(state.signins,1);
    await page.screenshot({path:path.join(out,'loading-'+width+'.png')});await page.keyboard.press('Escape');eq(await page.locator('#app').evaluate(n=>n.inert),false);
    release();await page.locator('#acMeTitle').waitFor();eq(await page.locator('.request-wait').isVisible(),false);eq(state.errors,[]);await page.close();
    // History choices and current position restore only for the same owner.
    ({page,state}=await fixture(browser,width));await page.goto(origin+'/#chapter/prehistory/quiz');
    await page.locator('#quiz .qchoice').first().waitFor();await page.locator('#quiz .qchoice').first().click();
    const picked=await page.locator('#quiz .qchoice[aria-checked=true]').getAttribute('data-option');
    state.protected='401';state.refresh='expired';await page.evaluate(()=>HanqApi.ensureSession(true).catch(()=>{}));await page.locator('#acEmail').waitFor();
    await login(page);await page.locator('#quiz .qchoice[aria-checked=true]').waitFor();
    eq(await page.locator('#quiz .qchoice[aria-checked=true]').getAttribute('data-option'),picked);eq(state.writes,0,'restored selection never auto submits');await noOverflow(page);eq(state.errors,[]);await page.close();
    // A duplicate foreground write shares one request throughout its wait.
    ({page,state}=await fixture(browser,width));await page.goto(origin+'/#toeic/notebook');await page.locator('.tn-word-card').waitFor();
    let finishWrite;state.writeHold=new Promise(r=>finishWrite=r);
    await page.evaluate(n=>{const body={expression:n.expression,meaning:n.meaning,revision:n.revision};window.fixtureWrite=Promise.all([HanqApi.saveToeicNote(n.id,body),HanqApi.saveToeicNote(n.id,body)]);},note);
    await page.locator('.request-wait:not([hidden])').waitFor();eq(state.writes,1,'duplicate submission sends one write');
    await page.keyboard.press('Tab');eq(await page.locator('.request-wait button').evaluate(n=>n===document.activeElement),true);finishWrite();await page.evaluate(()=>window.fixtureWrite);eq(await page.locator('#app').evaluate(n=>n.inert),false);eq(state.errors,[]);await page.close();
    // Failed saves do not erase auth or inputs. A 5xx refresh is recoverable.
    ({page,state}=await fixture(browser,width));await page.goto(origin+'/#toeic/notebook');await page.locator('.tn-word-card').waitFor();
    state.noteFailure=true;await page.getByRole('button',{name:'편집',exact:true}).click();await page.locator('[name=meaning]').fill('계속 보관할 입력');await page.getByRole('button',{name:'저장',exact:true}).click();await page.locator('.request-notice:not([hidden])').waitFor();
    ok(await page.evaluate(()=>HanqApi.state().signedIn));eq(await page.locator('[name=meaning]').inputValue(),'계속 보관할 입력');
    state.protected='401';state.refresh='503';await page.evaluate(()=>HanqApi.ensureSession(true).catch(()=>{}));
    ok(await page.evaluate(()=>HanqApi.state().signedIn&&HanqApi.hasSessionHint()));eq(new URL(page.url()).hash,'#toeic/notebook');
    state.protected='ok';state.refresh='ok';state.noteFailure=false;await page.locator('.request-notice [data-retry-connection]').click();await page.getByRole('status').filter({hasText:'✓ 다시 연결됐어요'}).waitFor();
    eq(await page.locator('[name=meaning]').inputValue(),'계속 보관할 입력');await noOverflow(page);await page.screenshot({path:path.join(out,'recovery-'+width+'.png')});eq(state.errors,[]);await page.close();
    // Cold restore 401 routes to login and returns to the safe notebook path.
    ({page,state}=await fixture(browser,width,{refresh:'expired'}));await page.goto(origin+'/#toeic/notebook');await page.locator('#acEmail').waitFor();eq(new URL(page.url()).hash,'#account');
    await login(page);await page.locator('.tn-word-card').waitFor();eq(new URL(page.url()).hash,'#toeic/notebook');eq(state.refreshes,1);eq(state.errors,[]);await page.close();
    // Private notebook drafts return only to the account that created them.
    for(const loginOwner of ['A','B']){
      ({page,state}=await fixture(browser,width));await page.goto(origin+'/#toeic/notebook');await page.locator('.tn-word-card').waitFor();
      await page.getByRole('button',{name:'편집',exact:true}).click();await page.locator('[name=meaning]').fill('A 계정 전용 임시 답');
      const writesBefore=state.writes;state.protected='401';state.refresh='expired';await page.evaluate(()=>HanqApi.ensureSession(true).catch(()=>{}));await page.locator('#acEmail').waitFor();
      state.loginOwner=loginOwner;await login(page);
      if(loginOwner==='A'){await page.locator('[name=meaning]').waitFor();eq(await page.locator('[name=meaning]').inputValue(),'A 계정 전용 임시 답');}
      else{await page.locator('#acMeTitle').waitFor();eq(new URL(page.url()).hash,'#account');await routeTo(page,'#toeic/notebook');await page.locator('.tn').waitFor();eq(await page.locator('[name=meaning]').count(),0);ok(!(await page.locator('#app').innerText()).includes('A 계정 전용 임시 답'));}
      eq(state.writes,writesBefore,'reauthentication never automatically resaves a draft');eq(state.errors,[]);await page.close();
    }
    // Refresh network/timeout failures preserve the hint and stop showing pending state.
    for(const failure of ['network','hang']){
      ({page,state}=await fixture(browser,width,{refresh:failure}));if(failure==='hang')await page.clock.install();
      await page.goto(origin+'/#toeic/notebook');
      if(failure==='hang')await page.clock.runFor(10100);
      await page.locator('.request-notice:not([hidden])').waitFor();
      ok(await page.evaluate(()=>HanqApi.hasSessionHint()));eq(new URL(page.url()).hash,'#toeic/notebook');
      eq(await page.locator('.request-wait').isVisible(),false);eq(await page.evaluate(()=>HanqApi.state().restoring),false);
      state.refresh='ok';await page.locator('.request-notice [data-retry-connection]').click();if(failure==='hang')await page.clock.runFor(100);
      await page.locator('.tn-word-card').waitFor();eq(state.refreshes,2);eq(state.errors,[]);await page.close();
    }
    // An unavailable cross-tab cookie lock times out without a late signin request.
    ({page,state}=await fixture(browser,width,{hint:false}));await page.goto(origin+'/#account');await page.locator('#acEmail').waitFor();
    await page.clock.install();await page.evaluate(()=>{navigator.locks.request('hanq:auth:cookie',()=>new Promise(r=>{window.releaseFixtureLock=r;window.fixtureLockHeld=true;}));});
    await page.waitForFunction(()=>window.fixtureLockHeld);await login(page);await page.clock.runFor(12100);
    await page.getByRole('alert').filter({hasText:'서버가 제때'}).waitFor();eq(state.signins,0);eq(await page.locator('#acAuthSubmit').isEnabled(),true);
    await page.evaluate(()=>releaseFixtureLock());await page.clock.runFor(100);eq(state.signins,0,'aborted queued auth never runs later');eq(state.errors,[]);await page.close();
    results.push({width,navigation:true,unifiedNotebook:true,defaultPreserved:true,terminalOptIn:true,modePersists:true,profileAccess:true,keyboard:true,reducedMotion:true,duplicateSignin:true,refresh503:true,network:true,timeout:true,lockTimeout:true,coldExpiryReturn:true,backForward:true,noOperatingRequests:true});
  }}finally{await browser.close();}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({checks,failures:0,scope:'headless isolated profiles; all transport mocked; no operating account or DB writes',results},null,2));
  console.log(JSON.stringify({checks,failures:0,results}));
})().catch(e=>{console.error(e);process.exitCode=1;});
