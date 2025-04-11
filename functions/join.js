import { getSessionClient, saveSession } from './lib/session.js';


export async function onRequestPost(context) {
  const redis = getSessionClient(context.env);

  // Parse the request body
  const { sessionId, userName } = await context.request.json();

  // Fetch existing session
  const session = await redis.get(`session:${sessionId}`);

  if (!session) {
    return new Response('Session not found', { status: 404 });
  }

  // Check if this is the first user
  const isFirstUser = Object.keys(session.users).length === 0;

  // Add user to session
  session.users[userName] = {
    name: userName,
    vote: null,
    isAdmin: isFirstUser // ✅ admin flag correctly added
  };

  // Save session back to Redis
  await saveSession(context.env, sessionId, session);

  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
