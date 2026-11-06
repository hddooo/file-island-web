/* Private Practice audio export. Authenticated reads only; ZIP stays in memory. */
(function (root) {
  'use strict';
  var controllers = new Set(), running = null, MAX_FILE = 20 * 1024 * 1024, MAX_TOTAL = 120 * 1024 * 1024;
  function identity(api) { var s = api && api.state(); return s && s.signedIn && !s.restoring && s.ownerId != null ? String(s.ownerId) + ':' + (s.epoch || 0) : null; }
  function current(options) { if (options.signal && options.signal.aborted || options.isCurrent && !options.isCurrent()) throw Error('cancelled'); }
  function plan(items, parts) {
    if (!root.HanqToeicPracticePdf) throw Error('not_ready');
    var bundles = root.HanqToeicPracticePdf.bundles(items, parts), tracks = [], byUrl = new Map(), missing = [];
    bundles.forEach(function (qs) {
      var q = qs[0]; if (q.part > 4) return;
      var label = 'Part ' + q.part + ' · ' + qs.map(function (x) { return x.displayNumber || x.number; }).join('·') + '번';
      if (!q.audioUrl) { missing.push(label); return; }
      if (typeof q.audioUrl !== 'string' || !/^[0-9a-f-]{36}$/.test(q.collectionId) || typeof q.groupId !== 'string' || !q.groupId || q.groupId.length > 200 || qs.some(function (x) { return x.audioUrl !== q.audioUrl; })) throw Error('invalid_audio');
      var url; try { url = new URL(q.audioUrl); } catch (_) { throw Error('invalid_audio'); }
      if (url.protocol !== 'https:' || url.username || url.password) throw Error('invalid_audio');
      url.hash = ''; // This is an identity key only. Never fetch the source URL.
      var entry = byUrl.get(url.href), reference = { part: q.part, source: q.sourceTitle || '', numbers: qs.map(function (x) { return String(x.displayNumber || x.number); }) };
      if (entry) entry.references.push(reference);
      else { entry = { collectionId: q.collectionId, groupId: q.groupId, references: [reference] }; tracks.push(entry); byUrl.set(url.href, entry); }
    });
    return { tracks: tracks, missing: missing, listening: parts.some(function (p) { return p <= 4; }) };
  }
  var crcTable = new Uint32Array(256);
  for (var n = 0; n < 256; n++) { var c = n; for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  async function crc32(bytes, options) {
    var crc = 0xffffffff;
    for (var start = 0; start < bytes.length; start += 1048576) {
      current(options); var end = Math.min(start + 1048576, bytes.length);
      for (var i = start; i < end; i++) crc = crcTable[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
      await new Promise(function (resolve) { setTimeout(resolve, 0); });
    }
    current(options); return (crc ^ 0xffffffff) >>> 0;
  }
  function header(size) { var bytes = new Uint8Array(size); return { bytes: bytes, view: new DataView(bytes.buffer) }; }
  // ZIP store method: MP3s are already compressed. UTF-8 names and CRC32 work in
  // Windows/macOS extractors without a third-party library or upload service.
  async function zip(files, options) {
    var body = [], directory = [], offset = 0, directorySize = 0;
    for (var file of files) {
      current(options);
      var name = new TextEncoder().encode(file.name), data = new Uint8Array(await file.blob.arrayBuffer()), crc = await crc32(data, options), local = header(30), central = header(46);
      var l = local.view; l.setUint32(0, 0x04034b50, true); l.setUint16(4, 20, true); l.setUint16(6, 0x800, true); l.setUint16(12, 33, true); l.setUint32(14, crc, true); l.setUint32(18, data.length, true); l.setUint32(22, data.length, true); l.setUint16(26, name.length, true);
      var d = central.view; d.setUint32(0, 0x02014b50, true); d.setUint16(4, 20, true); d.setUint16(6, 20, true); d.setUint16(8, 0x800, true); d.setUint16(14, 33, true); d.setUint32(16, crc, true); d.setUint32(20, data.length, true); d.setUint32(24, data.length, true); d.setUint16(28, name.length, true); d.setUint32(42, offset, true);
      body.push(local.bytes, name, file.blob); directory.push(central.bytes, name); offset += 30 + name.length + data.length; directorySize += 46 + name.length;
    }
    var end = header(22), e = end.view; e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, directorySize, true); e.setUint32(16, offset, true);
    current(options); return new Blob(body.concat(directory, [end.bytes]), { type: 'application/zip' });
  }
  function safe(value) { return String(value).replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g, '-').replace(/[. ]+$/g, '').slice(0, 45) || 'Practice'; }
  async function generate(items, parts, options) {
    options = options || {}; var supplied = options, owner = identity(options.api);
    if (!owner) throw Error('signed_out');
    options = Object.assign({}, options, { isCurrent: function () { return owner === identity(supplied.api) && (!supplied.isCurrent || supplied.isCurrent()); } });
    current(options);
    var selection = plan(items, parts);
    if (selection.missing.length) throw Error('missing_audio');
    if (!selection.tracks.length) throw Error('empty');
    if (selection.tracks.length > 500) throw Error('too_large');
    if (!options.api.toeicCbtAudio || !root.crypto || !root.crypto.subtle) throw Error('not_ready');
    var files = [], seen = new Map(), total = 0;
    for (var i = 0; i < selection.tracks.length; i++) {
      current(options); var track = selection.tracks[i];
      if (options.onProgress) options.onProgress('음원 ' + (i + 1) + ' / ' + selection.tracks.length + '개 준비 중…');
      var blob = await options.api.toeicCbtAudio(track.collectionId, track.groupId, options.signal);
      current(options);
      if (!blob || blob.type !== 'audio/mpeg' || !blob.size) throw Error('invalid_audio');
      if (blob.size > MAX_FILE) throw Error('too_large');
      var bytes = await blob.arrayBuffer(); current(options);
      var digest = Array.from(new Uint8Array(await root.crypto.subtle.digest('SHA-256', bytes))).map(function (b) { return b.toString(16).padStart(2, '0'); }).join(''); current(options);
      var duplicate = seen.get(digest);
      if (duplicate) { duplicate.references = duplicate.references.concat(track.references); continue; }
      if (total + blob.size > MAX_TOTAL) throw Error('too_large');
      total += blob.size;
      var ref = track.references[0], file = { name: 'Part' + ref.part + '/' + String(files.length + 1).padStart(3, '0') + '-' + safe(ref.source) + '-Q' + safe(ref.numbers.join('-')) + '.mp3', blob: blob, references: track.references.slice() };
      files.push(file); seen.set(digest, file);
    }
    current(options);
    var note = ['HanQ TOEIC Practice · Part ' + parts.join(', ') + ' 오답 음원', '', 'PDF 문제지·해설지의 표시 번호와 아래 번호를 맞춰 보세요.', '같은 음원은 한 번만 담았습니다. 공통 음원은 해당 묶음 전체를 포함합니다.', '각 MP3는 등록된 원본 음원입니다. 재생 구간이 설정된 경우 그 밖의 구간도 포함할 수 있습니다.', '개인 학습용으로 보관하고 재배포하지 마세요.', ''];
    files.forEach(function (f) { note.push(f.name); f.references.forEach(function (r) { note.push('  Part ' + r.part + ' · ' + r.source + ' · ' + r.numbers.join('·') + '번'); }); note.push(''); });
    var count = files.length; files.push({ name: '음원-목록.txt', blob: new Blob(['\ufeff' + note.join('\r\n')], { type: 'text/plain;charset=utf-8' }) });
    if (options.onProgress) options.onProgress('음원 ' + count + '개 ZIP 구성 중…');
    var result = await zip(files, options); current(options);
    return { blob: result, count: count, filename: 'HanQ-Practice-Part' + (parts.length > 1 ? 's-' : '-') + parts.join('-') + '-Audio.zip' };
  }
  function mount(box, options) {
    var doc = box.ownerDocument, owner = identity(options.api), alive = true, suspended = false, serial = 0, job = null, url = null;
    function valid() { return alive && !suspended && box.isConnected && owner && owner === identity(options.api) && (!options.isCurrent || options.isCurrent()); }
    var b = doc.createElement('button'); b.type = 'button'; b.className = 'tool-btn tc-audio-export'; b.textContent = '음원 ZIP'; b.setAttribute('aria-label', 'Part ' + options.parts.join(',') + ' 오답 음원 ZIP 다운로드');
    var status = doc.createElement('p'); status.className = 'tc-audio-export-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.hidden = true;
    var cancel = doc.createElement('button'); cancel.type = 'button'; cancel.className = 'tool-btn tc-audio-export-cancel'; cancel.textContent = '음원 준비 취소'; cancel.hidden = true;
    var link = null, selection, unavailable = false;
    try { selection = plan(options.items, options.parts); unavailable = !selection.tracks.length && !selection.missing.length; if (unavailable) { b.textContent = selection.listening ? '등록 음원 없음' : '음원 없음'; b.setAttribute('aria-label', selection.listening ? '이 파트에 등록된 오답 음원이 없습니다' : '이 파트는 듣기 음원이 없습니다'); } }
    catch (_) { unavailable = true; b.textContent = '음원 확인 필요'; }
    b.disabled = unavailable; box.classList.add('tc-has-audio-export'); box.append(b, cancel, status);
    function releaseOutput() { if (url) URL.revokeObjectURL(url); url = null; if (link) link.remove(); link = null; }
    function abort() { serial++; if (job) job.abort(); if (running === job) running = null; job = null; cancel.hidden = true; }
    cancel.onclick = function () { abort(); b.disabled = unavailable; status.hidden = false; status.textContent = '음원 준비를 취소했어요.'; };
    b.onclick = async function () {
      if (!valid() || job || unavailable) return;
      status.hidden = false;
      if (running) { status.textContent = '다른 파트의 음원을 먼저 준비하고 있어요. 완료 후 다시 눌러 주세요.'; return; }
      releaseOutput(); var token = ++serial, controller = new AbortController(); job = controller; running = controller; b.disabled = true; cancel.hidden = false; status.textContent = '음원을 준비하고 있어요…';
      function isCurrent() { return valid() && token === serial && !controller.signal.aborted; }
      try {
        var result = await generate(options.items, options.parts, { api: options.api, signal: controller.signal, isCurrent: isCurrent, onProgress: function (text) { if (isCurrent()) status.textContent = text; } });
        if (!isCurrent()) return;
        url = URL.createObjectURL(result.blob); link = doc.createElement('a'); link.className = 'tc-audio-download'; link.href = url; link.download = result.filename; link.textContent = '음원 ZIP 저장 (' + result.count + '개)'; link.onclick = function (event) { if (!valid()) event.preventDefault(); }; box.appendChild(link); link.click();
        status.textContent = '중복을 제외한 음원 ' + result.count + '개를 담았어요. 다운로드가 시작되지 않으면 음원 ZIP 저장을 눌러 주세요.';
      } catch (e) {
        if (!isCurrent()) return;
        status.textContent = e.message === 'missing_audio' ? '일부 문항에 등록된 음원이 없어 ZIP을 만들지 않았어요.' : e.message === 'empty' ? '이 파트에 내려받을 오답 음원이 없어요.' : e.message === 'too_large' ? '자료가 커서 ZIP을 만들지 못했어요. 용량을 확인해 주세요.' : e.message === 'not_ready' ? '음원 다운로드를 준비하지 못했어요. 새로고침 후 다시 눌러 주세요.' : '음원을 모두 불러오지 못해 ZIP을 만들지 않았어요. 연결을 확인한 뒤 다시 눌러 주세요.';
      } finally { if (running === controller) running = null; if (isCurrent()) { job = null; b.disabled = unavailable; cancel.hidden = true; } }
    };
    var off = options.api.onChange ? options.api.onChange(function () { if (owner !== identity(options.api)) control.stop(); }) : null;
    var control = { host: box, suspend: function () { if (!alive) return; suspended = true; abort(); releaseOutput(); b.disabled = true; status.hidden = true; status.textContent = ''; }, resume: function () { if (!alive || !suspended) return; suspended = false; if (!valid()) { control.stop(); return; } b.disabled = unavailable; }, stop: function () { if (!alive) return; alive = false; abort(); releaseOutput(); b.remove(); cancel.remove(); status.remove(); if (off) off(); controllers.delete(control); } };
    controllers.add(control); return control;
  }
  root.HanqToeicPracticeAudio = { mount: mount, generate: generate, plan: plan };
})(typeof window !== 'undefined' ? window : globalThis);
