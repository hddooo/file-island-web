/* Local-only PDF for the current submitted era-quiz wrong-answer statistics. No API/network access. */
(function(root){'use strict';
var PAGE={width:595.28,height:841.89,margin:28,bottom:807,scale:3},FONT='Arial, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", sans-serif';
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
function current(o){if(typeof o.isCurrent!=='function'||!o.isCurrent())throw fail('session_changed');}
function snapshot(review){
 if(!review||!review.querySelectorAll)throw fail('invalid_review');
 var cards=Array.from(review.querySelectorAll('[data-source-review-item-id]')),seen=new Set();
 if(!cards.length)throw fail('empty');if(cards.length>1000)throw fail('too_many_questions');
 function runs(node){var output=[];
  function add(text,red,bold,underline){if(text)output.push({text:text,red:!!red,bold:!!bold,underline:!!underline});}
  function walk(n,red,bold,underline){if(n.nodeType===3){add(n.nodeValue,red,bold,underline);return;}if(n.nodeType!==1||n.hidden||n.classList.contains('textbook-source-review-user-answer')||/^(SCRIPT|STYLE|INPUT|BUTTON|SELECT|TEXTAREA)$/.test(n.tagName))return;
   red=red||n.classList.contains('textbook-source-review-answer');bold=bold||/^(STRONG|B)$/.test(n.tagName);underline=underline||n.tagName==='U';
   var block=/^(P|DIV|UL|OL|LI|H[1-6])$/.test(n.tagName);if(block||n.tagName==='BR')add('\n',false,false);
   Array.from(n.childNodes).forEach(function(c){walk(c,red,bold,underline);});if(block)add('\n',false,false);
  }walk(node,false,false);return output;
 }
 return cards.map(function(card){var id=card.dataset.sourceReviewItemId,h=card.querySelector('h4'),prompt=card.querySelector('.textbook-source-review-prompt');if(!id||seen.has(id)||!h||!prompt)throw fail('invalid_review');seen.add(id);
  var label=h.textContent.trim();if(!/^\d+\./.test(label))throw fail('invalid_number');
  var promptRuns=runs(prompt);while(promptRuns.length&&promptRuns[0].text==='\n')promptRuns.shift();
  var content=[{text:label+' · ',red:false,bold:true}].concat(promptRuns);
  Array.from(card.children).filter(function(n){return n!==h&&n!==prompt&&!n.classList.contains('textbook-source-review-user-answer');}).forEach(function(n){content.push({text:'\n',red:false,bold:false});content=content.concat(runs(n));});
  // Whitespace is layout, never parsed as source markup. Keep source text and punctuation; the on-screen personal-answer line is intentionally excluded.
  return {id:id,number:Number(label.match(/^\d+/)[0]),runs:content};
 });
}
function wrap(ctx,runs,width){
 var result=[],line=[],used=0,pendingSpace=false,lastBreak=true;
 var segmenter=root.Intl&&root.Intl.Segmenter?new root.Intl.Segmenter('ko',{granularity:'grapheme'}):null;
 function emit(){while(line.length&&/^\s+$/.test(line[line.length-1].text))line.pop();if(line.length)result.push(line);line=[];used=0;pendingSpace=false;lastBreak=true;}
 function append(ch,run){ctx.font=(run.bold?'bold ':'')+'9.5px '+FONT;var w=ctx.measureText(ch).width;if(used+w>width&&line.length)emit();var last=line[line.length-1];if(last&&last.red===run.red&&last.bold===run.bold&&last.underline===run.underline){last.text+=ch;last.width+=w;}else line.push({text:ch,red:run.red,bold:run.bold,underline:run.underline,width:w});used+=w;lastBreak=false;}
 runs.forEach(function(run){var text=run.text,chars=segmenter?Array.from(segmenter.segment(text),function(s){return s.segment;}):Array.from(text);chars.forEach(function(ch){if(ch==='\n'||ch==='\r'){emit();return;}if(/^\s+$/.test(ch)){pendingSpace=!lastBreak;return;}if(pendingSpace){append(' ',run);pendingSpace=false;}append(ch,run);});});emit();return result;
}
async function create(options){
 var o=options||{};current(o);var items=snapshot(o.review),title=String(o.title||'빈칸 퀴즈 오답').slice(0,200),pages=[],layout=[],canvas,ctx,lines,col=0,y=52;
 var gap=18,width=(PAGE.width-2*PAGE.margin-gap)/2,lineHeight=12.1,top=52,capacity=PAGE.bottom-top;
 async function bounded(p){var timer;try{return await Promise.race([p,new Promise(function(_,reject){timer=setTimeout(function(){reject(fail('pdf_timeout'));},15000);})]);}finally{clearTimeout(timer);}}
 if(root.document.fonts&&root.document.fonts.ready)await bounded(root.document.fonts.ready);current(o);
 function fresh(){canvas=root.document.createElement('canvas');canvas.width=Math.ceil(PAGE.width*PAGE.scale);canvas.height=Math.ceil(PAGE.height*PAGE.scale);ctx=canvas.getContext('2d');if(!ctx)throw fail('pdf_unavailable');ctx.scale(PAGE.scale,PAGE.scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,PAGE.width,PAGE.height);lines=[];col=0;y=top;ctx.fillStyle='#111';ctx.font='bold 12px '+FONT;var heading=title+' · 오답 '+items.length+'문항';ctx.fillText(heading,PAGE.margin,30,PAGE.width-PAGE.margin*2);lines.push({text:heading,x:PAGE.margin,y:30,width:Math.min(PAGE.width-PAGE.margin*2,ctx.measureText(heading).width),size:12});ctx.strokeStyle='#d4d4d4';ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(PAGE.width/2,43);ctx.lineTo(PAGE.width/2,PAGE.bottom);ctx.stroke();}
 async function finish(){current(o);ctx.font='8px '+FONT;ctx.fillStyle='#666';ctx.fillText(String(pages.length+1),PAGE.width/2,827);var blob=await bounded(new Promise(function(resolve,reject){canvas.toBlob(function(b){b?resolve(b):reject(fail('pdf_unavailable'));},'image/jpeg',.95);}));current(o);pages.push({width:canvas.width,height:canvas.height,bytes:new Uint8Array(await blob.arrayBuffer()),lines:lines});canvas.width=canvas.height=1;canvas=null;}
 async function nextColumn(){if(col===0){col=1;y=top;}else{await finish();fresh();}current(o);}
 function draw(runs,item){var x=PAGE.margin+col*(width+gap),full='';ctx.textBaseline='alphabetic';runs.forEach(function(run){ctx.font=(run.bold?'bold ':'')+'9.5px '+FONT;ctx.fillStyle=run.red?'#b91c1c':'#111';ctx.fillText(run.text,x,y);if(run.underline){ctx.strokeStyle=ctx.fillStyle;ctx.lineWidth=.45;ctx.beginPath();ctx.moveTo(x,y+1.3);ctx.lineTo(x+run.width,y+1.3);ctx.stroke();}x+=run.width;full+=run.text;});lines.push({text:full,x:PAGE.margin+col*(width+gap),y:y,width:x-(PAGE.margin+col*(width+gap)),size:9.5});layout.push({id:item.id,number:item.number,page:pages.length+1,column:col,x:PAGE.margin+col*(width+gap),y:y,width:x-(PAGE.margin+col*(width+gap)),text:full});y+=lineHeight;}
 try{fresh();for(var index=0;index<items.length;index++){current(o);var item=items[index],wrapped=wrap(ctx,item.runs,width),height=wrapped.length*lineHeight+5;
   if(height<=capacity&&y+height>PAGE.bottom&&y>top)await nextColumn();
   for(var i=0;i<wrapped.length;i++){if(y+lineHeight>PAGE.bottom)await nextColumn();draw(wrapped[i],item);}y+=5;
   if(o.onProgress)o.onProgress({done:index+1,total:items.length});if(index%20===19){await new Promise(function(resolve){setTimeout(resolve,0);});current(o);}
  }await finish();current(o);return {blob:pdf(pages,title),count:items.length,pages:pages.length,filename:title.replace(/[\\/:*?"<>|\x00-\x1f]/g,'_')+'.pdf',layout:layout};
 }finally{if(canvas)canvas.width=canvas.height=1;pages.length=0;}
}
async function download(options){var o=options||{},result=await create(o);current(o);var url=root.URL.createObjectURL(result.blob),a=root.document.createElement('a');try{a.href=url;a.download=result.filename;a.hidden=true;root.document.body.appendChild(a);current(o);a.click();}catch(e){root.URL.revokeObjectURL(url);throw e;}finally{a.remove();}setTimeout(function(){root.URL.revokeObjectURL(url);},60000);return {count:result.count,pages:result.pages,filename:result.filename};}
root.HanqEraQuizReviewPdf={create:create,download:download};
})(typeof window!=='undefined'?window:globalThis);
