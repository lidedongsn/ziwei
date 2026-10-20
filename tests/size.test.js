import test from 'node:test';
import assert from 'node:assert/strict';
import { convertSize, units } from '../src/tools/size/converter.js';

test('converts common storage units using 1024 at each step', () => {
  assert.deepEqual(units, ['B', 'KB', 'MB', 'GB', 'TB', 'PB']);
  assert.equal(convertSize('1', 'MB').B, '1048576');
  assert.equal(convertSize('1024', 'B').KB, '1');
  assert.equal(convertSize('1', 'GB').MB, '1024');
  assert.equal(convertSize('1', 'B').KB, '0.0009765625');
});
test('preserves integers beyond Number precision and fractional bytes', () => {
  assert.equal(convertSize('9007199254740993', 'B').B, '9007199254740993');
  assert.equal(convertSize('.5', 'KB').B, '512');
  assert.equal(convertSize('0.1', 'B').B, '0.1');
  assert.equal(convertSize(' 001.500 ', 'MB').KB, '1536');
  assert.equal(convertSize('1', 'PB').B, '1125899906842624');
  assert.equal(convertSize('0.000000000000000001', 'PB').TB, '0.000000000000001024');
});
test('all units preserve value through a round trip', () => {
  for (const source of units) {
    const results = convertSize('123.456', source);
    for (const target of units) assert.equal(convertSize(results[target], target)[source], '123.456');
  }
});
test('empty, zero, invalid and oversized input are handled explicitly', () => {
  assert.equal(convertSize(' ', 'B'), null);
  for (const value of Object.values(convertSize('0', 'PB'))) assert.equal(value, '0');
  for (const input of ['-1', 'NaN', 'Infinity', '1e3', '1,024', '.', '1.2.3', '1 MB', '1'.repeat(101)]) {
    assert.throws(() => convertSize(input, 'B'));
  }
  assert.throws(() => convertSize('1', 'unknown'));
});
