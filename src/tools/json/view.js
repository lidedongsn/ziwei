// A renderer owns its selection state; it does not parse or mutate source JSON.
export function createJsonView($) {
  let selectedRow = null;
  let selectionElements = [];
  function clearSelection() {
    for (const el of selectionElements) el.classList.remove('node-selected', 'node-ancestor');
    selectionElements = [];
    selectedRow = null;
  }
  function selectRow(row, container) {
    const repeat = selectedRow === row;
    clearSelection();
    if (repeat) return;
    selectedRow = row;
    row.classList.add('node-selected');
    selectionElements.push(row);
    let ancestor = container;
    while (ancestor && $('output').contains(ancestor)) {
      ancestor.classList.add('node-ancestor');
      selectionElements.push(ancestor);
      ancestor = ancestor.parentElement.closest('details');
    }
  }
  function highlight(text, parent, type = '') {
    const span = document.createElement('span');
    span.className = type;
    const query = $('search').value.toLowerCase();
    if (!query) span.textContent = text;
    else {
      let start = 0, index;
      const lower = text.toLowerCase();
      while ((index = lower.indexOf(query, start)) !== -1) {
        span.append(document.createTextNode(text.slice(start, index)));
        const mark = document.createElement('mark');
        mark.textContent = text.slice(index, index + query.length);
        span.append(mark); start = index + query.length;
      }
      span.append(document.createTextNode(text.slice(start)));
    }
    parent.append(span);
  }
  function code(result) {
    const pre = document.createElement('pre');
    // The source has already been validated; highlight tokens without using HTML injection.
    const tokens = /"(?:\\[\s\S]|[^"\\])*"\s*:|"(?:\\[\s\S]|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;
    let start = 0;
    for (const match of result.matchAll(tokens)) {
      highlight(result.slice(start, match.index), pre);
      const token = match[0];
      const type = token.endsWith(':') ? 'key' : token.startsWith('"') ? 'string' : token === 'null' ? 'null' : /^(true|false)$/.test(token) ? 'boolean' : 'number';
      highlight(token, pre, type);
      start = match.index + token.length;
    }
    highlight(result.slice(start), pre);
    $('output').append(pre);
  }
  let treeCount = 0;
  function tree(node, parent, key, path = '$', depth = 0, comma = false) {
    if (++treeCount > 8000) return;
    const label = document.createElement(node.children ? 'summary' : 'div');
    if (key !== undefined) highlight(key + ': ', label, 'key');
    label.title = path;
    if (!node.children) {
      label.className = 'leaf tree-row';
      label.tabIndex = 0;
      highlight(node.raw, label, node.type);
      if (comma) highlight(',', label);
      label.onclick = (event) => { event.stopPropagation(); selectRow(label, parent.closest('details')); };
      label.onkeydown = (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); label.click(); }
      };
      parent.append(label); return;
    }
    const details = document.createElement('details');
    details.open = depth < 3 || Boolean($('search').value);
    const object = node.type === 'object';
    label.className = 'tree-row';
    highlight(object ? '{' : '[', label, 'bracket');
    highlight(object ? ' … }' : ' … ]', label, 'folded-bracket bracket');
    const hint = document.createElement('span'); hint.className = 'hint';
    hint.textContent = `${node.children.length} ${object ? '个属性' : '个元素'}`;
    label.append(hint); details.append(label); parent.append(details);
    label.onclick = (event) => {
      // The native summary marker toggles; text selects without collapsing the node.
      if (event.target === label) return;
      event.preventDefault(); event.stopPropagation(); selectRow(label, details);
    };
    node.children.forEach((child, index) => tree(child.value, details, object ? child.key : String(index), object ? `${path}[${child.key}]` : `${path}[${index}]`, depth + 1, index < node.children.length - 1));
    const closing = document.createElement('div');
    closing.className = 'tree-close tree-row';
    closing.title = path;
    highlight(object ? '}' : ']', closing, 'bracket');
    if (comma) highlight(',', closing);
    closing.onclick = (event) => { event.stopPropagation(); selectRow(label, details); };
    details.append(closing);
  }
  function render({ root, result, view }) {
    if (!root) return;
    $('output').style.setProperty('--tree-indent', $('indent').value === 'tab' ? '4ch' : `${$('indent').value}ch`);
    clearSelection();
    $('output').replaceChildren();
    if (view === 'code') code(result);
    else {
      treeCount = 0; tree(root, $('output'));
      if (treeCount > 8000) {
        const note = document.createElement('p'); note.textContent = '树形视图仅展示前 8,000 个节点；元数据、复制和下载保留完整结果。'; $('output').append(note);
      }
    }
    $('output-meta').textContent = `${result.split('\n').length.toLocaleString()} 行 · ${new Blob([result]).size.toLocaleString()} 字节`;
    $('matches').textContent = $('search').value ? `${$('output').querySelectorAll('mark').length} 处匹配` : '';
  }
  return { render, clearSelection };
}
