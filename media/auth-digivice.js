/* Presentation only. No auth state, API requests, credentials or persistence. */
(function (root) {
  'use strict';
  var app = document.getElementById('app');
  if (!app) return;
  var backdrop = null, queued = false;
  var reduced = root.matchMedia('(prefers-reduced-motion: reduce)');
  var connection = navigator.connection;
  function sync() {
    queued = false;
    var active = app.classList.contains('login-integrated');
    document.body.classList.toggle('auth-digivice-active', active);
    if (active && !backdrop) {
      backdrop = document.createElement('div');
      backdrop.className = 'login-island-background';
      backdrop.setAttribute('aria-hidden', 'true');
      backdrop.innerHTML = '<img class="login-island-panorama" src="media/world-map-wide-v1.png" alt="" decoding="async"><i class="login-island-clouds"></i><i class="login-island-water"></i><i class="login-island-particles"></i>';
      document.body.prepend(backdrop);
    }
    if (!active && backdrop) { backdrop.remove(); backdrop = null; }
    if (backdrop) backdrop.dataset.paused = String(document.hidden || reduced.matches || document.documentElement.dataset.companyMode === 'on' || !!(connection && connection.saveData) || !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2));
  }
  function schedule() { if (!queued) { queued = true; queueMicrotask(sync); } }
  new MutationObserver(schedule).observe(app, { attributes: true, attributeFilter: ['class'] });
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ['data-company-mode'] });
  document.addEventListener('visibilitychange', sync);
  root.addEventListener('pagehide', function () { if (backdrop) backdrop.dataset.paused = 'true'; });
  root.addEventListener('pageshow', sync);
  if (reduced.addEventListener) reduced.addEventListener('change', sync);
  if (connection && connection.addEventListener) connection.addEventListener('change', sync);
  sync();
})(window);
