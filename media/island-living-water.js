/* Scene rendering only. Architecture stays at fixed coordinates; surveyed water
   refracts and selected foliage sways. Boats are extracted once from the plate.
   No account, learning, route or pointer handlers are owned by this module. */
(function(root){
  'use strict';
  var motion=matchMedia('(prefers-reduced-motion: reduce)');
  var moduleBuild='';try{moduleBuild=new URL(document.currentScript.src).searchParams.get('build')||'';}catch(ignore){}
  var low=!!((navigator.deviceMemory&&navigator.deviceMemory<=2)||(navigator.hardwareConcurrency&&navigator.hardwareConcurrency<=2)||(navigator.connection&&navigator.connection.saveData));
  var regions={
    wide:[[[.085,.38],[.36,.36],[.43,.48],[.55,.54],[.58,.49],[.63,.51],[.72,.56],[.79,.53],[1,.55],[1,.86],[.8,.92],[.42,.80],[.30,.72],[.08,.57]]],
    tall:[[[.43,.083],[1,.083],[1,.19],[.80,.18],[.64,.16],[.51,.21],[.47,.29],[.43,.29]],[[0,.267],[.10,.29],[.20,.31],[.31,.32],[.44,.36],[.41,.40],[.36,.42],[.38,.47],[.48,.48],[.57,.43],[.61,.45],[1,.45],[1,.55],[.74,.55],[.60,.57],[.47,.58],[.28,.53],[.10,.52],[0,.48]],[[0,.64],[.17,.68],[.28,.64],[.38,.63],[.48,.68],[.53,.73],[.46,.79],[.59,.84],[.63,.89],[.78,.94],[.70,1],[.22,1],[0,.76]]]
  };
  // Exact silhouettes, in original source pixels (not rectangular boat crops).
  var boats={
    wide:[{pivot:[1570,527],points:[[1480,504],[1498,493],[1531,484],[1573,336],[1576,316],[1582,328],[1582,349],[1641,481],[1645,499],[1659,506],[1653,524],[1640,540],[1614,546],[1534,541],[1500,529]],phase:0},
      {pivot:[488,445],points:[[448,439],[476,431],[488,365],[488,345],[492,350],[492,365],[519,429],[524,440],[528,441],[521,451],[469,454],[450,449]],phase:2.4}],
    tall:[{pivot:[178,607],points:[[98,588],[112,579],[156,563],[164,444],[161,432],[167,424],[172,432],[173,443],[236,559],[243,579],[266,584],[259,606],[241,617],[148,625],[116,613]],phase:1.1}]
  };
  function canvas(w,h){var n=document.createElement('canvas');n.width=w;n.height=h;return n;}
  function polygon(ctx,points,w,h){ctx.beginPath();points.forEach(function(p,i){ctx[i?'lineTo':'moveTo'](p[0]*w,p[1]*h);});ctx.closePath();}
  // Blue is reserved for foliage. Intersect surveyed canopy outlines with actual
  // leaf colours, feather the edges, then exclude every building and menu roof.
  function foliageMask(ctx,mc,w,h,tall){
    var outlines=tall?[[[0,0],[.52,0],[.50,.09],[.26,.14],[0,.18]],[[.83,.15],[1,.145],[1,.41],[.91,.39],[.76,.31]],[[0,.50],[.17,.53],[.19,.68],[.13,.74],[0,.74]],[[.31,.34],[.49,.34],[.49,.47],[.33,.47]]]:[[[0,0],[.26,0],[.26,.17],[.16,.23],[0,.20]],[[.79,0],[1,0],[1,.25],[.86,.23]]];
    var protectedRects=tall?[[.26,.095,.79,.30],[.025,.305,.385,.53],[.52,.43,.99,.70]]:[[.34,.12,.64,.48],[.065,.285,.30,.62],[.66,.265,.985,.65]];
    var leaves=canvas(w,h),lc=leaves.getContext('2d',{willReadFrequently:true});outlines.forEach(function(p){polygon(lc,p,w,h);lc.fill();});
    var ld=lc.getImageData(0,0,w,h),source=ctx.getImageData(0,0,w,h).data;
    for(var i=0;i<ld.data.length;i+=4){var r=source[i],g=source[i+1],b=source[i+2];if(!((g>35&&g>r*1.05&&g>b*1.04)||(r>120&&r>g*1.2&&b>g*1.08)))ld.data[i+3]=0;}
    lc.putImageData(ld,0,0);var soft=canvas(w,h),sc=soft.getContext('2d',{willReadFrequently:true});sc.filter='blur(2px)';sc.drawImage(leaves,0,0);sc.filter='none';
    protectedRects.forEach(function(r){sc.clearRect(r[0]*w-3,r[1]*h-3,(r[2]-r[0])*w+6,(r[3]-r[1])*h+6);});
    var weight=sc.getImageData(0,0,w,h).data,md=mc.getImageData(0,0,w,h),count=0;
    for(var j=0;j<md.data.length;j+=4)if(weight[j+3]){md.data[j+2]=weight[j+3];md.data[j+3]=255;count++;}mc.putImageData(md,0,0);return count;
  }
  function shader(gl,type,code){var s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
  function texture(gl,slot,source){var t=gl.createTexture();gl.activeTexture(gl.TEXTURE0+slot);gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);return t;}
  function mount(chart,img,kind){
    if(chart.dataset.livingMounted)return;chart.dataset.livingMounted='true';
    var surface,gl,program,textures=[],sprites=[],raf=0,last=0,phase=0,visible=false,disposed=false,generation=0,imageKey='',fallbackPaint=null,contextLostHandler=null,staticPlate=null;
    function wantsMotion(){return !motion.matches;}
    var io=root.IntersectionObserver?new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;run();},{threshold:.01}):null;
    if(io)io.observe(chart);else visible=true;
    var cleanup=new MutationObserver(function(){if(!chart.isConnected){disposed=true;generation++;stop();release();img.removeEventListener('load',build);document.removeEventListener('visibilitychange',run);root.removeEventListener('pageshow',run);motion.removeEventListener('change',run);if(io)io.disconnect();cleanup.disconnect();}});cleanup.observe(document.body,{childList:true,subtree:true});
    function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
    function release(){if(surface&&contextLostHandler)surface.removeEventListener('webglcontextlost',contextLostHandler);contextLostHandler=null;if(gl){textures.forEach(function(t){gl.deleteTexture(t);});textures=[];if(program)gl.deleteProgram(program);var ext=gl.getExtension('WEBGL_lose_context');if(ext)ext.loseContext();}if(surface)surface.remove();if(staticPlate)staticPlate.remove();staticPlate=null;sprites.forEach(function(s){s.node.remove();});sprites=[];chart.classList.remove('living-water-ready');gl=null;surface=null;fallbackPaint=null;}
    // A bounded scanline renderer keeps real water pixels moving when WebGL is
    // disabled or lost. Unmasked land is always copied at fixed coordinates.
    function canvasFallback(plate,mask){
      var old=surface;if(old){if(contextLostHandler)old.removeEventListener('webglcontextlost',contextLostHandler);old.remove();}contextLostHandler=null;if(gl&&!gl.isContextLost()){textures.forEach(function(t){gl.deleteTexture(t);});if(program)gl.deleteProgram(program);var previous=gl.getExtension('WEBGL_lose_context');if(previous)previous.loseContext();}gl=null;textures=[];
      var scale=Math.min(1,(low?512:640)/plate.width),w=Math.round(plate.width*scale),h=Math.round(plate.height*scale),base=canvas(w,h),bc=base.getContext('2d'),alpha=canvas(w,h),ac=alpha.getContext('2d',{willReadFrequently:true}),moving=canvas(w,h),dc=moving.getContext('2d');bc.drawImage(plate,0,0,w,h);ac.drawImage(mask,0,0,w,h);
      var pixels=ac.getImageData(0,0,w,h).data,bands=[],strip=4,windAlpha=canvas(w,h),wc=windAlpha.getContext('2d'),wind=canvas(w,h),wd=wind.getContext('2d'),waterPixels=ac.createImageData(w,h),windPixels=ac.createImageData(w,h);
      for(var i=0;i<pixels.length;i+=4){waterPixels.data[i+3]=Math.round(Math.max(pixels[i],pixels[i+1])*pixels[i+3]/255);windPixels.data[i+3]=pixels[i+2];}ac.putImageData(waterPixels,0,0);wc.putImageData(windPixels,0,0);pixels=waterPixels.data;
      for(var y=0;y<h;y+=strip){var left=w,right=-1;for(var yy=y;yy<Math.min(y+strip,h);yy++)for(var x=0;x<w;x++)if(pixels[(yy*w+x)*4+3]){left=Math.min(left,x);right=Math.max(right,x);}if(right>=left)bands.push({y:y,left:Math.max(0,left-5),right:Math.min(w,right+6)});}
      surface=canvas(w,h);surface.className='living-water-surface';surface.setAttribute('aria-hidden','true');var output=surface.getContext('2d');
      var windBands=[];for(var wy=0;wy<h;wy+=strip){var wl=w,wr=-1;for(var y2=wy;y2<Math.min(wy+strip,h);y2++)for(var x2=0;x2<w;x2++)if(windPixels.data[(y2*w+x2)*4+3]){wl=Math.min(wl,x2);wr=Math.max(wr,x2);}if(wr>=wl)windBands.push({y:wy,left:Math.max(0,wl-3),right:Math.min(w,wr+4)});}
      fallbackPaint=function(t){dc.clearRect(0,0,w,h);dc.globalCompositeOperation='source-over';bands.forEach(function(b){var shift=(Math.sin(b.y*.19-t*2.8)+.4*Math.sin(b.y*.08+t*1.7))*2.6,sy=Math.max(0,Math.min(h-strip,b.y+Math.sin(b.y*.22-t*3.1)*1.2)),height=Math.min(strip,h-b.y);dc.drawImage(base,b.left,sy,b.right-b.left,height,b.left+shift,b.y,b.right-b.left,height);});dc.globalCompositeOperation='destination-in';dc.drawImage(alpha,0,0);output.clearRect(0,0,w,h);output.drawImage(moving,0,0);
        wd.clearRect(0,0,w,h);wd.globalCompositeOperation='source-over';windBands.forEach(function(b){var shift=Math.sin(t*1.35+b.y*.018)*1.4+Math.sin(t*.57+b.y*.011)*.45;wd.drawImage(base,b.left,b.y,b.right-b.left,Math.min(strip,h-b.y),b.left+shift,b.y,b.right-b.left,Math.min(strip,h-b.y));});wd.globalCompositeOperation='destination-in';wd.drawImage(windAlpha,0,0);output.drawImage(wind,0,0);};
      staticPlate=plate;staticPlate.className='living-water-plate';staticPlate.setAttribute('aria-hidden','true');staticPlate.style.cssText='position:absolute;inset:0;display:block;width:100%;height:100%;max-width:none;pointer-events:none;z-index:0';chart.appendChild(staticPlate);chart.appendChild(surface);sprites.forEach(function(s){s.node.hidden=false;if(!s.node.isConnected)chart.appendChild(s.node);});chart.classList.add('living-water-ready');chart.dataset.waterRenderer='canvas2d';chart.dataset.waterBuffer=w+'x'+h;
    }
    function draw(){
      if(!surface)return;if(gl){gl.uniform1f(gl.getUniformLocation(program,'time'),phase);gl.drawArrays(gl.TRIANGLE_STRIP,0,4);}else if(fallbackPaint)fallbackPaint(phase);
      sprites.forEach(function(s){var p=phase+s.phase;var dy=Math.sin(p*1.65)*3.1+Math.sin(p*.71)*.7,dx=Math.sin(p*.53)*1.1,angle=Math.sin(p*1.65+.45)*.9;s.node.style.transform='translate('+dx.toFixed(2)+'px,'+dy.toFixed(2)+'px) rotate('+angle.toFixed(3)+'deg)';});
      chart.dataset.waterFrames=String((Number(chart.dataset.waterFrames)||0)+1);
      chart.dataset.waterTime=phase.toFixed(3);
    }
    // Keep the static plate in sync when a running frame observes
    // reduced motion before the media-change callback has updated the surface.
    function frame(now){raf=0;if(disposed||!surface||!visible||document.hidden)return;if(!wantsMotion()){run();return;}var step=1000/(low?12:!gl?18:matchMedia('(max-width:700px)').matches?24:30);if(!last||now-last>=step){if(last)phase+=Math.min((now-last)/1000,.25);last=now;draw();}raf=requestAnimationFrame(frame);}
    function run(){chart.dataset.waterMotion=!wantsMotion()?'reduced':low?'economy':'active';stop();if(surface){surface.hidden=!wantsMotion();draw();if(visible&&!document.hidden&&wantsMotion())raf=requestAnimationFrame(frame);}}
    function build(){
      if(!img.naturalWidth||disposed)return;var keyNow=img.currentSrc+'|'+img.naturalWidth+'x'+img.naturalHeight;if(keyNow===imageKey&&surface)return;imageKey=keyNow;var gen=++generation;stop();release();
      // Fixed one-device-pixel buffer, capped independently from display size.
      var tall=img.naturalHeight>img.naturalWidth,key=tall?'tall':'wide',scale=Math.min(1,(low?720:tall?900:1440)/img.naturalWidth),w=Math.round(img.naturalWidth*scale),h=Math.round(img.naturalHeight*scale);
      var plate=canvas(w,h),ctx=plate.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0,w,h);
      if(kind==='toeic')boats[key].forEach(function(boat){
        var points=boat.points.map(function(p){return[p[0]/(tall?900:1671),p[1]/(tall?1200:941)];});
        var xs=points.map(function(p){return p[0]*w;}),ys=points.map(function(p){return p[1]*h;}),x=Math.floor(Math.min.apply(null,xs)),y=Math.floor(Math.min.apply(null,ys)),bw=Math.ceil(Math.max.apply(null,xs))-x+2,bh=Math.ceil(Math.max.apply(null,ys))-y+2;
        var sprite=canvas(bw,bh),sc=sprite.getContext('2d');sc.translate(-x,-y);polygon(sc,points,w,h);sc.clip();sc.drawImage(img,0,0,w,h);
        sprite.className='living-boat';sprite.style.cssText='left:'+x/w*100+'%;top:'+y/h*100+'%;width:'+bw/w*100+'%;height:'+bh/h*100+'%;transform-origin:'+((boat.pivot[0]*scale-x)/bw*100)+'% '+((boat.pivot[1]*scale-y)/bh*100)+'%';
        sprites.push({node:sprite,phase:boat.phase});
        // Inpaint from the outside inward. Only a narrow edge band is ever
        // exposed by the small bob/roll; no second boat remains underneath.
        var mask=canvas(w,h),mc=mask.getContext('2d');polygon(mc,points,w,h);mc.fill();var alpha=mc.getImageData(x,y,bw,bh).data,data=ctx.getImageData(x-2,y-2,bw+4,bh+4),d=data.data,ww=bw+4,hh=bh+4,unknown=new Uint8Array(ww*hh);
        for(var yy=0;yy<bh;yy++)for(var xx=0;xx<bw;xx++)if(alpha[(yy*bw+xx)*4+3]>0)unknown[(yy+2)*ww+xx+2]=1;
        for(var pass=0;pass<Math.max(bw,bh);pass++){
          var updates=[];for(var py=1;py<hh-1;py++)for(var px=1;px<ww-1;px++){var idx=py*ww+px;if(!unknown[idx])continue;var near=[idx-1,idx+1,idx-ww,idx+ww],rgb=[0,0,0],count=0;near.forEach(function(n){if(!unknown[n]){count++;for(var c=0;c<3;c++)rgb[c]+=d[n*4+c];}});if(count)updates.push([idx,rgb.map(function(v){return v/count;})]);}
          if(!updates.length)break;updates.forEach(function(u){unknown[u[0]]=0;for(var c=0;c<3;c++)d[u[0]*4+c]=u[1][c];});
        }
        ctx.putImageData(data,x-2,y-2);
      });
      var mask=canvas(w,h),mc=mask.getContext('2d',{willReadFrequently:true});
      if(kind==='history'){polygon(mc,tall?[[0,.77],[.10,.75],[.90,.75],[1,.79],[1,1],[0,1]]:[[0,.72],[.13,.655],[.88,.655],[1,.72],[1,1],[0,1]],w,h);mc.fillStyle='red';mc.fill();}
      else{regions[key].forEach(function(p){polygon(mc,p,w,h);mc.fillStyle='red';mc.fill();});var md=mc.getImageData(0,0,w,h),pixels=ctx.getImageData(0,0,w,h).data;for(var i=0;i<md.data.length;i+=4){var r=pixels[i],g=pixels[i+1],b=pixels[i+2];if(!(g>90&&g-r>38&&b-r>45&&b/g>.75&&b/g<1.7)){md.data[i]=0;md.data[i+3]=0;}}mc.putImageData(md,0,0);}
      // The green channel is directional waterfall flow, separate from pond refraction.
      if(kind==='toeic'&&!tall){polygon(mc,[[.569,.480],[.602,.480],[.603,.542],[.565,.542]],w,h);mc.fillStyle='rgb(0,255,0)';mc.fill();}
      if(kind==='history')chart.dataset.foliagePixels=String(foliageMask(ctx,mc,w,h,tall));
      surface=canvas(w,h);surface.className='living-water-surface';surface.setAttribute('aria-hidden','true');
      try{
        gl=surface.getContext('webgl',{alpha:false,antialias:false,depth:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
        program=gl.createProgram();gl.attachShader(program,shader(gl,gl.VERTEX_SHADER,'attribute vec2 p;varying vec2 uv;void main(){uv=(p+1.0)*.5;uv.y=1.0-uv.y;gl_Position=vec4(p,0.,1.);}'));
        gl.attachShader(program,shader(gl,gl.FRAGMENT_SHADER,'precision mediump float;varying vec2 uv;uniform sampler2D plate;uniform sampler2D mask;uniform float time;void main(){vec3 channels=texture2D(mask,uv).rgb;float m=channels.r;float f=channels.g;float wind=channels.b;float depth=smoothstep(.25,1.,uv.y);vec2 wave=vec2(sin(uv.y*260.-time*2.8)+.42*sin(uv.x*65.+uv.y*110.+time*1.7),.32*sin(uv.x*180.-uv.y*80.-time*2.1));vec2 q=uv+wave*vec2(.0028,.0022)*m*(.35+depth);q.y+=f*sin(uv.y*320.-time*13.)*.003;q.x+=wind*(sin(time*1.4+uv.y*11.+uv.x*7.)*.003+sin(time*.57+uv.x*15.)*.0012);q.y+=wind*sin(time*1.1+uv.x*9.)*.00065;vec4 col=texture2D(plate,q);float glint=pow(max(0.,sin(uv.y*420.+sin(uv.x*90.+time)*1.8-time*3.2)),14.);col.rgb+=m*(glint*.045-.009)+f*sin(uv.y*320.-time*13.)*.025;gl_FragColor=vec4(col.rgb,1.);}'));
        gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Water program failed');gl.useProgram(program);
        var buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);var loc=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
        textures=[texture(gl,0,plate),texture(gl,1,mask)];gl.uniform1i(gl.getUniformLocation(program,'plate'),0);gl.uniform1i(gl.getUniformLocation(program,'mask'),1);gl.viewport(0,0,w,h);
        // A paused WebGL drawing buffer may be discarded on recomposition.
        // Keep the already-extracted sharp plate visible below it so reduced
        // motion needs neither repeated GPU draws nor a preserved GL buffer.
        staticPlate=plate;staticPlate.className='living-water-plate';staticPlate.setAttribute('aria-hidden','true');chart.appendChild(staticPlate);
        chart.appendChild(surface);sprites.forEach(function(s){chart.appendChild(s.node);});chart.classList.add('living-water-ready');chart.dataset.waterRenderer='webgl';chart.dataset.waterBuffer=w+'x'+h;
        contextLostHandler=function(e){e.preventDefault();if(disposed||gen!==generation||e.target!==surface)return;stop();canvasFallback(plate,mask);run();};surface.addEventListener('webglcontextlost',contextLostHandler);
      }catch(error){canvasFallback(plate,mask);}
      if(kind==='history'){
        var boat=new Image();boat.src='media/world-art/history-pond-boat-v1.webp'+(moduleBuild?'?build='+encodeURIComponent(moduleBuild):'');boat.onload=function(){if(gen!==generation||disposed)return;var sprite=canvas(boat.naturalWidth,boat.naturalHeight),bc=sprite.getContext('2d');bc.fillStyle='rgba(8,60,56,.23)';bc.beginPath();bc.ellipse(sprite.width*.5,sprite.height*.85,sprite.width*.43,sprite.height*.045,0,0,Math.PI*2);bc.fill();bc.drawImage(boat,0,0);sprite.className='living-boat living-pond-boat';sprite.style.cssText='left:'+(tall?'28':'56')+'%;top:'+(tall?'86':'80')+'%;width:'+(tall?'18':'10')+'%;height:auto';chart.appendChild(sprite);sprites.push({node:sprite,phase:.9});draw();};
      }
      run();
    }
    img.addEventListener('load',build);document.addEventListener('visibilitychange',run);root.addEventListener('pageshow',run);motion.addEventListener('change',run);if(img.complete)build();
  }
  root.HanqLivingWater={mount:mount};
})(window);
