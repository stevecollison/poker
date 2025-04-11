import { getSession, saveSession } from './lib/session';

export async function onRequestPost({ request, env }) {
  const { sessionId } = await request.json();
  const session = await getSession(env, sessionId); // ✅ Load from Redis

  session.revealed = true;

  await saveSession(env, sessionId, session); // ✅ Save back to Redis

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
