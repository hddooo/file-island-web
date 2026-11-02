/* Browser-wide display preference only. Never stores account IDs or learning data. */
(function (root) {
  'use strict';
  var doc=root.document, KEY='hanq:display-mode:v1', mode='default';
  try { mode=root.localStorage.getItem(KEY)==='terminal'?'terminal':'default'; } catch (_) {}
  function apply(value) {
    mode='terminal';doc.documentElement.dataset.hanqTheme=mode;
    var meta=doc.querySelector('meta[name="theme-color"]');if(meta)meta.content=mode==='terminal'?'#050706':'#f7f5f0';
    doc.querySelectorAll('[data-company-mode]').forEach(function(button){button.textContent=mode==='terminal'?'블랙 모드 끄기':'블랙 모드 켜기';button.setAttribute('aria-pressed',String(mode==='terminal'));});
  }
  function select(value) {
    apply(value);var saved=true;try{root.localStorage.setItem(KEY,mode);}catch(_){saved=false;}
    var status=doc.querySelector('[data-company-status]');
    if(status)status.textContent=saved?(mode==='terminal'?'블랙 모드를 켰어요.':'기본 모드로 돌아왔어요.'):'이 브라우저에는 선택을 저장할 수 없어 이번 화면에만 적용해요.';
    return saved;
  }
  function html(){return ''; }
  doc.addEventListener('click',function(event){if(event.target.closest&&event.target.closest('[data-company-mode]'))select(mode==='terminal'?'default':'terminal');});
  root.addEventListener('storage',function(event){if(event.key===KEY)apply(event.newValue);});
  apply(mode);
  root.HanqDisplayMode={select:select,current:function(){return mode;},html:html};
})(window);
