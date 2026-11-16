/* Paper self-report is separate from timed online attempts; no answers, XP or clock are fabricated. */
(function(root){'use strict';
var active=null,PATH='/api/v1/cbt/paper-results';
function fail(code){var e=new Error(code);e.code=code;return e;}
function session(api){var s=api.state();return s&&s.signedIn&&!s.restoring&&s.ownerId!=null?{owner:String(s.ownerId),epoch:s.epoch||0}:null;}
function same(a,b){return !!a&&!!b&&a.owner===b.owner&&a.epoch===b.epoch;}
function numbers(text,perfect){
 var raw=String(text==null?'':text).trim();
 if(!raw){if(!perfect)throw fail('empty');return {values:[],duplicates:0};}
 if(perfect)throw fail('perfect_conflict');
 if(!/^\d+(?:[\s,，]+\d+)*$/.test(raw))throw fail('invalid_numbers');
 var all=raw.split(/[\s,，]+/).map(Number);if(all.some(function(n){return !Number.isInteger(n)||n<1||n>50;}))throw fail('invalid_numbers');
 var values=Array.from(new Set(all)).sort(function(a,b){return a-b;});return {values:values,duplicates:all.length-values.length};
}
function normalize(r){
 if(!r||typeof r.id!=='string'||!r.id||r.source!=='paper-reported'||!Number.isInteger(r.examRound)||r.examRound<70||r.examRound>80||!Number.isFinite(Date.parse(r.reportedAt))||r.selectedAnswersKnown!==false||r.maxScore!==100||!Number.isInteger(r.score)||r.score<0||r.score>100||!Array.isArray(r.wrongNumbers)||r.wrongNumbers.some(function(n){return !Number.isInteger(n)||n<1||n>50;})||new Set(r.wrongNumbers).size!==r.wrongNumbers.length||r.wrongCount!==r.wrongNumbers.length||r.correctCount!==50-r.wrongCount||(r.wrongCount===0&&r.score!==100)||(r.wrongCount===50&&r.score!==0))throw fail('invalid_response');
 return r;
}
function list(data){if(!data||!Array.isArray(data.items))throw fail('invalid_response');return data.items.map(normalize);}
function open(o){
 o=o||{};var api=o.api,owner=session(api);if(!owner)return Promise.reject(fail('session_changed'));if(root.document.querySelector('.fe-active-run'))return Promise.reject(fail('active_exam'));if(active)active.stop();
 var doc=root.document,alive=true,off=null,busy=false,ready=false,pending=null,loading=false,last=doc.activeElement;
 var storageKey='hanq:paper-report-pending:v1:'+owner.owner;
 function el(tag,text,cls){var e=doc.createElement(tag);if(text!=null)e.textContent=text;if(cls)e.className=cls;return e;}
 function button(text,fn){var e=el('button',text);e.type='button';e.onclick=fn;return e;}
 var dialog=el('dialog',null,'cbt-paper-results'),head=el('div',null,'pr-head'),title=el('h2','종이로 푼 결과'),close=button('닫기',stop),form=el('form'),round=el('select'),input=el('textarea'),perfect=el('input'),completed=el('input'),preview=el('p'),status=el('p'),submit=el('button','결과 저장'),history=el('div',null,'pr-history'),refresh=button('기록 다시 불러오기',load),retry=button('같은 결과 저장 확인',savePending);
 dialog.setAttribute('aria-label','종이로 푼 모의고사 결과 입력과 기록');status.setAttribute('role','status');preview.setAttribute('aria-live','polite');
 round.id='prRound';input.id='prWrong';input.rows=3;input.placeholder='예: 3, 5, 9, 15';input.autocomplete='off';input.spellcheck=false;
 for(var n=80;n>=70;n--){var opt=el('option','제'+n+'회');opt.value=String(n);round.appendChild(opt);}if(o.round>=70&&o.round<=80)round.value=String(o.round);
 perfect.type=completed.type='checkbox';perfect.id='prPerfect';completed.id='prCompleted';submit.type='submit';
 function label(text,control){var l=el('label',text);l.htmlFor=control.id;return l;}
 var perfectLabel=el('label',null,'pr-check'),completedLabel=el('label',null,'pr-check');perfectLabel.append(perfect,doc.createTextNode('틀린 문제 없음 (50문제 모두 정답)'));completedLabel.append(completed,doc.createTextNode('50번까지 모두 풀고 직접 채점한 결과입니다.'));
 head.append(title,close);form.append(label('회차',round),round,label('틀린 문제 번호 (1~50, 쉼표 또는 공백으로 구분)',input),input,perfectLabel,preview,completedLabel,submit);
 dialog.append(head,el('p','종이에서 끝까지 풀고 채점한 결과를 직접 기록합니다. 점수는 해당 회차의 공식 배점으로 계산합니다. 온라인 응시와 구분되며 선택한 답·풀이 시간·XP는 기록하지 않습니다.'),form,status,retry,el('h3','종이 풀이 기록'),refresh,history);
 function current(){return alive&&dialog.isConnected&&same(owner,session(api));}
 function lock(){[round,input,perfect,completed].forEach(function(e){e.disabled=busy||!!pending;});submit.disabled=!ready||busy||!!pending||!completed.checked;refresh.disabled=loading||busy;retry.hidden=!pending;retry.disabled=busy||!ready;}
 function showPreview(){try{var parsed=numbers(input.value,perfect.checked);preview.textContent=parsed.values.length?'오답 '+parsed.values.length+'개: '+parsed.values.join(', ')+(parsed.duplicates?' · 중복 '+parsed.duplicates+'개는 한 번만 반영합니다.':''):'오답 없음 · 100점으로 신고';}catch(e){preview.textContent=input.value.trim()?'1~50의 문제 번호만 쉼표나 공백으로 입력하세요.':'틀린 번호를 입력하거나 모두 정답을 확인하세요.';}lock();}
 function restore(){try{var raw=root.sessionStorage.getItem(storageKey);if(!raw)return;var p=JSON.parse(raw);if(p&&p.owner===owner.owner&&p.body&&p.body.completed===true&&p.body.examRound>=70&&p.body.examRound<=80&&typeof p.body.idempotencyKey==='string'&&Array.isArray(p.body.wrongNumbers)){var checked=numbers(p.body.wrongNumbers.join(','),p.body.wrongNumbers.length===0);if(checked.values.length!==p.body.wrongNumbers.length)return;pending=p;round.value=String(p.body.examRound);input.value=p.body.wrongNumbers.join(', ');perfect.checked=!p.body.wrongNumbers.length;completed.checked=true;}}catch(e){}}
 function persist(p){try{var s=JSON.stringify(p);root.sessionStorage.setItem(storageKey,s);if(root.sessionStorage.getItem(storageKey)!==s)throw fail('storage');}catch(e){throw fail('storage');}}
 function clearPending(){try{root.sessionStorage.removeItem(storageKey);}catch(e){}pending=null;}
 function stop(){if(!alive)return;alive=false;if(off)off();root.removeEventListener('hashchange',stop);dialog.remove();if(active&&active.stop===stop)active=null;if(last&&last.isConnected)last.focus();}
 function message(e){if(e&&e.status===404)return '종이 풀이 기록 기능이 아직 서버에 준비되지 않았어요. 기존 온라인 기록은 그대로입니다.';if(e&&e.status===401)return '로그인이 만료됐어요. 다시 로그인한 뒤 기록을 확인해 주세요.';if(e&&e.code==='storage')return '중복 저장 방지를 위한 임시 기록을 보관하지 못했어요. 이 브라우저의 저장 공간을 확인해 주세요.';return '저장 여부를 확인하지 못했어요. 입력은 보관했습니다. ‘같은 결과 저장 확인’을 누르면 동일한 요청으로 확인하며 중복 기록을 만들지 않습니다.';}
 function resultCard(r){var card=el('article'),h=el('h4','제'+r.examRound+'회 · '+r.score+'/'+r.maxScore+'점'),badge=el('span','종이 풀이 · 직접 입력','pr-badge');card.dataset.paperResult=r.id;card.append(badge,h,el('p','정답 '+r.correctCount+' / 오답 '+r.wrongCount+' · 50문제'),el('p','오답 번호: '+(r.wrongNumbers.length?r.wrongNumbers.join(', '):'없음')),el('p','기록한 시각: '+new Date(r.reportedAt).toLocaleString('ko-KR')));return card;}
 function render(items){history.replaceChildren();if(!items.length){var empty=el('p','아직 종이 풀이 기록이 없어요.');empty.dataset.paperEmpty='';history.appendChild(empty);return;}items.slice().sort(function(a,b){return Date.parse(b.reportedAt)-Date.parse(a.reportedAt);}).forEach(function(r){history.appendChild(resultCard(r));});}
 async function load(){if(!current()||loading||busy)return;loading=true;ready=false;status.textContent='종이 풀이 기록을 불러오는 중…';lock();try{var data=await api.cbt('GET',PATH);if(!current())return;render(list(data));ready=true;status.textContent=pending?'확인하지 못한 저장 요청이 있어요. 같은 결과 저장 확인으로 먼저 확인하세요.':'종이 풀이 기록은 온라인 응시 기록과 별도로 보관합니다.';}catch(e){if(current())status.textContent=e&&e.status===404?message(e):'종이 풀이 기록을 불러오지 못했어요. 다시 불러온 뒤 저장해 주세요.';}finally{if(current()){loading=false;lock();}}}
 async function savePending(){if(!current()||busy||!ready||!pending)return;busy=true;status.textContent='종이 풀이 결과 저장을 확인하는 중…';lock();var body=pending.body;try{var data=await api.cbt('POST',PATH,body);if(!current())return;var r=normalize(data&&data.result);if(r.examRound!==body.examRound||r.wrongNumbers.slice().sort(function(a,b){return a-b;}).join(',')!==body.wrongNumbers.join(','))throw fail('invalid_response');clearPending();input.value='';perfect.checked=false;completed.checked=false;status.textContent='제'+r.examRound+'회 '+r.score+'점 · 종이 풀이 기록을 저장했어요.';history.querySelectorAll('[data-paper-empty],[data-paper-result]').forEach(function(card){if(card.hasAttribute('data-paper-empty')||card.dataset.paperResult===r.id)card.remove();});history.prepend(resultCard(r));if(typeof o.onSaved==='function')o.onSaved(r);}catch(e){if(current())status.textContent=message(e);}finally{if(current()){busy=false;showPreview();}}}
 form.onsubmit=function(e){e.preventDefault();if(!current()||busy||!ready||pending)return;try{var parsed=numbers(input.value,perfect.checked);if(!completed.checked)throw fail('incomplete');if(!root.crypto||!root.crypto.randomUUID)throw fail('storage');var p={owner:owner.owner,body:{examRound:Number(round.value),wrongNumbers:parsed.values,idempotencyKey:root.crypto.randomUUID(),completed:true}};persist(p);pending=p;savePending();}catch(error){status.textContent=error.code==='empty'?'오답 번호를 입력하거나 모두 정답을 확인해 주세요.':error.code==='perfect_conflict'?'모두 정답과 오답 번호를 동시에 입력할 수 없어요.':error.code==='invalid_numbers'?'1~50의 정수만 쉼표 또는 공백으로 입력해 주세요.':error.code==='incomplete'?'50번까지 모두 풀고 채점했는지 확인해 주세요.':message(error);}};
 [input,perfect,completed].forEach(function(e){e.addEventListener('input',showPreview);e.addEventListener('change',showPreview);});
 restore();doc.body.appendChild(dialog);dialog.addEventListener('cancel',function(e){e.preventDefault();stop();});dialog.showModal();close.focus();root.addEventListener('hashchange',stop);off=api.onChange(function(){if(!same(owner,session(api)))stop();});active={stop:stop};showPreview();return load();
}
root.HanqCbtPaperResults={open:open,stop:function(){if(active)active.stop();},parseNumbers:numbers,normalize:normalize};
})(typeof window!=='undefined'?window:globalThis);
