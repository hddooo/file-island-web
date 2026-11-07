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
  function mount(host,era,source){
    const verified=data();if(!root.HanqHistory81Terms||!ids[era]||verified.sources[era]!==source)return {count:0,stop(){}};
    const restore=prepare(host,verified.entries.filter(e=>e.era===era));
    verified.boundaryPrepared=true;
    let terms;try{terms=root.HanqHistory81Terms.mount(host,era,source,verified);}catch(e){restore();throw e;}
    let stopped=false;return {count:terms.count,stop(){if(stopped)return;stopped=true;terms.stop();restore();}};
  }
  root.HanqHistory81Glossary={mount,pageEra,data};
})(typeof window==='object'?window:globalThis);
