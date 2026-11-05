'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');

function setup(){
  const dom=new JSDOM('<main><p><strong data-history-source-emphasis="true">노비안검법</strong></p><p><strong data-history-source-emphasis="true">전시과</strong></p></main><button id="outside">다른 버튼</button>',{url:'https://synthetic.invalid',runScripts:'outside-only'});
  const w=dom.window,d=w.document;
  for(const name of ['history81-term-data','history81-terms'])w.eval(fs.readFileSync('media/'+name+'.js','utf8'));
  const host=d.querySelector('main'),original=host.innerHTML;
  const view=w.HanqHistory81Terms.mount(host,'goryeo',w.HanqHistory81TermData.sources.goryeo);
  assert.equal(view.count,2);
  const [first,second]=host.querySelectorAll('.history81-term'),tip=d.querySelector('[role="tooltip"]'),outside=d.getElementById('outside');
  function pointer(node,type,pointerType='mouse'){
    const event=new w.Event(type,{bubbles:true});Object.defineProperty(event,'pointerType',{value:pointerType});node.dispatchEvent(event);
  }
  function key(node,value,options={}){node.dispatchEvent(new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...options}));}
  return {dom,w,d,host,original,view,first,second,tip,outside,pointer,key};
}

async function main(){
  const f=setup(),{w,d,first,second,tip,outside,pointer,key}=f;
  // Touch pointerenter must not create a hover-only popup. Pointerdown+click
  // exercises the same event sequence without pretending jsdom is a real phone.
  pointer(first,'pointerenter','touch');assert(tip.hidden,'touch hover stays closed');
  pointer(first,'pointerdown','touch');first.click();assert(!tip.hidden,'touch-style activation opens');
  first.click();assert(tip.hidden,'second activation closes');
  outside.focus();

  pointer(first,'pointerenter');assert(!tip.hidden,'mouse hover opens');
  pointer(first,'pointerleave');await new Promise(resolve=>w.setTimeout(resolve,220));assert(tip.hidden,'mouse departure closes');
  first.focus();assert(!tip.hidden,'keyboard focus opens');
  key(first,'Enter');assert(!tip.hidden,'Enter pins the explanation');
  // A Tab navigation moves focus after keydown. Test the focus transition
  // directly because jsdom does not implement the browser's Tab default action.
  key(first,'Tab');outside.focus();await new Promise(resolve=>w.setTimeout(resolve,220));
  assert(tip.hidden,'pinned explanation closes when keyboard focus leaves its term');
  assert.equal(first.getAttribute('aria-expanded'),'false');
  assert.equal(first.getAttribute('aria-describedby'),null);

  first.focus();key(first,' ');assert(!tip.hidden,'Space pins the explanation');
  key(first,'Escape');assert(tip.hidden,'Escape closes');assert.equal(d.activeElement,first,'Escape preserves term focus');
  first.click();assert(!tip.hidden);pointer(outside,'pointerdown');assert(tip.hidden,'outside pointer closes');
  first.click();w.dispatchEvent(new w.Event('scroll'));assert(tip.hidden,'scroll closes');
  first.click();w.dispatchEvent(new w.Event('resize'));assert(tip.hidden,'resize closes');
  first.click();second.focus();assert.equal(first.getAttribute('aria-expanded'),'false');assert.equal(second.getAttribute('aria-expanded'),'true');
  assert.match(tip.textContent,/고려 토지 제도/,'new term replaces previous explanation');
  f.view.stop();f.view.stop();assert.equal(d.querySelector('[role="tooltip"]'),null);assert.equal(f.host.innerHTML,f.original,'stop restores original markup');
  f.dom.window.close();
  console.log('PASS history81 tooltip hover, touch-style events, Enter/Space/Escape, focus departure, outside pointer, scroll, resize, replacement and cleanup');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
