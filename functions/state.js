import { getSession, putSession } from './session.js';

export async function onRequestGet({ request }) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Missing sessionId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const session = await getSession(sessionId);

    if (!session || !session.users) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const users = Object.values(session.users);
    const nonAdminUsers = users.filter(u => !u.isAdmin);
    const allVoted = nonAdminUsers.length > 0 && nonAdminUsers.every(u => u.vote !== undefined && u.vote !== null);

    let triggerSound = false;

    if (allVoted && !session.triggerSoundSent) {
        session.triggerSoundSent = Date.now();
      triggerSound = true;
      await putSession(sessionId, session);
    }

    return new Response(
      JSON.stringify({
        users: session.users,
        revealed: session.revealed || false,
        triggerSound
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
