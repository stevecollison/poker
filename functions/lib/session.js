import { Redis } from '@upstash/redis/cloudflare';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export async function getSession(sessionId) {
  const result = await redis.get(sessionId);
  return result || { users: [], value: null, revealed: false };
}

export async function saveSession(sessionId, session) {
  await redis.set(sessionId, session, { ex: 86400 }); // Optional expiry (24h)
}
