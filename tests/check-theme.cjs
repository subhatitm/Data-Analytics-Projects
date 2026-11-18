const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');
const {runInNewContext} = require('node:vm');

const script = readFileSync(join(__dirname, '../dist/theme.js'), 'utf8');
const key = 'analystpath.theme.v1';

function openPage({values = new Map(), dark = false, blocked = false} = {}) {
  const root = {dataset: {}};
  const meta = {};
  const picker = new EventTarget();
  const system = Object.assign(new EventTarget(), {matches: dark});
  const document = Object.assign(new EventTarget(), {
    documentElement: root,
    querySelector: () => meta,
    getElementById: () => picker,
  });
  const window = Object.assign(new EventTarget(), {matchMedia: () => system});
  const messages = [];
  const localStorage = {
    getItem(name) {
      if (blocked) throw new Error('Storage unavailable');
      return values.get(name) ?? null;
    },
    setItem(name, value) {
      if (blocked) throw new Error('Storage unavailable');
      values.set(name, value);
    },
  };
  runInNewContext(script, {document, window, localStorage, toast: message => messages.push(message)});
  const initialPalette = root.dataset.theme;
  document.dispatchEvent(new Event('DOMContentLoaded'));
  function choose(value) {
    picker.value = value;
    picker.dispatchEvent(new Event('change'));
  }
  return {root, meta, picker, system, window, localStorage, initialPalette, messages, choose};
}

test('System follows device changes and handles unknown stored values', () => {
  for (const values of [new Map(), new Map([[key, 'old-option']])]) {
    const page = openPage({dark: true, values});
    assert.equal(page.initialPalette, 'dark');
    assert.equal(page.picker.value, 'system');
    page.system.matches = false;
    page.system.dispatchEvent(new Event('change'));
    assert.equal(page.root.dataset.theme, 'light');
  }
});

test('Both explicit themes survive reloads and leave tracker records intact', () => {
  const values = new Map([['analystpath.workspace.v1', 'existing records']]);
  for (const choice of ['dark', 'light']) {
    const page = openPage({values});
    page.choose(choice);
    const reopened = openPage({values, dark: choice === 'light'});
    assert.equal(reopened.initialPalette, choice);
    assert.equal(reopened.picker.value, choice);
    reopened.system.dispatchEvent(new Event('change'));
    assert.equal(reopened.root.dataset.theme, choice);
    assert.equal(values.get('analystpath.workspace.v1'), 'existing records');
  }
});

test('Existing tabs pick up changes and clear events', () => {
  const values = new Map();
  const a = openPage({values});
  const b = openPage({values});
  const notify = changedKey => b.window.dispatchEvent(
    Object.assign(new Event('storage'), {storageArea: b.localStorage, key: changedKey})
  );
  a.choose('dark');
  notify(key);
  assert.equal(b.picker.value, 'dark');
  assert.equal(b.root.dataset.theme, 'dark');
  values.clear();
  notify(null);
  assert.equal(b.picker.value, 'system');
  assert.equal(b.root.dataset.theme, 'light');
});

test('The selected theme still works when storage is blocked', () => {
  const page = openPage({blocked: true, dark: true});
  page.choose('light');
  assert.equal(page.root.dataset.theme, 'light');
  assert.match(page.messages[0], /this visit/);
  page.choose('system');
  assert.equal(page.root.dataset.theme, 'dark');
});
