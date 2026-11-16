'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const search = require('../media/history-era-search');
const root = path.resolve(__dirname, '..');
const chapterFixtures = [
  { id: 'joseon', title: '조선시대' }, { id: 'goryeo', title: '고려 시대' },
  { id: 'joseon-late', title: '조선 후기', hidden: true, partOf: 'joseon' }
];
const index = search.indexChapters(chapterFixtures, { concepts: { 'joseon-late': {
  core: [{ rows: [['규장각', '정조의 개혁을 뒷받침한 기관']] }],
  recall: [{ q: '보기 전용 항목', a: '정답 전용 항목' }]
}}});
assert.equal(index.has('joseon-late'), false);
assert(index.get('joseon').some(x => x.key === '규장각'));
assert(!index.get('joseon').some(x => x.key.includes('전용항목')));
assert.deepEqual(search.matchSpan('왕의 국자 감 설치', search.folded('국자감')), [3, 7]);
assert.equal(search.folded('고려'), '고려');
assert.equal(search.matchSpan('고려', '조선'), null);

// Validate the exact currently-shipped era/term data without a browser.
const vm = require('node:vm');
const source = { window: null };
source.window = source;
vm.createContext(source);
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const asset of ['textbook-notes.js','era-full-summary-data.js','history81-verified-glossary.js'])
  vm.runInContext(fs.readFileSync(path.join(root, 'media', asset), 'utf8'), source);
vm.runInContext(html.slice(html.indexOf('var chapters='),html.indexOf('var app=document.getElementById')), source);
const produced = search.indexChapters(source.chapters, { concepts: source.HANQ_TEXTBOOK,
  summaries: source.HANQ_ERA_FULL_SUMMARIES, terms: source.HanqHistory81VerifiedGlossary.definitions });
const cases = [['노비 안검법', 'goryeo'], ['규장각', 'joseon'], ['무천', 'prehistory'],
  ['법화원', 'nambuk'], ['의열단', 'colonial'], ['4·19 혁명', 'modern']];
for (const [query, id] of cases) assert(produced.get(id).some(item => item.key.includes(search.folded(query))), query);
assert(produced.size >= 8);
assert(html.includes('<h2>시대별 학습</h2></div><div class="era-search-panel"'));
assert(html.includes('if(catalog&&window.HanqHistoryEraSearch)HanqHistoryEraSearch.mount(app,chapters);'));
console.log('시대별 검색: 실제 개념 데이터·정규화·라우트 연결 검증 통과');

if (process.argv.includes('--dom')) {
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<main>' + html.match(/<div class="era-search-panel"[\s\S]*?<\/p><\/div>/)[0] +
    '<section class="toc">' + source.chapters.filter(c => !c.hidden).map(c =>
      '<button class="period" data-id="' + c.id + '"><span class="period-text"><strong>' + c.title +
      '</strong><small>' + c.desc + '</small></span></button>').join('') + '</section></main>', {runScripts: 'outside-only'});
  const w = dom.window, doc = w.document;
  w.HANQ_TEXTBOOK = source.HANQ_TEXTBOOK;
  w.HANQ_ERA_FULL_SUMMARIES = source.HANQ_ERA_FULL_SUMMARIES;
  w.HanqHistory81VerifiedGlossary = source.HanqHistory81VerifiedGlossary;
  w.eval(fs.readFileSync(path.join(root, 'media/history-era-search.js'), 'utf8'));
  const host = doc.querySelector('main'), input = host.querySelector('input'), original = [...host.querySelectorAll('.period')];
  w.HanqHistoryEraSearch.mount(host, source.chapters);
  const type = value => { input.value = value; input.dispatchEvent(new w.Event('input')); };
  for (const [query, id] of cases) {
    type(query);
    const card = host.querySelector('.period.era-search-match[data-id="' + id + '"]');
    assert(card, query);
    assert([...card.querySelectorAll('mark')].some(m => search.folded(m.textContent) === search.folded(query)), query);
    assert.deepEqual([...host.querySelectorAll('.period')], original);
  }
  type('존재하지않는키워드<img>');
  assert.equal(host.querySelectorAll('.era-search-match, mark, img').length, 0);
  assert.equal(host.querySelector('[role=status]').textContent, '일치하는 시대가 없어요.');
  input.dispatchEvent(new w.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.equal(input.value, '');
  assert.equal(doc.activeElement, input);
  type('고려');
  host.querySelector('.era-search-panel button').click();
  assert.equal(input.value, '');
  type('노비안검법');
  assert.equal(host.querySelector('mark').textContent, '노비안검법');
  dom.window.close();
  console.log('시대별 검색: 형광펜, 일치 없음, 입력 지우기, 카드 보존 DOM 검증 통과');
}

