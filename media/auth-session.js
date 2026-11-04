/* Shared auth recovery. Credentials remain only in the existing API client/HttpOnly cookie.
 * Only same-owner answer drafts and allowlisted fragment routes may survive reauthentication. */
(function(root){'use strict';
 var KEY='hanq:reauth-draft:v1',TTL=30*60*1000;
 function safeReturnTo(value){
  if(typeof value!=='string'||value.length>220||/[\s%\\?]/.test(value))return null;
  var chapter=/^#chapter\/(prehistory|gojoseon|samguk|nambuk|goryeo|joseon|joseon-early|joseon-late|opening|colonial|modern|islands)\/(webtoon|summary|exam-lines|bookquiz|quiz|mock|review|culture)$/;
  if(/^#chapter\/(goryeo|joseon|joseon-early|joseon-late)\/source-quiz$/.test(value))return value;
  return /^#toeic-cbt(?:\/[0-9a-f-]{36})?$/.test(value)||chapter.test(value)||/^#formal-exams(?:\/(?:review-)?[0-9a-f-]{36})?$/.test(value)||/^#(?:subjects|wrongnotes|history|past-exams|toeic(?:\/(?:notebook|wrongnotes))?)$/.test(value)||/^#textbook\/(people|regions|front|credits)$/.test(value)||/^#run\/r[0-9a-z]{6,40}$/.test(value)||/^#account\/run\/[0-9a-f-]{36}$/.test(value)?value:null;
 }
 function protectedRoute(value){return !!safeReturnTo(value)&&!/^#(?:subjects|history|past-exams)$/.test(value);}
 function create(options){
  options=options||{};var api=options.api||root.HanqApi,store=options.storage,now=options.now||Date.now,route=options.route||function(){return root.location&&root.location.hash||'#subjects';},participants=new Map(),navigation=null,required=null,envelope=null,notified=false;
  if(store===undefined)try{store=root.sessionStorage;}catch(e){store=null;}
  function drop(){envelope=null;notified=false;try{if(store)store.removeItem(KEY);}catch(e){}}
  function valid(value){return value&&value.schema===1&&(value.owner===null||typeof value.owner==='string'&&/^[A-Za-z0-9_-]{1,128}$/.test(value.owner))&&(value.returnTo===null||!!safeReturnTo(value.returnTo))&&typeof value.expiresAt==='number'&&value.expiresAt>now()&&value.expiresAt<=now()+TTL&&value.drafts&&typeof value.drafts==='object'&&!Array.isArray(value.drafts)&&(value.owner!==null||Object.keys(value.drafts).length===0)&&noSecrets(value.drafts);}
  try{var text=store&&store.getItem(KEY);if(text&&text.length<=262144){var loaded=JSON.parse(text);if(valid(loaded))envelope=loaded;else drop();}}catch(e){drop();}
  function persist(){if(!envelope)return;try{var text=JSON.stringify(envelope);if(text.length<=262144&&store)store.setItem(KEY,text);}catch(e){}}
  function snapshot(){return api&&api.state?api.state():{};}
  var previous=snapshot(),previousOwner=previous.signedIn&&previous.ownerId||null;
  function remember(hash,owner){var target=safeReturnTo(hash);if(!target)return false;var who=owner===undefined?(snapshot().ownerId||previousOwner||null):owner;
   if(!envelope||envelope.owner!==who)envelope={schema:1,owner:who,returnTo:target,expiresAt:now()+TTL,drafts:{}};else envelope.returnTo=target;envelope.expiresAt=now()+TTL;persist();return true;
  }
  function noSecrets(value){if(!value||typeof value!=='object')return true;return Object.keys(value).every(function(k){return !/token|cookie|password|authorization|secret/i.test(k)&&noSecrets(value[k]);});}
  function capture(owner){if(!remember(route(),owner))return;participants.forEach(function(p,key){if(p.ownerId!==owner)return;try{var value=p.capture();if(value&&noSecrets(value))envelope.drafts[key]=JSON.parse(JSON.stringify(value));}catch(e){}});persist();}
  function notifyRequired(){if(notified||!required||!safeReturnTo(route()))return;notified=true;Promise.resolve().then(function(){if(envelope&&required)required();});}
  function resume(){var state=snapshot();if(!state.signedIn||!state.ownerId||!envelope||!valid(envelope))return false;
   if(envelope.owner&&envelope.owner!==state.ownerId){drop();return false;}var target=safeReturnTo(envelope.returnTo);if(!target)return false;envelope.owner=state.ownerId;envelope.returnTo=null;notified=false;persist();if(navigation)navigation(target);return !!navigation;
  }
  var off=api&&api.onChange?api.onChange(function(state){var owner=state.signedIn&&state.ownerId||null;
   if(state.authReason==='logout'||state.authReason==='remote'){drop();}
   else if(owner&&envelope&&envelope.owner&&owner!==envelope.owner){drop();}
   else if(previousOwner&&!owner&&state.authReason==='expired'){capture(previousOwner);notifyRequired();}
   else if(!owner&&state.authReason==='expired'){if(!envelope)remember(route(),null);notifyRequired();}
   previous=state;previousOwner=owner;
   if(owner&&state.authReason==='refresh'&&state.profileStatus==='ready'&&/^#account(?:\/|$)/.test(route())&&envelope&&envelope.returnTo)Promise.resolve().then(resume);
  }):null;
  return {safeReturnTo:safeReturnTo,protectedRoute:protectedRoute,ensure:function(force){return api&&api.ensureSession?api.ensureSession(force):api&&api.init?api.init():Promise.resolve(snapshot());},configure:function(o){navigation=o.navigate;required=o.requireLogin;},remember:remember,resume:resume,
   register:function(key,p){participants.set(key,p);return function(){if(participants.get(key)===p)participants.delete(key);};},
   peekDraft:function(key,owner){if(!envelope||!valid(envelope)||!owner||snapshot().ownerId!==owner||envelope.owner!==owner)return null;var value=envelope.drafts[key];return value===undefined?null:JSON.parse(JSON.stringify(value));},
   takeDraft:function(key,owner){if(!envelope||!valid(envelope)||!owner||snapshot().ownerId!==owner||envelope.owner!==owner)return null;var value=envelope.drafts[key];if(value===undefined)return null;delete envelope.drafts[key];persist();return JSON.parse(JSON.stringify(value));},
   hasPending:function(){return !!(envelope&&valid(envelope)&&envelope.returnTo);},clear:drop,stop:function(){if(off)off();participants.clear();}}
 }
 var exported={create:create,safeReturnTo:safeReturnTo,protectedRoute:protectedRoute};if(typeof module!=='undefined'&&module.exports)module.exports=exported;
 if(root.document&&root.HanqApi)root.HanqAuthSession=create({api:root.HanqApi});
})(typeof window!=='undefined'?window:globalThis);
