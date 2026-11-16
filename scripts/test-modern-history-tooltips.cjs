'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require(process.env.JSDOM_PATH||'../.test-tools/node_modules/jsdom');
const dom=new JSDOM('<main></main>',{runScripts:'outside-only'});
const w=dom.window,host=w.document.querySelector('main'),SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
for(const n of ['history81-terms','history81-verified-glossary','history81-glossary'])w.eval(fs.readFileSync(path.join(__dirname,'../media',n+'.js'),'utf8'));
const entries=w.HanqHistory81VerifiedGlossary.definitions.filter(x=>x.era==='modern'&&x.allowPlain);
let checks=0;
const eq=(a,b)=>{assert.equal(a,b);checks++;};
eq(entries.length,13);
function add(p,s,t,outer='div',emph=false) {
  const page=w.document.createElement('article');page.dataset.pdfPage=String(p);page.dataset.sourceSha256=s;host.append(page);
  const container=w.document.createElement(outer),line=w.document.createElement('span');
  line.className='textbook-semantic-line';const span=w.document.createElement(emph?'strong':'span');
  if(emph)span.dataset.historySourceEmphasis='';
  span.textContent=t;line.append(span);container.append(line);page.append(container);return page;
}
const positives=[];
for(const e of entries){for(const p of e.pages)positives.push([add(p,SHA,e.term),e]);}
const marked=add(127,SHA,'UN 소총회','p',true);
const nonpage=add(133,SHA,'UN 소총회');
const wrongEdition=add(127,'b'.repeat(64),'UN 소총회');
const answerPage=add(139,SHA,'5·18 민주화 운동');
const compound=add(127,SHA,'앞UN 소총회뒤');
const control=add(127,SHA,'5·10 총선거','button');
const nested=add(127,SHA,'UN 소총회'), span=nested.querySelector('.textbook-semantic-line');
span.prepend(Object.assign(w.document.createElement('span'),{textContent:'복합'}));
const forbidden=add(127,SHA,'5·10 총선거');forbidden.querySelector('div').className='textbook-semantic-answer';
const fixture=host.innerHTML;
const handle=w.HanqHistory81Glossary.mount(host,'modern',SHA);
for(const [page,e] of positives){
  const triggers=page.querySelectorAll('.history81-term');
  eq(triggers.length,1);eq(triggers[0].dataset.termId,e.id);eq(triggers[0].textContent,e.term);
  triggers[0].dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));
  const tip=w.document.querySelector('[role=tooltip]');
  eq(tip.textContent,e.summary);eq(tip.hidden,false);
  w.document.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));
  eq(tip.hidden,true);
}
eq(marked.querySelectorAll('.history81-term').length,1);
const button=marked.querySelector('.history81-term'),tip=w.document.querySelector('[role=tooltip]');
button.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));eq(tip.hidden,false);
eq(tip.textContent,entries.find(e=>e.term==='UN 소총회').summary);
button.dispatchEvent(new w.MouseEvent('click',{bubbles:true}));eq(tip.hidden,true);

for(const p of [nonpage,wrongEdition,answerPage,compound,control,nested,forbidden])eq(p.querySelectorAll('.history81-term').length,0);
handle.stop();eq(host.innerHTML,fixture);eq(w.document.querySelector('[role=tooltip]'),null);
const wrong=w.HanqHistory81Glossary.mount(host,'modern','x'.repeat(64));eq(wrong.count,0);wrong.stop();
console.log(JSON.stringify({definitions:entries.length,newDefinitions:entries.length-1,eligiblePlacements:positives.length,checks,failures:0,scope:'synthetic DOM, term/page/edition, click keyboard and cleanup'}));
