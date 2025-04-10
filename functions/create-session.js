export async function onRequestGet(context) {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;

  // ✅ Generate a simple random session ID (6-character alphanumeric)
  const sessionId = Math.random().toString(36).substring(2, 8);
  const sessionKey = `session:${sessionId}`;

  const session = {
    users: [],
    votes: {},
    votesRevealed: false
  };

  await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: session,
      expiration: 86400
    })
  });

  return new Response(JSON.stringify({ sessionId }), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
}
