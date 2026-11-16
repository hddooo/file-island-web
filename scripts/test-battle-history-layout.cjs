'use strict';
// Synthetic layout contracts only: no private source, live battle, or geometry claim.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom'),csstree=require('css-tree'),root=path.resolve(__dirname,'..');
const css=fs.readFileSync(path.join(root,'media/battle-island.css'),'utf8');
const marker='/* The active history source uses the battle viewport';
const tail=css.slice(css.indexOf(marker));assert(css.includes(marker));
const prefix='html body .battle-island.bi-in-match .bi-history-question:not(.bi-fullscreen-panel)';
const ast=csstree.parse(tail),rules=[];
csstree.walk(ast,{visit:'Rule',enter(n){const selectors=[],values={};n.prelude.children.forEach(s=>selectors.push(csstree.generate(s)));n.block.children.forEach(d=>{if(d.type==='Declaration')values[d.property]=csstree.generate(d.value);});rules.push({selectors,values});}});
const rule=s=>{const r=rules.find(r=>r.selectors.includes(s));assert(r,'missing scoped rule '+s);return r.values;};
test('active history panel fills its own footer-free viewport, without guessing a footer height',()=>{
 const r=rule(prefix);assert.equal(r.left,'0');assert.equal(r.right,'0');assert.equal(r.bottom,'0');assert.equal(r['min-height'],'0');assert.equal(r['box-sizing'],'border-box');assert(!('top' in r),'keep existing HUD/short-window top offset');assert(!/study-footer-height|position:fixed|inset:/.test(tail));
 assert.match(css,/body:has\(\.battle-island\.bi-in-match\) \.world-global-nav\{display:none!important\}/);
 assert.match(css,/padding:max\(8px,env\(safe-area-inset-top\)\)/,'viewport owner already handles safe areas');
});
test('one fully shrinkable reading track uses all width and original image proportions',()=>{
 const round=rule(prefix+'>.bi-history-round'),content=rule(prefix+'>.bi-history-round>.bi-question-content:not([hidden])'),materials=rule(prefix+' .bi-history-materials'),image=rule(prefix+' .bi-history-materials>.bi-question-image');
 assert.equal(round.flex,'1 1 0%');assert.equal(round['min-height'],'0');assert.equal(content['min-height'],'0');assert.equal(content['grid-template-rows'],'minmax(0,1fr) auto');assert.equal(materials.width,'100%');assert.equal(materials['max-width'],'none');assert.equal(materials.overflow,'auto');assert.equal(materials['min-width'],'0');assert.equal(image.width,'100%');assert.equal(image.height,'auto');assert.equal(image['max-height'],'none');assert.equal(image['object-fit'],'contain');
 const answers=rule(prefix+' .bi-item'),actions=rule(prefix+'>.bi-actions');assert.equal(answers['align-self'],'end');assert.equal(actions.flex,'0 0 auto');assert.equal(actions.position,'relative');
});
test('every new selector applies equally in company/default mode but never fullscreen, review, or English',()=>{
 const d=new JSDOM('<main id="app"><section class="battle-island bi-in-match"><section class="bi-history-question" id="history"><div class="bi-history-round"><div class="bi-question-content"><section class="bi-history-materials"><img class="bi-question-image"></section><fieldset class="bi-item"></fieldset></div></div><div class="bi-actions"></div></section><section class="bi-question" id="english"><div class="bi-round"><div class="bi-question-content"><img class="bi-question-image"><fieldset class="bi-item"></fieldset></div></div><div class="bi-actions"></div></section><section class="bi-question bi-review-round" id="review"></section></section></main>'),q=d.window.document;
 for(const mode of ['off','on']){q.documentElement.dataset.companyMode=mode;for(const r of rules)for(const s of r.selectors){assert(s.startsWith(prefix));assert.equal(q.querySelectorAll(s).length,1);assert(!q.querySelector('#english').matches(s));assert(!q.querySelector('#review').matches(s));}q.querySelector('#history').classList.add('bi-fullscreen-panel');for(const r of rules)for(const s of r.selectors)assert.equal(q.querySelectorAll(s).length,0);q.querySelector('#history').classList.remove('bi-fullscreen-panel');}
 q.querySelector('.battle-island').classList.remove('bi-in-match');for(const r of rules)for(const s of r.selectors)assert.equal(q.querySelectorAll(s).length,0);d.window.close();
});
test('history DOM remains a focusable original-image region, native fieldset and sibling actions',()=>{
 const js=fs.readFileSync(path.join(root,'media/battle-island.js'),'utf8');assert.match(js,/historyMaterials\.tabIndex=0/);assert.match(js,/historyMaterials\.setAttribute\('role','region'\)/);assert.match(js,/historyMaterials\.setAttribute\('aria-label','원본 문제 이미지 · 스크롤하여 읽기'\)/);assert.match(js,/field=el\('fieldset',null,content,'bi-item'\)/);assert.match(js,/submit=btn\('제출'/);assert.match(js,/q\.part===0\?' bi-history-round':''/);assert.match(css,/\.bi-history-round \.bi-choice\{[^}]*min-width:44px;min-height:44px/);
});
