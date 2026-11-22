'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { allowed } = require('./build-static-site.cjs');
const root = path.resolve(__dirname, '..');
const prefix = 'media/history-summary/';
const read = name => fs.readFileSync(path.join(root, prefix, name), 'utf8');
const raw = read('pages-v49.json');
const pages = JSON.parse(raw);
const html = read('index.html');
const gallery = pages.slice(7).map(p => p.sections.flatMap(s => s.cards || []));
assert.deepEqual(pages.map(p => p.page), [1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.deepEqual(gallery.map(items => items.length), [37, 40]);
assert(gallery.flat().every(card => card.title && Array.isArray(card.items)));
assert(!/libfile|Sentinel|\.pdf|한동|blockmonkey|모든 폭탄사건/i.test(raw));
assert(/김상옥·김익상 등의 의거/.test(raw));
assert(/이곡의 아들 · 《목은집》/.test(raw));
assert(!/api-client|https?:\/\/|iframe|pdf/i.test(html));
assert(allowed(prefix + 'index.html') && allowed(prefix + 'pages-v49.json'));
const photos = gallery.flat().filter(c => c.image);
assert.equal(photos.length, 70);
assert.deepEqual(gallery.map(g => g.filter(c => c.imageOrigin === 'master').length), [37, 24]);
assert.deepEqual(gallery.map(g => g.filter(c => c.image && !c.imageOrigin).length), [0, 9]);
const actualFiles = fs.readdirSync(path.join(root,prefix,'images')).sort().map(n => 'images/'+n);
assert.deepEqual(actualFiles, photos.map(p => p.image).sort());
for (const p of photos) {
  assert(/^images\/p[89]-\d{2}\.webp$/.test(p.image));
  if (!p.imageOrigin) assert(p.source);
  if (p.source) {
    assert(/^https:\/\/(?:www\.museum\.go\.kr|vcm\.museum\.go\.kr|gyeongju\.museum\.go\.kr|encykorea\.aks\.ac\.kr)\//.test(p.source.url));
  assert(/공공누리 [01]유형/.test(p.source.label));
  }
  assert(allowed(prefix + p.image));
  const buf = fs.readFileSync(path.join(root,prefix,p.image));
  assert.equal(buf.subarray(8,12).toString(), 'WEBP');
}
const historical = fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(/복습 노트/.test(historical) && /requireStudyLogin/.test(historical));
assert(/window\.location\.assign\('media\/history-summary\/index\.html'\)/.test(historical));
console.log(JSON.stringify({pages:pages.length,galleryCards:gallery.flat().length,photos:photos.length,creditedPhotos:photos.filter(p => p.source).length,originalPhotos:photos.filter(p => p.imageOrigin === 'master').length,publicReaderDoesNotLoadAuthClient:true}));
