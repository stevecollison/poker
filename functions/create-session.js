import { nanoid } from 'nanoid';

export async function onRequestGet(context) {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
  const sessionId = nanoid(6);
  const sessionKey = `session:${sessionId}`;

  const session = {
    users: [],
    votes: {},
    votesRevealed: false,
  };

  await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: JSON.stringify(session),
      expiration: 86400,
    }),
  });

  return new Response(JSON.stringify({ sessionId }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
