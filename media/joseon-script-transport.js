(function(root){
 'use strict';
 const SOURCE='8d0944e32d86985a4af3dbf28085dba4bb3f65cc0d8379907e2e4693299003a1';
 const BUNDLE='32a33b006d1c4b113dcc2e9df23a81e14b7b07ce2afe7400eafdde9f8750386b';
 // Reviewed deployed API: immutable source mount and existing authentication guards verified.
 const REVIEWED_API_RELEASE='ee9487e96fe95c441c3091a6f3d45a4c211d51b8';
 async function digest(bytes,crypto){if(!crypto||!crypto.subtle)throw Error('script_integrity_unavailable');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');}
 function create(api,options){
  options=options||{};let manifest=null;const crypto=options.crypto||root.crypto;
  function active(signal){if(signal&&signal.aborted)throw Error('aborted');}
  return {ready:true,sourceSha256:SOURCE,
   async loadBundle({signal}={}){
    active(signal);manifest=null;const text=await api.joseonScriptBundle(SOURCE,signal);active(signal);
    if(typeof text!=='string')throw Error('invalid_script_bundle');const bytes=new TextEncoder().encode(text);
    if(bytes.length!==113709||await digest(bytes,crypto)!==BUNDLE)throw Error('script_bundle_mismatch');active(signal);
    const b=JSON.parse(text);
    if(b.schema!=='hanq-joseon-script/1'||b.source?.sha256!==SOURCE||b.source.questions!==172||b.source.canonicalQuizMapping!=='not-established'||b.source.access!=='authenticated-private-only'||b.figureManifest?.length!==38||b.topics?.length!==4)throw Error('invalid_script_bundle');
    manifest=new Map(b.figureManifest.map(f=>[f.name,f]));return b;
   },
   async loadFigure(name,{signal}={}){
    active(signal);const f=manifest&&manifest.get(name);if(!f)throw Error('invalid_script_figure');const blob=await api.joseonScriptFigure(SOURCE,name,signal);active(signal);
    if(blob.type!=='image/png'||blob.size!==f.bytes)throw Error('script_figure_mismatch');const bytes=await blob.arrayBuffer();if(await digest(bytes,crypto)!==f.sha256)throw Error('script_figure_mismatch');active(signal);return blob;
   }
  };
 }
 function fromDocument(doc,api){const pin=doc.querySelector('meta[name="hanq-joseon-script-release"]');if(!REVIEWED_API_RELEASE||!pin||pin.content!==REVIEWED_API_RELEASE+':'+SOURCE||!api||typeof api.joseonScriptBundle!=='function'||typeof api.joseonScriptFigure!=='function')return null;return create(api);}
 root.HanqJoseonScriptTransport={create,fromDocument,sourceSha256:SOURCE,bundleSha256:BUNDLE,reviewedApiRelease:REVIEWED_API_RELEASE};
 if(typeof module==='object'&&module.exports)module.exports=root.HanqJoseonScriptTransport;
})(typeof window==='object'?window:globalThis);
