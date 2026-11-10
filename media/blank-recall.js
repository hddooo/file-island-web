/* Ephemeral recall over rendered, authenticated concept text. No storage or API writes. */
(function(root){
  'use strict';
  // Ignore presentation quotes/brackets only; keep their words and meaningful separators.
  function normalize(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·ㆍ"'‘’“”「」『』〈〉《》【】〔〕［］\[\]()（）{}｛｝]/g,'').trim();}
  // Only verified names of the same entity are alternatives. Other parentheses
  // can contain required dates, people or qualifiers and must remain part of the answer.
  var answerNameGroups=[
    ['석가탑','불국사 3층 석탑','불국사 삼층 석탑'],
    ['촌락 문서','민정 문서'],
    ['9산 선문','9산문'],
    ['대조영','고왕']
  ].map(function(group){return group.map(normalize);});
  function matchesAnswer(value,answer){
    var given=normalize(value),expected=normalize(answer);
    if(!given)return false;
    if(given===expected)return true;
    var source=String(answer||'').normalize('NFKC').trim(),pair=source.match(/^([^()]+)\(([^()]+)\)$/);
    var names=pair?[normalize(pair[1]),normalize(pair[2])]:[expected];
    return answerNameGroups.some(function(group){
      return names.every(function(name){return group.indexOf(name)>=0;})&&group.indexOf(given)>=0;
    });
  }
  // Curated non-answer labels only; never exempt a whole table or historical term.
  var contextLabels=new Set(['특징','주요 특징','구분','분류','항목','내용','주요 내용','핵심 내용','설명','배경','원인','과정','결과','의의','목적','영향','시기','순서','정치','경제','사회','문화','교육','종교','군사','행정','외교','사회/경제','정치/경제','역사서','무덤','탑','기타','이전','이후','전성기 이전','멸망 후','전체 흐름','통일과정','연표','왕계 도식','오답 요원','명령','보고','정치 세력','문학','조선 전기','조선 후기','6조 직계제 도식'].map(normalize));
  function isContextLabel(answer,node,contexts){
    var key=normalize(answer),container=node.closest('td,th')||node.parentElement,context=String(contexts.get(container)||'');
    // PDF captions and study encouragement are not historical recall answers.
    if(/^[<〈《]\s*표\s*\d+\s*[>〉》]/.test(answer)||/^\d+점\s*이상이\s*목표라면/.test(answer))return true;
    // Remove known editorial notes only, not historical content beside category words.
    var labelContext=context.replace(/(?:\d+회\s*중요|진짜\s*중요!?|참고만\s*하자)/g,'');
    return contextLabels.has(key)&&normalize(labelContext)===key;
  }
  function decorate(host){
    var doc=host.ownerDocument,slots=[],alive=true,visited=new Set(),contexts=new WeakMap();
    Array.from(host.querySelectorAll('strong,b')).forEach(function(n){var c=n.closest('td,th')||n.parentElement;contexts.set(c,c.textContent);});
    Array.from(host.querySelectorAll('strong,b')).filter(function(node){return !node.parentElement.closest('strong,b')&&!node.closest('h1,h2,h3,h4,h5,h6,header,caption,summary,[role=heading],[data-blank-recall-heading],button,nav,[hidden],script,style')&&/[\p{L}\p{N}]/u.test(node.textContent);}).forEach(function(original){
      if(!host.contains(original)||visited.has(original))return;
      var originals=[original],next=original.nextSibling;while(next&&next.nodeType===1&&/^(STRONG|B)$/.test(next.tagName)){originals.push(next);next=next.nextSibling;}
      var answer=originals.map(function(n){return n.textContent;}).join('').trim();originals.forEach(function(n){visited.add(n);});if(isContextLabel(answer,original,contexts))return;
      var wrap=doc.createElement('span'),input=doc.createElement('textarea'),feedback=doc.createElement('span');
      wrap.className='blank-recall-slot';input.rows=1;input.wrap='soft';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','백지 테스트 빈칸 '+(slots.length+1));
      function fit(){var units=function(value){return Array.from(value).reduce(function(n,c){return n+(/[^\u0000-\u00ff]/.test(c)?1:0.65);},0);};input.style.setProperty('--blank-width',Math.max(4,units(answer),units(input.value))+1.5+'em');input.style.height='auto';var style=doc.defaultView.getComputedStyle(input);input.style.height=(Math.max(input.scrollHeight,parseFloat(style.lineHeight)||24)+(parseFloat(style.borderTopWidth)||0)+(parseFloat(style.borderBottomWidth)||0))+'px';}
      feedback.className='blank-recall-feedback';feedback.hidden=true;feedback.setAttribute('aria-live','polite');
      wrap.append(input,feedback);original.replaceWith(wrap);originals.slice(1).forEach(function(n){n.remove();});
      var slot={original:original,originals:originals,wrap:wrap,input:input,feedback:feedback,answer:answer};slots.push(slot);fit();
      function clear(){fit();wrap.classList.remove('is-correct','is-wrong');input.removeAttribute('aria-invalid');feedback.hidden=true;feedback.textContent='';}
      function key(event){if(event.isComposing)return;if(event.key==='Enter'||event.key==='Tab'){var direction=event.key==='Tab'&&event.shiftKey?-1:1,index=slots.indexOf(slot)+direction,next=slots[index];while(next&&!next.input.getClientRects().length){index+=direction;next=slots[index];}if(event.key==='Enter'||next){event.preventDefault();if(input.value.trim()||event.key==='Enter')check(slot);if(next)next.input.focus();}}}
      function blur(){if(input.value.trim())check(slot);}
      input.addEventListener('blur',blur);input.addEventListener('input',clear);input.addEventListener('keydown',key);slot.fit=fit;slot.dispose=function(){input.removeEventListener('blur',blur);input.removeEventListener('input',clear);input.removeEventListener('keydown',key);};
    });
    function check(slot){var correct=matchesAnswer(slot.input.value,slot.answer);slot.wrap.classList.toggle('is-correct',correct);slot.wrap.classList.toggle('is-wrong',!correct);slot.input.setAttribute('aria-invalid',String(!correct));slot.feedback.textContent=correct?'✓':'✕ '+slot.answer;slot.feedback.hidden=false;slot.fit();return correct;}
    function gradeAll(){if(!alive)return;return slots.filter(check).length;}
    function resetAll(){slots.forEach(function(s){s.input.value='';s.fit();s.wrap.classList.remove('is-correct','is-wrong');s.input.removeAttribute('aria-invalid');s.feedback.hidden=true;s.feedback.textContent='';});if(slots[0])slots[0].input.focus();}
    host.classList.add('blank-recall');
    var win=doc.defaultView,resize=function(){slots.forEach(function(s){s.fit();});};win.addEventListener('resize',resize);host.addEventListener('toggle',resize,true);resize();
    return {count:slots.length,grade:gradeAll,reset:resetAll,stop:function(){if(!alive)return;alive=false;win.removeEventListener('resize',resize);host.removeEventListener('toggle',resize,true);slots.forEach(function(s){s.dispose();s.wrap.replaceWith.apply(s.wrap,s.originals);s.answer='';});slots.length=0;host.classList.remove('blank-recall');}};
  }
  root.HanqBlankRecall={decorate:decorate,normalize:normalize,matchesAnswer:matchesAnswer};
  if(typeof module==='object'&&module.exports)module.exports=root.HanqBlankRecall;
})(typeof window==='object'?window:globalThis);
