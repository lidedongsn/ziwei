// Keep scalar source tokens intact: no floating-point conversion or lost object keys.
export function parse(source) {
  let i = 0;
  const fail = (message) => {
    const before = source.slice(0, i);
    const line = before.split('\n').length;
    const column = i - before.lastIndexOf('\n');
    const error = new SyntaxError(`${message}（第 ${line} 行，第 ${column} 列）`);
    Object.assign(error, { position: i, line, column });
    throw error;
  };
  const space = () => { while (/[\x20\t\r\n]/.test(source[i] || '\0')) i++; };
  function string() {
    const start = i++;
    while (i < source.length) {
      if (source[i] === '"') {
        i++;
        const raw = source.slice(start, i);
        try { JSON.parse(raw); } catch { fail('字符串转义无效'); }
        return { type: 'string', raw };
      }
      if (source.charCodeAt(i) < 32) fail('字符串中不能包含未转义的控制字符');
      if (source[i] === '\\') i++;
      i++;
    }
    fail('字符串缺少结束引号');
  }
  function value(depth) {
    space();
    if (depth > 200) fail('嵌套超过 200 层');
    const ch = source[i];
    if (ch === '"') return string();
    if (ch === '{' || ch === '[') {
      i++;
      const object = ch === '{';
      const close = object ? '}' : ']';
      const node = { type: object ? 'object' : 'array', children: [] };
      space();
      if (source[i] === close) { i++; return node; }
      while (true) {
        space();
        let key;
        if (object) {
          if (source[i] !== '"') fail('对象属性名必须使用双引号');
          key = string().raw;
          space();
          if (source[i++] !== ':') { i--; fail('属性名后缺少冒号'); }
        }
        node.children.push({ key, value: value(depth + 1) });
        space();
        if (source[i] === close) { i++; return node; }
        if (source[i] !== ',') fail(`需要逗号或 ${close}`);
        i++;
      }
    }
    const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(source.slice(i));
    if (!match) fail(i >= source.length ? 'JSON 内容不完整' : '此处不是有效的 JSON 值');
    i += match[0].length;
    return { type: match[0] === 'null' ? 'null' : /^(true|false)$/.test(match[0]) ? 'boolean' : 'number', raw: match[0] };
  }
  const result = value(0);
  space();
  if (i !== source.length) fail('JSON 值后存在多余内容');
  return result;
}

export function stringify(node, indent = '  ', sort = false, depth = 0) {
  if (!node.children) return node.raw;
  const object = node.type === 'object';
  const [open, close] = object ? ['{', '}'] : ['[', ']'];
  if (!node.children.length) return open + close;
  const children = sort && object ? [...node.children].sort((a, b) => {
    const x = JSON.parse(a.key), y = JSON.parse(b.key);
    return x < y ? -1 : x > y ? 1 : 0;
  }) : node.children;
  const newline = indent ? '\n' : '';
  return open + newline + children.map(({ key, value }) =>
    indent.repeat(depth + 1) + (object ? key + ':' + (indent ? ' ' : '') : '') + stringify(value, indent, sort, depth + 1)
  ).join(',' + newline) + newline + indent.repeat(depth) + close;
}
