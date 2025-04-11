import { getSession, saveSession } from '../lib/session';

export async function onRequestGet({ request, env }) {
    try {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get('sessionId');
  
      const redisUrl = env.UPSTASH_REDIS_REST_URL;
      const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
  
      const getRes = await fetch(`${redisUrl}/get/${sessionId}`, {
        headers: { Authorization: `Bearer ${redisToken}` }
      });
  
      const getData = await getRes.json();
      if (!getData.result) {
        return new Response("Session not found", { status: 404 });
      }
  
      const session = JSON.parse(getData.result);
  
      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json' },
      });
  
    } catch (err) {
      console.error("🔥 Error in /state:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  