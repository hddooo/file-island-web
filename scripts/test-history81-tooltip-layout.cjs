'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const source=fs.readFileSync('media/history81-terms.js','utf8');
const css=fs.readFileSync('media/history81-terms.css','utf8');
const companyCss=fs.readFileSync('media/company-mode.css','utf8').replace(/^@import[^;]+;/,'');
const historyCss=fs.readFileSync('media/history-typography.css','utf8');
let checks=0;
const equal=(a,b,m)=>{assert.equal(a,b,m);checks++;};
const ok=(v,m)=>{assert(v,m);checks++;};
function fixture({width=390,height=844,offsetLeft=0,offsetTop=0,fontSize=14,company=false}={}){
  const dom=new JSDOM('<html><head></head><body><main><p><strong data-history-source-emphasis="true">검사용어</strong></p></main><button id="outside">바깥</button></body></html>',{url:'https://synthetic.invalid',runScripts:'outside-only'});
  const w=dom.window,d=w.document,host=d.querySelector('main');
  if(company)d.documentElement.dataset.companyMode='on';
  const style=d.createElement('style');style.textContent=historyCss+'\n'+companyCss+'\n'+css;d.head.append(style);
  const viewport=new w.EventTarget();Object.assign(viewport,{width,height,offsetLeft,offsetTop});
  Object.defineProperty(w,'visualViewport',{value:viewport});
  // Synthetic text and geometry only: this is not rendered-device QA.
  w.HanqHistory81TermData={sources:{goryeo:'test-source'},entries:[{era:'goryeo',phrase:'검사용어',id:'fixture',summary:'긴 설명의 줄바꿈과 작은 화면의 범위 제한을 검증하는 합성 문장입니다. '.repeat(3)}]};
  w.eval(source);const view=w.HanqHistory81Terms.mount(host,'goryeo','test-source');
  equal(view.count,1,'synthetic term mounted');
  const trigger=host.querySelector('.history81-term'),tip=d.querySelector('[role="tooltip"]');
  trigger.style.fontSize=fontSize+'px';
  let anchor={left:offsetLeft+width-40,top:offsetTop+height-38,bottom:offsetTop+height-20};
  trigger.getBoundingClientRect=()=>({...anchor});
  tip.getBoundingClientRect=()=>({width:Math.min(280,parseFloat(tip.style.maxWidth)),height:Math.min(230,parseFloat(tip.style.maxHeight))});
  const open=()=>trigger.dispatchEvent(new w.Event('pointerenter'));
  return {dom,w,d,view,trigger,tip,viewport,open,setAnchor:r=>{anchor=r;}};
}
for(const [width,height,offsetLeft,offsetTop] of [[320,640,0,0],[390,844,0,0],[1440,900,0,0],[640,160,0,0],[160,180,70,80]]){
  for(const fontSize of [12,14,15,20]){
    const f=fixture({width,height,offsetLeft,offsetTop,fontSize});f.open();
    equal(f.tip.style.getPropertyValue('--history81-tooltip-font-size'),fontSize-2+'px','exactly 2px below surrounding type');
    equal(f.tip.style.maxWidth,Math.min(280,width-24)+'px','bounded rectangle width');
    equal(f.tip.style.maxHeight,height-24+'px','visual viewport bounds height');
    const r=f.tip.getBoundingClientRect(),left=parseFloat(f.tip.style.left),top=parseFloat(f.tip.style.top);
    ok(left>=offsetLeft+12&&left+r.width<=offsetLeft+width-12,'right edge remains inside viewport');
    ok(top>=offsetTop+12&&top+r.height<=offsetTop+height-12,'bottom edge remains inside viewport');
    f.setAnchor({left:offsetLeft-20,top:offsetTop-5,bottom:offsetTop+10});f.open();
    equal(parseFloat(f.tip.style.left),offsetLeft+12,'left overflow clamped');
    ok(parseFloat(f.tip.style.top)>=offsetTop+12,'top overflow clamped');
    equal(f.trigger.getAttribute('aria-describedby'),f.tip.id,'screen readers receive complete explanation');
    f.tip.dispatchEvent(new f.w.Event('scroll',{bubbles:true}));ok(!f.tip.hidden,'tooltip content can scroll without dismissing itself');
    f.w.dispatchEvent(new f.w.Event('scroll'));ok(f.tip.hidden,'page scroll still dismisses');
    f.open();f.viewport.dispatchEvent(new f.w.Event('resize'));ok(f.tip.hidden,'pinch/viewport resize dismisses stale position');
    f.view.stop();f.dom.window.close();
  }
}
const f=fixture({fontSize:13,company:true});f.open();equal(f.tip.style.getPropertyValue('--history81-tooltip-font-size'),'11px','company 13px text uses 11px explanation');
const rules=[...f.d.querySelector('style').sheet.cssRules],base=rules.find(r=>r.selectorText==='html body div.history81-term-tooltip'),company=rules.find(r=>r.selectorText==='html[data-company-mode=on] :is(#app#app#app,body) div.history81-term-tooltip');
for(const [property,value] of [['white-space','normal'],['word-break','normal'],['overflow-wrap','anywhere'],['overflow-y','auto'],['border-radius','4px']])equal(base.style.getPropertyValue(property),value,'compact wrapping rectangle: '+property);
ok(company&&f.tip.matches(company.selectorText),'company-only override targets tooltip');
equal(company.style.getPropertyValue('font-size'),'var(--history81-tooltip-font-size,12px)','specific history-only size override');
equal(company.style.getPropertyPriority('font-size'),'important','wins existing company font shorthand');
const shared=f.d.createElement('div');shared.setAttribute('role','tooltip');f.d.body.append(shared);ok(!shared.matches(company.selectorText),'other tooltip sizes remain unchanged');
const palette=rules.find(r=>r.selectorText==='html[data-company-mode=on] :is(#app#app#app,body) :is([role=tooltip],.history81-term-tooltip)');
ok(palette.style.getPropertyValue('font').includes('var(--company-font)'), 'existing company code font remains');
equal(palette.style.getPropertyValue('background'),'rgb(209, 213, 219)','existing company tooltip background preserved');
equal(palette.style.getPropertyValue('color'),'rgb(17, 24, 39)','existing company tooltip ink preserved');
f.d.documentElement.removeAttribute('data-company-mode');f.d.documentElement.setAttribute('data-history-typography','');
ok(rules.some(r=>r.style?.getPropertyValue('font-family')==='var(--history-font)'&&f.tip.matches(r.selectorText)),'normal history serif remains scoped to this tooltip');
ok(!css.includes('user-scalable')&&!css.includes('touch-action:none'),'zoom remains available');
function luminance(hex){const rgb=hex.match(/[\da-f]{2}/gi).map(c=>parseInt(c,16)/255).map(c=>c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4));return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;}
function contrast(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
for(const [foreground,background] of [['182f24','f7f5ed'],['111827','d1d5db']])ok(contrast(foreground,background)>=4.5,'small text passes WCAG AA contrast');
// The popup keeps focus on its source while scrolling only clipped descriptions.
f.trigger.focus();
Object.defineProperty(f.tip,'clientHeight',{value:100,configurable:true});
Object.defineProperty(f.tip,'scrollHeight',{value:260,configurable:true});
const press=(key,options={})=>{const e=new f.w.KeyboardEvent('keydown',{key,bubbles:true,cancelable:true,...options});f.trigger.dispatchEvent(e);return e;};
for(const [key,position] of [['ArrowDown',32],['PageDown',112],['End',160],['ArrowUp',128],['PageUp',48],['Home',0]]){ok(press(key).defaultPrevented,'only popup scroll consumes '+key);equal(f.tip.scrollTop,position,'clipped explanation keyboard '+key);equal(f.d.activeElement,f.trigger,'source focus remains');}
ok(!press('ArrowDown',{ctrlKey:true}).defaultPrevented,'modified navigation untouched');
Object.defineProperty(f.tip,'scrollHeight',{value:100});ok(!press('ArrowDown').defaultPrevented,'ordinary arrow behavior when content fits');
press('Escape');ok(f.tip.hidden,'Escape still closes after keyboard scrolling');
f.view.stop();f.dom.window.close();
console.log(JSON.stringify({checks,failures:0,scope:'tooltip size, constrained wrapping, synthetic visual-viewport geometry, scroll, accessible description, company mode and contrast; not actual device rendering'}));
