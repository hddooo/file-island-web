/* Owner-private, GET-only print worksheet. Native print uses OS fonts; no PDF fonts or remote renderers. */
(function(root){'use strict';
var active=null,writerLoad=null;
var earlyExplanationLoad=null;
function loadEarlyExplanations(){
 if(root.HANQ_CBT_EXPLANATIONS_67_69?.items)return Promise.resolve(true);
 if(!earlyExplanationLoad)earlyExplanationLoad=new Promise(function(resolve){
  var doc=root.document,script=doc.createElement('script'),settled=false;
  function done(){if(settled)return;settled=true;clearTimeout(timer);script.remove();var loaded=!!root.HANQ_CBT_EXPLANATIONS_67_69?.items;if(!loaded)earlyExplanationLoad=null;resolve(loaded);}
  var timer=setTimeout(done,4000);
  script.src='media/cbt-explanation67-69-data.js?v=official-67-69-20261119';
  script.onload=script.onerror=done;
  doc.head.appendChild(script);
 });
 return earlyExplanationLoad;
}
function loadPdfWriter(){
 if(root.HanqCbtWorksheetPdf?.create)return Promise.resolve(root.HanqCbtWorksheetPdf);
 if(!writerLoad)writerLoad=new Promise(function(resolve,reject){
  var script=root.document.createElement('script'),settled=false,timer=setTimeout(done,10000);
  function done(){if(settled)return;settled=true;clearTimeout(timer);script.remove();if(root.HanqCbtWorksheetPdf?.create)resolve(root.HanqCbtWorksheetPdf);else{writerLoad=null;reject(error('pdf_writer'));}}
  script.src='media/cbt-worksheet-pdf.js?v=0.13.31';script.onload=script.onerror=done;root.document.head.appendChild(script);
 });
 return writerLoad;
}
function session(api){var s=api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId!=null?String(s.ownerId)+':'+String(s.epoch||0):null;}
function error(code){var e=new Error(code);e.code=code;return e;}
var FIRST=67,LAST=80,UUID=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
async function parallel(items,task,width){
 var next=0,out=[];
 await Promise.all(Array.from({length:Math.min(width,items.length)},async function(){while(next<items.length){var i=next++;out[i]=await task(items[i]);}}));
 return out;
}
function worksheetRows(raw,round){
 if(!raw||raw.scope!=='exam-starred-or-ever-wrong'||raw.includesUnanswered!==true||raw.round!==round||raw.hasMore!==false||!Array.isArray(raw.items)||raw.items.length>50||!Number.isInteger(raw.pendingStarCount)||raw.pendingStarCount<0||raw.pendingStarCount>50)throw error('materials_shape');
 var ids=new Set();
 return raw.items.map(function(q){
  var answer=q?.review?.correctNumber,opts=q?.options,base=q&&'/api/v1/cbt/'+(q.source==='review'?'reviews':'runs')+'/'+q.runId+'/questions/'+q.position;
  if(!q||!['exam','review'].includes(q.source)||q.exam!==round||!Number.isInteger(q.number)||q.number<1||q.number>50||q.questionId!=='exam-'+round+'-'+String(q.number).padStart(2,'0')||typeof q.version!=='string'||!q.version||!UUID.test(q.runId)||!Number.isInteger(q.position)||q.position<0||q.position>49||typeof q.starred!=='boolean'||typeof q.everWrong!=='boolean'||!(q.starred||q.everWrong)||!Number.isInteger(answer)||answer<1||answer>5||!Array.isArray(opts)||opts.length!==5||new Set(opts.map(function(o){return o?.id;})).size!==5||opts.some(function(o,i){return typeof o?.id!=='string'||!o.id||o.number!==i+1;})||opts[answer-1].id!==q.review.correctOptionId||q.image!==base+'/image'||ids.has(q.questionId))throw error('materials_shape');
  if(q.common!=null&&(!q.common||q.common.image!==base+'/common'||!Array.isArray(q.common.questionNumbers)||q.common.questionNumbers.length<2||!q.common.questionNumbers.includes(q.number)||q.common.questionNumbers.some(function(n,i,a){return !Number.isInteger(n)||n<1||n>50||i&&n!==a[i-1]+1;})))throw error('materials_shape');
  ids.add(q.questionId);
  var renderer=root.HanqCbtExplanations,parts=null,choices=[];
  try{
   parts=renderer?.reviewParts?.(q,'final')||null;
   var src=renderer?.resolve?.(q,'final')||(parts?q.review.item:null);
   if(src?.options)choices=src.options.map(function(o){var detail=o.review||o.explanation||o.why;return Array.isArray(detail)?detail.filter(function(x){return typeof x==='string'&&x.trim();}):typeof detail==='string'&&detail.trim()?[detail]:[];});
  }catch(_){}
  return {questionId:q.questionId,version:q.version,exam:round,number:q.number,image:q.image,common:q.common||null,review:{correctNumber:answer},parts:parts,choices:choices};
 });
}
async function collect(api,rounds,valid,readSnapshot){
 var cutoff=Date.parse(root.HanqLearningReset?.token?.(api.state().ownerId,'history'))||0,serverReset,pendingCount=0;
 if(!Array.isArray(rounds)||!rounds.length||rounds.some(function(r){return !Number.isInteger(r)||r<FIRST||r>LAST;})||new Set(rounds).size!==rounds.length)throw error('materials_shape');
 var parts=await parallel(rounds,async function(round){
  valid();var raw;
  try{raw=readSnapshot?await readSnapshot(round):await api.cbt('GET','/api/v1/cbt/worksheet-materials/'+round);}catch(e){valid();var f=error([401,403].includes(e?.status)?'login':e?.status===404?'not_ready':'materials_http');f.round=round;throw f;}
  valid();
  var reset=raw?.resetAt==null?0:Date.parse(raw.resetAt);
  if(!Number.isFinite(reset)||(cutoff&&reset<cutoff)||(serverReset!==undefined&&serverReset!==reset))throw error('changed');
  serverReset=reset;
  try{var rows=worksheetRows(raw,round);pendingCount+=raw.pendingStarCount;return rows;}catch(e){e.round=round;throw e;}
 },4);
 valid();
 if((Date.parse(root.HanqLearningReset?.token?.(api.state().ownerId,'history'))||0)!==cutoff)throw error('changed');
 return {items:parts.flat().sort(function(a,b){return a.exam-b.exam||a.number-b.number;}),pendingCount:pendingCount};
}
function node(doc,tag,text,cls){var e=doc.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
function button(doc,text,fn){var b=node(doc,'button',text);b.type='button';b.onclick=fn;return b;}
var PRINT_CSS='@page{size:A4 portrait;margin:12mm}*{box-sizing:border-box}html,body{margin:0;padding:0;color:#111;background:white;font-family:system-ui,-apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif}body{width:186mm}.wp-page{width:186mm;height:267mm;break-after:page;page-break-after:always;padding:0;overflow:visible}.wp-page:last-child{break-after:auto;page-break-after:auto}h1{font-size:16pt;margin:0 0 4mm}.wp-page-title{font-size:12pt;height:7mm;margin:0 0 3mm}.wp-columns{display:grid;grid-template-columns:repeat(2,91mm);gap:4mm;height:250mm}.wp-column{min-width:0}.wp-question{width:91mm;break-inside:avoid;page-break-inside:avoid;margin:0 0 4mm}.wp-question h2{font-size:15pt;line-height:6mm;height:6mm;margin:0}.wp-question-origin{font-size:9pt;line-height:4mm;height:4mm;margin:0 0 1mm}.wp-images{display:flex;flex-direction:column;gap:2mm;align-items:flex-start}.wp-images img{display:block;max-width:100%;object-fit:contain;object-position:left top}.wp-common-ref{font-size:8pt;line-height:4mm;height:4mm;margin:0}.wp-mark{font-size:9pt;line-height:5mm;height:5mm;margin:2mm 0 0}.wp-answer-groups{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5mm 4mm;align-content:start}.wp-answer-group{break-inside:avoid}.wp-answer-group h2{font-size:10pt;margin:0 0 2mm}.wp-answer-cells{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:0}.wp-answer-cell{font-size:8pt;line-height:5mm;height:5mm;white-space:nowrap;border-bottom:0.2mm solid #ddd}.wp-answer-cell b{font-size:9pt}';
function renderSheet(doc,items,pictures,mode){
 doc.open();doc.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>한국사 오답·별표 '+(mode==='explanations'?'해설지':'문제지')+'</title></head><body></body></html>');doc.close();doc.head.appendChild(node(doc,'style',PRINT_CSS));
 if(mode==='explanations')return renderExplanations(doc,items);
 var page,columns,col=0,used=0,commonSeen=new Map(),numbers=new Map(items.map(function(q,i){return [q.exam+':'+q.number,i+1];}));
 function nextPage(){page=node(doc,'section',null,'wp-page wp-question-page');page.appendChild(node(doc,'h1','한국사 · 오답 문제','wp-page-title'));var grid=node(doc,'div',null,'wp-columns');columns=[node(doc,'div',null,'wp-column'),node(doc,'div',null,'wp-column')];columns.forEach(function(c){grid.appendChild(c);});page.appendChild(grid);doc.body.appendChild(page);col=0;used=0;commonSeen=new Map();}
 function metrics(q){var key=q.common?JSON.stringify([q.exam,q.common.questionNumbers]):null,shared=key&&commonSeen.has(key),paths=q.common&&!shared?[q.common.image,q.image]:[q.image],ratio=paths.reduce(function(v,p){return v+pictures.get(p).ratio;},0),overhead=22+(paths.length-1)*2+(shared?4:0),width=Math.min(91,(250-overhead)/ratio);return{key:key,shared:shared,paths:paths,width:width,height:overhead+width*ratio};}
 items.forEach(function(q){if(!page)nextPage();var m=metrics(q);if(used+m.height>250.01){if(col===0){col=1;used=0;}else{nextPage();m=metrics(q);}}var block=node(doc,'section',null,'wp-question');block.appendChild(node(doc,'h2',String(numbers.get(q.exam+':'+q.number))));block.appendChild(node(doc,'p','('+q.exam+'회-'+q.number+'번)','wp-question-origin'));if(m.shared)block.appendChild(node(doc,'p','공통 자료: 이 쪽 '+commonSeen.get(m.key)+'번 위 자료 참고','wp-common-ref'));var imgs=node(doc,'div',null,'wp-images');m.paths.forEach(function(path){var data=pictures.get(path),img=node(doc,'img');img.src=data.url;img.alt=path===q.image?'원본 문제와 보기':'공통 자료';img.style.width=m.width+'mm';img.style.height=(m.width*data.ratio)+'mm';imgs.appendChild(img);});block.appendChild(imgs);block.appendChild(node(doc,'p','내 답:  ①   ②   ③   ④   ⑤','wp-mark'));columns[col].appendChild(block);used+=m.height;if(m.key&&!m.shared)commonSeen.set(m.key,numbers.get(q.exam+':'+q.number));});
 return page;
}
var DIGITS=['①','②','③','④','⑤'];
var EXPLANATION_CSS='.wp-answer-grid{display:grid;grid-template-columns:repeat(var(--cols),minmax(0,1fr));border-top:.25mm solid #767676;border-left:.25mm solid #767676;color:#111;font-size:9pt;font-variant-numeric:tabular-nums}.wp-answer-entry{display:flex;flex-direction:column;align-items:center;justify-content:center;border-bottom:.25mm solid #767676;border-right:.25mm solid #767676;height:7mm;line-height:3mm}.wp-answer-entry span{color:#383838}.wp-answer-entry b{font-size:12pt;line-height:3.6mm}.wp-explanations{width:186mm}.wp-explanation{border-top:.25mm solid #aaa;break-inside:avoid;padding:2mm 0;font-size:10pt;line-height:1.5;overflow-wrap:anywhere}.wp-explanation h2{font-size:14pt;margin:0}.wp-explanation .wp-question-origin{height:auto;margin:0 0 1mm}.wp-explanation p{margin:1mm 0}.wp-explanation ul{margin:1mm 0;padding-left:5mm}.wp-explanation li{margin:0 0 .8mm}';
function renderExplanations(doc,items){
 doc.head.append(node(doc,'style',EXPLANATION_CSS));
 if(items.length>(LAST-FIRST+1)*50)throw error('overflow');
 var page=node(doc,'section',null,'wp-page wp-answer-sheet'),grid=node(doc,'div',null,'wp-answer-grid');
 grid.setAttribute('role','list');grid.setAttribute('aria-label','문제지 번호별 정답');
 grid.style.setProperty('--cols',String(Math.max(8,Math.ceil(items.length/35))));
 page.append(node(doc,'h1','정답표'));
 items.forEach(function(q,idx){
  var entry=node(doc,'div',null,'wp-answer-entry');entry.setAttribute('role','listitem');entry.append(node(doc,'span',String(idx+1)),node(doc,'b',DIGITS[q.review.correctNumber-1]));grid.append(entry);
 });
 page.append(grid);doc.body.append(page);
 var body=node(doc,'section',null,'wp-explanations');body.append(node(doc,'h1','문항별 해설'));
 function clean(t){return String(t||'').replace(/\*\*/g,'').trim();}
 function add(block,label,lines){
  lines=(lines||[]).map(clean).filter(Boolean);if(!lines.length)return false;
  var p=node(doc,'p');p.append(node(doc,'strong',label+' '),doc.createTextNode(lines.join(' ')));block.append(p);return true;
 }
 items.forEach(function(q,i){
  var block=node(doc,'article',null,'wp-explanation'),parts=q.parts||{},has=false;
  block.append(node(doc,'h2',String(i+1)),node(doc,'p','('+q.exam+'회-'+q.number+'번)','wp-question-origin'));
  has=add(block,'지문 해설',parts.stem)||has;
  var choices=node(doc,'ul');
  (q.choices||[]).forEach(function(lines,n){if(lines.length)choices.append(node(doc,'li',DIGITS[n]+' '+lines.map(clean).filter(Boolean).join(' ')));});
  if(choices.childElementCount){var label=node(doc,'p');label.append(node(doc,'strong','보기별 해설'));block.append(label,choices);has=true;}
  has=add(block,'결론',[parts.conclusion].concat(parts.extra||[]))||has;
  if(!has)block.append(node(doc,'p','확인된 해설이 없습니다.'));
  body.append(block);
 });
 doc.body.append(body);return body;
}
function open(options){
 options=options||{};if(active)active.stop();var api=options.api,owner=session(api);if(!owner)return Promise.reject(error('session_changed'));if(root.document.querySelector('.fe-active-run'))return Promise.reject(error('active_exam'));
 var doc=root.document,dialog=node(doc,'dialog',null,'cbt-wrong-print'),alive=true,off=null,offReset=null,urls=[],selected=new Set(),frame=null,busy=false,lastFocus=doc.activeElement,token=0,frameMode=null,snapshots=new Map(),requests=new Map(),roundUI=new Map(),countQueue=[],countActive=0;
 var rounds=Array.from({length:LAST-FIRST+1},function(_,i){return LAST-i;});
 var controls=node(doc,'div',null,'wp-controls'),list=node(doc,'fieldset',null,'wp-selection'),preview=node(doc,'div',null,'wp-preview'),status=node(doc,'p'),title=node(doc,'h2','오답·별표 PDF 다운로드'),close=button(doc,'닫기',stop),problem=button(doc,'문제지 PDF',function(){printNow('questions');}),explanation=button(doc,'해설지 PDF',function(){printNow('explanations');});
 dialog.setAttribute('aria-label','오답·별표 PDF 다운로드');status.setAttribute('role','status');
 function current(){return alive&&dialog.isConnected&&session(api)===owner;}
 function valid(g){if(!current()||g!==token)throw error('cancelled');}
 function clearPreview(){if(frame){frame.src='about:blank';frame.remove();frame=null;frameMode=null;}urls.forEach(function(u){root.URL.revokeObjectURL(u);});urls=[];preview.replaceChildren();}
 function stop(){if(!alive)return;alive=false;token++;requests.clear();snapshots.clear();clearPreview();if(off)off();if(offReset)offReset();root.removeEventListener('hashchange',stop);dialog.remove();if(active&&active.stop===stop)active=null;if(lastFocus?.isConnected)lastFocus.focus();}
 function fits(sheet){return sheet&&sheet.scrollHeight<=sheet.clientHeight+2&&sheet.scrollWidth<=sheet.clientWidth+2;}
 async function bounded(p){var timer;try{return await Promise.race([p,new Promise(function(_,reject){timer=setTimeout(function(){reject(error('timeout'));},20000);})]);}finally{clearTimeout(timer);}}
 function ready(){return selected.size&&Array.from(selected).every(function(r){return snapshots.has(r);});}
 function pumpCounts(){while(current()&&countActive<4&&countQueue.length){countActive++;countQueue.shift()().finally(function(){countActive--;pumpCounts();});}}
 function queueCount(fn){return new Promise(function(resolve,reject){countQueue.push(async function(){try{resolve(await fn());}catch(e){reject(e);}});pumpCounts();});}
 function updateButtons(){problem.disabled=explanation.disabled=busy||!ready();}
 function update(){updateButtons();status.textContent=selected.size?selected.size+'개 회차 선택 · 오답·미응답·저장된 별표를 중복 없이 한 파일로 만듭니다.':'PDF로 받을 회차를 선택해 주세요.';}
 async function loadCount(r){
   var ui=roundUI.get(r),request={},raw;
   requests.set(r,request);ui.count.textContent='로딩 중…';ui.retry.hidden=true;
   function check(){if(!current()||requests.get(r)!==request)throw error('cancelled');}
   try{
     var material=await collect(api,[r],check,async function(round){raw=await queueCount(function(){check();return bounded(api.cbt('GET','/api/v1/cbt/worksheet-materials/'+round));});return raw;});
     check();snapshots.set(r,raw);ui.count.textContent=material.items.length+'문항';
   }catch(e){
     if(!current()||requests.get(r)!==request)return;
     ui.count.textContent='조회 실패';ui.retry.hidden=false;
   }finally{if(current()&&requests.get(r)===request){requests.delete(r);updateButtons();}}
 }
 function selectRound(r,on){
   var ui=roundUI.get(r);ui.input.checked=on;
   if(on===selected.has(r))return;
   if(on){
     selected.add(r);
     if(snapshots.has(r))ui.count.textContent=snapshots.get(r).items.length+'문항';
     else loadCount(r);
   }else{
     selected.delete(r);requests.delete(r);ui.count.textContent='';ui.retry.hidden=true;
   }
 }
 function selectAll(on){if(busy||!current())return;clearPreview();rounds.forEach(function(r){selectRound(r,on);});update();}
 controls.append(title,close);list.appendChild(node(doc,'legend','PDF로 받을 회차'));
 rounds.forEach(function(r){
   var label=node(doc,'label'),c=node(doc,'input'),count=node(doc,'span'),retry=button(doc,'다시 시도',function(){if(current()&&!busy&&selected.has(r)&&!requests.has(r))loadCount(r);});
   c.type='checkbox';c.value=String(r);retry.hidden=true;retry.setAttribute('aria-label','제'+r+'회 다시 시도');count.setAttribute('aria-live','polite');
   c.onchange=function(){if(busy||!current())return;clearPreview();selectRound(r,c.checked);update();};
   roundUI.set(r,{input:c,count:count,retry:retry});label.append(c,doc.createTextNode('제'+r+'회 '),count);list.append(label,retry);
 });
 dialog.append(controls,node(doc,'p','회차를 고르면 한 번이라도 틀렸거나 제출 시 답하지 않은 문제, 저장된 별표 문제를 모아 문제지 또는 해설지로 만듭니다. 정답표는 해설지 맨 앞에만 나옵니다.'),button(doc,'전체 회차 선택',function(){selectAll(true);}),button(doc,'선택 해제',function(){selectAll(false);}),list,problem,explanation,status,preview);
 doc.body.appendChild(dialog);dialog.addEventListener('cancel',function(e){e.preventDefault();stop();});dialog.showModal();close.focus();root.addEventListener('hashchange',stop);off=api.onChange(function(){if(session(api)!==owner)stop();});offReset=root.HanqLearningReset?.onChange?.(stop);active={stop:stop};
 if(rounds.includes(options.round)){selectRound(options.round,true);update();}else update();
 var publicManifest=null;
 function officialName(meta){
   var q=meta.q,source=q.exam<70?root.HANQ_CBT_EXPLANATIONS_67_69:q.exam===80?root.HANQ_CBT_EXPLANATIONS_80:root.HANQ_CBT_EXPLANATIONS;
   var pinned=source?.items?.[q.questionId];
   if(!pinned||pinned.v!==q.version||pinned.exam!==q.exam||pinned.number!==q.number||pinned.answer!==q.review.correctNumber)return null;
   if(meta.common){var ns=q.common.questionNumbers;if(q.exam!==72||ns.join(',')!=='47,48')return null;return '72-common47-48.webp';}
   return q.exam+'-'+String(q.number).padStart(2,'0')+'.webp';
 }
 async function readPublicOriginal(meta,g){
   // An authenticated finalized record gates this lookup; accept only the exact
   // published exam version and checksum-verified same-origin official crop.
   var name=officialName(meta),crypto=root.crypto?.subtle;
   if(!name||!crypto||typeof root.fetch!=='function')throw error('image');
   if(!publicManifest)publicManifest=bounded(root.fetch('media/cbt-originals/manifest.json',{redirect:'error',cache:'no-store'})).then(function(r){if(!r.ok)throw error('image');return bounded(r.json());}).catch(function(e){publicManifest=null;throw e;});
   var m=await publicManifest,expected=m?.files?.[name];valid(g);if(!/^[a-f0-9]{64}$/.test(expected||''))throw error('image');
   var response=await bounded(root.fetch('media/cbt-originals/'+name,{redirect:'error'}));valid(g);
   if(!response.ok||(response.headers.get('content-type')||'').split(';')[0]!=='image/webp')throw error('image');
   var bytes=await bounded(response.arrayBuffer());valid(g);
   var digest=Array.from(new Uint8Array(await crypto.digest('SHA-256',bytes)),function(x){return x.toString(16).padStart(2,'0');}).join('');
   if(digest!==expected)throw error('image');
   return new root.Blob([bytes],{type:'image/webp'});
 }
 function mayRecover(e){
   if(e?.status===401||e?.status===403)return false;
   return [404,502,504].includes(e?.status)||e?.code==='invalid_image_response'||e?.code==='image_decode'||e?.code==='timeout'||e?.status===503&&['asset_unavailable','asset_check_timeout'].includes(e?.code);
 }
 async function decoded(blob,g){
   if(!blob||!/^image\/(png|jpeg|webp)$/.test(blob.type)||!blob.size)throw error('image_decode');
   var url=root.URL.createObjectURL(blob),img=new root.Image();urls.push(url);
   try{
     await bounded(new Promise(function(res,rej){img.onload=res;img.onerror=function(){rej(error('image_decode'));};img.src=url;}));valid(g);
     if(!img.naturalWidth||!img.naturalHeight)throw error('image_decode');
     return {url:url,ratio:img.naturalHeight/img.naturalWidth};
   }catch(e){root.URL.revokeObjectURL(url);urls=urls.filter(function(v){return v!==url;});throw e;}
 }
 async function loadPicture(path,meta,g){
   try{var b=await bounded(api.cbtImage(path));valid(g);return await decoded(b,g);}
   catch(e){valid(g);if(!mayRecover(e))throw e;var fallback=await readPublicOriginal(meta,g);return decoded(fallback,g);}
 }
 async function printNow(mode){
   if(busy||!current()||!ready())return;
   var g=++token;busy=true;clearPreview();dialog.querySelectorAll('input,button').forEach(function(e){if(e!==close)e.disabled=true;});
   status.textContent='선택한 회차의 기록을 확인하고 있어요…';
   var completed=false;
   try{
     if(Array.from(selected).some(function(r){return r<70;})){await loadEarlyExplanations();valid(g);}
     var material=await collect(api,Array.from(selected),function(){valid(g);},function(r){return snapshots.get(r);});valid(g);
     var choice=material.items,pending=material.pendingCount?' 완료 기록이 없는 별표 '+material.pendingCount+'개는 제출 후 이용할 수 있어요.':'';
     if(!choice.length){status.textContent='선택한 회차에 PDF로 받을 문제 기록이 없어요.'+pending;return;}
     var writer=await loadPdfWriter();valid(g);
     var paths=new Map(),pictures=new Map();
     if(mode==='questions')choice.forEach(function(q){if(q.common)paths.set(q.common.image,{q:q,common:true});paths.set(q.image,{q:q,common:false});});
     await parallel(Array.from(paths),async function(pair){
       var path=pair[0],q=pair[1].q;
       try{valid(g);var image=await loadPicture(path,pair[1],g);valid(g);pictures.set(path,image);status.textContent='원본 준비 '+pictures.size+' / '+paths.size;}
       catch(e){valid(g);var failed=error(e?.status===401||e?.status===403?'login':'original');failed.exam=q.exam;failed.number=q.number;throw failed;}
     },5);
     valid(g);status.textContent=choice.length+'문항 PDF를 만들고 있어요…';
     var pdf=await writer.create(root,choice,pictures,mode,function(){valid(g);});valid(g);
     if(!pdf||pdf.type!=='application/pdf'||!pdf.size)throw error('pdf_writer');
     urls.forEach(function(u){root.URL.revokeObjectURL(u);});urls=[];
     var pdfUrl=root.URL.createObjectURL(pdf),link=node(doc,'a',mode==='questions'?'문제지 PDF 파일 다시 받기':'해설지 PDF 파일 다시 받기','tool-btn');
     urls.push(pdfUrl);link.href=pdfUrl;link.download=mode==='questions'?'한국사_오답·별표_문제지.pdf':'한국사_오답·별표_해설지.pdf';preview.appendChild(link);
     completed=true;status.textContent=choice.length+'문항 PDF가 준비됐어요.'+pending+' 저장 화면이 뜨지 않으면 아래 링크를 눌러 주세요.';
     link.click();
   }catch(e){
     if(current()&&e.code==='changed'){
       snapshots.clear();selected.forEach(function(r){var ui=roundUI.get(r);ui.count.textContent='기록 변경';ui.retry.hidden=false;});
     }
     if(current()){token++;clearPreview();status.textContent=e.code==='login'?'로그인 상태를 확인해 주세요.':e.code==='not_ready'?'오답·별표 문제지 서버가 아직 준비되지 않았어요.':e.code==='materials_http'||e.code==='materials_shape'?'제'+e.round+'회 문제 기록을 확인하지 못했어요. 다시 시도해 주세요.':e.code==='changed'?'학습 기록 상태가 바뀌었어요. 다시 시도해 주세요.':e.code==='overflow'?'페이지 배치를 확인하지 못했어요. 다시 시도해 주세요.':e.code==='original'?'제'+e.exam+'회 '+e.number+'번 원본을 불러오지 못했어요. 빠짐없는 문제지를 만들기 위해 중단했어요.':'PDF를 만들지 못했어요. 다시 시도해 주세요.';}
   }finally{
     busy=false;if(current()){dialog.querySelectorAll('input,button').forEach(function(e){e.disabled=false;});updateButtons();if(completed)(mode==='questions'?problem:explanation).focus();}
   }
 }
 return {ready:Promise.resolve(),stop:stop};
}
root.HanqCbtWrongPrint={open:open,collect:collect,worksheetRows:worksheetRows,renderSheet:renderSheet};
})(window);
