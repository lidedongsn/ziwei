import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeBase64, decodeBase64 } from '../src/tools/base64/converter.js';

test('encodes known Base64 vectors and round-trips UTF-8 text', () => {
  for (const [text, encoded] of [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['你好', '5L2g5aW9']]) {
    assert.equal(encodeBase64(text), encoded);
    assert.equal(decodeBase64(encoded), text);
  }
  for (const text of ['中文 🐈🚀', '\uFEFF文本', '\0\n\r\t', '<script>alert(1)</script>', 'a'.repeat(10000)]) {
    assert.equal(decodeBase64(encodeBase64(text)), text);
  }
});
test('accepts whitespace and omitted padding', () => {
  assert.equal(decodeBase64(' Zg\n==\r\t'), 'f');
  assert.equal(decodeBase64('Zg'), 'f');
  assert.equal(decodeBase64('Zm8'), 'fo');
});
test('rejects malformed encoding and invalid UTF-8', () => {
  for (const value of ['Z', 'Zg=', 'Z===', '=Zg=', 'Zm=v', 'Zm9v!', 'Zh==', '____']) {
    assert.throws(() => decodeBase64(value), /Base64 格式无效/);
  }
  assert.throws(() => decodeBase64('/w=='), /UTF-8/);
  assert.throws(() => encodeBase64('中'.repeat(700000)), /2 MB/);
  assert.throws(() => decodeBase64('A'.repeat(2 * 1024 * 1024 + 1)), /2 MB/);
});
