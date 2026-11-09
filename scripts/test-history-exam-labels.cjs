'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const dir=process.argv[2],w=new JSDOM('<main></main>',{runScripts:'outside-only'}).window,h=w.document.querySelector('main');for(const f of ['glossary-data','history81-term-data','history81-terms','history81-verified-glossary','history81-glossary','textbook-semantic'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
let pages=0,frequency=0;const expected={19:'고구려',22:'백제',25:'신라',26:'가야'};
for(const file of fs.readdirSync(dir).filter(f=>f.endsWith('.json'))){const p=JSON.parse(fs.readFileSync(path.join(dir,file))),g=w.HanqHistory81Glossary;if(!g.pageEra(p))continue;
 const mount=g.mount;g.mount=()=>({stop(){}});let c=w.HanqTextbookSemantic.render(h,p);const original=h.innerHTML;c.cleanup();g.mount=(...a)=>(w.terms=mount(...a));c=w.HanqTextbookSemantic.render(h,p);
 const labels=h.querySelectorAll('[data-exam-kingdom]');assert.equal(labels.length,expected[p.pdfPage]?1:0);if(labels.length)assert.equal(labels[0].textContent,expected[p.pdfPage]+' · ');
 if(p.pdfPage===22){assert(!h.textContent.includes('+ 무덤에서'));assert(h.querySelector('[data-term-id="verified-samguk-muryeong-brick-tomb"]'));assert(!h.textContent.includes('※ 백제가 평양성을 공격했다'));const t=h.querySelector('[data-term-id="verified-samguk-geunchogo-pyeongyang"]');assert(t);t.click();assert(w.document.querySelector('[role=tooltip]').textContent.includes('371'));}
 frequency+=h.querySelectorAll('.history81-frequency').length;
 if(p.pdfPage===19)for(const id of ['살수대첩','안시성전투']){const t=h.querySelector('[data-term-id="verified-samguk-'+id+'"]');assert(t,id);t.click();assert(w.document.querySelector('[role=tooltip]').textContent.includes(id==='살수대첩'?'612':'645'));}
 w.terms.stop();assert.equal(h.innerHTML,original,'restored '+p.pdfPage);c.cleanup();pages++;
}
h.innerHTML='<p><strong>본문 ★</strong><em>60</em>% 문장 60%</p><p>별도 ★</p><p>40%</p>';const before=h.innerHTML,undo=w.HanqHistory81Terms.softenFrequency(h);assert.equal([...h.querySelectorAll('.history81-frequency')].map(e=>e.textContent).join(''),'★60%');assert.equal(h.textContent,'본문 ★60% 문장 60%별도 ★40%');undo();assert.equal(h.innerHTML,before);console.log(JSON.stringify({pages,frequency,kingdomHeadings:4,textAndNodesRestored:true}));
