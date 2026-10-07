import Fastify from 'fastify';
import { mkdir } from 'node:fs/promises';
import filesRoutes from './routes/files.js';
import { STORAGE_DIR, deleteExpired } from './storage.js';

// Limite di default basso: solo la rotta dei chunk accetta corpi più grandi
const app = Fastify({ logger: true, bodyLimit: 16 * 1024 });

app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer' },
  (req, body, done) => done(null, body));

app.addHook('onSend', async (req, reply, payload) => {
  reply.header('Cache-Control', 'no-store');
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Referrer-Policy', 'no-referrer');
  return payload;
});

app.get('/api/health', async () => ({ status: 'ok' }));
await app.register(filesRoutes);

await mkdir(STORAGE_DIR, { recursive: true });
setInterval(() => deleteExpired().catch((err) => app.log.error(err)), 10 * 60 * 1000).unref();

await app.listen({ port: 3000, host: '127.0.0.1' });