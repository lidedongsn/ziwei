import './tools/json/controller.js';
import { initSizeConverter } from './tools/size/controller.js';
import { initBase64 } from './tools/base64/controller.js';
import { initTheme } from './shared/theme.js';

const tools = {
  json: { title: 'JSON 格式化', hint: '自动格式化已开启 · 支持拖入文件' },
  size: { title: '大小转换器', hint: '填写任意单位 · 其他栏自动换算' },
  base64: { title: 'Base64 编解码', hint: '左侧原文 · 右侧 Base64 · 双向自动转换' }
};
const $ = (id) => document.getElementById(id);
initTheme($);
initSizeConverter();
initBase64();
// Each tool mounts once. Switching only changes visibility, preserving drafts.
function selectTool(selected) {
  if (!Object.hasOwn(tools, selected)) selected = 'json';
  for (const name of Object.keys(tools)) {
    $(`${name}-workspace`).hidden = name !== selected;
  }
  for (const item of document.querySelectorAll('[data-tool]')) {
    item.setAttribute('aria-pressed', String(item.dataset.tool === selected));
  }
  $('json-toolbar').hidden = selected !== 'json';
  $('tool-hint').textContent = tools[selected].hint;
  document.title = `紫微 · ${tools[selected].title}`;
  // Keep the selection per browser tab and restore it on refresh.
  const url = new URL(location.href);
  url.searchParams.set('tool', selected);
  history.replaceState(null, '', url);
}
for (const button of document.querySelectorAll('[data-tool]')) {
  button.addEventListener('click', () => selectTool(button.dataset.tool));
}
selectTool(location.hash ? 'json' : new URLSearchParams(location.search).get('tool'));
