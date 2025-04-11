import { getSession, saveSession } from './lib/session';

export async function onRequestPost(context) {
  const { sessionId, userName } = await context.request.json();

  const session = await getSession(sessionId);

  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Check if this is the first user
  const isFirstUser = Object.keys(session.users).length === 0;

  // Add user to session
  session.users[userName] = {
    name: userName,
    vote: null,
    isAdmin: isFirstUser // ✅ add admin flag here
  };

  await saveSession(sessionId, session);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
