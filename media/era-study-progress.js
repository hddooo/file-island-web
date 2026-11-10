(function(root){
  'use strict';
  const revision='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  const eras=['prehistory','samguk','nambuk','goryeo','joseon','opening','colonial','modern'];
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
    return {done,total:model.items.length,complete:result.workspace.status==='completed'||done===model.items.length,wrong};
  }
  function mount(host,options){
    stop();options=options||{};
    const doc=host.ownerDocument,win=doc.defaultView,api=options.api||root.HanqApi;
    let alive=true,dialog=null,opener=null,unsubscribe=null,queue=[],owned=[],lockRelease=null;
    const owner=identity();
    function identity(){const s=api&&api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId?s.ownerId+':'+s.epoch:'';}
    function valid(){return alive&&!!owner&&identity()===owner&&host.isConnected;}
    function node(tag,cls,text){const n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;return n;}
    function close(focus){if(dialog){if(dialog.open&&dialog.close)dialog.close();dialog.remove();dialog=null;}if(lockRelease){lockRelease();lockRelease=null;}if(focus&&opener&&opener.isConnected)opener.focus();opener=null;}
    function dispose(){alive=false;close(false);if(unsubscribe)unsubscribe();unsubscribe=null;win.removeEventListener('popstate',back);owned.forEach(n=>{if(n.classList.contains('era-progress-row')){const card=n.querySelector('.period');if(card)n.before(card);}n.remove();});owned=[];if(active===controller)active=null;}
    function back(){close(false);}
    const controller={stop:dispose};active=controller;
    win.addEventListener('popstate',back);
    if(api&&api.onChange)unsubscribe=api.onChange(()=>{if(identity()!==owner){dispose();host.querySelectorAll('.era-progress-tools').forEach(n=>n.remove());}});
    async function read(id){const quizId=id==='samguk'?'ancient':id;const model=await api.textbookSemanticQuiz(quizId,revision);if(!valid())throw Error('session_changed');const result=await api.textbookSourceWorkspace(quizId,revision);if(!valid())throw Error('session_changed');if(model.id!==quizId)throw Error('era_binding');if(!model.version){const bytes=new win.TextEncoder().encode(JSON.stringify({schema:model.schemaVersion,source:model.source,items:model.items}));model.progressVersion=Array.from(new Uint8Array(await win.crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');if(!valid())throw Error('session_changed');}return {model,result,stats:summary(model,result)};}
    function paint(tools,record){const check=tools.querySelector('.era-complete'),button=tools.querySelector('.era-wrong-review');check.hidden=!record.stats.complete;check.title=record.result.workspace.status==='completed'?'빈칸 퀴즈 저장/완료 · 채점한 응답 '+record.stats.done+' / '+record.stats.total+'문항':'빈칸 '+record.stats.done+' / '+record.stats.total+'문항 채점 완료';button.disabled=false;button.textContent='오답 다시보기';button.title='저장된 오답 '+record.stats.wrong.length+'문항';button.setAttribute('aria-label',tools.dataset.title+' 오답 다시보기, '+record.stats.wrong.length+'문항');tools.querySelector('.era-progress-status').textContent='';}
    async function review(id,title,button,tools){
      if(!valid()||dialog)return;opener=button;
      dialog=node('dialog','era-wrong-dialog');dialog.id='eraWrongDialog';dialog.setAttribute('aria-label',title+' 오답 다시보기');
      const head=node('header','era-wrong-head'),heading=node('h2','',title+' · 오답 다시보기'),x=node('button','era-wrong-close','닫기');x.type='button';x.onclick=()=>close(true);head.append(heading,x);const body=node('div','era-wrong-body','저장된 오답을 불러오는 중…');body.setAttribute('role','status');dialog.append(head,body);doc.body.append(dialog);const current=dialog;if(root.HanqUiLocks)lockRelease=root.HanqUiLocks.acquire(doc.querySelector('#app'));
      dialog.addEventListener('cancel',e=>{e.preventDefault();close(true);});dialog.addEventListener('click',e=>{if(e.target===current)close(true);});
      dialog.addEventListener('keydown',e=>{if(e.defaultPrevented||e.key!=='Tab'||e.altKey||e.ctrlKey||e.metaKey)return;const nodes=[...current.querySelectorAll('button,input,a[href],[tabindex="0"]')].filter(n=>!n.disabled);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}});
      if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');x.focus();
      try{const records=[],failed=[];for(const era of (id==='all'?eras:[id])){try{records.push(await read(era));}catch(e){if(!valid()||dialog!==current)return;failed.push(era);}}if(!valid()||dialog!==current)return;if(id!=='all'&&records[0])paint(tools,records[0]);body.replaceChildren();body.removeAttribute('role');const hint=node('p','era-wrong-scope','현재 저장된 오답만 다시 풉니다. Tab 또는 Enter로 채점하고 다음 빈칸으로 이동합니다. 재풀이 결과는 저장하지 않습니다.');hint.id='era-practice-hint';body.append(hint);let fieldCount=0;if(failed.length)body.append(node('p','era-wrong-error','일부 시대의 기록을 불러오지 못했습니다. 닫고 다시 시도해 주세요.'));
        if(!records.some(r=>r.stats.wrong.length)&&!failed.length){body.append(node('p','era-wrong-empty','저장된 오답이 없습니다.'));return;}
        for(const record of records){
          if(id==='all'&&record.stats.wrong.length)body.append(node('h3','era-wrong-era',record.model.title));
          for(const item of record.stats.wrong){
            const card=node('article','era-wrong-item');card.dataset.itemId=item.id;
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
              const index=fields.length-1;let composing=false,composedAt=0;
              input.addEventListener('focus',()=>win.requestAnimationFrame(()=>{
                if(!valid()||dialog!==current||doc.activeElement!==input)return;
                const bounds=input.getBoundingClientRect(),top=head.getBoundingClientRect().bottom+8,bottom=current.getBoundingClientRect().bottom-8;
                if(bounds.top<top)current.scrollTop-=top-bounds.top;else if(bounds.bottom>bottom)current.scrollTop+=bounds.bottom-bottom;
              }));
              input.addEventListener('compositionstart',()=>{composing=true;});input.addEventListener('compositionend',()=>{composing=false;composedAt=Date.now();});
              input.addEventListener('input',()=>{result.textContent='';result.hidden=true;delete result.dataset.result;delete input.dataset.result;input.removeAttribute('aria-invalid');});
              input.addEventListener('keydown',e=>{
                if((e.key!=='Tab'&&e.key!=='Enter')||e.altKey||e.ctrlKey||e.metaKey||e.isComposing||composing||e.keyCode===229)return;
                e.preventDefault();
                if(e.repeat||(e.key==='Enter'&&Date.now()-composedAt<100)||!valid()||dialog!==current||!input.isConnected)return;
                grade(index);
                const inputs=[...current.querySelectorAll('.era-practice-input')],next=inputs.indexOf(input)+(e.key==='Tab'&&e.shiftKey?-1:1);
                if(next<0)x.focus();else if(next<inputs.length)inputs[next].focus();else button.focus();
              });return wrap;
            }
            if(item.segments&&item.segments.length){
              for(const segment of item.segments){if(segment.type==='text')question.append(doc.createTextNode(segment.text));else{
                const blank=item.blanks.find(b=>b.id===segment.id);question.append(doc.createTextNode(' ('));
                (blank.parts||[blank]).forEach((part,i)=>{if(i)question.append(doc.createTextNode(blank.partSeparator||', '));question.append(field(slots.find(s=>s.id===part.id),'문제 '+(item.originalNumber||'')+' 빈칸 '+(fields.length+1)));});question.append(doc.createTextNode(') '));
              }}
            }else question.append(doc.createTextNode(item.text||item.sourceText||''));
            for(const collection of [item.events,item.choices])if(collection&&collection.length){const list=node('ul','era-wrong-choices');collection.forEach(c=>list.append(node('li','',c.sourceText||c.text)));card.append(list);}
            if(item.kind==='classification')slots.forEach((slot,i)=>{const row=node('div','era-practice-classification'),label=item.subitems[i].sourceText;row.append(node('span','',label),field(slot,label));card.append(row);});
            const button=node('button','era-practice-grade','채점');button.type='button';button.onclick=()=>grade();card.append(button);
            function grade(index){
              if(!valid()||dialog!==current||!card.isConnected)return;
              const graded=engine.gradePractice(item,fields.map(f=>f.value));
              graded.slots.forEach((r,i)=>{if(Number.isInteger(index)&&index!==i)return;const f=feedback[i];f.textContent=r.feedback;f.hidden=false;f.dataset.result=r.complete?(r.correct?'correct':'wrong'):'empty';fields[i].dataset.result=f.dataset.result;fields[i].setAttribute('aria-invalid',String(r.complete&&!r.correct));});
            }
          }
        }
      }catch(e){if(valid()&&dialog===current){body.replaceChildren(node('p','','오답을 불러오지 못했습니다. 닫고 다시 시도해 주세요.'));}}
    }
    if(options.aggregate){const tools=node('section','era-progress-tools era-aggregate');tools.dataset.title='시대별 학습 - 오답 빈칸 문제';const heading=node('h2','',tools.dataset.title),b=node('button','era-wrong-review','오답 다시보기');b.type='button';tools.append(heading,b);host.append(tools);owned.push(tools);b.onclick=()=>review('all',tools.dataset.title,b,tools);}
    for(const card of host.querySelectorAll('.period.ready[data-id]')){
      const id=card.dataset.id;if(!eras.includes(id))continue;
      const row=node('div','era-progress-row'),tools=node('div','era-progress-tools');tools.dataset.title=card.querySelector('strong')?.textContent||id;
      card.before(row);row.append(card,tools);owned.push(row);
      const check=node('span','era-complete','✓');check.hidden=true;check.setAttribute('aria-label','빈칸 퀴즈 완료');
      const button=node('button','era-wrong-review','오답 다시보기');button.type='button';button.disabled=true;const status=node('span','era-progress-status','확인 중');status.setAttribute('role','status');tools.append(check,button,status);
      button.onclick=()=>review(id,tools.dataset.title,button,tools);
      const load=async()=>{try{const record=await read(id);if(valid())paint(tools,record);}catch(e){if(!valid())return;status.textContent='확인 실패';button.disabled=false;button.title='저장된 오답 다시 확인';}};queue.push(load);
    }
    async function worker(){while(valid()&&queue.length)await queue.shift()();}
    controller.ready=Promise.all([worker(),worker()]);return controller;
  }
  function stop(){if(active)active.stop();}
  root.HanqEraProgress={mount,stop,summary};if(typeof module==='object'&&module.exports)module.exports=root.HanqEraProgress;
})(typeof window==='object'?window:globalThis);
