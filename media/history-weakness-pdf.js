(function(root){
  'use strict';
  // Only the same-origin study chart is decoded. No PDF is hosted; the browser
  // creates a single high-resolution page and hands it to its PDF viewer.
  function pdf(jpeg,width,height){
    var encoder=new TextEncoder(),parts=[],bytes=0,objects=[0];
    function add(value){var data=typeof value==='string'?encoder.encode(value):value;parts.push(data);bytes+=data.byteLength;}
    function obj(id,body){objects[id]=bytes;add(id+' 0 obj\n');add(body);add('\nendobj\n');}
    var pw=1190.55,ph=Math.round(pw*height/width*100)/100;
    var content='q\n'+pw+' 0 0 '+ph+' 0 0 cm\n/Chart Do\nQ\n';
    add('%PDF-1.4\n');add(new Uint8Array([37,226,227,207,211,10]));
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
    obj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph+'] /Resources << /XObject << /Chart 4 0 R >> >> /Contents 5 0 R >>');
    objects[4]=bytes;
    add('4 0 obj\n<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.byteLength+' >>\nstream\n');
    add(jpeg);add('\nendstream\nendobj\n');
    obj(5,'<< /Length '+content.length+' >>\nstream\n'+content+'endstream');
    var xref=bytes;
    add('xref\n0 6\n0000000000 65535 f \n');
    for(var i=1;i<6;i++)add(String(objects[i]).padStart(10,'0')+' 00000 n \n');
    add('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
    return new Blob(parts,{type:'application/pdf'});
  }
  async function render(src){
    var image=new Image();
    await new Promise(function(resolve,reject){image.onload=resolve;image.onerror=reject;image.src=src;});
    async function attempt(limit){
      var scale=Math.min(1,limit/Math.max(image.naturalWidth,image.naturalHeight));
      var canvas=document.createElement('canvas');
      try{
        canvas.width=Math.round(scale*image.naturalWidth);canvas.height=Math.round(scale*image.naturalHeight);
        var ctx=canvas.getContext('2d',{alpha:false});
        ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(image,0,0,canvas.width,canvas.height);
        var jpeg=await new Promise(function(resolve,reject){canvas.toBlob(function(blob){if(blob&&blob.size&&blob.type==='image/jpeg')resolve(blob);else reject(Error('Chart canvas unavailable'));},'image/jpeg',0.97);});
        return pdf(new Uint8Array(await jpeg.arrayBuffer()),canvas.width,canvas.height);
      }finally{canvas.width=1;canvas.height=1;}
    }
    try{return await attempt(7200);}catch(_){return await attempt(4096);}
  }
  function mount(scope){
    scope.querySelectorAll('.history-weakness-card').forEach(function(card){
      var preview=card.querySelector('img'),buttons=card.querySelectorAll('button[data-chart-pdf]'),status=card.querySelector('[role=status]'),job;
      buttons.forEach(function(button){
        button.addEventListener('click',async function(){
          var wantsOpen=button.dataset.chartPdf==='open';
          var popup=wantsOpen?root.open('about:blank','_blank'):null;
          if(popup)popup.opener=null;
          buttons.forEach(function(item){item.disabled=true;});
          status.hidden=false;status.textContent='PDF 만드는 중…';
          var url;
          try{
            var file=await (job||(job=render(preview.src)));
            url=URL.createObjectURL(file);
            if(popup&&!popup.closed){popup.location.replace(url);}
            else{
              var link=document.createElement('a');
              link.href=url;link.download=preview.alt.replace(' 미리 보기','')+'.pdf';
              document.body.appendChild(link);link.click();link.remove();
            }
            var href=url;
            root.setTimeout(function(){URL.revokeObjectURL(href);},120000);
            status.textContent='';status.hidden=true;
          }catch(_){
            job=null;
            if(url)URL.revokeObjectURL(url);
            if(popup&&!popup.closed)popup.close();
            status.textContent='PDF를 만들지 못했어요. 다시 눌러 주세요.';
          }finally{
            buttons.forEach(function(item){item.disabled=false;});
          }
        });
      });
    });
  }
  root.HanqHistoryWeaknessPdf={mount:mount};
}(window));
