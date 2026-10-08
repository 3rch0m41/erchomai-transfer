import { generateSecret, deriveKeys, generateBaseNonce, encodeFragment, decodeFragment } from './crypto/keys.js';
import { encryptBlob, decryptChunk, countChunks, CHUNK_SIZE } from './crypto/chunks.js';
import { buildManifest, encryptManifest, decryptManifest } from './crypto/manifest.js';
import { fromBase64Url } from './crypto/encoding.js';
import * as api from './api/client.js';

export const MAX_FILE_SIZE = 200 * CHUNK_SIZE; // coerente con MAX_CHUNKS del server
export const MIN_PASSWORD_LENGTH = 8;

export function fragmentNeedsPassword(fragment) {
  return fragment.startsWith('p.');
}

export async function sendFile(file, password = '', onProgress = () => {}) {
  if (file.size > MAX_FILE_SIZE) throw new Error('File troppo grande (massimo 200 MB)');
  if (password && password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La password deve avere almeno ${MIN_PASSWORD_LENGTH} caratteri`);
  }

  const secret = generateSecret();
  const { chunkKey, manifestKey } = await deriveKeys(secret, password);
  const baseNonce = generateBaseNonce();
  const chunkCount = countChunks(file.size);
  const { id, uploadToken } = await api.createTransfer();

  for await (const { index, data } of encryptBlob(chunkKey, baseNonce, file)) {
    await api.uploadChunk(id, uploadToken, index, data);
    onProgress((index + 1) / chunkCount);
  }

  const manifest = buildManifest(file, baseNonce, chunkCount);
  await api.uploadManifest(id, uploadToken, await encryptManifest(manifestKey, manifest));
  await api.completeTransfer(id, uploadToken, chunkCount);

  // Il segreto va nel frammento: il browser non lo invia mai al server
  return `${window.location.origin}/d/${id}#${encodeFragment(secret, Boolean(password))}`;
}

export async function receiveFile(id, fragment, password = '', onProgress = () => {}) {
  let parsed;
  try {
    parsed = decodeFragment(fragment);
  } catch {
    throw new Error('Chiave nel link non valida');
  }
  if (parsed.withPassword && !password) throw new Error('Questo file richiede una password');

  const { chunkKey, manifestKey } = await deriveKeys(parsed.secret, parsed.withPassword ? password : '');
  const { manifest: encManifest, chunkCount: serverCount } = await api.getTransfer(id);

  let manifest;
  try {
    manifest = await decryptManifest(manifestKey, encManifest);
  } catch {
    throw new Error(parsed.withPassword
      ? 'Password errata, oppure manifest manomesso'
      : 'Chiave errata o manifest manomesso');
  }
  // Il numero di chunk autentico è quello nel manifest, non quello del server
  if (serverCount !== manifest.chunkCount) {
    throw new Error('Il server ha dichiarato un numero di chunk incoerente');
  }

  const baseNonce = fromBase64Url(manifest.nonce);
  const parts = [];
  for (let n = 0; n < manifest.chunkCount; n++) {
    const ct = await api.getChunk(id, n);
    try {
      parts.push(await decryptChunk(chunkKey, baseNonce, n, n === manifest.chunkCount - 1, ct));
    } catch {
      throw new Error(`Verifica di integrità fallita sul chunk ${n}: file manomesso`);
    }
    onProgress((n + 1) / manifest.chunkCount);
  }

  // octet-stream: il browser salva il file senza tentare di interpretarlo
  const blob = new Blob(parts, { type: 'application/octet-stream' });
  if (blob.size !== manifest.size) throw new Error('Dimensione del file non corrispondente');
  return { blob, name: manifest.name };
}

const FORBIDDEN = new Set(['\\', '/', ':', '*', '?', '"', '<', '>', '|']);

function sanitizeName(name) {
  const clean = Array.from(name, (ch) => {
    const code = ch.charCodeAt(0);
    return code < 32 || code === 127 || FORBIDDEN.has(ch) ? '_' : ch;
  }).join('').trim();
  return (clean || 'file').slice(0, 200);
}

export function saveBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = sanitizeName(name);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}