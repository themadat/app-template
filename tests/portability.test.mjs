import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

function harness() {
  const nodes = new Map(), events = [], messages = [];
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, { listeners: {}, addEventListener(name, listener) { this.listeners[name] = listener; } });
    return nodes.get(selector);
  }
  const before = { workspace: { title: 'Current', records: [], documents: [{ html: 'Keep me' }] }, modules: { iconLibrary: { overrides: [{ iconId: 'a' }] } }, preferences: { appearance: { mode: 'dark', textScale: 1 } }, meta: { updatedAt: '' }, schemaVersion: 4 };
  const incoming = structuredClone(before); incoming.workspace.title = 'Imported'; incoming.workspace.documents[0].html = 'Replacement'; incoming.modules.iconLibrary.overrides = [];
  let current = before;
  const app = {
    config: { controls: { maxImportBytes: 10000, maxDocumentHtmlLength: 10000 } },
    utils: { dateLabel: value => value, richTextToPlainText: String },
    stateModel: { prepare: value => ({ state: value, migrations: [], validation: { warnings: [] } }) },
    storage: { getState: () => current, saveRecovery() { events.push('recovery'); return h.recoveryWorks; }, replace(value, options) { assert.equal(options.saveRecovery, false); events.push('replace'); current = value; } },
    components: {
      setLoading() {},
      confirm: async () => { events.push('confirm'); return h.accepted; },
      message: (title, message) => messages.push(message),
      toast: () => events.push('toast'),
      openDialog: () => events.push('preview'),
      closeDialog: () => events.push('close')
    },
    tables: { mount: (container, options) => { h.rows = options.rows; } }
  };
  const context = vm.createContext({ window: { LocalApp: app }, document: { querySelector: node } });
  const h = { app, events, messages, incoming, before, recoveryWorks: true, accepted: true, nodes, get current() { return current; } };
  for (const file of ['import-review', 'portability']) vm.runInContext(readFileSync(new URL('../assets/js/core/' + file + '.js', import.meta.url), 'utf8'), context);
  app.portability.init();
  h.preview = () => app.portability.previewFile({ name: 'sample.json', size: 100, text: async () => JSON.stringify(incoming) });
  h.commit = () => node('[data-import-confirm]').listeners.click();
  return h;
}

test('backup review compares current and incoming edits without mutation, then confirms and recovers before replacing', async () => {
  const h = harness();
  assert(await h.preview()); assert.equal(h.current, h.before);
  const edits = h.rows.find(row => row.item === 'Edited icons');
  assert.equal(edits.current, 1); assert.equal(edits.imported, 0);
  assert(await h.commit());
  assert.deepEqual(h.events, ['preview', 'confirm', 'recovery', 'replace', 'close', 'toast']);
  assert.equal(h.current.workspace.title, 'Imported');
});

test('backup replacement requires confirmation and a successful recovery save', async () => {
  const h = harness(); await h.preview(); h.accepted = false;
  assert(!(await h.commit())); assert.equal(h.current, h.before); assert(!h.events.includes('recovery'));
  h.accepted = true; h.recoveryWorks = false;
  assert(!(await h.commit())); assert.equal(h.current, h.before); assert(!h.events.includes('replace'));
  assert.match(h.messages[0], /could not be saved for recovery/);
  assert.equal(h.nodes.get('[data-import-confirm]').disabled, false);
});

test('malformed and oversized files do not open review or replace data', async () => {
  const h = harness();
  assert(!(await h.app.portability.previewFile({ name: 'bad.json', size: 2, text: async () => '{' })));
  assert.match(h.messages[0], /not valid JSON/);
  h.app.utils.formatBytes = () => '10 KB';
  assert(!(await h.app.portability.previewFile({ size: 10001, text: () => assert.fail('Oversized read') })));
  assert.equal(h.current, h.before); assert.equal(h.events.length, 0); assert(!(await h.commit()));
});
