export async function onRequestPost(context) {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
  const body = await context.request.json();
  const { sessionId, userName } = body;
  const sessionKey = `session:${sessionId}`;

  const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
  });

  let sessionData = await getResp.json();
  let session = sessionData.result
    ? JSON.parse(sessionData.result)
    : sessionData.value
      ? JSON.parse(sessionData.value)
      : { users: [], votes: {}, votesRevealed: false };

  // Convert legacy string users to object format if needed
  if (Array.isArray(session.users) && typeof session.users[0] === "string") {
    session.users = session.users.map(name => ({ name }));
  }

  // Only add user if they don't exist already
  if (!session.users.some(u => u.name === userName)) {
    session.users.push({
      name: userName,
      isAdmin: session.users.length === 0, // First user is admin
      vote: null
    });
  }

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

  return new Response(JSON.stringify(session), {
    headers: { 'Content-Type': 'application/json' },
  });
}
