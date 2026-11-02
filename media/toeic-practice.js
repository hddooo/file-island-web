/* Original demonstration content only. No official TOEIC question corpus. */
(function (root) {
  'use strict';
  var SOURCE = 'HanQ 자체 제작 데모 · 공식 TOEIC 기출 아님';
  function q(id, prompt, choices, answer, explanation) { return { id:id, version:'1', prompt:prompt, options:choices.map(function (text,i) { return {id:['a','b','c','d'][i],text:text}; }), answerId:answer, explanation:explanation }; }
  var DEMO = [
    { id:'demo-p5-001', part:5, source:SOURCE, passage:'', questions:[q('demo-p5-q1','The revised schedule will be _____ to all team members tomorrow.',['distributed','distribute','distributing','distribution'],'a','일정은 배포되는 대상이므로 will be 뒤에 과거분사 distributed를 쓰는 수동태가 맞습니다. distribute는 동사원형, distributing은 현재분사, distribution은 명사입니다.')] },
    { id:'demo-p6-001', part:6, source:SOURCE, passage:'To: All staff\nSubject: Library renovation\n\nThe office library will be closed on Friday while new shelves are installed. Please return borrowed books by Thursday. [1] reception desk will accept book returns during the closure. [2] The library will reopen on Monday morning.', questions:[q('demo-p6-q1','[1]에 들어갈 알맞은 말을 고르세요.',['Them','The','They','Theirs'],'b','reception desk라는 명사 앞에는 관사 The가 필요합니다. Them은 목적격 대명사, They는 주격 대명사, Theirs는 독립적인 소유대명사이므로 이 자리에 쓸 수 없습니다.'),q('demo-p6-q2','[2]에 들어갈 가장 자연스러운 문장을 고르세요.',['The desk will accept returns throughout Friday.','The library has canceled all future renovations.','Employees must buy their own shelves.','The office will move to another city.'],'a','앞 문장의 reception desk에서 반납을 받는다는 안내를 금요일 운영 시간으로 구체화합니다. 나머지는 지문의 안내와 연결되지 않습니다.')] },
    { id:'demo-p7-001', part:7, source:SOURCE, passage:'RIVERBEND COMMUNITY CENTER\nWeekend photography workshop\n\nJoin instructor Maya Chen on Saturday, June 12, from 10 a.m. to noon. Beginners are welcome. Bring a camera or a smartphone. The fee includes a printed workbook. Registration closes on June 9. To reserve a place, email workshops@example.org. The session will take place in Room 204.', questions:[q('demo-p7-q1','What is included in the workshop fee?',['A camera','Lunch','A printed workbook','A parking pass'],'c','“The fee includes a printed workbook.”에 근거하여 인쇄된 워크북이 포함됩니다.'),q('demo-p7-q2','How can someone reserve a place?',['By calling the instructor','By sending an email','By visiting Room 204 on June 9','By buying a camera'],'b','“To reserve a place, email …”이 예약 방법의 직접적인 근거입니다. June 9는 등록 마감일이고 Room 204는 수업 장소입니다.')] }
  ];
  var memory = Object.create(null), pendingMemory = Object.create(null), active = null;
  function validate(data) {
    if (!Array.isArray(data)) throw new Error('문항 데이터는 배열이어야 합니다.');
    var ids = new Set(), groups = new Set();
    data.forEach(function(g) {
      if (!g || typeof g.id !== 'string' || !g.id || groups.has(g.id) || [5,6,7].indexOf(g.part)<0 || typeof g.source !== 'string' || !g.source.trim() || typeof g.passage !== 'string' || !Array.isArray(g.questions) || !g.questions.length || (g.part===5 && g.questions.length!==1) || (g.part!==5 && !g.passage.trim())) throw new Error('문항 그룹 형식이 올바르지 않습니다.');
      groups.add(g.id);
      g.questions.forEach(function(x) {
        if (!x || typeof x.id!=='string' || !x.id || ids.has(x.id) || typeof x.version!=='string' || !x.version || typeof x.prompt!=='string' || !x.prompt.trim() || typeof x.explanation!=='string' || !x.explanation.trim() || !Array.isArray(x.options) || x.options.length!==4) throw new Error('문항 형식이 올바르지 않습니다.');
        ids.add(x.id); var opts = new Set(), texts = new Set();
        x.options.forEach(function(o) { if (!o || typeof o.id!=='string' || !o.id || opts.has(o.id) || typeof o.text!=='string' || !o.text.trim() || texts.has(o.text.trim().toLowerCase())) throw new Error('선택지 형식이 올바르지 않습니다.'); opts.add(o.id); texts.add(o.text.trim().toLowerCase()); });
        if (!opts.has(x.answerId)) throw new Error('정답 선택지 ID가 없습니다.');
      });
    });
    return JSON.parse(JSON.stringify(data));
  }
  function create(options) {
    options = options || {};
    var doc = options.document || root.document, api = options.api === undefined ? root.HanqApi : options.api;
    var storage = options.storage;
    if (storage === undefined) try { storage = root.localStorage; } catch (_) { storage = null; }
    var host, data=[], part, mode='all', index=0, selections=Object.create(null), graded=false, records=Object.create(null), key='', session='', unsubscribe, notice='', stopped=true;
    function identity() {
      var s; try { s=api && api.state(); } catch (_) {}
      var owner=s && s.signedIn && !s.restoring && s.ownerId!=null ? 'owner:'+encodeURIComponent(String(s.ownerId)) : 'guest';
      return {owner:owner,session:owner+':'+String(s && s.epoch || 0)};
    }
    function rid(x) { return JSON.stringify([x.id,x.version]); }
    function load() {
      records=Object.create(null); notice=''; var raw;
      try { raw=storage && storage.getItem(key); } catch (_) { notice='저장소를 사용할 수 없어 이 탭에서만 기록합니다.'; }
      if (!storage) notice='저장소를 사용할 수 없어 이 탭에서만 기록합니다.';
      if ((!raw || pendingMemory[key]) && memory[key]) raw=memory[key];
      try {
        var parsed=raw && JSON.parse(raw);
        if (parsed && parsed.schema===1 && parsed.subject==='TOEIC' && parsed.records && typeof parsed.records==='object') {
          data.forEach(function(g) { g.questions.forEach(function(x) {
            var r=parsed.records[rid(x)];
            if (r && typeof r.star==='boolean' && Number.isSafeInteger(r.attempts) && r.attempts>=0 && (r.lastOptionId===null || x.options.some(function(o) {return o.id===r.lastOptionId;}))) records[rid(x)]={star:r.star,attempts:r.attempts,lastOptionId:r.lastOptionId,wrong:r.attempts>0 && r.lastOptionId!==x.answerId};
          }); });
        } else if (raw) notice='저장된 기록 형식을 읽을 수 없어 새 기록으로 시작합니다.';
      } catch (_) { notice='저장된 기록을 읽을 수 없어 새 기록으로 시작합니다.'; }
    }
    function save() {
      var value=JSON.stringify({schema:1,subject:'TOEIC',records:records}); memory[key]=value;
      try { if (!storage) throw new Error('blocked'); storage.setItem(key,value); delete pendingMemory[key]; } catch (_) { pendingMemory[key]=true; notice='저장소를 사용할 수 없어 이 탭에서만 기록합니다.'; }
    }
    function record(x) { return records[rid(x)] || {star:false,attempts:0,lastOptionId:null,wrong:false}; }
    function pool() { return data.filter(function(g) { return g.part===part && (mode==='all' || g.questions.some(function(x) { return record(x)[mode==='wrong'?'wrong':'star']; })); }); }
    // Keep the active group after grading changes review eligibility.
    var run=[];
    function resetRun() { run=pool(); index=0; selections=Object.create(null); graded=false; }
    function guard() {
      if (stopped) return false;
      var id=identity();
      if (id.session!==session) { session=id.session; key='hanq:toeic-practice:v1:'+id.owner; load(); resetRun(); render(); return false; }
      return true;
    }
    function el(tag,text,attrs) { var n=doc.createElement(tag); if (text) n.textContent=text; Object.keys(attrs||{}).forEach(function(k) { n.setAttribute(k,attrs[k]); }); return n; }
    function button(text,fn,disabled,attrs) { var b=el('button',text,Object.assign({type:'button'},attrs||{})); b.disabled=!!disabled; b.addEventListener('click',fn); return b; }
    function select(qid,oid) {
      if (!guard() || graded) return false;
      var x=run[index] && run[index].questions.find(function(q) {return q.id===qid;});
      if (!x || !x.options.some(function(o) {return o.id===oid;})) return false;
      selections[qid]=oid; render(); return true;
    }
    function grade() {
      if (!guard() || graded || !run[index] || !run[index].questions.every(function(x) {return selections[x.id];})) return false;
      run[index].questions.forEach(function(x) { var r=record(x); records[rid(x)]={star:r.star,attempts:r.attempts+1,lastOptionId:selections[x.id],wrong:selections[x.id]!==x.answerId}; });
      graded=true; save(); render(); return true;
    }
    function star(qid) {
      if (!guard()) return false;
      var x=run[index] && run[index].questions.find(function(q) {return q.id===qid;}); if (!x) return false;
      var r=record(x); r.star=!r.star; records[rid(x)]=r; save(); render(); return true;
    }
    function setMode(v) { if (!guard() || ['all','wrong','star'].indexOf(v)<0) return false; mode=v; resetRun(); render(); return true; }
    function next() { if (!guard() || !graded || index>=run.length-1) return false; index++; selections=Object.create(null); graded=false; render(); return true; }
    function retry() { if (!guard() || !run[index] || !graded) return false; selections=Object.create(null); graded=false; render(); return true; }
    function render() { if(root.HanqStudyTransition)return root.HanqStudyTransition.update(host,renderContent);return renderContent(); }
    function renderContent() {
      if (!host) return; host.replaceChildren(); host.classList.add('toeic-practice');
      host.appendChild(el('h2','TOEIC RC · Part '+part));
      host.appendChild(el('p','공식 기출 문제는 아직 등록되지 않았습니다. 기본 문항은 기능 체험용 자체 제작 데모입니다.',{class:'toeic-source'}));
      host.appendChild(el('p',(key.indexOf(':owner:')>=0?'현재 계정':'게스트')+' · 이 기기 TOEIC 전용 기록 (서버 동기화 없음)'));
      var nav=el('nav','',{'aria-label':'TOEIC 복습 종류'});
      [['all','전체'],['wrong','오답'],['star','별표']].forEach(function(v) { nav.appendChild(button(v[1],function(){setMode(v[0]);},false,{'aria-pressed':String(mode===v[0])})); }); host.appendChild(nav);
      var current=run[index];
      if (!current) { host.appendChild(el('p',mode==='all'?'등록된 문항이 없습니다. 사용 허가된 문항을 등록한 뒤 학습할 수 있습니다.':'해당 복습 문항이 없습니다. 문항 풀이 또는 별표 표시 후 다시 선택하세요.',{role:'status'})); }
      else {
        host.appendChild(el('p',(index+1)+' / '+run.length+' 세트 · '+current.source));
        if (current.passage) { var passage=el('section','',{'aria-label':'공통 지문',class:'toeic-passage'}); passage.appendChild(el('h3','공통 지문')); if(current.part===7&&root.HanqLearningReader)root.HanqLearningReader.passage(passage,current.passage);else passage.appendChild(el('p',current.passage)); host.appendChild(passage); }
        current.questions.forEach(function(x,i) {
          var box=el('fieldset','',{class:'toeic-question'}); box.appendChild(el('legend',(i+1)+'. '+x.prompt));
          box.appendChild(button(record(x).star?'★ 별표 해제':'☆ 별표',function(){star(x.id);},false,{'aria-pressed':String(record(x).star),'data-star':x.id}));
          var opts=el('div','',{class:'toeic-options',role:'group','aria-label':'선택지'});
          x.options.forEach(function(o,j) { opts.appendChild(button(['A','B','C','D'][j]+'. '+o.text,function(){select(x.id,o.id);},graded,{'aria-pressed':String(selections[x.id]===o.id),'data-option':o.id,'data-question':x.id})); }); box.appendChild(opts);
          if (graded) {
            var answer=x.options.find(function(o){return o.id===x.answerId;});
            box.appendChild(el('p',(selections[x.id]===x.answerId?'정답':'오답')+' · 정답: '+['A','B','C','D'][x.options.indexOf(answer)]+'. '+answer.text,{class:'toeic-result'}));
            box.appendChild(el('p',x.explanation,{class:'toeic-explanation'}));
          }
          host.appendChild(box);
        });
        var controls=el('div','',{class:'toeic-controls'});
        controls.appendChild(button('채점하고 해설 보기',grade,graded || !current.questions.every(function(x){return selections[x.id];}),{'data-action':'grade'}));
        if (graded) { controls.appendChild(button('이 세트 다시 풀기',retry,false,{'data-action':'retry'})); controls.appendChild(button('다음 세트',next,index>=run.length-1,{'data-action':'next'})); }
        host.appendChild(controls);
        host.appendChild(el('p',graded?'채점 완료. 다음 이동과 다시 풀기는 직접 선택합니다.':'모든 답을 고른 뒤 채점을 눌러 주세요. 자동 채점·자동 이동은 없습니다.',{role:'status','aria-live':'polite'}));
      }
      if (notice) host.appendChild(el('p',notice,{role:'status'}));
    }
    function stop() { stopped=true; if (unsubscribe) unsubscribe(); unsubscribe=null; if(host){host.replaceChildren();host.classList.remove('toeic-practice');} host=null; }
    function mount(target,opts) {
      stop(); opts=opts||{}; if (!target || [5,6,7].indexOf(opts.part)<0) throw new Error('host와 part 5, 6, 7이 필요합니다.');
      host=target; part=opts.part; mode='all';
      try { data=validate(opts.dataset===undefined?DEMO:opts.dataset); } catch(e) { host.appendChild(el('p','문항을 불러올 수 없습니다: '+e.message,{role:'alert'})); return controller; }
      stopped=false; var id=identity(); session=id.session; key='hanq:toeic-practice:v1:'+id.owner; load(); resetRun(); render();
      if (api && typeof api.onChange==='function') unsubscribe=api.onChange(function(){guard();});
      return controller;
    }
    var controller={mount:mount,stop:stop,select:select,grade:grade,star:star,setMode:setMode,next:next,retry:retry,snapshot:function(){return JSON.parse(JSON.stringify({part:part,mode:mode,index:index,groupIds:run.map(function(g){return g.id;}),current:run[index]||null,selections:selections,graded:graded,records:records,storageKey:key,notice:notice}));}};
    return controller;
  }
  var exported={create:create,validate:validate,demo:JSON.parse(JSON.stringify(DEMO)),mount:function(host,options){if(active)active.stop();active=create();return active.mount(host,options);},stop:function(){if(active)active.stop();active=null;}};
  if (typeof module!=='undefined' && module.exports) module.exports=exported;
  root.HanqToeicPractice=exported;
})(typeof window!=='undefined'?window:globalThis);
