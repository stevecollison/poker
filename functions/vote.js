import { Redis } from '@upstash/redis/cloudflare';

export async function onRequestPost(context) {
  const redis = new Redis({
    url: context.env.UPSTASH_REDIS_REST_URL,
    token: context.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const body = await context.request.json();
  const { sessionId, userName, vote } = body;

  const sessionKey = `session:${sessionId}`;
  const session = (await redis.get(sessionKey)) || { users: [], votes: {} };

  session.votes = session.votes || {};
  session.votes[userName] = vote;

  await redis.set(sessionKey, session, { ex: 86400 });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
