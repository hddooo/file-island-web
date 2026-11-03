/* Authenticated source-bound summary consumer. No source data or persistence.
 * Uses existing manifest and canonical quiz GET endpoints; never progress APIs. */
(function(root){
  'use strict';
  var NEW='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  var catalog=root.HanqPrivateTextbook;
  if(!catalog&&typeof module!=='undefined'&&module.exports)catalog=require('./private-textbook');
  function fail(name){throw new TypeError('Invalid source summary: '+name);}
  function equal(a,b){return JSON.stringify(a)===JSON.stringify(b);}
  function validate(manifest,quiz,profile,revision,quizId){
    if(revision!==NEW||!manifest||manifest.schemaVersion!=='hanq-semantic-manifest/1'||!manifest.source||manifest.source.sha256!==revision||manifest.source.revision!==revision||manifest.source.totalPdfPages!==147)fail('manifest source');
    if(!Array.isArray(manifest.quizzes)||manifest.quizzes.filter(function(x){return x.id===quizId;}).length!==1)fail('listed quiz');
    if(!quiz||quiz.id!==quizId||!quiz.source||quiz.source.sha256!==revision||!Array.isArray(quiz.items)||!Array.isArray(quiz.subtopics))fail('canonical quiz');
    if(!profile||profile.schemaVersion!=='hanq-source-summary/1'||profile.sourceRevision!==revision||profile.quizId!==quizId||!/^[a-f0-9]{64}$/.test(profile.sourceQuizVersion)||!Array.isArray(profile.groups)||profile.groups.length!==quiz.subtopics.length)fail('profile');
    var seen=new Set();
    profile.groups.forEach(function(g,gi){var sub=quiz.subtopics[gi];
      if(!g||g.subtopicId!==sub.id||typeof g.title!=='string'||!g.title.trim()||typeof g.overview!=='string'||Array.from(g.overview).length>150||!Array.isArray(g.rows))fail('group');
      var items=quiz.items.filter(function(i){return i.subtopicId===sub.id;});
      if(g.rows.length!==items.length||items.length!==sub.itemCount)fail('coverage');
      g.rows.forEach(function(r,ri){var i=items[ri];
        if(!i||seen.has(i.id)||r.itemId!==i.id||!i.answer||r.term!==i.answer.text||r.stem!==i.text||!equal(r.events,(i.events||[]).map(function(e){return e.sourceText;})))fail('literal row');
        if(!i.source||i.source.sha256!==revision||!i.verification||i.verification.status!=='source-verified'||i.verification.textVerified!==true||i.verification.answerPairVerified!==true)fail('source verification');
        seen.add(i.id);
      });
    });
    if(seen.size!==quiz.items.length)fail('item coverage');
    return profile;
  }
  function canonicalVersion(quiz){
    var text=JSON.stringify({schema:quiz.schemaVersion,source:quiz.source,items:quiz.items});
    if(root.crypto&&root.crypto.subtle&&root.TextEncoder)return root.crypto.subtle.digest('SHA-256',new root.TextEncoder().encode(text)).then(function(buffer){return Array.from(new Uint8Array(buffer)).map(function(n){return n.toString(16).padStart(2,'0');}).join('');});
    if(typeof require==='function')return Promise.resolve(require('node:crypto').createHash('sha256').update(text).digest('hex'));
    return Promise.reject(new Error('summary_version_unavailable'));
  }
  function pageFor(profile,quiz){var blocks=[];
    function clue(row){var item=quiz.items.find(function(i){return i.id===row.itemId;});
      if(item&&item.kind==='classification'){
        if(!Array.isArray(item.subitems)||!Array.isArray(item.choices)||typeof item.choicesLabelSourceText!=='string')fail('classification context');
        var details=item.subitems.map(function(s){return s.sourceText;}).concat(item.choicesLabelSourceText,item.choices.map(function(c){return c.sourceText;}));
        if(details.some(function(s){return typeof s!=='string';}))fail('classification source text');return [row.stem].concat(details).join('\n');
      }return [row.stem].concat(row.events).join('\n');
    }
    profile.groups.forEach(function(g,gi){var id='source-summary-'+gi;
      blocks.push({id:id+'-title',type:'heading',level:2,lines:[{spans:[{text:g.title,bold:true}]}]});
      blocks.push({id:id+'-guide',type:'text',lines:[{spans:[{text:g.overview}]}]});
      var rows=[{cells:['정답·핵심어','원문 단서'].map(function(text,ci){return {id:id+'-h'+ci,rowIndex:0,columnIndex:ci,rowSpan:1,colSpan:1,header:true,scope:'col',lines:[{spans:[{text:text,bold:true}]}]};})}];
      g.rows.forEach(function(r,ri){rows.push({cells:[r.term,clue(r)].map(function(text,ci){return {id:id+'-r'+ri+'-c'+ci,rowIndex:ri+1,columnIndex:ci,rowSpan:1,colSpan:1,header:false,lines:[{spans:[{text:text,bold:ci===0}]}],sourceQuestionId:r.itemId};})});});
      blocks.push({id:id+'-table',type:'table',layoutRole:'native-table',columnCount:2,headerRowCount:1,rows:rows});
    });
    return {schemaVersion:'hanq-semantic/1',pdfPage:quiz.items[0].pdfPage,sourceSha256:profile.sourceRevision,width:595.32,height:841.92,blocks:blocks,reviewStatus:'unverified',summaryPreviewOnly:true};
  }
  function create(options){options=options||{};var api=options.api||root.HanqApi,doc=options.document||root.document,renderer=options.renderer||root.HanqTextbookSemantic;
    var generation=0,shell=null,child=null,unsubscribe=null;
    function identity(){var s=api&&api.state&&api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId?String(s.ownerId)+':'+String(s.epoch):'';}
    function stop(){generation++;if(unsubscribe)unsubscribe();unsubscribe=null;if(child)child.cleanup();child=null;if(shell)shell.remove();shell=null;}
    function mount(host,eraId,hooks){stop();if(!host)return Promise.resolve();hooks=hooks||{};
      var revision=hooks.sourceRevision,session=identity(),ticket=generation;
      shell=doc.createElement('section');shell.className='private-textbook textbook-source-summary history-notes-design';shell.setAttribute('data-history-edition','81');
      var status=doc.createElement('p');status.className='textbook-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');shell.appendChild(status);host.appendChild(shell);
      function current(){return generation===ticket&&identity()===session&&host.isConnected;}
      if(api&&api.onChange)unsubscribe=api.onChange(function(){if(identity()!==session){var element=host;stop();mount(element,eraId,hooks);}});
      if(!session){status.textContent='요약은 로그인한 회원이 볼 수 있어요.';return Promise.resolve();}
      var info=catalog&&catalog.sourceInfo(revision),era=catalog&&catalog.eraFor(eraId,revision),known=catalog&&catalog.erasFor(revision).some(function(e){return e.id===eraId||eraId==='ancient'&&e.id==='samguk'||eraId==='gojoseon'&&e.id==='prehistory'||/^joseon-(early|late)$/.test(eraId)&&e.id==='joseon';});
      if(revision!==NEW||!info||!known||!catalog.revisionRoutesReady(doc,eraId,revision)){status.textContent='이 판본의 요약을 준비하고 있어요.';return Promise.resolve();}
      var quizId=era.id==='samguk'?'ancient':era.id;
      if(['prehistory','ancient','nambuk','goryeo','joseon','opening','colonial','modern'].indexOf(quizId)<0){status.textContent='이 자료의 요약을 준비하고 있어요.';return Promise.resolve();}
      status.textContent='원문에 연결된 요약을 불러오는 중…';
      return Promise.resolve().then(function(){return api.textbookSemanticManifest(revision);}).then(function(m){if(!current())return;var p=m&&m.sourceSummariesByQuiz&&m.sourceSummariesByQuiz[quizId];if(!p)fail('missing summary');return api.textbookSemanticQuiz(quizId,revision).then(function(q){validate(m,q,p,revision,quizId);return canonicalVersion(q).then(function(v){if(v!==p.sourceQuizVersion)fail('canonical version');return {profile:p,quiz:q};});});}).then(function(data){
        if(!data||!current())return;var panel=doc.createElement('div');panel.className='textbook-semantic-library-content';shell.appendChild(panel);
        if(!renderer||typeof renderer.render!=='function')fail('renderer unavailable');child=renderer.render(panel,pageFor(data.profile,data.quiz),{});
        return Promise.resolve(child.ready).then(function(){if(current())status.textContent='81회 대비 · 원문 단서와 정답 요약';});
      }).catch(function(error){if(!current())return;if(child)child.cleanup();child=null;while(shell.children.length>1)shell.lastChild.remove();status.textContent=error&&error.status===401?'로그인 상태를 확인해 주세요.':'요약을 불러오지 못했어요. 개념 학습에서 원문을 확인해 주세요.';});
    }
    return {mount:mount,stop:stop};
  }
  var singleton=null;var exported={create:create,validate:validate,canonicalVersion:canonicalVersion,pageFor:pageFor,mount:function(host,era,hooks){if(!singleton)singleton=create();return singleton.mount(host,era,hooks);},stop:function(){if(singleton)singleton.stop();}};
  root.HanqSourceSummary=exported;if(typeof module!=='undefined'&&module.exports)module.exports=exported;
})(typeof window!=='undefined'?window:globalThis);
