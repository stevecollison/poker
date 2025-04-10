export async function onRequestPost(context) {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
  const body = await context.request.json();
  const { sessionId, userName } = body;
  const sessionKey = `session:${sessionId}`;

  const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
  });

  const data = await getResp.json();
  let session = data.result ? JSON.parse(data.result) : null;

  if (!session) {
    session = { users: [], votes: {}, votesRevealed: false };
  }

  if (!session.users.includes(userName)) {
    session.users.push(userName);
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
