import { toBase64Url, fromBase64Url } from './encoding.js';

// Lato mittente: estraibile, perché deve finire nel link
export async function generateFileKey() {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function exportFileKey(key) {
  return toBase64Url(await crypto.subtle.exportKey('raw', key));
}

// Lato destinatario: NON estraibile, serve solo a decifrare
export async function importFileKey(b64) {
  const raw = fromBase64Url(b64);
  if (raw.length !== 32) throw new Error('Chiave non valida');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['decrypt']);
}

// 12 byte casuali per file: non è segreto, finirà nel manifest
export function generateBaseNonce() {
  return crypto.getRandomValues(new Uint8Array(12));
}