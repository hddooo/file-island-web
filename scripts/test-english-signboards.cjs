'use strict';
// Synthetic DOM/CSS regression, not real mobile/WebKit rendering.
// NODE_PATH may point to a separate test-tools/node_modules installation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),csstree=require('css-tree');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const css=read('media/island-harbors.css')+'\n'+read('media/english-island.css');
const errors=[];csstree.parse(css,{onParseError:e=>errors.push(e.message)});assert.deepEqual(errors,[]);
const labels={notebook:'Vocabulary',wrongnotes:'Practice',grammar:'Grammar',player:'Listening'};
const dom=new JSDOM('<!doctype html><html><head><style>'+css+'</style></head><body><main id="app"></main></body></html>',{url:'https://synthetic.invalid/#toeic',runScripts:'outside-only',pretendToBeVisual:true});
const w=dom.window,d=w.document,app=d.getElementById('app');let tall=false;const changes=new Set();
w.matchMedia=q=>({get matches(){return tall},media:q,addEventListener(_,f){changes.add(f)},removeEventListener(_,f){changes.delete(f)}});
w.eval(read('media/english-island.js'));w.eval(read('media/island-harbors.js'));
function fixture(){const map=d.createElement('nav');map.className='subject-travel-map toeic-travel-map';map.innerHTML=Object.entries(labels).map(([id,label])=>'<button type="button" data-toeic-view="'+id+'" title="Old tooltip"><strong>'+label+'</strong><span class="world-place-name">한글 장소 설명</span></button>').join('');app.appendChild(map);return map;}
(async()=>{
let count=0;
for(const [width,height,portrait] of [[320,480,true],[390,650,true],[700,900,true],[900,240,false],[1440,700,false]]){
 tall=portrait;const map=fixture();Object.defineProperties(map,{clientWidth:{value:width},clientHeight:{value:height}});const controls=[...map.querySelectorAll('button')],routes=[];controls.forEach(c=>c.addEventListener('click',()=>routes.push(c.dataset.toeicView)));w.HanqIslandHarbors.enhance(map);
 assert.equal(map.querySelectorAll('.english-landmark').length,4);
 for(const c of controls){const id=c.dataset.toeicView,sign=c.querySelector('.harbor-sign'),style=w.getComputedStyle(sign);
 assert.equal(sign.textContent,labels[id]);assert.equal(sign.children.length,1);assert.equal(c.getAttribute('aria-label'),labels[id]);assert.equal(c.getAttribute('title'),null);assert.equal(c.getAttribute('aria-describedby'),null);assert.equal(sign.querySelectorAll('.world-place-name,.english-place').length,0);assert.equal(d.getElementById(c.getAttribute('aria-labelledby')).textContent,labels[id]);
 assert.notEqual(style.width,'1px');assert.notEqual(style.height,'1px');assert.notEqual(style.clipPath,'inset(50%)');assert.notEqual(style.visibility,'hidden');assert.notEqual(style.display,'none');assert.notEqual(style.opacity,'0');assert.equal(sign.hidden,false);assert.equal(c.disabled,false);assert.equal(c.tabIndex,0);
 c.focus();assert.equal(d.activeElement,c);c.click();c.click();assert.equal(routes.filter(x=>x===id).length,2);
 for(const dim of ['width','height'])assert(parseFloat(c.style[dim])>=44);assert(parseFloat(c.style.left)>=4&&parseFloat(c.style.top)>=4);assert(parseFloat(c.style.left)+parseFloat(c.style.width)<=width-3.99);assert(parseFloat(c.style.top)+parseFloat(c.style.height)<=height-3.99);count++;
 }
 const before=map.innerHTML;w.HanqIslandHarbors.enhance(map);assert.equal(map.innerHTML,before);assert.equal(map.querySelectorAll('button').length,4);map.remove();await new Promise(r=>setImmediate(r));assert.equal(changes.size,0);
}
assert(!read('media/english-island.js').includes('hint.textContent=place.place'));
console.log('PASS '+count+' English sign/control cases across five viewport geometries; English-only text, visible styles, native focus/routes, re-entry/cleanup. Synthetic DOM/CSS only.');dom.window.close();
})().catch(e=>{console.error(e.stack);dom.window.close();process.exitCode=1;});
