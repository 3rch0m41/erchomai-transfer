import { toBase64Url, fromBase64Url } from './encoding.js';

const enc = new TextEncoder();
const SECRET_BYTES = 32;
export const PBKDF2_ITERATIONS = 600_000;

export function generateSecret() {
  return crypto.getRandomValues(new Uint8Array(SECRET_BYTES));
}

export function generateBaseNonce() {
  return crypto.getRandomValues(new Uint8Array(12));
}

async function stretchPassword(secret, password) {
  const base = await crypto.subtle.importKey(
    'raw', enc.encode(password.normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: secret, iterations: PBKDF2_ITERATIONS },
    base, 256);
  return new Uint8Array(bits);
}

export async function deriveKeys(secret, password = '') {
  if (!(secret instanceof Uint8Array) || secret.length !== SECRET_BYTES) {
    throw new Error('Segreto non valido');
  }

  let ikm = secret;
  if (password) {
    const pw = await stretchPassword(secret, password);
    ikm = new Uint8Array(SECRET_BYTES + pw.length);
    ikm.set(secret);
    ikm.set(pw, SECRET_BYTES);
  }

  const base = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveKey']);
  const derive = (label) => crypto.subtle.deriveKey(
    { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(0), info: enc.encode(`erchomai/v2/${label}`) },
    base,
    { name: 'AES-GCM', length: 256 },
    false,                      // non estraibile
    ['encrypt', 'decrypt']);

  const [chunkKey, manifestKey] = await Promise.all([derive('chunks'), derive('manifest')]);
  return { chunkKey, manifestKey };
}

// Frammento del link: "<segreto>" oppure "p.<segreto>" se serve una password
export function encodeFragment(secret, withPassword) {
  const s = toBase64Url(secret);
  return withPassword ? `p.${s}` : s;
}

export function decodeFragment(fragment) {
  const withPassword = fragment.startsWith('p.');
  const secret = fromBase64Url(withPassword ? fragment.slice(2) : fragment);
  if (secret.length !== SECRET_BYTES) throw new Error('Chiave nel link non valida');
  return { secret, withPassword };
}