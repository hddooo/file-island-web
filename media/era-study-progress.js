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
    return {done,total:model.items.length,complete:done===model.items.length,wrong};
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
    async function read(id){const model=await api.textbookSemanticQuiz(id,revision);if(!valid())throw Error('session_changed');const result=await api.textbookSourceWorkspace(id,revision);if(!valid())throw Error('session_changed');if(model.id!==id)throw Error('era_binding');if(!model.version){const bytes=new win.TextEncoder().encode(JSON.stringify({schema:model.schemaVersion,source:model.source,items:model.items}));model.progressVersion=Array.from(new Uint8Array(await win.crypto.subtle.digest('SHA-256',bytes))).map(x=>x.toString(16).padStart(2,'0')).join('');if(!valid())throw Error('session_changed');}return {model,result,stats:summary(model,result)};}
    function paint(tools,record){const check=tools.querySelector('.era-complete'),button=tools.querySelector('.era-wrong-review');check.hidden=!record.stats.complete;check.title='빈칸 '+record.stats.done+' / '+record.stats.total+'문항 채점 완료';button.disabled=false;button.textContent='오답 다시보기';button.title='저장된 오답 '+record.stats.wrong.length+'문항';button.setAttribute('aria-label',tools.dataset.title+' 오답 다시보기, '+record.stats.wrong.length+'문항');tools.querySelector('.era-progress-status').textContent='';}
    async function review(id,title,button,tools){
      if(!valid()||dialog)return;opener=button;
      dialog=node('dialog','era-wrong-dialog');dialog.id='eraWrongDialog';dialog.setAttribute('aria-label',title+' 오답 다시보기');
      const head=node('header','era-wrong-head'),heading=node('h2','',title+' · 오답 다시보기'),x=node('button','era-wrong-close','닫기');x.type='button';x.onclick=()=>close(true);head.append(heading,x);const body=node('div','era-wrong-body','저장된 오답을 불러오는 중…');body.setAttribute('role','status');dialog.append(head,body);doc.body.append(dialog);const current=dialog;if(root.HanqUiLocks)lockRelease=root.HanqUiLocks.acquire(doc.querySelector('#app'));
      dialog.addEventListener('cancel',e=>{e.preventDefault();close(true);});dialog.addEventListener('click',e=>{if(e.target===current)close(true);});
      dialog.addEventListener('keydown',e=>{if(e.key!=='Tab')return;const nodes=[...current.querySelectorAll('button,a[href],[tabindex="0"]')].filter(n=>!n.disabled);if(!nodes.length)return;const first=nodes[0],last=nodes[nodes.length-1];if(e.shiftKey&&doc.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&doc.activeElement===last){e.preventDefault();first.focus();}});
      if(dialog.showModal)dialog.showModal();else dialog.setAttribute('open','');x.focus();
      try{const records=[],failed=[];for(const era of (id==='all'?eras:[id])){try{records.push(await read(era));}catch(e){if(!valid()||dialog!==current)return;failed.push(era);}}if(!valid()||dialog!==current)return;if(id!=='all'&&records[0])paint(tools,records[0]);body.replaceChildren();body.removeAttribute('role');body.append(node('p','era-wrong-scope','현재 저장된 오답 기준입니다. 이후 맞힌 문제의 과거 오답 이력은 포함하지 않습니다.'));if(failed.length)body.append(node('p','era-wrong-error','일부 시대의 기록을 불러오지 못했습니다. 닫고 다시 시도해 주세요.'));
        if(!records.some(r=>r.stats.wrong.length)&&!failed.length){body.append(node('p','era-wrong-empty','저장된 오답이 없습니다.'));return;}
        for(const record of records){if(id==='all'&&record.stats.wrong.length)body.append(node('h3','era-wrong-era',record.model.title));for(const item of record.stats.wrong){const response=record.result.workspace.responses[item.id],card=node('article','era-wrong-item');card.dataset.itemId=item.id;
          card.append(node('h3','',String(item.originalNumberLabel||item.originalNumber||'')+' · 오답'));
          const question=node('p','era-wrong-question',item.sourceText||item.text||(item.segments||[]).map(s=>s.type==='text'?s.text:'(　)').join(''));card.append(question);
          if(item.events&&item.events.length){const list=node('ul','era-wrong-choices');item.events.forEach(e=>list.append(node('li','',e.sourceText)));card.append(list);}
          if(item.choices&&item.choices.length){const list=node('ul','era-wrong-choices');item.choices.forEach(c=>list.append(node('li','',c.sourceText||c.text)));card.append(list);}
          card.append(node('p','era-wrong-answer','내 답: '+response.values.join(' / ')),node('p','era-right-answer','정답: '+(item.answer&&item.answer.text||'')));body.append(card);
        }}
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
