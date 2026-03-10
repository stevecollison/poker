import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  try {
    const { sessionId, userName, userToken } = await request.json();

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

    if (!session.userTokens) {
      session.userTokens = {};
    }

    const existingUser = session.users[userName];

    if (existingUser) {
      const existingToken = session.userTokens[userName];
      if (!userToken || !existingToken || userToken !== existingToken) {
        return new Response(JSON.stringify({ error: 'User name is already in use' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const hasAdmin = Object.values(session.users).some(user => user.isAdmin);
    const isAdmin = existingUser?.isAdmin ?? !hasAdmin;
    const resolvedUserToken = existingUser
      ? session.userTokens[userName]
      : crypto.randomUUID();

    session.userTokens[userName] = resolvedUserToken;

    session.users[userName] = {
      name: userName,
      vote: existingUser?.vote ?? null,
      isAdmin,
    };

    await saveSession(env, sessionId, session);

    return new Response(JSON.stringify({ success: true, userToken: resolvedUserToken }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
