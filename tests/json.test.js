import test from 'node:test';
import assert from 'node:assert/strict';
import { parse, stringify } from '../src/tools/json/parser.js';

test('preserves exact numbers, duplicate keys, and special property names', () => {
  const text = '{"id":9223372036854775807,"decimal":0.12345678901234567890,"huge":1e999,"negative":-0,"x":1,"x":2,"__proto__":true}';
  assert.equal(stringify(parse(text), ''), text);
  assert.equal(stringify(parse(stringify(parse(text))), ''), text);
});
test('formats nested arrays, escaped strings and scalar roots', () => {
  for (const text of ['null', 'false', '42', '"你好\\n世界"', '{"a":[1,{"b":"a\\\"b"}],"c":{}}']) {
    assert.deepEqual(JSON.parse(stringify(parse(text))), JSON.parse(text));
  }
  assert.equal(stringify(parse('{"a":1}')), '{\n  "a": 1\n}');
});
test('sorts recursively without changing array order or mutating source', () => {
  const node = parse('{"z":0,"a":[{"z":1,"a":2},3]}');
  assert.equal(stringify(node, '', true), '{"a":[{"a":2,"z":1},3],"z":0}');
  assert.equal(stringify(node, ''), '{"z":0,"a":[{"z":1,"a":2},3]}');
});
test('rejects malformed JSON including invalid whitespace and escapes', () => {
  for (const text of ['', ' ', '{', '[1,]', '{"a":1,}', '{a:1}', '01', '1.', '+1', 'NaN', 'true false', '"\\x01"', '"\\uZZZZ"', '"a\nb"', '\u00a0null', '{"a" 1}', '[1 2]']) {
    assert.throws(() => parse(text), SyntaxError, text);
  }
});
test('reports exact line and column', () => {
  assert.throws(() => parse('{\n "a": ?\n}'), (error) => error.line === 2 && error.column === 7 && error.position === 8);
});
test('limits nesting to prevent call stack exhaustion', () => {
  assert.throws(() => parse('['.repeat(202) + '0' + ']'.repeat(202)), /200/);
});
test('round-trips generated JSON values', () => {
  for (let i = 0; i < 100; i++) {
    const value = { id: i, list: [i / 7, null, true, `text ${i} \\ " \n`], nested: { empty: [], unicode: '你好' } };
    assert.deepEqual(JSON.parse(stringify(parse(JSON.stringify(value)))), value);
  }
});
