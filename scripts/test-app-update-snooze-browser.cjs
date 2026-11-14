'use strict';
// Synthetic origin and browser storage only. No production requests.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const out = process.env.ARTIFACT_DIR || path.join(root, '../evidence/study-ui-snooze');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH });
  const results = [];
  try {
    for (const width of [320, 390, 1440]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: 'Asia/Seoul' });
      const errors = [];
      await context.addInitScript(() => { const now = Date.now; window.clockShift = 0; Date.now = () => now() + clockShift; });
      await context.route('**/*', route => {
        const url = new URL(route.request().url());
        assert.equal(url.origin, 'https://snooze.test');
        if (url.pathname === '/app-version.json') return route.fulfill({ json: { schema: 1, buildId: 'b'.repeat(40) } });
        if (url.pathname === '/media/app-update.js' || url.pathname === '/media/app-update.css') return route.fulfill({ path: path.join(root, url.pathname) });
        return route.fulfill({ contentType: 'text/html', body: '<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="hanq-app-version" content="' + 'a'.repeat(40) + '"><link rel="stylesheet" href="/media/app-update.css"><main><h1>업데이트 알림 검수</h1></main><script src="/media/app-update.js"></script>' });
      });
      const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
      await page.goto('https://snooze.test/?keep=1#subjects');
      await page.locator('.app-update:visible').waitFor();
      await page.evaluate(() => { localStorage.setItem('synthetic-learning', 'answer'); sessionStorage.setItem('synthetic-session', 'keep'); });
      await page.getByRole('button', { name: '나중에', exact: true }).click();
      const deadline = await page.evaluate(() => localStorage.getItem('hanq:app-update:snooze-local-day:v1'));
      await page.reload(); await page.locator('.app-update').waitFor({ state: 'attached' });
      assert(await page.locator('.app-update').isHidden());
      const other = await context.newPage(); await other.goto('https://snooze.test/#subjects');
      await other.locator('.app-update').waitFor({ state: 'attached' }); assert(await other.locator('.app-update').isHidden());
      await page.evaluate(() => { dispatchEvent(new Event('focus')); dispatchEvent(new Event('pageshow')); document.dispatchEvent(new Event('visibilitychange')); });
      assert(await page.locator('.app-update').isHidden());
      assert.equal(await page.evaluate(() => localStorage.getItem('hanq:app-update:snooze-local-day:v1')), deadline);
      await page.evaluate(() => { const boundary = new Date(Date.now()); boundary.setHours(24,0,0,0); clockShift += boundary.getTime() - Date.now() + 1000; location.hash = '#joseon/quiz'; dispatchEvent(new Event('focus')); });
      await page.locator('.app-update:visible').waitFor();
      assert(await page.getByRole('button', { name: '새 버전 적용', exact: true }).isDisabled());
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(await page.evaluate(() => [localStorage.getItem('synthetic-learning'), sessionStorage.getItem('synthetic-session')]), ['answer', 'keep']);
      assert.equal(new URL(page.url()).searchParams.get('keep'), '1');
      fs.mkdirSync(out, { recursive: true }); await page.screenshot({ path: path.join(out, 'expiry-' + width + '.png') });
      assert.deepEqual(errors, []); results.push({ width, reloadRestored: true, secondTabRestored: true, resumeSuppressed: true, deadlinePreserved: true, expiryVisible: true, studyApplyBlocked: true, storagePreserved: true, noOverflow: true });
      await context.close();
    }
  } finally { await browser.close(); }
  fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'result.json'), JSON.stringify({ results, productionRequests: 0 }, null, 2));
  console.log(JSON.stringify({ cases: results.length, widths: results.map(r => r.width), productionRequests: 0, passed: true }));
})().catch(error => { console.error(error); process.exitCode = 1; });
