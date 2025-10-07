import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  try {
    const { sessionId, targetUser, requestedBy } = await request.json();

    if (!sessionId || !targetUser || !requestedBy) {
      return new Response(
        JSON.stringify({ error: 'Missing sessionId, targetUser, or requestedBy' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const session = await getSession(env, sessionId);

    if (!session || !session.users) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const requestingUser = session.users[requestedBy];

    if (!requestingUser || !requestingUser.isAdmin) {
      return new Response(JSON.stringify({ error: 'Only an admin can remove users' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!session.users[targetUser]) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const removedWasAdmin = session.users[targetUser]?.isAdmin;

    delete session.users[targetUser];

    if (removedWasAdmin) {
      const remainingUsers = Object.values(session.users);
      if (remainingUsers.length > 0) {
        const newAdmin = remainingUsers[0];
        session.users[newAdmin.name].isAdmin = true;
      }
    }

    await saveSession(env, sessionId, session);

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
