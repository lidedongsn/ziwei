import { parse, stringify } from './parser.js';
import { createJsonView } from './view.js';
import { initTheme } from '../../shared/theme.js';

const $ = (id) => document.getElementById(id);
let root = null, result = '', view = 'tree', mode = 'format';
let formatTimer, composing = false;
const jsonView = createJsonView($);
const { clearSelection } = jsonView;
const MAX_SIZE = 2 * 1024 * 1024;
function status(message, error = false) {
  $('status').classList.toggle('error', error);
  $('status').textContent = (error ? '● ' : '✓ ') + message;
}
function setInput(text) {
  $('input').value = text;
  changed();
}
function changed() {
  clearTimeout(formatTimer);
  clearSelection();
  $('input-meta').textContent = `${$('input').value.length.toLocaleString()} 字符 · ${$('input').value.split('\n').length} 行`;
  root = null; result = '';
  $('output').replaceChildren();
  const hasInput = $('input').value.trim().length > 0;
  $('output').textContent = hasInput ? '正在等待输入完成…' : '输入或粘贴 JSON，自动显示格式化结果';
  $('copy').disabled = $('download').disabled = true;
  $('output-meta').textContent = '等待处理';
  $('matches').textContent = '';
  status('准备就绪');
  if (hasInput && !composing) {
    formatTimer = setTimeout(() => process('format', false), 300);
  }
}
function read() {
  const source = $('input').value;
  if (new Blob([source]).size > MAX_SIZE) throw new Error('文件过大，请使用不超过 2 MB 的 JSON');
  return parse(source);
}
function process(nextMode = 'format', locateError = true) {
  clearTimeout(formatTimer);
  try {
    root = read(); mode = nextMode;
    const indent = $('indent').value === 'tab' ? '\t' : ' '.repeat(Number($('indent').value));
    result = stringify(root, mode === 'minify' ? '' : indent, $('sort').checked);
    // Reparse the displayed order so the code and tree views agree.
    root = parse(result);
    $('copy').disabled = $('download').disabled = false;
    render();
    status(`JSON 有效 · ${mode === 'minify' ? '压缩' : '格式化'}完成`);
  } catch (error) {
    root = null; result = '';
    $('output').textContent = error.message;
    $('output-meta').textContent = 'JSON 无效';
    $('matches').textContent = '';
    $('copy').disabled = $('download').disabled = true;
    status(error.message, true);
    if (locateError && Number.isInteger(error.position)) {
      $('input').focus();
      $('input').setSelectionRange(error.position, error.position + 1);
    }
  }
}
function render() { jsonView.render({ root, result, view }); }
function selectView(next) {
  view = next;
  for (const name of ['code', 'tree']) {
    $(name + '-tab').classList.toggle('active', name === view);
    $(name + '-tab').setAttribute('aria-pressed', String(name === view));
  }
  $('expand').hidden = $('collapse').hidden = view !== 'tree';
  $('view-label').textContent = view === 'tree' ? 'TREE VIEW' : '元数据';
  render();
}
selectView(view);
$('output').addEventListener('click', (event) => { if (event.target === $('output')) clearSelection(); });
$('output').addEventListener('keydown', (event) => { if (event.key === 'Escape') clearSelection(); });
$('input').addEventListener('input', changed);
$('input').addEventListener('compositionstart', () => { composing = true; clearTimeout(formatTimer); });
$('input').addEventListener('compositionend', () => { composing = false; changed(); });
$('format').onclick = () => process();
$('minify').onclick = () => process('minify');
$('validate').onclick = () => { try { read(); status('校验通过 · JSON 语法有效'); } catch (error) { status(error.message, true); if (Number.isInteger(error.position)) { $('input').focus(); $('input').setSelectionRange(error.position, error.position + 1); } } };
$('clear').onclick = () => { setInput(''); $('input').focus(); };
$('indent').onchange = $('sort').onchange = () => { if (root) process(mode); };
$('code-tab').onclick = () => selectView('code');
$('tree-tab').onclick = () => selectView('tree');
let searchTimer;
$('search').oninput = () => { clearTimeout(searchTimer); searchTimer = setTimeout(render, 180); };
$('expand').onclick = () => $('output').querySelectorAll('details').forEach((el) => { el.open = true; });
$('collapse').onclick = () => $('output').querySelectorAll('details').forEach((el) => { el.open = false; });
let copyFeedbackTimer;
$('copy').setAttribute('aria-live', 'polite');
function copyFeedback(message) {
  clearTimeout(copyFeedbackTimer);
  $('copy').textContent = message;
  copyFeedbackTimer = setTimeout(() => { $('copy').textContent = '复制'; }, 2000);
}
$('copy').onclick = async () => {
  try {
    await navigator.clipboard.writeText(result);
    copyFeedback('已复制 ✓');
    status('结果已复制');
  } catch {
    copyFeedback('复制失败');
    status('复制失败，请在结果中手动选择并复制', true);
  }
};
$('download').onclick = () => {
  const url = URL.createObjectURL(new Blob([result], { type: 'application/json;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = 'formatted.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000); status('已生成 formatted.json');
};
$('escape').onclick = () => {
  try { read(); setInput(JSON.stringify($('input').value)); process(); } catch (error) { status(error.message, true); }
};
$('unescape').onclick = () => {
  try {
    const node = read();
    if (node.type !== 'string') throw new Error('去转义需要输入一个 JSON 字符串，例如 "{\\"a\\":1}"');
    const decoded = JSON.parse(node.raw); parse(decoded); setInput(decoded); process();
  } catch (error) { status(error.message, true); }
};
async function importFile(file) {
  if (!file) return;
  if (file.size > MAX_SIZE) { status('文件过大，请使用不超过 2 MB 的 JSON', true); return; }
  try { setInput((await file.text()).replace(/^\uFEFF/, '')); process(); }
  catch (error) { status(`读取失败：${error.message}`, true); }
}
$('import').onclick = () => $('file').click();
$('file').onchange = async () => { await importFile($('file').files[0]); $('file').value = ''; };
document.addEventListener('dragover', (event) => { if (event.dataTransfer.types.includes('Files')) event.preventDefault(); });
document.addEventListener('drop', (event) => {
  if (!event.dataTransfer.files.length) return;
  event.preventDefault(); importFile(event.dataTransfer.files[0]);
});
document.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') { event.preventDefault(); process(); }
});
initTheme($);
// Context-menu data is temporary and removed immediately after this page receives it.
if (location.hash && globalThis.chrome?.storage?.session) {
  const id = location.hash.slice(1);
  try {
    const data = await chrome.storage.session.get(id);
    if (typeof data[id] === 'string') { setInput(data[id]); process(); await chrome.storage.session.remove(id); }
    history.replaceState(null, '', location.pathname);
  } catch { status('无法读取选中内容，请手动粘贴 JSON', true); }
}
