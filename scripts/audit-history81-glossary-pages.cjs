'use strict';
// Private inputs stay external; only counts and public glossary term IDs are printed.
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{JSDOM}=require('jsdom');
if(!process.argv[2])throw Error('Usage: node scripts/audit-history81-glossary-pages.cjs PRIVATE_PAGES_DIR');
const w=new JSDOM('<main></main>',{runScripts:'outside-only'}).window,d=w.document,h=d.querySelector('main');
for(const f of ['glossary-data','history81-term-data','history81-terms','history81-glossary','textbook-semantic'])w.eval(fs.readFileSync('media/'+f+'.js','utf8'));
const g=w.HanqHistory81Glossary,result={};
function sourceStyles(){const out=[],walker=d.createTreeWalker(h,4);let t;while((t=walker.nextNode())){const ancestors=[];for(let e=t.parentElement;e&&e!==h;e=e.parentElement){if(e.matches('.history81-term,[data-history-glossary-run],[data-history-glossary-piece],[data-history-glossary-certified]'))continue;ancestors.push(e.tagName+':'+[...e.attributes].filter(a=>a.name!=='data-history-source-emphasis').map(a=>a.name+'='+a.value).sort().join(';'));}for(const char of t.data)out.push([char,ancestors.join('/')]);}return out;}
for(const file of fs.readdirSync(process.argv[2])){if(!file.endsWith('.json'))continue;const page=JSON.parse(fs.readFileSync(path.join(process.argv[2],file),'utf8')),era=g.pageEra(page);if(!era)continue;
 const r=result[era]??={pages:0,triggers:0,ids:{}};r.pages++;const mount=g.mount;g.mount=()=>({stop(){}});let c=w.HanqTextbookSemantic.render(h,page);const text=h.textContent,style=sourceStyles();c.cleanup();g.mount=mount;c=w.HanqTextbookSemantic.render(h,page);assert.equal(h.textContent,text,'text '+page.pdfPage);assert.deepEqual(sourceStyles(),style,'style '+page.pdfPage);
 for(const t of h.querySelectorAll('.history81-term')){r.triggers++;r.ids[t.dataset.termId]=(r.ids[t.dataset.termId]||0)+1;t.click();assert.ok(d.querySelector('[role=tooltip]'));}c.cleanup();assert.equal(d.querySelectorAll('[role=tooltip]').length,0);}
console.log(JSON.stringify(result));w.close();
