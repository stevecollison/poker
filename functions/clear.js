import { Redis } from '@upstash/redis/cloudflare';

export async function onRequestPost(context) {
  const redis = new Redis({
    url: context.env.UPSTASH_REDIS_REST_URL,
    token: context.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const body = await context.request.json();
  const { sessionId } = body;

  const sessionKey = `session:${sessionId}`;
  const session = await redis.get(sessionKey);

  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  session.votes = {};
  session.votesRevealed = false;

  await redis.set(sessionKey, session, { ex: 86400 });

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
