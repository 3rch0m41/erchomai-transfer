export const CHUNK_SIZE = 1024 * 1024; // 1 MiB

export function deriveIv(baseNonce, index) {
  if (!Number.isInteger(index) || index < 0 || index > 0xffffffff) {
    throw new RangeError('Indice chunk non valido');
  }
  const iv = new Uint8Array(baseNonce);           // copia, non modifica l'originale
  const view = new DataView(iv.buffer);
  view.setUint32(8, (view.getUint32(8) ^ index) >>> 0);
  return iv;
}

function buildAad(index, isLast) {
  const aad = new Uint8Array(5);
  new DataView(aad.buffer).setUint32(0, index);  // posizione del chunk
  aad[4] = isLast ? 1 : 0;                        // flag di fine file
  return aad;
}

export async function encryptChunk(key, baseNonce, index, isLast, plaintext) {
  return crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: deriveIv(baseNonce, index), additionalData: buildAad(index, isLast) },
    key, plaintext);
}

export async function decryptChunk(key, baseNonce, index, isLast, ciphertext) {
  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: deriveIv(baseNonce, index), additionalData: buildAad(index, isLast) },
    key, ciphertext);
}

// Cifra un File/Blob un chunk alla volta, senza caricarlo tutto in memoria
export async function* encryptBlob(key, baseNonce, blob, chunkSize = CHUNK_SIZE) {
  const total = countChunks(blob.size, chunkSize);
  for (let index = 0; index < total; index++) {
    const start = index * chunkSize;
    const plain = await blob.slice(start, start + chunkSize).arrayBuffer();
    const data = await encryptChunk(key, baseNonce, index, index === total - 1, plain);
    yield { index, total, data };
  }
}

export function countChunks(size, chunkSize = CHUNK_SIZE) {
  return Math.max(1, Math.ceil(size / chunkSize));
}