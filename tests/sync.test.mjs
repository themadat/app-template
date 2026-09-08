import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test as nodeTest } from 'node:test';
const test = (name, fn) => nodeTest(name, { timeout: 5000 }, fn);
import vm from 'node:vm';

function harness({ token = 'test-token', online = true } = {}) {
  const events = [], requests = [], toasts = [], replacements = [];
  const listeners = new Map();
  const window = {
    addEventListener(name, callback) { listeners.set(name, callback); },
    dispatchEvent(event) { events.push(event); listeners.get(event.type)?.(event); },
    setInterval() {}, setTimeout() {}
  };
  const context = vm.createContext({ window, navigator: { onLine: online }, document: { addEventListener() {} },
    CustomEvent: class { constructor(type, options) { this.type = type; this.detail = options?.detail; } },
    TextEncoder, TextDecoder, Uint8Array, AbortController, structuredClone, atob, btoa, URL, console,
    fetch: async (url, options) => { requests.push({ url, options }); return h.respond(url, options); }
  });
  for (const file of ['config.js', 'icons.js', 'core/utils.js', 'core/state.js']) {
    vm.runInContext(readFileSync(new URL('../assets/js/' + file, import.meta.url), 'utf8'), context);
    // Fixtures contain plain text; DOM sanitization is exercised in browser checks.
    if (file === 'core/utils.js') window.LocalApp.utils = { ...window.LocalApp.utils, sanitizeRichHtml: String, richTextToPlainText: String };
  }
  const App = window.LocalApp;
  let state = App.stateModel.normalize(App.stateModel.createDefaultState({ demo: false }));
  const h = { App, context, events, requests, toasts, replacements, get state() { return state; }, get token() { return token; },
    respond: () => response(500), recoveryWorks: true, confirmation: false, choice: 'cancel', recovery: null
  };
  App.storage = {
    getState: () => state, hasSecret: () => Boolean(token), getSecret: () => token,
    setSecret(value) { token = value; return true; }, clearSecret() { token = ''; },
    mutate(callback) { callback(state); },
    saveRecovery() { if (!h.recoveryWorks) return false; h.recovery = structuredClone(state); return true; },
    replace(next, options) { replacements.push(options); state = next; }
  };
  App.components = {
    toast: (message, options) => toasts.push({ message, ...options }),
    message: (title, message) => toasts.push({ title, message }),
    choose: async () => h.choice, confirm: async () => h.confirmation
  };
  vm.runInContext(readFileSync(new URL('../assets/js/core/sync.js', import.meta.url), 'utf8'), context);
  h.sync = App.sync;
  h.remote = structuredClone(state);
  h.file = () => response(200, { type: 'file', sha: 'remote-sha', content: Buffer.from(JSON.stringify(h.remote)).toString('base64') });
  h.respond = h.file;
  h.setBaseline = () => Object.assign(state.modules.cloudSync, {
    baselineTarget: 'themadat/app-data/main/data/app-template.json', baselineHash: App.utils.fingerprint(App.stateModel.syncPayload(state)), baselineSha: 'base-sha'
  });
  return h;
}
function response(status, body = {}) { return { status, ok: status >= 200 && status < 300, json: async () => body }; }
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
function changeNotes(state, text) { state.workspace.documents = [{ id: 'app-notes', title: 'Notes', html: text, createdAt: state.meta.createdAt, updatedAt: state.meta.updatedAt }]; }

const expected = {
  idle: ['icloud', 'neutral', 'Cloud Sync'],
  upToDate: ['checkmark.icloud', 'success', 'Up to Date'],
  syncing: ['arrow.trianglehead.2.clockwise.rotate.90.icloud', 'info', 'Syncing…'],
  uploading: ['icloud.and.arrow.up', 'info', 'Uploading…'],
  downloading: ['icloud.and.arrow.down', 'info', 'Downloading…'],
  pending: ['icloud.dashed', 'neutral', 'Waiting to Sync'],
  disabled: ['icloud.slash', 'neutral', 'Sync Disabled'],
  offline: ['icloud.slash', 'neutral', 'Offline'],
  warning: ['exclamationmark.icloud', 'warning', 'Sync Needs Attention'],
  failed: ['xmark.icloud', 'danger', 'Sync Failed'],
  authenticationRequired: ['key.icloud', 'warning', 'Sign In Required'],
  permissionDenied: ['lock.icloud', 'warning', 'Access Required'],
  connected: ['link.icloud', 'info', 'Connected'],
  shared: ['person.icloud', 'info', 'Shared']
};

