const BASE = '/api/files';

async function check(res) {
  if (!res.ok) {
    let msg = `Errore HTTP ${res.status}`;
    try { msg = (await res.json()).error ?? msg; } catch { /* corpo non JSON */ }
    throw new Error(msg);
  }
  return res;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

export async function createTransfer() {
  return (await check(await fetch(BASE, { method: 'POST' }))).json();
}

export async function uploadChunk(id, token, n, data) {
  await check(await fetch(`${BASE}/${id}/chunks/${n}`, {
    method: 'PUT',
    headers: { ...auth(token), 'Content-Type': 'application/octet-stream' },
    body: data,
  }));
}

export async function uploadManifest(id, token, manifest) {
  await check(await fetch(`${BASE}/${id}/manifest`, {
    method: 'PUT',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ manifest }),
  }));
}

export async function completeTransfer(id, token, chunkCount) {
  await check(await fetch(`${BASE}/${id}/complete`, {
    method: 'POST',
    headers: { ...auth(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({ chunkCount }),
  }));
}

export async function getTransfer(id) {
  return (await check(await fetch(`${BASE}/${id}`))).json();
}

export async function getChunk(id, n) {
  return (await check(await fetch(`${BASE}/${id}/chunks/${n}`))).arrayBuffer();
}