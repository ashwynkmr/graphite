import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import type { Store } from './store.js';
import { isPushEndpoint, originAllowed, parseSubscription } from './validate.js';

const REQUESTS_PER_MINUTE = 30;
const BODY_LIMIT_BYTES = 4096;

export async function buildApp(args: { store: Store; allowedOrigins: readonly string[]; maxSubscriptions: number }) {
  const { store, allowedOrigins, maxSubscriptions } = args;
  // No request logging: a request's address and body identify a phone.
  const app = Fastify({ logger: false, bodyLimit: BODY_LIMIT_BYTES, trustProxy: true });

  await app.register(cors, {
    origin: (origin, done) => done(null, !origin || originAllowed(origin, allowedOrigins)),
    methods: ['PUT', 'DELETE'],
  });
  await app.register(rateLimit, { max: REQUESTS_PER_MINUTE, timeWindow: '1 minute' });

  app.get('/health', async () => ({ ok: true }));

  app.put('/subscription', async (request, reply) => {
    const input = parseSubscription(request.body, Date.now());
    if (!input) return reply.code(400).send({ error: 'invalid' });
    const saved = await store.upsert(input, maxSubscriptions);
    return saved ? reply.code(204).send() : reply.code(503).send({ error: 'full' });
  });

  app.delete('/subscription', async (request, reply) => {
    const endpoint = (request.body as { endpoint?: unknown } | null)?.endpoint;
    if (!isPushEndpoint(endpoint)) return reply.code(400).send({ error: 'invalid' });
    await store.remove(endpoint);
    return reply.code(204).send();
  });

  return app;
}
