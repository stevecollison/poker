import { Redis } from '@upstash/redis/cloudflare';

export function getSessionClient(env) {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function getSession(sessionId, env) {
  const redis = getSessionClient(env);
  const result = await redis.get(sessionId);
  return result || { users: [], value: null, revealed: false };
}

export async function saveSession(sessionId, session, env) {
  const redis = getSessionClient(env);
  await redis.set(sessionId, session, { ex: 86400 });
}