if (process.argv.includes('--browser')) (async function () {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ executablePath: process.env.HANQ_CHROMIUM_PATH || '/usr/bin/chromium', args: ['--no-sandbox'] });
  try {
    for (const [width, company] of [[320, false], [390, false], [390, true], [1440, false]]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      const outside = [], errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== 'https://fixture.invalid') return route.abort();
        const relative = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        const file = path.resolve(root, relative);
        if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
          outside.push(relative); return route.fulfill({ status: 404, body: '' });
        }
        if (relative === 'media/api-client.js') {
          const override = `;HanqApi.state=function(){return {signedIn:true,ownerId:'qa-account',epoch:1,ready:true}};HanqApi.init=async()=>HanqApi.state();HanqApi.eraQuizAttempts=async()=>({items:[]});`;
          return route.fulfill({ contentType: 'text/javascript', body: fs.readFileSync(file, 'utf8') + override });
        }
        return route.fulfill({ path: file });
      });
      await page.goto('https://fixture.invalid/#past-exams');
      if (company) await page.locator('html').evaluate(el => { el.dataset.companyMode = 'on'; });
      const heading = page.getByRole('heading', { name: '시대별 학습', exact: true });
      await heading.waitFor();
      const input = page.getByRole('textbox', {name: '시대별 학습 키워드 검색'});
      const cards = page.locator('.toc .period');
      const original = await cards.count();
      assert(original >= 8);
      assert(await input.evaluate(node => node.closest('[data-era-search]').previousElementSibling.textContent === '시대별 학습'));
      for (const [query, cardId] of cases) {
        await input.fill(query);
        const card = page.locator('.toc .period.era-search-match[data-id="' + cardId + '"]');
        assert.equal(await card.count(), 1, query);
        assert((await card.locator('mark').allTextContents()).some(v => search.folded(v) === search.folded(query)));
        assert.equal(await cards.count(), original);
        assert.equal(await card.locator('mark').first().evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(255, 223, 87)');
      }
      await input.fill('확실히 없는 검색어 <img>');
      assert.equal(await page.locator('.era-search-match').count(), 0);
      assert.equal(await page.locator('.era-search-panel [role=status]').textContent(), '일치하는 시대가 없어요.');
      await input.press('Escape');
      assert.equal(await input.inputValue(), '');
      await input.fill('고려');
      await page.getByRole('button', { name: '검색어 지우기' }).click();
      assert.equal(await input.inputValue(), '');
      assert.equal(await page.locator('.era-search-match').count(), 0);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), 'horizontal overflow ' + width);
      await input.fill('노비안검법');
      await page.locator('.toc .period[data-id=goryeo]').click();
      await page.waitForURL('**/#chapter/goryeo/webtoon', {timeout:10000}).catch(async () => {
        assert.match(page.url(), /#chapter\/goryeo\/(?:webtoon|summary)$/);
      });
      await page.goBack();
      await heading.waitFor();
      assert.equal(await input.inputValue(), '');
      assert.deepEqual(errors, []);
      await page.close();
    }
  } finally { await browser.close(); }
  console.log('시대별 학습 검색: 4개 화면, 실제 라우팅 및 한글 검색 검증 통과');
})().catch(error => { console.error(error); process.exitCode = 1; });
