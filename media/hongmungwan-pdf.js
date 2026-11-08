/* Private historical CBT wrong-question PDF. GET-only; explicit question/answer modes, no user writes. */
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


async function download(o){
var api=o.api,s=api.state(),owner=s.ownerId,epoch=s.epoch;
function current(){var now=api.state();if(!now.signedIn||now.ownerId!==owner||now.epoch!==epoch||o.isCurrent&&!o.isCurrent())throw Error('session_changed');}
current();if(!['questions','answers'].includes(o.mode))throw Error('invalid_mode');
var data=await api.hongmungwan('GET',''),items=root.HanqHongmungwan.normalize(data).filter(function(q){return (q.era===o.era||o.era==='joseon'&&/^joseon-/.test(q.era))&&(q.source==='book-manual'||q.everWrong||q.wrongCount>0||q.starred);});current();if(!items.length)throw Error('empty');
var title='홍문관 '+root.HanqHongmungwan.eras.find(function(e){return e[0]===o.era;})[1]+' '+(o.mode==='answers'?'정답·해설':'오답·별표 문제'),pages=[],canvas,ctx,y,lines;
function page(){canvas=document.createElement('canvas');canvas.width=1191;canvas.height=1684;ctx=canvas.getContext('2d');if(!ctx)throw Error('canvas');ctx.scale(2,2);ctx.fillStyle='#fff';ctx.fillRect(0,0,596,842);lines=[];y=30;line(title,12,true);y+=8;}
function line(t,size,bold){ctx.font=(bold?'bold ':'')+size+'px Arial,sans-serif';ctx.fillStyle='#111';ctx.fillText(t,36,y);lines.push({text:t,x:36,y:y,width:ctx.measureText(t).width,size:size});y+=size+7;}
async function finish(){current();var blob=await new Promise(function(resolve,reject){canvas.toBlob(function(b){b?resolve(b):reject(Error('canvas'));},'image/jpeg',.94);});pages.push({width:canvas.width,height:canvas.height,bytes:new Uint8Array(await blob.arrayBuffer()),lines:lines});}
async function text(t,size,bold){t=String(t||'').replace(/\*\*/g,'').replace(/\s+/g,' ');ctx.font=(bold?'bold ':'')+size+'px Arial,sans-serif';var buf='';for(var ch of t){if(ctx.measureText(buf+ch).width>523&&buf){if(y>790){await finish();page();}line(buf,size,bold);buf='';}buf+=ch;}if(buf){if(y>790){await finish();page();}line(buf,size,bold);}}
async function picture(src){var u=new URL(src,location.href);if(u.origin!==location.origin)throw Error('untrusted_image');var img=new Image();await new Promise(function(resolve,reject){var timer=setTimeout(function(){reject(Error('image_timeout'));},20000);img.onload=function(){clearTimeout(timer);resolve();};img.onerror=function(){clearTimeout(timer);reject(Error('image'));};img.src=u.href;});current();var w=523,h=w*img.naturalHeight/img.naturalWidth;if(h>700){w*=700/h;h=700;}if(y+h>800){await finish();page();}ctx.drawImage(img,36,y,w,h);y+=h+12;}
page();if(o.mode==='answers'){await text('정답 한눈에 보기',12,true);for(var q of items){var r=q.review&&q.review.item||q.review||q.item,correct=(r.options||[]).findIndex(function(x){return x.correct;});var answerId=q.review&&q.review.correctOptionId,answerIndex=(q.item.options||[]).findIndex(function(x){return x.id===answerId;});var num=r.answer||q.review&&q.review.correctNumber||(answerIndex>=0?answerIndex+1:correct>=0?correct+1:null);await text((q.item.number||items.indexOf(q)+1)+'. '+(num||'확인 필요'),11,true);}y+=8;await text('해설',12,true);for(var q of items){await text((q.item.number||items.indexOf(q)+1)+'.',11,true);for(var x of root.HanqHongmungwan.reviewLines(q)){await text(x.label+'. '+(x.text||'검수된 해설 준비 중'),10,false);}y+=8;}}else{for(var q of items){await text((q.item.number||items.indexOf(q)+1)+'.',11,true);if(q.item.commonImage)await picture(q.item.commonImage);if(q.item.image)await picture(q.item.image);else{await text(q.item.q||q.item.question||'원문 확인 필요',11,false);for(var i=0;i<q.item.options.length;i++)await text((i+1)+'. '+(q.item.options[i].text||''),10,false);}y+=10;}}
await finish();current();var fresh=await api.hongmungwan('GET','');current();if(fresh.resetAt!==data.resetAt)throw Error('reset_changed');var blob=pdf(pages,title),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=title+'.pdf';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url);},60000);return {count:items.length,pages:pages.length};
}
root.HanqHongmungwanPdf={download:download};})(typeof window!=='undefined'?window:globalThis);
