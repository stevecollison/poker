import { saveSession } from './lib/session.js';
import { nanoid } from 'nanoid';

export async function onRequestGet({ request, env }) {
  try {
    const sessionId = nanoid(8);
    const url = new URL(request.url);
    const allowSharedControls = url.searchParams.get('allowSharedControls') === 'true';
    const rawCards = url.searchParams.get('cards');
    const allowedCardValues = new Set([0, 1, 2, 3, 5, 8, 13, '?', '☕']);

    const parsedCards = rawCards
      ? rawCards
          .split(',')
          .map(value => {
            if (value === '?' || value === '☕') {
              return value;
            }
            const numberValue = Number(value);
            return Number.isNaN(numberValue) ? null : numberValue;
          })
          .filter(value => value !== null && allowedCardValues.has(value))
      : [];

    const availableCards = parsedCards.length
      ? parsedCards
      : [0, 1, 2, 3, 5, 8, 13, '?', '☕'];

    const session = {
      users: {},
      revealed: false,
      allowSharedControls,
      availableCards,
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
