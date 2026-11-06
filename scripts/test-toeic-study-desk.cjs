'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('../.test-tools/node_modules/jsdom');
const source=fs.readFileSync(path.resolve(__dirname,'../media/toeic-cbt.js'),'utf8'),reader=fs.readFileSync(path.resolve(__dirname,'../media/learning-reader.js'),'utf8'),tick=()=>new Promise(r=>setTimeout(r,0));
const passage='DOCUMENT 1 — Email\nTo: Synthetic reader\n\nFirst original source.\n\nDOCUMENT 2 — Notice\nSecond original source.\n';
let checks=0;function ok(v,m){assert(v,m);checks++;}
(async()=>{for(const part of [1,2,3,4,5,6,7]){
 const dom=new JSDOM('<main id="app"><section id="host"></section></main>',{url:'https://synthetic.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,h=w.document.querySelector('#host');w.HTMLElement.prototype.scrollIntoView=function(){};
 const grouped=[3,4,6,7].includes(part),qs=Array.from({length:grouped?3:2},(_,i)=>({collectionId:'synthetic',number:i+1,displayNumber:String(5000+i),sourceTitle:'Synthetic fixture',part,groupId:'g',groupQuestionNumbers:grouped?[1,2,3]:[i+1],passage:part>=6?passage:null,audioUrl:part<5?'https://synthetic.invalid/audio':null,stem:part<=2?'':'Original question '+i,available:true,officiallyVerified:true,options:['A','B','C','D'].map(id=>({id,text:part<=2?id:'Original choice '+id}))}));
 let auth={signedIn:true,ownerId:'synthetic'},listeners=[],writes=[],stopAudio=0;
 w.HanqToeicAudio={mount(parent){const a=w.document.createElement('audio');a.dataset.position='23';parent.appendChild(a);},stop(){stopAudio++;}};w.HTMLMediaElement.prototype.pause=function(){};w.HTMLMediaElement.prototype.load=function(){};
 w.eval(reader);w.eval(source);const api={state:()=>auth,onChange:f=>(listeners.push(f),()=>{}),ensureSession:async()=>{},newSubmissionId:()=> 'synthetic-request-key',toeicCbt:async(m,u,b)=>{if(m==='GET')return {items:qs};writes.push(b);throw Error('synthetic response lost');}};
 w.HanqToeicCbt.mount(h,{api,initialPart:part,onAccount(){}});await tick();await tick();
 ok(h.classList.contains('tc-study-active'),'question starts desk');ok(h.querySelector('.tc-progress-numbers').textContent==='1'+(grouped?'–3':'')+' / '+qs.length+'문항','position count independent of 5000 stable ID');ok(h.querySelector('.qnum').textContent==='5000','stable number preserved');
 if(part<=2)ok(h.querySelector('[data-option=A]').textContent==='A','letter option not duplicated');else ok(h.querySelector('[data-option=A]').textContent==='A. Original choice A','real choice text preserved');
 if(grouped){
  ok(h.querySelectorAll('.tc-group-item').length===3,'all members retained');ok(h.querySelector('.tc-questions-pane .tc-check-answer'),'existing check moved with questions');
  const audio=h.querySelector('audio'),stops=stopAudio,left=h.querySelector('.tc-source-pane'),right=h.querySelector('.tc-questions-pane'),first=h.querySelector('.tc-group-item [data-option=B]');first.click();left.scrollTop=120;right.scrollTop=180;
  const click=s=>h.querySelector(s).click();for(let i=0;i<4;i++){click('[data-pane-target=source]');click('[data-pane-target=questions]');}
  ok(h.querySelector('.tc-group-item [data-option=B]')===first&&first.getAttribute('aria-checked')==='true','same choice DOM and selected answer');ok(left.scrollTop===120&&right.scrollTop===180,'both scroll positions preserved');ok(stopAudio===stops&&h.querySelector('audio')===audio,'switch does not restart audio');ok(h.querySelector('.tc-workspace-progress').textContent==='선택 1 / 3','actual selection progress');ok(h.querySelector('[data-member-target="5000"]').getAttribute('aria-label')==='5000번 문제 · B 선택','selection indicator accessible');
  click('[data-pane-target=source]');click('[data-member-target="5001"]');ok(h.querySelector('.tc-workspace').dataset.view==='questions','member shortcut returns to questions');
  if(part>=6){let text=Array.from(left.querySelectorAll('.lr-source')).map(n=>n.textContent).join('')||left.querySelector('.tc-passage').textContent;ok(text===passage,'exact passage characters once');}
  if(part<=4)ok(h.querySelector('.tc-workspace-audio audio')===audio,'audio dock persists outside switching panes');
  click('.tc-jump-opener');h.querySelector('.tc-jump-search').value='5001';h.querySelector('.tc-jump-search').dispatchEvent(new w.Event('input'));h.querySelector('.tc-jump .tc-question-nav button[data-display-number="5001"]').click();ok(first.getAttribute('aria-checked')==='true','same-group picker retains choice');ok(h.querySelector('.tc-workspace').dataset.view==='questions','picker opens target pane');
  ok(writes.length===0,'no API writes from navigation');
  for(const c of h.querySelectorAll('.tc-group-item'))c.querySelector('[data-option=A]').click();left.scrollTop=140;right.scrollTop=220;click('.tc-check-answer');await tick();await tick();ok(h.querySelector('.tc-source-pane').scrollTop===140&&h.querySelector('.tc-questions-pane').scrollTop===220,'failed-save rerender keeps scroll');ok(h.querySelectorAll('[aria-checked=true]').length===3,'pending choices retained after failed save');ok(writes.length===1,'existing group endpoint once');
 }
 h.querySelector('.tc-topnav>button').click();ok(!h.classList.contains('tc-study-active'),'exit leaves no active desk class');w.HanqToeicCbt.stop();ok(!h.classList.contains('tc-study-active')&&h.children.length===0,'stop cleans mode');dom.window.close();
}
// Mixed Part 5/6: passage shortcuts stay available without pushing a single item down.
{
 const dom=new JSDOM('<main id="app"><section id="host"></section></main>',{url:'https://synthetic.invalid',runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,h=w.document.querySelector('#host');w.HTMLElement.prototype.scrollIntoView=function(){};
 const qs=[5,6,6].map((part,i)=>({collectionId:'mixed',number:i+1,displayNumber:String(5000+i),sourceTitle:'Synthetic fixture',part,groupId:part===6?'shared':null,groupQuestionNumbers:part===6?[2,3]:[1],passage:part===6?passage:null,stem:'Original question',available:true,officiallyVerified:true,options:['A','B','C','D'].map(id=>({id,text:'Original choice '+id}))}));let writes=0;
 w.eval(reader);w.eval(source);w.HanqToeicCbt.mount(h,{api:{state:()=>({signedIn:true,ownerId:'synthetic'}),onChange:()=>()=>{},ensureSession:async()=>{},toeicCbt:async m=>{if(m==='GET')return{items:qs};writes++;}},initialPart:5});await tick();await tick();
 ok(h.querySelector('.qnum').textContent==='5000','mixed group begins with Part 5');
 ok(!h.querySelector(':scope>.tc-passage-shortcuts'),'single item has no permanent passage directory');
 ok(h.querySelector('.tc-jump[hidden] .tc-passage-shortcuts'),'Part 6 shortcuts preserved in closed picker');
 h.querySelector('[data-option=B]').click();h.querySelector('.tc-jump-opener').click();
 ok(!h.querySelector('.tc-jump').hidden&&h.querySelector('.tc-passage-shortcuts button'),'shortcuts available when picker opens');
 h.querySelector('.tc-jump-close').click();ok(h.querySelector('[data-option=B]').getAttribute('aria-checked')==='true','picker close keeps single-item choice');
 h.querySelector('.tc-jump-opener').click();h.querySelector('.tc-passage-shortcuts button').click();
 ok(h.querySelectorAll('.tc-group-item').length===2,'passage shortcut still opens actual group');ok(writes===0,'shortcut navigation never submits');
 w.HanqToeicCbt.stop();dom.window.close();
}
console.log(JSON.stringify({passed:true,checks,scope:'synthetic desk lifecycle, Parts1–7, source fidelity, mobile switches, choice/scroll/audio identity, picker, failed submit, stable IDs',productionWrites:0}));})().catch(e=>{console.error(e);process.exit(1)});