test('all cloud states map to SF Symbols, semantic tints, accessible text, and only active syncing rotates', () => {
  const h = harness();
  assert.deepEqual(Object.keys(h.sync.CloudSyncState).sort(), Object.keys(expected).sort());
  assert.ok(Object.isFrozen(h.sync.CloudSyncState));
  for (const [state, [symbol, kind, title]] of Object.entries(expected)) {
    const info = h.sync.presentation(state);
    assert.deepEqual([info.symbol, info.kind, info.title], [symbol, kind, title]);
    assert.equal(info.accessibilityLabel, title);
    assert.ok(info.help.startsWith(title + '. '));
    assert.equal(info.animation, state === 'syncing' ? 'rotate' : 'none');
    const svg = h.App.icons.markup(symbol);
    assert.match(svg, /<svg class="sf-symbol"/);
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /currentColor/);
  }
  assert.match(h.App.icons.markup(h.sync.presentation('syncing').symbol), /<path class="sync-rotation"/);
  assert.equal(h.sync.presentation('permissionDenied', { hardDenial: true }).kind, 'danger');
  assert.equal(h.sync.presentation('permissionDenied').kind, 'warning');
  assert.equal(h.sync.actions.syncNow.symbol, 'arrow.trianglehead.clockwise.icloud');
  assert.equal(h.sync.actions.restore.symbol, 'arrow.trianglehead.counterclockwise.icloud');
  for (const action of Object.values(h.sync.actions)) {
    assert.ok(action.title && action.help && h.App.icons.markup(action.symbol));
    assert.notEqual(action.symbol, h.sync.presentation('syncing').symbol);
  }
});

test('missing credentials, disabled, offline, and a configured idle connection are distinct', async () => {
  const h = harness({ token: '' });
  assert.equal(h.sync.getInfo().state, 'authenticationRequired');
  await h.sync.syncNow();
  assert.equal(h.events.at(-1).type, 'app:opensyncsettings');
  h.context.navigator.onLine = false;
  assert.equal(h.sync.getInfo().state, 'offline');
  assert.equal(h.sync.getInfo().kind, 'neutral');
  h.state.modules.cloudSync.enabled = false;
  assert.equal(h.sync.getInfo().state, 'disabled');
  assert.equal(harness().sync.getInfo().state, 'connected');
  assert.equal(harness().sync.getInfo().animation, 'none');
});

test('real checks show two-arrow activity, settle to up to date, and classify queued or divergent changes', async () => {
  const h = harness();
  h.setBaseline();
  const pending = deferred(); h.respond = () => pending.promise;
  const checking = h.sync.check(true);
  assert.equal(h.sync.getInfo().state, 'syncing');
  assert.equal(h.sync.getInfo().canSync, false);
  await h.sync.syncNow(); await h.sync.testConnection({});
  assert.equal(h.requests.length, 1);
  pending.resolve(h.file()); await checking;
  assert.equal(h.sync.getInfo().state, 'upToDate', h.sync.getInfo().message);
  changeNotes(h.state, 'local edit');
  assert.equal(h.sync.getInfo().state, 'pending');
  assert.equal(h.sync.getInfo().change, 'local');
  h.respond = h.file; changeNotes(h.remote, 'remote edit');
  await h.sync.check(true);
  assert.equal(h.sync.getInfo().state, 'warning');
  assert.equal(h.sync.getInfo().change, 'conflict');
  assert.equal(h.sync.getInfo().kind, 'warning');
});

for (const [status, message, state] of [[401, '', 'authenticationRequired'], [403, '', 'permissionDenied'], [403, 'API rate limit exceeded', 'warning'], [404, '', 'warning'], [409, '', 'warning'], [422, '', 'warning'], [429, '', 'warning'], [500, '', 'failed']]) {
  test(`HTTP ${status} ${message} produces ${state} and does not persist a failed test token`, async () => {
    const h = harness();
    h.respond = () => response(status, { message });
    await assert.rejects(h.sync.testConnection({ ...h.state.modules.cloudSync, token: 'unsaved-new-token' }));
    assert.equal(h.sync.getInfo().state, state);
    assert.equal(h.sync.getInfo().animation, 'none');
    assert.equal(h.token, 'test-token');
  });
}

test('a test using unsaved credentials is active and then Connected without an endless spinner', async () => {
  const h = harness({ token: '' }); const pending = deferred();
  h.respond = () => pending.promise;
  const testing = h.sync.testConnection({ ...h.state.modules.cloudSync, token: 'new-token', rememberToken: false });
  assert.equal(h.sync.getInfo().state, 'syncing');
  pending.resolve(h.file()); await testing;
  assert.equal(h.sync.getInfo().state, 'connected');
  assert.equal(h.token, 'new-token');
  assert.equal(h.state.modules.cloudSync.rememberToken, false);
});

test('missing remote is static pending and malformed JSON is a failed attempt', async () => {
  const h = harness(); h.respond = () => response(404);
  await h.sync.check(true);
  assert.equal(h.sync.getInfo().state, 'pending');
  assert.equal(h.sync.getInfo().canRestore, false);
  h.respond = () => response(200, { type: 'file', sha: 'sha', content: btoa('invalid json') });
  await h.sync.check(true);
  assert.equal(h.sync.getInfo().state, 'failed');
});

