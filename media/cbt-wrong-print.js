/* Owner-private, GET-only print worksheet. Native print uses OS fonts; no PDF fonts or remote renderers. */
(function(root){'use strict';
var active=null;
function session(api){var s=api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId!=null?String(s.ownerId)+':'+String(s.epoch||0):null;}
function error(code){var e=new Error(code);e.code=code;return e;}
var FIRST=67,LAST=80,UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
async function parallel(items,task,width){
 var next=0,out=[];
 await Promise.all(Array.from({length:Math.min(width,items.length)},async function(){while(next<items.length){var i=next++;out[i]=await task(items[i]);}}));
 return out;
}
async function collect(api,rounds,valid){
 var cutoff=Date.parse(root.HanqLearningReset?.token?.(api.state().ownerId,'history'))||0;
 function get(path){valid();return api.cbt('GET','/api/v1/cbt'+path);}
 var list=await get('/runs');valid();
 if(!Array.isArray(list?.runs)||list.runs.length>=100)throw error('history_limit');
 var eligible=list.runs.filter(function(r){return r.status==='final'&&r.kind!=='review'&&rounds.includes(r.round)&&Date.parse(r.finalAt)>cutoff;});
 if(eligible.some(function(r){return !UUID.test(r.id||'');}))throw error('incomplete');
 var snapshots=new Map();
 var saved=await parallel(rounds,async function(round){
   var raw=await get('/review-materials/'+round);valid();
   if((Date.parse(raw?.resetAt)||0)!==cutoff&&cutoff)throw error('changed');
   return root.HanqCbtRoundMaterials.normalize(raw,round).items;
 },4);
 saved.flat().forEach(function(q){snapshots.set(q.questionId,q);});
 // The materials index intentionally excludes blank rows. Read the existing
 // finalized attempts, including imported paper misses stored as unanswered.
 var runs=await parallel(eligible,async function(run){
   var d=await get('/runs/'+run.id);valid();
   if(d?.run?.id!==run.id||d.run.round!==run.round||d.run.status!=='final'||d.run.finalAt!==run.finalAt||!Array.isArray(d.items)||d.items.length!==50)throw error('incomplete');
   var ids=new Set(),pos=new Set();
   var rows=d.items.map(function(q){
     if(!q||ids.has(q.questionId)||pos.has(q.position)||!q.review||!['wrong','correct','unanswered'].includes(q.review.status))throw error('incomplete');
     ids.add(q.questionId);pos.add(q.position);return Object.assign({},q,{runId:run.id});
   });
   // Reuse the existing canonical ownership, numbering, image and answer
   // validation for every authoritative wrong/unanswered item.
   return root.HanqCbtRoundMaterials.normalize({scope:'exam-starred-or-ever-wrong',round:run.round,hasMore:false,pendingStarCount:0,items:rows.filter(function(q){return q.review.status!=='correct';}).map(function(q){return Object.assign(q,{starred:false,everWrong:true});})},run.round).items;
 },4);
 runs.flat().forEach(function(q){if(!snapshots.has(q.questionId))snapshots.set(q.questionId,q);});
 valid();
 if((Date.parse(root.HanqLearningReset?.token?.(api.state().ownerId,'history'))||0)!==cutoff)throw error('changed');
 return Array.from(snapshots.values()).sort(function(a,b){return a.exam-b.exam||a.number-b.number;});
}
function node(doc,tag,text,cls){var e=doc.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
function button(doc,text,fn){var b=node(doc,'button',text);b.type='button';b.onclick=fn;return b;}
var PRINT_CSS='@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#111;background:white;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}body{width:186mm}.wp-page{width:186mm;height:267mm;break-after:page;page-break-after:always;padding:0;overflow:visible}.wp-page:last-child{break-after:auto;page-break-after:auto}h1{font-size:16pt;margin:0 0 4mm}.wp-page-title{font-size:12pt;height:7mm;margin:0 0 3mm}.wp-columns{display:grid;grid-template-columns:repeat(2,91mm);gap:4mm;height:250mm}.wp-column{min-width:0}.wp-question{width:91mm;break-inside:avoid;page-break-inside:avoid;margin:0 0 4mm}.wp-question h2{font-size:15pt;line-height:6mm;height:6mm;margin:0}.wp-question-origin{font-size:9pt;line-height:4mm;height:4mm;margin:0 0 1mm}.wp-images{display:flex;flex-direction:column;gap:2mm;align-items:flex-start}.wp-images img{display:block;max-width:100%;object-fit:contain;object-position:left top}.wp-common-ref{font-size:8pt;line-height:4mm;height:4mm;margin:0}.wp-mark{font-size:9pt;line-height:5mm;height:5mm;margin:2mm 0 0}.wp-answer-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5mm 4mm;align-content:start}.wp-answer-group{break-inside:avoid}.wp-answer-group h2{font-size:10pt;margin:0 0 2mm}.wp-answer-cells{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0}.wp-answer-cell{font-size:8pt;line-height:5mm;height:5mm;white-space:nowrap;border-bottom:0.2mm solid #ddd}.wp-answer-cell b{font-size:9pt}';
function renderSheet(doc,items,pictures){
 doc.open();doc.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>한국사 오답 문제 · 마지막 장 정답</title></head><body></body></html>');doc.close();doc.head.appendChild(node(doc,'style',PRINT_CSS));
 var page,columns,col=0,used=0,commonSeen=new Map(),numbers=new Map(items.map(function(q,i){return [q.questionId,i+1];}));
 function nextPage(){page=node(doc,'section',null,'wp-page wp-question-page');page.appendChild(node(doc,'h1','한국사 · 오답 문제','wp-page-title'));var grid=node(doc,'div',null,'wp-columns');columns=[node(doc,'div',null,'wp-column'),node(doc,'div',null,'wp-column')];columns.forEach(function(c){grid.appendChild(c);});page.appendChild(grid);doc.body.appendChild(page);col=0;used=0;commonSeen=new Map();}
 function metrics(q){var key=q.common?JSON.stringify([q.exam,q.common.questionNumbers]):null,shared=key&&commonSeen.has(key),paths=q.common&&!shared?[q.common.image,q.image]:[q.image],ratio=paths.reduce(function(v,p){return v+pictures.get(p).ratio;},0),overhead=22+(paths.length-1)*2+(shared?4:0),width=Math.min(91,(250-overhead)/ratio);return{key:key,shared:shared,paths:paths,width:width,height:overhead+width*ratio};}
 items.forEach(function(q){if(!page)nextPage();var m=metrics(q);if(used+m.height>250.01){if(col===0){col=1;used=0;}else{nextPage();m=metrics(q);}}var block=node(doc,'section',null,'wp-question');block.appendChild(node(doc,'h2',String(numbers.get(q.questionId))));block.appendChild(node(doc,'p','('+q.exam+'회-'+q.number+'번)','wp-question-origin'));if(m.shared)block.appendChild(node(doc,'p','공통 자료: 이 쪽 '+commonSeen.get(m.key)+'번 위 자료 참고','wp-common-ref'));var imgs=node(doc,'div',null,'wp-images');m.paths.forEach(function(path){var data=pictures.get(path),img=node(doc,'img');img.src=data.url;img.alt=path===q.image?'원본 문제와 보기':'공통 자료';img.style.width=m.width+'mm';img.style.height=(m.width*data.ratio)+'mm';imgs.appendChild(img);});block.appendChild(imgs);block.appendChild(node(doc,'p','내 답:  ①   ②   ③   ④   ⑤','wp-mark'));columns[col].appendChild(block);used+=m.height;if(m.key&&!m.shared)commonSeen.set(m.key,numbers.get(q.questionId));});
 var rounds=Array.from(new Set(items.map(function(q){return q.exam;}))),sheets=[];
 for(var i=0;i<rounds.length;i+=9){
   var sheet=node(doc,'section',null,'wp-page wp-answer-sheet'),groups=node(doc,'div',null,'wp-answer-groups');
   sheet.appendChild(node(doc,'h1',rounds.length>9?'정답 모아보기 · '+(i/9+1):'정답 모아보기'));
   rounds.slice(i,i+9).forEach(function(round){var group=node(doc,'section',null,'wp-answer-group');group.appendChild(node(doc,'h2','제'+round+'회'));var cells=node(doc,'div',null,'wp-answer-cells');items.filter(function(q){return q.exam===round;}).forEach(function(q){var cell=node(doc,'div',null,'wp-answer-cell');cell.appendChild(node(doc,'span',String(numbers.get(q.questionId))+'번 '));cell.appendChild(node(doc,'b',['①','②','③','④','⑤'][q.review.correctNumber-1]));cells.appendChild(cell);});group.appendChild(cells);groups.appendChild(group);});
   sheet.appendChild(groups);doc.body.appendChild(sheet);sheets.push(sheet);
 }
 return sheets[sheets.length-1];
}
function open(options){
 options=options||{};if(active)active.stop();var api=options.api,owner=session(api);if(!owner)return Promise.reject(error('session_changed'));if(root.document.querySelector('.fe-active-run'))return Promise.reject(error('active_exam'));
 var doc=root.document,dialog=node(doc,'dialog',null,'cbt-wrong-print'),alive=true,off=null,offReset=null,urls=[],selected=new Set(),frame=null,busy=false,lastFocus=doc.activeElement,token=0;
 var rounds=Array.from({length:LAST-FIRST+1},function(_,i){return LAST-i;});
 var controls=node(doc,'div',null,'wp-controls'),list=node(doc,'fieldset',null,'wp-selection'),preview=node(doc,'div',null,'wp-preview'),status=node(doc,'p'),title=node(doc,'h2','오답·별표 문제지 인쇄 / PDF'),close=button(doc,'닫기',stop),print=button(doc,'인쇄 / PDF 저장',printNow);
 dialog.setAttribute('aria-label','오답·별표 문제지 인쇄 / PDF');status.setAttribute('role','status');
 function current(){return alive&&dialog.isConnected&&session(api)===owner;}
 function valid(g){if(!current()||g!==token)throw error('cancelled');}
 function clearPreview(){if(frame){frame.src='about:blank';frame.remove();frame=null;}urls.forEach(function(u){root.URL.revokeObjectURL(u);});urls=[];preview.replaceChildren();}
 function stop(){if(!alive)return;alive=false;token++;clearPreview();if(off)off();if(offReset)offReset();root.removeEventListener('hashchange',stop);dialog.remove();if(active&&active.stop===stop)active=null;if(lastFocus?.isConnected)lastFocus.focus();}
 function fits(sheet){return sheet&&sheet.scrollHeight<=sheet.clientHeight+2&&sheet.scrollWidth<=sheet.clientWidth+2;}
 async function bounded(p){var timer;try{return await Promise.race([p,new Promise(function(_,reject){timer=setTimeout(function(){reject(error('timeout'));},20000);})]);}finally{clearTimeout(timer);}}
 function update(){print.disabled=busy||!selected.size;status.textContent=selected.size?selected.size+'개 회차 선택 · 오답·미응답·저장된 별표를 중복 없이 한 파일로 만듭니다.':'인쇄할 회차를 선택해 주세요.';}
 function selectAll(on){if(busy)return;clearPreview();selected=new Set(on?rounds:[]);Array.from(list.querySelectorAll('input')).forEach(function(c){c.checked=selected.has(Number(c.value));});update();}
 controls.append(title,close);list.appendChild(node(doc,'legend','인쇄할 회차'));
 rounds.forEach(function(r){var label=node(doc,'label'),c=node(doc,'input');c.type='checkbox';c.value=String(r);c.onchange=function(){if(c.checked)selected.add(r);else selected.delete(r);clearPreview();update();};label.append(c,doc.createTextNode('제'+r+'회'));list.append(label);});
 dialog.append(controls,node(doc,'p','회차를 고르면 한 번이라도 틀렸거나 제출 시 답하지 않은 문제, 저장된 별표 문제를 모아 문제지로 만듭니다. 정답은 문제지 뒤에만 나옵니다.'),button(doc,'전체 회차 선택',function(){selectAll(true);}),button(doc,'선택 해제',function(){selectAll(false);}),list,print,status,node(doc,'p','iPhone/iPad: 인쇄 화면에서 미리보기를 확대해 공유 → 파일에 저장하세요.'),preview);
 doc.body.appendChild(dialog);dialog.addEventListener('cancel',function(e){e.preventDefault();stop();});dialog.showModal();close.focus();root.addEventListener('hashchange',stop);off=api.onChange(function(){if(session(api)!==owner)stop();});offReset=root.HanqLearningReset?.onChange?.(stop);active={stop:stop};
 if(rounds.includes(options.round)){selected.add(options.round);list.querySelector('input[value="'+options.round+'"]').checked=true;update();}else selectAll(true);
 function framePrint(){
   if(!current()||!frame)return;
   frame.contentWindow.focus();frame.contentWindow.print();
 }
 async function printNow(){
   if(busy||!current()||!selected.size)return;if(frame){framePrint();return;}
   var g=++token;busy=true;clearPreview();dialog.querySelectorAll('input,button').forEach(function(e){if(e!==close)e.disabled=true;});
   status.textContent='선택한 회차의 기록을 확인하고 있어요…';
   var completed=false;
   try{
     var choice=await collect({state:api.state.bind(api),cbt:function(){return bounded(api.cbt.apply(api,arguments));}},Array.from(selected),function(){valid(g);});valid(g);
     if(!choice.length){status.textContent='선택한 회차에 인쇄할 문제 기록이 없어요.';return;}
     var paths=Array.from(new Set(choice.flatMap(function(q){return q.common?[q.common.image,q.image]:[q.image];}))),pictures=new Map();
     await parallel(paths,async function(path){
       valid(g);var blob=await bounded(api.cbtImage(path));valid(g);
       if(!blob||!/^image\/(png|jpeg|webp)$/.test(blob.type)||!blob.size)throw error('image');
       var url=root.URL.createObjectURL(blob);urls.push(url);var img=new root.Image();
       await bounded(new Promise(function(res,rej){img.onload=res;img.onerror=function(){rej(error('image'));};img.src=url;}));valid(g);
       if(!img.naturalWidth||!img.naturalHeight)throw error('image');pictures.set(path,{url:url,ratio:img.naturalHeight/img.naturalWidth});status.textContent='원본 준비 '+pictures.size+' / '+paths.length;
     },5);
     valid(g);frame=node(doc,'iframe');frame.title='오답·별표 문제지와 정답';preview.appendChild(frame);renderSheet(frame.contentDocument,choice,pictures);
     if(frame.contentDocument.fonts)await bounded(frame.contentDocument.fonts.ready);
     await bounded(Promise.all(Array.from(frame.contentDocument.images).map(function(im){return im.decode?im.decode():new Promise(function(res,rej){if(im.complete&&im.naturalWidth)return res();im.onload=res;im.onerror=rej;});})));valid(g);
     if(Array.from(frame.contentDocument.querySelectorAll('.wp-page')).some(function(p){return !fits(p);}))throw error('overflow');
     completed=true;status.textContent=choice.length+'문제 준비 완료. 인쇄 창이 안 열리면 버튼을 한 번 더 눌러 주세요.';
     try{framePrint();}catch(_){}
   }catch(e){
     if(current()){token++;clearPreview();status.textContent=e.code==='history_limit'?'서버가 응시 이력 전체를 제공하지 못해 빠짐없는 문제지를 만들 수 없어요.':e.code==='changed'?'학습 기록 상태가 바뀌었어요. 다시 시도해 주세요.':e.code==='overflow'?'페이지 배치를 확인하지 못했어요. 다시 시도해 주세요.':'문제 기록이나 원본을 모두 확인하지 못했어요. 다시 시도해 주세요.';}
   }finally{
     busy=false;if(current()){dialog.querySelectorAll('input,button').forEach(function(e){e.disabled=false;});print.disabled=!selected.size;if(completed)print.focus();}
   }
 }
 return {ready:Promise.resolve(),stop:stop};
}
root.HanqCbtWrongPrint={open:open,collect:collect,renderSheet:renderSheet};
})(window);
