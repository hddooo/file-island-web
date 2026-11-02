const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');

(async () => {
  const requests = [], mounts = [], progress = [];
  let failing = '', wrongBank = false;
  const window = {
    HanqVocabularyMini: {
      audioReady: () => true,
      mount: (_host, options) => {
        mounts.push(options);
        return {ready: options.api.weaknessProgress(options.bank.bankId), stop() {}};
      },
    },
    fetch: async url => {
      requests.push(url);
      if (failing && url.includes(failing)) throw Error('offline');
      const chapterId = /chapter-(\d{3})-v1/.exec(url)[1];
      return {ok: true, json: async () => url.endsWith('bank.json') ? {
        chapterId: 'vocab-' + chapterId + '-v1',
        bankId: 'vocab-mini-' + (wrongBank ? '001' : chapterId) + '-v1',
        contentVersion: 1,
      } : {status: 'ready'}};
    },
  };
  const context = {
    window, URL, AbortController, setTimeout, clearTimeout,
    location: {href: 'https://hanq.vercel.app/'},
    document: {querySelector: () => ({}), head: {appendChild() {}}},
  };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'media/vocabulary-mini-loader.js'), 'utf8'), context);
  const api = {weaknessProgress: async bankId => {
    progress.push(bankId);
    return {bankId, items: [], release: {ready: true, contentVersion: 1}};
  }};
  const loader = window.HanqVocabularyMiniLoader;
  for (const id of ['001', '002', '003', '002']) {
    await loader.open({}, api, () => true, 'vocab-' + id + '-v1');
  }
  assert.equal(requests.length, 6, 'one bank and manifest per selected chapter, cached separately');
  assert.deepEqual(mounts.map(x => x.bank.bankId), ['001', '002', '003', '002'].map(n => 'vocab-mini-' + n + '-v1'));
  assert.equal(progress.length, 4, 'each opening revalidates server, mount reuses that exact progress response');
  for (const mount of mounts) assert(mount.assetRoot.includes(mount.bank.chapterId.replace('vocab-', 'chapter-')));
  await assert.rejects(loader.open({}, api, () => true, 'vocab-004-v1'), /chapter/);
  assert.equal(requests.length, 6, 'unregistered chapter cannot fetch an arbitrary directory');
  // New loader instance: a failed chapter must retry without evicting another bank.
  vm.runInNewContext(fs.readFileSync(path.join(root, 'media/vocabulary-mini-loader.js'), 'utf8'), context);
  failing = 'chapter-002';
  await assert.rejects(window.HanqVocabularyMiniLoader.open({}, api, () => true, 'vocab-002-v1'), /offline/);
  await window.HanqVocabularyMiniLoader.open({}, api, () => true, 'vocab-001-v1');
  failing = '';
  await window.HanqVocabularyMiniLoader.open({}, api, () => true, 'vocab-002-v1');
  wrongBank = true;
  await assert.rejects(window.HanqVocabularyMiniLoader.open({}, api, () => true, 'vocab-003-v1'), /asset mismatch/);

  const renderer = {window: {}};
  vm.runInNewContext(fs.readFileSync(path.join(root, 'media/vocabulary-mini.js'), 'utf8'), renderer);
  const originalBank = JSON.parse(fs.readFileSync(path.join(root, 'media/vocabulary-mini/chapter-001-v1/bank.json')));
  const originalAudio = JSON.parse(fs.readFileSync(path.join(root, 'media/vocabulary-mini/chapter-001-v1/audio-manifest.json')));
  for (const id of ['001', '002', '003']) {
    const bank = {...originalBank, bankId: 'vocab-mini-' + id + '-v1'};
    const audio = {...originalAudio, bankId: bank.bankId, records: originalAudio.records.map(a => ({...a, url: a.url.replace('chapter-001', 'chapter-' + id)}))};
    assert(renderer.window.HanqVocabularyMini.audioReady(bank, audio));
    if (id !== '001') assert.equal(renderer.window.HanqVocabularyMini.audioReady(bank, originalAudio), false, 'another chapter audio must not unlock this exam');
    audio.records[0].url = audio.records[0].url.replace('chapter-' + id, 'chapter-999');
    assert.equal(renderer.window.HanqVocabularyMini.audioReady(bank, audio), false);
  }
  console.log('PASS chapter loader isolation, lazy cache/retry, registration and audio-bank matching');
})().catch(error => { console.error(error); process.exitCode = 1; });
