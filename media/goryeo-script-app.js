(function(root){
  'use strict';
  function create(options){
    options=options||{};const doc=options.document||root.document,win=doc.defaultView;
    let session=null;
    function transport(){const adapter=options.adapter||root.HanqGoryeoScriptTransport;return adapter&&adapter.fromDocument?adapter.fromDocument(doc,options.api||root.HanqApi):null;}
    function available(era,step){return [0,7,8].includes(step)&&['goryeo'].includes(era)&&!new win.URL(win.location.href).searchParams.has('textbookSource')&&!!transport();}
    function stop(){if(session)session.stop();session=null;}
    function mount(host,appRoot,era,step){
      stop();const candidate=transport();if(!candidate)return Promise.resolve(false);
      session=(options.sessionFactory||root.HanqGoryeoScriptSession).create({era:'goryeo',document:doc,api:options.api||root.HanqApi,appRoot,modeRouting:true,initialMode:step===7?'exam':step===8?'practice':'study',initialTopic:'politics',uiLocks:options.uiLocks||root.HanqUiLocks,sourceCatalog:options.sourceCatalog||root.HanqPrivateTextbook,offerLegacyQuiz:false,
        navigateCanonical(href){win.history.pushState(null,'',href);win.dispatchEvent(new win.PopStateEvent('popstate',{state:null}));}
      });return session.mount(host,candidate);
    }
    function handlePopState(event){return !!(session&&session.handlePopState(event));}
    return {available,mount,stop,handlePopState};
  }
  const exported={create};if(root.document)Object.assign(exported,create());root.HanqGoryeoScriptApp=exported;
  if(typeof module==='object'&&module.exports)module.exports=exported;
})(typeof window==='object'?window:globalThis);
