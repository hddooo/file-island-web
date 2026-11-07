/* Private historical CBT wrong-question PDF. GET-only; no answers or user writes. */
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
async function download(options){
 options=options||{};var api=options.api,round=options.round,token=identity(api),urls=[],off=null,cancelled=false,pages=[],canvas,context,y,lines=[],count=0;
 if(!token)throw fail('session_changed');if(!Number.isInteger(round)||round<70||round>79)throw fail('invalid_round');
 function current(){if(cancelled||options.isCurrent&&!options.isCurrent())throw fail('cancelled');if(identity(api)!==token)throw fail('session_changed');}
 if(api.onChange)off=api.onChange(function(){if(identity(api)!==token)cancelled=true;});
 function release(url){root.URL.revokeObjectURL(url);urls=urls.filter(function(x){return x!==url;});}
 async function bounded(promise){var timer;try{return await Promise.race([promise,new Promise(function(_,reject){timer=setTimeout(function(){reject(fail('read_timeout'));},20000);})]);}finally{clearTimeout(timer);}}
 async function picture(path){current();var blob=await bounded(api.cbtImage(path));current();if(!blob||!/^image\/(webp|png|jpeg)$/.test(blob.type)||!blob.size)throw fail('image_unavailable');var url=root.URL.createObjectURL(blob);urls.push(url);var img=new root.Image();try{await bounded(new Promise(function(resolve,reject){img.onload=resolve;img.onerror=function(){reject(fail('image_unavailable'));};img.src=url;}));current();if(!img.naturalWidth||!img.naturalHeight)throw fail('image_unavailable');return img;}finally{release(url);}}
 function newPage(){canvas=root.document.createElement('canvas');canvas.width=Math.round(PAGE.width*PAGE.scale);canvas.height=Math.round(PAGE.height*PAGE.scale);context=canvas.getContext('2d');if(!context)throw fail('pdf_unavailable');context.scale(PAGE.scale,PAGE.scale);context.fillStyle='#fff';context.fillRect(0,0,PAGE.width,PAGE.height);context.fillStyle='#111';context.font='bold 12px Arial, sans-serif';var title='제'+round+'회 · 누적 오답 문제';context.fillText(title,PAGE.margin,30);lines=[{text:title,x:PAGE.margin,y:30,width:context.measureText(title).width,size:12}];y=46;}
 async function finishPage(){if(!canvas)return;current();context.fillStyle='#555';context.font='10px Arial, sans-serif';context.fillText(String(pages.length+1),PAGE.width/2,824);var b=await bounded(new Promise(function(resolve,reject){canvas.toBlob(function(v){v?resolve(v):reject(fail('pdf_unavailable'));},'image/jpeg',.94);}));current();pages.push({bytes:new Uint8Array(await b.arrayBuffer()),width:canvas.width,height:canvas.height,lines:lines});canvas=null;}
 async function draw(img,label){var width=PAGE.width-PAGE.margin*2,height=width*img.naturalHeight/img.naturalWidth,max=PAGE.bottom-64;if(height>max){width*=max/height;height=max;}if(y+height+22>PAGE.bottom&&y>46){await finishPage();newPage();}context.fillStyle='#111';context.font='bold 10px Arial, sans-serif';context.fillText(label,PAGE.margin,y+11);lines.push({text:label,x:PAGE.margin,y:y+11,width:context.measureText(label).width,size:10});y+=18;context.drawImage(img,PAGE.margin,y,width,height);y+=height+12;}
 try{current();var data=await bounded(api.cbt('GET','/api/v1/cbt/notebook'));current();if(!root.HanqCbtWrongNotebook||typeof root.HanqCbtWrongNotebook.normalize!=='function')throw fail('pdf_unavailable');var result;try{result=root.HanqCbtWrongNotebook.normalize(data);}catch(e){throw fail('notebook_incomplete');}if(result.rejected||result.hasMore)throw fail('notebook_incomplete');var items=result.items.filter(function(q){return q.exam===round;}).sort(function(a,b){return a.number-b.number;});if(!items.length)throw fail('empty');newPage();var common=new Set();for(var q of items){current();if(q.common){var key=JSON.stringify([q.exam,q.common.questionNumbers]);if(!common.has(key)){await draw(await picture(q.common.image),'공통 자료 · '+q.common.questionNumbers.join('·')+'번');common.add(key);}}await draw(await picture(q.image),String(q.number)+'.');count++;if(options.onProgress)options.onProgress({done:count,total:items.length});}await finishPage();current();var output=pdf(pages,'한국사 제'+round+'회 누적 오답 문제'),url=root.URL.createObjectURL(output);urls.push(url);var a=root.document.createElement('a'),filename='한국사_'+round+'회_누적오답_문제.pdf';a.href=url;a.download=filename;a.hidden=true;root.document.body.appendChild(a);try{current();a.click();}finally{a.remove();}setTimeout(function(){release(url);},60000);urls=urls.filter(function(u){return u!==url;});return {filename:filename,count:count,pages:pages.length};
 }finally{if(off)off();urls.forEach(function(u){root.URL.revokeObjectURL(u);});}
}
root.HanqCbtWrongPdf={download:download};
})(typeof window!=='undefined'?window:globalThis);
