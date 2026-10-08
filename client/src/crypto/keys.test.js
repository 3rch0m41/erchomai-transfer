import { describe, test, expect } from 'vitest';
import { generateSecret, deriveKeys, encodeFragment, decodeFragment } from './keys.js';
import { toBase64Url } from './encoding.js';

const iv = new Uint8Array(12);
const data = new TextEncoder().encode('segreto');
const encrypt = (key) => crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
const decrypt = (key, ct) => crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);

describe('frammento del link', () => {
  test('round-trip senza password', () => {
    const secret = generateSecret();
    const out = decodeFragment(encodeFragment(secret, false));
    expect(out.secret).toEqual(secret);
    expect(out.withPassword).toBe(false);
  });

  test('round-trip con password', () => {
    const secret = generateSecret();
    const fragment = encodeFragment(secret, true);
    expect(fragment.startsWith('p.')).toBe(true);
    expect(decodeFragment(fragment).withPassword).toBe(true);
  });

  test('segreto di lunghezza errata → rifiutato', () => {
    expect(() => decodeFragment(toBase64Url(new Uint8Array(16)))).toThrow();
  });
});

describe('derivazione delle chiavi', () => {
  test('stesso segreto e password → stesse chiavi', async () => {
    const secret = generateSecret();
    const a = await deriveKeys(secret, 'password-di-prova');
    const b = await deriveKeys(secret, 'password-di-prova');
    expect(new Uint8Array(await decrypt(b.chunkKey, await encrypt(a.chunkKey)))).toEqual(data);
  });

  test('password errata → rifiutata', async () => {
    const secret = generateSecret();
    const right = await deriveKeys(secret, 'password-giusta');
    const wrong = await deriveKeys(secret, 'password-errata');
    await expect(decrypt(wrong.chunkKey, await encrypt(right.chunkKey))).rejects.toThrow();
  });

  test('senza password ≠ con password', async () => {
    const secret = generateSecret();
    const plain = await deriveKeys(secret);
    const withPw = await deriveKeys(secret, 'password-di-prova');
    await expect(decrypt(plain.chunkKey, await encrypt(withPw.chunkKey))).rejects.toThrow();
  });

  test('separazione dei domini: chiave chunk ≠ chiave manifest', async () => {
    const { chunkKey, manifestKey } = await deriveKeys(generateSecret());
    await expect(decrypt(manifestKey, await encrypt(chunkKey))).rejects.toThrow();
  });

  test('le chiavi non sono estraibili', async () => {
    const { chunkKey } = await deriveKeys(generateSecret());
    await expect(crypto.subtle.exportKey('raw', chunkKey)).rejects.toThrow();
  });
});