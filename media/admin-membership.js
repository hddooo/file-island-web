(function(){'use strict';if(location.pathname!=='/ops/members.html')return;
var api=window.HanqApi,PAGE_SIZE=25,container=document.createElement('section'),page=1,serial=0;container.className='portal-panel membership-panel';container.setAttribute('aria-label','가입 승인 요청');document.querySelector('main').insertBefore(container,document.getElementById('content'));
function add(tag,text,parent){var x=document.createElement(tag);x.textContent=text;(parent||container).appendChild(x);return x;}
function when(v){var d=new Date(v);return isNaN(d)?'':d.toLocaleString('ko-KR',{timeZone:'Asia/Seoul'});}
function failure(e){return e&&e.status===403?'관리자만 가입 요청을 확인할 수 있습니다.':e&&e.status===401?'로그인 상태를 확인해 주세요.':e&&e.status===404?'가입 승인 기능을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.':'가입 요청을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.';}
// Only the members section shows the approval queue; other sections render in-page on this URL.
document.addEventListener('hanq-admin-section',function(e){container.hidden=!(e.detail&&e.detail.section==='members');});
async function load(){var key=++serial,owner=api.state().ownerId;function current(){return key===serial&&api.state().signedIn&&api.state().ownerId===owner;}container.replaceChildren();add('h2','가입 승인 요청');var status=add('p','불러오는 중…');status.setAttribute('role','status');
 try{var d=await api.portal('GET','/api/v1/ops/membership-requests?page='+page);if(!current()){if(key===serial)container.replaceChildren();return;}
  status.textContent=d.total?'대기 '+d.total+'건':'승인 대기 요청이 없습니다.';
  d.items.forEach(function(item){var row=add('div','');row.className='membership-row';add('strong',item.nickname,row);add('p',item.email+' · '+when(item.created_at),row);var actions=add('div','',row);actions.className='membership-actions';
   ['approved','rejected'].forEach(function(decision){var label=decision==='approved'?'승인':'거절',b=add('button',label,actions);b.type='button';b.onclick=async function(){if(!confirm(item.nickname+'님의 가입 요청을 '+label+'할까요?'))return;var buttons=actions.querySelectorAll('button');buttons.forEach(function(x){x.disabled=true;});status.textContent=label+' 처리 중…';
    try{await api.portal('POST','/api/v1/ops/membership-requests/'+encodeURIComponent(item.id)+'/decision',{decision:decision});if(current())await load();}
    catch(e){if(!current())return;buttons.forEach(function(x){x.disabled=false;});status.textContent=e&&e.status===409?'이미 처리된 요청입니다. 목록을 새로 불러옵니다.':'처리하지 못했습니다. 다시 시도해 주세요.';if(e&&e.status===409)load();}};});});
  var nav=add('div','');nav.className='membership-actions';[['이전',-1],['다음',1]].forEach(function(v){var b=add('button',v[0],nav);b.type='button';b.disabled=v[1]<0?page===1:page*PAGE_SIZE>=d.total;b.onclick=function(){page+=v[1];load();};});}
 catch(e){if(!current())return;status.textContent=failure(e);var retry=add('button','다시 시도');retry.type='button';retry.onclick=load;}}
var lastOwner=api.state().ownerId;api.onChange(function(st){if(!st.signedIn||st.ownerId!==lastOwner){serial++;container.replaceChildren();}lastOwner=st.ownerId;});
api.init().then(load).catch(function(){container.replaceChildren();add('p','로그인이 필요합니다.');});
})();
