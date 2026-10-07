import { describe, test, expect } from 'vitest';
import { toBase64Url, fromBase64Url } from './encoding.js';
import { generateFileKey, exportFileKey, importFileKey, generateBaseNonce } from './keys.js';
import { deriveIv, encryptChunk, decryptChunk, encryptBlob } from './chunks.js';

const enc = (s) => new TextEncoder().encode(s);
const dec = (b) => new TextDecoder().decode(b);

async function setup() {
  const key = await generateFileKey();
  const nonce = generateBaseNonce();
  const c0 = await encryptChunk(key, nonce, 0, false, enc('primo'));
  const c1 = await encryptChunk(key, nonce, 1, true, enc('ultimo'));
  return { key, nonce, c0, c1 };
}

describe('encoding', () => {
  test('base64url round-trip', () => {
    const bytes = crypto.getRandomValues(new Uint8Array(32));
    expect(fromBase64Url(toBase64Url(bytes))).toEqual(bytes);
  });
});

describe('chunk: casi validi', () => {
  test('round-trip di due chunk', async () => {
    const { key, nonce, c0, c1 } = await setup();
    expect(dec(await decryptChunk(key, nonce, 0, false, c0))).toBe('primo');
    expect(dec(await decryptChunk(key, nonce, 1, true, c1))).toBe('ultimo');
  });

  test('IV diverso per ogni chunk', () => {
    const nonce = generateBaseNonce();
    expect(deriveIv(nonce, 0)).not.toEqual(deriveIv(nonce, 1));
  });
});

describe('chunk: attacchi rifiutati', () => {
  test('chunk riordinato', async () => {
    const { key, nonce, c1 } = await setup();
    await expect(decryptChunk(key, nonce, 0, false, c1)).rejects.toThrow();
  });

  test('file troncato', async () => {
    const { key, nonce, c0 } = await setup();
    await expect(decryptChunk(key, nonce, 0, true, c0)).rejects.toThrow();
  });

  test('byte alterato', async () => {
    const { key, nonce, c0 } = await setup();
    const tampered = new Uint8Array(c0);
    tampered[0] ^= 1;
    await expect(decryptChunk(key, nonce, 0, false, tampered)).rejects.toThrow();
  });

  test('chiave sbagliata', async () => {
    const { nonce, c0 } = await setup();
    const other = await generateFileKey();
    await expect(decryptChunk(other, nonce, 0, false, c0)).rejects.toThrow();
  });
});

describe('chiave nel link', () => {
  test('export e import', async () => {
    const { key, nonce, c0 } = await setup();
    const imported = await importFileKey(await exportFileKey(key));
    expect(dec(await decryptChunk(imported, nonce, 0, false, c0))).toBe('primo');
  });

  test('chiave di lunghezza errata', async () => {
    await expect(importFileKey(toBase64Url(new Uint8Array(16)))).rejects.toThrow();
  });
});

describe('encryptBlob', () => {
  test('file diviso su più chunk', async () => {
    const key = await generateFileKey();
    const nonce = generateBaseNonce();
    const blob = new Blob([enc('abcdefghij')]);
    const out = [];
    for await (const c of encryptBlob(key, nonce, blob, 4)) out.push(c);
    expect(out.length).toBe(3);
    const parts = await Promise.all(out.map((c) =>
      decryptChunk(key, nonce, c.index, c.index === c.total - 1, c.data)));
    expect(parts.map(dec).join('')).toBe('abcdefghij');
  });
});