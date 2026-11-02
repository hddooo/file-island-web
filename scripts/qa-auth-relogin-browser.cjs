'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{chromium}=require('../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),source=path.resolve('../api/private-textbook-semantic-data'),out=path.resolve('../audit/auth-relogin-browser');fs.mkdirSync(out,{recursive:true});
(async()=>{const browser=await chromium.launch({headless:true}),results=[];
try{for(const width of [390,1440])for(const loginOwner of ['A','B']){let owner='A',cookie=true,expired=false,seq=0,writes=0,refreshes=0;const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
const session=()=>({accessToken:'isolated-token-'+(++seq),accessTokenExpiresAt:new Date(Date.now()+600000).toISOString(),user:{id:owner,displayName:'fixture'}});
await page.addInitScript(()=>localStorage.setItem('hanqacct:signedIn','1'));
await page.route('**/*',async route=>{const r=route.request(),u=new URL(r.url()),p=u.pathname;if(u.origin!=='https://auth-fixture.test')return route.fulfill({status:503,body:'external disabled'});
const json=(data,status=200)=>route.fulfill({status,json:data});
if(p.startsWith('/api/v1/')){
 if(p==='/api/v1/auth/refresh'){refreshes++;return cookie?json(session()):json({error:{code:'invalid_refresh'}},401);}
 if(p==='/api/v1/auth/signin'){owner=loginOwner;cookie=true;expired=false;return json(session());}
 if(expired)return json({error:{code:'unauthorized'}},401);
 if(p==='/api/v1/me')return json({user:{id:owner,displayName:'fixture'},premium:{active:true},growth:{points:20},access:{total:20}});
 if(p==='/api/v1/textbook/semantic/manifest')return json(JSON.parse(fs.readFileSync(source+'/manifest.json')));
 if(p==='/api/v1/textbook/semantic/quizzes/prehistory')return json(JSON.parse(fs.readFileSync(source+'/quizzes/prehistory.json')));
 if(p==='/api/v1/textbook/semantic/workspaces/prehistory'){if(r.method()!=='GET')writes++;return json({version:'fixture',revision:0,workspace:{cursor:0,status:'active',responses:{}}});}
 return json({},404);
}
let file=path.join(root,p==='/'?'index.html':p);if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404});
if(p==='/'){let html=fs.readFileSync(file,'utf8').replace(/https:\/\/hanq-api\.onrender\.com/g,'https://auth-fixture.test');return route.fulfill({contentType:'text/html; charset=utf-8',body:html});}return route.fulfill({path:file});});
await page.goto('https://auth-fixture.test/#chapter/prehistory/bookquiz');const inputs=page.locator('.textbook-source-quiz-input');await inputs.last().waitFor();assert.equal(await inputs.count(),36);
await inputs.first().fill('재로그인 복원 응답');await page.keyboard.press('Tab');cookie=false;expired=true;
await page.locator('#acEmail').waitFor();assert.equal(new URL(page.url()).hash,'#account');await page.locator('#acEmail').fill('fixture@example.test');await page.locator('#acPw').fill('isolated fake password');await page.locator('#acAuthSubmit').click();if(loginOwner==='B'){await page.locator('#acMeTitle').waitFor();assert.equal(new URL(page.url()).hash,'#account');await page.goto('https://auth-fixture.test/#chapter/prehistory/bookquiz');}await inputs.last().waitFor();assert.equal(new URL(page.url()).hash,'#chapter/prehistory/bookquiz');
if(loginOwner==='A'){assert.equal(await inputs.first().inputValue(),'재로그인 복원 응답');await page.waitForFunction(()=>document.activeElement===document.querySelectorAll('.textbook-source-quiz-input')[1]);assert((await page.locator('.textbook-source-inline-feedback').first().innerText()).includes('정답:'));}else{assert.equal(await inputs.first().inputValue(),'');assert(!(await page.locator('body').innerText()).includes('재로그인 복원 응답'));}
assert.equal(writes,0,'failed save must not write under reauthenticated owner');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);assert.deepEqual(await page.locator('.steps > button').allTextContents(),['01 개념 학습','02 시험에는 이렇게 나온다','03 빈칸 퀴즈']);assert.deepEqual(errors,[]);await page.screenshot({path:path.join(out,`restored-${loginOwner}-${width}.png`)});results.push({width,sameOwner:loginOwner==='A',returnTo:true,ownerIsolation:true,answerAndFocus:loginOwner==='A',noAutomaticOverwrite:true,refreshRequests:refreshes,errors:0});await page.close();}
}finally{await browser.close();}fs.writeFileSync(out+'/results.json',JSON.stringify({scope:'isolated Chromium; real front API client and full account/source UI; mocked transport only; no operating data',results},null,2));console.log(JSON.stringify({passed:true,views:results.length,results}));})().catch(e=>{console.error(e);process.exit(1);});
