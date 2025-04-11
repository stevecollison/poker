import { getSession, saveSession } from './lib/session.js';


export async function onRequestPost({ request }) {
  const { sessionId, userName } = await request.json();

  const session = getSession(sessionId);

  // Create user entry
  session.users[userName] = {
    name: userName,
    vote: null,
    isAdmin: Object.keys(session.users).length === 0
  };

  saveSession(sessionId, session); // ✅ Persist the session update

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
