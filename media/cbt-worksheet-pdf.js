(function (root) {
  'use strict';

  const W = 1680, H = 2376, margin = 90, bottom = H - margin;
  const digits = ['①', '②', '③', '④', '⑤'];
  const caption = (q, i) => (i + 1) + '. (' + q.exam + '회-' + q.number + '번)';

  // PDF syntax below is ASCII, so each string code unit occupies one byte.
  function pack(win, pages) {
    const chunks = [], offsets = [0];
    let size = 0;
    function append(part) {
      chunks.push(part);
      size += typeof part === 'string' ? part.length : part.size;
    }
    function object(id, ...parts) {
      offsets[id] = size;
      append(id + ' 0 obj\n');
      parts.forEach(append);
      append('\nendobj\n');
    }
    append('%PDF-1.4\n');
    append(new win.Blob([new Uint8Array([37, 255, 255, 255, 255, 10])]));
    object(1, '<< /Type /Catalog /Pages 2 0 R >>');
    const kids = pages.map((_, i) => (3 + 3 * i) + ' 0 R').join(' ');
    object(2, '<< /Type /Pages /Count ' + pages.length + ' /Kids [' + kids + '] >>');
    pages.forEach((jpeg, i) => {
      const id = 3 + 3 * i;
      object(id, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.276 841.890] /Resources << /XObject << /P ' +
        (id + 2) + ' 0 R >> >> /Contents ' + (id + 1) + ' 0 R >>');
      const paint = 'q\n595.276 0 0 841.890 0 0 cm\n/P Do\nQ\n';
      object(id + 1, '<< /Length ' + paint.length + ' >>\nstream\n', paint, 'endstream');
      object(id + 2, '<< /Type /XObject /Subtype /Image /Width ' + W + ' /Height ' + H +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' +
        jpeg.size + ' >>\nstream\n', jpeg, '\nendstream');
    });
    const start = size;
    append('xref\n0 ' + offsets.length + '\n0000000000 65535 f \n');
    for (const offset of offsets.slice(1)) append(String(offset).padStart(10, '0') + ' 00000 n \n');
    append('trailer\n<< /Size ' + offsets.length + ' /Root 1 0 R >>\nstartxref\n' + start + '\n%%EOF\n');
    return new win.Blob(chunks, {type: 'application/pdf'});
  }

  async function create(win, items, pictures, mode, guard) {
    if (!Array.isArray(items) || !items.length || items.length > 700 ||
        !['questions', 'explanations'].includes(mode)) throw Error('Invalid worksheet');
    const check = () => { if (guard && guard() === false) throw Error('Worksheet cancelled'); };
    check();
    const canvas = win.document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', {alpha: false});
    const pages = [];
    let count = 0;
    function font(size, bold) {
      ctx.font = (bold ? 'bold ' : '') + size + 'px system-ui, sans-serif';
    }
    function page(title) {
      check();
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = '#111';
      ctx.textBaseline = 'top';
      font(44, true);
      ctx.fillText(title, margin, margin);
    }
    async function save() {
      check();
      const jpeg = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.94));
      check();
      if (!jpeg || jpeg.type !== 'image/jpeg' || !jpeg.size) throw Error('JPEG encoding failed');
      pages.push(jpeg);
    }
    async function draw(path, x, y, width) {
      const {url, ratio} = pictures.get(path);
      if (!/^blob:/.test(url)) throw Error('Expected local blob URL');
      const img = new win.Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = () => reject(Error('Cannot decode ' + path));
        img.src = url;
      });
      check();
      if (!img.naturalWidth || !img.naturalHeight) throw Error('Empty image');
      ctx.drawImage(img, x, y, width, width * ratio);
    }
    const top = margin + 78;
    async function questions() {
      page('문제지');
      ctx.imageSmoothingQuality = 'high';
      const columnWidth = (W - 2 * margin - 36) / 2;
      let col = 0, y = top;
      for (const [i, q] of items.entries()) {
        const paths = q.common ? [q.common.image, q.image] : [q.image];
        const ratios = paths.map(path => pictures.get(path)?.ratio);
        if (ratios.some(r => !Number.isFinite(r) || r <= 0)) throw Error('Invalid image ratio');
        const total = ratios.reduce((a, b) => a + b);
        const overhead = 139 + 10 * paths.length;
        const width = Math.min(columnWidth, (bottom - top - overhead) / total);
        const height = overhead + width * total;
        if (y > top && y + height > bottom) {
          if (col === 1) { await save(); page('문제지'); }
          col = 1 - col;
          y = top;
        }
        const x = margin + col * (columnWidth + 36);
        font(32, true);
        ctx.fillText(String(i + 1), x, y);
        y += 36;
        font(23);
        ctx.fillText('(' + q.exam + '회-' + q.number + '번)', x, y);
        y += 41;
        for (const [n, path] of paths.entries()) {
          await draw(path, x, y, width);
          y += width * ratios[n] + 10;
        }
        font(28);
        ctx.fillText('내 답   ①    ②    ③    ④    ⑤', x, y);
        y += 62;
        count++;
      }
    }
    async function explanations() {
      page('정답표');
      const cols = Math.max(8, Math.ceil(items.length / 35));
      const width = (W - 2 * margin) / cols;
      let answers = 0;
      for (const [i, q] of items.entries()) {
        const answer = q.review.correctNumber;
        if (!Number.isInteger(answer) || !digits[answer - 1]) throw Error('Invalid answer');
        const x = margin + (i % cols) * width, y = top + Math.floor(i / cols) * 60;
        ctx.strokeRect(x, y, width, 60);
        ctx.textAlign = 'center';
        font(21);
        ctx.fillText(String(i + 1), x + width / 2, y + 2);
        font(29, true);
        ctx.fillText(digits[answer - 1], x + width / 2, y + 26);
        answers++;
      }
      if (answers !== items.length) throw Error('Incomplete answer table');
      ctx.textAlign = 'left';
      await save();
      page('문항별 해설');
      let y = top;
      async function space(height) {
        if (y + height > bottom) { await save(); page('문항별 해설'); y = top; }
      }
      async function line(value) {
        await space(44);
        font(30);
        ctx.fillText(value, margin, y);
        y += 44;
      }
      async function paragraph(value) {
        for (const part of value.split(/\r\n?|\n/)) {
          let buffer = '';
          font(30);
          for (const ch of part) {
            if (buffer && ctx.measureText(buffer + ch).width > W - 2 * margin) {
              await line(buffer);
              buffer = '';
            }
            buffer += ch;
          }
          await line(buffer);
        }
      }
      for (const [i, q] of items.entries()) {
        await space(100);
        font(34, true);
        ctx.fillText(caption(q, i), margin, y);
        y += 52;
        const parts = q.parts || {};
        let has = false;
        async function section(label, lines) {
          const value = lines.filter(Boolean).join(' ').replace(/\*\*/g, '').trim();
          if (value) { has = true; await paragraph(label + ' ' + value); }
        }
        await section('지문 해설', parts.stem || []);
        for (const [n, lines] of (q.choices || []).entries()) await section(digits[n], lines);
        await section('결론', [parts.conclusion].concat(parts.extra || []));
        if (!has) await paragraph('확인된 해설이 없습니다.');
        y += 24;
        count++;
      }
    }
    try {
      if (mode === 'questions') await questions();
      else await explanations();
      if (count !== items.length) throw Error('Incomplete worksheet');
      await save();
      return pack(win, pages);
    } finally {
      canvas.width = canvas.height = 0;
    }
  }
  root.HanqCbtWorksheetPdf = {create};
})(window);
