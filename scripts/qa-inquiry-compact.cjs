'use strict';
// Local browser rendering with synthetic transport. All network requests are intercepted.
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), { chromium } = require('playwright');
const ROOT = path.resolve(__dirname, '..'), OUT = path.resolve(ROOT, '../evidence'); fs.mkdirSync(OUT, { recursive: true });
const baseCss = fs.readFileSync(ROOT + '/index.html', 'utf8').match(/<style>([\s\S]*?)<\/style>/)[1];
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const results = [];
  try {
    for (const [width, height] of [[320, 900], [390, 844], [1440, 900], [640, 360]]) for (const theme of ['default', 'terminal']) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', r => r.request().url() === 'https://inquiry-fixture.test/' ? r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><main id="app"><a id="mapInquiry" href="/inquiries/">건의·문의</a><section id="host" class="ac-panel"></section></main></body></html>' }) : r.abort());
      await page.goto('https://inquiry-fixture.test/');
      await page.addStyleTag({ content: baseCss });
      for (const f of ['account-ui.css', 'terminal-theme.css', 'inquiry-ui.css']) await page.addStyleTag({ path: ROOT + '/media/' + f });
      await page.addStyleTag({ content: '#app{box-sizing:border-box;width:100%;max-width:1000px;margin:auto;padding:12px}#host{min-width:0}' });
      await page.evaluate(() => {
        const id = '11111111-1111-4111-8111-111111111111', qid = '33333333-3333-4333-8333-333333333333', date = '2026-11-05T12:00:00Z';
        window.qaCalls = [];
        window.qaState = { enabled: true, status: 'online', epoch: 1, signedIn: true, ownerId: id, user: { id, displayName: '합성 테스트 사용자', email: 'fixture@example.test', createdAt: date }, premium: { active: false }, growth: { points: 1000 }, access: { total: 1, today: true }, profileStatus: 'ready' };
        window.HanqApi = { enabled: () => true, state: () => window.qaState, init: async () => {}, onChange: () => () => {}, plan: async () => ({ plan: {}, checkout: { available: false } }), me: async () => ({ user: window.qaState.user, premium: window.qaState.premium }), portal: async (m, p, b) => {
          window.qaCalls.push({ m, p, b });
          if (p === '/api/v1/ops') throw { status: 403 };
          if (m === 'POST') return { id: qid };
          if (p.includes('?')) return { items: [{ id: qid, title: '긴 문의 제목과 내용을 확인하는 합성 테스트입니다 '.repeat(3), created_at: date }], total: 1 };
          return { inquiry: { id: qid, user_id: id }, messages: [{ sender_role: 'member', body: '학습 화면 관련 문의입니다.\n' + '매우긴연속문자열'.repeat(30), created_at: date }, { sender_role: 'admin', body: '관리자 답변입니다.\n문의 내용을 확인했습니다.', created_at: date }] };
        } };
      });
      for (const f of ['ui-locks.js', 'display-mode.js', 'inquiry-ui.js', 'account-ui.js']) await page.addScriptTag({ path: ROOT + '/media/' + f });
      await page.evaluate(async theme => { window.HanqDisplayMode.select(theme); await window.HanqAccountUI.render(document.querySelector('#host'), { view: 'main', go: () => {}, local: { attempts: () => [] } }); }, theme);
      await page.locator('.hq-inquiry-item summary').waitFor();
      await page.locator('.hq-inquiry-item summary').click(); await page.locator('.hq-inquiry-message').last().waitFor();
      assert.equal(await page.locator('.hq-inquiry-message').count(), 2);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.locator('#acInquiriesTitle').scrollIntoViewIfNeeded();
      if (width === 390 || width === 1440) await page.screenshot({ path: OUT + '/mypage-' + theme + '-' + width + '.png' });
      await page.locator('#mapInquiry').click(); await page.locator('dialog [name=title]').waitFor();
      const m = await page.locator('dialog').evaluate(d => { const b = d.getBoundingClientRect(); return { x: b.x, y: b.y, right: b.right, bottom: b.bottom, viewport: innerWidth, height: innerHeight, scrollWidth: d.scrollWidth, clientWidth: d.clientWidth, duplicateIds: [...d.querySelectorAll('[id]')].map(n => n.id).filter((x, i, all) => all.indexOf(x) !== i) }; });
      assert(m.x >= 0 && m.right <= width + 1 && m.y >= 0 && m.bottom <= height + 1); assert(m.scrollWidth <= m.clientWidth + 1); assert.deepEqual(m.duplicateIds, []);
      assert.equal(await page.locator('dialog [name=title]').evaluate(n => getComputedStyle(n).fontSize), '16px');
      assert(await page.locator('dialog button[type=submit]').evaluate(n => n.getBoundingClientRect().height >= 44));
      await page.locator('dialog [name=title]').fill('화면 문의'); await page.locator('dialog [name=body]').fill('테스트 내용입니다.');
      if (width === 390 || width === 1440) await page.screenshot({ path: OUT + '/composer-' + theme + '-' + width + '.png' });
      await page.locator('dialog button[type=submit]').click(); await page.getByText('문의를 보냈어요. MY PAGE의 내 문의에서 답변을 확인할 수 있어요.', { exact: true }).waitFor();
      assert.equal(await page.evaluate(() => qaCalls.filter(c => c.m === 'POST').length), 1);
      await page.keyboard.press('Escape'); assert.equal(await page.locator('dialog').count(), 0); assert.equal(await page.locator('#app').evaluate(n => n.inert), false); assert.equal(await page.locator('#mapInquiry').evaluate(n => document.activeElement === n), true);
      assert.deepEqual(errors, []); results.push({ width, height, theme, modalBounds: m, passed: true }); await page.close();
    }
  } finally { await browser.close(); }
  fs.writeFileSync(OUT + '/browser-results.json', JSON.stringify({ synthetic: true, productionRequests: 0, engine: 'Chromium', scenarios: results.length, results }, null, 2));
  console.log('compact inquiry browser QA: ' + results.length + ' scenarios passed');
})().catch(e => { console.error(e); process.exitCode = 1; });
