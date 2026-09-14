import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import vm from 'node:vm';

test('manifest assets exist and HTML contains no inline executable scripts', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['contextMenus', 'storage']);
  await access(new URL('../' + manifest.background.service_worker, import.meta.url));
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  for (const [, file] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    await access(new URL('../' + file, import.meta.url));
  }
  assert.doesNotMatch(html, /<script(?![^>]*\bsrc=)[^>]*>|\son\w+=/i);
});

test('toolbar and selection menu open tool; each selection uses isolated session data', async () => {
  const listeners = {}, tabs = [], stored = {}, menus = [];
  let id = 0;
  const context = {
    crypto: { randomUUID: () => `test-${++id}` },
    chrome: {
      runtime: { onInstalled: { addListener: fn => listeners.installed = fn }, getURL: path => `chrome-extension://test/${path}` },
      action: { onClicked: { addListener: fn => listeners.action = fn } },
      contextMenus: {
        removeAll: fn => { menus.length = 0; fn(); },
        create: menu => menus.push(menu),
        onClicked: { addListener: fn => listeners.menu = fn }
      },
      tabs: { create: async tab => tabs.push(tab) },
      storage: { session: { set: async data => Object.assign(stored, data) } }
    }
  };
  vm.runInNewContext(await readFile(new URL('../src/extension/background.js', import.meta.url), 'utf8'), context);
  listeners.installed(); listeners.installed();
  assert.equal(menus.length, 1);
  assert.equal(menus[0].contexts[0], 'selection');
  await listeners.action();
  assert.equal(tabs[0].url, 'chrome-extension://test/index.html');
  await Promise.all(['{"id":1}', '{"id":2}'].map(selectionText => listeners.menu({ menuItemId: 'format-json', selectionText })));
  assert.equal(stored['test-1'], '{"id":1}');
  assert.equal(stored['test-2'], '{"id":2}');
  assert.equal(tabs[1].url, 'chrome-extension://test/index.html#test-1');
  assert.equal(tabs[2].url, 'chrome-extension://test/index.html#test-2');
  await listeners.menu({ menuItemId: 'unrelated' });
  assert.equal(tabs.length, 3);
});
