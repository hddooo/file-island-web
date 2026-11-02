/* Content identity and integration checks; semantic review is documented separately. */
const fs = require('fs'), path = require('path'), vm = require('vm');
const assert = require('assert/strict'), cp = require('child_process');
const root = path.resolve(__dirname, '..');
const id = 'focus-connectors-v4-100';
const bank = JSON.parse(fs.readFileSync(path.join(root, 'media/weakness-banks', id + '.json')));
const dataFile = 'media/toeic-grammar-data.js';
function load(source) { const ctx = {window: {}}; vm.createContext(ctx); vm.runInContext(source, ctx); return JSON.parse(JSON.stringify(ctx.window)); }
const current = load(fs.readFileSync(path.join(root, dataFile), 'utf8'));
const previous = load(cp.execFileSync('git', ['show', '5855d5a:' + dataFile], {cwd: root, encoding: 'utf8'}));
const plan = current.HANQ_WEAKNESS_LEARNING;
assert.equal(plan.chapters.length, 3);
assert.deepEqual(plan.chapters.map(c => c.id), previous.HANQ_WEAKNESS_LEARNING.chapters.map(c => c.id));
for (const c of plan.chapters.filter(c => c.id !== 'clauses-connectors')) {
  assert.deepEqual(c, previous.HANQ_WEAKNESS_LEARNING.chapters.find(p => p.id === c.id));
}
const chapter = plan.chapters.find(c => c.id === 'clauses-connectors');
assert.equal(chapter.bankId, id);
assert.deepEqual(chapter.recallTables.map(t => t.id), ['conjunctions', 'prepositions', 'adverbs']);
for (const table of chapter.recallTables) {
  assert(table.rows.every(row => row.length === 3 && row.every(Boolean)));
  assert(table.rows.every(row => !row[0].includes(' / ')), 'one expression per row');
}
assert.deepEqual(chapter.conditionRecall.rows.map(r => r[0]), ['if so', 'if not']);
assert(!chapter.recallTables[2].rows.some(r => /if so|if not/.test(r[0])));
assert.equal(bank.questions.length, 100);
const positions = [0, 0, 0, 0], types = {}, stems = new Set(), ids = new Set();
const map = plan.questionLessons[id];
for (const q of bank.questions) {
  assert.equal(q.id, id + '-' + String(q.number).padStart(3, '0'));
  assert.equal(q.version, 1);
  assert(!ids.has(q.id)); ids.add(q.id);
  assert(!stems.has(q.stem)); stems.add(q.stem);
  assert.equal(new Set(q.choices.map(s => s.toLowerCase())).size, 4);
  assert.equal(q.optionDetails.length, 4);
  assert(q.clues.length > 0 && q.clues.every(s => q.stem.includes(s)));
  assert(q.optionDetails.every(o => o.form && o.meaning && o.reason));
  assert(q.translation && q.answer >= 0 && q.answer < 4);
  positions[q.answer]++; types[q.tags[0]] = (types[q.tags[0]] || 0) + 1;
  assert(chapter.lessons.some(l => l.id === map[q.number]));
  if (q.source) assert(q.source.set.includes('보기 재구성'));
}
assert.deepEqual(positions, [25, 25, 25, 25]);
assert.equal(types.conjunction, 20); assert.equal(types.preposition, 20); assert.equal(types.adverb, 20);
assert.equal(map[29], 'cn-concession');
for (const n of [39, 52, 56, 91]) assert.equal(map[n], 'cn-adverb');
assert(current.HANQ_TOEIC_GRAMMAR_DATA.archivedPracticeBanks.some(b => b.id === 'focus-connectors-v3-100'));
const oldFiles = cp.execFileSync('git', ['ls-tree', '-r', '--name-only', '5855d5a', 'media/weakness-banks'], {cwd: root, encoding: 'utf8'}).trim().split('\n');
for (const file of oldFiles) assert.equal(fs.readFileSync(path.join(root, file), 'utf8'), cp.execFileSync('git', ['show', '5855d5a:' + file], {cwd: root, encoding: 'utf8'}), file);
console.log('PASS 100 complete identities/cues/links, 60 structure + 40 context, balanced positions, 3 chapters, old bank bytes preserved');
