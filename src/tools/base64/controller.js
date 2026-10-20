import { encodeBase64, decodeBase64 } from './converter.js';

export function initBase64() {
  const $ = id => document.getElementById(`base64-${id}`);
  const idle = '在任意一侧输入，另一侧自动转换';
  const status = (message, error = false) => {
    $('status').textContent = message;
    $('status').classList.toggle('error', error);
  };
  function update(source) {
    const target = source === 'input' ? 'output' : 'input';
    for (const name of ['input', 'output']) $(name).setAttribute('aria-invalid', 'false');
    try {
      const value = $(source).value;
      $(target).value = source === 'input' ? encodeBase64(value) : decodeBase64(value);
      status(value ? `✓ 已自动${source === 'input' ? '编码' : '解码'}` : idle);
    } catch (error) {
      $(target).value = '';
      $(source).setAttribute('aria-invalid', 'true');
      status(error.message, true);
    }
    for (const [name, copy] of [['input', 'copy-text'], ['output', 'copy']]) {
      $(`${name}-meta`).textContent = `${$(name).value.length.toLocaleString()} 字符`;
      $(copy).disabled = !$(name).value;
    }
  }
  for (const [name, copy] of [['input', 'copy-text'], ['output', 'copy']]) {
    let composing = false;
    $(name).addEventListener('input', () => { if (!composing) update(name); });
    $(name).addEventListener('compositionstart', () => { composing = true; });
    $(name).addEventListener('compositionend', () => { composing = false; update(name); });
    $(copy).addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText($(name).value);
        status(`✓ ${name === 'input' ? '原文' : 'Base64'}已复制`);
      } catch { status('复制失败，请手动选择文本并复制', true); }
    });
  }
  $('clear').addEventListener('click', () => {
    $('input').value = '';
    update('input');
    $('input').focus();
  });
}
