import { getSession, saveSession } from './lib/session';

export async function onRequestPost({ request, env }) {
  const { sessionId } = await request.json();
  const session = await getSession(env, sessionId); // ✅ Load from Redis

  for (const user of Object.values(session.users || {})) {
    user.vote = null;
  }

  session.revealed = false;

  await saveSession(env, sessionId, session); // ✅ Save back to Redis

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
