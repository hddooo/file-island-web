/* Explicit isolated era-grading transport. Legacy storage is read-only here. */
(function(root){
 'use strict';
 function unavailable(){return Object.assign(Error('source_grading_unavailable'),{code:'source_grading_unavailable',status:503});}
 function requireV2(result){if(!result||result.gradingVersion!==2||!Array.isArray(result.supportedGradingVersions)||!result.supportedGradingVersions.includes(2)||result.gradingStorageScope!=='isolated-v2')throw unavailable();return result;}
 function selected(doc){const meta=doc.querySelector('meta[name="hanq-source-grading"]');if(!meta)return false;if(meta.content!=='2')throw unavailable();return true;}
 function create(options){
  const {api,era,sourceRevision,isCurrent}=options;
  if(!api||typeof api.textbookSourceWorkspaceV2!=='function'||typeof api.saveTextbookSourceWorkspaceV2!=='function'||typeof isCurrent!=='function')throw unavailable();
  function current(){if(!isCurrent())throw Object.assign(Error('session_changed'),{code:'session_changed'});}
  return Object.freeze({gradingVersion:2,
   async load(){current();const result=await api.textbookSourceWorkspaceV2(era,sourceRevision);current();return requireV2(result);},
   async save(body){current();if(body.gradingVersion!=null&&body.gradingVersion!==2)throw unavailable();const result=await api.saveTextbookSourceWorkspaceV2(era,Object.assign({},body,{gradingVersion:2}),sourceRevision);current();return requireV2(result);},
   async loadLegacy(){current();if(typeof api.textbookSourceWorkspace!=='function')throw unavailable();const result=await api.textbookSourceWorkspace(era,sourceRevision);current();if(result?.gradingVersion!=null&&result.gradingVersion!==1||result?.gradingStorageScope!=null&&result.gradingStorageScope!=='legacy-v1')throw unavailable();return result;}
  });
 }
 root.HanqSourceGradingV2Session=Object.freeze({selected,create,requireV2});
 if(typeof module==='object'&&module.exports)module.exports=root.HanqSourceGradingV2Session;
})(typeof window==='object'?window:globalThis);
