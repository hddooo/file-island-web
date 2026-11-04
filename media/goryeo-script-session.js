(function(root){
  'use strict';
  const PDF81='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  function create(options){
    options=options||{};const doc=options.document||root.document,win=doc.defaultView,api=options.api||root.HanqApi;
    let host=null,reader=null,unsubscribe=null,abort=null,generation=0,identity='',route='',canonical=null;
    function session(){const s=api&&api.state&&api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId?String(s.ownerId)+':'+String(s.epoch):'';}
    function stop(){generation++;if(abort)abort.abort();abort=null;if(unsubscribe)unsubscribe();unsubscribe=null;if(reader)reader.stop();reader=null;if(canonical)canonical.remove();canonical=null;host=null;identity='';win.removeEventListener('hashchange',hashchange);}
    function modeFromLocation(){const slug=win.location.hash.split('/')[2];return slug==='exam-lines'?'exam':slug==='source-quiz'?'practice':'study';}
    function sameReaderRoute(href){if(!options.modeRouting||!route)return false;const from=new win.URL(route),to=new win.URL(href),a=from.hash.split('/'),b=to.hash.split('/');return from.origin===to.origin&&from.pathname===to.pathname&&from.search===to.search&&a[0]===b[0]&&a[1]===b[1]&&['webtoon','exam-lines','source-quiz'].includes(b[2]);}
    function routeForMode(mode){const u=new win.URL(route),parts=u.hash.split('/');parts[2]=mode==='exam'?'exam-lines':mode==='practice'||mode==='answers'?'source-quiz':'webtoon';u.hash=parts.join('/');route=u.href;return route;}
    function hashchange(){if(host&&win.location.href!==route){if(sameReaderRoute(win.location.href))route=win.location.href;else stop();}}
    function valid(g){return !!host&&g===generation&&identity&&session()===identity&&win.location.href===route;}
    function notice(message){if(!host)return;const p=doc.createElement('p');p.setAttribute('role','status');p.textContent=message;host.replaceChildren(p);}
    async function mount(element,transport){
      stop();host=element;route=win.location.href;identity=session();const g=generation;
      // No built-in endpoint or implied capability. The integration owner injects the reviewed transport.
      if(!identity){notice('로그인 후 자료를 확인해 주세요.');return false;}
      if(!transport||transport.ready!==true||!/^[a-f0-9]{64}$/.test(transport.sourceSha256)||typeof transport.loadBundle!=='function'||typeof transport.loadFigure!=='function'){
        notice('고려 원문 자료 연결을 준비하고 있습니다.');return false;
      }
      abort=new win.AbortController();const signal=abort.signal;
      unsubscribe=api.onChange(()=>{if(session()!==identity){const target=host;stop();if(target)target.replaceChildren();}});
      win.addEventListener('hashchange',hashchange);notice('고려 학습 자료를 불러오는 중입니다.');
      try{
        const bundle=await transport.loadBundle({signal});if(!valid(g))return false;
        if(!bundle||!bundle.source||bundle.source.sha256!==transport.sourceSha256)throw Error('source_changed');
        const renderer=options.renderer||root.HanqGoryeoScriptReader,prepared=await renderer.prepare(bundle);if(!valid(g))return false;
        reader=renderer.mount(host,prepared,{externalNavigation:true,initialTopic:options.initialTopic,initialMode:options.initialMode,routeForMode:options.modeRouting?routeForMode:null,modeFromLocation:options.modeRouting?modeFromLocation:null,
          acquireModalLock:()=>{const locks=options.uiLocks||root.HanqUiLocks;if(!locks||!options.appRoot)throw Error('Missing app modal lock');return locks.acquire(options.appRoot);},
          loadFigure:async (name,request={})=>{if(!valid(g))throw Error('session_changed');const controller=new win.AbortController(),cancel=()=>controller.abort();signal.addEventListener('abort',cancel,{once:true});if(request.signal)request.signal.addEventListener('abort',cancel,{once:true});if(signal.aborted||request.signal&&request.signal.aborted)cancel();try{const blob=await transport.loadFigure(name,{signal:controller.signal});if(!valid(g))throw Error('session_changed');return blob;}finally{signal.removeEventListener('abort',cancel);if(request.signal)request.signal.removeEventListener('abort',cancel);}}
        });
        const catalog=options.sourceCatalog||root.HanqPrivateTextbook;
        const revised=!!(catalog&&catalog.revisionRoutesReady(doc,'goryeo',PDF81));
        if(revised||options.offerLegacyQuiz===true){
          canonical=doc.createElement('a');canonical.textContent=revised?'81회 교재의 기존 저장·채점 문제로 이동':'79회 교재의 기존 문제로 이동 (별도 자료)';
          const u=new win.URL(route);if(revised)u.searchParams.set('textbookSource',PDF81);else u.searchParams.delete('textbookSource');u.searchParams.delete('textbookMode');u.searchParams.delete('textbookOriginal');u.searchParams.delete('textbookOriginalSource');u.hash='#chapter/goryeo/bookquiz';canonical.href=u.href;
          canonical.onclick=e=>{if(!valid(g)||revised&&!catalog.revisionRoutesReady(doc,'goryeo',PDF81)){e.preventDefault();return;}if(typeof options.navigateCanonical!=='function'){e.preventDefault();return;}e.preventDefault();const href=u.href;stop();options.navigateCanonical(href);};host.prepend(canonical);
        }
        return true;
      }catch(error){if(valid(g)){const target=host;stop();const p=doc.createElement('p');p.setAttribute('role','status');p.textContent='자료를 불러오지 못했습니다. 다시 진입해 주세요.';target.replaceChildren(p);}return false;}
    }
    // Call BEFORE the existing app popstate handler. Return true only for this reader's same-route history.
    function handlePopState(){if(!host)return false;if(win.location.href!==route&&sameReaderRoute(win.location.href))route=win.location.href;if(win.location.href!==route||session()!==identity){stop();return false;}return !!(reader&&reader.handlePopState());}
    return {mount,stop,handlePopState};
  }
  root.HanqGoryeoScriptSession={create};if(typeof module==='object'&&module.exports)module.exports=root.HanqGoryeoScriptSession;
})(typeof window==='object'?window:globalThis);
