'use strict';
// Synthetic, read-only browser fixture. No user answers or operating API writes.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.HANQ_PLAYWRIGHT_PATH||'playwright');
const root=path.resolve(__dirname,'..'),out=path.join(root,'evidence','era-repractice-keyboard');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const css=[...html.matchAll(/<link[^>]+href="\/?(media\/[^"?]+\.css)[^"]*"/g)].map(m=>fs.readFileSync(path.join(root,m[1]),'utf8')).join('\n')+'\n'+[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n');
(async()=>{
  fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({channel:process.env.QA_BROWSER||'msedge',headless:true});
  const results=[];
  try {
    for(const viewport of [{width:320,height:900},{width:390,height:844},{width:1440,height:900},{width:844,height:390}])for(const company of ['off','on']){
      const page=await browser.newPage({viewport,reducedMotion:viewport.width===390?'reduce':'no-preference'});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.route('**/*',route=>route.abort());
      await page.setContent('<html lang="ko" data-hanq-theme="terminal" data-company-mode="'+company+'"><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style><div id="app"><main></main></div></html>');
      for(const name of ['ui-locks','textbook-source-quiz','era-study-progress','hongmungwan'])await page.addScriptTag({path:name==='era-study-progress'&&process.env.ERA_PROGRESS_SCRIPT?process.env.ERA_PROGRESS_SCRIPT:path.join(root,'media',name+'.js')});
      await page.evaluate(async()=>{
        const source='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
        const make=(id,words)=>({id,originalNumber:id,kind:'fill-in',verification:{status:'source-verified',textVerified:true,answerPairVerified:true},segments:[{type:'text',text:'합성 문항 '+id+' '},{type:'blank',id:'b'}],blanks:[{id:'b',answerIds:['a0'],...(words.length>1?{parts:words.map((text,i)=>({id:'p'+i,answerIds:['a'+i]}))}:{})}],answers:words.map((text,i)=>({id:'a'+i,text})),answer:{text:words.join(', '),orderMatters:false}});
        const split=make('split',['알파','베타']);
        const classification=make('classification',['감마','델타']);classification.kind='classification';delete classification.segments;classification.text='합성 분류 문제';classification.subitems=[{sourceText:'분류 A'},{sourceText:'분류 B'}];classification.responseSlots=[{id:'r0',answerIds:['a0']},{id:'r1',answerIds:['a1']}];
        const sequence=make('sequence',['①','②']);sequence.kind='sequence';sequence.blanks=[{id:'b',answerIds:['a0','a1']}];sequence.answer={text:'①→②',orderMatters:true};
        const last=make('last',['오메가']);
        const models={},states={};for(const id of ['prehistory','ancient','nambuk','goryeo','joseon','opening','colonial','modern']){
          const items=id==='prehistory'?[split,classification,sequence]:[last];
          models[id]={id,title:id,version:'v',source:{sha256:source},items};
          states[id]={version:'v',workspace:{responses:(id==='prehistory'||id==='goryeo')?Object.fromEntries(items.map(item=>[item.id,{submitted:true,correct:false,values:HanqTextbookSourceQuiz.practiceSlots(item).map(()=>'합성 과거 오답'),checkedSlots:HanqTextbookSourceQuiz.practiceSlots(item).map(()=>true)}])):{}}};
        }
        window.fixture={writes:0,reads:0,state:{signedIn:true,ownerId:'fixture',epoch:1},states,snapshot:JSON.stringify(states)};
        const rejectWrite=()=>{fixture.writes++;throw Error('unexpected write');};
        const api={state:()=>fixture.state,onChange:fn=>{fixture.onChange=fn;return()=>{};},hongmungwan:async method=>{if(method!=='GET')return rejectWrite();return {resetAt:null,items:[]};},textbookSemanticQuiz:async id=>{fixture.reads++;return models[id];},textbookSourceWorkspace:async id=>{fixture.reads++;return states[id];},saveTextbookSourceWorkspace:rejectWrite,request:rejectWrite};
        await HanqHongmungwan.mount(document.querySelector('main'),{api}).ready;
      });
      const opener=page.locator('.era-aggregate .era-wrong-review');await opener.click();
      const inputs=page.locator('.era-practice-input'),feedback=page.locator('.era-practice-feedback');
      await inputs.last().waitFor();assert.equal(await inputs.count(),6);assert.equal(await page.locator('.era-wrong-era').count(),2);
      assert.equal(await inputs.evaluateAll(ns=>ns.every(n=>n.value==='')),true);
      assert.equal(await feedback.evaluateAll(ns=>ns.every(n=>n.hidden&&n.textContent==='')),true);
      const active=async i=>{assert.equal(await inputs.nth(i).evaluate(n=>n===document.activeElement),true,'focus input '+i);await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));const bounds=await inputs.nth(i).evaluate(n=>({top:n.getBoundingClientRect().top,bottom:n.getBoundingClientRect().bottom,header:document.querySelector('.era-wrong-head').getBoundingClientRect().bottom,boundary:document.querySelector('dialog').getBoundingClientRect().bottom}));assert(bounds.top>=bounds.header-1&&bounds.bottom<=bounds.boundary+1,JSON.stringify({viewport,company,index:i,bounds}));};
      const result=async(i,value)=>assert.equal(await feedback.nth(i).getAttribute('data-result'),value);
      await inputs.nth(0).fill('알파');await page.keyboard.press('Tab');await active(1);await result(0,'correct');assert.equal(await feedback.nth(1).isVisible(),false);
      assert.equal(await inputs.evaluateAll(ns=>ns.every(n=>n.enterKeyHint==='next'&&n.getAttribute('aria-label')&&n.getAttribute('aria-describedby').split(' ').every(id=>document.getElementById(id)))),true);
      assert.equal(await feedback.evaluateAll(ns=>new Set(ns.map(n=>n.id)).size),6);
      await inputs.nth(1).fill('틀린 답');await page.keyboard.press('Enter');await active(2);await result(1,'wrong');assert.equal(await inputs.nth(1).inputValue(),'틀린 답');assert.match(await feedback.nth(1).innerText(),/베타/);
      await inputs.nth(2).fill('감마');await page.keyboard.press('Tab');await active(3);await result(2,'correct');await result(0,'correct');await result(1,'wrong');
      await page.keyboard.press('Shift+Tab');await active(2);await result(3,'empty');assert.equal(await feedback.nth(3).innerText(),'답을 입력해 주세요.');
      await inputs.nth(2).fill('수정한 오답');assert.equal(await feedback.nth(2).isVisible(),false);await result(0,'correct');await result(1,'wrong');await page.keyboard.press('Enter');await active(3);await result(2,'wrong');
      await inputs.nth(3).fill('델타');await page.keyboard.press('Enter');await active(4);await result(3,'correct');await result(2,'wrong');
      await inputs.nth(4).fill('1,2');
      await inputs.nth(4).dispatchEvent('compositionstart');await inputs.nth(4).dispatchEvent('keydown',{key:'Enter',isComposing:true,bubbles:true,cancelable:true});await active(4);assert.equal(await feedback.nth(4).isVisible(),false);
      await inputs.nth(4).dispatchEvent('compositionend');await inputs.nth(4).dispatchEvent('keydown',{key:'Enter',bubbles:true,cancelable:true});await page.waitForFunction(()=>document.querySelectorAll('.era-practice-feedback')[4].dataset.result==='correct');await active(5);await result(4,'correct');assert.equal(await feedback.nth(5).isVisible(),false,'IME commit advances once');
      await page.evaluate(()=>document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true})));await active(5);assert.equal(await feedback.nth(5).isVisible(),false,'late commit Enter does not grade the new active blank');await page.keyboard.up('Enter');
      await inputs.nth(4).fill('1,2');await page.waitForTimeout(120);
      for(const details of [{keyCode:229},{ctrlKey:true},{altKey:true},{metaKey:true},{repeat:true}]){await inputs.nth(4).dispatchEvent('keydown',{key:'Enter',bubbles:true,cancelable:true,...details});await active(4);assert.equal(await feedback.nth(4).isVisible(),false);}
      await page.keyboard.press('Enter');await active(5);await result(4,'correct');
      await inputs.nth(5).fill('오메가');await page.keyboard.press('Enter');await result(5,'correct');assert.equal(await page.locator('.era-practice-grade').last().evaluate(n=>n===document.activeElement),true);
      await page.keyboard.press('Tab');assert.equal(await page.locator('.era-wrong-close').evaluate(n=>n===document.activeElement),true,'last grade button wraps to close');
      await page.keyboard.press('Tab');await active(0);await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('.era-wrong-close').evaluate(n=>n===document.activeElement),true,'first input returns to close without double trap');
      await page.keyboard.press('Shift+Tab');assert.equal(await page.locator('.era-practice-grade').last().evaluate(n=>n===document.activeElement),true);
      await inputs.nth(0).fill('알파');await inputs.nth(1).fill('베타');await page.locator('.era-practice-grade').first().click();await result(0,'correct');await result(1,'correct');await result(2,'wrong');
      await inputs.last().focus();const rect=await inputs.last().boundingBox();assert(rect.y>=0&&rect.y+rect.height<=viewport.height,'last input is scrolled into view');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'page overflow');
      assert.equal(await page.locator('dialog').evaluate(n=>n.scrollWidth>n.clientWidth+1),false,'dialog overflow');
      const inputMetrics=await inputs.evaluateAll(ns=>ns.map(n=>({font:getComputedStyle(n).fontSize,height:n.getBoundingClientRect().height})));assert(inputMetrics.every(n=>parseFloat(n.font)>=(viewport.width<480?16:14)&&n.height>=44),JSON.stringify({viewport,company,inputMetrics}));
      assert.equal(await page.evaluate(()=>fixture.writes),0);assert.equal(await page.evaluate(()=>JSON.stringify(fixture.states)===fixture.snapshot),true);
      await page.screenshot({path:path.join(out,'keyboard-'+company+'-'+viewport.width+'x'+viewport.height+'.png')});
      await page.keyboard.press('Escape');assert.equal(await page.locator('dialog').count(),0);assert.equal(await opener.evaluate(n=>n===document.activeElement),true);assert.equal(await page.locator('#app').evaluate(n=>n.inert),false);
      await opener.click();await inputs.last().waitFor();assert.equal(await inputs.evaluateAll(ns=>ns.every(n=>!n.value)),true);assert.equal(await feedback.evaluateAll(ns=>ns.every(n=>n.hidden&&!n.textContent)),true);
      await page.evaluate(()=>{window.dispatchEvent(new PopStateEvent('popstate'));});assert.equal(await page.locator('dialog').count(),0);assert.equal(await page.locator('#app').evaluate(n=>n.inert),false);
      await opener.click();await inputs.last().waitFor();await page.evaluate(()=>{fixture.state={signedIn:true,ownerId:'other',epoch:2};fixture.onChange();});assert.equal(await page.locator('dialog').count(),0);assert.equal(await page.locator('#app').evaluate(n=>n.inert),false);
      assert.deepEqual(errors,[]);results.push({viewport,company,reducedMotion:viewport.width===390,keyboard:true,ime:true,feedbackPreserved:true,modalLifecycle:true,writes:0});await page.close();
    }
  } finally {await browser.close();}
  fs.writeFileSync(path.join(out,'results.json'),JSON.stringify({scope:'Synthetic browser fixtures only; no production requests or account writes',results},null,2));
  console.log(JSON.stringify({cases:results.length,failures:0,scope:'Tab/Enter per-slot grading, multi-slot/classification/sequence, focus boundaries, IME, repeat/modifiers, manual grading, accessibility, close/reopen/back/account change, responsive/company/reduced-motion',writes:0}));
})().catch(error=>{console.error(error);process.exitCode=1;});
