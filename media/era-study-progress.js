(function(root){
  'use strict';
  const revision='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  const eras=['prehistory','samguk','nambuk','goryeo','joseon','opening','colonial','modern'];
  const eraTitles=['선사시대·고조선과 여러 나라','삼국시대','남북국시대','고려시대','조선시대','개화기','일제강점기','현대'];
  let active=null;
  function summary(model,result){
    if(!model||!Array.isArray(model.items)||!model.items.length||!model.source||model.source.sha256!==revision||!result||result.version!==(model.version||model.progressVersion)||!result.workspace||!result.workspace.responses)throw Error('progress_binding');
    if(new Set(model.items.map(i=>i.id)).size!==model.items.length)throw Error('duplicate_items');
    const responses=result.workspace.responses,wrong=[];
    let done=0;
    for(const item of model.items){
      const r=responses[item.id],slots=item.kind==='classification'?(item.responseSlots||[]).length:(item.blanks||[]).reduce((n,b)=>n+(b.parts?b.parts.length:1),0);
      const complete=slots>0&&r&&r.submitted===true&&typeof r.correct==='boolean'&&Array.isArray(r.values)&&r.values.length===slots&&r.values.every(v=>typeof v==='string'&&v.trim().length>0)&&(!r.checkedSlots||(r.checkedSlots.length===slots&&r.checkedSlots.every(v=>v===true)));
      if(complete){done++;if(!r.correct)wrong.push(item);}
    }
    return {done,correct:done-wrong.length,scorePercent:Math.floor((done-wrong.length)/model.items.length*100),total:model.items.length,complete:result.workspace.status==='completed'||done===model.items.length,wrong};
  }
  function mount(host,options){
    stop();options=options||{};
    const doc=host.ownerDocument,win=doc.defaultView,api=options.api||root.HanqApi;
    let alive=true,dialog=null,opener=null,unsubscribe=null,queue=[],owned=[],lockRelease=null;
    const reviewReads=new WeakMap();
    const owner=identity();
    function identity(){const s=api&&api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId?s.ownerId+':'+s.epoch:'';}
    function valid(){return alive&&!!owner&&identity()===owner&&host.isConnected;}
    function node(tag,cls,text){const n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
    function appendText(target,value){
      // Render only formatting nodes; source attributes and executable HTML never enter the DOM.
      const text=String(value||''),tags=/<\/?([a-z][a-z0-9:-]*)\b[^>]*>/gi,stack=[{node:target,tag:''}];let offset=0,match,blocked='';
      while((match=tags.exec(text))){
        if(!blocked)stack[stack.length-1].node.append(doc.createTextNode(text.slice(offset,match.index)));
        const name=match[1].toLowerCase(),closing=/^<\//.test(match[0]);offset=tags.lastIndex;
        if(blocked){if(closing&&name===blocked)blocked='';continue;}
        if(/^(script|style|iframe|object|template)$/.test(name)){if(!closing)blocked=name;continue;}
        if(/^(strong|b|em|i|u|sup|sub)$/.test(name)){
          if(closing){for(let i=stack.length-1;i>0;i--)if(stack[i].tag===name){stack.length=i;break;}}
          else{const n=node(name==='b'?'strong':name,'');stack[stack.length-1].node.append(n);stack.push({node:n,tag:name});}
        }else if(/^(br|p|div|li)$/.test(name))stack[stack.length-1].node.append(doc.createTextNode(' '));
      }
      if(!blocked)stack[stack.length-1].node.append(doc.createTextNode(text.slice(offset)));
    }
    function close(focus){if(dialog){if(dialog.open&&dialog.close)dialog.close();dialog.remove();dialog=null;}if(lockRelease){lockRelease();lockRelease=null;}if(focus&&opener&&opener.isConnected)opener.focus();opener=null;}
    function dispose(){alive=false;close(false);if(unsubscribe)unsubscribe();unsubscribe=null;win.removeEventListener('popstate',back);owned.forEach(n=>{if(n.classList.contains('era-progress-row')){const card=n.querySelector('.period');if(card)n.before(card);}n.remove();});owned=[];if(active===controller)active=null;}
    function back(){close(false);}
    const controller={stop:dispose};active=controller;
    win.addEventListener('popstate',back);
    if(api&&api.onChange)unsubscribe=api.onChange(()=>{if(identity()!==owner){dispose();host.querySelectorAll('.era-progress-tools').forEach(n=>n.remove());}});
    async function read(id){const quizId=id==='samguk'?'ancient':id;const model=await api.textbookSemanticQuiz(quizId,revision);if(!valid())throw Error('session_changed');const result=await api.textbookSourceWorkspace(quizId,revision);if(!valid())throw Error('session_changed');if(model.id!==quizId)throw Error('era_binding');if(!model.version){const bytes=new win.TextEncoder().encode(JSON.stringify({schema:model.schemaVersion,source:model.source,items:model.items}));model.progressVersion=Array.from(new Uint8Array(await win.crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');if(!valid())throw Error('session_changed');}return {model,result,stats:summary(model,result)};}
    function paint(tools,record){
      const status=tools.querySelector('.era-progress-status');status.replaceChildren();tools.dataset.state='ready';
      if(tools.dataset.reviewEra){status.textContent=record.stats.finalSubmitted?' (정답률 : '+record.stats.scorePercent+'%, 오답 : '+record.stats.wrong.length+'문항)':' (기록 없음)';return;}
      status.title=record.stats.complete?'빈칸 학습 완료':'빈칸 학습 미완료';
      if(record.stats.complete){const check=node('span','era-complete','✓');check.setAttribute('role','img');check.setAttribute('aria-label',tools.dataset.title+' 빈칸 학습 완료');status.append(check);}
    }
    async function readReview(id,tools){
      const request={};reviewReads.set(tools,request);
      try{const record=await read(id);record.stats=Object.assign({},record.stats,{finalSubmitted:record.stats.complete,wrong:record.stats.complete?record.stats.wrong:[]});if(valid()&&reviewReads.get(tools)===request)paint(tools,record);return record;}
      catch(e){if(valid()&&reviewReads.get(tools)===request){tools.dataset.state='error';tools.querySelector('.era-progress-status').textContent=' (기록 확인 실패)';}throw e;}
    }
    async function review(id,title,button,tools){
      if(!valid()||dialog)return;opener=button;
      dialog=node('dialog','era-wrong-dialog');dialog.id='eraWrongDialog';dialog.setAttribute('aria-label',title+' 오답 다시보기');
      const head=node('header','era-wrong-head'),heading=node('h2','',title+' · 오답 다시보기'),x=node('button','era-wrong-close','닫기');x.type='button';x.onclick=()=>close(true);head.append(heading,x);const body=node('div','era-wrong-body','저장된 오답을 불러오는 중…');body.setAttribute('role','status');dialog.append(head,body);doc.body.append(dialog);const current=dialog;if(root.HanqUiLocks)lockRelease=root.HanqUiLocks.acquire(doc.querySelector('#app'));
      dialog.addEventListener('cancel',e=>{e.preventDefault();close(true);});dialog.addEventListener('click',e=>{if(e.target===current)close(true);});
      dialog.addEventListener('keydown',e=>{if(e.defaultPrevented||e.key!=='Tab'||e.altKey||e.ctrlKey||e.metaKey)return;const nodes=[...current.querySelectorAll('button,input,a[href],[tabindex="0"]')].filter(n=>!n.disabled);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}});
      if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');x.focus();
      try{const records=[await readReview(id,tools)];if(!valid()||dialog!==current)return;body.replaceChildren();body.removeAttribute('role');const hint=node('p','era-wrong-scope','마지막 제출에서 틀린 문항만 다시 풉니다. Tab 또는 Enter로 채점하고 다음 빈칸으로 이동합니다. 재풀이 결과는 저장하지 않습니다.');hint.id='era-practice-hint';body.append(hint);let fieldCount=0,imeAdvanceTarget=null,imeAdvanceUntil=0,pointerVersion=0,keyVersion=0;
        current.addEventListener('pointerdown',()=>{pointerVersion++;imeAdvanceTarget=null;});
        current.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.altKey&&!e.ctrlKey&&!e.metaKey&&(e.repeat&&e.target===x||e.target===imeAdvanceTarget&&Date.now()<imeAdvanceUntil)){e.preventDefault();e.stopPropagation();}},true);
        current.addEventListener('keyup',e=>{if(e.key==='Enter'||e.code==='Enter'){keyVersion++;imeAdvanceTarget=null;}});
        if(!records.some(r=>r.stats.wrong.length)){body.append(node('p','era-wrong-empty',records[0].stats.finalSubmitted?title+'에 저장된 오답이 없습니다.':title+'의 제출 기록이 없습니다.'));return;}
        for(const record of records){
          for(const item of record.stats.wrong){
            const card=node('article','era-wrong-item');card.dataset.itemId=item.id;card.dataset.era=id;
            const topic=(record.model.subtopics||[]).find(t=>t.id===item.subtopicId);if(topic&&topic.title)card.append(node('p','era-practice-topic',topic.title));
            card.append(node('h3','',String(item.originalNumberLabel||item.originalNumber||'')+' · 오답 재풀이'));
            body.append(card);
            const engine=root.HanqTextbookSourceQuiz;
            let slots;try{slots=engine.practiceSlots(item);}catch(e){card.append(node('p','era-wrong-error','이 문항의 채점 정보를 확인하지 못했습니다.'));continue;}
            const fields=[],feedback=[],question=node('div','era-wrong-question');card.append(question);
            function field(slot,label){
              const wrap=node('span','era-practice-slot'),input=node('input','era-practice-input'),result=node('span','era-practice-feedback');
              input.type='text';input.maxLength=2000;input.autocomplete='off';input.spellcheck=false;input.setAttribute('aria-label',label);input.dataset.slotId=slot.id;input.enterKeyHint='next';
              result.id='era-practice-feedback-'+fieldCount++;input.setAttribute('aria-describedby',hint.id+' '+result.id);input.setAttribute('aria-keyshortcuts','Tab Enter');
              result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.hidden=true;wrap.append(input,result);fields.push(input);feedback.push(result);
              const index=fields.length-1;let composing=false,composedAt=0,pendingAction=null,completionTimer=null;
              input.addEventListener('focus',()=>win.requestAnimationFrame(()=>{
                if(!valid()||dialog!==current||doc.activeElement!==input)return;
                const bounds=input.getBoundingClientRect(),top=head.getBoundingClientRect().bottom+8,bottom=current.getBoundingClientRect().bottom-8;
                if(bounds.top<top)current.scrollTop-=top-bounds.top;else if(bounds.bottom>bottom)current.scrollTop+=bounds.bottom-bottom;
              }));
              function keyboardAction(key,shiftKey){
                const nodes=[...current.querySelectorAll('button,input,a[href],[tabindex="0"]')].filter(n=>!n.disabled),step=key==='Tab'&&shiftKey?-1:1;
                return {key,step,pointerVersion,keyVersion,nativeTarget:nodes[(nodes.indexOf(input)+step+nodes.length)%nodes.length]};
              }
              function finish(action){
                if(!valid()||dialog!==current||!input.isConnected||composing)return;
                grade(index);
                // A native IME Tab may already have moved focus. Do not steal focus after a pointer move.
                if(!action||action.pointerVersion!==pointerVersion||doc.activeElement!==input&&(action.key!=='Tab'||doc.activeElement!==action.nativeTarget))return;
                const inputs=[...current.querySelectorAll('.era-practice-input')],next=inputs.indexOf(input)+action.step;
                if(next<0)x.focus();else if(next<inputs.length)inputs[next].focus();else x.focus();
                if(action.ime&&action.key==='Enter'&&action.keyVersion===keyVersion){imeAdvanceTarget=doc.activeElement;imeAdvanceUntil=Date.now()+100;}
              }
              function settleComposition(){
                clearTimeout(completionTimer);completionTimer=setTimeout(()=>{
                  completionTimer=null;if(composing||!valid()||dialog!==current||!input.isConnected)return;
                  const action=pendingAction;pendingAction=null;
                  if(action||result.hidden&&input.value.trim())finish(action);
                },0);
              }
              input.addEventListener('compositionstart',()=>{if(imeAdvanceTarget===input)imeAdvanceTarget=null;composing=true;pendingAction=null;clearTimeout(completionTimer);});
              input.addEventListener('compositionend',()=>{composing=false;composedAt=Date.now();if(pendingAction||doc.activeElement!==input)settleComposition();});
              input.addEventListener('input',()=>{if(imeAdvanceTarget===input)imeAdvanceTarget=null;result.textContent='';result.hidden=true;delete result.dataset.result;delete input.dataset.result;input.removeAttribute('aria-invalid');if(!composing&&(pendingAction||doc.activeElement!==input))settleComposition();});
              input.addEventListener('blur',()=>{if(!composing&&(pendingAction||result.hidden&&input.value.trim()))settleComposition();});
              input.addEventListener('keydown',e=>{
                const inComposition=composing||e.isComposing,recentCommit=Date.now()-composedAt<100,key=e.key==='Tab'||e.key==='Enter'?e.key:(inComposition||recentCommit)&&(e.code==='Tab'||e.code==='Enter')?e.code:'';
                if(!key||e.altKey||e.ctrlKey||e.metaKey)return;
                if(key==='Enter'&&imeAdvanceTarget===input&&Date.now()<imeAdvanceUntil){e.preventDefault();return;}
                if(inComposition){if(!e.repeat)pendingAction=Object.assign(keyboardAction(key,e.shiftKey),{ime:true});return;}
                if(e.keyCode===229&&!recentCommit)return;
                e.preventDefault();if(e.repeat||!valid()||dialog!==current||!input.isConnected)return;
                const action=keyboardAction(key,e.shiftKey);
                if(recentCommit&&(key==='Enter'||e.keyCode===229)){pendingAction=Object.assign(action,{ime:true});settleComposition();return;}
                clearTimeout(completionTimer);pendingAction=null;finish(action);
              });return wrap;
            }
            if(item.segments&&item.segments.length){
              for(const segment of item.segments){if(segment.type==='text')appendText(question,segment.text);else{
                const blank=item.blanks.find(b=>b.id===segment.id);question.append(doc.createTextNode(' ('));
                (blank.parts||[blank]).forEach((part,i)=>{if(i)question.append(doc.createTextNode(blank.partSeparator||', '));question.append(field(slots.find(s=>s.id===part.id),'문제 '+(item.originalNumber||'')+' 빈칸 '+(fields.length+1)));});question.append(doc.createTextNode(') '));
              }}
            }else appendText(question,item.text||item.sourceText||'');
            for(const collection of [item.events,item.choices])if(collection&&collection.length){const list=node('ul','era-wrong-choices');collection.forEach(c=>{const li=node('li','');appendText(li,c.sourceText||c.text);list.append(li);});card.append(list);}
            if(item.kind==='classification')slots.forEach((slot,i)=>{const row=node('div','era-practice-classification'),label=node('span','');appendText(label,item.subitems[i].sourceText);row.append(label,field(slot,label.textContent));card.append(row);});
            function grade(index){
              if(!valid()||dialog!==current||!card.isConnected)return;
              const graded=engine.gradePractice(item,fields.map(f=>f.value));
              graded.slots.forEach((r,i)=>{if(Number.isInteger(index)&&index!==i)return;const f=feedback[i];f.textContent=r.feedback;f.hidden=false;f.dataset.result=r.complete?(r.correct?'correct':'wrong'):'empty';fields[i].dataset.result=f.dataset.result;fields[i].setAttribute('aria-invalid',String(r.complete&&!r.correct));});
            }
          }
        }
      }catch(e){if(valid()&&dialog===current){body.replaceChildren(node('p','era-wrong-error',title+' 오답을 불러오지 못했습니다. 닫고 다시 시도해 주세요.'));}}
    }
    if(options.aggregate){
      const section=node('section','era-progress-tools era-aggregate'),heading=node('h2','','시대별 학습 - 오답 빈칸 문제'),list=node('div','era-wrong-menu');
      section.append(heading,list);host.append(section);owned.push(section);
      eras.forEach((id,index)=>{
        const tools=node('div','era-wrong-era-row'),b=node('button','era-wrong-review',eraTitles[index]),status=node('span','era-progress-status',' (확인 중)');
        tools.dataset.reviewEra=id;tools.dataset.title=eraTitles[index];b.type='button';b.dataset.era=id;b.setAttribute('aria-label',eraTitles[index]+' 오답 다시 풀기');status.id='era-wrong-count-'+id;status.setAttribute('role','status');status.setAttribute('aria-live','polite');b.setAttribute('aria-describedby',status.id);b.append(status);tools.append(b);list.append(tools);
        b.onclick=()=>review(id,tools.dataset.title,b,tools);
        queue.push(async()=>{try{await readReview(id,tools);}catch(e){/* The current request paints its own error. */}});
      });
    }
    for(const card of host.querySelectorAll('.period.ready[data-id]')){
      const id=card.dataset.id;if(!eras.includes(id))continue;
      const row=node('div','era-progress-row'),tools=node('div','era-progress-tools');tools.dataset.title=card.querySelector('strong')?.textContent||id;
      card.before(row);row.append(card,tools);owned.push(row);
      const status=node('span','era-progress-status','확인 중');status.setAttribute('role','status');status.setAttribute('aria-live','polite');tools.append(status);
      const load=async()=>{try{const record=await read(id);if(valid())paint(tools,record);}catch(e){if(!valid())return;status.replaceChildren(doc.createTextNode('확인 실패'));status.title='빈칸 학습 완료 상태를 확인하지 못했습니다.';}};queue.push(load);
    }
    async function worker(){while(valid()&&queue.length)await queue.shift()();}
    controller.ready=Promise.all([worker(),worker()]);return controller;
  }
  function stop(){if(active)active.stop();}
  root.HanqEraProgress={mount,stop,summary};if(typeof module==='object'&&module.exports)module.exports=root.HanqEraProgress;
})(typeof window==='object'?window:globalThis);
