/* Ephemeral recall over rendered, authenticated concept text. No storage or API writes. */
(function(root){
  'use strict';
  // Ignore presentation quotes/brackets only; keep their words and meaningful separators.
  function normalize(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·ㆍ"'‘’“”「」『』〈〉《》【】〔〕［］\[\]()（）{}｛｝]/g,'').trim();}
  function decorate(host){
    var doc=host.ownerDocument,slots=[],alive=true;
    Array.from(host.querySelectorAll('strong,b')).filter(function(node){return !node.parentElement.closest('strong,b')&&!node.closest('h1,h2,h3,h4,h5,h6,header,caption,summary,[role=heading],[data-blank-recall-heading],button,nav,[hidden],script,style')&&/[\p{L}\p{N}]/u.test(node.textContent);}).forEach(function(original){
      if(!host.contains(original))return;
      var originals=[original],next=original.nextSibling;while(next&&next.nodeType===1&&/^(STRONG|B)$/.test(next.tagName)){originals.push(next);next=next.nextSibling;}
      var answer=originals.map(function(n){return n.textContent;}).join('').trim(),wrap=doc.createElement('span'),input=doc.createElement('textarea'),feedback=doc.createElement('span');
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
    function check(slot){var correct=normalize(slot.input.value)===normalize(slot.answer);slot.wrap.classList.toggle('is-correct',correct);slot.wrap.classList.toggle('is-wrong',!correct);slot.input.setAttribute('aria-invalid',String(!correct));slot.feedback.textContent=correct?'✓':'✕ '+slot.answer;slot.feedback.hidden=false;slot.fit();return correct;}
    function gradeAll(){if(!alive)return;return slots.filter(check).length;}
    function resetAll(){slots.forEach(function(s){s.input.value='';s.fit();s.wrap.classList.remove('is-correct','is-wrong');s.input.removeAttribute('aria-invalid');s.feedback.hidden=true;s.feedback.textContent='';});if(slots[0])slots[0].input.focus();}
    host.classList.add('blank-recall');
    var win=doc.defaultView,resize=function(){slots.forEach(function(s){s.fit();});};win.addEventListener('resize',resize);host.addEventListener('toggle',resize,true);resize();
    return {count:slots.length,grade:gradeAll,reset:resetAll,stop:function(){if(!alive)return;alive=false;win.removeEventListener('resize',resize);host.removeEventListener('toggle',resize,true);slots.forEach(function(s){s.dispose();s.wrap.replaceWith.apply(s.wrap,s.originals);s.answer='';});slots.length=0;host.classList.remove('blank-recall');}};
  }
  root.HanqBlankRecall={decorate:decorate,normalize:normalize};
  if(typeof module==='object'&&module.exports)module.exports=root.HanqBlankRecall;
})(typeof window==='object'?window:globalThis);
