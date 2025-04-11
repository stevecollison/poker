import { getSessionClient, saveSession } from './lib/session.js';

export async function onRequestPost(context) {
  const redis = getSessionClient(context.env);
  const { sessionId, userName } = await context.request.json();

  const sessionRaw = await redis.get(`session:${sessionId}`);
  if (!sessionRaw) {
    return new Response('Session not found', { status: 404 });
  }

  const session = typeof sessionRaw === 'string' ? JSON.parse(sessionRaw) : sessionRaw;

  const isFirstUser = Object.keys(session.users || {}).length === 0;

  session.users = session.users || {};
  session.users[userName] = {
    name: userName,
    vote: null,
    isAdmin: isFirstUser,
  };

  await saveSession(context.env, sessionId, session);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
