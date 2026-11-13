/* Reuse only the definitions audited in docs/glossary-verification.md.
 * This is a small boundary-checked emphasis glossary, not full source annotation. */
(function(root){
  'use strict';
  const pdf='d54c1aa5d5816eeb73a2e82da0ec699555c2cbf1e7cb717a3b84420ed18296de';
  const opening='255c37fb68122a329cca00ae1c15035590b6a7b21f601e4a5b5f7515fdfbf695';
  const ids={prehistory:['tteonseokgi','bitsal','goindol','sachuldo','yeonggo','jegahoeui','seookje','sodo','cheongun'],samguk:['golpum','yukdupum','yullyeong','taehak'],nambuk:['golpum','yukdupum','nogeup','gwallyojeon'],opening:['hopo','sachang','dangbaek','cheokhwa','byeolgigun','jipgangso','hongbeom','danbal','gwangmu','tonggambu'],colonial:['hoesa','sanmi','changssi'],modern:['nongji','sasaoip','gingeup','silmyeong']};
  function data(){
    const entries=[],sources={};
    for(const [era,allowed] of Object.entries(ids)){
      sources[era]=era==='opening'?opening:pdf;
      for(const e of root.HANQ_GLOSSARY||[]){
        if(!allowed.includes(e.id)||!e.short||Array.from(e.short).length>150||!e.sources?.length||!e.sources.every(s=>/^https:\/\/(encykorea\.aks\.ac\.kr|contents\.history\.go\.kr)\//.test(s.url)))continue;
        for(const phrase of e.match||[e.term])entries.push({id:era+'-glossary-'+e.id,era,phrase,summary:e.short,sources:e.sources.map(s=>s.url)});
      }
    }
    const extra=root.HanqHistory81VerifiedGlossary;
    if(extra&&extra.schema==='hanq-verified-glossary/1'&&extra.sourcePdf===pdf&&extra.sourceOpening===opening){
      for(const e of extra.definitions||[]){
        if(!ids[e.era]||!e.id||!e.summary||Array.from(e.summary).length>150||!Array.isArray(e.pages)||!e.pages.length||!e.pages.every(Number.isInteger)||!e.sources?.length||!e.sources.every(u=>/^https:\/\/(encykorea\.aks\.ac\.kr|contents\.history\.go\.kr)\//.test(u)))continue;
        for(const phrase of e.aliases||[])if(typeof phrase==='string'&&phrase.trim())entries.push({id:e.id,era:e.era,phrase,summary:e.summary,sources:e.sources,pages:e.pages,followingParticles:e.followingParticles});
      }
    }
    return {sources,entries};
  }
  function pageEra(page){const n=page.pdfPage;return n>=8&&n<=15?'prehistory':n>=16&&n<=30?'samguk':n>=31&&n<=40?'nambuk':n>=108&&n<=125?'colonial':n>=126&&n<=139?'modern':null;}
  // Read a whole highlighted run, but activate only certified terms with real
  // Unicode boundaries. Source nodes are detached intact and restored on stop.
  function prepare(host,entries){
    const doc=host.ownerDocument,marker='[data-history-source-emphasis]',undo=[];
    const blocked='a,button,input,textarea,select,img,svg,br,[role="button"],.history81-term,[data-layout-label]';
    const word=ch=>!!ch&&/[\p{L}\p{N}\p{M}_]/u.test(ch);
    const patterns=entries.map(e=>({e,re:new RegExp(e.phrase.replace(/[.*+?^{}$()|[\]\\]/g,ch=>'\\'+ch).replace(/\s+/g,'\\s+'),'gu')})).sort((a,b)=>b.e.phrase.length-a.e.phrase.length);
    function walk(parent){
      if(parent.nodeType!==1||parent.matches(blocked))return;
      const children=[...parent.childNodes];let i=0;
      while(i<children.length){
        const first=children[i];if(first.nodeType!==1||!first.matches(marker)){if(first.nodeType===1)walk(first);i++;continue;}
        const nodes=[first];let j=i+1;
        while(j<children.length){const n=children[j];if(n.nodeType===1&&n.matches(marker)){nodes.push(n);j++;}else if(n.nodeType===3&&!n.textContent.trim()&&children[j+1]?.nodeType===1&&children[j+1].matches(marker)){nodes.push(n,children[j+1]);j+=2;}else break;}
        i=j;
        if(nodes.some(n=>n.nodeType===1&&(n.matches(blocked)||n.querySelector(blocked)||n.id||n.querySelector('[id]'))))continue;
        const text=nodes.map(n=>n.textContent).join('');
        const scope=parent.closest('td,th,li,p,.textbook-semantic-line')||parent;
        const prefix=doc.createRange();prefix.selectNodeContents(scope);prefix.setEndBefore(first);
        const before=prefix.toString(),after=scope.textContent.slice(before.length+text.length),hits=[];
        for(const {e,re} of patterns){
          const pageNode=first.closest('[data-pdf-page],[data-page]'),pageNumber=pageNode&&Number(pageNode.getAttribute('data-pdf-page')||pageNode.getAttribute('data-page'));
          if(e.pages&&(!pageNode||!e.pages.includes(pageNumber)))continue;
          re.lastIndex=0;for(const m of text.matchAll(re)){
          const start=m.index,end=start+m[0].length,left=Array.from(before+text.slice(0,start)).at(-1),right=Array.from(text.slice(end)+after)[0];
          const tail=text.slice(end)+after,allowedParticle=e.pages&&Array.isArray(e.followingParticles)&&e.followingParticles.some(p=>typeof p==='string'&&p.length&&tail.startsWith(p)&&!word(Array.from(tail.slice(p.length))[0]));
          if(word(left)||(word(right)&&!allowedParticle)||hits.some(h=>start<h.end&&end>h.start))continue;
          hits.push({start,end,e});
        }}
        if(!hits.length)continue;hits.sort((a,b)=>a.start-b.start);
        const texts=[];let offset=0;for(const node of nodes){if(node.nodeType===3){texts.push({node,start:offset,end:offset+node.length});offset+=node.length;}else{const walker=doc.createTreeWalker(node,4);let t;while((t=walker.nextNode())){texts.push({node:t,start:offset,end:offset+t.length});offset+=t.length;}}}
        // Each slice is cloned inside its source-style ancestors; ranges whose
        // common ancestor is a text leaf need those ancestors explicitly.
        function styledSlice(start,end){const out=doc.createDocumentFragment();for(const n of nodes){const a=texts.filter(t=>n===t.node||n.contains?.(t.node));if(!a.length)continue;const lo=a[0].start,hi=a.at(-1).end;if(end<=lo||start>=hi)continue;const from=Math.max(start,lo),to=Math.min(end,hi);if(n.nodeType===3){out.append(doc.createTextNode(n.data.slice(from-lo,to-lo)));continue;}const r=doc.createRange(),x=a.find(t=>t.end>from),y=a.find(t=>t.end>=to&&t.start<to);r.setStart(x.node,from-x.start);r.setEnd(y.node,to-y.start);let f=r.cloneContents();let common=r.commonAncestorContainer;if(common.nodeType===3)common=common.parentNode;while(common&&common!==n.parentNode){const shell=common.cloneNode(false);shell.removeAttribute?.('data-history-source-emphasis');shell.append(f);f=shell;common=common.parentNode;}if(f.querySelectorAll)f.querySelectorAll(marker).forEach(el=>el.removeAttribute('data-history-source-emphasis'));out.append(f);}return out;}
        const wrap=doc.createElement('span');wrap.style.display='contents';wrap.dataset.historyGlossaryRun='';let at=0;
        for(const hit of hits){if(hit.start>at)wrap.append(styledSlice(at,hit.start));const mark=doc.createElement('span');mark.setAttribute('data-history-source-emphasis','');mark.setAttribute('data-history-glossary-certified','');mark.append(styledSlice(hit.start,hit.end));const piece=doc.createElement('span');piece.dataset.historyGlossaryPiece='';piece.style.display='contents';piece.append(mark);wrap.append(piece);at=hit.end;}if(at<text.length)wrap.append(styledSlice(at,text.length));
        parent.insertBefore(wrap,first);nodes.forEach(n=>n.remove());undo.push(()=>{if(wrap.parentNode)wrap.replaceWith(...nodes);});
      }
    }
    walk(host);return ()=>undo.reverse().forEach(fn=>fn());
  }
  // User-requested place-name supplements; source text nodes are kept intact.
  function capitalLabels(host,era,source){
    const added=[];
    if(era!=='samguk'||source!==pdf)return ()=>{};
    const names={'한성':'위례성','공주':'웅진','부여':'사비'};
    for(const cell of host.querySelectorAll('[data-pdf-page="20"] td[data-source-cell]')){
      if(!/^81-p020-table1-source-r\d+-c[01]$/.test(cell.dataset.sourceCell||''))continue;
      for(const line of cell.querySelectorAll('.textbook-semantic-line')){
        const match=line.textContent.trim().match(/^(한성|공주|부여)(시대)?$/);
        if(!match||line.querySelector('[data-capital-supplement]'))continue;
        const note=host.ownerDocument.createElement('span');note.dataset.capitalSupplement='';note.textContent='('+names[match[1]]+')';
        note.setAttribute('aria-label','옛 지명: '+names[match[1]]);
        const walk=host.ownerDocument.createTreeWalker(line,4);let text;while((text=walk.nextNode()))if(text.data.includes(match[1]))break;
        if(!text)continue;const original=text.data,tail=text.splitText(text.data.indexOf(match[1])+match[1].length);tail.before(note);
        added.push(()=>{note.remove();text.data=original;tail.remove();});
      }
    }
    return ()=>added.forEach(restore=>restore());
  }
  // User explicitly removed this one mnemonic; preserve and restore the original node.
  function removeDismissedMnemonic(host,era,source){
    const undo=[];
    if(era==='samguk'&&source===pdf)for(const node of host.querySelectorAll('[data-history-source-emphasis]')){
      const page=node.closest('[data-pdf-page]');
      if(page?.getAttribute('data-pdf-page')!=='23'||node.textContent!=='(덕만까지 70보..)')continue;
      const marker=host.ownerDocument.createComment('removed-mnemonic');node.replaceWith(marker);
      undo.push(()=>{if(marker.parentNode)marker.replaceWith(node);});
    }
    if(era==='samguk'&&source===pdf)for(const line of host.querySelectorAll('[data-pdf-page="22"] .textbook-semantic-line')){
      if(!['※ 백제가 평양성을 공격했다 / 고구려 왕을 죽였다는 표현이면 근초고왕!','+ 무덤에서 왕과 왕비의 지석, 석수 등이 출토되었다'].includes(line.textContent.trim()))continue;
      const marker=host.ownerDocument.createComment('tooltip-note');line.replaceWith(marker);undo.push(()=>{if(marker.parentNode)marker.replaceWith(line);});
    }
    if(era==='nambuk'&&source===pdf)for(const line of host.querySelectorAll('[data-pdf-page="31"] [data-source-cell="81-p031-table1-source-r7-c1"] .textbook-semantic-line')){
      if(line.textContent.trim()!=='※ 김헌창의 난: 김헌창이 자신의 아버지 김주원이 왕이 되지 못하자 웅천주에서 일으킨 반란')continue;
      const marker=host.ownerDocument.createComment('tooltip-note');line.replaceWith(marker);undo.push(()=>{if(marker.parentNode)marker.replaceWith(line);});
    }
    return ()=>undo.reverse().forEach(fn=>fn());
  }
  function examLabels(host,era,source){
    const added=[];if(era!=='samguk'||source!==pdf)return ()=>{};
    const names={19:'고구려',22:'백제',25:'신라',26:'가야'};
    for(const heading of host.querySelectorAll('h3[data-source-block]')){
      const page=heading.closest('[data-pdf-page]'),n=Number(page?.dataset.pdfPage);
      if(!names[n]||heading.dataset.sourceBlock!=='81-p'+String(n).padStart(3,'0')+'-vector-callout-reviewed'||heading.textContent.trim()!=='시험에는 이렇게 나온다!')continue;
      const label=host.ownerDocument.createElement('span');label.dataset.examKingdom='';label.textContent=names[n]+' · ';heading.prepend(label);added.push(label);
    }return ()=>added.forEach(n=>n.remove());
  }
  // Explicitly audited opening terms only; never annotate unverified prose or quiz inputs.
  function openingPlainTerms(host,era,source){
    if(era!=='opening'||source!==opening)return ()=>{};
    const allowed={89:["병인박해","병인양요","신미양요"],91:["조계","거중조정","조미수호통상조약","조미 수호 통상 조약"],93:["중립화론"],106:["조선 중립화론","중립화론"],96:["아관파천"],99:["을사늑약","정미7조약","정미 7조약","신민회","보안회","대한자강회","황국중앙총상회"]};
    const undo=[],doc=host.ownerDocument,walker=doc.createTreeWalker(host,4),nodes=[];
    let node;while((node=walker.nextNode()))nodes.push(node);
    for(const n of nodes){
      const p=n.parentElement,page=p?.closest('[data-page]');
      if(!page||!allowed[page.dataset.page]||p.closest('a,button,input,textarea,select,script,style,[role="button"],[data-history-source-emphasis],.history81-term,[data-layout-label]'))continue;
      const alternatives=allowed[page.dataset.page].slice().sort((a,b)=>b.length-a.length).map(t=>t.replace(/ /g,'\\s*')).join('|');
      const re=new RegExp('(?<![\\p{L}\\p{N}_])(?:'+alternatives+')(?![\\p{L}\\p{N}_])','gu'),hits=[...n.data.matchAll(re)];if(!hits.length)continue;
      const wrap=doc.createElement('span');wrap.style.display='contents';let at=0;
      for(const hit of hits){wrap.append(doc.createTextNode(n.data.slice(at,hit.index)));const mark=doc.createElement('span');mark.dataset.historySourceEmphasis='';mark.textContent=hit[0];wrap.append(mark);at=hit.index+hit[0].length;}
      wrap.append(doc.createTextNode(n.data.slice(at)));n.replaceWith(wrap);undo.push(()=>{if(wrap.parentNode)wrap.replaceWith(n);});
    }
    return ()=>undo.reverse().forEach(fn=>fn());
  }
  function mount(host,era,source){
    const verified=data();if(!root.HanqHistory81Terms||!ids[era]||verified.sources[era]!==source)return {count:0,stop(){}};
    const restoreMnemonic=removeDismissedMnemonic(host,era,source);
    const restorePlain=openingPlainTerms(host,era,source);
    const restore=prepare(host,verified.entries.filter(e=>e.era===era));
    verified.boundaryPrepared=true;
    let terms;try{terms=root.HanqHistory81Terms.mount(host,era,source,verified);}catch(e){restore();restorePlain();restoreMnemonic();throw e;}
    const removeCapitalLabels=capitalLabels(host,era,source),removeExamLabels=examLabels(host,era,source);
    let stopped=false;return {count:terms.count,stop(){if(stopped)return;stopped=true;removeExamLabels();removeCapitalLabels();terms.stop();restore();restorePlain();restoreMnemonic();}};
  }
  root.HanqHistory81Glossary={mount,pageEra,data};
})(typeof window==='object'?window:globalThis);
