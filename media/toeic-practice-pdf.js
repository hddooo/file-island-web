/* Private Practice export: read-only APIs, local PDF generation, no uploads. */
(function (root) {
  'use strict';
  var controllers = new Set(), running = null;
  var PAGE = { width: 595.28, height: 841.89, margin: 42, bottom: 795, scale: 2.5 };
  var FONT = 'Arial, Helvetica, "Apple SD Gothic Neo", "Malgun Gothic", "Noto Sans CJK KR", sans-serif';
  function str(value) { return typeof value === 'string' ? value : ''; }
  function id(q) { return JSON.stringify([q.collectionId, q.number]); }
  function grouped(q) { return [3, 4, 6, 7].indexOf(q.part) >= 0; }
  function wrong(q) { return q.originalWrong === true || !!(q.studyHistory && q.studyHistory.wrongCount > 0) || q.originalWrong == null; }
  function selectedParts(part) {
    var parts = Array.isArray(part) ? part.slice() : [part];
    if (!parts.length || parts.some(function (p) { return !Number.isInteger(p) || p < 1 || p > 7; }) || new Set(parts).size !== parts.length) throw Error('invalid_part');
    return parts.sort(function (a, b) { return a - b; });
  }
  function bundles(items, part) {
    var parts = selectedParts(part);
    if (!Array.isArray(items)) throw Error('invalid_questions');
    var map = new Map(), seen = new Set();
    items.filter(function (q) { return q && parts.indexOf(q.part) >= 0; }).sort(function (a, b) { return a.part - b.part; }).forEach(function (q) {
      if (typeof q.collectionId !== 'string' || !Number.isInteger(q.number) || !Array.isArray(q.options) || seen.has(id(q))) throw Error('invalid_questions');
      seen.add(id(q));
      var k = grouped(q) ? JSON.stringify([q.collectionId, q.part, q.groupId]) : id(q);
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(q);
    });
    return Array.from(map.values()).filter(function (qs) { return qs.some(wrong); }).map(function (qs) {
      return qs.slice().sort(function (a, b) { return a.number - b.number; });
    });
  }
  function hex(text) {
    var value = 'FEFF';
    for (var i = 0; i < text.length; i++) value += text.charCodeAt(i).toString(16).padStart(4, '0');
    return value;
  }
  function ascii(value) { return new TextEncoder().encode(value); }
  function number(value) { return Number(value).toFixed(3).replace(/\.?0+$/, '') || '0'; }
  // JPEG pages preserve the browser's Korean typography. ActualText keeps the
  // exact Unicode source available to PDF text extraction and copy tools.
  function pdf(pages, title) {
    var parts = [], offsets = [0], length = 0, objects = 7 + pages.length * 3;
    function append(value) { var bytes = typeof value === 'string' ? ascii(value) : value; parts.push(bytes); length += bytes.byteLength; }
    function object(index, body) { offsets[index] = length; append(index + ' 0 obj\n'); append(body); append('\nendobj\n'); }
    append('%PDF-1.7\n%HanQ-private-practice\n');
    object(1, '<< /Type /Catalog /Pages 2 0 R /Lang (ko-KR) >>');
    object(2, '<< /Type /Pages /Count ' + pages.length + ' /Kids [' + pages.map(function (_, i) { return (8 + i * 3) + ' 0 R'; }).join(' ') + '] >>');
    object(3, '<< /Type /Font /Subtype /Type0 /BaseFont /HanQText /Encoding /Identity-H /DescendantFonts [4 0 R] /ToUnicode 5 0 R >>');
    object(4, '<< /Type /Font /Subtype /CIDFontType2 /BaseFont /HanQText /CIDSystemInfo << /Registry (Adobe) /Ordering (Identity) /Supplement 0 >> /DW 1000 /CIDToGIDMap /Identity /FontDescriptor 6 0 R >>');
    var cmap = '/CIDInit /ProcSet findresource begin\n12 dict begin\nbegincmap\n/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def\n/CMapName /HanQUnicode def\n/CMapType 2 def\n1 begincodespacerange\n<0000> <FFFF>\nendcodespacerange\n1 beginbfrange\n<0000> <FFFF> <0000>\nendbfrange\nendcmap\nCMapName currentdict /CMap defineresource pop\nend end\n';
    object(5, '<< /Length ' + ascii(cmap).byteLength + ' >>\nstream\n' + cmap + 'endstream');
    // Text is invisible (3 Tr); the visual glyphs are already on the JPEG page.
    // ToUnicode also works in readers that ignore marked-content ActualText.
    object(6, '<< /Type /FontDescriptor /FontName /HanQText /Flags 32 /FontBBox [-1000 -1000 3000 3000] /ItalicAngle 0 /Ascent 1000 /Descent -250 /CapHeight 1000 /StemV 80 >>');
    object(7, '<< /Title <' + hex(title) + '> /Creator (HanQ Practice) >>');
    pages.forEach(function (page, i) {
      var pageId = 8 + i * 3, imageId = pageId + 1, streamId = pageId + 2;
      object(pageId, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' + PAGE.width + ' ' + PAGE.height + '] /Resources << /XObject << /Im0 ' + imageId + ' 0 R >> /Font << /F1 3 0 R >> >> /Contents ' + streamId + ' 0 R >>');
      offsets[imageId] = length;
      append(imageId + ' 0 obj\n<< /Type /XObject /Subtype /Image /Width ' + page.width + ' /Height ' + page.height + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + page.bytes.byteLength + ' >>\nstream\n');
      append(page.bytes); append('\nendstream\nendobj\n');
      var content = 'q ' + PAGE.width + ' 0 0 ' + PAGE.height + ' 0 0 cm /Im0 Do Q\n';
      page.lines.forEach(function (line) {
        if (!line.text.trim()) return;
        var count = Math.max(1, line.text.length), scale = line.width / (line.size * count) * 100;
        content += '/Span << /ActualText <' + hex(line.text) + '> >> BDC\nBT /F1 ' + number(line.size) + ' Tf 3 Tr ' + number(scale) + ' Tz 1 0 0 1 ' + number(line.x) + ' ' + number(PAGE.height - line.y) + ' Tm <' + hex(line.text).slice(4) + '> Tj ET\nEMC\n';
      });
      var bytes = ascii(content);
      object(streamId, '<< /Length ' + bytes.byteLength + ' >>\nstream\n' + content + 'endstream');
    });
    var xref = length;
    append('xref\n0 ' + (objects + 1) + '\n0000000000 65535 f \n');
    for (var i = 1; i <= objects; i++) append(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
    append('trailer\n<< /Size ' + (objects + 1) + ' /Root 1 0 R /Info 7 0 R >>\nstartxref\n' + xref + '\n%%EOF\n');
    return new Blob(parts, { type: 'application/pdf' });
  }
  function current(options) { if (options.isCurrent && !options.isCurrent()) throw Error('cancelled'); }
  function pause(options) { return new Promise(function (resolve) { setTimeout(resolve, 0); }).then(function () { current(options); }); }
  function identity(api) { var s = api && api.state(); return s && s.signedIn && !s.restoring && s.ownerId != null ? String(s.ownerId) + ':' + String(s.epoch || 0) : null; }
  async function supplements(items, options) {
    var reviews = new Map(), scripts = new Map(), warnings = [], api = options.api;
    var wanted = new Map(items.map(function (q) { return [id(q), q]; }));
    async function get(path) {
      current(options); var timer, cancel;
      var limit = new Promise(function (_, reject) {
        timer = setTimeout(function () { reject(Error('read_timeout')); }, 15000);
        cancel = function () { reject(Error('cancelled')); };
        if (options.signal) options.signal.addEventListener('abort', cancel, { once: true });
      });
      try { var result = await Promise.race([api.toeicCbt('GET', path), limit]); current(options); return result; }
      finally { clearTimeout(timer); if (options.signal) options.signal.removeEventListener('abort', cancel); }
    }
    function accept(collection, q, review) {
      var target = wanted.get(JSON.stringify([collection, q.number]));
      if (!target || target.part !== q.part || !review || !Array.isArray(review.choices)) return;
      if (q.groupId !== target.groupId || q.passage != null && target.part >= 6 && str(q.passage) !== str(target.passage)) return;
      if (target.part > 2 && (str(q.stem) !== str(target.stem) || review.stem != null && str(review.stem) !== str(target.stem) || JSON.stringify(review.choices) !== JSON.stringify(target.options))) return;
      if (review.correctOptionId && !target.options.some(function (o) { return o.id === review.correctOptionId; })) return;
      if (!reviews.has(id(target))) reviews.set(id(target), review);
    }
    try {
      var collections = await get('/collections');
      var sources = (collections.collections || []).filter(function (c) { return c.studyAvailable === true && items.some(function (q) { return q.collectionId === c.id; }); });
      for (var c of sources) {
        try { var study = await get('/collections/' + encodeURIComponent(c.id) + '/study'); (study.questions || []).forEach(function (q) { accept(c.id, q, Object.assign({}, q, { officiallyVerified: false })); }); }
        catch (e) { current(options); warnings.push('일부 참고 해설을 불러오지 못했습니다.'); }
      }
    } catch (e) { current(options); warnings.push('참고 해설 목록을 불러오지 못했습니다.'); }
    try {
      var history = await get('/runs');
      var runs = (history.runs || []).filter(function (r) { return r.status === 'final' && r.verification !== true && items.some(function (q) { return q.collectionId === r.collectionId && !reviews.has(id(q)); }); });
      // Walk the existing bounded history newest-first until selected questions
      // have a review. Never create/submit an attempt to obtain answers.
      var checked = new Set();
      for (var run of runs) {
        if (checked.has(run.id) || !items.some(function (q) { return q.collectionId === run.collectionId && !reviews.has(id(q)); })) continue;
        checked.add(run.id);
        try { var data = await get('/runs/' + encodeURIComponent(run.id)); if (data.run && data.run.status === 'final' && data.run.collectionId === run.collectionId) (data.items || []).forEach(function (q) { accept(run.collectionId, q, q.review); }); }
        catch (e) { current(options); warnings.push('일부 저장된 해설을 불러오지 못했습니다.'); }
      }
    } catch (e) { current(options); warnings.push('저장된 해설 목록을 불러오지 못했습니다.'); }
    if (items.some(function (q) { return q.part <= 4; })) {
      try { var player = await get('/player'); (player.items || []).forEach(function (q) { if (items.some(function (x) { return x.collectionId === q.collectionId && x.groupId === q.groupId && x.part === q.part; })) scripts.set(JSON.stringify([q.collectionId, q.part, q.groupId]), q); }); }
      catch (e) { current(options); warnings.push('일부 듣기 대본을 불러오지 못했습니다.'); }
    }
    return { reviews: reviews, scripts: scripts, warnings: Array.from(new Set(warnings)) };
  }
  async function loadImage(asset, options) {
    current(options);
    var blob, controller = new AbortController(), timer = setTimeout(function () { controller.abort(); }, 20000);
    var cancel = function () { controller.abort(); };
    if (options.signal) options.signal.addEventListener('abort', cancel, { once: true });
    try {
      if (asset.photoPath) blob = await Promise.race([options.api.toeicCbtImage(asset.photoPath), new Promise(function (_, reject) { controller.signal.addEventListener('abort', function () { reject(Error('image_timeout')); }, { once: true }); })]);
      else {
        var url = new URL(asset.photoUrl, root.location.href);
        if (url.protocol !== 'https:' || url.username || url.password) throw Error('invalid_image');
        var response = await root.fetch(url.href, { credentials: 'omit', referrerPolicy: 'no-referrer', signal: controller.signal });
        if (!response.ok) throw Error('image_unavailable');
        blob = await response.blob();
      }
      current(options);
      if (!blob || !/^image\/(png|jpeg|webp)$/.test(blob.type) || blob.size > 8 * 1024 * 1024) throw Error('invalid_image');
      var src = URL.createObjectURL(blob), image = new Image();
      try {
        image.src = src;
        await Promise.race([image.decode(), new Promise(function (_, reject) { controller.signal.addEventListener('abort', function () { reject(Error('image_timeout')); }, { once: true }); })]);
        current(options);
        if (!image.naturalWidth || image.naturalWidth * image.naturalHeight > 40000000) throw Error('image_size');
        return { image: image, close: function () { image.src = ''; URL.revokeObjectURL(src); } };
      } catch (e) { image.src = ''; URL.revokeObjectURL(src); throw e; }
    } finally { clearTimeout(timer); if (options.signal) options.signal.removeEventListener('abort', cancel); }
  }
  async function generate(items, part, options) {
    options = options || {};
    var supplied = options, requestOwner = identity(options.api);
    if (!requestOwner) throw Error('signed_out');
    options = Object.assign({}, options, { isCurrent: function () { return requestOwner === identity(supplied.api) && (!supplied.isCurrent || supplied.isCurrent()); } });
    current(options);
    var mode = options.mode || 'questions';
    if (mode !== 'questions' && mode !== 'answers') throw Error('invalid_mode');
    var parts = selectedParts(part), partLabel = parts.join(','), answers = mode === 'answers', groups = bundles(items, parts), selected = groups.flat();
    var sheet = answers ? '정답·해설지' : '문제지', title = 'HanQ Practice - Part ' + partLabel + ' ' + sheet;
    if (!selected.length) throw Error('empty');
    // Problem sheets never request or render answers, translations, or LC scripts.
    var extra = answers ? await supplements(selected, options) : { reviews: new Map(), scripts: new Map(), warnings: [] };
    if (answers && !extra.reviews.size) throw Error('no_reviews');
    current(options);
    if (root.document.fonts) { var fontTimer; try { await Promise.race([root.document.fonts.ready, new Promise(function (resolve) { fontTimer = setTimeout(resolve, 5000); })]); } finally { clearTimeout(fontTimer); } }
    current(options);
    var canvas = root.document.createElement('canvas');
    canvas.width = Math.ceil(PAGE.width * PAGE.scale); canvas.height = Math.ceil(PAGE.height * PAGE.scale);
    var ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw Error('canvas');
    var pages = [], lines = [], y, photoCount = 0, contentWidth = PAGE.width - PAGE.margin * 2, bytes = 0;
    var fullWidth = contentWidth, contentX = PAGE.margin, column = 0, columnTop = 85, columns = false;
    function columnMode(part) { return [2, 3, 4, 5].indexOf(part) >= 0; }
    function setColumn(index) { column = index; contentWidth = columns ? (fullWidth - 24) / 2 : fullWidth; contentX = PAGE.margin + (columns ? index * (contentWidth + 24) : 0); }
    function font(size, bold) { ctx.font = (bold ? '700 ' : '400 ') + size + 'px ' + FONT; ctx.fillStyle = '#111827'; }
    function draw(text, x, baseline, size, bold, color) {
      font(size, bold); if (color) ctx.fillStyle = color;
      ctx.fillText(text, x, baseline);
      lines.push({ text: text, x: x, y: baseline, size: size, width: ctx.measureText(text).width });
    }
    function begin() {
      ctx.setTransform(PAGE.scale, 0, 0, PAGE.scale, 0, 0); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, PAGE.width, PAGE.height); lines = []; photoCount = 0;
      draw('HanQ  /  TOEIC PRACTICE', PAGE.margin, 31, 8, true, '#52525b');
      draw('PART ' + partLabel + '  ·  ' + sheet, PAGE.margin, 54, 17, true);
      ctx.strokeStyle = '#18181b'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(PAGE.margin, 66); ctx.lineTo(PAGE.width - PAGE.margin, 66); ctx.stroke(); y = 85; columnTop = 85; setColumn(0);
    }
    async function finish() {
      draw('Part ' + partLabel + ' · 개인 학습용', PAGE.margin, PAGE.height - 24, 8, false, '#52525b');
      draw(String(pages.length + 1), PAGE.width - PAGE.margin - 10, PAGE.height - 24, 8, false, '#52525b');
      var blob = await new Promise(function (resolve, reject) { canvas.toBlob(function (b) { if (b) resolve(b); else reject(Error('canvas')); }, 'image/jpeg', 0.93); });
      current(options); var data = new Uint8Array(await blob.arrayBuffer()); current(options); bytes += data.byteLength;
      if (bytes > 64 * 1024 * 1024 || pages.length >= 150) throw Error('too_large');
      pages.push({ bytes: data, width: canvas.width, height: canvas.height, lines: lines });
      if (options.onProgress) options.onProgress('PDF ' + pages.length + '쪽 구성 중…');
      await pause(options);
    }
    async function room(height) {
      if (y + height <= PAGE.bottom) return;
      if (columns && column === 0) { setColumn(1); y = columnTop; }
      else { await finish(); begin(); }
    }
    async function layout(part) {
      var next = columnMode(part);
      if (next === columns) return;
      if (columns) { await finish(); columns = next; begin(); }
      else { columns = next; columnTop = y; setColumn(0); }
    }
    function wrap(text, size, bold, width) {
      font(size, bold); var out = [];
      str(text).replace(/\r\n?/g, '\n').split('\n').forEach(function (paragraph) {
        if (!paragraph) { out.push(''); return; }
        var line = '';
        // Word tokens retain English words; long tokens and CJK break by grapheme.
        var tokens = paragraph.match(/\s+|[A-Za-z0-9][A-Za-z0-9'’.,:;!?()\/-]*|[^\sA-Za-z0-9]/gu) || [];
        tokens.forEach(function (token) {
          if (ctx.measureText(line + token).width <= width) { line += token; return; }
          if (line.trim()) { out.push(line.trimEnd()); line = ''; }
          if (/^\s+$/.test(token)) return;
          var chars = typeof Intl.Segmenter === 'function' ? Array.from(new Intl.Segmenter('ko', { granularity: 'grapheme' }).segment(token), function (v) { return v.segment; }) : Array.from(token);
          chars.forEach(function (ch) { if (line && ctx.measureText(line + ch).width > width) { out.push(line); line = ''; } line += ch; });
        });
        if (line) out.push(line.trimEnd());
      });
      return out;
    }
    async function paragraph(text, style) {
      style = style || {}; var size = style.size || 11, leading = size * 1.5;
      var values = wrap(text, size, style.bold, contentWidth - (style.indent || 0));
      // Keep short paragraphs together and never strand a final line by itself.
      if (values.length > 1 && values.length <= 4) await room(values.length * leading);
      for (var i = 0; i < values.length; i++) { await room((values.length - i === 2 ? 2 : 1) * leading); var line = values[i]; if (line) draw(line, contentX + (style.indent || 0), y + size, size, style.bold, style.color); y += leading; }
      y += style.after == null ? 5 : style.after;
    }
    function paragraphHeight(text, style) {
      style = style || {}; var size = style.size || 11;
      return wrap(text, size, style.bold, contentWidth - (style.indent || 0)).length * size * 1.5 + (style.after == null ? 5 : style.after);
    }
    function choiceRows(q) {
      var size = 11, gap = 26, width = contentWidth - 12, rows = [], row = [], used = 0;
      var horizontal = q.part === 5 || q.part <= 2 && q.options.every(function (c) { return c.text === c.id; });
      q.options.forEach(function (choice) {
        var text = q.part <= 2 && choice.text === choice.id ? '(' + choice.id + ')' : choice.id + '. ' + choice.text;
        var wrapped = wrap(text, size, false, width), natural = wrapped.length === 1 ? ctx.measureText(wrapped[0]).width : width;
        if (row.length && (!horizontal || wrapped.length > 1 || used + gap + natural > width)) { rows.push(row); row = []; used = 0; }
        var x = row.length ? used + gap : 0;
        row.push({ lines: wrapped, x: x }); used = x + natural;
        if (!horizontal || wrapped.length > 1) { rows.push(row); row = []; used = 0; }
      });
      if (row.length) rows.push(row);
      return rows;
    }
    function choicesHeight(q) { return choiceRows(q).reduce(function (height, row) { return height + Math.max.apply(null, row.map(function (c) { return c.lines.length; })) * 16.5 + 2; }, 0); }
    async function choices(q) {
      for (var row of choiceRows(q)) {
        var count = Math.max.apply(null, row.map(function (c) { return c.lines.length; }));
        if (count <= 4) await room(count * 16.5);
        for (var i = 0; i < count; i++) {
          await room((count - i === 2 ? 2 : 1) * 16.5);
          for (var cell of row) if (cell.lines[i]) draw(cell.lines[i], contentX + 12 + cell.x, y + 11, 11);
          y += 16.5;
        }
        y += 2;
      }
    }
    function imageSize(image, maxHeight) {
      var width = Math.min(contentWidth, image.naturalWidth * 0.75), height = width * image.naturalHeight / image.naturalWidth;
      if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; }
      return { width: width, height: height };
    }
    async function picture(asset, label, prepared, maxHeight) {
      var decoded = prepared;
      try {
        if (!decoded) decoded = await loadImage(asset, options);
        var size = imageSize(decoded.image, maxHeight || PAGE.bottom - 100);
        await room(size.height + paragraphHeight(label, { size: 8, after: 8 }) + 4); current(options);
        ctx.drawImage(decoded.image, contentX + (contentWidth - size.width) / 2, y, size.width, size.height); y += size.height + 4;
        await paragraph(label, { size: 8, color: '#52525b', after: 8 });
      } catch (e) { current(options); throw Error('required_image'); }
      finally { if (decoded && !prepared) decoded.close(); }
    }
    function questionLabel(q) { return String(q.sourceIdentity && q.sourceIdentity.questionNumber || q.number) + '.'; }
    async function photoQuestion(q, label) {
      var decoded, imageLabel = '원문 ' + q.number + '번 · 문제 사진', missing = '사진 미포함: 현재 자료에 문제 사진이 없습니다.';
      var prompt = q.stem || '문제와 보기는 음원으로 제시됩니다.', promptStyle = { size: q.stem ? 11 : 9, color: q.stem ? undefined : '#52525b' };
      try {
        if (q.photoPath || q.photoUrl) {
          try { decoded = await loadImage(q, options); } catch (e) { current(options); throw Error('required_image'); }
        }
        // Measure the complete block before drawing. Standard photos fit two per
        // A4 page; longer source text moves intact instead of shrinking its type.
        var photoHeight = decoded && decoded.image.naturalHeight > decoded.image.naturalWidth * 1.25 ? 360 : 200;
        var height = paragraphHeight(label, { bold: true, size: 11, after: 7 }) + (q.passage ? paragraphHeight(q.passage, { size: 11, after: 10 }) : 0) +
          (decoded ? imageSize(decoded.image, photoHeight).height + 4 + paragraphHeight(imageLabel, { size: 8, after: 8 }) : paragraphHeight(missing, { size: 9 })) +
          paragraphHeight(questionLabel(q), { bold: true, size: 10 }) + paragraphHeight(prompt, promptStyle) + choicesHeight(q) + 25;
        if (photoCount >= 2 || (photoCount || y > 140) && y + height > PAGE.bottom) { await finish(); begin(); }
        await paragraph(label, { bold: true, size: 11, after: 7 });
        if (q.passage) await paragraph(q.passage, { size: 11, after: 10 });
        if (decoded) await picture(q, imageLabel, decoded, photoHeight); else await paragraph(missing, { size: 9, color: '#52525b' });
        await paragraph(questionLabel(q), { bold: true, size: 10 });
        await paragraph(prompt, promptStyle); await choices(q); y += 25; photoCount++;
      } finally { if (decoded) decoded.close(); }
    }
    async function review(q, r) {
      if (!r) { await paragraph('해설 미포함: 이 문항의 저장된 해설을 읽기 전용으로 확인하지 못했습니다.', { size: 9, color: '#52525b' }); return; }
      await paragraph('정답 ' + (r.correctOptionId || '자료 없음') + (r.officiallyVerified === false || q.officiallyVerified === false ? ' · AI 참고 답안 (교재 정답표 대조 전)' : ''), { bold: true, size: 10 });
      if (q.part <= 2) {
        if (r.stem) await paragraph(r.stem);
        for (var choice of r.choices || []) await paragraph(choice.id + '. ' + choice.text, { indent: 12, size: 10 });
      }
      var tutor = r.tutorExplanation || {};
      if (tutor.answerReason) await paragraph(tutor.answerReason, { size: 10 });
      if (tutor.translation) await paragraph(tutor.translation, { size: 10 });
      for (var reading of tutor.reading || []) { if (reading.chunk) await paragraph(reading.chunk, { size: 10 }); if (reading.translation) await paragraph(reading.translation, { size: 10, color: '#374151' }); }
      for (var step of tutor.steps || []) await paragraph(step, { size: 10 });
      for (var option of tutor.options || []) await paragraph(option.id + '. ' + option.explanation, { size: 10 });
      for (var trap of tutor.traps || []) await paragraph('주의 · ' + trap, { size: 10 });
      for (var check of tutor.checklist || []) await paragraph('확인 · ' + check, { size: 10 });
      if (r.explanation && r.explanation !== tutor.answerReason) await paragraph(r.explanation, { size: 10 });
    }
    begin();
    try {
      var wrongCount = selected.filter(wrong).length;
      await paragraph('오답 ' + wrongCount + '문항 · 공통지문 복습 ' + (selected.length - wrongCount) + '문항 · 총 ' + selected.length + '문항', { size: 10 });
      await paragraph(answers ? '문제지와 같은 번호 순서입니다. 풀이를 마친 뒤 확인하세요.' : '정답·해설과 듣기 대본은 별도 해설지에서 확인하세요.', { size: 9, color: '#52525b' });
      if (answers) await paragraph('정답·해설 조회 ' + extra.reviews.size + ' / ' + selected.length + '문항', { size: 9, color: '#52525b', after: 10 });
      for (var warning of extra.warnings) await paragraph(warning, { size: 9, color: '#52525b' });
      var lastSourceKey = null;
      for (var qs of groups) {
        current(options);
        await layout(qs[0].part);
        var first = qs[0], label = (parts.length > 1 ? 'Part ' + first.part + ' · ' : '') + str(first.sourceTitle) + ' · 원문 ' + qs.map(function (q) { return q.sourceIdentity ? q.sourceIdentity.questionNumber : q.number; }).join('·') + '번';
        if (!answers && first.part === 1) { await photoQuestion(first, label); await pause(options); continue; }
        var sourceKey = JSON.stringify([first.collectionId, first.part]);
        if (grouped(first) || sourceKey !== lastSourceKey) {
          await room(90);
          await paragraph(grouped(first) ? label : (parts.length > 1 ? 'Part ' + first.part + ' · ' : '') + str(first.sourceTitle), { bold: true, size: 11, after: 7 });
        }
        lastSourceKey = sourceKey;
        var passages = new Set();
        if (!answers) for (var q of qs) if (q.passage && !passages.has(q.passage)) { passages.add(q.passage); await paragraph(q.passage, { size: 11, after: 10 }); }
        var assets = new Set();
        if (!answers) for (var q of qs) { var assetKey = q.photoPath || q.photoUrl; if (assetKey && !assets.has(assetKey)) { assets.add(assetKey); await picture(q, '원문 ' + q.number + '번' + (grouped(q) ? ' · 공통 그림' : ' · 문제 사진')); } }
        if (!answers && first.part === 1 && !assets.size) await paragraph('사진 미포함: 현재 자료에 문제 사진이 없습니다.', { size: 9, color: '#52525b' });
        if (!answers && first.part >= 6 && !passages.size) await paragraph('지문 미포함: 현재 자료에 공통지문이 없습니다.', { size: 9, color: '#52525b' });
        if (grouped(first)) {
          var membership = first.groupQuestionNumbers || [], absent = membership.filter(function (n) { return !qs.some(function (q) { return q.number === n; }); });
          if (absent.length) await paragraph('공통지문의 ' + absent.join('·') + '번 문항은 현재 자료에 없습니다.', { size: 9 });
        }
        var questionIndex = 0;
        for (var q of qs) {
          var heading = questionLabel(q) + (q.stem ? ' ' + q.stem : '');
          var questionHeight = paragraphHeight(heading, { size: 11 }) + (!q.stem && q.part <= 2 ? 18.5 : 0) + choicesHeight(q) + 17;
          // Keep an ordinary shared-passage question together, with a quiet rule
          // and a bold numbered heading. The question and options stay regular.
          await room(!answers && questionHeight <= PAGE.bottom - columnTop ? questionHeight + (grouped(q) ? 10 : 0) : 65);
          if (grouped(q)) { ctx.strokeStyle = '#d4d4d8'; ctx.lineWidth = 0.5; ctx.beginPath(); ctx.moveTo(contentX, y + 2); ctx.lineTo(contentX + contentWidth, y + 2); ctx.stroke(); y += 10; }
          await paragraph(heading, { size: 11 });
          if (!q.stem && !answers && q.part <= 2) await paragraph('문제와 보기는 음원으로 제시됩니다.', { size: 9, color: '#52525b' });
          if (!answers) await choices(q);
          y += 7; if (answers) await review(q, extra.reviews.get(id(q))); y += 10;
        }
        if (answers && first.part <= 4) {
          var script = extra.scripts.get(JSON.stringify([first.collectionId, first.part, first.groupId]));
          if (!script) { var r = qs.map(function (q) { return extra.reviews.get(id(q)); }).find(function (r) { return r && r.script; }); if (r) script = r; }
          if (script && script.script) {
            await room(50); await paragraph('Script' + (script.scriptStatus === 'automatic-unverified' ? ' · 자동 전사 미검증' : script.scriptStatus === 'verified' || script.scriptStatus === 'publisher-extracted' ? ' · 확인된 대본' : ' · 검증 상태 미확인'), { bold: true, size: 11 });
            await paragraph(script.script, { size: 10 });
          } else await paragraph('대본 미포함: 읽기 전용으로 확인된 대본이 없습니다.', { size: 9, color: '#52525b' });
        }
        y += 8; await pause(options);
      }
      await finish(); current(options);
      var result = pdf(pages, title);
      return { blob: result, pages: pages.length, count: selected.length, wrong: wrongCount, reviews: extra.reviews.size, mode: mode, filename: 'HanQ-Practice-Part' + (parts.length > 1 ? 's-' : '-') + parts.join('-') + (answers ? '-Answers' : '-Questions') + '.pdf' };
    } finally { canvas.width = 1; canvas.height = 1; pages.length = 0; }
  }
  function mount(host, options) {
    var doc = host.ownerDocument, alive = true, suspended = false, serial = 0, activeJob = null, urls = [], owner = identity(options.api), buttons = [], audioControls = [];
    function valid() { return alive && !suspended && host.isConnected && owner !== null && owner === identity(options.api) && (!options.isCurrent || options.isCurrent()); }
    var box = doc.createElement('div'); box.className = 'tc-pdf-tools'; box.setAttribute('role', 'group'); box.setAttribute('aria-label', (options.label || 'Practice') + ' PDF·음원 다운로드 및 듣기'); host.appendChild(box);
    var status = doc.createElement('p'); status.className = 'tc-pdf-status'; status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite'); status.hidden = true;
    function restoreButtons() { buttons.forEach(function (b) { b.disabled = b.dataset.empty === 'true'; }); }
    var cancel = doc.createElement('button'); cancel.type = 'button'; cancel.className = 'tool-btn tc-pdf-cancel'; cancel.textContent = 'PDF 준비 취소'; cancel.hidden = true;
    cancel.onclick = function () { serial++; if (activeJob) activeJob.abort(); if (running === activeJob) running = null; activeJob = null; restoreButtons(); cancel.hidden = true; status.hidden = false; status.textContent = 'PDF 준비를 취소했어요.'; };
    var categories = options.parts ? [selectedParts(options.parts)] : [[1], [2], [3, 4], [5, 6], [7]].filter(function (parts) { return options.items.some(function (q) { return parts.indexOf(q.part) >= 0; }); });
    categories.forEach(function (parts) {
      var part = parts.join(',');
      ['questions', 'answers'].forEach(function (mode) {
      var sheet = mode === 'answers' ? '해설지' : '문제지';
      var b = doc.createElement('button'); b.type = 'button'; b.className = 'tool-btn tc-pdf-export'; b.dataset.mode = mode; b.textContent = sheet + ' PDF'; b.setAttribute('aria-label', 'Part ' + part + ' ' + sheet + ' PDF 다운로드'); b.disabled = !bundles(options.items, parts).length; b.dataset.empty = String(b.disabled); box.appendChild(b); buttons.push(b);
      b.onclick = async function () {
        if (!valid() || activeJob || b.dataset.empty === 'true') return;
        if (running) { status.hidden = false; status.textContent = '다른 파트의 PDF를 먼저 준비하고 있어요. 완료 후 다시 눌러 주세요.'; return; }
        var token = ++serial, abort = new AbortController(); activeJob = abort; running = abort; buttons.forEach(function (x) { x.disabled = true; }); cancel.hidden = false; status.hidden = false; status.textContent = 'Part ' + part + ' ' + sheet + '를 준비하고 있어요…';
        function isCurrent() { return valid() && token === serial && !abort.signal.aborted; }
        try {
          var result = await generate(options.items, parts, { api: options.api, mode: mode, signal: abort.signal, isCurrent: isCurrent, onProgress: function (text) { if (isCurrent()) status.textContent = text; } });
          if (!isCurrent()) return;
          urls.forEach(function (old) { URL.revokeObjectURL(old); }); urls = [];
          var url = URL.createObjectURL(result.blob); urls.push(url);
          var link = doc.createElement('a'); link.className = 'tc-pdf-download'; link.href = url; link.download = result.filename; link.textContent = 'Part ' + part + ' ' + sheet + ' 저장 (' + result.pages + '쪽)'; link.setAttribute('aria-label', 'Part ' + part + ' ' + sheet + ' PDF ' + result.pages + '쪽 저장');
          link.onclick = function (event) { if (!valid()) event.preventDefault(); };
          box.querySelectorAll('a.tc-pdf-download').forEach(function (a) { a.remove(); }); box.appendChild(link); link.click();
          status.textContent = mode === 'answers' ? '정답·해설 ' + result.reviews + ' / ' + result.count + '문항 조회. 다운로드가 시작되지 않으면 해설지 저장을 눌러 주세요.' : '문제 ' + result.count + '문항. 다운로드가 시작되지 않으면 문제지 저장을 눌러 주세요.';
        } catch (e) {
          if (!isCurrent()) return;
          status.textContent = e.message === 'no_reviews' ? '이 파트에서 읽을 수 있는 정답·해설이 아직 없어 해설지를 만들지 않았어요. 문제지는 따로 받을 수 있어요.' : e.message === 'required_image' ? '문제 그림을 불러오지 못해 PDF를 만들지 않았어요. 연결을 확인한 뒤 다시 눌러 주세요.' : e.message === 'empty' ? '이 파트에 내보낼 오답이 없어요.' : e.message === 'too_large' ? '자료가 커서 이 기기에서 PDF를 만들지 못했어요. 컴퓨터에서 다시 시도해 주세요.' : 'PDF를 만들지 못했어요. 연결을 확인한 뒤 다시 눌러 주세요.';
        } finally { if (running === abort) running = null; if (isCurrent()) { activeJob = null; cancel.hidden = true; restoreButtons(); } }
      };
      });
      // Audio listening is provided by the playlist; ZIP export is no longer shown.
      if (root.HanqToeicPracticePlaylist && parts.every(function (p) { return p <= 4; })) audioControls.push(root.HanqToeicPracticePlaylist.mount(box, { items: options.items, parts: parts, api: options.api, isCurrent: valid, onListen: options.onListen }));
    });
    box.appendChild(cancel); box.appendChild(status);
    function release() {
      serial++; if (activeJob) activeJob.abort(); if (running === activeJob) running = null; activeJob = null;
      urls.forEach(function (u) { URL.revokeObjectURL(u); }); urls = []; box.querySelectorAll('a.tc-pdf-download').forEach(function (a) { a.remove(); });
      cancel.hidden = true; status.hidden = true; status.textContent = '';
    }
    var controller = { host: host,
      suspend: function () { if (!alive) return; suspended = true; audioControls.forEach(function (c) { c.suspend(); }); release(); buttons.forEach(function (b) { b.disabled = true; }); },
      resume: function () { if (!alive || !suspended) return; suspended = false; if (!valid()) { controller.stop(); return; } restoreButtons(); audioControls.forEach(function (c) { c.resume(); }); },
      stop: function () { if (!alive) return; alive = false; audioControls.forEach(function (c) { c.stop(); }); release(); box.remove(); controllers.delete(controller); }
    };
    controllers.add(controller); return controller;
  }
  function stop(host) { Array.from(controllers).forEach(function (c) { if (!host || c.host === host || host.contains(c.host)) c.stop(); }); }
  if (root.addEventListener) {
    // bfcache restores this same DOM. Keep controls, but discard private output
    // and in-flight work; revalidate the account before enabling them again.
    root.addEventListener('pagehide', function (event) { if (event.persisted) Array.from(controllers).forEach(function (c) { c.suspend(); }); else stop(); });
    root.addEventListener('pageshow', function (event) { if (event.persisted) Array.from(controllers).forEach(function (c) { c.resume(); }); });
  }
  root.HanqToeicPracticePdf = { mount: mount, stop: stop, bundles: bundles, generate: generate };
})(typeof window !== 'undefined' ? window : globalThis);



