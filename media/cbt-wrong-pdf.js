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
 options=options||{};var api=options.api,round=options.round,mode=options.mode||'questions',material=options.source==='review-materials',full=options.source==='full-round',itemsMode=options.source==='items',lab=function(q){return itemsMode?q.exam+'회 '+q.number+'번':String(q.number);},token=identity(api),urls=[],off=null,cancelled=false,pages=[],canvas,context,y,lines=[],count=0;
 if(!['questions','answers'].includes(mode)||full&&mode!=='answers')throw fail('invalid_mode');if(!token)throw fail('session_changed');if(itemsMode?(!Array.isArray(options.items)||!options.items.length||options.items.length>700||typeof options.title!=='string'||!/^[^\\/:*?"<>|]+\.pdf$/.test(options.filename||'')):(!Number.isInteger(round)||round<67||round>80))throw fail(itemsMode?'invalid_items':'invalid_round');
 function current(){if(cancelled||options.isCurrent&&!options.isCurrent())throw fail('cancelled');if(identity(api)!==token)throw fail('session_changed');}
 if(api.onChange)off=api.onChange(function(){if(identity(api)!==token)cancelled=true;});
 function release(url){root.URL.revokeObjectURL(url);urls=urls.filter(function(x){return x!==url;});}
 async function bounded(promise){var timer;try{return await Promise.race([promise,new Promise(function(_,reject){timer=setTimeout(function(){reject(fail('read_timeout'));},20000);})]);}finally{clearTimeout(timer);}}
 async function picture(path){current();var blob=await bounded(api.cbtImage(path));current();if(!blob||!/^image\/(webp|png|jpeg)$/.test(blob.type)||!blob.size)throw fail('image_unavailable');var url=root.URL.createObjectURL(blob);urls.push(url);var img=new root.Image();try{await bounded(new Promise(function(resolve,reject){img.onload=resolve;img.onerror=function(){reject(fail('image_unavailable'));};img.src=url;}));current();if(!img.naturalWidth||!img.naturalHeight)throw fail('image_unavailable');return img;}finally{release(url);}}
 function newPage(){canvas=root.document.createElement('canvas');canvas.width=Math.round(PAGE.width*PAGE.scale);canvas.height=Math.round(PAGE.height*PAGE.scale);context=canvas.getContext('2d');if(!context)throw fail('pdf_unavailable');context.scale(PAGE.scale,PAGE.scale);context.fillStyle='#fff';context.fillRect(0,0,PAGE.width,PAGE.height);context.fillStyle='#111';context.font='bold 12px Arial, sans-serif';var title=itemsMode?options.title:full?'한국사능력검정시험 심화 · 제'+round+'회 전체 해설지':'제'+round+'회 · '+(material?'오답 · 별표 ':'누적 오답 ')+(mode==='answers'?'정답·해설':'문제');context.fillText(title,PAGE.margin,30);lines=[{text:title,x:PAGE.margin,y:30,width:context.measureText(title).width,size:12}];y=46;}
 async function finishPage(){if(!canvas)return;current();context.fillStyle='#555';context.font='10px Arial, sans-serif';context.fillText(String(pages.length+1),PAGE.width/2,824);var b=await bounded(new Promise(function(resolve,reject){canvas.toBlob(function(v){v?resolve(v):reject(fail('pdf_unavailable'));},'image/jpeg',.94);}));current();pages.push({bytes:new Uint8Array(await b.arrayBuffer()),width:canvas.width,height:canvas.height,lines:lines});canvas=null;}
 async function draw(img,label){var width=PAGE.width-PAGE.margin*2,height=width*img.naturalHeight/img.naturalWidth,max=PAGE.bottom-64;if(height>max){width*=max/height;height=max;}if(y+height+22>PAGE.bottom&&y>46){await finishPage();newPage();}context.fillStyle='#111';context.font='bold 10px Arial, sans-serif';context.fillText(label,PAGE.margin,y+11);lines.push({text:label,x:PAGE.margin,y:y+11,width:context.measureText(label).width,size:10});y+=18;context.drawImage(img,PAGE.margin,y,width,height);y+=height+12;}

 function clean(value){return typeof value==='string'?value.replace(/\*\*/g,'').replace(/\s+/g,' ').trim():'';}
 // **키워드** 는 해설 화면처럼 굵은 파란 글씨로 찍는다(줄 전체가 굵은 줄이면 검정 굵게). 짝이 안 맞으면 기호만 지운다.
 async function textLine(value,size,bold){current();if(typeof value!=='string')return;var src=value.replace(/\s+/g,' ').trim();if(!clean(src))return;
  var segs=(src.match(/\*\*/g)||[]).length%2?[{t:clean(src),b:!!bold}]:src.split('**').map(function(t,i){return {t:t,b:!!bold||i%2===1,k:!bold&&i%2===1};}).filter(function(s){return s.t;});
  var width=PAGE.width-PAGE.margin*2,line=[],lineW=0;function font(b){return (b?'bold ':'')+size+'px Arial, sans-serif';}
  for(var s of segs){for(var ch of s.t){context.font=font(s.b);var w=context.measureText(ch).width;if(lineW+w>width&&line.length){await emit(line);line=[];lineW=0;if(ch===' ')continue;}var last=line[line.length-1];if(last&&last.b===s.b&&last.k===s.k)last.t+=ch;else line.push({t:ch,b:s.b,k:s.k});lineW+=w;}}
  if(line.length)await emit(line);
  async function emit(parts){if(y+size+6>PAGE.bottom){await finishPage();newPage();}y+=size+5;var x=PAGE.margin,text='';
   for(var p of parts){context.font=font(p.b);context.fillStyle=p.k?'#1555a0':'#111';context.fillText(p.t,x,y);x+=context.measureText(p.t).width;text+=p.t;}
   context.fillStyle='#111';lines.push({text:text,x:PAGE.margin,y:y,width:x-PAGE.margin,size:size});}
 }
 async function answers(items){await textLine('정답 한눈에 보기',13,true);
  for(var i=0;i<items.length;i+=(itemsMode?4:6)){await textLine(items.slice(i,i+(itemsMode?4:6)).map(function(q){return lab(q)+' '+(itemsMode?'①②③④⑤'[q.review.correctNumber-1]:q.review.correctNumber);}).join(itemsMode?'   |   ':'     |     '),11,true);}
  if(itemsMode){await finishPage();newPage();}else y+=16;await textLine(itemsMode?'해설':'간결 해설',13,true);
  if(root.HanqCbtExplanations&&root.HanqCbtExplanations.loadStudy){try{await bounded(root.HanqCbtExplanations.loadStudy(api,items.map(function(x){return x.exam;})));}catch(_){}current();}
  for(var q of items){current();var studied=root.HanqCbtExplanations&&root.HanqCbtExplanations.studyFor&&root.HanqCbtExplanations.studyFor(q);if(studied){if(y+60>PAGE.bottom){await finishPage();newPage();}await textLine(lab(q)+'. 정답 '+studied.answer,11,true);await textLine('지문 분석',10,true);for(var sl of studied.passage)await textLine('· '+sl,10,false);if(typeof studied.gist==='string'&&studied.gist.trim())await textLine('핵심 요지: '+studied.gist,10,false);await textLine('보기 분석',10,true);for(var so of studied.options){await textLine('①②③④⑤'[so.number-1]+(so.number===studied.answer?' 정답 ':' 오답 ')+(so.keyword||''),10,so.number===studied.answer);if(so.memo)await textLine('   '+so.memo,9,false);}var stips=Array.isArray(studied.tips)?studied.tips.filter(function(x){return typeof x==='string'&&x.trim();}):[];if(stips.length){await textLine('Tip',10,true);for(var st of stips)await textLine('· '+st,10,false);if(studied.flow)await textLine('흐름: '+studied.flow,10,false);}else if(studied.flow){await textLine('결론',10,true);await textLine(studied.flow,10,false);}y+=9;count++;if(options.onProgress)options.onProgress({done:count,total:items.length});continue;}var verified=root.HanqCbtExplanations&&root.HanqCbtExplanations.resolve(q,'final'),saved=verified||q.review.item||{},overview=verified&&root.HanqCbtExplanations.groundedOverview?root.HanqCbtExplanations.groundedOverview(verified):saved.overview||{},parts=[];
   if(Array.isArray(overview.reason))parts=overview.reason.map(clean).filter(Boolean).slice(0,2);
   var answer=clean(overview.answer);if(answer&&parts.indexOf(answer)<0)parts.push(answer);
   if(!parts.length&&Array.isArray(saved.options)){var correct=saved.options[q.review.correctNumber-1];if(correct&&Array.isArray(correct.review))parts=correct.review.map(clean).filter(Boolean).slice(0,2);}
   if(y+60>PAGE.bottom){await finishPage();newPage();}await textLine(lab(q)+'. 정답 '+q.review.correctNumber,11,true);
   await textLine(parts.length?parts.join(' '):'확인된 해설 없음. 정답은 채점 기록 기준입니다.',10,false);
   y+=9;count++;if(options.onProgress)options.onProgress({done:count,total:items.length});
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
 try{current();if(itemsMode){var picked=options.items;newPage();if(mode==='answers')await answers(picked);else{var shared=new Set();for(var it of picked){current();if(it.common){var ck=JSON.stringify([it.exam,it.common.questionNumbers]);if(!shared.has(ck)){await draw(await picture(it.common.image),'제'+it.exam+'회 공통 자료 · '+it.common.questionNumbers.join('·')+'번');shared.add(ck);}}await draw(await picture(it.image),lab(it)+'.');count++;if(options.onProgress)options.onProgress({done:count,total:picked.length});}}await finishPage();return save(options.title,options.filename,0);}if(full){var fullItems=fullRoundItems(round);newPage();await fullAnswers(fullItems);await finishPage();return save('한국사 제'+round+'회 전체 해설지','한국사_'+round+'회_전체_해설지.pdf',0);}var data=await bounded(api.cbt('GET',material?'/api/v1/cbt/review-materials/'+round:'/api/v1/cbt/notebook'));current();var result;try{result=material?root.HanqCbtRoundMaterials.normalize(data,round):root.HanqCbtWrongNotebook.normalize(data);}catch(e){throw fail('notebook_incomplete');}if(result.rejected||result.hasMore)throw fail('notebook_incomplete');var items=result.items.filter(function(q){return q.exam===round;}).sort(function(a,b){return a.number-b.number;});if(!items.length)throw fail('empty');newPage();if(mode==='answers'){await answers(items);}else{var common=new Set();for(var q of items){current();if(q.common){var key=JSON.stringify([q.exam,q.common.questionNumbers]);if(!common.has(key)){await draw(await picture(q.common.image),'공통 자료 · '+q.common.questionNumbers.join('·')+'번');common.add(key);}}await draw(await picture(q.image),String(q.number)+'.');count++;if(options.onProgress)options.onProgress({done:count,total:items.length});}}await finishPage();current();if(material){var fresh=root.HanqCbtRoundMaterials.normalize(await bounded(api.cbt('GET','/api/v1/cbt/review-materials/'+round)),round);current();if(fresh.resetAt!==result.resetAt)throw fail('notebook_incomplete');}return save('한국사 제'+round+'회 '+(material?'오답 · 별표 ':'누적 오답 ')+(mode==='answers'?'정답·해설':'문제'),'한국사_'+round+'회_'+(material?'오답_별표_':'누적오답_')+(mode==='answers'?'해설지':'문제')+'.pdf',result.pendingStarCount);
 }finally{if(off)off();urls.forEach(function(u){root.URL.revokeObjectURL(u);});}
}
root.HanqCbtWrongPdf={download:download,downloadItems:function(o){return download(Object.assign({},o,{source:'items'}));}};
})(typeof window!=='undefined'?window:globalThis);
