/* Ephemeral recall over rendered, authenticated concept text. No storage or API writes. */
(function(root){
  'use strict';
  function normalize(value){return String(value||'').normalize('NFKC').toLowerCase().replace(/[\s·ㆍ]/g,'').trim();}
  function decorate(host){
    var doc=host.ownerDocument,slots=[],alive=true,toolbar=doc.createElement('div');
    toolbar.className='blank-recall-actions';
    var grade=doc.createElement('button'),reset=doc.createElement('button'),status=doc.createElement('span');
    grade.type=reset.type='button';grade.textContent='채점';reset.textContent='다시 채우기';status.setAttribute('role','status');
    toolbar.append(grade,reset,status);
    Array.from(host.querySelectorAll('strong,b')).filter(function(node){return !node.parentElement.closest('strong,b')&&!node.closest('button,nav,[hidden],script,style')&&/[\p{L}\p{N}]/u.test(node.textContent);}).forEach(function(original){
      if(!host.contains(original))return;
      var originals=[original],next=original.nextSibling;while(next&&next.nodeType===1&&/^(STRONG|B)$/.test(next.tagName)){originals.push(next);next=next.nextSibling;}
      var answer=originals.map(function(n){return n.textContent;}).join('').trim(),wrap=doc.createElement('span'),input=doc.createElement('input'),feedback=doc.createElement('span');
      wrap.className='blank-recall-slot';input.type='text';input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label','백지 테스트 빈칸 '+(slots.length+1));
      input.style.setProperty('--blank-width',Math.min(24,Math.max(4,Array.from(answer).length+1))+'ch');
      feedback.className='blank-recall-feedback';feedback.hidden=true;feedback.setAttribute('aria-live','polite');
      wrap.append(input,feedback);original.replaceWith(wrap);originals.slice(1).forEach(function(n){n.remove();});
      var slot={original:original,originals:originals,wrap:wrap,input:input,feedback:feedback,answer:answer};slots.push(slot);
      function clear(){wrap.classList.remove('is-correct','is-wrong');input.removeAttribute('aria-invalid');feedback.hidden=true;feedback.textContent='';status.textContent='';}
      function key(event){if(event.isComposing)return;if(event.key==='Enter'||event.key==='Tab'){var next=slots[slots.indexOf(slot)+(event.key==='Tab'&&event.shiftKey?-1:1)];if(event.key==='Enter'||next){event.preventDefault();if(input.value.trim()||event.key==='Enter')check(slot);if(next)next.input.focus();}}}
      function blur(){if(input.value.trim())check(slot);}
      input.addEventListener('blur',blur);input.addEventListener('input',clear);input.addEventListener('keydown',key);slot.dispose=function(){input.removeEventListener('blur',blur);input.removeEventListener('input',clear);input.removeEventListener('keydown',key);};
    });
    function check(slot){var correct=normalize(slot.input.value)===normalize(slot.answer);slot.wrap.classList.toggle('is-correct',correct);slot.wrap.classList.toggle('is-wrong',!correct);slot.input.setAttribute('aria-invalid',String(!correct));slot.feedback.textContent=correct?'✓':'✕ '+slot.answer;slot.feedback.hidden=false;return correct;}
    function gradeAll(){if(!alive)return;var count=slots.filter(check).length;status.textContent='정답 '+count+' / '+slots.length;}
    function resetAll(){slots.forEach(function(s){s.input.value='';s.wrap.classList.remove('is-correct','is-wrong');s.input.removeAttribute('aria-invalid');s.feedback.hidden=true;s.feedback.textContent='';});status.textContent='';if(slots[0])slots[0].input.focus();}
    grade.addEventListener('click',gradeAll);reset.addEventListener('click',resetAll);
    if(slots.length)host.prepend(toolbar);else toolbar.remove();
    host.classList.add('blank-recall');
    return {count:slots.length,grade:gradeAll,reset:resetAll,stop:function(){if(!alive)return;alive=false;grade.removeEventListener('click',gradeAll);reset.removeEventListener('click',resetAll);slots.forEach(function(s){s.dispose();s.wrap.replaceWith.apply(s.wrap,s.originals);s.answer='';});slots.length=0;toolbar.remove();host.classList.remove('blank-recall');}};
  }
  root.HanqBlankRecall={decorate:decorate,normalize:normalize};
  if(typeof module==='object'&&module.exports)module.exports=root.HanqBlankRecall;
})(typeof window==='object'?window:globalThis);
