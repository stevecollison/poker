import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  try {
    const { sessionId, userName } = await request.json();

    if (!sessionId || !userName) {
      return new Response(JSON.stringify({ error: 'Missing sessionId or userName' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const session = await getSession(env, sessionId);

    if (!session.users) {
      session.users = {};
    }

    const existingUser = session.users[userName];
    const hasAdmin = Object.values(session.users).some(user => user.isAdmin);
    const isAdmin = existingUser?.isAdmin ?? !hasAdmin;

    session.users[userName] = {
      name: userName,
      vote: null,
      isAdmin,
    };

    await saveSession(env, sessionId, session);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
