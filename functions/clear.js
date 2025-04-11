import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  const { sessionId } = await request.json();

  const session = await getSession(env, sessionId); // ✅ uses env

  for (const user of Object.values(session.users || {})) {
    user.vote = null;
  }

  session.revealed = false;

  await saveSession(env, sessionId, session); // ✅ saves using env

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
