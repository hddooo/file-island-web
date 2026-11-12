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
    // The requested Sejo policy line is identified by its semantic row, not source coordinates.
    if(entry.id==='joseon-remaining-abolish-estates-20'&&node.closest('tr')?.cells[0]?.textContent.trim()==='세조')return true;
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
  // Presentation only: retain source nodes and exact text for teardown/re-render.
  function softenFrequency(host){
    const doc=host.ownerDocument,undo=[],leaves=[];
    const walker=doc.createTreeWalker(host,4);let node;
    while((node=walker.nextNode()))if(!node.parentElement.closest('script,style,input,textarea,button,[role="tooltip"],.history81-frequency'))leaves.push(node);
    const groups=new Map();for(const n of leaves){const scope=n.parentElement.closest('.textbook-semantic-line,p,li,td,th,h2,h3,h4')||n.parentElement;if(!groups.has(scope))groups.set(scope,[]);groups.get(scope).push(n);}
    for(const nodes of groups.values()){
      const text=nodes.map(n=>n.data).join(''),hits=[...text.matchAll(/★\s*\d{1,3}\s*%/gu)].map(m=>[m.index,m.index+m[0].length]);if(!hits.length)continue;
      let offset=0;for(const n of nodes){const start=offset,end=offset+n.length;offset=end;const ranges=hits.map(([a,b])=>[Math.max(a,start)-start,Math.min(b,end)-start]).filter(([a,b])=>a<b);if(!ranges.length)continue;
        const wrap=doc.createElement('span');wrap.dataset.historyFrequencyRun='';wrap.style.display='contents';let at=0;for(const [a,b]of ranges){wrap.append(doc.createTextNode(n.data.slice(at,a)));const mark=doc.createElement('span');mark.className='history81-frequency';mark.textContent=n.data.slice(a,b);wrap.append(mark);at=b;}wrap.append(doc.createTextNode(n.data.slice(at)));n.replaceWith(wrap);undo.push(()=>{if(wrap.parentNode)wrap.replaceWith(n);});
      }
    }return ()=>undo.reverse().forEach(fn=>fn());
  }
  // Move only reviewed parenthetical notes in the pinned private Goryeo reader.
  // Notes are read from its DOM, never copied into this public bundle. The source
  // elements remain intact off-DOM and are restored before recall or navigation.
  function prepareGoryeoNotes(host,era,source,entries){
    const byNode=new WeakMap(),undo=[],doc=host.ownerDocument;
    const result={byNode,restore(){undo.reverse().forEach(fn=>fn());}};
    if(era!=='goryeo'||source!=='245d166b2a252293903f87654028a648772f8c78dbb8ade09c86a21a223bb5a9')return result;
    const rules=[
      ['table16','1:2','정계와 계백료서',[0],true],
      ['table16','1:2','역분전',[0,1]],
      ['table16','1:2','흑창',[0]],
      ['table16','1:2','기인 제도',[0,1]],
      ['table16','1:2','사심관 제도',[0]],
      ['table16','2:2','왕규의 난',[0,1]],
      ['table16','3:2','광덕, 준풍',[0]],
      ['table16','3:2','제위보',[0]],
      ['table16','6:2','초조대장경',[2]],
      ['table18','2:2','봉사 10조',[1],true],
      ['table21','2:2','벽란도',[0]],
      ['table21','2:2','관영상점',[0]]
    ];
    function ranges(text){const out=[];let depth=0,start=-1;for(let i=0;i<text.length;i++){if(text[i]==='('){if(!depth)start=i;depth++;}else if(text[i]===')'&&depth&&!--depth)out.push({start,end:i+1,text:text.slice(start,i+1)});}return depth?[]:out;}
    function range(node,start,end){const walk=doc.createTreeWalker(node,4),leaves=[];let n,at=0;while((n=walk.nextNode())){leaves.push({n,start:at,end:at+n.length});at+=n.length;}const a=leaves.find(t=>t.end>start),b=leaves.find(t=>t.end>=end&&t.start<end);if(!a||!b)return null;const r=doc.createRange();r.setStart(a.n,start-a.start);r.setEnd(b.n,end-b.start);return r;}
    function replace(original,phrase,notes,remove,keepDefinition){
      const start=original.textContent.indexOf(phrase);if(start<0||!notes.length)return;
      const existing=entries.get(normalize(phrase)),body=notes.join(' '),summary=keepDefinition&&existing?existing.summary+' '+body:body;
      if(Array.from(summary).length>150)return; // Never hide text that cannot fit the existing tooltip contract.
      const clone=original.cloneNode(true);remove(clone);
      const index=clone.textContent.indexOf(phrase),r=range(clone,index,index+phrase.length);if(!r)return;
      const mark=doc.createElement('span');mark.dataset.historySourceEmphasis='';mark.dataset.goryeoSourceNote='';mark.append(r.extractContents());r.insertNode(mark);
      const entry={id:existing?.id||'goryeo-source-note-'+normalize(phrase),era,phrase,summary};byNode.set(mark,entry);
      // Isolate the note trigger from neighbouring ink so existing maximal-run
      // matching never makes a second tooltip or swallows the preserved wording.
      const piece=doc.createElement('span');piece.style.display='contents';mark.replaceWith(piece);piece.append(mark);
      original.replaceWith(clone);undo.push(()=>{if(clone.parentNode)clone.replaceWith(original);});
    }
    for(const [table,cell,phrase,indices,definition] of rules){
      const scope=host.querySelector('table[data-structure="'+table+'"] [data-cell="'+cell+'"]');if(!scope)continue;
      for(const node of [...scope.querySelectorAll('li')]){
        if(node.querySelector('li')||!node.textContent.includes(phrase))continue;
        const groups=ranges(node.textContent),selected=indices.map(i=>groups[i]);if(selected.some(n=>!n)||selected.some(n=>n.start<node.textContent.indexOf(phrase)+phrase.length))continue;
        replace(node,phrase,selected.map(n=>n.text),clone=>{for(const n of [...selected].reverse()){let start=n.start;while(start>0&&/\s/.test(clone.textContent[start-1]))start--;range(clone,start,n.end)?.deleteContents();}},definition);
      }
    }
    // Header reminders keep their original row header and stable cell ID.
    for(const [table,cell]of [['table16','6:1'],['table18','3:1'],['table19','2:1']]){
      const owner=host.querySelector('table[data-structure="'+table+'"] [data-cell="'+cell+'"]'),note=owner?.querySelector('.gsr-source-note'),label=owner?.querySelector(':scope > p');
      if(note&&label)replace(owner,label.textContent.trim(),[note.textContent.trim()],clone=>clone.querySelector('.gsr-source-note').remove());
    }
    // Indented explanations attach to their enclosing keyword when it exists.
    // A note-only keyword stays visible so no source term disappears from reading.
    for(const [table,phrase,pattern]of [['table18','삼별초',/^\s*※\s*삼별초\s*:/],['table21','전시과',/^\s*※\s*시정\s*전시과/],['table21','녹과전',/^\s*※\s*녹과전\s*:/]]){
      const note=[...host.querySelectorAll('table[data-structure="'+table+'"] li li')].find(n=>pattern.test(n.textContent));if(!note)continue;
      const owner=note.parentElement.closest('li'),body=note.textContent.trim();if(!owner)continue;
      const before=owner.cloneNode(true);before.querySelectorAll('ul,ol').forEach(n=>n.remove());
      if(before.textContent.includes(phrase))replace(owner,phrase,[body],clone=>{const n=[...clone.querySelectorAll('li')].find(n=>n.textContent.trim()===body);if(!n)return;const list=n.parentElement;n.remove();if(!list.children.length)list.remove();});
      else replace(note,phrase,[body],clone=>{clone.textContent=phrase;});
    }
    return result;
  }
  // Split complete dictionary terms in a punctuation-separated emphasis list.
  // No textbook coordinates or private source sentences are encoded here.
  // Keep the original nodes so recall and teardown see the unchanged source.
  function prepareJoseonTerms(host,era,entries){
    const undo=[],doc=host.ownerDocument;
    if(era!=='joseon')return ()=>{};
    function slice(nodes,start,end){
      const out=doc.createDocumentFragment();let offset=0;
      for(const node of nodes){const length=node.textContent.length,lo=offset;offset+=length;if(end<=lo||start>=offset)continue;
        const copy=node.cloneNode(true),from=Math.max(0,start-lo),to=Math.min(length,end-lo);
        if(copy.nodeType===3){copy.data=copy.data.slice(from,to);out.append(copy);continue;}
        const walk=doc.createTreeWalker(copy,4),leaves=[];let n,at=0;while((n=walk.nextNode())){leaves.push({n,at});at+=n.length;}
        for(const {n,at}of leaves)n.data=n.data.slice(Math.max(0,from-at),Math.max(0,Math.min(n.length,to-at)));
        for(const empty of [...copy.querySelectorAll('*')].reverse())if(!empty.textContent&&!empty.querySelector('img,svg,br'))empty.remove();
        copy.removeAttribute('data-history-source-emphasis');copy.querySelectorAll(marker).forEach(n=>n.removeAttribute('data-history-source-emphasis'));out.append(copy);
      }return out;
    }
    function walk(parent){
      if(parent.nodeType!==1||parent.matches(blocked))return;
      const children=[...parent.childNodes];let i=0;
      while(i<children.length){const first=children[i];if(first.nodeType!==1||!first.matches(marker)){if(first.nodeType===1)walk(first);i++;continue;}
        const nodes=[first];let j=i+1;while(j<children.length){const n=children[j];if(n.nodeType===1&&n.matches(marker)){nodes.push(n);j++;}else if(n.nodeType===3&&!n.textContent.trim()&&children[j+1]?.nodeType===1&&children[j+1].matches(marker)){nodes.push(n,children[j+1]);j+=2;}else break;}i=j;
        if(nodes.some(n=>n.nodeType===1&&(n.matches(blocked)||n.querySelector(blocked+',img,svg,br')||n.id||n.querySelector('[id]'))))continue;
        const text=nodes.map(n=>n.textContent).join('');if(entries.has(normalize(text)))continue;
        const parts=[...text.matchAll(/[^,·ㆍ、;\/]+/gu)];if(parts.length<2)continue;
        const context=parent.closest('td,th,li,p')||parent;
        if(parts.some(m=>!m[0].trim()||!entries.has(normalize(m[0]))||!contextAllows(entries.get(normalize(m[0])),context)))continue;
        const prefix=doc.createRange();prefix.selectNodeContents(context);prefix.setEndBefore(first);const offset=prefix.toString().length,whole=context.textContent,left=whole[offset-1]||'',right=whole[offset+text.length]||'';
        if(/[\p{L}\p{N}\p{M}_]/u.test(left)||/[\p{L}\p{N}\p{M}_]/u.test(right))continue;
        const wrap=doc.createElement('span');wrap.dataset.historyTermList='';wrap.style.display='contents';let at=0;
        for(const m of parts){const trim=m[0].trim(),start=m.index+m[0].indexOf(trim),end=start+trim.length;if(start>at)wrap.append(slice(nodes,at,start));const piece=doc.createElement('span'),mark=doc.createElement('span');piece.style.display='contents';mark.dataset.historySourceEmphasis='';mark.append(slice(nodes,start,end));piece.append(mark);wrap.append(piece);at=end;}if(at<text.length)wrap.append(slice(nodes,at,text.length));
        parent.insertBefore(wrap,first);nodes.forEach(n=>n.remove());undo.push(()=>{if(wrap.parentNode)wrap.replaceWith(...nodes);});
      }
    }
    // The user requested these two royal-policy explanations in their tooltips.
    // Match semantic rows and a closed, known set of facts; preserve unfamiliar notes.
    function safeNote(node){return node&&!node.id&&!node.matches(blocked)&&!node.closest(blocked+',[contenteditable]')&&!node.querySelector(blocked)&&!node.querySelector('[id],a,button,input,textarea,select,[role=button],[contenteditable],img,svg,script,style,iframe,video,audio,canvas,object,embed,details,table');}
    function markedTerm(node,phrase){const marks=[...node.querySelectorAll(marker)];return marks.length===1&&normalize(marks[0].textContent)===normalize(phrase)&&!marks[0].querySelector('br')?marks[0]:null;}
    // Requested reading-only edits use the existing dictionary and rendered DOM.
    // Private explanations and quantities never become public bundle constants.
    const entryById=id=>[...entries.values()].find(entry=>entry.id===id);
    const injo=entryById('joseon-king-16'),restoration=entryById('joseon-injo-restoration'),tax=entryById('yeongjeong'),monument=entryById('joseon-samjeondo-monument');
    function plainItem(node){return safeNote(node)&&!node.querySelector('li,p,br,ul,ol')&&!node.closest('[data-history-requested-emphasis]');}
    function label(entry,nodes,start,end,kind){const mark=doc.createElement('strong');mark.dataset.historySourceEmphasis='';mark.dataset.historyRequestedEmphasis=kind;mark.append(slice(nodes,start,end));return mark;}
    function replaceItem(original,copy){original.replaceWith(copy);undo.push(()=>{if(copy.parentNode)copy.replaceWith(original);});}
    const warLists=new Set();
    if(injo)for(const node of [...host.querySelectorAll('li')]){
      if(!plainItem(node))continue;
      const row=node.closest('tr'),heading=row?.cells[0]?.textContent.trim(),text=node.textContent,children=[...node.childNodes],colon=text.indexOf(':');
      if(heading===injo.phrase&&colon>=0){
        const head=text.slice(0,colon).trim(),tail=text.slice(colon+1),copy=node.cloneNode(false);
        if(restoration&&head===restoration.phrase&&/^\s*[^:()\n]+\s*$/u.test(tail)&&tail.trim()){
          const start=text.indexOf(restoration.phrase),end=colon+1+tail.length-tail.match(/\s*$/u)[0].length,noteStart=colon+1+tail.match(/^\s*/u)[0].length;
          const strong=doc.createElement('strong');strong.dataset.historyRequestedEmphasis='event-line';
          strong.append(label(restoration,children,start,start+restoration.phrase.length,'event-term'),doc.createTextNode(' ('),slice(children,noteStart,end),doc.createTextNode(')'));
          copy.append(slice(children,0,start),strong,slice(children,end,text.length));replaceItem(node,copy);
        }else if(tax&&head.startsWith(tax.phrase)&&normalize(head)===normalize(tax.phrase)+'제정'){
          const parts=/^(\s*)(\S+)\s+(\S+)\s+([^()]+)\(([^()]+)\)(\s*)$/u.exec(tail);
          if(!parts||!/^\d+(?:[~–-]\d+)?\p{L}+$/u.test(normalize(parts[5])))continue;
          const start=text.indexOf(tax.phrase),first=colon+1+parts[1].length,firstEnd=first+parts[2].length,second=text.indexOf(parts[3],firstEnd),open=text.indexOf('(',second),close=text.lastIndexOf(')');
          let noteEnd=open;while(noteEnd>second&&/\s/u.test(text[noteEnd-1]))noteEnd--;
          copy.append(slice(children,0,start),label(tax,children,start,start+tax.phrase.length,'policy-term'),doc.createTextNode(' ('),slice(children,first,firstEnd),slice(children,second,noteEnd),doc.createTextNode(' '),slice(children,open+1,close),doc.createTextNode(')'),slice(children,close+1,text.length));replaceItem(node,copy);
        }
      }else if(monument&&node.closest('tbody')?.dataset.group===injo.phrase&&row?.dataset.subrow==='병자호란 / 청'){
        const prefix=/^\s*항복\s*→\s*/u.exec(text);if(!prefix)continue;
        const start=prefix[0].length,end=start+monument.phrase.length;
        if(text.slice(start,end)!==monument.phrase||/[\p{L}\p{N}\p{M}_]/u.test(text[end]||''))continue;
        const copy=node.cloneNode(false);copy.append(label(monument,children,start,end,'monument-term'),slice(children,end,text.length));replaceItem(node,copy);
        if(copy.parentElement.tagName==='UL')warLists.add(copy.parentElement);
      }
    }
    // Reorder the original items, retaining their markup, identity and listeners.
    for(const list of warLists){
      const matches=[...list.children].filter(node=>node.tagName==='LI'&&plainItem(node)&&/^김상헌\([^()]+\)vs최명길\([^()]+\)$/u.test(normalize(node.textContent)));
      if(matches.length!==1||matches[0]===list.lastElementChild)continue;
      const item=matches[0],anchor=doc.createComment('reading-order');item.before(anchor);list.append(item);undo.push(()=>{if(anchor.parentNode)anchor.replaceWith(item);});
    }
    const yeongjo=entryById('joseon-king-21'),ordered=['joseon-yi-injwa-rebellion','joseon-tangpyeong-stele','joseon-remaining-cheonggyecheon'].map(entryById);
    if(yeongjo&&ordered.every(Boolean))for(const list of host.querySelectorAll('td > ul')){
      if(list.closest('tr')?.cells[0]?.textContent.trim()!==yeongjo.phrase)continue;
      const items=[...list.children],matches=ordered.map(entry=>items.filter(node=>node.tagName==='LI'&&plainItem(node)&&markedTerm(node,entry.phrase)));
      if(matches.some(nodes=>nodes.length!==1))continue;
      const [item,before,after]=matches.map(nodes=>nodes[0]);
      if(items.indexOf(before)>=items.indexOf(after)||items.indexOf(item)<items.indexOf(before))continue;
      const anchor=doc.createComment('reading-order');item.before(anchor);before.before(item);undo.push(()=>{if(anchor.parentNode)anchor.replaceWith(item);});
    }
    function collapse(node,phrase,extra){
      const copy=node.cloneNode(true),mark=markedTerm(copy,phrase);if(!mark)return;
      copy.replaceChildren(mark);node.replaceWith(copy);
      const anchor=extra?doc.createComment('collapsed-policy-explanation'):null;if(extra)extra.replaceWith(anchor);
      undo.push(()=>{if(copy.parentNode)copy.replaceWith(node);if(anchor?.parentNode)anchor.replaceWith(extra);});
    }
    for(const row of host.querySelectorAll('tr')){
      const king=row.cells[0]?.textContent.trim();
      if(king==='현종')for(const item of row.querySelectorAll('li')){
        const entry=entries.get(normalize('예송 논쟁')),note=item.parentElement.nextElementSibling;
        if(!entry||!['기해예송','갑인예송','1659','1674','송시열','자의대비'].every(s=>entry.summary.includes(s)))continue;
        if(!safeNote(item)||item.querySelector('ul,ol,p')||!markedTerm(item,'예송 논쟁')||item.parentElement.tagName!=='UL'||item.parentElement.children.length!==1||note?.tagName!=='P'||!safeNote(note))continue;
        if(normalize(item.textContent)!==normalize('예송 논쟁: 자의 대비(인조 비) 복상 문제, 서인 vs 남인')||normalize(note.textContent)!==normalize('※ 기해예송(송시열, 서인 승), 갑인예송(남인 승)'))continue;
        collapse(item,'예송 논쟁',note);
      }
      if(king==='숙종')for(const item of row.querySelectorAll('li')){
        const entry=entries.get(normalize('환국')),list=item.querySelector(':scope > ul');
        if(!entry||!['경신환국','기사환국','갑술환국','1680','1689','1694','1701','송시열','효종','현종','숙종'].every(s=>entry.summary.includes(s)))continue;
        if(!safeNote(item)||!markedTerm(item,'환국')||!list||list.children.length!==1||list.firstElementChild.tagName!=='LI'||item.querySelectorAll('ul,ol').length!==1)continue;
        const head=item.cloneNode(true);head.querySelector('ul').remove();if(normalize(head.textContent)!==normalize('환국 발생(경신환국, 기사환국, 갑술환국)'))continue;
        const child=list.firstElementChild;if(child.querySelector('ul,ol,p,br'))continue;
        const notes=[...child.textContent.matchAll(/\(([^()]*)\)/gu)];if(notes.length>1)continue;
        // A short activity reminder may name the same three reigns. Unknown text stays visible.
        if(notes.length&&normalize(notes[0][1]).replace(/(?:은|는|때|다|나옴|활동)/gu,'').replace(/[·,:]/gu,'')!=='송시열효종현종숙종')continue;
        const body=child.textContent.replace(/\([^()]*\)/gu,'');
        if(normalize(body)!==normalize('→ 송시열 사사, 인현왕후 폐위, 장희빈 사사, 허적과 윤휴 축출'))continue;
        collapse(item,'환국');
      }
    }
    // The two quoted notes were explicitly moved into their public definitions.
    const requestedNotes=[['계유정난','(김종서 축출, 수양대군(=세조)이 권력 잡음)'],['남이 장군','(세조 때 이시애의 난 평정, 건주위 여진족 정벌)']];
    for(const [phrase,note]of requestedNotes)for(const original of [...host.querySelectorAll('li,p')]){
      if(original.querySelector('li,p,[id],a,button,input,textarea,select,[role=button]')||!original.textContent.includes(phrase)||!original.textContent.includes(note)||entries.get(normalize(phrase))?.plainText!==true)continue;
      const targetWalk=doc.createTreeWalker(original,4);let target,canAnnotate=false;while((target=targetWalk.nextNode())){const start=target.data.indexOf(phrase);if(start<0||target.parentElement.closest(blocked+','+marker))continue;const prefix=doc.createRange();prefix.selectNodeContents(original);prefix.setEnd(target,start);const offset=prefix.toString().length,text=original.textContent,tail=text.slice(offset+phrase.length);if(!/[\p{L}\p{N}\p{M}_]/u.test(text[offset-1]||'')&&(!/^[\p{L}\p{N}\p{M}_]/u.test(tail)||/^(?:으로|에서|이|가|을|를|은|는|의|에|와|과|도|만|로)(?=$|[^\p{L}\p{N}\p{M}_])/u.test(tail)))canAnnotate=true;}if(!canAnnotate)continue;
      const copy=original.cloneNode(true),start=copy.textContent.indexOf(note),end=start+note.length,leaves=[],walk=doc.createTreeWalker(copy,4);let n,at=0;while((n=walk.nextNode())){leaves.push({n,start:at,end:at+n.length});at+=n.length;}
      const a=leaves.find(t=>t.end>start),b=leaves.find(t=>t.end>=end&&t.start<end);if(!a||!b)continue;const range=doc.createRange();range.setStart(a.n,start-a.start);range.setEnd(b.n,end-b.start);range.deleteContents();original.replaceWith(copy);undo.push(()=>{if(copy.parentNode)copy.replaceWith(original);});
    }
    walk(host);
    // Only individually audited dictionary entries may annotate unstyled text.
    for(const entry of entries.values())if(entry.plainText===true){
      const leaves=[],walk=doc.createTreeWalker(host,4);let n;while((n=walk.nextNode()))if(n.parentElement.closest('li,p')&&!n.parentElement.closest(blocked+',script,style,[role="tooltip"],'+marker))leaves.push(n);
      for(const node of leaves){const scope=node.parentElement.closest('li,p'),prefix=doc.createRange();prefix.selectNodeContents(scope);prefix.setEnd(node,0);const offset=prefix.toString().length,text=scope.textContent;const re=new RegExp(entry.phrase.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gu'),hits=[...node.data.matchAll(re)].filter(m=>{const tail=text.slice(offset+m.index+m[0].length);return !/[\p{L}\p{N}\p{M}_]/u.test(text[offset+m.index-1]||'')&&(!/^[\p{L}\p{N}\p{M}_]/u.test(tail)||/^(?:으로|에서|이|가|을|를|은|는|의|에|와|과|도|만|로)(?=$|[^\p{L}\p{N}\p{M}_])/u.test(tail));});if(!hits.length)continue;
        const wrap=doc.createElement('span');wrap.style.display='contents';let at=0;for(const m of hits){wrap.append(doc.createTextNode(node.data.slice(at,m.index)));const mark=doc.createElement(entry.emphasize?'strong':'span');mark.dataset.historySourceEmphasis='';mark.textContent=m[0];wrap.append(mark);at=m.index+m[0].length;}wrap.append(doc.createTextNode(node.data.slice(at)));node.replaceWith(wrap);undo.push(()=>{if(wrap.parentNode)wrap.replaceWith(node);});
      }
    }
    // Emphasize the requested complete event lines from the rendered reader.
    // The continuation and parenthetical stay in the private DOM, not this bundle.
    const eventLines=[['joseon-sampo-disturbance','중종',/^→[^()]+\([^()]*\)$/u],['joseon-yangjae-poster-incident','명종',/^\([^()]*\)$/u]];
    for(const [id,king,tail]of eventLines){
      const entry=[...entries.values()].find(e=>e.id===id);if(!entry||!entry.plainText)continue;
      const phrase=normalize(entry.phrase);
      for(const node of host.querySelectorAll('li,p')){
        if(!safeNote(node)||node.querySelector('li,p,br,ul,ol')||node.closest('[data-history-requested-emphasis]'))continue;
        const rowKing=node.closest('tr')?.cells[0]?.textContent.trim(),text=normalize(node.textContent);
        if((rowKing&&rowKing!==king)||!text.startsWith(phrase)||!tail.test(text.slice(phrase.length)))continue;
        const marks=[...node.querySelectorAll(marker)];if(!marks.some(mark=>normalize(mark.textContent)===phrase))continue;
        const strong=doc.createElement('strong');strong.dataset.historyRequestedEmphasis='event-line';
        strong.append(...node.childNodes);node.append(strong);
        undo.push(()=>{if(strong.parentNode)strong.replaceWith(...strong.childNodes);});
      }
    }
    // Remove only the dismissed short bullet within its named person's section.
    for(const node of host.querySelectorAll('li')){if(node.textContent.trim()!=='조선 건국 주도'||node.children.length||!node.parentElement.previousElementSibling?.textContent.includes('정도전'))continue;const anchor=doc.createComment('dismissed-person-summary');node.replaceWith(anchor);undo.push(()=>{if(anchor.parentNode)anchor.replaceWith(node);});}
    // Keep the event under Sejo as requested; its definition retains the Danjong date.
    for(const node of host.querySelectorAll('li')){if(node.textContent.trim()!=='계유정난 발생'||node.closest('tr')?.cells[0]?.textContent.trim()!=='단종'||node.id||node.querySelector('li,[id],a,button,input'))continue;const anchor=doc.createComment('dismissed-duplicate-event');node.replaceWith(anchor);undo.push(()=>{if(anchor.parentNode)anchor.replaceWith(node);});}
    // Put the requested Sejo policy on the next line and connect its definition.
    // Keep the preceding policy explanation intact and restore the exact original node.
    for(const cell of host.querySelectorAll('tr')){if(cell.cells[0]?.textContent.trim()!=='세조')continue;const leaves=[],walk=doc.createTreeWalker(cell,4);let n;while((n=walk.nextNode()))if(n.parentElement.closest('li,p')&&!n.parentElement.closest('strong,b,script,style,'+blocked))leaves.push(n);
      for(const node of leaves){const match=/수신전\s*&\s*휼양전\s*폐지/u.exec(node.data);if(!match||!entries.has(normalize(match[0])))continue;
        const scope=node.parentElement.closest('li,p'),prefix=doc.createRange();prefix.selectNodeContents(scope);prefix.setEnd(node,match.index);const before=prefix.toString(),tail=node.data.slice(match.index+match[0].length),leading=node.data.slice(0,match.index),previous=node.previousSibling,afterBreak=leading.trim()===''&&previous?.nodeType===1&&previous.tagName==='BR';
        if((!afterBreak&&/[\p{L}\p{N}\p{M}_]/u.test(before.at(-1)||''))||/^[\p{L}\p{N}\p{M}_]/u.test(scope.textContent.slice(before.length+match[0].length)))continue;
        const wrap=doc.createElement('span');wrap.style.display='contents';const strong=doc.createElement('strong');strong.dataset.historyRequestedEmphasis='';strong.dataset.historySourceEmphasis='';strong.textContent=match[0];
        wrap.append(doc.createTextNode(before.trim()?leading.replace(/,\s*$/u,''):leading));
        if(before.trim()&&!afterBreak){const br=doc.createElement('br');br.dataset.historyRequestedBreak='';wrap.append(br);}
        wrap.append(strong,doc.createTextNode(tail));node.replaceWith(wrap);undo.push(()=>{if(wrap.parentNode)wrap.replaceWith(node);});
      }
    }
    // The user explicitly dismissed this redundant diagram transcription.
    // It is restored before blank recall, which still uses the full source.
    const diagram=['국왕 / 의정부 / 6조','국왕 → 6조, 명령','6조 → 국왕, 보고','의정부는 가운데 상자로 표시되며, 이 도식의 두 화살표는 의정부를 거치지 않는다.'];
    for(const title of host.querySelectorAll('p')){if(title.textContent.trim()!=='6조 직계제 도식')continue;const list=title.nextElementSibling;if(list?.tagName!=='UL'||list.children.length!==diagram.length||[...list.children].some((n,i)=>n.textContent.trim()!==diagram[i])||title.id||title.querySelector('[id],input,button,a')||list.id||list.querySelector('[id],input,button')||![...host.querySelectorAll(marker)].some(n=>n.textContent==='6조 직계제'))continue;
      const titleAnchor=doc.createComment('collapsed-term-diagram-title'),listAnchor=doc.createComment('collapsed-term-diagram-list');title.replaceWith(titleAnchor);list.replaceWith(listAnchor);undo.push(()=>{if(titleAnchor.parentNode)titleAnchor.replaceWith(title);if(listAnchor.parentNode)listAnchor.replaceWith(list);});
    }
    // Collapse the matching Uijeongbu diagram only when all four relations agree.
    const relations=[['방향','관계'],['국왕 → 의정부','재가'],['의정부 → 국왕','건의'],['의정부 → 6조','명령'],['6조 → 의정부','보고']];
    for(const title of host.querySelectorAll('p')){if(!title.textContent.trim().startsWith('의정부 서사제 도식 ·'))continue;const diagram=title.nextElementSibling,table=diagram?.querySelector('table');if(!table||title.id||title.querySelector('[id],input,button,a')||diagram.id||diagram.querySelector('[id],input,button')||[...diagram.childNodes].some(n=>n!==table&&(n.nodeType!==3||n.textContent.trim()))||![...host.querySelectorAll(marker)].some(n=>n.textContent==='의정부 서사제'))continue;const rows=[...table.rows];if(rows.length!==relations.length||rows.some((r,i)=>r.cells.length!==2||[...r.cells].some((c,j)=>c.textContent.trim()!==relations[i][j])))continue;
      const titleAnchor=doc.createComment('collapsed-council-diagram-title'),diagramAnchor=doc.createComment('collapsed-council-diagram');title.replaceWith(titleAnchor);diagram.replaceWith(diagramAnchor);undo.push(()=>{if(titleAnchor.parentNode)titleAnchor.replaceWith(title);if(diagramAnchor.parentNode)diagramAnchor.replaceWith(diagram);});
    }
    return ()=>undo.reverse().forEach(fn=>fn());
  }
  function mount(host,era,source,verifiedData){
    const marker=verifiedData&&verifiedData.boundaryPrepared?'[data-history-glossary-certified]':'[data-history-source-emphasis]';
    const data=verifiedData||root.HanqHistory81TermData,doc=host.ownerDocument,win=doc.defaultView;
    if(!data||source!==data.sources[era])return {stop(){},count:0};
    const entries=new Map(data.entries.filter(e=>e.era===era&&Array.from(e.summary).length<=150).map(e=>[normalize(e.phrase),e]));
    const notes=verifiedData?{byNode:new WeakMap(),restore(){}}:prepareGoryeoNotes(host,era,source,entries);
    const restoreJoseon=verifiedData?()=>{}:prepareJoseonTerms(host,era,entries);
    const triggers=[],offs=[];let active=null,pinned=false,timer=null,stopped=false;
    const tip=doc.createElement('div');tip.className='history81-term-tooltip';tip.id='history81-term-tip-'+(++serial);tip.setAttribute('role','tooltip');tip.hidden=true;doc.body.append(tip);
    function listen(node,event,fn,options){node.addEventListener(event,fn,options);offs.push(()=>node.removeEventListener(event,fn,options));}
    function close(){clearTimeout(timer);if(active){const ids=(active.getAttribute('aria-describedby')||'').split(/\s+/).filter(id=>id&&id!==tip.id);if(ids.length)active.setAttribute('aria-describedby',ids.join(' '));else active.removeAttribute('aria-describedby');active.setAttribute('aria-expanded','false');}active=null;pinned=false;tip.hidden=true;tip.textContent='';}
    function position(){
      if(!active||!active.isConnected){close();return;}
      // Match the surrounding reading size, not the portalled body's size.
      const fontSize=parseFloat(win.getComputedStyle(active).fontSize);
      tip.style.setProperty('--history81-tooltip-font-size',((Number.isFinite(fontSize)&&fontSize>2?fontSize:14)-2)+'px');
      const r=active.getBoundingClientRect(),v=win.visualViewport,w=v?v.width:win.innerWidth,h=v?v.height:win.innerHeight,ox=v?v.offsetLeft:0,oy=v?v.offsetTop:0;
      tip.style.maxWidth=Math.max(1,Math.min(280,w-24))+'px';
      tip.style.maxHeight=Math.max(1,h-24)+'px';
      const t=tip.getBoundingClientRect();
      tip.style.left=Math.max(ox+12,Math.min(r.left,ox+w-t.width-12))+'px';
      tip.style.top=Math.max(oy+12,Math.min(r.bottom+8+t.height<=oy+h-12?r.bottom+8:r.top-t.height-8,oy+h-t.height-12))+'px';
    }
    function open(node,entry,pin){if(stopped)return;clearTimeout(timer);if(active!==node)close();active=node;pinned=pin||pinned;tip.textContent=entry.summary;tip.hidden=false;const ids=new Set((node.getAttribute('aria-describedby')||'').split(/\s+/).filter(Boolean));ids.add(tip.id);node.setAttribute('aria-describedby',[...ids].join(' '));node.setAttribute('aria-expanded','true');position();}
    function scrollExplanation(event,node){
      if(active!==node||tip.hidden||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey)return false;
      const max=tip.scrollHeight-tip.clientHeight;if(max<=0)return false;
      const page=Math.max(20,tip.clientHeight-20),next={ArrowDown:tip.scrollTop+32,ArrowUp:tip.scrollTop-32,PageDown:tip.scrollTop+page,PageUp:tip.scrollTop-page,Home:0,End:max};
      if(!Object.prototype.hasOwnProperty.call(next,event.key))return false;
      event.preventDefault();tip.scrollTop=Math.max(0,Math.min(max,next[event.key]));return true;
    }
    function leave(){clearTimeout(timer);if(!pinned)timer=win.setTimeout(()=>{if(doc.activeElement!==active&&!tip.matches(':hover'))close();},180);}
    function annotate(parent){
      if(parent.nodeType!==1||parent.matches(blocked))return;
      const children=[...parent.childNodes];let i=0;
      while(i<children.length){const first=children[i];if(first.nodeType!==1||!first.matches(marker)){if(first.nodeType===1)annotate(first);i++;continue;}
        const nodes=[first];let j=i+1;
        while(j<children.length){const n=children[j];if(n.nodeType===1&&n.matches(marker)){nodes.push(n);j++;continue;}if(n.nodeType===3&&!n.textContent.trim()&&children[j+1]?.nodeType===1&&children[j+1].matches(marker)){nodes.push(n,children[j+1]);j+=2;continue;}break;}
        if(nodes.some(n=>n.nodeType===1&&n.querySelector('[data-goryeo-source-note]'))){nodes.forEach(n=>{if(n.nodeType===1)annotate(n);});i=j;continue;}
        const text=nodes.map(n=>n.textContent).join(''),entry=notes.byNode.get(first)||entries.get(normalize(text)),context=parent.closest('td,th,li,p')||parent;
        // A partially emphasized word is not a certified phrase. Never split a maximal styled run.
        const before=children[i-1],after=children[j],suffixAllowed=entry?.followingSuffixes?.some(s=>after?.nodeType===3&&after.textContent.startsWith(s)&&!/[\p{L}\p{N}]/u.test(after.textContent[s.length]||'')),particle=/^(?:으로|에서|이라고|라고|로|이|가|을|를|은|는|의|에|와|과|도|만|까지)(?=$|[^\p{L}\p{N}])/u,partial=(before?.nodeType===3&&/[\p{L}\p{N}]$/u.test(before.textContent))||(after?.nodeType===3&&/^[\p{L}\p{N}]/u.test(after.textContent)&&!particle.test(after.textContent)&&!suffixAllowed);
        if(entry&&!partial&&!nodes.some(n=>n.nodeType===1&&(n.matches(blocked)||n.querySelector(blocked)))&&(notes.byNode.has(first)||contextAllows(entry,context))){
          const trigger=doc.createElement('span');trigger.className='history81-term';trigger.dataset.termId=entry.id;trigger.dataset.termPhrase=entry.phrase;trigger.setAttribute('role','button');trigger.tabIndex=0;trigger.setAttribute('aria-label',text+' 용어 설명');trigger.setAttribute('aria-expanded','false');parent.insertBefore(trigger,first);nodes.forEach(n=>trigger.append(n));triggers.push(trigger);
          listen(trigger,'pointerenter',e=>{if(e.pointerType!=='touch')open(trigger,entry,false);});listen(trigger,'pointerleave',leave);
          listen(trigger,'pointerdown',()=>trigger.focus({preventScroll:true}));
          listen(trigger,'focus',()=>open(trigger,entry,false));listen(trigger,'blur',()=>{if(active===trigger){pinned=false;leave();}});
          listen(trigger,'click',()=>{if(active===trigger&&pinned)close();else open(trigger,entry,true);});
          listen(trigger,'keydown',e=>{if(e.isComposing||e.keyCode===229||scrollExplanation(e,trigger))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat){if(active===trigger&&pinned)close();else open(trigger,entry,true);}}});
        }else if(!verifiedData)nodes.forEach(n=>{if(n.nodeType===1)annotate(n);});
        i=j;
      }
    }
    annotate(host);
    const restoreFrequency=softenFrequency(host);
    listen(tip,'pointerenter',()=>clearTimeout(timer));listen(tip,'pointerleave',leave);
    listen(doc,'pointerdown',e=>{if(active&&!active.contains(e.target)&&!tip.contains(e.target))close();},true);
    listen(doc,'keydown',e=>{if(e.key==='Escape'&&active){e.preventDefault();close();}});
    listen(win,'scroll',e=>{if(e.target!==tip)close();},true);listen(win,'resize',close);if(win.visualViewport){listen(win.visualViewport,'resize',close);listen(win.visualViewport,'scroll',close);}
    return {count:triggers.length,stop(){if(stopped)return;stopped=true;close();restoreFrequency();offs.forEach(off=>off());tip.remove();triggers.forEach(node=>{if(node.parentNode)node.replaceWith(...node.childNodes);});restoreJoseon();notes.restore();}};
  }
  root.HanqHistory81Terms={mount,normalize,softenFrequency};
})(typeof window==='object'?window:globalThis);


