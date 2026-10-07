import { toBase64Url, fromBase64Url } from './encoding.js';

const MANIFEST_AAD = new TextEncoder().encode('erchomai-manifest-v1');

export function buildManifest(file, baseNonce, chunkCount) {
  return {
    v: 1,
    name: file.name,
    type: file.type || 'application/octet-stream',
    size: file.size,
    chunkCount,
    nonce: toBase64Url(baseNonce),
  };
}

export async function encryptManifest(key, manifest) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plain = new TextEncoder().encode(JSON.stringify(manifest));
  const ct = new Uint8Array(await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, additionalData: MANIFEST_AAD }, key, plain));
  const out = new Uint8Array(iv.length + ct.length);   // formato: IV || ciphertext
  out.set(iv);
  out.set(ct, iv.length);
  return toBase64Url(out);
}

export async function decryptManifest(key, b64) {
  const bytes = fromBase64Url(b64);
  if (bytes.length < 12 + 16) throw new Error('Manifest non valido');
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12), additionalData: MANIFEST_AAD },
    key, bytes.slice(12));
  return validateManifest(JSON.parse(new TextDecoder().decode(plain)));
}

function validateManifest(m) {
  const ok = m && m.v === 1
    && typeof m.name === 'string' && m.name.length > 0 && m.name.length <= 255
    && typeof m.type === 'string'
    && Number.isSafeInteger(m.size) && m.size >= 0
    && Number.isSafeInteger(m.chunkCount) && m.chunkCount >= 1
    && typeof m.nonce === 'string' && fromBase64Url(m.nonce).length === 12;
  if (!ok) throw new Error('Struttura del manifest non valida');
  return m;
}