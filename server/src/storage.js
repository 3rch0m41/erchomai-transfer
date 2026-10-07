import { mkdir, readFile, writeFile, rm, readdir, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

export const STORAGE_DIR = fileURLToPath(new URL('../storage/', import.meta.url));
export const TTL_MS = 24 * 60 * 60 * 1000;   // 24 ore
export const MAX_CHUNKS = 200;               // limite demo: circa 200 MB
export const MAX_CHUNK_BYTES = 1024 * 1024 + 16; // 1 MiB + tag GCM

const ID_RE = /^[A-Za-z0-9_-]{22}$/;
export const isValidId = (id) => ID_RE.test(id);

const dirOf = (id) => join(STORAGE_DIR, id);
const metaPath = (id) => join(dirOf(id), 'meta.json');
export const chunkPath = (id, n) => join(dirOf(id), `${n}.bin`);
export const manifestPath = (id) => join(dirOf(id), 'manifest.txt');

const sha256 = (s) => createHash('sha256').update(s).digest();

export async function createTransfer() {
  const id = randomBytes(16).toString('base64url');          // 128 bit, 22 caratteri
  const uploadToken = randomBytes(32).toString('base64url');
  const now = Date.now();
  const meta = {
    createdAt: now,
    expiresAt: now + TTL_MS,
    complete: false,
    chunkCount: null,
    tokenHash: sha256(uploadToken).toString('hex'),          // il token in chiaro non viene salvato
  };
  await mkdir(dirOf(id), { recursive: true });
  await writeFile(metaPath(id), JSON.stringify(meta));
  return { id, uploadToken, expiresAt: meta.expiresAt };
}

// Restituisce null se il trasferimento non esiste o è scaduto
export async function readMeta(id) {
  try {
    const meta = JSON.parse(await readFile(metaPath(id), 'utf8'));
    return meta.expiresAt > Date.now() ? meta : null;
  } catch {
    return null;
  }
}

export async function writeMeta(id, meta) {
  await writeFile(metaPath(id), JSON.stringify(meta));
}

export function checkToken(meta, token) {
  if (typeof token !== 'string' || token.length === 0) return false;
  return timingSafeEqual(sha256(token), Buffer.from(meta.tokenHash, 'hex'));
}

export async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

export async function deleteExpired() {
  const ids = await readdir(STORAGE_DIR).catch(() => []);
  for (const id of ids) {
    if (!isValidId(id)) continue;
    if (!(await readMeta(id))) await rm(dirOf(id), { recursive: true, force: true });
  }
}