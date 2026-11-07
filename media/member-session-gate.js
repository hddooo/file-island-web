(function(){'use strict';var api=window.HanqApi;if(!api)return;var had=api.state().signedIn;
api.onChange(function(st){if(st.signedIn){had=true;return;}if(had&&!st.restoring&&!st.sessionPending){document.documentElement.style.visibility='hidden';location.replace('/auth/login.html');}});
window.addEventListener('pagehide',function(){document.documentElement.style.visibility='hidden';});
window.addEventListener('pageshow',function(e){if(!e.persisted){document.documentElement.style.visibility='';return;}fetch('/api/v1/auth/site-check',{credentials:'same-origin',cache:'no-store',redirect:'error'}).then(function(r){if(!r.ok)throw new Error('session');document.documentElement.style.visibility='';}).catch(function(){location.replace('/auth/login.html');});});
})();