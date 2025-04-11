import { getSession } from './lib/session';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  const session = await getSession(env, sessionId); // ✅ Load from Redis

  return new Response(JSON.stringify(session), {
    headers: { 'Content-Type': 'application/json' },
  });
}
