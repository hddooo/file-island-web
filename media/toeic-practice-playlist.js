/* Account-scoped Practice listening. Reuses the existing playlist and player skin. */
(function (root) {
  'use strict';
  var controllers = new Set();
  function identity(api) { var s = api && api.state(); return s && s.signedIn && !s.restoring && s.ownerId != null ? String(s.ownerId) + ':' + (s.epoch || 0) : null; }
  function label(parts) { return 'Part ' + parts.join('·'); }
  function plan(items, parts) {
    if (!Array.isArray(parts) || ![[1], [2], [3, 4]].some(function (p) { return p.join(',') === parts.join(','); })) throw Error('invalid_part');
    if (!Array.isArray(items)) throw Error('invalid_questions');
    // /practice already supplies the review list. Do not filter it again by answer history.
    var bundles = new Map(), questions = new Set();
    items.filter(function (q) { return q && parts.indexOf(q.part) >= 0; }).sort(function (a, b) { return a.part - b.part; }).forEach(function (q) {
      var id = JSON.stringify([q.collectionId, q.number]);
      if (typeof q.collectionId !== 'string' || !Number.isInteger(q.number) || questions.has(id)) throw Error('invalid_questions');
      questions.add(id);
      var key = q.part >= 3 ? JSON.stringify([q.collectionId, q.part, q.groupId]) : id;
      if (!bundles.has(key)) bundles.set(key, []);
      bundles.get(key).push(q);
    });
    var list = [], missing = [], seen = new Set();
    Array.from(bundles.values()).forEach(function (qs) {
      qs.sort(function (a, b) { return a.number - b.number; });
      var q = qs[0], numbers = qs.map(function (x) { return String(x.displayNumber || x.number); }).join('·');
      if (!q.audioUrl) { missing.push('Part ' + q.part + ' · ' + numbers + '번'); return; }
      if (!/^[0-9a-f-]{36}$/.test(q.collectionId) || typeof q.groupId !== 'string' || !q.groupId || q.groupId.length > 200 || qs.some(function (x) { return x.audioUrl !== q.audioUrl; })) throw Error('invalid_audio');
      var url; try { url = new URL(q.audioUrl); } catch (_) { throw Error('invalid_audio'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw Error('invalid_audio');
      var clip = q.audioClip || {}, start = clip.start == null ? 0 : clip.start, end = clip.end == null ? null : clip.end;
      if (!Number.isFinite(start) || start < 0 || end !== null && (!Number.isFinite(end) || end <= start) || qs.some(function (x) { var c = x.audioClip || {}; return (c.start == null ? 0 : c.start) !== start || (c.end == null ? null : c.end) !== end; })) throw Error('invalid_audio');
      var key = JSON.stringify([q.collectionId, q.part, q.groupId, q.part <= 2 ? q.number : null, start, end]);
      if (seen.has(key)) return; seen.add(key);
      list.push({ type: 'question', id: key, url: q.audioUrl, audioVersion: q.audioVersion || q.audioETag || q.audioUpdatedAt || q.version || '', clip: { start: start, end: end }, collectionId: q.collectionId, groupId: q.groupId, questionNumber: q.number, sourceTitle: q.sourceTitle || 'Practice', part: q.part, numbers: numbers + '번', title: (q.sourceTitle || 'Practice') + ' · Part ' + q.part + ' · ' + numbers + '번', script: q.script || '', scriptStatus: q.scriptStatus, timing: q.timing || null });
    });
    return { list: list, missing: missing.length };
  }
  function lifecycle(host, options, release, enable) {
    var owner = identity(options.api), alive = true, suspended = false, off;
    function valid() { return alive && !suspended && host.isConnected && owner !== null && owner === identity(options.api) && (!options.isCurrent || options.isCurrent()); }
    var control = { host: host, valid: valid, suspend: function () { if (!alive) return; suspended = true; release(false); if (enable) enable(false); }, resume: function () { if (!alive || !suspended) return; suspended = false; if (!valid()) { control.stop(); return; } if (enable) enable(true); }, stop: function () { if (!alive) return; alive = false; release(true); if (off) off(); controllers.delete(control); } };
    off = options.api.onChange ? options.api.onChange(function () { if (owner !== identity(options.api)) control.stop(); }) : null;
    controllers.add(control); return control;
  }
  function mount(host, options) {
    var b = host.ownerDocument.createElement('button'), available = false;
    b.type = 'button'; b.className = 'tool-btn tc-audio-listen'; b.textContent = '음원 듣기'; b.setAttribute('aria-label', label(options.parts) + ' 음원 재생목록 열기');
    try { available = plan(options.items, options.parts).list.length > 0 && typeof options.onListen === 'function'; } catch (_) {}
    if (!available) b.textContent = '등록 음원 없음';
    b.disabled = !available; host.classList.add('tc-has-audio-listen'); host.appendChild(b);
    var control = lifecycle(host, options, function (remove) { if (remove) b.remove(); }, function (enabled) { b.disabled = !enabled || !available; });
    b.onclick = function () { if (control.valid() && available) options.onListen(); }; return control;
  }
  function mountPlayer(host, options) {
    var player = null, snapshot = options.snapshot || null, box = host.ownerDocument.createElement('div'); box.className = 'tc-audio-page'; host.appendChild(box);
    function clear() { if (player) { snapshot = player.selection(); player.stop(); player = null; } box.replaceChildren(); }
    var control = lifecycle(host, options, function (remove) { clear(); if (remove) box.remove(); }, function (enabled) { if (enabled) render(); });
    function render() {
      if (!control.valid()) return;
      clear();
      try {
        var data = plan(options.items, options.parts);
        if (!root.HanqLcPlaylist || !root.HanqLcAudioFiles || !options.api.toeicCbtAudio) throw Error('not_ready');
        // Only one playback owner. An earlier Listening mini player must not keep playing.
        if (root.HanqLcPlayer) root.HanqLcPlayer.stop();
        if (root.HanqToeicAudio) root.HanqToeicAudio.stop();
        player = root.HanqLcPlaylist.mount(box, [], { catalog: data, hideTranscript: true, iconOnlyControls: true, heading: label(options.parts) + ' Practice 음원', summary: '등록된 문제·지문 음원 ' + data.list.length + '개 · 회차를 선택해 차례로 들어요.' + (data.missing ? ' · 등록 음원 없는 묶음 ' + data.missing + '개 제외' : ''), initialSelection: snapshot, preferenceKey: 'hanq:lc-speed:' + options.api.state().ownerId,
          beforePlay: function () { if (root.HanqLcPlayer) root.HanqLcPlayer.pause(); },
          onPractice: typeof options.onPractice === 'function' ? function (track) { if (control.valid()) options.onPractice(track, player.selection()); } : null,
          loadFile: function (track, signal) { if (!control.valid()) return Promise.reject(Error('cancelled')); return options.api.toeicCbtAudio(track.collectionId, track.groupId, signal).then(function (blob) { if (!control.valid()) throw Error('cancelled'); return blob; }); }
        });
      } catch (_) {
        box.textContent = '음원 목록을 준비하지 못했어요. 연결과 등록 자료를 확인한 뒤 다시 시도해 주세요.';
        var retry = host.ownerDocument.createElement('button'); retry.type = 'button'; retry.textContent = '다시 불러오기'; retry.onclick = render; box.appendChild(retry);
      }
    }
    render(); return control;
  }
  function stop(host) { Array.from(controllers).forEach(function (c) { if (!host || c.host === host || host.contains(c.host)) c.stop(); }); }
  if (root.addEventListener) {
    root.addEventListener('pagehide', function (event) { if (event.persisted) Array.from(controllers).forEach(function (c) { c.suspend(); }); else stop(); });
    root.addEventListener('pageshow', function (event) { if (event.persisted) Array.from(controllers).forEach(function (c) { c.resume(); }); });
  }
  root.HanqToeicPracticePlaylist = { mount: mount, mountPlayer: mountPlayer, plan: plan, stop: stop };
})(typeof window !== 'undefined' ? window : globalThis);
