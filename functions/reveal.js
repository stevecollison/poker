import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  const { sessionId } = await request.json();

  const session = await getSession(env, sessionId); // ✅ uses env

  session.revealed = true;

  await saveSession(env, sessionId, session); // ✅ saves using env

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
