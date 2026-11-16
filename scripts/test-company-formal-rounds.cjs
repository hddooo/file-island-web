'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),csstree=require('css-tree');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(path.join(root,'media/display-mode.js'),'utf8');
const css=fs.readFileSync(path.join(root,'media/company-mode.css'),'utf8')+(process.env.COMPANY_ROUND_CSS?'\n'+fs.readFileSync(process.env.COMPANY_ROUND_CSS,'utf8'):'');
const flush=()=>new Promise(r=>setTimeout(r,15));
function card(round,disabled=false){return '<section class="fe-round fe-round-menu fe-round-compact"><button class="fe-round-hit" type="button" id="feRound'+round+'" data-round="'+round+'" data-available="'+(disabled?'0':'1')+'" aria-label="제'+round+'회 시험 바로 시작"'+(disabled?' disabled':'')+'></button><h3 id="feRoundTitle'+round+'">제'+round+'회<span class="fe-pass-rate">난이도 : 하 (합격률 : 66.15%)</span></h3><div class="fe-recent-scores"><button class="fe-score" data-run="synthetic-run">80점</button><span class="fe-score fe-score-empty">—</span><span class="fe-score fe-score-empty">—</span></div><div class="fe-round-material-actions"><button data-material-round="'+round+'" data-material-action="review">오답 &amp; 별표 다시풀기</button><button data-material-round="'+round+'" data-material-action="questions">문제 PDF</button><button data-material-round="'+round+'" data-material-action="answers">해설지 PDF</button></div></section>';}
function fixture(){const d=new JSDOM('<!doctype html><main id="app"><div class="device-content"><div id="formalExamHost"><section class="formal-exams"><div class="fe-rounds">'+card(73)+card(72,true)+'<section class="fe-round"><button data-round="71">원래 회차 버튼</button></section></div></section></div></div></main>',{url:'https://fixture.test/#formal-exams',runScripts:'outside-only'});d.window.eval(code);return d;}
test('compact overlays stay empty and native, filenames flow inside headings; repeated mode restores exact markup',async()=>{
 const d=fixture(),w=d.window,doc=w.document,list=doc.querySelector('.fe-rounds'),original=list.innerHTML,buttons=[...list.querySelectorAll('button')];let clicks=[];buttons.forEach((b,i)=>b.onclick=()=>clicks.push(i));
 for(let pass=0;pass<3;pass++){
  w.HanqDisplayMode.select('company');await flush();
  assert.match(list.dataset.companyNativeDirectory,/3 files/);
  for(const round of [73,72]){const hit=doc.getElementById('feRound'+round),heading=doc.getElementById('feRoundTitle'+round);assert.equal(hit.children.length,0);assert(!hit.hasAttribute('data-company-native-row'));assert.equal(hit.dataset.round,String(round));assert.equal(hit.getAttribute('aria-label'),'제'+round+'회 시험 바로 시작');assert.equal(hit.disabled,round===72);assert(!heading.hasAttribute('data-company-native-row'));assert.equal(heading.querySelector('.company-native-file').textContent,'round-'+round+'.json');assert.equal(heading.querySelector('.company-native-file').getAttribute('aria-hidden'),'true');assert.equal(heading.querySelectorAll('[data-company-added]').length,1);}
  assert.equal(list.querySelector('.fe-round:not(.fe-round-compact) [data-company-added]').textContent,'round-71.json');
  assert.deepEqual([...list.querySelectorAll('button')],buttons);buttons.filter(b=>!b.disabled).forEach(b=>b.click());
  w.HanqDisplayMode.refresh();await flush();assert.equal(list.querySelectorAll('.fe-round-hit [data-company-added]').length,0);assert.equal(list.querySelectorAll('h3 [data-company-added]').length,2);
  w.HanqDisplayMode.select('default');await flush();assert.equal(list.innerHTML,original);
 }
 assert.equal(clicks.length,3*buttons.filter(b=>!b.disabled).length);d.window.close();
});
test('refresh cleans a legacy overlay decoration, preserves async replacement state and observer idles',async()=>{
 const d=fixture(),w=d.window,doc=w.document,list=doc.querySelector('.fe-rounds');w.HanqDisplayMode.select('company');await flush();
 list.innerHTML=card(75,true);const hit=list.querySelector('.fe-round-hit');hit.setAttribute('data-company-native-row','');hit.innerHTML='<span data-company-added class="company-native-file">wrong-overlay.json</span>';await flush();
 assert.equal(hit.children.length,0);assert(!hit.hasAttribute('data-company-native-row'));assert(hit.disabled);assert.equal(list.querySelector('h3 .company-native-file').textContent,'round-75.json');
 let records=0;const observer=new w.MutationObserver(r=>records+=r.length);observer.observe(list,{subtree:true,childList:true,attributes:true});w.HanqDisplayMode.refresh();await flush();const done=records;await flush();assert.equal(records,done);assert.equal(list.querySelectorAll('h3 [data-company-added]').length,1);observer.disconnect();d.window.close();
});
test('company CSS explicitly protects transparent overlay and compact in-flow caption from palette rules',()=>{
 const ast=csstree.parse(css),rules=[];csstree.walk(ast,{visit:'Rule',enter(node){if(node.prelude&&node.block){const selectors=[];node.prelude.children.forEach(s=>selectors.push(csstree.generate(s))); const declarations={};node.block.children.forEach(d=>{if(d.type==='Declaration')declarations[d.property]={value:csstree.generate(d.value),important:d.important};});rules.push({selectors,declarations});}}});
 const prefix='html[data-company-mode=on] #app#app#app #formalExamHost .fe-round-compact';
 const find=s=>rules.find(r=>r.selectors.includes(s));
 const overlay=find(prefix+'>.fe-round-hit');assert(overlay,'missing scoped overlay rule');for(const [property,value] of [['background','transparent'],['padding','0'],['margin','0'],['border','0'],['min-height','0']])assert.deepEqual(overlay.declarations[property],{value,important:true});
 assert(rules.some(r=>r.selectors.some(s=>s.includes('.fe-round-hit:is(:hover,:focus-visible,:disabled)'))));
 const title=find(prefix+'>h3');assert(title);assert.equal(title.declarations.margin.value,'0');assert.equal(title.declarations['pointer-events'].value,'none');
 const label=find(prefix+'>h3>.company-native-file');assert(label);assert.equal(label.declarations.width.value,'auto');assert.equal(label.declarations.display.value,'inline');
 const rate=find(prefix+' .fe-pass-rate');assert(rate);assert.equal(rate.declarations.display.value,'block');assert.equal(rate.declarations.margin.value,'2px 0 0');
});
