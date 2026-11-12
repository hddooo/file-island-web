'use strict';
const fs=require('fs'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
const w=new JSDOM('<main></main>',{runScripts:'outside-only'}).window,h=w.document.querySelector('main');
for(const f of ['glossary-data','history81-term-data','history81-terms','history81-verified-glossary','history81-glossary'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
const rows={89:['병인박해','병인양요','신미양요'],91:['조계','거중조정','조미수호통상조약'],96:['아관파천'],99:['을사늑약','정미7조약','신민회','보안회','대한자강회','황국중앙총상회']};let checks=0;
for(const [page,terms] of Object.entries(rows))for(const term of terms){h.innerHTML=`<article data-page="${page}"><p>${term}</p></article>`;const before=h.innerHTML,original=h.querySelector('p').firstChild;let c=w.HanqHistory81Glossary.mount(h,'opening',w.HanqHistory81VerifiedGlossary.sourceOpening);assert.equal(c.count,1,term);c.stop();assert.equal(h.innerHTML,before);assert.equal(h.querySelector('p').firstChild,original);checks++;}
for(const html of ['<article data-page="91"><p>조계종 신조계</p></article>','<article data-page="89"><p>조계</p></article>','<article data-page="91"><button>조계</button><a>조계</a><textarea>조계</textarea></article>']){h.innerHTML=html;const c=w.HanqHistory81Glossary.mount(h,'opening',w.HanqHistory81VerifiedGlossary.sourceOpening);assert.equal(c.count,0);c.stop();assert.equal(h.innerHTML,html);checks++;}
console.log({checks,plainOriginalNodeRestored:true,sourceDataWrites:0});w.close();
