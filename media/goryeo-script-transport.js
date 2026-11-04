(function(root){
 'use strict';
 const SOURCE='245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9';
 const BUNDLE='ed4fcfab4b25b0e896c93bcfe0240372b70da0fcbb22c1fa81afad14bbc71943';
 // CLOSED: candidate API and immutable storage not operationally verified.
 const REVIEWED_API_RELEASE='';
 async function digest(bytes,crypto){if(!crypto||!crypto.subtle)throw Error('script_integrity_unavailable');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))).map(n=>n.toString(16).padStart(2,'0')).join('');}
 function create(api,options){
  options=options||{};let manifest=null;const crypto=options.crypto||root.crypto;
  function active(signal){if(signal&&signal.aborted)throw Error('aborted');}
  return {ready:true,sourceSha256:SOURCE,
   async loadBundle({signal}={}){
    active(signal);manifest=null;const text=await api.goryeoScriptBundle(SOURCE,signal);active(signal);
    if(typeof text!=='string')throw Error('invalid_script_bundle');const bytes=new TextEncoder().encode(text);
    if(bytes.length!==74046||await digest(bytes,crypto)!==BUNDLE)throw Error('script_bundle_mismatch');active(signal);
    const b=JSON.parse(text);
    if(b.schema!=='hanq-goryeo-script/1'||b.source?.sha256!==SOURCE||b.source.questions!==100||b.source.canonicalQuizMapping!=='not-established'||b.source.access!=='authenticated-private-only'||b.figureManifest?.length!==24||b.topics?.length!==3)throw Error('invalid_script_bundle');
    manifest=new Map(b.figureManifest.map(f=>[f.name,f]));return b;
   },
   async loadFigure(name,{signal}={}){
    active(signal);const f=manifest&&manifest.get(name);if(!f)throw Error('invalid_script_figure');const blob=await api.goryeoScriptFigure(SOURCE,name,signal);active(signal);
    if(blob.type!=='image/png')throw Error('script_figure_mime');if(blob.size!==f.bytes)throw Error('script_figure_size');const bytes=await blob.arrayBuffer();if(await digest(bytes,crypto)!==f.sha256)throw Error('script_figure_digest');active(signal);return blob;
   }
  };
 }
 function fromDocument(doc,api){const pin=doc.querySelector('meta[name="hanq-goryeo-script-release"]');if(!REVIEWED_API_RELEASE||!pin||pin.content!==REVIEWED_API_RELEASE+':'+SOURCE||!api||typeof api.goryeoScriptBundle!=='function'||typeof api.goryeoScriptFigure!=='function')return null;return create(api);}
 root.HanqGoryeoScriptTransport={create,fromDocument,sourceSha256:SOURCE,bundleSha256:BUNDLE,reviewedApiRelease:REVIEWED_API_RELEASE};
 if(typeof module==='object'&&module.exports)module.exports=root.HanqGoryeoScriptTransport;
})(typeof window==='object'?window:globalThis);
