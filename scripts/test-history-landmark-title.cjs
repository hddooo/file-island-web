'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require(process.env.HANQ_JSDOM||'../.test-tools/node_modules/jsdom');
const source=fs.readFileSync(path.join(__dirname,'../media/island-harbors.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../media/island-harbors.css'),'utf8');
const ids=['homePastExams','homeFormalExams','homeWrongNotes'],names=['성균관','과장','홍문관'],purposes=['시대별 학습','모의고사','오답노트'];
let cases=0;
for(const mobile of [false,true])for(const variant of ['strong','native','missing']){
 const labels=ids.map((id,i)=>variant==='missing'?'':variant==='strong'?'<strong>Feature '+i+'</strong>':'<span class="wn-entry-t">Feature '+i+'</span>');
 const dom=new JSDOM('<body><main id="app"><nav class="subject-travel-map history-travel-map">'+ids.map((id,i)=>'<button id="'+id+'" title="old title">'+labels[i]+'<small class="world-place-name">Place '+i+'</small></button>').join('')+'</nav></main></body>',{url:'https://fixture.test/',runScripts:'outside-only'}),w=dom.window,d=w.document;
 w.matchMedia=()=>({matches:mobile});w.requestAnimationFrame=()=>1;w.cancelAnimationFrame=()=>{};
 w.IntersectionObserver=class{observe(){}disconnect(){}};w.ResizeObserver=class{observe(){}disconnect(){}};
 let clicks=0;const originals=ids.map(id=>d.getElementById(id));originals.forEach(el=>el.addEventListener('click',()=>clicks++));
 const map=d.querySelector('nav');Object.defineProperties(map,{clientWidth:{value:mobile?368:1100},clientHeight:{value:mobile?500:600}});
 w.eval(source);w.HanqIslandHarbors.enhance(map);w.HanqIslandHarbors.enhance(map);
 assert.equal(map.querySelectorAll('.history-landmark').length,3);
 originals.forEach((el,i)=>{
  assert.equal(d.getElementById(ids[i]),el);assert.equal(el.getAttribute('title'),null);
  assert.equal(el.getAttribute('aria-label'),names[i]+' · '+purposes[i]);
  assert.equal(el.querySelector('.harbor-sign strong,.harbor-sign .wn-entry-t').textContent,names[i]);
  assert.equal(el.querySelectorAll('.harbor-sign').length,1);
  assert.equal(el.getAttribute('aria-describedby'),'harbor-history-'+ids[i]+'-place');
  assert.equal(el.querySelector('.world-place-name').textContent,purposes[i]);
  assert(parseFloat(el.style.width)>=44);assert(parseFloat(el.style.height)>=44);
  el.click();el.dispatchEvent(new w.Event('pointerdown'));assert(el.classList.contains('harbor-selected'));
 });
 assert.equal(clicks,3);assert.equal(map.querySelectorAll('.harbor-chart').length,1);
 map.dispatchEvent(new w.Event('pointerleave'));assert.equal(map.querySelectorAll('.harbor-selected').length,0);
 dom.window.close();cases++;
}
assert(css.includes('.history-landmark .harbor-sign>.wn-entry-t{'), 'Native labels use the same plaque typography as strong labels');
assert(css.includes('.harbor-sign .world-place-name){display:none!important}'), 'No second visible subtitle on plaques');
console.log(JSON.stringify({passed:true,cases,landmarks:3,visibleHistoricalNames:names,noNativeTitles:true,accessiblePurposes:true,originalControlsAndClickHandlersPreserved:true,idempotentMount:true}));
