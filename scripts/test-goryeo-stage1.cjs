'use strict';
const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),{JSDOM}=require('jsdom');
require('../media/goryeo-script-structure-data.js');require('../media/goryeo-script-presentation-data.js');require('../media/goryeo-script-structure.js');const reader=require('../media/goryeo-script-reader.js');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),compact=s=>s.replace(/\s/g,''),plain=s=>compact(s.replace(/<[^>]*>/g,'').replace(/\*\*/g,'').replace(/^\s*[-+] /gm,'').replace(/\*/g,''));
(async()=>{
 const raw=fs.readFileSync(process.argv[2]),text=raw.toString('utf8'),lines=text.split('\n'),bundleBytes=fs.readFileSync(process.argv[3]),bundle=JSON.parse(bundleBytes),original=JSON.stringify(bundle),images=process.argv[4];
 assert.equal(hash(raw),'245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9');assert.equal(hash(bundleBytes),'ed4fcfab4b25b0e896c93bcfe0240372b70da0fcbb22c1fa81afad14bbc71943');
 for(const f of bundle.figureManifest){const b=fs.readFileSync(require('path').join(images,f.name));assert.equal(hash(b),f.sha256);assert.equal(b.length,f.bytes);}assert.equal(bundle.figureManifest.length,24);
 const prepared=await reader.prepare(bundle),dom=new JSDOM('<main id="host">KEEP</main>',{url:'https://synthetic.invalid/#chapter/goryeo/webtoon'}),doc=dom.window.document,host=doc.querySelector('main');
 assert.throws(()=>reader.mount(host,bundle),/not_prepared/);assert.equal(host.textContent,'KEEP');const app=reader.mount(host,prepared);
 const source=(a,b)=>lines.slice(a-1,b).join('\n'),expected=new Map(),put=(id,r,c,s)=>expected.set(id+':'+r+':'+c,s);
 const label=n=>lines[n-1].replace(/^##### /,'').split(' · ')[0],value=n=>lines[n-1].replace(/^- \*\*[^*]+\*\* /,'').split(' · ')[0];
 [62,73,84,96,107].forEach((n,i)=>put('table15',1,i+2,label(n)));put('table15',1,1,'구분');['시기','세력','주요 인물/사건','침략'].forEach((v,i)=>put('table15',i+2,1,v));
 [[64,65,67,70,71],[75,76,78,81,82],[86,87,89,93,94],[98,99,101,104,null],[109,110,112,114,115]].forEach(([a,b,c,d,e],i)=>{put('table15',2,i+2,value(a));put('table15',3,i+2,value(b));put('table15',4,i+2,source(c,d));if(e)put('table15',5,i+2,value(e));});
 [[127,129,133],[135,137,137],[139,141,144],[146,148,148],[150,152,155],[179,183,189]].forEach(([h,a,b],i)=>{put('table16',i+1,1,label(h)+(i===5?'\n'+lines[180]:''));put('table16',i+1,2,source(a,b));});
 function exam(id,row,h,parts){put(id,row,1,lines[h-1].replace(/^##### /,'').replace(' · ','\n'));parts.forEach(([a,b],i)=>put(id,row+i,2,source(a,b)));}
 exam('exam-early',1,193,[[195,197],[199,200]]);exam('exam-early',3,202,[[204,204]]);exam('exam-early',4,206,[[208,211]]);exam('exam-early',5,213,[[215,215]]);exam('exam-early',6,217,[[219,220],[222,224]]);exam('exam-early',8,226,[[228,231],[233,237]]);
 exam('exam-military',1,378,[[380,380],[382,384]]);exam('exam-military',3,386,[[388,389],[391,393]]);exam('exam-military',5,407,[[409,412],[414,415]]);exam('exam-military',7,417,[[419,422],[424,431]]);
 let emphasis=0;
 for(const [key,md] of expected){const [id,r,c]=key.split(':'),cell=host.querySelector('table[data-structure="'+id+'"] [data-cell="'+r+':'+c+'"]');assert(cell,key);assert.equal(compact(cell.textContent),plain(md),key);
  const bold=[...md.matchAll(/\*\*([^*]+)\*\*|<strong>(.*?)<\/strong>/gs)].map(m=>compact(m[1]||m[2]));assert.deepEqual(Array.from(cell.querySelectorAll('strong'),e=>compact(e.textContent)),bold,key+' bold');
  assert.deepEqual(Array.from(cell.querySelectorAll('[data-source-color]'),e=>e.dataset.sourceColor),[...md.matchAll(/color:(#[\da-f]+)/gi)].map(m=>m[1].toLowerCase()),key+' colours');
  for(const symbol of ['→','★','◆'])assert.equal(cell.textContent.split(symbol).length,md.split(symbol).length,key+symbol);
  emphasis+=bold.length+[...md.matchAll(/color:|→|★|◆|<u>/g)].length;
 }
 assert.equal(host.querySelector('table[data-structure="table15"] [data-cell="5:4"]').colSpan,2);
 const map=host.querySelector('[data-owner="table16"]');assert.equal(map.rowSpan,3);assert.equal(map.getAttribute('headers'),'gs-table16-3-1 gs-table16-4-1 gs-table16-5-1 gs-table16-content');assert.equal(map.querySelector('figure').dataset.figure,'p042-02.png');
 for(const td of host.querySelectorAll('.gsr-structure-table td'))for(const h of td.getAttribute('headers').split(' '))assert(doc.getElementById(h),'header association '+h);
 assert.equal(host.querySelectorAll('table[data-structure]').length,11);assert.equal(host.querySelectorAll('figure').length,4);assert.equal(host.querySelectorAll('figure figcaption:not([hidden])').length,0);assert(!/원문|전사|배치|PDF|병합 셀|이미지 목록/.test(host.querySelector('.gsr-body').textContent));
 host.querySelector('[data-mode="practice"]').click();assert.equal(host.querySelectorAll('textarea').length,103);assert(Array.from(host.querySelectorAll('textarea')).every(e=>e.value===''));assert.equal(host.querySelectorAll('[data-kind="answers"]').length,0);
 host.querySelector('[data-mode="answers"]').click();assert.equal(host.querySelectorAll('[data-kind="answers"]').length,0);host.querySelector('.gsr-reveal button').click();assert.equal(host.querySelectorAll('[data-kind="answers"] table tr').length-6+host.querySelectorAll('[data-kind="answers"] li').length,100);
 assert.equal(bundle.segments.find(s=>s.page===58&&s.kind==='practice').markdown.match(/^\(\d+\) /gm).length,14);assert.equal(JSON.stringify(bundle),original);
 const bad=structuredClone(bundle);bad.segments[0].markdown+='x';await assert.rejects(reader.prepare(bad),/mismatch/);
 const saved=global.HanqGoryeoStructureData.tables[0].cells[1].ranges[0].start;global.HanqGoryeoStructureData.tables[0].cells[1].ranges[0].start++;await assert.rejects(reader.prepare(bundle),/hash/);global.HanqGoryeoStructureData.tables[0].cells[1].ranges[0].start=saved;
 app.stop();
 assert.deepEqual(bundle.topics.map(t=>t.id),['politics','society','culture']);
 for(const initialTopic of [...bundle.topics.map(t=>t.id),'early']){
  dom.window.history.replaceState({goryeoScript:{source:'0'.repeat(64),topic:initialTopic,mode:'answers'}},'');
  const instance=reader.mount(host,prepared,{initialTopic});assert.equal(host.querySelector('[data-topic][aria-current="true"]').dataset.topic,'politics');assert.equal(host.querySelectorAll('[data-kind="answers"]').length,0);instance.stop();
 }
 dom.window.close();console.log(JSON.stringify({pass:true,independentCells:expected.size,emphasis,imagesPinned:24,stageFigures:2,questions:100,answers:100,inputs:103,sourceUnchanged:true}));
})().catch(e=>{console.error(e);process.exitCode=1;});
