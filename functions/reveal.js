import { getSession, saveSession } from './lib/session.js';
export async function onRequest({ request, env }) {
    try {
      const { sessionId } = await request.json();
      const redisUrl = env.UPSTASH_REDIS_REST_URL;
      const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
  
      const res = await fetch(`${redisUrl}/get/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
  
      const data = await res.json();
      if (!data.result) throw new Error('Session not found');
  
      const session = JSON.parse(data.result);
      session.votesRevealed = true;
  
      // Save updated session
      await fetch(`${redisUrl}/set/${sessionId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${redisToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          value: session,
          expiration: 86400,
        }),
      });
  
      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      console.error('🔥 Error in /reveal:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  }
  