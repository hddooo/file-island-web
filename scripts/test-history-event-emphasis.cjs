'use strict';
// Synthetic continuations only. No textbook excerpts or source coordinates.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const w=new JSDOM('<main/>',{url:'https://synthetic.invalid',runScripts:'outside-only'}).window,d=w.document,h=d.querySelector('main');
for(const file of ['history81-term-data','history81-terms'])w.eval(fs.readFileSync('media/'+file+'.js','utf8'));
const data=w.HanqHistory81TermData;let checks=0;
const sampo='삼포왜란 → 합성 연결(합성 메모)',yangjae='양재역 벽서 사건(합성 메모)';
function nodes(root){const all=[],walk=d.createTreeWalker(root,0xFFFFFFFF);let n;while((n=walk.nextNode()))all.push(n);return all;}
function check(html,count,era='joseon',source=data.sources[era]){
 h.innerHTML=html;const before=h.innerHTML,text=h.textContent,original=nodes(h),view=w.HanqHistory81Terms.mount(h,era,source);
 const marks=[...h.querySelectorAll('[data-history-requested-emphasis="event-line"]')];assert.equal(marks.length,count,html);assert.equal(h.textContent,text);
 for(const mark of marks){assert.equal(mark.tagName,'STRONG');assert.equal(mark.textContent,mark.parentElement.textContent);const trigger=mark.querySelector('.history81-term');assert(trigger);trigger.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));const tip=d.querySelector('[role=tooltip]');assert(!tip.hidden);assert.equal(tip.textContent,data.entries.find(e=>e.id===trigger.dataset.termId).summary);d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(tip.hidden);}
 view.stop();view.stop();assert.equal(h.innerHTML,before);assert.deepEqual(nodes(h),original);assert.equal(d.querySelectorAll('[role=tooltip]').length,0);checks++;
}
for(const line of [sampo,yangjae]){
 check('<ul><li>'+line+'</li><li>별개 항목</li></ul>',1);check('<p>'+line+'</p>',1);
 check('<p>'+line.replace('합성 메모','<i>합성 메모</i>')+'</p>',1);
 check('<p>'+line.replace('합성 메모','<span style="color:blue">합성 메모</span>')+'</p>',1);
 check('<p>다른 내용 '+line+'</p>',0);check('<p>'+line+' 추가 내용</p>',0);check('<p>신'+line+'</p>',0);
 check('<p>'+line.replace('합성 메모','<button>합성 메모</button>')+'</p>',0);
 check('<p contenteditable="true">'+line+'</p>',0);check('<p>'+line+'</p>',0,'goryeo');check('<p>'+line+'</p>',0,'joseon','wrong');
 check('<p>'+line.replace('(합성 메모)','(합성 메모')+'</p>',0);
 check('<ul><li>'+line+'<ul><li>별개 항목</li></ul></li></ul>',0);
}
check('<table><tr><th>중종</th><td><ul><li>'+sampo+'</li></ul></td></tr><tr><th>명종</th><td><p>'+yangjae+'</p></td></tr></table>',2);
check('<table><tr><th>다른 왕</th><td><p>'+sampo+'</p></td></tr></table>',0);
check('<p><strong data-history-source-emphasis>삼포왜란</strong> → 합성 연결(합성 메모)</p>',1);
check('<p>삼포왜란 → 합성 연결(합성 메모)<br>별개 줄</p>',0);
check('<p>삼포왜란론 → 합성 연결(합성 메모)</p>',0);
check('<p>양재역 벽서 사건론(합성 메모)</p>',0);
console.log('PASS '+checks+' synthetic event-line cases: full emphasis, preserved text/ink/tooltips, boundary guards and exact node restoration');w.close();
