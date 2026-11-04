(function (root) {
  'use strict';
  // A data-injected reader. No endpoint, credentials, storage, grading or release-gate overrides.
  const colors = new Set(['#0070a3','#ff0000','#808080','#bfbfbf','#9b9ba8','#289b6e','#ed7d31','#000000','#ffff00']);
  function inline(doc, target, text) {
    const tokens = /(<\/?(?:span|strong|u|br)\b[^>]*>|\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\))/gi;
    let cursor=0, current=target; const stack=[];
    for (const m of text.matchAll(tokens)) {
      current.append(doc.createTextNode(text.slice(cursor,m.index))); cursor=m.index+m[0].length;
      if (m[2] || m[3]) { const e=doc.createElement(m[2]?'strong':'em'); inline(doc,e,m[2]||m[3]); current.append(e); }
      else if(m[4]) { // Preserve labels; do not auto-link private sources to public delivery URLs.
        const e=doc.createElement('span'); e.textContent=m[4]; current.append(e);
      } else {
        const tag=/^<\/?(\w+)/.exec(m[0])[1].toLowerCase();
        if(/^<\//.test(m[0])) { if(stack.length && stack[stack.length-1].tag===tag) current=stack.pop().parent; else current.append(doc.createTextNode(m[0])); }
        else if(/^<br\s*\/?\s*>$/i.test(m[0])) current.append(doc.createElement('br'));
        else if(/^(strong|u)$/.test(tag) && new RegExp('^<'+tag+'\\s*>$','i').test(m[0])) {
          const e=doc.createElement(tag);current.append(e);stack.push({tag,parent:current});current=e;
        } else if(tag==='span') {
          const match=/^<span\s+style="color:(#[0-9a-f]{6})"\s*>$/i.exec(m[0]);
          if(match && colors.has(match[1].toLowerCase())) {
            const e=doc.createElement('span'); e.dataset.sourceColor=match[1].toLowerCase();
            // Grey ink remains distinct while retaining readable contrast on paper.
            e.style.color=['#bfbfbf','#9b9ba8','#808080'].includes(match[1].toLowerCase())?'#626872':match[1];
            current.append(e);stack.push({tag,parent:current});current=e;
          } else current.append(doc.createTextNode(m[0]));
        } else current.append(doc.createTextNode(m[0]));
      }
    }
    current.append(doc.createTextNode(text.slice(cursor)));
  }
  function renderMarkdown(doc, host, markdown, figure) {
    const lines=markdown.split('\n'); let i=0;
    while(i<lines.length) {
      const line=lines[i]; if(!line.trim()){i++;continue;}
      let m;
      if((m=/^!\[([^\]]*)\]\((p\d{3}-\d{2}\.png)\)$/.exec(line))) {figure(host,m[2],m[1]);i++;continue;}
      if((m=/^(#{1,6}) (.*)$/.exec(line))) {const e=doc.createElement('h'+Math.min(5,Math.max(2,m[1].length-1)));inline(doc,e,m[2]);host.append(e);i++;continue;}
      if(/^\|/.test(line) && /^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(lines[i+1]||'')) {
        const wrap=doc.createElement('div');wrap.className='jsr-table';wrap.tabIndex=0;wrap.setAttribute('role','region');wrap.setAttribute('aria-label','원문 비교표, 가로 스크롤');
        const table=doc.createElement('table');let first=true;
        while(i<lines.length && /^\|/.test(lines[i])) {
          const row=lines[i++]; if(/^\|(?:\s*:?-+:?\s*\|)+\s*$/.test(row))continue;
          const tr=doc.createElement('tr');row.replace(/^\||\|\s*$/g,'').split('|').forEach(c=>{const td=doc.createElement(first?'th':'td');if(first)td.scope='col';inline(doc,td,c.trim());tr.append(td);});table.append(tr);first=false;
        }
        wrap.append(table);host.append(wrap);continue;
      }
      if(/^\s*[-+] /.test(line)) {
        const ul=doc.createElement('ul'),levels=[{indent:/^\s*/.exec(line)[0].length,list:ul,last:null}];
        while(i<lines.length && /^\s*[-+] /.test(lines[i])){
          const item=/^(\s*)[-+] (.*)$/.exec(lines[i++]),indent=item[1].length;
          while(levels.length>1&&indent<levels[levels.length-1].indent)levels.pop();
          let level=levels[levels.length-1];
          if(indent>level.indent&&level.last){const child=doc.createElement('ul');level.last.append(child);level={indent,list:child,last:null};levels.push(level);}
          const li=doc.createElement('li');inline(doc,li,item[2]);level.list.append(li);level.last=li;
        }
        host.append(ul);continue;
      }
      const p=doc.createElement('p'), parts=[];
      while(i<lines.length && lines[i].trim() && (!parts.length || !/^(#{1,6} |!\[|\s*[-+] |\|)/.test(lines[i])))parts.push(lines[i++]);
      inline(doc,p,parts.join('\n'));p.style.whiteSpace='pre-wrap';host.append(p);
    }
  }
  function mount(host,bundle,options) {
    options=options||{};const doc=host.ownerDocument,win=doc.defaultView;
    if(!bundle || bundle.schema!=='hanq-joseon-script/1' || !/^[a-f0-9]{64}$/.test(bundle.source.sha256) || !Array.isArray(bundle.segments) || !Array.isArray(bundle.topics))throw Error('Invalid private study bundle');
    if(bundle.segments.some(s=>!['study','practice','answers','metadata'].includes(s.kind)||typeof s.markdown!=='string'))throw Error('Invalid source segments');
    const initialTopic=bundle.topics.some(t=>t.id===options.initialTopic)?options.initialTopic:'early';
    let alive=true,epoch=0,topic=initialTopic,mode='study',dialog=null;const urls=new Set(),drafts=new Map();
    const shell=doc.createElement('section');shell.className='joseon-script-reader';host.replaceChildren(shell);
    function el(tag,text,cls){const e=doc.createElement(tag);if(text)e.textContent=text;if(cls)e.className=cls;return e;}
    function button(text,fn){const e=el('button',text);e.type='button';e.onclick=fn;return e;}
    const header=el('header',null,'jsr-header');header.append(el('p','HISTORY / JOSEON','jsr-eyebrow'),el('h1','조선, 흐름을 따라 읽기'),el('p','왕의 흐름에서 제도와 생활, 문화까지. 주제를 골라 차근차근 읽어 보세요.'));
    const nav=el('nav',null,'jsr-topics');nav.setAttribute('aria-label','조선 학습 주제');
    bundle.topics.forEach(t=>{const b=button(t.title,()=>navigate(t.id,'study'));b.dataset.topic=t.id;nav.append(b);});header.append(nav);
    const modes=el('nav',null,'jsr-modes');modes.setAttribute('aria-label','자료 구분');
    [['study','본문 읽기'],['practice','빈칸 문제'],['answers','인쇄 정답']].forEach(([id,title])=>{const b=button(title,()=>navigate(topic,id));b.dataset.mode=id;modes.append(b);});header.append(modes);shell.append(header);
    const layout=el('div',null,'jsr-layout'),toc=el('nav',null,'jsr-toc'),body=el('main',null,'jsr-body');toc.setAttribute('aria-label','현재 주제 목차');layout.append(toc,body);shell.append(layout);
    function dismissImage(){if(!dialog)return;const d=dialog;dialog=null;if(d.node.open)d.node.close();d.node.remove();if(d.release)d.release();if(d.opener.isConnected)d.opener.focus();}
    function closeImage(){if(win.history.state&&win.history.state.joseonImage){win.history.back();}else dismissImage();}
    function showImage(src,alt,opener){dismissImage();const d=el('dialog',null,'jsr-image-dialog');d.setAttribute('aria-label',alt);const close=button('이미지 닫기',closeImage),img=el('img');let zoomed=false;
      const zoom=button('원래 크기로 확대',()=>{zoomed=!zoomed;img.style.maxWidth=zoomed?'none':'100%';zoom.textContent=zoomed?'화면 너비에 맞추기':'원래 크기로 확대';});
      img.src=src;img.alt=alt;d.append(close,zoom,img);doc.body.append(d);dialog={node:d,opener,release:options.acquireModalLock&&options.acquireModalLock()};win.history.pushState(Object.assign({},win.history.state,{joseonImage:true}),'');d.addEventListener('cancel',e=>{e.preventDefault();closeImage();});d.addEventListener('close',()=>{if(dialog&&dialog.node===d)dismissImage();});d.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();(doc.activeElement===close?zoom:close).focus();}});try{d.showModal();close.focus();}catch(e){dismissImage();throw e;}}
    let figureAbort=null,figureQueue=[],figureActive=0;
    function clearImages(){if(figureAbort)figureAbort.abort();figureAbort=new win.AbortController();figureQueue.splice(0).forEach(job=>job.reject(Error('aborted')));dismissImage();urls.forEach(u=>win.URL.revokeObjectURL(u));urls.clear();}
    function pumpFigures(){while(figureActive<2&&figureQueue.length){const job=figureQueue.shift();if(job.signal.aborted){job.reject(Error('aborted'));continue;}figureActive++;Promise.resolve().then(()=>{if(job.signal.aborted)throw Error('aborted');return options.loadFigure(job.name,{signal:job.signal});}).then(job.resolve,job.reject).finally(()=>{figureActive--;pumpFigures();});}}
    function loadFigure(name,signal){return new Promise((resolve,reject)=>{figureQueue.push({name,signal,resolve,reject});pumpFigures();});}
    function figure(parent,name,alt){
      const f=el('figure'),caption=el('figcaption',alt);parent.append(f);f.append(caption);
      if(!bundle.figures.includes(name) || !options.loadFigure){f.append(el('p','이 그림은 비공개 자료 연결 후 볼 수 있습니다.','jsr-image-status'));return;}
      const generation=epoch,signal=figureAbort.signal;const status=el('p','', 'jsr-image-status');status.setAttribute('role','status');f.append(status);
      const retry=button('그림 다시 불러오기',attempt);retry.className='jsr-image-retry';retry.hidden=true;f.append(retry);
      let pending=false;
      function current(){return alive&&generation===epoch&&!signal.aborted;}
      async function attempt(){
        if(pending||!current())return;pending=true;retry.hidden=true;status.textContent='그림 불러오는 중…';delete f.dataset.error;
        let url=null,b=null,stage='image_unavailable';
        try{
          const blob=await loadFigure(name,signal);if(!current())return;
          // Native Blob validation works across realms; integrity is checked by the transport.
          try{win.Blob.prototype.slice.call(blob,0,0);}catch(_){throw Error('image_blob');}
          if(blob.type!=='image/png')throw Error('image_mime');
          stage='image_url';url=win.URL.createObjectURL(blob);urls.add(url);stage='image_dom';b=button('',()=>showImage(url,alt,b));const img=el('img');img.alt=alt;
          await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('image_decode'));img.src=url;});
          if(!current())return;
          if(img.naturalWidth<=240&&img.naturalHeight<=120)f.classList.add('jsr-small-figure');
          b.setAttribute('aria-label',alt+' 확대');b.append(img);f.prepend(b);status.textContent='';
        }catch(error){
          if(url){win.URL.revokeObjectURL(url);urls.delete(url);}if(!current())return;
          const code=error&& (error.code||error.message),known=['timeout','network','aborted','session_changed','invalid_private_response','script_integrity_unavailable','script_figure_mime','script_figure_size','script_figure_digest','image_blob','image_mime','image_decode'];
          f.dataset.error=known.includes(code)?code:error&&Number.isInteger(error.status)&&error.status>=400&&error.status<=599?'http_'+error.status:stage;
          status.textContent=code==='timeout'?'그림 전송 시간이 초과되었습니다.':code==='image_decode'?'그림을 표시하지 못했습니다.':'그림을 불러오지 못했습니다.';retry.hidden=false;
        }finally{pending=false;}
      }
      attempt();
    }
    function selected(s,t){
      if(mode==='answers'||mode==='practice')return s.kind===mode; // Source groups retained; no invented canonical question mapping.
      if(s.kind!=='study' || s.page<t.from || s.page>t.to)return false;
      return true;
    }
    function render(){epoch++;clearImages();body.replaceChildren();toc.replaceChildren();
      nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.topic===topic)));
      modes.querySelectorAll('button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.mode===mode)));
      const t=bundle.topics.find(t=>t.id===topic)||bundle.topics[0];topic=t.id;
      body.append(el('h2',mode==='study'?t.title:mode==='practice'?'조선 빈칸 문제':'조선 인쇄 정답'));
      if(mode==='answers'){
        const notice=el('section',null,'jsr-reveal');notice.append(el('p','원문에 인쇄된 정답입니다. 먼저 문제를 풀어 본 뒤 확인하세요.'));
        notice.append(button('인쇄 정답 펼치기',()=>{notice.remove();renderSegments(t);}));body.append(notice);return;
      }
      if(mode==='practice')body.append(el('p','빈칸을 생각한 뒤 임시 답안을 적어 보세요. 화면을 닫으면 답안은 사라지며 기존 학습 기록에는 저장되지 않습니다.','jsr-note'));
      renderSegments(t);
    }
    function renderSegments(t){bundle.segments.filter(s=>selected(s,t)).forEach(s=>{
      const article=el('article',null,'jsr-source-card');article.id=s.id;article.dataset.kind=s.kind;
      article.append(el('p',s.page?'PDF '+s.page+'쪽 · 인쇄 '+(s.page-7)+'쪽':'원문 안내','jsr-source-label'));renderMarkdown(doc,article,s.markdown,figure);body.append(article);
      if(mode==='practice')Array.from(article.querySelectorAll('p')).forEach((p,i)=>{const m=/^\((\d+)\) /.exec(p.textContent);if(!m)return;const key=s.id+'-'+i,label=el('label','나의 임시 답안 · '+m[1]+'번','jsr-draft'),input=el('textarea');input.rows=2;input.value=drafts.get(key)||'';input.setAttribute('aria-label','PDF '+s.page+'쪽 '+m[1]+'번 임시 답안');input.oninput=()=>drafts.set(key,input.value);label.append(input);p.after(label);});
      const provenance=el('details',null,'jsr-provenance');provenance.append(el('summary','원문 페이지 정보'));
      Array.from(article.querySelectorAll('p')).filter(e=>/^PDF \d+쪽\(인쇄 \d+쪽\), (?:배치에 따른 설명|원문 캡션)\. 아래 이미지 목록에 원문 배치 좌표를 기록했습니다\.$/.test(e.textContent)).forEach(e=>provenance.append(e));
      article.querySelectorAll('figure').forEach(f=>{const p=f.previousElementSibling,c=f.querySelector('figcaption');if(p&&p.tagName==='P'&&p.children.length===1&&p.firstElementChild.tagName==='STRONG'&&c.textContent===p.textContent+' · PDF '+s.page+'쪽')provenance.append(p);});
      Array.from(article.children).filter(e=>e.tagName==='H2'&&/^PDF \d+쪽$/.test(e.textContent)||e.tagName==='P'&&/^원문 (머리말|인쇄 쪽수|바닥글):/.test(e.textContent)).forEach(e=>provenance.append(e));
      if(provenance.children.length>1)article.append(provenance);
      const group=el('details'),title=article.querySelector('h3,h4'),summary=el('summary',(title?title.textContent:'학습 안내')+' · '+s.page);group.append(summary);toc.append(group);
      const headings=Array.from(article.querySelectorAll('h3,h4'));
      (headings.length?headings:[article]).forEach((heading,index)=>{heading.id=s.id+'-section-'+index;const a=el('button',heading===article?'이 쪽 읽기':heading.textContent);a.type='button';a.onclick=()=>{heading.tabIndex=-1;heading.focus({preventScroll:true});heading.scrollIntoView({block:'start'});};group.append(a);});
    });}
    function navigate(nextTopic,nextMode){topic=nextTopic;mode=nextMode;const state={source:bundle.source.sha256,topic,mode};win.history.pushState(Object.assign({},win.history.state,{joseonScript:state}),'');render();}
    function pop(){if(dialog&&!(win.history.state&&win.history.state.joseonImage)){dismissImage();return;}dismissImage();const s=win.history.state&&win.history.state.joseonScript;if(s&&s.source===bundle.source.sha256&&bundle.topics.some(t=>t.id===s.topic)&&['study','practice','answers'].includes(s.mode)){topic=s.topic;mode=s.mode;}else{topic=initialTopic;mode='study';}render();}
    if(!options.externalNavigation)win.addEventListener('popstate',pop);pop();
    return {handlePopState(){if(!alive)return false;pop();return true;},stop(){alive=false;epoch++;clearImages();drafts.clear();win.removeEventListener('popstate',pop);shell.remove();}};
  }
  root.HanqJoseonScriptReader={mount,inline,renderMarkdown};
  if(typeof module==='object'&&module.exports)module.exports=root.HanqJoseonScriptReader;
})(typeof window==='object'?window:globalThis);
