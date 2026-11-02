// Local synthetic browser checks: viewport bounds, explicit consent, keyboard recovery and legacy request gating.
const fs = require('fs'), path = require('path'), assert = require('node:assert/strict'), { chromium } = require('../.test-tools/node_modules/playwright');
const root = path.resolve(__dirname, '..'), out = process.env.ARTIFACT_DIR || path.resolve(root, '../evidence/invitations');
fs.mkdirSync(out, { recursive: true });
(async () => { const browser = await chromium.launch(); const results = []; try {
    for (const modern of [false, true])
        for (const size of [{ width: 320, height: 667 }, { width: 390, height: 844 }, { width: 1440, height: 844 }, { width: 844, height: 390 }]) {
            const p = await browser.newPage({ viewport: size });
            await p.route('https://battle.test/**', r => { const f = path.join(root, new URL(r.request().url()).pathname); return r.fulfill(fs.existsSync(f) && fs.statSync(f).isFile() ? { path: f } : { body: '<html><body><main></main></body></html>', contentType: 'text/html' }); });
            await p.goto('https://battle.test/');
            await p.evaluate(() => document.documentElement.dataset.hanqTheme = 'terminal');
            for (const token of fs.readFileSync(root + '/index.html', 'utf8').matchAll(/<link\b[^>]*rel="stylesheet"[^>]*>|<style[^>]*>[\s\S]*?<\/style>/g)) {
                const t = token[0], h = t.match(/href="([^"]+)"/);
                if (h && h[1].startsWith('media/'))
                    await p.addStyleTag({ path: path.join(root, h[1].split('?')[0]) });
                else if (t.startsWith('<style'))
                    await p.addStyleTag({ content: t.replace(/^<style[^>]*>|<\/style>$/g, '') });
            }
            await p.addScriptTag({ path: root + '/media/battle-island.js' });
            await p.evaluate(modern => { const f = { name: '합성 상대', character: 'agumon', characterName: '아구몬', hp: 50, maxHp: 50, atk: 10, def: 5, luk: 1, stageIndex: 3 }; window.clock = Date.now(); Date.now = () => clock; window.calls = []; window.pending = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', subject: 'history', status: 'pending', revision: 1, side: 'right', serverNow: clock, expiresAt: clock + (modern ? 10000 : 30000), fighters: { left: f, right: f } }; window.inbox = []; window.lobby = () => ({ serverNow: clock, participants: [{ ...f, id: 'b', isMe: false }], matchId: null, practiceBot: true, ...modern ? { invitations: inbox } : {} }); window.api = { state: () => ({ signedIn: true, ownerId: 'a', partnerEvolution: modern ? { agumon: { stage: 2 } } : null }), onChange: () => () => { }, battleStream: cb => { window.publish = cb; return () => { }; }, battle: async (m, route, data) => { calls.push({ m, route, data }); if (route.endsWith('/decline')) {
                    inbox = [];
                    return { ...pending, status: 'declined' };
                } return lobby(); } }; HanqBattle.mount(document.querySelector('main'), api, () => { }); window.openInvite = () => { inbox = [{ id: pending.id, subject: 'history', direction: 'incoming', name: '합성상대별명이긴경우테스트', expiresAt: pending.expiresAt }]; publish(modern ? 'invitations' : 'snapshot', modern ? { invitations: inbox } : { ...pending, fighters: { left: { ...f, name: inbox[0].name }, right: f } }); }; }, modern);
            await p.locator('.bi-lobby').waitFor();
            await p.locator('.bi-refresh').focus();
            await p.evaluate(() => openInvite());
            await p.locator('.bi-invite-dialog').waitFor();
            const box = await p.locator('.bi-invite-dialog').boundingBox();
            const geometry = box.x >= 0 && box.y >= 0 && box.x + box.width <= size.width && box.y + box.height <= size.height;
            await p.screenshot({ path: `${out}/${modern ? 'modern' : 'legacy'}-${size.width}.png` });
            const initial = await p.evaluate(() => document.activeElement.textContent);
            await p.keyboard.press('Shift+Tab');
            const back = await p.evaluate(() => document.activeElement.textContent);
            await p.keyboard.press('Tab');
            const forward = await p.evaluate(() => document.activeElement.textContent);
            await p.keyboard.press('Escape');
            await p.locator('.bi-invite-dialog').waitFor({ state: 'detached' });
            await p.waitForTimeout(50);
            const cancelFocus = await p.evaluate(() => document.activeElement.className);
            await p.evaluate(() => { pending.expiresAt = clock + 1000; openInvite(); clock += 1001; });
            await p.locator('.bi-invite-dialog').waitFor({ state: 'detached' });
            await p.waitForTimeout(50);
            const expiryFocus = await p.evaluate(() => document.activeElement.className);
            const calls = await p.evaluate(() => calls);
            results.push({ modern, ...size, box, geometry, initial, back, forward, cancelFocus, expiryFocus, legacySafe: modern || calls.every(c => !c.route.includes('sessionId') && !c.data?.sessionId && !['/suspend', '/me/evolve'].includes(c.route)) });
            await p.evaluate(() => HanqBattle.stop());
            await p.close();
        }
    fs.writeFileSync(out + '/result.json', JSON.stringify(results, null, 2));
    console.log(JSON.stringify(results, null, 2));
    {
        assert(results.every(r => r.geometry));
        assert(results.every(r => r.cancelFocus === 'bi-refresh' && r.expiryFocus === 'bi-refresh'));
        assert(results.every(r => r.legacySafe));
    }
}
finally {
    await browser.close();
} })().catch(e => { console.error(e.stack); process.exitCode = 1; });
