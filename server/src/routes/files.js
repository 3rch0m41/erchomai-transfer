import { writeFile, readFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import {
  createTransfer, readMeta, writeMeta, checkToken, exists, isValidId,
  chunkPath, manifestPath, MAX_CHUNKS, MAX_CHUNK_BYTES,
} from '../storage.js';

const idParams = {
  type: 'object',
  properties: { id: { type: 'string', pattern: '^[A-Za-z0-9_-]{22}$' } },
  required: ['id'],
};
const chunkParams = {
  type: 'object',
  properties: { ...idParams.properties, n: { type: 'integer', minimum: 0, maximum: MAX_CHUNKS - 1 } },
  required: ['id', 'n'],
};

export default async function filesRoutes(app) {
  app.decorateRequest('meta', null);

  async function loadTransfer(req, reply) {
    const meta = isValidId(req.params.id) ? await readMeta(req.params.id) : null;
    if (!meta) return reply.code(404).send({ error: 'Trasferimento non trovato' });
    req.meta = meta;
  }

  async function requireUploader(req, reply) {
    const auth = req.headers.authorization ?? '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!checkToken(req.meta, token)) return reply.code(401).send({ error: 'Token non valido' });
    if (req.meta.complete) return reply.code(409).send({ error: 'Trasferimento già completato' });
  }

  app.post('/api/files', async (req, reply) => {
    return reply.code(201).send(await createTransfer());
  });

  app.put('/api/files/:id/chunks/:n', {
    schema: { params: chunkParams },
    bodyLimit: MAX_CHUNK_BYTES,
    preHandler: [loadTransfer, requireUploader],
  }, async (req, reply) => {
    if (!Buffer.isBuffer(req.body) || req.body.length < 16) {
      return reply.code(400).send({ error: 'Chunk non valido' });
    }
    await writeFile(chunkPath(req.params.id, req.params.n), req.body);
    return reply.code(204).send();
  });

  app.put('/api/files/:id/manifest', {
    schema: {
      params: idParams,
      body: {
        type: 'object',
        required: ['manifest'],
        properties: { manifest: { type: 'string', pattern: '^[A-Za-z0-9_-]{40,4096}$' } },
        additionalProperties: false,
      },
    },
    preHandler: [loadTransfer, requireUploader],
  }, async (req, reply) => {
    await writeFile(manifestPath(req.params.id), req.body.manifest);
    return reply.code(204).send();
  });

  app.post('/api/files/:id/complete', {
    schema: {
      params: idParams,
      body: {
        type: 'object',
        required: ['chunkCount'],
        properties: { chunkCount: { type: 'integer', minimum: 1, maximum: MAX_CHUNKS } },
        additionalProperties: false,
      },
    },
    preHandler: [loadTransfer, requireUploader],
  }, async (req, reply) => {
    const { id } = req.params;
    const { chunkCount } = req.body;
    if (!(await exists(manifestPath(id)))) return reply.code(400).send({ error: 'Manifest mancante' });
    for (let n = 0; n < chunkCount; n++) {
      if (!(await exists(chunkPath(id, n)))) return reply.code(400).send({ error: `Chunk ${n} mancante` });
    }
    await writeMeta(id, { ...req.meta, complete: true, chunkCount });
    return reply.code(204).send();
  });

  app.get('/api/files/:id', {
    schema: { params: idParams },
    preHandler: loadTransfer,
  }, async (req, reply) => {
    if (!req.meta.complete) return reply.code(404).send({ error: 'Trasferimento non trovato' });
    const manifest = await readFile(manifestPath(req.params.id), 'utf8');
    return { manifest, chunkCount: req.meta.chunkCount, expiresAt: req.meta.expiresAt };
  });

  app.get('/api/files/:id/chunks/:n', {
    schema: { params: chunkParams },
    preHandler: loadTransfer,
  }, async (req, reply) => {
    const { id, n } = req.params;
    if (!req.meta.complete || n >= req.meta.chunkCount) {
      return reply.code(404).send({ error: 'Chunk non trovato' });
    }
    reply.header('Content-Type', 'application/octet-stream');
    return reply.send(createReadStream(chunkPath(id, n)));
  });
}