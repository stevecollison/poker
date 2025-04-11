import { Redis } from '@upstash/redis/cloudflare';

export function getSessionClient(env) {
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export async function getSession(env, sessionId) {
  const redis = getSessionClient(env);
  const result = await redis.get(`session:${sessionId}`);
  return result || { users: {}, votes: {}, revealed: false };
}

export async function saveSession(env, sessionId, session) {
  const redis = getSessionClient(env);
  await redis.set(`session:${sessionId}`, session, { ex: 86400 });
}
