import { test, expect } from 'vitest';

test('WebCrypto disponibile e AES-GCM funzionante', async () => {
  const key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const data = new TextEncoder().encode('ciao');
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
  expect(new TextDecoder().decode(pt)).toBe('ciao');
});