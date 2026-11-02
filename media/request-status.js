/* Shared request feedback. Does not handle credentials or automatically repeat writes. */
(function (root) {
  'use strict';
  var api = root.HanqApi, doc = root.document;
  if (!api || !doc || !api.onActivity) return;
  var pending = new Map(), timer = null, dismissed = false, focus = null, releaseLock = null, owner = api.state().signedIn ? api.state().ownerId : null;
  var panel = doc.createElement('aside'); panel.className = 'request-notice'; panel.hidden = true;
  panel.setAttribute('aria-label', '연결 상태');
  panel.innerHTML = '<p role="status" aria-live="polite" aria-atomic="true"></p><button type="button" data-retry-connection>다시 연결하기</button><button type="button" data-close-connection>닫기</button>';
  var text = panel.querySelector('p'), retry = panel.querySelector('[data-retry-connection]');panel.querySelector('[data-close-connection]').onclick=function(){panel.hidden=true;};
  var overlay = doc.createElement('div'); overlay.className = 'request-wait'; overlay.hidden = true;
  overlay.setAttribute('role', 'dialog'); overlay.setAttribute('aria-modal', 'true'); overlay.setAttribute('aria-labelledby', 'requestWaitText');
  overlay.innerHTML = '<section aria-labelledby="requestWaitText"><span class="hanq-mascot hanq-mascot--agumon" aria-hidden="true"></span><p id="requestWaitText" role="status" aria-live="polite"></p><small>화면으로 돌아가도 요청은 계속 처리돼요.</small><button type="button">화면으로 돌아가기</button></section>';
  doc.body.appendChild(panel); doc.body.appendChild(overlay);
  var label = overlay.querySelector('p'), close = overlay.querySelector('button');
  function shell() { return doc.querySelector('main.shell'); }
  function hide() {
    if (timer) { clearTimeout(timer); timer = null; }
    overlay.hidden = true; var app = shell();
    if (releaseLock) { releaseLock(); releaseLock = null; }
    if (app) { app.classList.remove('request-dimmed'); app.removeAttribute('aria-busy'); }
    if (overlay.contains(doc.activeElement) && focus && focus.isConnected && !focus.disabled) focus.focus({preventScroll: true});
    focus = null;
  }
  function show() {
    timer = null; if (!pending.size || dismissed) return;
    var item = Array.from(pending.values())[0]; label.textContent = item.label;
    if (!overlay.hidden) return;
    focus = doc.activeElement; var app = shell();
    if (app) { releaseLock = root.HanqUiLocks.acquire(app); app.classList.add('request-dimmed'); app.setAttribute('aria-busy', 'true'); }
    overlay.hidden = false; close.focus({preventScroll: true});
  }
  close.onclick = function () { dismissed = true; hide(); };
  overlay.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') { event.preventDefault(); close.click(); }
    if (event.key === 'Tab') { event.preventDefault(); close.focus(); }
  });
  api.onActivity(function (event) {
    if (event.pending && event.foreground) pending.set(event.id, event);
    else if (!event.pending) pending.delete(event.id);
    if (!pending.size) { dismissed = false; hide(); }
    else if (!timer && overlay.hidden && !dismissed) timer = setTimeout(show, 180);
  });
  function update(state) {
    var next = state.signedIn ? state.ownerId : null;
    if (next !== owner) { owner = next; pending.clear(); dismissed = false; hide(); }
    var error = state.sessionError;if(['timeout','network','stream_timeout','stream_closed','refresh_outcome_uncertain'].includes(error))error=null;
    panel.hidden = !error || state.authReason === 'expired';
    if (panel.hidden) return;
    text.textContent = '로그인을 다시 확인해 주세요.';
  }
  retry.onclick = function () {
    if (retry.disabled) return; retry.disabled = true; retry.textContent = '연결 확인 중…';
    api.retryConnection().then(function () { text.textContent = '✓ 다시 연결됐어요. 저장 상태를 확인한 뒤 필요한 작업을 다시 시도해 주세요.'; panel.hidden = false; }, function () { update(api.state()); }).finally(function () { retry.disabled = false; retry.textContent = '다시 연결하기'; });
  };
  api.onChange(update); update(api.state());
  root.addEventListener('popstate', hide);
  root.addEventListener('hashchange', hide);
  root.addEventListener('pagehide', hide);
})(window);
