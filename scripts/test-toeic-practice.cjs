'use strict';
const assert=require('node:assert/strict'),path=require('path'),{chromium}=process.argv.includes('--browser')?require('playwright'):{};
const engine=require('../media/toeic-practice.js');
let checks=0;function ok(value,label){assert(value,label);checks++;}
async function browserTests(){
  ok(engine.validate(engine.demo).length===3,'three original demo sets');
  assert.throws(()=>engine.validate([{...engine.demo[1],passage:''}]));checks++;
  assert.throws(()=>engine.validate([engine.demo[0],engine.demo[0]]));checks++;
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  try {
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
    page.on('pageerror',e=>errors.push(e.message));
    await page.setContent('<html lang="ko"><main></main></html>');
    await page.addStyleTag({path:path.resolve(__dirname,'../media/toeic-practice.css')});
    await page.addScriptTag({path:path.resolve(__dirname,'../media/toeic-practice.js')});
    await page.evaluate(()=>{
      window.values={'hanq:history:sentinel':'preserve'},window.writes=[];
      window.storage={getItem:k=>values[k]||null,setItem:(k,v)=>{values[k]=v;writes.push(k);}};
      window.auth={signedIn:false,epoch:0},window.listeners=[];
      window.api={state:()=>auth,onChange:f=>{listeners.push(f);return()=>{listeners=listeners.filter(x=>x!==f);};}};
      window.mount=(part,dataset)=>{if(window.c)c.stop();window.c=HanqToeicPractice.create({document,storage,api});c.mount(document.querySelector('main'),{part,...(dataset===undefined?{}:{dataset})});};
      mount(5);
    });
    ok(await page.locator('[data-action=grade]').isDisabled(),'no automatic submission');
    await page.locator('[data-option=b]').click();
    ok(!(await page.locator('.toeic-explanation').count()),'selection reveals no answer');
    ok((await page.evaluate(()=>c.snapshot())).graded===false,'selection remains ungraded');
    await page.locator('[data-action=grade]').click();
    await page.evaluate(()=>{c.grade();c.grade();c.select('demo-p5-q1','a');});
    ok(await page.locator('.toeic-result').innerText()==='오답 · 정답: A. distributed','wrong answer feedback');
    let s=await page.evaluate(()=>c.snapshot());
    ok(s.records['["demo-p5-q1","1"]'].attempts===1,'repeated grade is idempotent');
    ok(s.index===0 && s.selections['demo-p5-q1']==='b','no auto advance; graded selection immutable');
    await page.locator('[data-star]').click();
    await page.getByRole('button',{name:'오답',exact:true}).click();
    ok((await page.evaluate(()=>c.snapshot())).current.id==='demo-p5-001','wrong review includes question');
    await page.locator('[data-option=a]').click();await page.locator('[data-action=grade]').click();
    ok(await page.locator('.toeic-explanation').count()===1,'correct grading retains active review card');
    await page.getByRole('button',{name:'오답',exact:true}).click();
    ok((await page.locator('main').innerText()).includes('해당 복습 문항이 없습니다'),'corrected question exits wrong review when refreshed');
    await page.getByRole('button',{name:'별표',exact:true}).click();
    ok(await page.locator('[data-star]').count()===1,'star review survives corrected answer');
    await page.evaluate(()=>mount(6));
    ok(await page.locator('.toeic-passage').count()===1 && await page.locator('fieldset').count()===2,'group passage and both questions intact');
    await page.locator('[data-question=demo-p6-q1][data-option=a]').click();
    ok(await page.locator('[data-action=grade]').isDisabled(),'group cannot grade incomplete answers');
    await page.locator('[data-question=demo-p6-q2][data-option=a]').click();await page.locator('[data-action=grade]').click();
    await page.getByRole('button',{name:'오답',exact:true}).click();
    ok(await page.locator('fieldset').count()===2 && await page.locator('.toeic-passage').count()===1,'wrong group retains all sibling questions and passage');
    await page.evaluate(()=>mount(7));
    ok(await page.locator('fieldset').count()===2,'Part 7 grouped questions');
    await page.evaluate(()=>{auth={signedIn:true,ownerId:'owner-a',epoch:1};listeners.slice().forEach(f=>f(auth));});
    s=await page.evaluate(()=>c.snapshot());
    ok(s.storageKey.endsWith(':owner:owner-a')&&Object.keys(s.records).length===0,'owner isolated from guest');
    await page.locator('[data-star=demo-p7-q1]').click();
    await page.evaluate(()=>{auth={signedIn:true,ownerId:'owner-b',epoch:2};listeners.slice().forEach(f=>f(auth));});
    ok(Object.keys((await page.evaluate(()=>c.snapshot())).records).length===0,'account switch clears prior owner progress');
    await page.evaluate(()=>{auth={signedIn:false,epoch:3};listeners.slice().forEach(f=>f(auth));mount(5);});
    ok((await page.evaluate(()=>c.snapshot())).records['["demo-p5-q1","1"]'].star,'guest progress restored separately');
    ok(await page.evaluate(()=>values['hanq:history:sentinel']==='preserve'&&writes.every(k=>k.startsWith('hanq:toeic-practice:v1:'))),'history storage untouched; separate namespace');
    await page.evaluate(()=>mount(6,[]));
    ok((await page.locator('main').innerText()).includes('등록된 문항이 없습니다'),'empty import-ready state');
    await page.evaluate(()=>{auth={signedIn:true,ownerId:'bad-json',epoch:4};values['hanq:toeic-practice:v1:owner:bad-json']='{bad';mount(5);});
    ok((await page.locator('main').innerText()).includes('새 기록으로 시작'),'malformed storage safe');
    await page.evaluate(()=>{storage={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}};auth={signedIn:true,ownerId:'blocked',epoch:5};mount(5);});
    await page.locator('[data-option=a]').click();await page.locator('[data-action=grade]').click();
    ok((await page.locator('main').innerText()).includes('이 탭에서만 기록'),'blocked storage visibly falls back');
    await page.evaluate(()=>mount(5));
    ok((await page.evaluate(()=>c.snapshot())).records['["demo-p5-q1","1"]'].attempts===1,'blocked storage retains tab memory');
    for(const width of [360,390,430,844,1440]){await page.setViewportSize({width,height:900});await page.evaluate(()=>mount(6));ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),'no horizontal overflow '+width);}
    await page.evaluate(()=>{c.stop();});
    ok(await page.locator('main').innerText()===''&&await page.evaluate(()=>listeners.length===0),'stop clears UI and auth listener');
    ok(errors.length===0,'no page runtime errors: '+errors.join(';'));
    console.log(JSON.stringify({checks,failures:0,coverage:'original demo; manual grading; wrong/star review; grouped passages; account/guest isolation; malformed/blocked storage; widths 360–1440'}));
  }finally{await browser.close();}
}
if(process.argv.includes('--browser')) browserTests().catch(e=>{console.error(e);process.exitCode=1;});
else { unitTests(); if(process.argv.includes('--dom')) domTests(); }

