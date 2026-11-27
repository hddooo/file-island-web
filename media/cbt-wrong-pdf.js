/* Signed-in CBT PDFs: saved wrong materials or the complete published round explanation. No user writes. */
(function(root){'use strict';
var PAGE={width:595.28,height:841.89,margin:36,bottom:800,scale:2};
  function hex(text) {
    var value = 'FEFF';
    for (var i = 0; i < text.length; i++) value += text.charCodeAt(i).toString(16).padStart(4, '0');
    return value;
  }
  function ascii(value) { return new TextEncoder().encode(value); }
  function number(value) { return Number(value).toFixed(3).replace(/\.?0+$/, '') || '0'; }
  // JPEG pages preserve the browser's Korean typography. ActualText keeps the
  // exact Unicode source available to PDF text extraction and copy tools.
  function pdf(pages, title) {
    var parts = [], offsets = [0], length = 0, objects = 7 + pages.length * 3;
    function append(value) { var bytes = typeof value === 'string' ? ascii(value) : value; parts.push(bytes); length += bytes.byteLength; }
    function object(index, body) { offsets[index] = length; append(index + ' 0 obj\n'); append(body); append('\nendobj\n'); }
    append('%PDF-1.7\n%HanQ-private-practice\n');
    object(1, '<< /Type /Catalog /Pages 2 0 R /Lang (ko-KR) >>');
    object(2, '<< /Type /Pages /Count ' + pages.length + ' /Kids [' + pages.map(function (_, i) { return (8 + i * 3) + ' 0 R'; }).join(' ') + '] >>');
    object(3, '<< /Type /Font /Subtype /Type0 /BaseFont /HanQText /Encoding /Identity-H /DescendantFonts [4 0 R] /ToUnicode 5 0 R >>');
    object(4, '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /HanQText /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /DW 1000 /CIDToGIDMap /Identity /FontDescriptor 6 0 R >>');
    var cmap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /HanQUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n1 beginbfrange\n<0000> <FFFF> <0000>\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend end\n';
    object(5, '<< /Length ' + ascii(cmap).byteLength + ' >>\nstream\n' + cmap + 'endstream');
    // Text is invisible (3 Tr); the visual glyphs are already on the JPEG page.
    // ToUnicode also works in readers that ignore marked-content ActualText.
    object(6, '<< /Type /FontDescriptor /FontName /HanQText /Flags 32 /FontBBox [-1000 -1000 3000 3000] /ItalicAngle 0 /Ascent 1000 /Descent -250 /CapHeight 1000 /StemV 80 >>');
    object(7, '<< /Title <' + hex(title) + '> /Creator (HanQ Practice) >>');
    pages.forEach(function (page, i) {
      var pageId = 8 + i * 3, imageId = pageId + 1, streamId = pageId + 2;
      object(pageId, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PAGE.width + ' ' + PAGE.height + '] /Resources << /XObject << /Im0 ' + imageId + ' 0 R >> /Font << /F1 3 0 R >> >> /Contents ' + streamId + ' 0 R >>');
      offsets[imageId] = length;
      append(imageId + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + page.width + ' /Height ' + page.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + page.bytes.byteLength + ' >>\nstream\n');
      append(page.bytes); append('\nendstream\nendobj\n');
      var content = 'q ' + PAGE.width + ' 0 0 ' + PAGE.height + ' 0 0 cm /Im0 Do Q\n';
      page.lines.forEach(function (line) {
        if (!line.text.trim()) return;
        var count = Math.max(1, line.text.length), scale = line.width / (line.size * count) * 100;
        content += '/Span << /ActualText <' + hex(line.text) + '> >> BDC\nBT /F1 ' + number(line.size) + ' Tf 3 Tr ' + number(scale) + ' Tz 1 0 0 1 ' + number(line.x) + ' ' + number(PAGE.height - line.y) + ' Tm <' + hex(line.text).slice(4) + '> Tj ET\nEMC\n';
      });
      var bytes = ascii(content);
      object(streamId, '<< /Length ' + bytes.byteLength + ' >>\nstream\n' + content + 'endstream');
    });
    var xref = length;
    append('xref\n0 ' + (objects + 1) + '\n0000000000 65535 f \n');
    for (var i = 1; i <= objects; i++) append(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    append('trailer\n<< /Size ' + (objects + 1) + ' /Root 1 0 R /Info 7 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }

function fail(code){var e=new Error(code);e.code=code;return e;}
function identity(api){var s=api&&api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId!=null?String(s.ownerId)+':'+String(s.epoch||0):null;}
// Use exactly the reviewed public-exam versions already bundled with the study app.
function fullRoundItems(round){
 var renderer=root.HanqCbtExplanations,source=round<70?root.HANQ_CBT_EXPLANATIONS_67_69:round===80?root.HANQ_CBT_EXPLANATIONS_80:root.HANQ_CBT_EXPLANATIONS;
 if(!renderer||typeof renderer.reviewParts!=='function'||typeof renderer.resolve!=='function'||!source||!source.items)throw fail('explanations_incomplete');
 return Array.from({length:50},function(_,i){
  var n=i+1,id='exam-'+round+'-'+String(n).padStart(2,'0'),item=source.items[id];
  if(!item||item.id!==id||item.exam!==round||item.number!==n||!item.v||!Number.isInteger(item.answer)||item.answer<1||item.answer>5||
    !Array.isArray(item.options)||item.options.length!==5||item.options.some(function(o,j){return !o||typeof o.id!=='string'||!o.id||o.number!==j+1||typeof o.text!=='string'||o.correct!==(j===item.answer-1)||!Array.isArray(o.review)||!o.review.some(function(r){return typeof r==='string'&&r.trim();});})||
    new Set(item.options.map(function(o){return o.id;})).size!==5)throw fail('explanations_incomplete');
  var q={questionId:id,version:item.v,exam:round,number:n,points:item.points,position:i,selectedOptionId:null,options:item.options,
    review:{item:item,status:'unanswered',correctNumber:item.answer,correctOptionId:item.options[item.answer-1].id,options:item.options}};
  var parts=renderer.resolve(q,'final')===item&&renderer.reviewParts(q,'final');
  if(!parts||!parts.stem.length||!parts.conclusion||!parts.answer)throw fail('explanations_incomplete');
  return {number:n,answer:item.answer,options:item.options,parts:parts};
 });
}
async function download(options){
 options=options||{};var api=options.api,round=options.round,mode=options.mode||'questions',material=options.source==='review-materials',full=options.source==='full-round',itemsMode=options.source==='items',seq=new Map(),lab=function(q){return itemsMode?String(seq.get(q)):String(q.number);},origin=function(q){return itemsMode?'('+q.exam+'회-'+q.number+'번)':'';},token=identity(api),urls=[],off=null,cancelled=false,pages=[],canvas,context,y,lines=[],count=0,cols=false,col=0,colTop=46,pageCols=null,GAP=16;
 if(!['questions','answers'].includes(mode)||full&&mode!=='answers')throw fail('invalid_mode');if(!token)throw fail('session_changed');if(itemsMode?(!Array.isArray(options.items)||!options.items.length||options.items.length>700||typeof options.title!=='string'||!/^[^\\/:*?"<>|]+\.pdf$/.test(options.filename||'')):(!Number.isInteger(round)||round<67||round>80))throw fail(itemsMode?'invalid_items':'invalid_round');
 function current(){if(cancelled||options.isCurrent&&!options.isCurrent())throw fail('cancelled');if(identity(api)!==token)throw fail('session_changed');}
 if(api.onChange)off=api.onChange(function(){if(identity(api)!==token)cancelled=true;});
 function release(url){root.URL.revokeObjectURL(url);urls=urls.filter(function(x){return x!==url;});}
 async function bounded(promise){var timer;try{return await Promise.race([promise,new Promise(function(_,reject){timer=setTimeout(function(){reject(fail('read_timeout'));},20000);})]);}finally{clearTimeout(timer);}}
 async function picture(path){current();var blob=await bounded(api.cbtImage(path));current();if(!blob||!/^image\/(webp|png|jpeg)$/.test(blob.type)||!blob.size)throw fail('image_unavailable');var url=root.URL.createObjectURL(blob);urls.push(url);var img=new root.Image();try{await bounded(new Promise(function(resolve,reject){img.onload=resolve;img.onerror=function(){reject(fail('image_unavailable'));};img.src=url;}));current();if(!img.naturalWidth||!img.naturalHeight)throw fail('image_unavailable');return img;}finally{release(url);}}
 function newPage(){canvas=root.document.createElement('canvas');canvas.width=Math.round(PAGE.width*PAGE.scale);canvas.height=Math.round(PAGE.height*PAGE.scale);context=canvas.getContext('2d');if(!context)throw fail('pdf_unavailable');context.scale(PAGE.scale,PAGE.scale);context.fillStyle='#fff';context.fillRect(0,0,PAGE.width,PAGE.height);context.fillStyle='#111';context.font='bold 12px Arial, sans-serif';var title=itemsMode?options.title:full?'한국사능력검정시험 심화 · 제'+round+'회 전체 해설지':'제'+round+'회 · '+(material?'오답 · 별표 ':'누적 오답 ')+(mode==='answers'?'정답·해설':'문제');context.fillText(title,PAGE.margin,30);lines=[{text:title,x:PAGE.margin,y:30,width:context.measureText(title).width,size:12}];y=46;col=0;colTop=46;pageCols=cols?46:null;}
 // 실전 시험지처럼 2단으로 채운다: 왼쪽 단이 차면 오른쪽 단, 오른쪽도 차면 다음 쪽.
 function colW(){return cols?(PAGE.width-PAGE.margin*2-GAP)/2:PAGE.width-PAGE.margin*2;}
 function colX(){return PAGE.margin+(cols&&col?colW()+GAP:0);}
 function startColumns(){cols=true;col=0;y+=6;colTop=y;pageCols=y;}
 async function nextSlot(){if(cols&&col===0){col=1;y=colTop;return;}await finishPage();newPage();}
 async function finishPage(){if(!canvas)return;current();if(pageCols!=null&&context.beginPath){context.strokeStyle='#999';context.lineWidth=.6;context.beginPath();context.moveTo(PAGE.width/2,pageCols-2);context.lineTo(PAGE.width/2,PAGE.bottom);context.stroke();}context.fillStyle='#555';context.font='10px Arial, sans-serif';context.fillText(String(pages.length+1),PAGE.width/2,824);var b=await bounded(new Promise(function(resolve,reject){canvas.toBlob(function(v){v?resolve(v):reject(fail('pdf_unavailable'));},'image/jpeg',.94);}));current();pages.push({bytes:new Uint8Array(await b.arrayBuffer()),width:canvas.width,height:canvas.height,lines:lines});canvas=null;}
 // 원본 자르기 아래쪽의 빈 여백은 빼고 배치한다(빈칸 때문에 다음 문제가 다음 쪽으로 밀리지 않게).
 function inkHeight(img){try{var w=Math.min(400,img.naturalWidth),h=Math.max(1,Math.round(img.naturalHeight*w/img.naturalWidth)),c=root.document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');x.drawImage(img,0,0,w,h);var d=x.getImageData(0,0,w,h).data;for(var r=h-1;r>0;r--){for(var i=r*w*4,e=i+w*4;i<e;i+=4)if(d[i]<235||d[i+1]<235||d[i+2]<235)return img.naturalHeight*Math.min(1,(r+4)/h);}}catch(_){}return img.naturalHeight;}
 // 번호는 이 PDF 안의 일련번호로 크게, 원래 회차·번호는 그 아래 작게 남긴다.
 function small(text,x,yy){context.fillStyle='#666';context.font='8px Arial, sans-serif';context.fillText(text,x,yy);lines.push({text:text,x:x,y:yy,width:context.measureText(text).width,size:8});context.fillStyle='#111';}
 async function draw(img,label,sub){var head=sub?28:16,sh=inkHeight(img),width=colW(),height=width*sh/img.naturalWidth,max=PAGE.bottom-colTop-head-6;if(height>max){width*=max/height;height=max;}
  // 남은 칸에 80% 이상 크기로 들어가면 살짝 줄여 같은 단에 넣는다.
  var room=PAGE.bottom-y-head-6;if(height>room&&y>colTop){if(cols&&room>=height*.8){width*=room/height;height=room;}else await nextSlot();}
  var x=colX(),ls=sub?14:10;context.fillStyle='#111';context.font='bold '+ls+'px Arial, sans-serif';context.fillText(label,x,y+ls);lines.push({text:label,x:x,y:y+ls,width:context.measureText(label).width,size:ls});if(sub)small(sub,x,y+ls+11);y+=head;context.drawImage(img,0,0,img.naturalWidth,sh,x,y,width,height);y+=height+12;}

 // 여러 회차를 섞은 PDF는 시대 순(선사→삼국→남북국→고려→조선 전기→조선 후기→개항기→일제→현대, 통합 문제는 끝)으로 놓고 1번부터 다시 매긴다.
 var ERA=['prehistory','samguk','nambuk','goryeo','joseon-early','joseon-late','opening','colonial','modern','comprehensive'],CUT=[4,9,12,19,25,30,38,45,50];
 async function eraOrder(list){var E=root.HanqCbtExplanations;if(E&&E.loadStudy){try{await bounded(E.loadStudy(api,list.map(function(x){return x.exam;})));}catch(_){}current();}
  function rank(q){var s=null;try{s=E&&E.studyFor&&E.studyFor(q);}catch(_){}var r=s?ERA.indexOf(s.era):-1;if(r>=0)return r;for(var i=0;i<CUT.length;i++)if(q.number<=CUT[i])return i;return ERA.length;}
  var out=list.map(function(q,i){return {q:q,r:rank(q),i:i};}).sort(function(a,b){return a.r-b.r||a.q.number-b.q.number||a.q.exam-b.q.exam||a.i-b.i;}).map(function(x){return x.q;});
  out.forEach(function(q,i){seq.set(q,i+1);});return out;}
 function clean(value){return typeof value==='string'?value.replace(/\*\*/g,'').replace(/\s+/g,' ').trim():'';}
 // **키워드** 는 해설 화면처럼 굵은 파란 글씨로 찍는다(줄 전체가 굵은 줄이면 검정 굵게). 짝이 안 맞으면 기호만 지운다.
 async function textLine(value,size,bold,opt){opt=opt||{};current();if(typeof value!=='string')return;var src=value.replace(/\s+/g,' ').trim();if(!clean(src))return;
  var segs=(src.match(/\*\*/g)||[]).length%2?[{t:clean(src),b:!!bold}]:src.split('**').map(function(t,i){return {t:t,b:!!bold||i%2===1,k:!bold&&i%2===1};}).filter(function(s){return s.t;});
  var width=colW()-(opt.indent||0),lh=cols?Math.round(size*14)/10:size+5,line=[],lineW=0;function font(b){return (b?'bold ':'')+size+'px Arial, sans-serif';}
  for(var s of segs){for(var ch of s.t){context.font=font(s.b);var w=context.measureText(ch).width;if(lineW+w>width&&line.length){await emit(line);line=[];lineW=0;if(ch===' ')continue;}var last=line[line.length-1];if(last&&last.b===s.b&&last.k===s.k)last.t+=ch;else line.push({t:ch,b:s.b,k:s.k});lineW+=w;}}
  if(line.length)await emit(line);
  async function emit(parts){if(y+lh+1>PAGE.bottom)await nextSlot();y+=lh;var x0=colX()+(opt.indent||0),x=x0,text='';if(opt.bg){context.fillStyle=opt.bg;context.fillRect(colX()-2,y-size-1,colW()+4,lh);}
   for(var p of parts){context.font=font(p.b);context.fillStyle=p.k?'#1555a0':opt.color||'#111';context.fillText(p.t,x,y);x+=context.measureText(p.t).width;text+=p.t;}
   context.fillStyle='#111';lines.push({text:text,x:x0,y:y,width:x-x0,size:size});}
 }
 // 정답표: 번호 칸 위에 작은 번호, 아래에 큰 정답 기호(실전 OMR 표처럼).
 async function answerGrid(items){var per=10,w=(PAGE.width-PAGE.margin*2)/per,h=30;y+=6;for(var i=0;i<items.length;i++){if(i%per===0&&i){y+=h;}if(i%per===0&&y+h>PAGE.bottom){await finishPage();newPage();}var cx=PAGE.margin+(i%per)*w,q=items[i],n=lab(q),a='①②③④⑤'[q.review.correctNumber-1];context.fillStyle=i%2?'#fff':'#f4f6f9';context.fillRect(cx,y,w,h);context.strokeStyle='#9aa3ad';context.lineWidth=.6;context.strokeRect(cx,y,w,h);context.fillStyle='#666';context.font='8px Arial, sans-serif';context.fillText(n,cx+w/2-context.measureText(n).width/2,y+10);context.fillStyle='#b3261e';context.font='bold 14px Arial, sans-serif';context.fillText(a,cx+w/2-context.measureText(a).width/2,y+25);lines.push({text:n+' '+a,x:cx+4,y:y+25,width:w-8,size:10});}y+=h+4;}
 // 문항 머리: 옅은 띠 위에 큰 번호 · 빨간 정답 · 작은 (회-번).
 async function itemHead(q,ans){if(y+60>PAGE.bottom)await nextSlot();y+=4;var x=colX(),n=lab(q)+'.',a='정답 '+'①②③④⑤'[ans-1],o=origin(q);context.fillStyle='#e8edf4';context.fillRect(x-2,y,colW()+4,19);context.fillStyle='#111';context.font='bold 13px Arial, sans-serif';context.fillText(n,x+2,y+14.5);var nx=x+2+context.measureText(n).width+8;lines.push({text:n,x:x+2,y:y+14.5,width:nx-x-10,size:13});context.fillStyle='#b3261e';context.font='bold 11px Arial, sans-serif';context.fillText(a,nx,y+14);var ox=nx+context.measureText(a).width+8;lines.push({text:a,x:nx,y:y+14,width:ox-nx-8,size:11});if(o)small(o,ox,y+13.5);context.fillStyle='#111';y+=21;}
 // 구역 제목: 진한 작은 꼬리표.
 async function tag(text){var lh=14;if(y+lh+12>PAGE.bottom)await nextSlot();y+=3;var x=colX();context.font='bold 8px Arial, sans-serif';var w=context.measureText(text).width+8;context.fillStyle='#3b4a5c';context.fillRect(x,y+2,w,11);context.fillStyle='#fff';context.fillText(text,x+4,y+10.5);lines.push({text:text,x:x+4,y:y+10.5,width:w-8,size:8});context.fillStyle='#111';y+=lh;}
 async function answers(items){await textLine('정답 한눈에 보기',13,true);
  await answerGrid(items);
  y+=12;await textLine(itemsMode?'해설':'간결 해설',13,true);startColumns();
  if(root.HanqCbtExplanations&&root.HanqCbtExplanations.loadStudy){try{await bounded(root.HanqCbtExplanations.loadStudy(api,items.map(function(x){return x.exam;})));}catch(_){}current();}
  for(var q of items){current();var studied=root.HanqCbtExplanations&&root.HanqCbtExplanations.studyFor&&root.HanqCbtExplanations.studyFor(q);if(studied){await itemHead(q,studied.answer);await tag('지문 분석');for(var sl of studied.passage)await textLine('· '+sl,8.5,false);if(typeof studied.gist==='string'&&studied.gist.trim())await textLine('핵심 요지: '+studied.gist,8.5,false);await tag('보기 분석');for(var so of studied.options){var ok=so.number===studied.answer;await textLine('①②③④⑤'[so.number-1]+(ok?' 정답  ':' ')+(so.keyword||''),8.5,ok,ok?{bg:'#e3f3e6',color:'#0b6b2e'}:{});if(so.memo)await textLine(so.memo,8,false,{indent:10,color:'#444'});}var stips=Array.isArray(studied.tips)?studied.tips.filter(function(x){return typeof x==='string'&&x.trim();}):[];if(stips.length){await tag('Tip');for(var st of stips)await textLine('· '+st,8.5,false);if(studied.flow)await textLine('흐름: '+studied.flow,8.5,false);}else if(studied.flow){await tag('결론');await textLine(studied.flow,8.5,false);}y+=10;count++;if(options.onProgress)options.onProgress({done:count,total:items.length});continue;}var verified=root.HanqCbtExplanations&&root.HanqCbtExplanations.resolve(q,'final'),saved=verified||q.review.item||{},overview=verified&&root.HanqCbtExplanations.groundedOverview?root.HanqCbtExplanations.groundedOverview(verified):saved.overview||{},parts=[];
   if(Array.isArray(overview.reason))parts=overview.reason.map(clean).filter(Boolean).slice(0,2);
   var answer=clean(overview.answer);if(answer&&parts.indexOf(answer)<0)parts.push(answer);
   if(!parts.length&&Array.isArray(saved.options)){var correct=saved.options[q.review.correctNumber-1];if(correct&&Array.isArray(correct.review))parts=correct.review.map(clean).filter(Boolean).slice(0,2);}
   await itemHead(q,q.review.correctNumber);
   await textLine(parts.length?parts.join(' '):'확인된 해설 없음. 정답은 채점 기록 기준입니다.',8.5,false);
   y+=8;count++;if(options.onProgress)options.onProgress({done:count,total:items.length});
  }
 }
 async function fullAnswers(items){
  await textLine('정답 한눈에 보기',13,true);
  for(var i=0;i<items.length;i+=10){await textLine(items.slice(i,i+10).map(function(q){return q.number+'. '+q.answer;}).join('  |  '),10,true);}
  y+=12;
  for(var q of items){
   current();
   // Size the whole question using the same font and wrapping as textLine.
   var content=[[q.number+'번 · 정답 '+q.answer+'번',13,true],['지문 해설',11,true]];
   q.parts.stem.forEach(function(t){content.push([t,10,false]);});
   content.push(['보기별 해설',11,true]);
   q.options.forEach(function(o,j){
    o.review.map(clean).filter(Boolean).forEach(function(t,k){content.push([(k?'':'①②③④⑤'[j]+(o.correct?' 정답 · ':' '))+t,10,o.correct]);});
   });
   content.push(['결론',11,true],[q.parts.answer,10,true],[q.parts.conclusion,10,false]);
   q.parts.extra.forEach(function(t){content.push([t,10,false]);});
   var height=content.reduce(function(sum,line){
    context.font=(line[2]?'bold ':'')+line[1]+'px Arial, sans-serif';
    var n=1,buffer='';
    for(var ch of clean(line[0])){if(context.measureText(buffer+ch).width>PAGE.width-PAGE.margin*2&&buffer){n++;buffer='';}buffer+=ch;}
    return sum+n*(line[1]+5);
   },0);
   if(y+height+6>PAGE.bottom&&y>46){await finishPage();newPage();}
   for(var line of content)await textLine(line[0],line[1],line[2]);
   y+=13;count++;if(options.onProgress)options.onProgress({done:count,total:items.length});
  }
 }
 function save(title,filename,pendingStarCount){
  current();var url=root.URL.createObjectURL(pdf(pages,title));urls.push(url);
  var a=root.document.createElement('a');a.href=url;a.download=filename;a.hidden=true;root.document.body.appendChild(a);
  try{current();a.click();}finally{a.remove();}
  setTimeout(function(){release(url);},60000);urls=urls.filter(function(u){return u!==url;});
  return {filename:filename,count:count,pages:pages.length,pendingStarCount:pendingStarCount||0};
 }
 try{current();if(itemsMode){var picked=await eraOrder(options.items);newPage();if(mode==='answers')await answers(picked);else{startColumns();var shared=new Set();for(var it of picked){current();if(it.common){var ck=JSON.stringify([it.exam,it.common.questionNumbers]);if(!shared.has(ck)){await draw(await picture(it.common.image),'공통 자료','('+it.exam+'회-'+it.common.questionNumbers.join('·')+'번)');shared.add(ck);}}await draw(await picture(it.image),lab(it)+'.',origin(it));count++;if(options.onProgress)options.onProgress({done:count,total:picked.length});}}await finishPage();return save(options.title,options.filename,0);}if(full){var fullItems=fullRoundItems(round);newPage();await fullAnswers(fullItems);await finishPage();return save('한국사 제'+round+'회 전체 해설지','한국사_'+round+'회_전체_해설지.pdf',0);}var data=await bounded(api.cbt('GET',material?'/api/v1/cbt/review-materials/'+round:'/api/v1/cbt/notebook'));current();var result;try{result=material?root.HanqCbtRoundMaterials.normalize(data,round):root.HanqCbtWrongNotebook.normalize(data);}catch(e){throw fail('notebook_incomplete');}if(result.rejected||result.hasMore)throw fail('notebook_incomplete');var items=result.items.filter(function(q){return q.exam===round;}).sort(function(a,b){return a.number-b.number;});if(!items.length)throw fail('empty');newPage();if(mode==='answers'){await answers(items);}else{startColumns();var common=new Set();for(var q of items){current();if(q.common){var key=JSON.stringify([q.exam,q.common.questionNumbers]);if(!common.has(key)){await draw(await picture(q.common.image),'공통 자료 · '+q.common.questionNumbers.join('·')+'번');common.add(key);}}await draw(await picture(q.image),String(q.number)+'.');count++;if(options.onProgress)options.onProgress({done:count,total:items.length});}}await finishPage();current();if(material){var fresh=root.HanqCbtRoundMaterials.normalize(await bounded(api.cbt('GET','/api/v1/cbt/review-materials/'+round)),round);current();if(fresh.resetAt!==result.resetAt)throw fail('notebook_incomplete');}return save('한국사 제'+round+'회 '+(material?'오답 · 별표 ':'누적 오답 ')+(mode==='answers'?'정답·해설':'문제'),'한국사_'+round+'회_'+(material?'오답_별표_':'누적오답_')+(mode==='answers'?'해설지':'문제')+'.pdf',result.pendingStarCount);
 }finally{if(off)off();urls.forEach(function(u){root.URL.revokeObjectURL(u);});}
}
root.HanqCbtWrongPdf={download:download,downloadItems:function(o){return download(Object.assign({},o,{source:'items'}));}};
})(typeof window!=='undefined'?window:globalThis);
