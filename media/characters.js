(function(root){'use strict';
var expiryTimer=null,headerExpiryTimer=null,bubbleTimer=null,bubbleGen=0,stopLife=null;
var names={botamon:'깜몬',koromon:'코로몬',agumon:'아구몬',greymon:'그레이몬',metalgreymon:'메탈그레이몬',wargreymon:'워그레이몬',tokomon:'토코몬',patamon:'파닥몬',angemon:'엔젤몬',magnaangemon:'홀리엔젤몬'};
/* 진화 단계와 그 단계가 시작되는 성장점수(계열별). stage()·progress()가 같이 쓴다 */
var CHAINS={agumon:[['botamon',0],['koromon',500],['agumon',1000],['greymon',1200],['metalgreymon',1500],['wargreymon',1800]],patamon:[['tokomon',0],['patamon',1200],['angemon',1500],['magnaangemon',1800]]};
var PHRASES=['오늘은 공부했니?','힘내 넌 할 수 있어','잘했어 넌 해낼 수 있을꺼야'],BUBBLE_FIRST=6000,BUBBLE_SHOW=3200,BUBBLE_EVERY=30000;
function premium(st){return !!(st.premium&&st.premium.active&&(!st.premium.expiresAt||Date.parse(st.premium.expiresAt)>Date.now()));}
/* 지금 단계 · 다음 진화까지. 마지막 단계는 final=true, ratio=1(넘친 점수로 막대가 늘지 않음).
   막대 글자용 earned/required/toGo는 이 단계 안의 XP(0~required로 자름, 음수·넘침은 보여 줄 때만 자름). 마지막 단계는 null/0 */
function progress(points,family,storedStage){points=Number.isFinite(Number(points))?Number(points):0;var chain=CHAINS[family==='patamon'?'patamon':'agumon'],i=0;while(i+1<chain.length&&points>=chain[i+1][1])i++;
  if(Number.isInteger(storedStage)&&storedStage>=0&&storedStage<chain.length)i=storedStage;var from=chain[i][1],nx=chain[i+1]||null,id=chain[i][0],required=nx?nx[1]-from:null,earned=nx?Math.max(0,Math.min(required,Math.floor(points-from))):null;
  return {id:id,name:names[id],points:points,from:from,next:nx?nx[1]:null,nextId:nx?nx[0]:null,nextName:nx?names[nx[0]]:null,remaining:nx?nx[1]-points:0,ratio:nx?Math.max(0,Math.min(1,(points-from)/(nx[1]-from))):1,final:!nx,earned:earned,required:required,toGo:nx?required-earned:0};}
function stage(points,family){return progress(points,family).id;}
function preference(st){try{return root.localStorage.getItem('hanq:character:'+st.ownerId)==='patamon'?'patamon':'agumon';}catch(e){return 'agumon';}}
/* 서버 me()로 확인된 회원만: 로그인 복원 중 · 가입/갱신 토큰과 user만 있는 상태 · 성장점수/프리미엄을 아직 못 받은 상태에서는 캐릭터·점수·개인 정보를 보이지 않는다 */
function confirmed(st){return !!(st&&(!st.partners||(root.HanqCollection&&root.HanqCollection.ready(st)))&&st.signedIn===true&&!st.restoring&&st.user&&typeof st.user==='object'&&st.ownerId!=null&&st.ownerId!==''&&String(st.user.id)===String(st.ownerId)&&st.growth&&typeof st.growth.points==='number'&&Number.isFinite(st.growth.points)&&st.premium&&typeof st.premium.active==='boolean');}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
/* 지금 보일 진화 단계: 프리미엄이 끝나면 아구몬 계열로(예전에 고른 계열 저장값은 그대로 두어 다시 프리미엄이 되면 돌아감) */
function current(st){if(!confirmed(st))return null;if(root.HanqCollection&&st.partners){var owned=root.HanqCollection.current(st);if(owned)return owned;}var family=premium(st)?preference(st):'agumon',server=st.partnerEvolution&&st.partnerEvolution[family],p=progress(st.growth.points,family,server&&server.stage);p.family=family;p.revision=server&&server.revision;p.manual=!!server;p.eligible=!!server&&!p.final&&st.growth.points>=p.next;return p;}
function currentStage(st){return current(st).id;}
function portrait(id,labelled){if(root.HanqCollection&&root.HanqCollection.atlas.indexOf(id)>=0)return root.HanqCollection.portrait(id,labelled);var file=id==='magnaangemon'?'holyangemon':id;if(id==='agumon'||id==='patamon')return '<span'+(labelled?' role="img" aria-label="'+esc(names[id])+'"':'')+' class="hanq-mascot hanq-mascot--'+esc(id)+'"></span>';return '<img alt="'+(labelled?esc(names[id]):'')+'" class="hanq-growth-portrait" src="media/characters/'+esc(file)+'.png">';}
/* One visible My portrait only; no score/state writes, no animation frame JS loop. */
function startLife(pet,id){
  var doc=root.document,mq=root.matchMedia?root.matchMedia('(prefers-reduced-motion: reduce)'):{matches:false,addListener:function(){},removeListener:function(){}},visible=false,disposed=false;
  function sync(){pet.classList.toggle('is-alive',!disposed&&visible&&!doc.hidden&&!mq.matches);}
  var io=root.IntersectionObserver?new root.IntersectionObserver(function(entries){visible=entries[0].isIntersecting&&entries[0].intersectionRatio>.15;sync();},{threshold:[0,.15]}):null;
  if(io)io.observe(pet);else visible=true;
  doc.addEventListener('visibilitychange',sync);if(mq.addEventListener)mq.addEventListener('change',sync);else mq.addListener(sync);
  var observer=new root.MutationObserver(function(){if(!pet.isConnected)dispose();});observer.observe(doc.body,{childList:true,subtree:true});
  function dispose(){if(disposed)return;disposed=true;pet.classList.remove('is-alive');if(io)io.disconnect();observer.disconnect();doc.removeEventListener('visibilitychange',sync);if(mq.removeEventListener)mq.removeEventListener('change',sync);else mq.removeListener(sync);}
  sync();return dispose;
}
function lifePortrait(el,pet,id,name){if(root.HanqCollectionLife&&root.HanqCollectionLife.supports(id)){var motion=el('span','collection-life',null,pet);motion.innerHTML=root.HanqCollectionLife.markup(id,true,'hero');stopLife=startLife(pet,id);return;}if(root.HanqCollection&&root.HanqCollection.atlas.indexOf(id)>=0){var picture=el('span','collection-life',null,pet);picture.innerHTML=root.HanqCollection.portrait(id,true);return;}
  var life=el('span','pet-life',null,pet);life.dataset.stage=id;life.setAttribute('role','img');life.setAttribute('aria-label',name);
  function layer(cls,parent){var n=el('span','pet-ink '+cls,null,parent);n.setAttribute('aria-hidden','true');if(id==='agumon'||id==='patamon')n.classList.add('pet-atlas','pet-atlas--'+id);else n.style.backgroundImage='url("media/characters/'+(id==='magnaangemon'?'holyangemon':id)+'.png")';return n;}
  layer('pet-feet',life);var upper=el('span','pet-upper',null,life),breath=el('span','pet-breath',null,upper);layer('pet-face',breath);
  if(id==='greymon'){layer('pet-feet pet-scratch-layer',life);layer('pet-face pet-scratch-layer',breath);}
  var effect=el('span','pet-effect',null,breath);effect.setAttribute('aria-hidden','true');
  effect.classList.add(['agumon','greymon','metalgreymon'].indexOf(id)>=0?'pet-ember':id==='wargreymon'?'pet-energy':'pet-mote');
  for(var i=0;i<3;i++)el('i',null,null,effect);
  stopLife=startLife(pet,id);
}
function stopBubble(){if(bubbleTimer!==null){clearTimeout(bubbleTimer);bubbleTimer=null;}bubbleGen++;}
/* 말풍선: 첫 말은 6초 뒤, 3초쯤 보였다가 사라지고 30초마다 다음 말. 다시 그리기·화면에서 빠짐·로그아웃·다른 계정이면 멈춤, 탭이 안 보이면 건너뜀. 상태는 바꾸지 않는다 */
function startBubble(host,bubble,ownerId,i){var gen=bubbleGen;
  function alive(){if(gen!==bubbleGen||!host.isConnected||!bubble.isConnected)return false;var api=root.HanqApi;if(api&&typeof api.state==='function'){var s=api.state();if(!s||s.signedIn!==true||String(s.ownerId)!==String(ownerId))return false;}return true;}
  function show(){bubbleTimer=null;if(!alive())return;if(root.document.hidden){bubbleTimer=setTimeout(show,BUBBLE_EVERY);return;}
    bubble.textContent=PHRASES[i++%PHRASES.length];bubble.hidden=false;
    bubbleTimer=setTimeout(function(){bubbleTimer=null;if(gen!==bubbleGen)return;bubble.hidden=true;if(alive())bubbleTimer=setTimeout(show,BUBBLE_EVERY-BUBBLE_SHOW);},BUBBLE_SHOW);}
  bubbleTimer=setTimeout(show,BUBBLE_FIRST);}
/* 마이페이지: 단계 안 XP는 막대에, 공식 누적 성장점수는 아래에 표시. 확인 전에는 비워 둔다. */
function mount(host,st){if(stopLife){stopLife();stopLife=null;}if(expiryTimer!==null){clearTimeout(expiryTimer);expiryTimer=null;}stopBubble();if(!host)return;host.replaceChildren();if(!confirmed(st))return;
  var doc=root.document,p=current(st),hero=host.closest('.ac-hero'),tier=hero&&hero.querySelector('.ac-hero-tier');if(tier){var pro=premium(st);tier.textContent=pro?'프리미엄 회원':'일반 회원';tier.className='ac-hero-tier'+(pro?' is-premium':'');}
  function el(tag,cls,text,parent){var n=doc.createElement(tag);if(cls)n.className=cls;if(text!=null)n.textContent=text;(parent||host).appendChild(n);return n;}
  /* 캐릭터는 키보드로도 누를 수 있는 단추(마이페이지가 누름을 받아 처리 · 화면에 숨은 안내는 없음) */
  var pet=el('button','ac-pet'),bubble=el('span','ac-bubble',null,pet);pet.type='button';pet.setAttribute('aria-label',p.name+' · 성장기록 열기');pet.setAttribute('aria-haspopup','dialog');pet.title='성장기록 보기';bubble.hidden=true;
  lifePortrait(el,pet,p.id,p.name);
  el('span','ac-pet-hint','눌러서 성장기록 보기',pet);
  var g=el('div','ac-growth'+(p.final?' is-final':''));
  /* 막대 안: 이 단계에서 모은 XP / 다음 진화에 필요한 XP. 마지막 단계는 꽉 찬 막대 + 최종 진화 글자(다음 목표·분모 없음) */
  var next=p.collection?'성장 XP · '+Number(p.points).toLocaleString('ko-KR'):'계정 성장 기준 · '+Number(p.points).toLocaleString('ko-KR')+' XP',label=p.final?'최종 진화 완료':'이번 단계 '+p.earned+' / '+p.required+' XP';el('p','ac-growth-next',next,g);var bar=el('div','ac-progress',null,g);
  bar.setAttribute('role','progressbar');bar.setAttribute('aria-label',p.final?'진화 단계':p.collection?'다음 진화까지 경험치':'계정 성장 기준 진화 진행도');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',p.final?'100':String(p.required));bar.setAttribute('aria-valuenow',p.final?'100':String(p.earned));bar.setAttribute('aria-valuetext',p.final?p.name+' · '+next:label+' · '+next);
  el('span','ac-progress-fill',null,bar).style.width=(p.ratio*100)+'%';
  el('span','ac-progress-label',label,bar).setAttribute('aria-hidden','true');
  if(!p.collection)el('p','ac-growth-basis','계정 성장 기준',g);if(p.egg){bar.remove();el('p','ac-growth-basis','부화 시간은 보관함에서 확인할 수 있어요.',g);}if(p.manual&&!p.final&&!p.egg){if(p.eligible){var evolve=el('button','ac-evolve','진화',g);evolve.type='button';evolve.dataset.family=p.family;if(p.partnerId)evolve.dataset.partnerId=p.partnerId;evolve.dataset.revision=String(p.revision);evolve.setAttribute('aria-label',p.nextName+'(으)로 진화');}else el('p','ac-evolution-needed','진화까지 '+Math.max(0,p.remaining)+' XP 필요',g);}
  var collectionLink=el('a','ac-collection-link','디지몬 보관함 보기 ↓',g);collectionLink.href='#account';collectionLink.setAttribute('aria-label','디지몬 보관함 · 준비 중 화면 보기');collectionLink.addEventListener('click',function(e){var inventory=doc.getElementById('acInventory');if(inventory){e.preventDefault();inventory.scrollIntoView({block:'start'});}});
  startBubble(host,bubble,st.ownerId,st.access&&st.access.today?2:0);
  if(premium(st)&&st.premium.expiresAt){var remaining=Date.parse(st.premium.expiresAt)-Date.now();expiryTimer=setTimeout(function(){expiryTimer=null;if(host.isConnected){mount(host,st);root.document.dispatchEvent(new root.CustomEvent('hanq:character-change'));}},Math.min(remaining+1,2147483000));}}
/* 캐릭터 그림만(확인된 회원일 때만, 아니면 빈 문자열) — 예전 호출 호환용. 헤더는 member()를 쓴다 */
function badge(st){if(!confirmed(st))return '';return '<span id="headerCharacter" class="header-character">'+portrait(currentStage(st),true)+'</span>';}
/* 헤더 회원 영역: 버튼 하나(#headerAccount, 앱의 위임 클릭이 마이페이지를 연다). 확인 전에는 로그인/확인 중 글자만.
   확인되면 캐릭터(실제 진화 단계) · 닉네임 · 성장점수 · 일반/프리미엄. 프리미엄 만료 시각에 'hanq:premium-expired'를 한 번 알린다 */
function member(st){st=st||{};if(headerExpiryTimer!==null){clearTimeout(headerExpiryTimer);headerExpiryTimer=null;}
  /* 확인 전: 실제로 요청 중일 때(로그인 복원 · 내 정보 불러오는 중)만 aria-busy. 내 정보를 못 받았으면 다시 확인하도록 안내(누르면 마이페이지가 다시 불러옴) */
  if(!confirmed(st)){var ps=st.profileStatus,loading=!!st.restoring||(!!st.signedIn&&(ps==='loading'||ps===undefined));return '<button type="button" class="tool-btn header-member is-guest" id="headerAccount"'+(loading?' aria-busy="true"':'')+'>'+(st.restoring?'로그인 연결 확인 중':st.sessionPending?'로그인 연결 다시 확인':!st.signedIn?'로그인 · 회원가입':loading?'내 정보 확인 중':'내 정보 다시 확인')+'</button>';}
  var pro=premium(st),pet=current(st),id=pet.id,partnerKnown=!!(st.partners&&root.HanqCollection&&root.HanqCollection.ready(st)&&pet.collection===true&&typeof pet.points==='number'&&Number.isFinite(pet.points)&&pet.points>=0),partnerPts=partnerKnown?pet.points.toLocaleString('ko-KR'):'—',nick=String(st.user.displayName==null?'':st.user.displayName).trim()||'회원',pts=Number(st.growth.points).toLocaleString('ko-KR'),tier=pro?'프리미엄':'일반';
  if(pro&&st.premium.expiresAt){headerExpiryTimer=setTimeout(function(){headerExpiryTimer=null;root.document.dispatchEvent(new root.CustomEvent('hanq:premium-expired'));},Math.min(Date.parse(st.premium.expiresAt)-Date.now()+1,2147483000));}
  return '<button type="button" class="tool-btn header-member is-member'+(pro?' is-premium':'')+'" id="headerAccount" data-stage="'+esc(id)+'" aria-label="'+esc('마이페이지 열기 · '+nick+' · '+(names[id]||(root.HanqCollection&&root.HanqCollection.names[id])||'디지몬')+' · '+(partnerKnown?'장착 디지몬 XP '+partnerPts:'장착 디지몬 XP 확인 불가')+' · 계정 총 XP '+pts+' · '+tier+' 회원')+'">'+
    '<span class="hm-pic" aria-hidden="true">'+(root.HanqCollectionLife&&root.HanqCollectionLife.supports(id)?root.HanqCollectionLife.markup(id,false,'header'):portrait(id,false))+'</span><span class="hm-text" aria-hidden="true"><span class="hm-name" title="'+esc(nick)+'">'+esc(nick)+'</span><span class="hm-meta"><span class="hm-stage">'+esc(names[id]||(root.HanqCollection&&root.HanqCollection.names[id])||'디지몬')+'</span><span class="hm-pts'+(partnerPts.length+pts.length>19?' is-wide':'')+'">XP : <span class="hm-partner">'+esc(partnerPts)+'</span> <span class="hm-total">('+esc(pts)+')</span></span><span class="hm-tier">'+tier+'</span></span></span></button>';}
root.HanqCharacters={mount:mount,stage:stage,progress:progress,current:current,premium:premium,badge:badge,member:member,confirmed:confirmed,stop:function(){stopBubble();if(stopLife){stopLife();stopLife=null;}}};
})(typeof window!=='undefined'?window:globalThis);
