/* English harbor presentation only. Native menu controls and their route handlers
   are retained; no audio, learning data, account state or rewards are owned here. */
(function(root){
  'use strict';
  var portrait=matchMedia('(max-width:700px) and (orientation:portrait)');
  // Surveyed against the unchanged 1671x941 and 900x1200 source paintings.
  var places={
    notebook:{place:'단어 서고',wide:[.785,.045,.975,.335],tall:[.025,.055,.36,.255]},
    wrongnotes:{place:'연습 부두',wide:[.16,.475,.44,.725],tall:[.075,.455,.39,.625]},
    grammar:{place:'문법의 문',wide:[.445,.13,.67,.46],tall:[.565,.165,.925,.40]},
    player:{place:'듣기 정자',wide:[.715,.345,.845,.50],tall:[.64,.575,.97,.80]}
  };
  function enhance(map,chart,art,controls){
    if(map.dataset.englishHarbor)return;
    map.dataset.englishHarbor='true';
    var source=chart.querySelector('source');source.media=portrait.media;
    controls=controls.filter(function(control){
      var place=places[control.dataset.toeicView];if(!place)return false;
      control.classList.add('english-landmark');control.dataset.englishPlace=place.place;
      var sign=control.querySelector('.harbor-sign'),label=control.querySelector('strong');
      if(sign){var hint=document.createElement('small');hint.className='english-place';hint.id='english-place-'+control.dataset.toeicView+'-hint';hint.textContent=place.place;sign.appendChild(hint);var description=control.getAttribute('aria-describedby');control.setAttribute('aria-describedby',(description?description+' ':'')+hint.id);}
      // Preserve native destination names used by assistive navigation; the scenic
      // place supplements the description rather than replacing the learning task.
      if(label)control.title=label.textContent+' · '+place.place;
      return true;
    });
    var frame=0,closed=false;
    function fit(){
      frame=0;if(closed||!map.isConnected)return;
      var tall=portrait.matches,w=map.clientWidth,h=map.clientHeight,nw=tall?900:1671,nh=tall?1200:941;
      // Fill ordinary screens with the cove. Very short windows use safe framing
      // to retain all destinations rather than crop away the roofs or pier.
      var cover=Math.max(w/nw,h/nh),safe=Math.min(w/(nw*.97),h/(nh*.87)),scale=tall?Math.min(cover,w/(nw*.70)):h/w<.46?safe:cover,iw=nw*scale,ih=nh*scale;
      var ox=tall?(w-iw)/2:Math.max(Math.min(0,w-iw),Math.min(Math.max(0,w-iw),w/2-iw*.59)),oy=(h-ih)/2;
      chart.style.left=ox+'px';chart.style.top=oy+'px';chart.style.width=iw+'px';chart.style.height=ih+'px';
      map.dataset.englishCamera=tall?'portrait':'wide';
      controls.forEach(function(control){
        var rect=places[control.dataset.toeicView][tall?'tall':'wide'];
        var x1=Math.max(4,ox+iw*rect[0]),y1=Math.max(4,oy+ih*rect[1]),x2=Math.min(w-4,ox+iw*rect[2]),y2=Math.min(h-4,oy+ih*rect[3]);
        var width=Math.max(44,x2-x1),height=Math.max(44,y2-y1);
        var left=Math.max(4,Math.min(w-width-4,x1)),top=Math.max(4,Math.min(h-height-4,y1));
        control.style.setProperty('left',left+'px','important');control.style.setProperty('top',top+'px','important');
        control.style.setProperty('width',width+'px','important');control.style.setProperty('height',height+'px','important');
        var sign=control.querySelector('.harbor-sign');if(sign){var half=sign.offsetWidth/2,centre=left+width/2,clamped=Math.max(4+half,Math.min(w-4-half,centre));sign.style.removeProperty('transform');sign.style.setProperty('--english-sign-shift',(clamped-centre)+'px');}
      });
    }
    function schedule(){if(!frame&&!closed)frame=requestAnimationFrame(fit);}
    var observer=root.ResizeObserver?new ResizeObserver(schedule):null;
    if(observer){observer.observe(map);controls.forEach(function(control){var sign=control.querySelector('.harbor-sign');if(sign)observer.observe(sign);});}
    art.addEventListener('load',schedule);root.addEventListener('resize',schedule);portrait.addEventListener('change',schedule);
    var detached=new MutationObserver(function(){if(map.isConnected)return;closed=true;if(frame)cancelAnimationFrame(frame);if(observer)observer.disconnect();detached.disconnect();art.removeEventListener('load',schedule);root.removeEventListener('resize',schedule);portrait.removeEventListener('change',schedule);});
    detached.observe(document.body,{childList:true,subtree:true});fit();
  }
  root.HanqEnglishIsland={enhance:enhance};
})(window);
