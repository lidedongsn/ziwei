export const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
const factors = new Map(units.map((unit, power) => [unit, 1024n ** BigInt(power)]));

// All denominators contain only factors 2 and 5, so decimals terminate exactly.
function decimal(numerator, denominator) {
  let result = String(numerator / denominator);
  let remainder = numerator % denominator;
  if (remainder) result += '.';
  while (remainder) {
    remainder *= 10n;
    result += String(remainder / denominator);
    remainder %= denominator;
  }
  return result;
}

export function convertSize(input, unit) {
  const value = input.trim();
  if (!factors.has(unit)) throw new Error('请选择有效的大小单位');
  if (!value) return null;
  if (value.length > 100) throw new Error('请输入不超过 100 个字符的数值');
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(value)) {
    throw new Error('请输入非负整数或小数，例如 1024 或 1.5');
  }
  const [whole, fraction = ''] = value.split('.');
  const numerator = BigInt((whole || '0') + fraction) * factors.get(unit);
  const denominator = 10n ** BigInt(fraction.length);
  return Object.fromEntries(units.map(target => [
    target, decimal(numerator, denominator * factors.get(target))
  ]));
}
