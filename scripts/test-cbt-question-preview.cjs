'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {webcrypto} = require('node:crypto');
const {JSDOM} = require(process.env.HANQ_JSDOM_PATH || 'jsdom');
const dom = new JSDOM('<main></main>', {runScripts:'outside-only', url:'https://fixture.test'});
const win = dom.window;
Object.defineProperty(win.crypto, 'subtle', {value:webcrypto.subtle});
win.eval(fs.readFileSync('media/cbt-question-preview.js', 'utf8'));

function source(width, height) {
  const img = win.document.createElement('img');
  Object.defineProperties(img, {naturalWidth:{value:width}, naturalHeight:{value:height}});
  img.src = 'blob:fixture';
  win.document.querySelector('main').replaceChildren(img);
  return img;
}

(async function () {
  const q = {exam:70, number:2}, original = new Blob([fs.readFileSync('media/cbt-originals/70-02.webp')]);
  win.HTMLCanvasElement.prototype.getContext = () => null;
  const im = source(657, 713);
  await win.HanqQuestionPreview.apply(im, q, new Blob(['updated question']));
  assert.equal(im.parentElement.tagName, 'MAIN');
  await win.HanqQuestionPreview.apply(im, q, original);
  assert.equal(im.parentElement.style.aspectRatio, '657 / 647');
  assert.equal(im.src, 'blob:fixture');

  // A single nearly white source pixel at the far right must survive the ordinary crop.
  let start;
  win.HTMLCanvasElement.prototype.getContext = () => ({
    clearRect() {}, drawImage(_, x, y) { start = y; },
    getImageData(x, y, width, rows) {
      const data = new Uint8ClampedArray(width * rows * 4).fill(255);
      if (start <= 50 && start + rows > 50) data[4 * ((50 - start) * width + width - 1)] = 254;
      return {data};
    }
  });
  const faint = source(80, 120);
  win.HanqQuestionPreview.apply(faint, {exam:80, number:1});
  assert.equal(faint.parentElement.style.aspectRatio, '80 / 63');
  const short = source(80, 70);
  win.HanqQuestionPreview.apply(short, {exam:80, number:1});
  assert.equal(short.parentElement.tagName, 'MAIN');
  dom.window.close();
  console.log('PASS verified footer, changed bytes, faint edge, short margin and original URL');
})().catch(e => { console.error(e); process.exitCode = 1; });
