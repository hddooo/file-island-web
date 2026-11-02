'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict');
const {JSDOM}=require('../.test-tools/node_modules/jsdom'),renderer=require('../media/textbook-semantic'),groups=require('../media/textbook-figure-groups');
const root=path.resolve(process.argv[2]||'../api/private-textbook-semantic-data');let checks=0;
const eq=(a,b,label)=>{assert.deepEqual(a,b,label);checks++;};
(async()=>{
for(const n of [17,20,31,76,77,79,103,124,128,130]){
 const data=JSON.parse(fs.readFileSync(path.join(root,`pages/page-${String(n).padStart(3,'0')}.json`))),dom=new JSDOM('<main></main>'),host=dom.window.document.querySelector('main');
 const c=renderer.render(host,data,{figureGroups:groups,isFigureAvailable:()=>false});await c.ready;
 const p=`p${String(n).padStart(3,'0')}-`;
 for(const t of data.blocks.filter(b=>b.type==='table')){
  for(const g of groups.groupsFor(data,t)){
   const d=groups.describe(data,g);eq(d.errors,[],`${n} supported source geometry`);
   if(d.targetCell){const el=[...host.querySelectorAll('[data-source-assets]')].find(el=>el.dataset.sourceAssets===d.members.map(f=>f.assetId).join(' '));assert(el,`${n} group rendered`);eq(el.closest('[data-source-cell]').dataset.sourceCell,d.targetCell.id,`${n} photo/map belongs to original cell`);}
  }
 }
 if([76,77,103,128].includes(n)){
  const expected={76:[[1,2,3,4]],77:[[1,2,3],[4,5,6],[7,8,9]],103:[[1,2,3],[4,5,6],[7,8,9,10]],128:[[1,2,3,4]]}[n];
  eq(data.blocks.filter(b=>b.id.includes('-layout-gallery-')).map(b=>b.rows[0].cells.map(cell=>+cell.sourceAssociations[0].assetIds[0].split('-').pop())),expected,`${n} source row/column sequence`);
 }
 if(n===79){
  const galleries=data.blocks.filter(b=>b.id.includes('-layout-gallery-'));
  eq(galleries[0].rows.map(r=>r.cells.map(cell=>[cell.columnIndex,cell.rowSpan,cell.sourceAssociations[0].assetIds.map(id=>+id.split('-').pop())])),[[[0,2,[1]],[1,1,[2]],[2,2,[3]]],[[1,1,[4]]]],'79 original stacked middle and spanning side pictures');
  eq(galleries[1].rows.map(r=>r.cells.map(cell=>[cell.columnIndex,cell.rowSpan,cell.sourceAssociations[0].assetIds.map(id=>+id.split('-').pop())])),[[[0,1,[5]],[1,2,[6]],[2,2,[7,8,9,10]]],[[0,1,[11]]]],'79 atomic minhwa and stacked left pictures');
 }
 if([17,20,31].includes(n)){
  const main=data.blocks.find(b=>b.layoutRole==='source-illustrated-table');
  const expected={17:[[2,3,[4]],[6,2,[3]]],20:[[1,2,[2]],[4,2,[1]]],31:[[1,6,[1,2]],[9,3,[4,5]]]}[n];
  eq(main.rows.flatMap(r=>r.cells.filter(c=>c.sourceIllustrationCell).map(c=>[c.rowIndex,c.rowSpan,c.sourceFigureAssetIds.map(id=>+id.split('-').pop())])),expected,`${n} reviewed map row anchors`);
  eq([...host.querySelectorAll('.textbook-semantic-figure-context')].length,0,`${n} no orphan table-map fallback`);
 }
 if([124,130].includes(n)){
  const expected=n===124?[[5,'여운형\n조선건국동맹'],[6,'신탁통치\n찬반 갈등'],[4,'남북협상(김구)']]:[[4,'6월민주항쟁\n(이한열)'],[3,'삼청교육대']];
  const cells=[...host.querySelectorAll('.textbook-source-illustration-cell [data-source-assets]')];
  eq(cells.map(el=>+el.dataset.sourceAssets.split('-').pop()),expected.map(v=>v[0]),`${n} source image vertical order`);
  cells.forEach((el,i)=>eq(el.closest('[data-source-cell]').querySelector('[data-source-block]').textContent.trim(),expected[i][1],`${n} exact matching native caption`));
 }
 c.cleanup();dom.window.close();
}
console.log(JSON.stringify({checks,failures:0,pages:10,scope:'source figure row/column order, original text/illustration row anchors and caption pairing; no network or quiz changes'}));
})().catch(e=>{console.error(e);process.exitCode=1;});
