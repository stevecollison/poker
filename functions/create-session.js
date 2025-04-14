import { saveSession } from './lib/session.js';
import { nanoid } from 'nanoid';

export async function onRequestGet({ env }) {
  try {
    const sessionId = nanoid(8);

    const session = {
      users: {},
      revealed: false,
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