function unitTests(){
 class Node { constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.events={};this.disabled=false;this.textContent='';this.classList={add(){},remove(){}};} setAttribute(k,v){this.attrs[k]=v;} appendChild(n){this.children.push(n);return n;} replaceChildren(){this.children=[];} addEventListener(k,f){this.events[k]=f;} click(){if(!this.disabled&&this.events.click)this.events.click();} }
 const document={createElement:t=>new Node(t)},host=new Node('main'),values={'hanq:history:sentinel':'keep'},writes=[];
 const storage={getItem:k=>values[k]||null,setItem:(k,v)=>{values[k]=v;writes.push(k);}};
 let auth={signedIn:false,epoch:0},listeners=[],c;
 const api={state:()=>auth,onChange:f=>{listeners.push(f);return()=>{listeners=listeners.filter(x=>x!==f);};}};
 const all=(n=host)=>[n,...n.children.flatMap(x=>all(x))];
 const text=()=>all().map(x=>x.textContent).join(' ');
 const button=(attr,value)=>all().find(x=>x.tag==='button'&&x.attrs[attr]===value);
 function mount(part,dataset,store=storage){if(c)c.stop();c=engine.create({document,storage:store,api});c.mount(host,{part,...(dataset===undefined?{}:{dataset})});}
 function change(next){auth=next;listeners.slice().forEach(f=>f(auth));}
 mount(5);
 ok(button('data-action','grade').disabled,'grade initially disabled');
 button('data-option','b').click();ok(!c.snapshot().graded&&!text().includes('정답: A.'),'selection does not grade or reveal');
 button('data-action','grade').click();c.grade();c.grade();
 ok(c.snapshot().records['["demo-p5-q1","1"]'].attempts===1,'repeated grade only records once');
 ok(c.snapshot().index===0&&!c.select('demo-p5-q1','a'),'no auto advance and immutable graded selection');
 c.star('demo-p5-q1');c.setMode('wrong');ok(c.snapshot().current.id==='demo-p5-001','wrong review');
 c.select('demo-p5-q1','a');c.grade();ok(c.snapshot().current.id==='demo-p5-001','grading retains active wrong group');
 c.setMode('wrong');ok(!c.snapshot().current,'correct answer clears wrong review');
 c.setMode('star');ok(c.snapshot().current.id==='demo-p5-001','star remains after correction');
 mount(6);ok(c.snapshot().current.questions.length===2&&all().some(x=>x.attrs.class==='toeic-passage'),'group passage and questions');
 c.select('demo-p6-q1','a');ok(!c.grade(),'group cannot grade incomplete answers');
 c.select('demo-p6-q2','a');c.grade();c.setMode('wrong');ok(c.snapshot().current.questions.length===2,'wrong review preserves sibling question');
 mount(7);ok(c.snapshot().current.questions.length===2,'Part 7 group');
 change({signedIn:true,ownerId:'one',epoch:1});ok(c.snapshot().storageKey.endsWith(':owner:one')&&Object.keys(c.snapshot().records).length===0,'account isolated from guest');
 c.star('demo-p7-q1');change({signedIn:true,ownerId:'two',epoch:2});ok(!Object.keys(c.snapshot().records).length,'account switch clears previous records');
 change({signedIn:false,epoch:3});mount(5);ok(c.snapshot().records['["demo-p5-q1","1"]'].star,'guest progress restored');
 ok(values['hanq:history:sentinel']==='keep'&&writes.every(k=>k.startsWith('hanq:toeic-practice:v1:')),'history keys untouched');
 mount(6,[]);ok(text().includes('등록된 문항이 없습니다'),'empty import state');
 change({signedIn:true,ownerId:'malformed',epoch:4});values['hanq:toeic-practice:v1:owner:malformed']='{broken';mount(5);ok(text().includes('새 기록으로 시작'),'malformed storage safe');
 const blocked={getItem(){throw Error('blocked');},setItem(){throw Error('blocked');}};
 change({signedIn:true,ownerId:'blocked-unit',epoch:5});mount(5,undefined,blocked);c.select('demo-p5-q1','a');c.grade();ok(text().includes('이 탭에서만 기록'),'blocked storage fallback visible');
 mount(5,undefined,blocked);ok(c.snapshot().records['["demo-p5-q1","1"]'].attempts===1,'blocked storage survives remount in memory');
 const revised=JSON.parse(JSON.stringify(engine.demo));revised[0].questions[0].version='2';mount(5,revised,blocked);ok(!Object.keys(c.snapshot().records).length,'question version prevents stale answer reuse');
 const two=JSON.parse(JSON.stringify(engine.demo));const extra=JSON.parse(JSON.stringify(two[0]));extra.id='second-p5';extra.questions[0].id='second-q';two.push(extra);mount(5,two);ok(!c.next(),'next disallowed before grading');c.select('demo-p5-q1','a');c.grade();ok(c.snapshot().index===0,'does not advance after grading');ok(c.next()&&c.snapshot().current.id==='second-p5','explicit next advances');ok(!c.snapshot().graded&&!Object.keys(c.snapshot().selections).length,'next resets selection');
 assert.throws(()=>engine.validate([{...engine.demo[1],passage:''}]));checks++;
 assert.throws(()=>engine.validate([engine.demo[0],engine.demo[0]]));checks++;
 const bad=JSON.parse(JSON.stringify(engine.demo));bad[0].questions[0].options[1].id='a';assert.throws(()=>engine.validate(bad));checks++;
 const duplicateText=JSON.parse(JSON.stringify(engine.demo));duplicateText[0].questions[0].options[1].text='  DISTRIBUTED ';assert.throws(()=>engine.validate(duplicateText));checks++;

 for(const qid of ['__proto__','constructor','toString','hasOwnProperty']){
  const special=[JSON.parse(JSON.stringify(engine.demo[0]))];special[0].id='special-'+qid;special[0].questions[0].id=qid;
  special[0].questions[0].options.forEach((o,i)=>{o.id=['__proto__','constructor','toString','hasOwnProperty'][i];});special[0].questions[0].answerId='__proto__';
  mount(5,special);ok(button('data-action','grade').disabled&&!c.grade(),'inherited question ID not preselected: '+qid);
  ok(!c.select(qid,'valueOf')&&!c.grade(),'inherited unknown option rejected: '+qid);
  ok(c.select(qid,'__proto__')&&c.grade(),'explicit special option ID grades: '+qid);
  const state=c.snapshot();ok(state.selections[qid]==='__proto__'&&!state.records[JSON.stringify([qid,'1'])].wrong,'special IDs persist as own data: '+qid);
  c.retry();ok(!c.grade()&&button('data-action','grade').disabled,'retry null-prototype selection: '+qid);
 }
 const duplicateSpecial=[JSON.parse(JSON.stringify(engine.demo[0])),JSON.parse(JSON.stringify(engine.demo[0]))];duplicateSpecial[1].id='other-group';duplicateSpecial.forEach(g=>{g.questions[0].id='__proto__';});assert.throws(()=>engine.validate(duplicateSpecial));checks++;
 const duplicateOption=[JSON.parse(JSON.stringify(engine.demo[0]))];duplicateOption[0].questions[0].options[0].id='constructor';duplicateOption[0].questions[0].options[1].id='constructor';assert.throws(()=>engine.validate(duplicateOption));checks++;
 ok(Object.prototype.polluted===undefined,'prototype remains unmodified');
 mount(5,bad);ok(text().includes('문항을 불러올 수 없습니다'),'invalid data is visible safe error');
 c.stop();ok(!host.children.length&&!listeners.length,'stop removes UI and listener');
 console.log(JSON.stringify({checks,failures:0,mode:'dependency-free DOM/controller tests',browser:'Run with --browser for real Chromium layout tests'}));
}

function domTests(){
 const {JSDOM}=require(process.env.JSDOM_PATH||'../.test-tools/node_modules/jsdom');
 const d=new JSDOM('<main></main>',{url:'https://test.example'}),h=d.window.document.querySelector('main');
 const c=engine.create({document:d.window.document,storage:d.window.localStorage,api:null});
 c.mount(h,{part:6});assert.equal(h.querySelectorAll('fieldset').length,2);
 h.querySelector('[data-question="demo-p6-q1"][data-option="b"]').click();assert(h.querySelector('[data-action="grade"]').disabled);
 h.querySelector('[data-question="demo-p6-q2"][data-option="a"]').click();h.querySelector('[data-action="grade"]').click();
 assert.equal(h.querySelectorAll('.toeic-explanation').length,2);
 assert([...h.querySelectorAll('.toeic-result')].every(n=>n.textContent.startsWith('정답')));
 c.stop();assert.equal(h.children.length,0);d.window.close();console.log('Real JSDOM: 5 DOM assertions passed');
}
