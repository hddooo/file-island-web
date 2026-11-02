/* Local-only full-app QA. Every network request is fulfilled from files or synthetic fixtures. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require(process.env.HANQ_PLAYWRIGHT||'../.test-tools/node_modules/playwright');
const root=path.resolve(__dirname,'..'),out=path.resolve(process.env.HANQ_QA_OUTPUT||path.join(root,'../evidence/island-harbors'));
fs.mkdirSync(out,{recursive:true});
const subjects={history:{hash:'#history',labels:['시대별 학습','모의고사','오답노트'],routes:['#past-exams','#formal-exams','#wrongnotes']},toeic:{hash:'#toeic/map',labels:['단어','오답노트','문법노트','플레이어'],routes:['#toeic/notebook','#toeic/wrongnotes','#toeic/grammar','#toeic/player']}};
(async()=>{const results=[],errors=[],requests=[];
async function setup(browser,width,motion='reduce'){
 const p=await browser.newPage({viewport:{width,height:844},reducedMotion:motion,hasTouch:width<700});
 await p.addInitScript(()=>{localStorage.setItem('hanqacct:signedIn','1');localStorage.setItem('island-qa-retained-progress','{"chapter":"goryeo","score":80}');});
 p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>{const u=new URL(r.request().url());if(u.pathname.startsWith('/api/v1/')){requests.push({method:r.request().method(),path:u.pathname});const user={id:'island-qa',displayName:'탐험가',email:'fixture@example.test'};return r.fulfill({json:u.pathname.endsWith('/refresh')?{accessToken:'synthetic',user}:u.pathname.endsWith('/me')?{user,growth:{points:1000},access:{total:1,today:true},premium:{active:false}}:{items:[],notes:[],archived:[],days:[],total:0,page:1,pages:1,entries:[]}});}if(u.hostname!=='islands.test')return r.abort();const f=path.join(root,u.pathname==='/'?'index.html':u.pathname);return fs.existsSync(f)&&fs.statSync(f).isFile()?r.fulfill({path:f}):r.fulfill({status:404,body:''});});return p;
}
async function map(p,kind,theme){await p.goto('https://islands.test/'+subjects[kind].hash);await p.locator('.island-harbors').waitFor();await p.locator('.harbor-chart img').evaluate(n=>n.decode());await p.evaluate(t=>document.documentElement.dataset.hanqTheme=t,theme);await p.waitForTimeout(80);}
async function verify(p,kind){
 const spec=subjects[kind],map=p.locator('.island-harbors'),stops=map.locator('.harbor-stop');assert.equal(await stops.count(),spec.labels.length);
 assert.deepEqual(await stops.locator('strong,.wn-entry-t').allTextContents(),spec.labels);
 const boxes=await stops.evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect(),s=n.querySelector('.harbor-sign').getBoundingClientRect(),pin=n.querySelector('.harbor-pin').getBoundingClientRect(),m=n.closest('.island-harbors').getBoundingClientRect();return{width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom,labelFits:n.querySelector('strong,.wn-entry-t').scrollWidth<=s.width,pinHit:n.contains(document.elementFromPoint(pin.x+pin.width/2,pin.y+pin.height/2)),inside:r.left>=m.left&&r.right<=m.right&&r.top>=m.top&&r.bottom<=m.bottom};}));
 boxes.forEach(b=>assert(b.width>=44&&b.height>=44&&b.labelFits&&b.inside&&b.pinHit,JSON.stringify(b)));
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++)assert(!(boxes[i].left<boxes[j].right&&boxes[j].left<boxes[i].right&&boxes[i].top<boxes[j].bottom&&boxes[j].top<boxes[i].bottom),'overlapping stops');
 assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.equal(await p.locator('.world-map-trail').count(),0);assert.equal(await p.locator('#app').evaluate(n=>n.inert),false);
 assert.equal(await p.evaluate(()=>localStorage.getItem('island-qa-retained-progress')),'{"chapter":"goryeo","score":80}');return boxes;
}
for(const [engine,launch] of [['chrome',chromium],['webkit',webkit]]){
 const b=await launch.launch(engine==='chrome'?{channel:'chrome'}:{});
 try{
 for(const width of [320,390,1440])for(const theme of ['default','terminal'])for(const kind of ['history','toeic']){
  const p=await setup(b,width);await map(p,kind,theme);const boxes=await verify(p,kind);await p.screenshot({path:path.join(out,`${engine}-${kind}-${theme}-${width}.png`)});
  for(let i=0;i<subjects[kind].labels.length;i++){
   const stop=p.locator('.harbor-stop').nth(i);
   if(i===0){await stop.focus();await p.keyboard.press(engine==='webkit'?'Alt+Tab':'Tab');assert.equal(await p.locator('.harbor-stop').nth(1).evaluate(n=>n===document.activeElement),true);await stop.focus();assert.notEqual(await stop.evaluate(n=>getComputedStyle(n).outlineStyle),'none');await p.keyboard.press('Enter');}
   else if(i%2)await stop.locator('.harbor-pin').click();else await stop.locator('.harbor-sign').click();
   await p.waitForFunction(h=>location.hash===h,subjects[kind].routes[i]);await p.waitForTimeout(80);assert.equal(await p.locator('.world-journey').count(),0);
   await p.goBack();await p.locator('.island-harbors').waitFor();await verify(p,kind);
  }
  await p.evaluate(()=>{HanqWorldScene.sync();HanqWorldScene.sync();HanqWorldScene.sync();});assert.equal(await p.locator('.harbor-chart').count(),1);
  const pane=p.locator('.device-content');await pane.evaluate(n=>{const spacer=document.createElement('div');spacer.style.height='900px';spacer.dataset.qaSpacer='true';n.appendChild(spacer);n.scrollTop=0;});const chart=await p.locator('.harbor-chart').boundingBox();await p.mouse.move(chart.x+chart.width/2,chart.y+30);await p.mouse.wheel(0,240);await p.waitForTimeout(120);assert(await pane.evaluate(n=>n.scrollTop>0),'wheel must scroll across scene');
  results.push({engine,width,theme,kind,motion:'reduce',stops:boxes.length,keyboard:true,routeBack:true,overlap:false,wheel:true});await p.close();
 }
 for(const kind of ['history','toeic']){
  const p=await setup(b,390,'no-preference');await map(p,kind,'terminal');const target=subjects[kind].routes[0];
  await p.locator('.harbor-stop').first().focus();await p.keyboard.press('Enter');await p.locator('.world-cinematic').waitFor();await p.keyboard.press('Escape');await p.waitForFunction(()=>!document.querySelector('.world-journey'));assert.equal(await p.locator('.harbor-stop').first().evaluate(n=>n===document.activeElement),true);
  await p.evaluate(()=>{const b=document.querySelector('.harbor-stop');b.click();b.click();b.click();});assert.equal(await p.locator('.world-cinematic').count(),1);await p.keyboard.press('Enter');await p.waitForFunction(h=>location.hash===h,target);await p.waitForFunction(()=>!document.querySelector('.world-journey'));assert.equal(await p.locator('#app').evaluate(n=>n.inert),false);await p.goBack();await p.locator('.island-harbors').waitFor();await verify(p,kind);
  results.push({engine,kind,width:390,motion:'no-preference',escapeFocus:true,rapidClicks:true,routeBack:true});await p.close();
 }
 }finally{await b.close();}
}
assert.deepEqual(errors,[]);
fs.writeFileSync(path.join(out,'qa-results.json'),JSON.stringify({passed:true,results,errors,requests:requests.filter((v,i,a)=>a.findIndex(x=>x.path===v.path&&x.method===v.method)===i),network:'All local/synthetic; no remote requests'},null,2));console.log(JSON.stringify({passed:true,cases:results.length,errors}));
})().catch(e=>{console.error(e);process.exitCode=1;});
