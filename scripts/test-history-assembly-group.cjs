'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom'),renderer=require('../media/textbook-semantic');
const SHA='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
const cell=(r,c,text)=>({id:'81-p129-table1-source-r'+r+'-c'+c,columnIndex:c,header:c===0,lines:[{spans:[{text}]}]});
const fixture={schemaVersion:'hanq-semantic/1',sourceSha256:SHA,pdfPage:129,blocks:[{id:'81-p129-table1',type:'table',columnCount:2,rows:['구분','제헌국회','반민족 행위 특별 조사위원회','농지개혁','다른 항목'].map((label,r)=>({cells:[cell(r,0,label),cell(r,1,'Synthetic preserved body '+r)]}))}]};
(async()=>{
const dom=new JSDOM('<div id="privateTextbook"></div>'),host=dom.window.document.getElementById('privateTextbook');
const original=JSON.stringify(fixture);let render=renderer.render(host,fixture);await render.ready;
let table=host.querySelector('table'),group=table.querySelector('[data-study-group]');
assert.equal(group.textContent,'제헌국회');assert.equal(group.rowSpan,2);assert.equal(group.getAttribute('scope'),'rowgroup');
assert.deepEqual(Array.from(table.rows,r=>r.cells.length),[2,2,3,2,2]);
assert.deepEqual(Array.from(table.rows,r=>r.cells[0].colSpan),[2,2,1,1,2]);
assert.equal(table.querySelectorAll('[data-source-cell]').length,10);
assert.equal(JSON.stringify(fixture),original);
assert.equal(table.querySelector('[data-source-cell="81-p129-table1-source-r3-c1"]').textContent,'Synthetic preserved body 3');
render.cleanup();render=renderer.render(host,fixture);await render.ready;assert.equal(host.querySelectorAll('[data-study-group]').length,1);render.cleanup();
for(const alter of [p=>p.pdfPage=128,p=>p.sourceSha256='0'.repeat(64),p=>p.blocks[0].id='other',p=>p.blocks[0].rows[2].cells[0].lines[0].spans[0].text='Different label']){
const copy=structuredClone(fixture);alter(copy);render=renderer.render(host,copy);await render.ready;assert(!host.querySelector('[data-study-group]'));assert.equal(host.querySelectorAll('[colspan]').length,0);render.cleanup();
}
if(process.env.ASSEMBLY_PAGE_FIXTURE){const page=JSON.parse(fs.readFileSync(process.env.ASSEMBLY_PAGE_FIXTURE));let before=JSON.stringify(page);render=renderer.render(host,page);await render.ready;assert.equal(host.querySelector('[data-study-group]').rowSpan,2);assert.equal(JSON.stringify(page),before);render.cleanup();}
console.log('PASS assembly grouping: merged cell, preserved source, remount, page/hash/block/label guards'+(process.env.ASSEMBLY_PAGE_FIXTURE?', actual private p129 fixture':''));
dom.window.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
