'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const w=new JSDOM('<main></main>',{url:'https://fixture.invalid',runScripts:'outside-only'}).window,d=w.document,h=d.querySelector('main');
for(const f of ['glossary-data','history81-term-data','history81-terms','history81-glossary'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
const g=w.HanqHistory81Glossary,source=g.data().sources.prehistory;
function styles(){const out=[];const tw=d.createTreeWalker(h,4);let t;while((t=tw.nextNode())){const path=[];for(let e=t.parentElement;e&&e!==h;e=e.parentElement){if(e.matches('.history81-term,[data-history-glossary-run],[data-history-glossary-piece],[data-history-glossary-certified]')||(e.tagName==='SPAN'&&e.attributes.length===1&&e.hasAttribute('data-history-source-emphasis')))continue;const attrs=[...e.attributes].filter(a=>a.name!=='data-history-source-emphasis').map(a=>a.name+'='+a.value).sort();path.push(e.tagName+':'+attrs.join(';'));}for(const char of t.data)out.push([char,path.join('/')]);}return out;}
function check(html,n){h.innerHTML=html;const before=h.innerHTML,text=h.textContent,style=styles(),nodes=[...h.childNodes];const c=g.mount(h,'prehistory',source);assert.equal(c.count,n,html);assert.equal(h.textContent,text);assert.deepEqual(styles(),style);for(const term of h.querySelectorAll('.history81-term')){term.click();assert.ok(!d.querySelector('[role=tooltip]').hidden);}c.stop();c.stop();assert.equal(h.innerHTML,before);assert.deepEqual([...h.childNodes],nodes);assert.equal(d.querySelectorAll('[role=tooltip]').length,0);}
check('<p><strong data-history-source-emphasis style="color:red">유물: 고인돌, 뗀석기.</strong></p>',2);
check('<p><strong data-history-source-emphasis>다른 <u data-history-source-emphasis style="color:blue">고인돌</u> 무덤</strong></p>',1);
check('<p><strong data-history-source-emphasis>고인</strong><span data-history-source-emphasis style="color:red">돌</span></p>',1);
check('<p><strong data-history-source-emphasis>고인돌</strong> <strong data-history-source-emphasis>뗀석기</strong></p>',2);
check('<p><span>초</span><strong data-history-source-emphasis>고인돌</strong></p>',0);
check('<p><strong data-history-source-emphasis>고인돌</strong><em>무덤</em></p>',0);
check('<p><strong data-history-source-emphasis>고인돌은 고인돌무덤 신석기뗀석기 1고인돌 고인돌2</strong></p>',0);
check('<p><strong data-history-source-emphasis>소도시 영고탑</strong></p>',0);
check('<p><strong id="original" data-history-source-emphasis>고인돌</strong></p>',0);
check('<p><strong data-history-source-emphasis>고인돌 <button>뗀석기</button></strong></p>',0);
h.innerHTML='<strong data-history-source-emphasis>정책: 골품제도, 골품제, 골품.</strong>';let c=g.mount(h,'samguk',source);assert.equal(c.count,3);assert.deepEqual([...h.querySelectorAll('.history81-term')].map(x=>x.textContent),['골품제도','골품제','골품']);c.stop();
h.innerHTML='<strong data-history-source-emphasis>유물: 고인돌.</strong>';const before=h.innerHTML;c=g.mount(h,'prehistory','bad');assert.equal(c.count,0);assert.equal(h.innerHTML,before);c.stop();
const originalEntry=w.HANQ_GLOSSARY.find(e=>e.id==='goindol'),savedMatch=originalEntry.match;originalEntry.match=['고인돌(시험)','고인돌+','고인돌.','고인돌[1]'];h.innerHTML='<strong data-history-source-emphasis>고인돌(시험), 고인돌+, 고인돌., 고인돌[1]; 고인돌X시험 고인돌x1</strong>';c=g.mount(h,'prehistory',source);assert.equal(c.count,4);assert.deepEqual([...h.querySelectorAll('.history81-term')].map(t=>t.textContent),originalEntry.match);c.stop();originalEntry.match=savedMatch;
console.log('PASS boundary runs: style/text/node restoration, split spans, adjacent DOM, compounds, aliases, source guard');w.close();
