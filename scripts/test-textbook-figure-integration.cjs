'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('../.test-tools/node_modules/jsdom');
const reader=require('../media/textbook-semantic'),groups=require('../media/textbook-figure-groups');
(async()=>{
const data=JSON.parse(fs.readFileSync(process.argv[2]||'../hanq-semantic-preview/pages/page-009.json','utf8'));
const dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main');let made=0;const revoked=[],requested=[];
dom.window.URL.createObjectURL=()=>`blob:fixture-${++made}`;dom.window.URL.revokeObjectURL=u=>revoked.push(u);
const c=reader.render(host,data,{figureGroups:groups,isFigureAvailable:f=>f.assetId!=='p009-figure-5',resolveFigure:async f=>{requested.push(f.assetId);return new Blob(['synthetic'],{type:'image/jpeg'});}});await c.ready;
assert.equal(host.querySelector('[data-source-cell="p009-table-1-r1-c1"] .textbook-figure-group')!==null,true);
assert.equal(host.querySelector('[data-source-cell="p009-table-1-r2-c1"] .textbook-figure-group')!==null,true);
assert.equal(requested.includes('p009-figure-4'),false,'never display only upper half');
assert.equal(requested.includes('p009-figure-5'),false,'unavailable lower half never requested');
assert.match(host.querySelector('[data-source-cell="p009-table-1-r3-c1"]').textContent,/그림 준비 중/);
for(const table of data.blocks.filter(b=>b.type==='table'))for(const row of table.rows)for(const cell of row.cells){
 const rendered=host.querySelector(`[data-source-cell="${cell.id}"]`).cloneNode(true);rendered.querySelectorAll('.textbook-semantic-figure-container').forEach(n=>n.remove());
 const expected=cell.lines.map(l=>l.spans.map(s=>s.mappingAudit&&s.mappingAudit.verified?s.renderText||s.text:s.text).join('')).join('\n');
 assert.equal(rendered.textContent,expected,'native cell text preserved with embedded figures');
}
c.cleanup();assert.equal(host.children.length,0);assert.equal(revoked.length,made);console.log(JSON.stringify({source:'private page9',figureGroups:5,partialGroupHidden:true,allCellTextPreserved:true,cleanup:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
