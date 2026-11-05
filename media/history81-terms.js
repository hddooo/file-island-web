(function(root){
  'use strict';
  const marker='[data-history-source-emphasis]',blocked='a,button,input,textarea,select,[role="button"],[data-layout-label],.history81-term';
  let serial=0;
  const normalize=text=>text.replace(/\s+/gu,'');
  // Context-qualified phrases use the pinned source page and their local row/list,
  // never unrelated text elsewhere in the page. Conditions are not popup content.
  const joseonContexts={
    '이조 전랑 임명':[['68'],/선조/,/김효원/,/심의겸/], '이조전랑 임명으로 다툼':[['66–67'],/선조/,/김효원/,/심의겸/],
    '경성':[['62'],/여진/,/무역소/], '경원':[['62'],/여진/,/무역소/],
    '풍흉에 따라 9등급':[['62'],/세종/], '9등급으로 전세':[['77'],/세종/,/풍흉/],
    '쓰시마섬(대마도)을 정벌':[['62'],/세종/,/이종무/],
    '삼포':[['62'],/부산포/,/염포/,/제포/], '이징옥':[['62'],/단종/,/함길도/],
    '수신전과 휼양전이 폐지':[['62','77'],/세조/], '수신전 & 휼양전 폐지':[['73–74–75'],/직전법|세조/],
    '영조·정조':[['65'],/탕평/], '순조·헌종·철종':[['65'],/세도정치/],
    '청계천':[['66–67','69'],/영조/,/공사|정비|준천/],
    '외척 세력':[['66–67'],/안동 김씨|풍양 조씨/,/순조|헌종|철종/],
    '권력(비변사 중심) 장악':[['66–67'],/안동 김씨|풍양 조씨/,/순조|헌종|철종/],
    '박규수':[['66–67','70'],/철종|임술/,/안핵사/],
    '공주(공산성)':[['68'],/이괄의 난/,/인조/], '용골산성':[['68'],/정묘호란/,/정봉수/],
    '김준룡이 광교산 전투':[['68'],/병자호란/], '허적과 윤휴':[['69'],/숙종/,/남인/,/축출/],
    '백서':[['70'],/황사영/], '진주':[['70'],/임술농민봉기/,/유계춘/],
    '비서 기관':[['73–74–75'],/승정원/], '왕의 비서 기관':[['76'],/승정원/],
    '동서활인서':[['73–74–75'],/환자|진료|구휼/],
    '2필에서 1필':[['73–74–75'],/균역법/,/영조/],
    '토지 1결당 쌀 2두':[['73–74–75'],/결작/,/균역법/],
    '실록을 편찬':[['76'],/춘추관/], '경연을 주관':[['76'],/홍문관/],
    '상대':[['76'],/사헌부/], '과전':[['77'],/과전법|경기/],
    '전세 부담액을 고정':[['77'],/인조/], '향전':[['78'],/구향/,/신향/],
    '남북국 용어':[['81'],/발해고/,/유득공/]
  };
  function contextAllows(entry,node){
    const text=node.textContent;
    if(entry.phrase==='금오')return /의금부|조옥/.test(text);
    if(entry.era==='joseon'&&entry.contextRequired){
      const rule=joseonContexts[entry.phrase],page=node.closest('[data-page]');
      if(!rule||!page||!rule[0].includes(page.dataset.page))return false;
      const heading=[...page.querySelectorAll('h2,h3,h4,h5,h6')].filter(h=>h.compareDocumentPosition(node)&4).at(-1)?.textContent||'';
      const scope=(node.closest('tr')||node.parentElement.closest('li')||node).textContent+' '+heading;
      return rule.slice(1).every(pattern=>pattern.test(scope));
    }
    if(entry.era!=='goryeo')return true;
    if(entry.id==='goryeo-gwajeon-gwajeonbeop-land')return ['48','54'].includes(node.closest('[data-page]')?.dataset.page)&&/경기/.test(text);
    if(entry.id==='goryeo-accounting-general')return /삼사/.test(text);
    if(['goryeo-jeonji-land','goryeo-siji-woodland'].includes(entry.id))return /전시과/.test(text);
    if(entry.id==='goryeo-jewibo')return /빈민|구제|구휼/.test(text);
    if(entry.id==='goryeo-gangjo')return /정변|거란/.test(text);
    if(entry.id==='goryeo-byeongmasa')return /양계|국경/.test(text);
    if(entry.id==='goryeo-gyojang')return /의천|경전|주석|속장경/.test(text);
    return true;
  }
  function mount(host,era,source){
    const data=root.HanqHistory81TermData,doc=host.ownerDocument,win=doc.defaultView;
    if(!data||source!==data.sources[era])return {stop(){},count:0};
    const entries=new Map(data.entries.filter(e=>e.era===era&&Array.from(e.summary).length<=150).map(e=>[normalize(e.phrase),e]));
    const triggers=[],offs=[];let active=null,pinned=false,timer=null,stopped=false;
    const tip=doc.createElement('div');tip.className='history81-term-tooltip';tip.id='history81-term-tip-'+(++serial);tip.setAttribute('role','tooltip');tip.hidden=true;doc.body.append(tip);
    function listen(node,event,fn,options){node.addEventListener(event,fn,options);offs.push(()=>node.removeEventListener(event,fn,options));}
    function close(){clearTimeout(timer);if(active){const ids=(active.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==tip.id);if(ids.length)active.setAttribute('aria-describedby',ids.join(' '));else active.removeAttribute('aria-describedby');active.setAttribute('aria-expanded','false');}active=null;pinned=false;tip.hidden=true;tip.textContent='';}
    function position(){if(!active||!active.isConnected){close();return;}const r=active.getBoundingClientRect(),v=win.visualViewport,w=v?v.width:win.innerWidth,h=v?v.height:win.innerHeight,ox=v?v.offsetLeft:0,oy=v?v.offsetTop:0;tip.style.maxWidth=Math.max(1,w-24)+'px';const t=tip.getBoundingClientRect();tip.style.left=Math.max(ox+12,Math.min(r.left,ox+w-t.width-12))+'px';tip.style.top=Math.max(oy+12,Math.min(r.bottom+8+t.height<=oy+h-12?r.bottom+8:r.top-t.height-8,oy+h-t.height-12))+'px';}
    function open(node,entry,pin){if(stopped)return;clearTimeout(timer);if(active!==node)close();active=node;pinned=pin||pinned;tip.textContent=entry.summary;tip.hidden=false;const ids=new Set((node.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(tip.id);node.setAttribute('aria-describedby',[...ids].join(' '));node.setAttribute('aria-expanded','true');position();}
    function leave(){clearTimeout(timer);if(!pinned)timer=win.setTimeout(()=>{if(doc.activeElement!==active&&!tip.matches(':hover'))close();},180);}
    function annotate(parent){
      if(parent.nodeType!==1||parent.matches(blocked))return;
      const children=[...parent.childNodes];let i=0;
      while(i<children.length){const first=children[i];if(first.nodeType!==1||!first.matches(marker)){if(first.nodeType===1)annotate(first);i++;continue;}
        const nodes=[first];let j=i+1;
        while(j<children.length){const n=children[j];if(n.nodeType===1&&n.matches(marker)){nodes.push(n);j++;continue;}if(n.nodeType===3&&!n.textContent.trim()&&children[j+1]?.nodeType===1&&children[j+1].matches(marker)){nodes.push(n,children[j+1]);j+=2;continue;}break;}
        const text=nodes.map(n=>n.textContent).join(''),entry=entries.get(normalize(text)),context=parent.closest('td,th,li,p')||parent;
        // A partially emphasized word is not a certified phrase. Never split a maximal styled run.
        const before=children[i-1],after=children[j],particle=/^(?:으로|에서|이라고|라고|로|이|가|을|를|은|는|의|에|와|과|도|만|까지)(?=$|[^\p{L}\p{N}])/u,partial=(before?.nodeType===3&&/[\p{L}\p{N}]$/u.test(before.textContent))||(after?.nodeType===3&&/^[\p{L}\p{N}]/u.test(after.textContent)&&!particle.test(after.textContent));
        if(entry&&!partial&&!nodes.some(n=>n.nodeType===1&&(n.matches(blocked)||n.querySelector(blocked)))&&contextAllows(entry,context)){
          const trigger=doc.createElement('span');trigger.className='history81-term';trigger.dataset.termId=entry.id;trigger.dataset.termPhrase=entry.phrase;trigger.setAttribute('role','button');trigger.tabIndex=0;trigger.setAttribute('aria-label',text+' 용어 설명');trigger.setAttribute('aria-expanded','false');parent.insertBefore(trigger,first);nodes.forEach(n=>trigger.append(n));triggers.push(trigger);
          listen(trigger,'pointerenter',e=>{if(e.pointerType!=='touch')open(trigger,entry,false);});listen(trigger,'pointerleave',leave);
          listen(trigger,'pointerdown',()=>trigger.focus({preventScroll:true}));
          listen(trigger,'focus',()=>open(trigger,entry,false));listen(trigger,'blur',()=>{if(active===trigger){pinned=false;leave();}});
          listen(trigger,'click',()=>{if(active===trigger&&pinned)close();else open(trigger,entry,true);});
          listen(trigger,'keydown',e=>{if(e.isComposing||e.keyCode===229)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat){if(active===trigger&&pinned)close();else open(trigger,entry,true);}}});
        }else nodes.forEach(n=>{if(n.nodeType===1)annotate(n);});
        i=j;
      }
    }
    annotate(host);
    listen(tip,'pointerenter',()=>clearTimeout(timer));listen(tip,'pointerleave',leave);
    listen(doc,'pointerdown',e=>{if(active&&!active.contains(e.target)&&!tip.contains(e.target))close();},true);
    listen(doc,'keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();close();}});
    listen(win,'scroll',close,true);listen(win,'resize',close);if(win.visualViewport){listen(win.visualViewport,'resize',close);listen(win.visualViewport,'scroll',close);}
    return {count:triggers.length,stop(){if(stopped)return;stopped=true;close();offs.forEach(off=>off());tip.remove();triggers.forEach(node=>{if(node.parentNode)node.replaceWith(...node.childNodes);});}};
  }
  root.HanqHistory81Terms={mount,normalize};
})(typeof window==='object'?window:globalThis);
