import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = (await readFile(new URL('../src/main.js', import.meta.url), 'utf8'))
  .replace(/^import .*;\n/gm, '');
function openPage(href) {
  const elements = new Map();
  const buttons = ['json', 'size', 'base64'].map(tool => ({
    dataset: { tool },
    setAttribute(name, value) { this[name] = value; },
    addEventListener(name, handler) { this[name] = handler; }
  }));
  const context = {
    URL, URLSearchParams, location: new URL(href),
    initTheme() {}, initSizeConverter() {}, initBase64() {},
    document: {
      getElementById(id) {
        if (!elements.has(id)) elements.set(id, {});
        return elements.get(id);
      },
      querySelectorAll() { return buttons; }
    },
    history: { replaceState(_state, _title, url) { context.location = new URL(url); } }
  };
  vm.runInNewContext(source, context);
  return { context, elements, buttons };
}

test('refresh restores the selected tool independently in each browser tab', () => {
  const page = openPage('https://example.test/index.html');
  page.buttons[1].click();
  const refreshed = openPage(page.context.location.href);
  assert.equal(refreshed.elements.get('size-workspace').hidden, false);
  assert.equal(refreshed.elements.get('json-workspace').hidden, true);
  assert.equal(refreshed.elements.get('json-toolbar').hidden, true);
  assert.equal(refreshed.buttons[1]['aria-pressed'], 'true');
  assert.equal(refreshed.context.document.title, '紫微 · 大小转换器');
  assert.equal(openPage('https://example.test/index.html').elements.get('json-workspace').hidden, false);
  refreshed.buttons[0].click();
  assert.equal(openPage(refreshed.context.location.href).elements.get('json-workspace').hidden, false);
});

test('unknown tools and context-menu payloads open JSON', () => {
  for (const suffix of ['?tool=unknown', '?tool=__proto__', '#selection', '?tool=size#selection']) {
    assert.equal(openPage('https://example.test/index.html' + suffix).elements.get('json-workspace').hidden, false);
  }
});

test('Base64 selection survives refresh and hides other workspaces', () => {
  const page = openPage('https://example.test/index.html');
  page.buttons[2].click();
  const refreshed = openPage(page.context.location.href);
  assert.equal(refreshed.elements.get('base64-workspace').hidden, false);
  assert.equal(refreshed.elements.get('json-workspace').hidden, true);
  assert.equal(refreshed.elements.get('size-workspace').hidden, true);
  assert.equal(refreshed.context.document.title, '紫微 · Base64 编解码');
});
