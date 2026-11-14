/* Deployment notice only. Never reload automatically or touch learning/auth storage. */
(function (root) {
  'use strict';
  var doc = root.document, meta = doc.querySelector('meta[name="hanq-app-version"]');
  var current = meta && meta.content, validId = /^[a-f0-9]{40}$/;
  if (!validId.test(current || '') || !root.fetch) return;
  var pending = null, checking = null, lastCheck = 0, applying = false;
  var snoozeKey = 'hanq:app-update:snooze-until', snoozeDay = 24 * 60 * 60 * 1000, snoozeUntil = 0, volatileSnoozeUntil = 0, snoozeTimer = null;
  function readSnooze() {
    try { var value = Number(root.localStorage.getItem(snoozeKey)); snoozeUntil = Math.max(volatileSnoozeUntil, Number.isFinite(value) && value > 0 ? value : 0); }
    catch (e) { /* Keep the in-memory deadline when browser storage is unavailable. */ }
  }
  function scheduleSnooze() {
    root.clearTimeout(snoozeTimer); snoozeTimer = null;
    var remaining = snoozeUntil - Date.now();
    if (remaining > 0) snoozeTimer = root.setTimeout(function () { snoozeTimer = null; paint(); }, Math.min(remaining, snoozeDay));
  }
  readSnooze();
  var dirty = new Set(), requests = new Set(), refreshTimer = null;
  var panel = doc.createElement('aside');
  panel.className = 'app-update'; panel.hidden = true;
  panel.setAttribute('aria-label', '앱 새 버전');
  panel.innerHTML = '<p role="status" aria-live="polite" aria-atomic="true"></p><div><button type="button" data-apply-update>새 버전 적용</button><button type="button" data-dismiss-update>나중에</button></div>';
  var status = panel.querySelector('p'), apply = panel.querySelector('[data-apply-update]');
  doc.body.appendChild(panel);
  function reason() {
    if (doc.hidden) return '앱 화면으로 돌아오면 적용할 수 있어요.';
    // Unknown routes fail closed. Lessons, exams, battle and review drafts stay in memory.
    if (!/^(?:|#subjects|#history|#rainbow|#hall-of-fame|#account)$/.test(root.location.hash))
      return '학습·대결을 마치고 메인 메뉴에서 적용해 주세요.';
    if (doc.querySelector('.bi-in-match, [aria-modal="true"]:not([hidden]), main[aria-busy="true"]') || requests.size ||
        root.HanqApi && root.HanqApi.state && root.HanqApi.state().restoring)
      return '진행 중인 작업을 마친 뒤 적용할 수 있어요.';
    var playing = Array.from(doc.querySelectorAll('audio,video')).some(function (el) { return !el.paused && !el.ended; });
    if (playing || root.navigator.mediaSession && root.navigator.mediaSession.playbackState === 'playing')
      return '음원 재생을 멈춘 뒤 적용할 수 있어요.';
    dirty.forEach(function (el) { if (!el.isConnected) dirty.delete(el); });
    if (dirty.size) return '입력 중인 내용을 마치고 메인 메뉴에서 적용해 주세요.';
    return '';
  }
  function paint() {
    var blocked = reason(), message = blocked || '새 버전이 있어요. 적용하면 현재 화면을 다시 엽니다.';
    panel.hidden = !pending || Date.now() < snoozeUntil;
    if (status.textContent !== message) status.textContent = message;
    apply.disabled = applying || !!blocked;
  }
  function schedulePaint() {
    if (!pending || refreshTimer) return;
    refreshTimer = root.setTimeout(function () { refreshTimer = null; paint(); }, 80);
  }
  function check(force) {
    if (doc.hidden || checking || !force && Date.now() - lastCheck < 60000) return checking;
    lastCheck = Date.now();
    var controller = new AbortController(), timeout = root.setTimeout(function () { controller.abort(); }, 5000);
    checking = root.fetch('/app-version.json?t=' + lastCheck, { cache: 'no-store', credentials: 'omit', signal: controller.signal })
      .then(function (response) { if (!response.ok) throw new Error('version unavailable'); return response.json(); })
      .then(function (data) {
        if (!data || data.schema !== 1 || !validId.test(data.buildId || '')) return;
        pending = data.buildId === current ? null : data.buildId; paint();
      }).catch(function () { /* Offline/old deployments do not interrupt the app. */ })
      .finally(function () { root.clearTimeout(timeout); checking = null; });
    return checking;
  }
  apply.onclick = function () {
    // Re-evaluate at the click, not only when the banner was rendered.
    if (!pending || applying || reason()) { paint(); return; }
    applying = true; paint();
    var url = new URL(root.location.href);
    url.searchParams.set('_hanq_update', pending);
    // Keep the hash and all existing storage; bypass a stale HTML cache with a new URL.
    root.location.replace(url.href);
  };
  panel.querySelector('[data-dismiss-update]').onclick = function () {
    snoozeUntil = Date.now() + snoozeDay;
    try { root.localStorage.setItem(snoozeKey, String(snoozeUntil)); volatileSnoozeUntil = 0; } catch (e) { volatileSnoozeUntil = snoozeUntil; }
    scheduleSnooze(); paint();
  };
  function resume() { readSnooze(); scheduleSnooze(); paint(); check(false); }
  root.addEventListener('storage', function (event) { if (event.key === snoozeKey || event.key === null) { readSnooze(); scheduleSnooze(); paint(); } });
  root.addEventListener('pageshow', resume);
  root.addEventListener('focus', resume);
  doc.addEventListener('visibilitychange', function () { if (!doc.hidden) resume(); });
  root.addEventListener('hashchange', schedulePaint);
  root.addEventListener('popstate', schedulePaint);
  ['play', 'pause', 'ended', 'emptied'].forEach(function (event) { doc.addEventListener(event, schedulePaint, true); });
  ['input', 'change'].forEach(function (event) { doc.addEventListener(event, function (e) {
    if (!panel.contains(e.target) && e.target.matches('input,textarea,select,[contenteditable]')) dirty.add(e.target);
    schedulePaint();
  }, true); });
  new MutationObserver(schedulePaint).observe(doc.body, { childList: true, subtree: true });
  if (root.HanqApi && root.HanqApi.onActivity) root.HanqApi.onActivity(function (event) {
    if (event.pending) requests.add(event.id); else requests.delete(event.id); schedulePaint();
  });
  if (root.HanqApi && root.HanqApi.onChange) root.HanqApi.onChange(schedulePaint);
  var arrived = new URL(root.location.href);
  if (arrived.searchParams.get('_hanq_update') === current) {
    arrived.searchParams.delete('_hanq_update');
    root.history.replaceState(root.history.state, '', arrived.href);
  }
  scheduleSnooze(); paint(); check(true);
})(window);
