'use strict';
// Synthetic notes and quantities only. No private textbook passages or fixtures.
const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const w=new JSDOM('<main/>',{url:'https://synthetic.invalid',runScripts:'outside-only'}).window,d=w.document,h=d.querySelector('main');
for(const file of ['history81-term-data','history81-terms'])w.eval(fs.readFileSync('media/'+file+'.js','utf8'));
const data=w.HanqHistory81TermData,entry=id=>data.entries.find(e=>e.id===id),phrase=id=>entry(id).phrase;
const ids={injo:'joseon-injo-restoration',tax:'yeongjeong',monument:'joseon-samjeondo-monument',revolt:'joseon-yi-injwa-rebellion',stele:'joseon-tangpyeong-stele',stream:'joseon-remaining-cheonggyecheon'};
const names=Object.fromEntries(Object.entries(ids).map(([key,id])=>[key,phrase(id)]));
const injoName=phrase('joseon-king-16'),injo=names.injo+': 합성 결과',tax=names.tax+' 제정: 합성 과세 고정(7~9냥)',monument='항복 → '+names.monument+' (합성 주석)',debate='김상헌(합성 의견 가) vs 최명길(합성 의견 나)';
const expectedInjo=names.injo+' (합성 결과)',expectedTax=names.tax+' (합성과세 고정 7~9냥)',expectedMonument=names.monument+' (합성 주석)';let cases=0;
const list=(lines,attr='')=>'<ul'+attr+'>'+lines.map(s=>'<li>'+s+'</li>').join('')+'</ul>';
const row=(lines,heading=injoName,attributes='')=>'<table><tbody data-group="'+injoName+'"><tr '+attributes+'><th>'+heading+'</th><td>'+list(lines)+'</td></tr></tbody></table>';
const war=lines=>row(lines,'<span data-layout-label="true">'+injoName+'</span>병자호란 / 청','data-subrow="병자호란 / 청"');
function nodes(root){const out=[],walk=d.createTreeWalker(root,0xFFFFFFFF);let n;while((n=walk.nextNode()))out.push(n);return out;}
function run(html,verify,{era='joseon',source=data.sources[era],verifiedData}={}){
 h.innerHTML=html;const before=h.innerHTML,original=nodes(h),unchangedData=JSON.stringify(data);
 for(let repeat=0;repeat<2;repeat++){
  const view=w.HanqHistory81Terms.mount(h,era,source,verifiedData);verify(h);
  for(const trigger of h.querySelectorAll('.history81-term')){
   trigger.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Enter',bubbles:true}));const tip=d.querySelector('[role=tooltip]');assert(!tip.hidden);assert.equal(tip.textContent,entry(trigger.dataset.termId).summary);
   d.dispatchEvent(new w.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert(tip.hidden);
  }
  view.stop();view.stop();assert.equal(h.innerHTML,before);assert.deepEqual(nodes(h),original);assert.equal(d.querySelectorAll('[role=tooltip]').length,0);assert.equal(JSON.stringify(data),unchangedData);
 }cases++;
}
function term(root,id){const result=root.querySelector('[data-term-id="'+id+'"]');assert(result,id);return result;}
function unchanged(html,options){run(html,root=>{assert.equal(root.textContent,new JSDOM(html).window.document.body.textContent);assert.equal(root.querySelectorAll('[data-history-requested-emphasis]').length,0);},options);}
run(row([injo,'별개 항목',tax]),root=>{
 const items=root.querySelectorAll('li');assert.deepEqual([...items].map(n=>n.textContent),[expectedInjo,'별개 항목',expectedTax]);
 assert.equal(items[0].querySelector('[data-history-requested-emphasis="event-line"]').textContent,expectedInjo);
 for(const id of [ids.injo,ids.tax])assert(term(root,id).querySelector('strong'));
});
for(const [source,expected,id]of [[injo,expectedInjo,ids.injo],[tax,expectedTax,ids.tax]]){
 const title=phrase(id);
 for(const markup of [source,source.replace(title,'<em>'+title+'</em>'),source.replace(title,'<strong data-history-source-emphasis>'+title+'</strong>'),source.replace('합성','<span style="color:blue" data-source-color="#0070a3">합성</span>')])run(row([markup]),root=>{assert.equal(root.querySelector('li').textContent,expected);term(root,id);if(markup.includes('data-source-color'))assert.equal(root.querySelector('[data-source-color]').textContent,'합성');});
 unchanged(list([source]));unchanged(row([source],'다른 왕'));unchanged(row([source]),{source:'wrong'});unchanged(row([source]),{era:'goryeo'});unchanged(row([source]),{verifiedData:data});
 unchanged(row([source.replace('합성','<button>합성</button>')]));unchanged(row([source]).replace('<li>','<li id="stable-item">'));unchanged(row([source]).replace('<li>','<li contenteditable="true">'));
 unchanged(row([source+'<ul><li>별개 항목</li></ul>']));unchanged(row([source+'<br>별개 줄']));
}
unchanged(row([names.injo+':']));unchanged(row([names.injo+': (합성 결과)']));unchanged(row([names.injo+': 합성: 추가']));unchanged(row([names.injo+'론: 합성 결과']));
unchanged(row([names.tax+' 제정: 합성 과세 고정(수치 미상)']));unchanged(row([names.tax+' 제정: 합성 과세 고정(7~9냥']));unchanged(row([names.tax+' 다른표현: 합성 과세 고정(7~9냥)']));
unchanged(row([tax.replace(names.tax,[...names.tax].join(' '))]));
run(war(['별개 항목','항복 → 별개 내용',debate,monument]),root=>{
 assert.deepEqual([...root.querySelectorAll('li')].map(n=>n.textContent),['별개 항목','항복 → 별개 내용',expectedMonument,debate]);assert(term(root,ids.monument).querySelector('strong'));
});
run(war([debate,monument.replace(names.monument,'<i>'+names.monument+'</i>')]),root=>{assert.equal(root.querySelector('li').textContent,expectedMonument);assert.equal(term(root,ids.monument).querySelector('i').textContent,names.monument);});
for(const html of [list([debate,monument]),row([debate,monument]),war([debate,monument]).replace('data-group="'+injoName+'"','data-group="다른 왕"'),war([debate,'항복 → 다른 '+names.monument]),war([debate,'항복 → '+names.monument+'론']),war([debate,monument.replace(names.monument,'<button>'+names.monument+'</button>')])])unchanged(html);
run(war([monument,debate]),root=>assert.deepEqual([...root.querySelectorAll('li')].map(n=>n.textContent),[expectedMonument,debate]));
const yeongjoName=phrase('joseon-king-21'),marked=name=>'<strong data-history-source-emphasis="true">'+name+'</strong>',revolt=marked(names.revolt)+'(합성 메모)',stele=marked(names.stele)+' 합성 정책',stream=marked(names.stream)+' 합성 정비';
const yeongjo=lines=>row(lines,yeongjoName).replace('data-group="'+injoName+'"','data-group="'+yeongjoName+'"');
run(yeongjo([stele,revolt,stream]),root=>assert.deepEqual([...root.querySelectorAll('li')].map(n=>n.textContent),[names.revolt+'(합성 메모)',names.stele+' 합성 정책',names.stream+' 합성 정비']));
run(yeongjo(['별개 앞 항목',stele,'별개 중간 항목',revolt,stream,'별개 뒤 항목']),root=>assert.deepEqual([...root.querySelectorAll('li')].map(n=>n.textContent),['별개 앞 항목',names.revolt+'(합성 메모)',names.stele+' 합성 정책','별개 중간 항목',names.stream+' 합성 정비','별개 뒤 항목']));
for(const html of [yeongjo([revolt,stele,stream]),row([stele,revolt,stream]),list([stele,revolt,stream]),yeongjo([stele,revolt]),yeongjo([stele,revolt,revolt,stream]),yeongjo([stream,revolt,stele]),yeongjo([stele,revolt.replace('data-history-source-emphasis="true"',''),stream])])unchanged(html);
unchanged(yeongjo([stele,revolt,stream]),{source:'wrong'});
console.log('PASS '+cases+' synthetic Joseon display cases: punctuation, quantities, emphasis, tooltips, context gates, ordering and exact node restoration');w.close();
