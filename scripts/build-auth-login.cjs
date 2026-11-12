'use strict';
const fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '..');
function data(file, mime) { return 'data:' + mime + ';base64,' + fs.readFileSync(path.join(root, file)).toString('base64'); }
let css = fs.readFileSync(path.join(root, 'media/auth-digivice.css'), 'utf8');
const ids = { acAuthSubmit: 'submit', acEmail: 'email', acPw: 'password', acName: 'nickname', acAuthMsg: 'message' };
for (const [before, after] of Object.entries(ids)) css = css.replace(new RegExp('#' + before + '(?![A-Za-z])', 'g'), '#' + after);
css = css.replace("url('world-art/toeic-v1.webp')", "url('" + data('media/world-art/toeic-v1.webp', 'image/webp') + "')");
const values = { AUTH_CSS: css, FONT: data('media/fonts/neodgm.woff2', 'font/woff2'), BACKDROP: data('media/file-island-cutout.webp', 'image/webp'), KOROMON: data('media/characters/koromon-scene.webp', 'image/webp'), GREYMON: data('media/characters/greymon-scene.webp', 'image/webp') };
const template = fs.readFileSync(path.join(__dirname, 'auth-login.template.html'), 'utf8');
const html = template.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => { if (!values[key]) throw Error('Unknown template key ' + key); return values[key]; });
if (process.argv.includes('--check')) {
  if (fs.readFileSync(path.join(root, 'auth/login.html'), 'utf8') !== html) throw Error('auth/login.html is out of date; run node scripts/build-auth-login.cjs');
  console.log('PASS standalone auth page matches source template and public presentation assets');
} else { fs.writeFileSync(path.join(root, 'auth/login.html'), html); console.log('Generated auth/login.html: ' + Buffer.byteLength(html) + ' bytes'); }
