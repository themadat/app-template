import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function modules(...names) {
  const context = vm.createContext({ window: { LocalApp: {} } });
  for (const name of names) vm.runInContext(readFileSync(new URL('../assets/js/core/' + name + '.js', import.meta.url), 'utf8'), context);
  return context.window.LocalApp;
}
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

test('shared search balances providers, deduplicates, gates results and routes activation', () => {
  const { search } = modules('search');
  let opened, enabled = true;
  const remove = search.register({ id: 'items', search: () => Array.from({ length: 20 }, (_, id) => ({ id, title: 'Item ' + id })), activate: id => { opened = id; } });
  search.register({ id: 'settings', enabled: () => enabled, search: () => [{ id: 'theme', title: 'Theme' }, { id: 'theme', title: 'Duplicate' }], activate: () => {} });
  const found = search.query('item', { limit: 3 });
  assert.deepEqual(Array.from(found, r => r.type), ['items', 'settings', 'items']);
  assert.equal(search.query('item').filter(r => r.type === 'settings').length, 1);
  assert.equal(search.query('item', { only: 'items' }).length, 6);
  assert.equal(search.query('  ').length, 0);
  assert(search.activate('items', '7')); assert.equal(opened, '7');
  enabled = false; assert(!search.activate('settings', 'theme'));
  assert(search.query('item').every(r => r.type === 'items'));
  remove(); assert.equal(search.query('item').length, 0);
});

test('shared term matching supports unordered terms, literal punctuation and quoted boundaries', () => {
  const { search } = modules('search');
  assert(search.matches('Dark system theme', 'theme dark'));
  assert(search.matches('G Circle Fill', '"g" fill'));
  assert(!search.matches('Gear Fill', '"g" fill'));
  assert(!search.matches('G2 Fill', '"g" fill'));
  assert(search.matches('A [test] name', '[test]'));
  assert(!search.matches('Dark theme', 'dark light'));
});

test('table sorting handles numeric values and blanks without mutating input; filtering shares search rules', () => {
  const { tables } = modules('search', 'tables');
  const rows = [{ name: 'Item 10', value: 10 }, { name: 'Item 2', value: 2 }, { name: 'Empty', value: null }];
  const columns = [{ id: 'name' }, { id: 'value', type: 'number' }];
  assert.deepEqual(Array.from(tables.selectRows(rows, columns, '', { id: 'value', direction: 'desc' }), r => r.value), [10, 2, null]);
  assert.deepEqual(Array.from(tables.selectRows(rows, columns, '', { id: 'name', direction: 'asc' }), r => r.name), ['Empty', 'Item 2', 'Item 10']);
  assert.equal(tables.selectRows(rows, columns, '"item 2"', null).length, 1);
  assert.equal(tables.selectRows(rows, columns, 'absent', null).length, 0);
  assert.equal(rows[0].value, 10);
});

test('review never applies during preparation/preview; declined confirmation remains reviewable', async () => {
  const { importReview } = modules('import-review');
  let applied = 0, accepted = false;
  const review = importReview.create({ prepare: async value => value, onPreview: () => {}, confirm: async () => accepted, apply: () => { applied++; } });
  assert(!(await review.commit()));
  assert(await review.preview({ data: 'validated' })); assert.equal(applied, 0);
  assert(!(await review.commit())); assert.equal(applied, 0); assert.equal(review.getPhase(), 'reviewing');
  accepted = true; assert(await review.commit()); assert.equal(applied, 1);
  assert(!(await review.commit())); assert.equal(applied, 1);
});

test('cancelled/stale file reads cannot reopen a preview or apply data', async () => {
  const { importReview } = modules('import-review');
  const first = deferred(), second = deferred(); const previews = [];
  const review = importReview.create({ prepare: value => value, onPreview: value => previews.push(value), apply: () => assert.fail('Unexpected import') });
  const old = review.preview(first.promise), latest = review.preview(second.promise);
  second.resolve('new'); await latest; first.resolve('old'); await old;
  assert.deepEqual(previews, ['new']);
  const last = deferred(), pending = review.preview(last.promise); review.cancel(); last.resolve('cancelled'); await pending;
  assert.deepEqual(previews, ['new']); assert(!(await review.commit()));
});

test('repeated Continue is serialized and cancellation during confirmation prevents apply', async () => {
  const { importReview } = modules('import-review');
  const confirmation = deferred(); let applied = 0;
  const review = importReview.create({ prepare: async value => value, onPreview: () => {}, confirm: () => confirmation.promise, apply: () => { applied++; } });
  await review.preview('valid'); const pending = review.commit();
  assert(!(await review.commit())); assert(!(await review.preview('different')));
  review.cancel(); confirmation.resolve(true); assert(!(await pending)); assert.equal(applied, 0);
});

test('validation and recovery/apply failures report errors and allow retry without success', async () => {
  const { importReview } = modules('import-review');
  const errors = []; let fail = true, applied = 0;
  const review = importReview.create({ prepare: async value => { if (!value) throw new Error('Invalid'); return value; }, onPreview: () => {}, apply: () => { if (fail) throw new Error('Recovery failed'); applied++; }, onError: error => errors.push(error.message) });
  assert(!(await review.preview(null))); assert(!(await review.commit()));
  await review.preview('valid'); assert(!(await review.commit())); assert.equal(review.getPhase(), 'reviewing');
  assert.deepEqual(errors, ['Invalid', 'Recovery failed']); assert.equal(applied, 0);
  fail = false; assert(await review.commit()); assert.equal(applied, 1);
});
