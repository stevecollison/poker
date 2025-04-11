import { getSession, saveSession } from './lib/session';

export async function onRequestPost({ request, env }) {
  const { sessionId, userName, vote } = await request.json();
  const session = await getSession(env, sessionId); // ✅ use Redis

  if (session.users?.[userName]) {
    session.users[userName].vote = vote;
  }

  await saveSession(env, sessionId, session); // ✅ persist update

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