test('network unavailability is neutral and reconnect can recover', async () => {
  const h = harness(); h.sync.init();
  h.respond = () => { throw new Error('Failed to fetch'); };
  await h.sync.check(true);
  assert.equal(h.sync.getInfo().state, 'offline');
  assert.equal(h.sync.getInfo().kind, 'neutral');
  h.respond = h.file;
  await h.sync.check(true);
  assert.equal(h.sync.getInfo().state, 'upToDate', h.sync.getInfo().message);
});

test('upload direction stays static; an edit during upload remains pending after completion', async () => {
  const h = harness(); h.setBaseline(); changeNotes(h.state, 'upload me');
  const writing = deferred(); const started = deferred();
  h.respond = (url, options) => { if (options.method === 'PUT') { started.resolve(); return writing.promise; } return h.file(); };
  const syncing = h.sync.syncNow(); await started.promise;
  assert.equal(h.sync.getInfo().state, 'uploading');
  assert.equal(h.sync.getInfo().animation, 'none');
  changeNotes(h.state, 'newer edit');
  writing.resolve(response(200, { content: { sha: 'new-sha' } })); await syncing;
  assert.equal(h.sync.getInfo().state, 'pending');
});

test('restore cancellation preserves data; confirmation saves recovery and local cloud settings', async () => {
  const h = harness(); changeNotes(h.remote, 'cloud content');
  const cloud = structuredClone(h.state.modules.cloudSync);
  await h.sync.restoreFromCloud();
  assert.equal(h.replacements.length, 0);
  h.confirmation = true;
  await h.sync.restoreFromCloud();
  assert.equal(h.replacements.length, 1);
  assert.ok(h.recovery);
  assert.equal(h.state.workspace.documents[0].html, 'cloud content');
  assert.equal(h.state.modules.cloudSync.rememberToken, cloud.rememberToken);
  assert.equal(h.sync.getInfo().state, 'upToDate', h.sync.getInfo().message);
  assert.ok(h.events.some(event => event.detail?.info?.state === 'downloading'));
});

test('restore refuses replacement when a recovery copy cannot be saved', async () => {
  const h = harness(); h.confirmation = true; h.recoveryWorks = false;
  await h.sync.restoreFromCloud();
  assert.equal(h.replacements.length, 0);
  assert.equal(h.sync.getInfo().state, 'failed');
  assert.match(h.sync.getInfo().message, /recovery copy/);
});

test('forgetting a connection prevents stale errors and a pending restore from applying', async () => {
  const h = harness(); const pending = deferred(); h.respond = () => pending.promise;
  const checking = h.sync.check(true); await h.sync.forget();
  pending.resolve(response(401)); await checking;
  assert.equal(h.sync.getInfo().state, 'authenticationRequired');
  assert.doesNotMatch(h.sync.getInfo().message, /rejected/);
  const r = harness(); const decision = deferred(); const opened = deferred();
  r.App.components.confirm = () => { opened.resolve(); return decision.promise; };
  const restoring = r.sync.restoreFromCloud(); await opened.promise;
  const count = r.requests.length; await r.sync.check(true);
  assert.equal(r.requests.length, count);
  await r.sync.forget(); decision.resolve(true); await restoring;
  assert.equal(r.replacements.length, 0);
});

test('ordinary remote-only sync downloads without writing to GitHub', async () => {
  const h = harness(); h.setBaseline(); changeNotes(h.remote, 'remote-only edit');
  await h.sync.check(true);
  assert.equal(h.sync.getInfo().state, 'pending');
  assert.equal(h.sync.getInfo().change, 'remote');
  await h.sync.syncNow();
  assert.equal(h.state.workspace.documents[0].html, 'remote-only edit');
  assert.ok(h.recovery);
  assert.ok(h.requests.every(request => request.options.method !== 'PUT'));
  assert.equal(h.sync.getInfo().state, 'upToDate');
});

test('first upload still requires a choice; a synchronized copy needs no write', async () => {
  const h = harness(); h.respond = (url, options) => options.method === 'PUT' ? response(200, { content: { sha: 'new-sha' } }) : response(404);
  await h.sync.syncNow();
  assert.ok(h.requests.every(request => request.options.method !== 'PUT'));
  h.choice = 'upload'; await h.sync.syncNow();
  assert.ok(h.requests.some(request => request.options.method === 'PUT'));
  assert.equal(h.sync.getInfo().state, 'upToDate');
  const current = harness(); await current.sync.syncNow();
  assert.ok(current.requests.every(request => request.options.method !== 'PUT'));
  assert.equal(current.sync.getInfo().state, 'upToDate');
});
