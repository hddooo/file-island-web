(function(root){
  'use strict';
  // Only same-origin study images are decoded. The browser creates an image-only PDF.
  function pdf(pages){
    var encoder=new TextEncoder(),parts=[],bytes=0,objects=[0],pw=595.28,ph=841.89;
    function add(value){var data=typeof value==='string'?encoder.encode(value):value;parts.push(data);bytes+=data.byteLength;}
    function obj(id,body){objects[id]=bytes;add(id+' 0 obj\n');add(body);add('\nendobj\n');}
    add('%PDF-1.4\n');add(new Uint8Array([37,226,227,207,211,10]));
    obj(1,'<< /Type /Catalog /Pages 2 0 R >>');
    var kids=pages.map(function(_,i){return (3+i*3)+' 0 R';}).join(' ');
    obj(2,'<< /Type /Pages /Kids ['+kids+'] /Count '+pages.length+' >>');
    pages.forEach(function(page,i){
      var id=3+3*i,width=page.width,height=page.height,jpeg=page.jpeg;
      var ratio=Math.min(pw/width,ph/height),iw=width*ratio,ih=height*ratio;
      var content='q\n'+iw.toFixed(3)+' 0 0 '+ih.toFixed(3)+' '+((pw-iw)/2).toFixed(3)+' '+((ph-ih)/2).toFixed(3)+' cm\n/Chart Do\nQ\n';
      obj(id,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+pw+' '+ph+'] /Resources << /XObject << /Chart '+(id+1)+' 0 R >> >> /Contents '+(id+2)+' 0 R >>');
      objects[id+1]=bytes;
      add((id+1)+' 0 obj\n<< /Type /XObject /Subtype /Image /Width '+width+' /Height '+height+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+jpeg.byteLength+' >>\nstream\n');
      add(jpeg);add('\nendstream\nendobj\n');
      obj(id+2,'<< /Length '+content.length+' >>\nstream\n'+content+'endstream');
    });
    var xref=bytes,size=objects.length;
    add('xref\n0 '+size+'\n0000000000 65535 f \n');
    for(var i=1;i<size;i++)add(String(objects[i]).padStart(10,'0')+' 00000 n \n');
    add('trailer\n<< /Size '+size+' /Root 1 0 R >>\nstartxref\n'+xref+'\n%%EOF\n');
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
        return {jpeg:new Uint8Array(await jpeg.arrayBuffer()),width:canvas.width,height:canvas.height};
      }finally{canvas.width=1;canvas.height=1;}
    }
    try{return await attempt(7200);}catch(_){return await attempt(4096);}
  }
  function mount(scope){
    var cache=new Map(),doc=root.document,previews=Array.from(scope.querySelectorAll('[data-weakness-pdf-page][data-chart-light][data-chart-dark]'));
    function page(src){
      var job=cache.get(src);
      if(!job){job=render(src).catch(function(error){cache.delete(src);throw error;});cache.set(src,job);}
      return job;
    }
    function bind(buttons,status,images,name){
      buttons.forEach(function(button){
        button.addEventListener('click',async function(){
          var popup=button.dataset.chartPdf==='open'?root.open('about:blank','_blank'):null;
          if(popup)popup.opener=null;
          buttons.forEach(function(item){item.disabled=true;});
          status.hidden=false;status.textContent='PDF 만드는 중…';
          var url;
          try{
            var dark=root.HanqDisplayMode&&root.HanqDisplayMode.current()==='company';
            var sources=images.map(function(record){return dark?record.dataset.chartDark:record.dataset.chartLight;}),pages=[];
            // Build pages in visual order; do not hold several large canvases open at once.
            for(var i=0;i<sources.length;i++)pages.push(await page(sources[i]));
            url=URL.createObjectURL(pdf(pages));
            if(popup&&!popup.closed){popup.location.replace(url);}
            else{
              var link=doc.createElement('a');
              link.href=url;link.download=name+'.pdf';
              doc.body.appendChild(link);link.click();link.remove();
            }
            var href=url;
            root.setTimeout(function(){URL.revokeObjectURL(href);},120000);
            status.textContent='';status.hidden=true;
          }catch(_){
            if(url)URL.revokeObjectURL(url);
            if(popup&&!popup.closed)popup.close();
            status.textContent='PDF를 만들지 못했어요. 다시 눌러 주세요.';
          }finally{
            buttons.forEach(function(item){item.disabled=false;});
          }
        });
      });
    }
    var all=scope.querySelector('.history-weakness-all');
    if(all&&previews.length)bind(all.querySelectorAll('button[data-chart-pdf]'),all.querySelector('[role=status]'),previews,'한능검 약점 보완 전체');
  }
  root.HanqHistoryWeaknessPdf={mount:mount};
}(window));
