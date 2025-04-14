import { getSession, saveSession as putSession } from './lib/session.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await getSession(env, sessionId);

    if (!session || !session.users) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const users = Object.values(session.users);
    const nonAdminUsers = users.filter(u => !u.isAdmin);
    const allVoted = nonAdminUsers.length > 0 && nonAdminUsers.every(u => u.vote !== undefined && u.vote !== null);

    if (allVoted && !session.triggerSoundSent) {
      session.triggerSoundSent = Date.now(); // timestamp ensures uniqueness
      await putSession(env, sessionId, session);
    }

    return new Response(
      JSON.stringify({
        users: session.users,
        revealed: session.revealed || false,
        triggerSound: session.triggerSoundSent || null // return timestamp
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
