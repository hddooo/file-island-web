(function(root){
  'use strict';
  const revision='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  const sources={joseon:'8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1',goryeo:'245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9'};
  const counts={joseon:{items:172,groups:172,slots:172},goryeo:{items:100,groups:103,slots:104}};
  function create(options){
    const {document:doc,api,era,ownerId,isCurrent}=options;
    const binding=era==='opening'?options.contract:{revision,sourceSha256:sources[era],counts:counts[era]};
    if(!binding||!/^[a-f0-9]{64}$/.test(binding.revision)||!/^[a-f0-9]{64}$/.test(binding.sourceSha256)||!binding.counts||!ownerId||typeof isCurrent!=='function')throw Error('workspace_binding');
    const host=doc.createElement('section');let controller=null,loading=null,alive=true,generation=0;
    function current(g){if(!alive||!isCurrent()||(g!=null&&g!==generation))throw Error('session_changed');}
    function discard(){generation++;if(controller)controller.cleanup();controller=null;loading=null;host.replaceChildren();}
    function validate(model){
      if(!model||model.id!==era||!model.source||model.source.sha256!==binding.revision||model.source.scriptSha256!==binding.sourceSha256||!model.version||!Array.isArray(model.items)||model.items.length!==binding.counts.items||!Array.isArray(model.scriptResponseGroups)||model.scriptResponseGroups.length!==binding.counts.groups)throw Error('workspace_source_mismatch');
      const fields=new Set(),slots=new Set();for(const group of model.scriptResponseGroups){const item=model.items.find(i=>i.id===group.itemId);if(!item||fields.has(group.fieldId)||!Array.isArray(group.slotIds)||!group.slotIds.length)throw Error('workspace_mapping');fields.add(group.fieldId);const expected=item.kind==='classification'?item.responseSlots.map(s=>s.id):item.blanks.flatMap(b=>b.parts?b.parts.map(p=>p.id):[b.id]);let previous=-1;for(const slot of group.slotIds){const index=expected.indexOf(slot);if(index<0||index<=previous)throw Error('workspace_mapping');previous=index;if(slots.has(slot))throw Error('workspace_mapping');slots.add(slot);}}
      if(slots.size!==binding.counts.slots)throw Error('workspace_slots');
      return model;
    }
    async function load(g){
      current(g);const model=validate(await api.textbookSemanticQuiz(era,binding.revision));current(g);
      const selected=doc.querySelector('meta[name="hanq-source-grading"]'),grading=selected?(root.HanqSourceGradingV2Session&&root.HanqSourceGradingV2Session.selected(doc)?root.HanqSourceGradingV2Session.create({api,era,sourceRevision:binding.revision,isCurrent:()=>alive&&g===generation&&isCurrent()}):null):null;if(selected&&!grading)throw Error('source_grading_unavailable');
      const first=await (grading?grading.load():api.textbookSourceWorkspace(era,binding.revision));current(g);if(first.version!==model.version)throw Error('workspace_version');let initial=first;
      const checkedReview=first.reviewSelectionAvailable===true&&Array.isArray(first.workspace?.selectedReviewQuestionIds);
      controller=(options.renderer||root.HanqTextbookSourceQuiz).render(host,model,{ownerId,checkedReview,manualSave:true,sequential:true,gradingVersion:grading?2:1,loadLegacyProgress:grading?()=>grading.loadLegacy():undefined,sourceRevision:binding.revision,recovery:options.recovery||root.HanqAuthSession,
        loadProgress:async()=>{current(g);const response=initial||await (grading?grading.load():api.textbookSourceWorkspace(era,binding.revision));initial=null;current(g);if(response.version!==model.version)throw Error('workspace_version');return response;},
        saveProgress:async body=>{current(g);const response=await (grading?grading.save(body):api.saveTextbookSourceWorkspace(era,body,binding.revision));current(g);if(response.version!==model.version)throw Error('workspace_version');return response;}
      });await controller.ready;current(g);
    }
    function show(parent,entry){current();if(entry&&entry.fresh)discard();parent.append(host);if(!loading){const g=generation;host.textContent='계정별 빈칸 퀴즈를 불러오는 중입니다.';loading=load(g).catch(e=>{if(alive&&g===generation&&isCurrent()){if(controller)controller.cleanup();controller=null;host.replaceChildren();const note=doc.createElement('p');note.setAttribute('role','status');note.textContent='퀴즈를 불러오지 못했습니다. 다시 시도해 주세요.';const retry=doc.createElement('button');retry.type='button';retry.textContent='다시 시도';retry.onclick=()=>{loading=null;show(parent);};host.append(note,retry);}throw e;});loading.catch(()=>{});}return loading;}
    return {show,leave(){current();discard();host.remove();},prepareLeave(){return controller?controller.prepareLeave():Promise.resolve();},hasUnsaved(){return !!controller&&controller.hasUnsaved();},stop(){alive=false;discard();host.remove();}};
  }
  function fromDocument(doc){const meta=doc.querySelector('meta[name="hanq-history81-workspace-api"]');return meta&&meta.content==='2062b84b2c7f86de701cc757a23c113fa11e4c09'?create:null;}
  root.HanqHistory81Workspace={create,fromDocument};if(typeof module==='object'&&module.exports)module.exports=root.HanqHistory81Workspace;
})(typeof window==='object'?window:globalThis);
