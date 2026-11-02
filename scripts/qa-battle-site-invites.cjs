// Site-wide battle invitations, end to end: real local API + embedded PostgreSQL behind a same-origin streaming proxy
// (STACK_ORIGIN). Users are created through the real signup API and sign in through the real form. Never production.
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),pw=require('playwright');
const ORIGIN=process.env.STACK_ORIGIN||'http://127.0.0.1:8797',root=path.resolve(__dirname,'..'),out=path.resolve(root,'../evidence/site-invites');
if(!/^http:\/\/127\.0\.0\.1:\d+$/.test(ORIGIN))throw new Error('STACK_ORIGIN must be a loopback test stack');
fs.mkdirSync(out,{recursive:true});
const PASSWORD='synthetic local password 42',PG=process.env.STACK_PG;
if(!PG||!/^postgresql:\/\/[^@]+@127\.0\.0\.1:\d+\/\w+_test$/.test(PG))throw new Error('STACK_PG must be the loopback *_test stack database');
const {Pool}=require('pg'),db=new Pool({connectionString:PG,max:2});
const one=async(sql,args)=>(await db.query(sql,args)).rows[0];
let serial=0;
async function signupUser(tag){const email=`${tag}.${Date.now()}.${serial++}@example.test`;const r=await fetch(ORIGIN+'/api/v1/auth/signup',{method:'POST',headers:{'Content-Type':'application/json',Origin:ORIGIN,'X-HanQ-CSRF':'1'},body:JSON.stringify({email,password:PASSWORD})});assert.equal(r.status,201,'signup '+r.status);const b=await r.json();
 // The server-assigned display name is what other players see.
 const me=await (await fetch(ORIGIN+'/api/v1/me',{headers:{Authorization:'Bearer '+b.accessToken}})).json();
 return {email,name:me.user.displayName,id:b.user.id};}
async function login(browser,user,{width=390,height=844}={}){const context=await browser.newContext({viewport:{width,height}});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(ORIGIN+'/#account');await page.locator('#acEmail').waitFor();await page.locator('#acEmail').fill(user.email);await page.locator('#acPw').fill(PASSWORD);await page.locator('#acAuthSubmit').click();
 await page.waitForFunction(()=>window.HanqApi&&HanqApi.state().signedIn&&!HanqApi.state().restoring&&HanqApi.state().profileStatus==='ready',null,{timeout:20000});
 return {context,page,errors,user};}
