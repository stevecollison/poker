import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  const { sessionId, userName } = await request.json();

  const session = await getSession(env, sessionId); // ✅ use env here

  session.users[userName] = {
    name: userName,
    vote: null,
    isAdmin: Object.keys(session.users).length === 0
  };

  await saveSession(env, sessionId, session); // ✅ use env here

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
