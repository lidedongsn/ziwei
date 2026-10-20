import { units, convertSize } from './converter.js';

export function initSizeConverter() {
  const $ = id => document.getElementById(id);
  const status = $('size-status');
  const fields = new Map();
  function update(source, unit) {
    let results = null;
    let error = false;
    try {
      results = convertSize(source.value, unit);
      status.textContent = results ? '✓ 其他单位已自动换算' : '填写任意一栏开始换算';
    } catch (cause) {
      error = true;
      status.textContent = cause.message;
    }
    status.classList.toggle('error', error);
    for (const [target, input] of fields) {
      input.setAttribute('aria-invalid', String(input === source && error));
      // Preserve the active field's text and caret, including unfinished decimals.
      if (input !== source) input.value = results?.[target] ?? '';
    }
  }
  for (const unit of units) {
    const label = document.createElement('label');
    label.className = 'size-field';
    const name = document.createElement('span');
    name.textContent = unit;
    const input = document.createElement('input');
    input.type = 'text';
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.placeholder = '输入数值';
    input.setAttribute('aria-describedby', 'size-help size-status');
    input.addEventListener('input', event => {
      if (!event.isComposing) update(input, unit);
    });
    input.addEventListener('compositionend', () => update(input, unit));
    fields.set(unit, input);
    label.append(input, name);
    $('size-fields').append(label);
  }
  $('size-clear').addEventListener('click', () => {
    const input = fields.get('B');
    input.value = '';
    update(input, 'B');
    input.focus();
  });
  update(fields.get('B'), 'B');
}
