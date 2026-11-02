// Full index, synthetic credentials and API only; never connects to production.
'use strict';
const fs = require('fs'), path = require('path'), assert = require('assert/strict'), pw = require('playwright');
const root = path.resolve(__dirname, '..'), out = path.resolve(root, '../evidence/rainbow-entry');
const origin = 'https://entry.test', owner = '11111111-1111-4111-8111-111111111111';
const session = {accessToken: 'synthetic-only', user: {id: owner, displayName: '격리 로그인 검수'}};
const results = [];
(async () => {
  for (const engine of (process.env.QA_ENGINE ? [process.env.QA_ENGINE] : ['chromium', 'webkit'])) {
    const browser = await pw[engine].launch(engine === 'chromium' ? {channel: 'chrome'} : {});
    try {
      for (const scenario of ['guest-login', 'failed-restore', 'delayed-restore', 'expired-on-island', 'explicit-logout']) {
        const p = await browser.newPage({viewport: {width: 390, height: 900}, reducedMotion: 'reduce'});
        let signedIn = ['delayed-restore', 'expired-on-island', 'explicit-logout'].includes(scenario);
        let external = 0, errors = [], mutations = [];
        await p.addInitScript(restore => {if (restore) localStorage.setItem('hanqacct:signedIn', '1');}, scenario !== 'guest-login');
        p.on('pageerror', e => errors.push(e.message));
        await p.route('**/*', async r => {
          const u = new URL(r.request().url()), j = (data, status = 200) => r.fulfill({json: data, status});
          if (u.origin !== origin) {external++; return r.abort();}
          if (u.pathname.startsWith('/api/v1/')) {
            if (u.pathname === '/api/v1/auth/refresh') {
              if (scenario === 'delayed-restore') await new Promise(resolve => setTimeout(resolve, 500));
              return signedIn ? j(session) : j({error: {code: 'unauthorized'}}, 401);
            }
            if (u.pathname === '/api/v1/auth/signin') {signedIn = true; mutations.push('synthetic-signin'); return j(session);}
            if (u.pathname === '/api/v1/auth/logout') {signedIn = false; mutations.push('synthetic-logout'); return j({});}
            if (r.request().method() !== 'GET') {mutations.push(u.pathname); return j({error: {code: 'unexpected_write'}}, 400);}
            if (u.pathname === '/api/v1/me') return signedIn ? j({user: session.user, growth: {points: 1000}, premium: {active: true}, access: {total: 1, today: true, freeSlots: []}}) : j({error: {code: 'unauthorized'}}, 401);
            return j({items: [], notes: [], progress: [], available: false});
          }
          const f = path.resolve(root, '.' + (u.pathname === '/' ? '/index.html' : u.pathname));
          return f.startsWith(root + '/') && fs.existsSync(f) && fs.statSync(f).isFile() ? r.fulfill({path: f}) : r.fulfill({status: 404, body: ''});
        });
        await p.goto(origin + '/#rainbow');
        if (scenario === 'expired-on-island') {
          await p.locator('.rainbow-island').waitFor(); signedIn = false;
          await p.evaluate(() => HanqApi.me().catch(() => null));
        }
        if (scenario === 'explicit-logout') {await p.locator('.rainbow-island').waitFor(); await p.locator('#headerLogout').click();}
        if (scenario !== 'delayed-restore') {
          await p.locator('#acAuthForm').waitFor();
          assert.equal(new URL(p.url()).hash, '#account');
          assert.equal(await p.locator('.rainbow-island').count(), 0, 'login protection remains intact');
          await p.locator('#acEmail').fill('fixture@example.test');
          await p.locator('#acPw').fill('synthetic-password');
          await p.locator('#acAuthSubmit').click();
        }
        await p.waitForFunction(() => HanqApi.state().signedIn && HanqApi.state().profileStatus === 'ready');
        // Wait until the real form promise callback has also settled.
        await p.waitForFunction(() => !document.querySelector('#acAuthForm'));
        await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
        const observed = {hash: new URL(p.url()).hash, island: await p.locator('.rainbow-island').count(), map: await p.locator('.wm-rainbow').count()};
        const pass = scenario === 'explicit-logout' ? observed.hash === '#subjects' && observed.map === 1 : observed.hash === '#rainbow' && observed.island === 1;
        if (pass && scenario !== 'explicit-logout') assert.equal(await (async()=>{let locked=0;for(const f of ['gabumon','patamon']){await p.locator('[data-select="'+f+'"]').click();await p.locator('#riOverlay:not([hidden])').waitFor();if(await p.locator('[data-action="claim"]').isDisabled())locked++;await p.keyboard.press('Escape');await p.locator('.ri-overlay[hidden]').waitFor({state:'attached'});}return locked;})(), 2, 'old API actions still locked');
        assert.deepEqual(errors, []); assert.equal(external, 0);
        assert(mutations.every(v => v === 'synthetic-signin' || v === 'synthetic-logout'));
        await p.screenshot({path: out + '/' + engine + '-' + scenario + '-' + (process.env.QA_LABEL || 'before') + '.png'});
        results.push({engine, scenario, pass, observed, errors, external, mutations});
        await p.close();
      }
    } finally {await browser.close();}
  }
  const result = {passed: results.every(r => r.pass), results};
  fs.writeFileSync(out + '/auth-' + (process.env.QA_LABEL || 'before') + '.json', JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result));
  if (!result.passed) process.exitCode = 1;
})().catch(e => {console.error(e); process.exitCode = 1;});
