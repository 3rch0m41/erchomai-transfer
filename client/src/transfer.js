import { generateFileKey, exportFileKey, importFileKey, generateBaseNonce } from './crypto/keys.js';
import { encryptBlob, decryptChunk, countChunks, CHUNK_SIZE } from './crypto/chunks.js';
import { buildManifest, encryptManifest, decryptManifest } from './crypto/manifest.js';
import { fromBase64Url } from './crypto/encoding.js';
import * as api from './api/client.js';

export const MAX_FILE_SIZE = 200 * CHUNK_SIZE; // coerente con MAX_CHUNKS del server

export async function sendFile(file, onProgress = () => {}) {
  if (file.size > MAX_FILE_SIZE) throw new Error('File troppo grande (massimo 200 MB)');

  const key = await generateFileKey();
  const baseNonce = generateBaseNonce();
  const chunkCount = countChunks(file.size);
  const { id, uploadToken } = await api.createTransfer();

  for await (const { index, data } of encryptBlob(key, baseNonce, file)) {
    await api.uploadChunk(id, uploadToken, index, data);
    onProgress((index + 1) / chunkCount);
  }

  const manifest = buildManifest(file, baseNonce, chunkCount);
  await api.uploadManifest(id, uploadToken, await encryptManifest(key, manifest));
  await api.completeTransfer(id, uploadToken, chunkCount);

  // La chiave va nel frammento: il browser non la invia mai al server
  return `${window.location.origin}/d/${id}#${await exportFileKey(key)}`;
}

export async function receiveFile(id, keyB64, onProgress = () => {}) {
  let key;
  try {
    key = await importFileKey(keyB64);
  } catch {
    throw new Error('Chiave nel link non valida');
  }

  const { manifest: encManifest, chunkCount: serverCount } = await api.getTransfer(id);

  let manifest;
  try {
    manifest = await decryptManifest(key, encManifest);
  } catch {
    throw new Error('Chiave errata o manifest manomesso');
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
      parts.push(await decryptChunk(key, baseNonce, n, n === manifest.chunkCount - 1, ct));
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

function sanitizeName(name) {
  // eslint-disable-next-line no-control-regex -- rimozione intenzionale dei caratteri di controllo
  const clean = name.replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').trim();
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