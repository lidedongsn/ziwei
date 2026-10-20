const MAX_BYTES = 2 * 1024 * 1024;

export function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  if (bytes.length > MAX_BYTES) throw new Error('输入过大，请使用不超过 2 MB 的文本');
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 8192) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 8192));
  }
  return btoa(binary);
}

export function decodeBase64(text) {
  if (text.length > MAX_BYTES) throw new Error('输入过大，请使用不超过 2 MB 的 Base64');
  const source = text.replace(/[\t\n\r ]/g, '');
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}(?:==)?|[A-Za-z0-9+/]{3}=?)?$/.test(source)) {
    throw new Error('Base64 格式无效，请检查字符和末尾的 =');
  }
  const binary = atob(source);
  if (btoa(binary).replace(/=+$/, '') !== source.replace(/=+$/, '')) {
    throw new Error('Base64 格式无效，请检查末尾字符');
  }
  try {
    return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true })
      .decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
  } catch {
    throw new Error('解码结果不是有效的 UTF-8 文本');
  }
}
