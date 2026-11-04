'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),{JSDOM}=require('jsdom');
require('../media/goryeo-script-structure-data.js');require('../media/goryeo-script-presentation-data.js');require('../media/goryeo-script-structure.js');const reader=require('../media/goryeo-script-reader.js');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const [cp,mp,bp]=process.argv.slice(2),cb=fs.readFileSync(cp),raw=fs.readFileSync(mp),contract=JSON.parse(cb),bundle=JSON.parse(fs.readFileSync(bp));
 assert.equal(hash(cb),'378f0458b80c1043f44a5bfbaa0f8376c46604711ecd25e48f04621c3d38c4dc');assert.equal(hash(raw),contract.source.sha256);
 const dom=new JSDOM('<main></main>',{url:'https://synthetic.invalid/#chapter/goryeo/webtoon'}),doc=dom.window.document,host=doc.querySelector('main'),prepared=await reader.prepare(bundle),app=reader.mount(host,prepared);
 const md=s=>raw.subarray(s.byte_start,s.byte_end_exclusive).toString('utf8');let cells=0;
 const signature=e=>({text:e.textContent.replace(/\s/g,''),bold:[...e.querySelectorAll('strong')].map(x=>x.textContent),underline:[...e.querySelectorAll('u')].map(x=>x.textContent),colors:[...e.querySelectorAll('[data-source-color]')].map(x=>[x.dataset.sourceColor,x.textContent])});
 for(const t of contract.tables){const table=host.querySelector('table[data-structure="'+t.id+'"]');assert(table,t.id);
  for(const c of t.cells){const cell=table.querySelector('[data-source-owner="'+c.id+'"]');assert(cell,c.id);assert.equal(cell.rowSpan,c.rowspan);assert.equal(cell.colSpan,c.colspan);
   const expected=doc.createElement('div');reader.renderMarkdown(doc,expected,c.fragments.map(f=>md(f.source)).join('\n'),()=>{});if(c.original_note)reader.renderMarkdown(doc,expected,md(c.original_note.source),()=>{});
   const clone=cell.cloneNode(true);clone.querySelectorAll('figure').forEach(f=>f.remove());assert.deepEqual(signature(clone),signature(expected),c.id);
   for(const ref of (cell.getAttribute('headers')||'').split(' ').filter(Boolean))assert(doc.getElementById(ref),ref);cells++;
  }
 }
 for(const f of contract.figures){const fig=host.querySelector('[data-figure="'+f.filename+'"]');assert.equal(fig.parentElement.dataset.sourceOwner,f.owner);assert(fig.querySelector('figcaption').hidden);}
 for(const id of ['table17','exam-aristocratic']){const table=host.querySelector('table[data-structure="'+id+'"]');const children=table.querySelectorAll('th.gsr-nested-label');assert.equal(children.length,2);for(const child of children)assert(child.getAttribute('headers'));}
 assert.equal(host.querySelectorAll('table[data-structure]').length,11);assert.equal(host.querySelectorAll('figure').length,4);assert.equal(host.querySelectorAll('table[data-structure="exam-military"]').length,1);
 host.querySelector('[data-mode="practice"]').click();assert.equal(host.querySelectorAll('textarea').length,103);assert([...host.querySelectorAll('textarea')].every(e=>e.value===''));
 app.stop();dom.window.close();console.log(JSON.stringify({pass:true,stage2Cells:cells,newTables:7,newFigures:2,totalTables:11,inputs:103}));
})().catch(e=>{console.error(e);process.exitCode=1;});
