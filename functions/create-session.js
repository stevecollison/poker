import { saveSession } from './lib/session.js';
import { nanoid } from 'nanoid';

export async function onRequestGet({ request, env }) {
  try {
    const sessionId = nanoid(8);
    const url = new URL(request.url);
    const allowSharedControls = url.searchParams.get('allowSharedControls') === 'true';

    const session = {
      users: {},
      revealed: false,
      allowSharedControls,
    };

    await saveSession(env, sessionId, session);

    return new Response(JSON.stringify({ sessionId }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
