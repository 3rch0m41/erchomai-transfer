import { describe, test, expect } from 'vitest';
import { generateFileKey, generateBaseNonce } from './keys.js';
import { buildManifest, encryptManifest, decryptManifest } from './manifest.js';
import { toBase64Url, fromBase64Url } from './encoding.js';

const fakeFile = { name: 'report.pdf', type: 'application/pdf', size: 3_000_000 };

async function setup() {
  const key = await generateFileKey();
  const manifest = buildManifest(fakeFile, generateBaseNonce(), 3);
  return { key, manifest, enc: await encryptManifest(key, manifest) };
}

describe('manifest', () => {
  test('round-trip', async () => {
    const { key, manifest, enc } = await setup();
    expect(await decryptManifest(key, enc)).toEqual(manifest);
  });

  test('manifest alterato → rifiutato', async () => {
    const { key, enc } = await setup();
    const bytes = fromBase64Url(enc);
    bytes[bytes.length - 1] ^= 1;
    await expect(decryptManifest(key, toBase64Url(bytes))).rejects.toThrow();
  });

  test('chiave sbagliata → rifiutato', async () => {
    const { enc } = await setup();
    await expect(decryptManifest(await generateFileKey(), enc)).rejects.toThrow();
  });

  test('struttura non valida → rifiutata', async () => {
    const key = await generateFileKey();
    const enc = await encryptManifest(key, { v: 1, name: '', chunkCount: 0 });
    await expect(decryptManifest(key, enc)).rejects.toThrow('Struttura del manifest non valida');
  });
});