const inviteState=p=>p.evaluate(()=>window.HanqBattleInvites?HanqBattleInvites.state():null);
async function waitSupported(p){await p.waitForFunction(()=>window.HanqBattleInvites&&HanqBattleInvites.state().supported===true,null,{timeout:15000});}
async function islandRow(p,name){await p.locator('.bi-participant',{hasText:name}).first().waitFor({timeout:20000});return p.locator('.bi-participant',{hasText:name}).first();}
async function refreshLobby(p){const r=p.locator('.bi-refresh');if(await r.count()&&await r.isVisible()&&await r.isEnabled())await r.click();await p.waitForTimeout(400);}
async function backToLobby(p){await p.goto(ORIGIN+'/#subjects');await p.waitForTimeout(300);await p.goto(ORIGIN+'/#battle');await p.locator('.bi-lobby').waitFor({timeout:20000});}
(async()=>{const report={};const engines=process.env.QA_ENGINE?[process.env.QA_ENGINE]:['chromium'];
 for(const engine of engines){const browser=await pw[engine].launch(engine==='chromium'?{channel:'chrome'}:{});const r=report[engine]={};
  try{
   const [ua,ub]=await Promise.all([signupUser('학습자A'),signupUser('신청자B')]);
   const A=await login(browser,ua),B=await login(browser,ub,{width:1440,height:900});
   // A studies on the word list with a search typed; B is on the ice island.
   await A.page.goto(ORIGIN+'/#toeic/notebook');await waitSupported(A.page);
   const search=A.page.locator('.tn-word-search input');await search.waitFor();await search.fill('typed while studying');
   await A.page.evaluate(()=>{const c=document.querySelector('.device-content');if(c)c.scrollTop=40;});const scrollBefore=await A.page.evaluate(()=>(document.querySelector('.device-content')||{}).scrollTop||0);
   await B.page.goto(ORIGIN+'/#battle');const rowA=await islandRow(B.page,'학습자A');
   r.learnerListed=await rowA.locator('.bi-activity').textContent();assert.equal(r.learnerListed,'학습 중');
   await B.page.locator('.bi-participant',{hasText:'신청자B'}).first().waitFor();r.selfRowButtons=await B.page.locator('.bi-participant',{hasText:'신청자B'}).first().locator('button').count();assert.equal(r.selfRowButtons,0,'no invite button on own row');
   await B.page.screenshot({path:path.join(out,`${engine}-island-list.png`)});
   // Invite: A sees one centered popup on the study page; nothing on the page changes.
   await rowA.getByRole('button',{name:'대결 신청'}).click();
   await A.page.locator('.hbi-dialog').waitFor({timeout:10000});
   r.popupTitle=await A.page.locator('#hbi-title').textContent();assert(r.popupTitle.startsWith('신청자B')&&r.popupTitle.endsWith('님이 대전을 신청했습니다. 수락하시겠습니까?'),r.popupTitle);
   r.countdown=await A.page.locator('.hbi-countdown').textContent();assert(/남은 시간 (10|9)초/.test(r.countdown),r.countdown);
   assert.equal(new URL(A.page.url()).hash,'#toeic/notebook','no navigation before accepting');assert.equal(await search.inputValue(),'typed while studying');
   await A.page.screenshot({path:path.join(out,`${engine}-learner-popup.png`)});
   await B.page.locator('.bi-invite-dialog').waitFor();r.challengerWaiting=await B.page.locator('#bi-invite-title').textContent();
   // A declines: page intact, B learns why.
   await A.page.getByRole('button',{name:'거절'}).click();await A.page.locator('.hbi-overlay').waitFor({state:'detached'});
   assert.equal(await search.inputValue(),'typed while studying');assert.equal(new URL(A.page.url()).hash,'#toeic/notebook');r.scrollKept=Math.abs((await A.page.evaluate(()=>(document.querySelector('.device-content')||{}).scrollTop||0))-scrollBefore)<2;
   await B.page.waitForFunction(()=>/거절했어요/.test(document.body.textContent),null,{timeout:10000});r.declineNotice=true;
   // Cancel by the challenger: the learner's popup closes and says why.
   await rowA.getByRole('button',{name:'대결 신청'}).click();await A.page.locator('.hbi-dialog').waitFor();await B.page.locator('.bi-invite-dialog').waitFor();
   await B.page.locator('.bi-invite-dialog').getByRole('button',{name:'신청 취소'}).click();await A.page.locator('.hbi-overlay').waitFor({state:'detached',timeout:10000});
   await A.page.waitForFunction(()=>/신청을 취소했어요/.test((document.querySelector('.hbi-toast')||{}).textContent||''),null,{timeout:10000});r.cancelNotice=true;
   // Ten-second server expiry: both sides close and learn why.
   await refreshLobby(B.page);await (await islandRow(B.page,'학습자A')).getByRole('button',{name:'대결 신청'}).click();await A.page.locator('.hbi-dialog').waitFor();const t0=Date.now();
   await A.page.locator('.hbi-overlay').waitFor({state:'detached',timeout:16000});r.expiryClosedAfterMs=Date.now()-t0;assert(r.expiryClosedAfterMs>=8500&&r.expiryClosedAfterMs<=13500,'closes at the server expiry: '+r.expiryClosedAfterMs);
   await B.page.waitForFunction(()=>/응답하지 않아 신청이 만료됐어요/.test((document.querySelector('.hbi-toast')||{}).textContent||''),null,{timeout:8000});r.expiryNotice=true;
   assert.equal(await search.inputValue(),'typed while studying');
   // Simultaneous invitations from B and C, A has a second tab on another page: one popup per tab, queue noted.
   const uc=await signupUser('신청자C'),ud=await signupUser('관전자D');const C=await login(browser,uc),D=await login(browser,ud,{width:1440,height:900});
   await C.page.goto(ORIGIN+'/#battle');await D.page.goto(ORIGIN+'/#battle');
   const A2=await A.context.newPage();A2.on('pageerror',e=>A.errors.push(e.message));await A2.goto(ORIGIN+'/#history');await waitSupported(A2);
   await refreshLobby(B.page);await refreshLobby(C.page);
   await (await islandRow(B.page,'학습자A')).getByRole('button',{name:'대결 신청'}).click();await A.page.locator('.hbi-dialog').waitFor();
   await (await islandRow(C.page,'학습자A')).getByRole('button',{name:'대결 신청'}).click();
   await A.page.waitForFunction(()=>/뒤에 1개의 신청이 더 있어요/.test((document.querySelector('#hbi-detail')||{}).textContent||''),null,{timeout:10000});
   r.onePopupPerTab=await A.page.locator('.hbi-dialog').count();assert.equal(r.onePopupPerTab,1);await A2.locator('.hbi-dialog').waitFor();assert.equal(await A2.locator('.hbi-dialog').count(),1);
   await A.page.screenshot({path:path.join(out,`${engine}-queued-popup.png`)});
   // Both tabs press accept at once: exactly one battle.
   await Promise.all([A.page.locator('.hbi-accept').click(),A2.locator('.hbi-accept').click()]);
   await A.page.waitForFunction(()=>/^#battle\/[0-9a-f-]{36}$/.test(location.hash),null,{timeout:15000});const matchId=new URL(A.page.url()).hash.slice(8);
   r.activeMatchesForA=Number((await one("SELECT count(*) n FROM hanq.battle_matches WHERE status IN('ready','playing','between') AND (challenger=$1 OR opponent=$1)",[ua.id])).n);assert.equal(r.activeMatchesForA,1);
   r.seats=Number((await one('SELECT count(*) n FROM hanq.battle_seats WHERE match_id=$1',[matchId])).n);assert.equal(r.seats,2);
   await C.page.waitForFunction(()=>/다른 대전을 시작했어요/.test((document.querySelector('.hbi-toast')||{}).textContent||''),null,{timeout:10000});r.otherChallengerToldBusy=true;
   await B.page.locator('.bi-arena,.bi-ready,.bi-match').first().waitFor({timeout:15000});r.challengerEnteredMatch=true;
   // A battling player: shown as such, and the server refuses a forced request.
   await refreshLobby(D.page);const busyRow=await islandRow(D.page,'학습자A');r.busyLabel=await busyRow.locator('.bi-activity').textContent();assert(/전투 중$/.test(r.busyLabel),r.busyLabel);
   assert(await busyRow.getByRole('button',{name:'대결 신청'}).isDisabled());
   const forced=await D.page.evaluate(async()=>{const l=await HanqApi.battle('GET','/lobby');const target=l.participants.find(p=>p.activity==='battling');try{await HanqApi.battle('POST','/challenges',{opponent:target.id,subject:'history',requestId:crypto.randomUUID()});return 'created';}catch(e){return e.status+':'+e.code;}});
   r.forcedChallengeToBattler=forced;assert.equal(forced,'409:battle_busy');
   // Existing battle end: forfeit settles once (result recorded, XP ledger once).
   await B.page.evaluate(async id=>{await HanqApi.battle('POST','/matches/'+id+'/forfeit',{});},matchId);
   await B.page.waitForFunction(()=>!!document.querySelector('.bi-result')||/승리|패배|결과/.test(document.body.textContent),null,{timeout:15000});
   r.battleXpRows=Number((await one("SELECT count(*) n FROM hanq.growth_ledger WHERE battle_match_id=$1",[matchId])).n);assert(r.battleXpRows<=2);
   // Practice bot still works from the island.
   await backToLobby(D.page);await D.page.getByRole('button',{name:'봇과 연습'}).click();await D.page.locator('.bi-arena,.bi-ready,.bi-match').first().waitFor({timeout:15000});r.practiceBot=true;
   // Accept while the leave confirmation is still running: if it expires meanwhile, no battle and the page stays.
   await A.page.goto(ORIGIN+'/#toeic/notebook');await waitSupported(A.page);await A.page.evaluate(()=>{window.HanqSemanticLibrary={hasUnsaved:()=>true,prepareLeave:()=>new Promise(r=>setTimeout(r,11000))};});
   await backToLobby(B.page);
   await B.page.waitForTimeout(1500);await refreshLobby(B.page);await (await islandRow(B.page,'학습자A')).getByRole('button',{name:'대결 신청'}).click();
   await A.page.locator('.hbi-dialog').waitFor();await A.page.locator('.hbi-accept').click();
   await A.page.waitForFunction(()=>/확인하는 동안 신청이 만료됐어요/.test((document.querySelector('.hbi-toast')||{}).textContent||''),null,{timeout:20000});
   assert.equal(new URL(A.page.url()).hash,'#toeic/notebook');r.expiredDuringConfirm='stayed, no battle';
   r.activeAfterConfirm=Number((await one("SELECT count(*) n FROM hanq.battle_matches WHERE status IN('ready','playing','between') AND (challenger=$1 OR opponent=$1)",[ua.id])).n);assert.equal(r.activeAfterConfirm,0);
   await A.page.evaluate(()=>{delete window.HanqSemanticLibrary;});
   // Refresh keeps one tab lease (same tab id), one row per account.
   // Island leases from the battle expire on their own; the site lease of this tab must be reused, not duplicated.
   const siteRows=async()=>Number((await one("SELECT count(*) n FROM hanq.battle_lobby_sessions WHERE user_id=$1 AND place='site'",[ua.id])).n);
   const tabId=await A.page.evaluate(()=>sessionStorage.getItem('hanq:battle-site-session:v1'));const sitesBefore=await siteRows();
   await A.page.reload();await waitSupported(A.page);await A.page.waitForTimeout(500);
   r.reloadKeepsTabLease={sameTabId:tabId===await A.page.evaluate(()=>sessionStorage.getItem('hanq:battle-site-session:v1')),siteRows:[sitesBefore,await siteRows()]};
   assert(r.reloadKeepsTabLease.sameTabId);assert.equal(r.reloadKeepsTabLease.siteRows[1],sitesBefore);
   await refreshLobby(B.page);r.rowsForA=await B.page.locator('.bi-participant',{hasText:'학습자A'}).count();assert.equal(r.rowsForA,1);
   // Network loss: presence lapses (heartbeat + 25s lease); back online it returns and invitations arrive again.
   await A.context.setOffline(true);await B.page.waitForTimeout(28000);await refreshLobby(B.page);r.offlineListed=await B.page.locator('.bi-participant',{hasText:'학습자A'}).count();assert.equal(r.offlineListed,0);
   await A.context.setOffline(false);await B.page.waitForTimeout(12000);await refreshLobby(B.page);r.backOnline=await B.page.locator('.bi-participant',{hasText:'학습자A'}).count();assert.equal(r.backOnline,1);
   await (await islandRow(B.page,'학습자A')).getByRole('button',{name:'대결 신청'}).click();await A.page.locator('.hbi-dialog').waitFor({timeout:15000});r.inviteAfterReconnect=true;await A.page.getByRole('button',{name:'거절'}).click();
   // Closing one tab keeps the account online; closing the last takes it off at once (explicit suspend).
   await A2.close({runBeforeUnload:true});await B.page.waitForTimeout(1500);await refreshLobby(B.page);r.afterOneTabClosed=await B.page.locator('.bi-participant',{hasText:'학습자A'}).count();assert.equal(r.afterOneTabClosed,1);
   // Logout: no more invitations and the account leaves the list once its lease lapses.
   await A.page.locator('#headerLogout').click();await A.page.waitForFunction(()=>!HanqApi.state().signedIn,null,{timeout:10000});r.afterLogoutState=await inviteState(A.page);assert.equal(r.afterLogoutState.stream,false);
   await B.page.waitForTimeout(28000);await refreshLobby(B.page);r.afterLogoutListed=await B.page.locator('.bi-participant',{hasText:'학습자A'}).count();assert.equal(r.afterLogoutListed,0);
   assert.deepEqual(A.errors,[]);assert.deepEqual(B.errors,[]);assert.deepEqual(C.errors,[]);assert.deepEqual(D.errors,[]);
   console.log(engine,'PASS',JSON.stringify(r));
   for(const x of [A,B,C,D])await x.context.close();
  }finally{await browser.close();}}
 await db.end();fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({passed:true,stack:'local API + embedded PostgreSQL',report},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
