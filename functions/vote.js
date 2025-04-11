import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  const { sessionId, userName, vote } = await request.json();

  const session = await getSession(env, sessionId); // ✅ uses env for Redis

  if (session.users?.[userName]) {
    session.users[userName].vote = vote;
  }

  await saveSession(env, sessionId, session); // ✅ save back to Redis

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
