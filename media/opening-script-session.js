(function(root){
  'use strict';
  function create(options){
    options=options||{};const doc=options.document||root.document,win=doc.defaultView,api=options.api||root.HanqApi;
    let host=null,reader=null,unsubscribe=null,abort=null,generation=0,identity='',route='',canonical=null,workspace=null;
    function session(){const s=api&&api.state&&api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId?String(s.ownerId)+':'+String(s.epoch):'';}
    function stop(){generation++;if(workspace)workspace.stop();workspace=null;if(abort)abort.abort();abort=null;if(unsubscribe)unsubscribe();unsubscribe=null;if(reader)reader.stop();reader=null;if(canonical)canonical.remove();canonical=null;if(host)host.replaceChildren();host=null;identity='';win.removeEventListener('hashchange',hashchange);}
    // Keep old bookmarks readable without re-entering the removed blank test.
    function normalizeLegacyRoute(){if(/^#chapter\/[^/]+\/blank-test$/.test(win.location.hash))win.history.replaceState(win.history.state,'',win.location.hash.replace(/\/blank-test$/,'/webtoon'));}
    function modeFromLocation(){const slug=win.location.hash.split('/')[2];return slug==='exam-lines'?'exam':slug==='source-quiz'?'practice':'study';}
    function sameReaderRoute(href){if(!options.modeRouting||!route)return false;const from=new win.URL(route),to=new win.URL(href),a=from.hash.split('/'),b=to.hash.split('/');return from.origin===to.origin&&from.pathname===to.pathname&&from.search===to.search&&a[0]==='#chapter'&&a[0]===b[0]&&b.length===3&&a[1]===b[1]&&['webtoon','exam-lines','source-quiz','blank-test'].includes(b[2]);}
    function routeForMode(mode){const u=new win.URL(route),parts=u.hash.split('/');parts[2]=mode==='exam'?'exam-lines':mode==='practice'||mode==='answers'?'source-quiz':'webtoon';u.hash=parts.join('/');route=u.href;return route;}
    function hashchange(){normalizeLegacyRoute();if(host&&win.location.href!==route){if(sameReaderRoute(win.location.href))route=win.location.href;else if(!workspace||!workspace.hasUnsaved())stop();}}
    function valid(g){return !!host&&g===generation&&identity&&session()===identity&&win.location.href===route;}
    function notice(message){if(!host)return;const p=doc.createElement('p');p.setAttribute('role','status');p.textContent=message;host.replaceChildren(p);}
    async function mount(element,transport){
      stop();normalizeLegacyRoute();host=element;route=win.location.href;identity=session();const g=generation;
      // No built-in endpoint or implied capability. The integration owner injects the reviewed transport.
      if(options.requireWorkspace&&typeof options.workspaceFactory!=='function'){notice('개화기 저장 기능 연결을 준비하고 있습니다.');return false;}
      if(!identity){notice('로그인 후 자료를 확인해 주세요.');return false;}
      if(!transport||transport.ready!==true||typeof transport.loadBundle!=='function'||typeof transport.loadFigure!=='function'){
        notice('개화기 원문 자료 연결을 준비하고 있습니다.');return false;
      }
      abort=new win.AbortController();const signal=abort.signal;
      unsubscribe=api.onChange(()=>{if(session()!==identity){const target=host;stop();if(target)target.replaceChildren();}});
      win.addEventListener('hashchange',hashchange);notice('개화기 학습 자료를 불러오는 중입니다.');
      try{
        const bundle=await transport.loadBundle({signal});if(!valid(g))return false;
        if(!bundle||!bundle.source||bundle.source.sha256!==transport.sourceSha256)throw Error('source_changed');
        const renderer=options.renderer||root.HanqOpeningScriptReader,prepared=await renderer.prepare(bundle,await transport.loadStructure({signal}),transport.presentation);if(!valid(g))return false;
        if(options.workspaceFactory)workspace=options.workspaceFactory({document:doc,api,era:'opening',contract:transport.workspace,ownerId:api.state().ownerId,isCurrent:()=>!!host&&g===generation&&identity&&session()===identity});
        reader=renderer.mount(host,prepared,{workspace,externalNavigation:true,initialTopic:options.initialTopic,initialMode:options.initialMode,routeForMode:options.modeRouting?routeForMode:null,modeFromLocation:options.modeRouting?modeFromLocation:null,
          acquireModalLock:()=>{const locks=options.uiLocks||root.HanqUiLocks;if(!locks||!options.appRoot)throw Error('Missing app modal lock');return locks.acquire(options.appRoot);},
          loadFigure:async (name,request={})=>{if(!valid(g))throw Error('session_changed');const controller=new win.AbortController(),cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});if(request.signal)request.signal.addEventListener('abort',cancel,{once:true});if(signal.aborted||request.signal&&request.signal.aborted)cancel();try{const blob=await transport.loadFigure(name,{signal:controller.signal});if(!valid(g))throw Error('session_changed');return blob;}finally{signal.removeEventListener('abort',cancel);if(request.signal)request.signal.removeEventListener('abort',cancel);}}
        });
        const PDF81=transport.workspace?.revision;
        const catalog=options.sourceCatalog||root.HanqPrivateTextbook;
        const revised=!!(catalog&&catalog.revisionRoutesReady(doc,'opening',PDF81));
        if(revised||options.offerLegacyQuiz===true){
          canonical=doc.createElement('a');canonical.textContent=revised?'81회 교재의 기존 저장·채점 문제로 이동':'79회 교재의 기존 문제로 이동 (별도 자료)';
          const u=new win.URL(route);if(revised)u.searchParams.set('textbookSource',PDF81);else u.searchParams.delete('textbookSource');u.searchParams.delete('textbookMode');u.searchParams.delete('textbookOriginal');u.searchParams.delete('textbookOriginalSource');u.hash='#chapter/opening/bookquiz';canonical.href=u.href;
          canonical.onclick=e=>{if(!valid(g)||revised&&!catalog.revisionRoutesReady(doc,'opening',PDF81)){e.preventDefault();return;}if(typeof options.navigateCanonical!=='function'){e.preventDefault();return;}e.preventDefault();const href=u.href;stop();options.navigateCanonical(href);};host.prepend(canonical);
        }
        return true;
      }catch(error){if(valid(g)){const target=host,owner=identity,failedRoute=route;stop();const retryGeneration=generation;const p=doc.createElement('p');p.setAttribute('role','status');p.textContent=error&&error.status===403?'자료 이용 권한을 확인해 주세요.':'자료를 불러오지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.';const retry=doc.createElement('button');retry.type='button';retry.className='osr-bundle-retry';retry.textContent='다시 불러오기';retry.onclick=()=>{if(generation===retryGeneration&&session()===owner&&win.location.href===failedRoute&&target.isConnected)mount(target,transport);};target.replaceChildren(p,retry);}return false;}
    }
    // Call BEFORE the existing app popstate handler. Return true only for this reader's same-route history.
    function handlePopState(){if(!host)return false;normalizeLegacyRoute();if(win.location.href!==route&&sameReaderRoute(win.location.href))route=win.location.href;if(win.location.href!==route||session()!==identity){if(session()!==identity||!workspace||!workspace.hasUnsaved())stop();return false;}return !!(reader&&reader.handlePopState());}
    return {mount,stop,handlePopState,hasUnsaved(){return !!workspace&&workspace.hasUnsaved();},restoreSourceRoute(){if(host&&identity&&session()===identity)win.history.replaceState(null,'',route);},prepareLeave(){return workspace?workspace.prepareLeave():Promise.resolve();}};
  }
  root.HanqOpeningScriptSession={create};if(typeof module==='object'&&module.exports)module.exports=root.HanqOpeningScriptSession;
})(typeof window==='object'?window:globalThis);
