import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  try {
    const { sessionId, userName, userToken, vote } = await request.json();

    if (!sessionId || !userName) {
      return new Response(JSON.stringify({ error: 'Missing sessionId or userName' }), {
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


    if (!session.users[userName] || !session.userTokens || !session.userTokens[userName] || session.userTokens[userName] !== userToken) {
      return new Response(JSON.stringify({ error: 'Unauthorized vote update' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    session.users[userName].vote = vote;

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
