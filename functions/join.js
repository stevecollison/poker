export async function onRequestPost(context) {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
  const body = await context.request.json();
  const { sessionId, userName } = body;
  const sessionKey = `session:${sessionId}`;

  // Fetch current session
  const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
    headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
  });

  let raw = await getResp.json();
  let session = raw.result || raw.value;

  // Parse if it's a string
  if (typeof session === 'string') {
    try {
      session = JSON.parse(session);
    } catch {
      session = null;
    }
  }

  // Default session if new
  if (!session || typeof session !== 'object') {
    session = {
      users: [],
      votes: {},
      votesRevealed: false
    };
  }

  // Add user if not already added
  if (!session.users.includes(userName)) {
    session.users.push(userName);
  }

  // Save session (DO NOT double stringify!)
  await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: session,
      expiration: 86400,
    }),
  });

  return new Response(JSON.stringify(session), {
    headers: { 'Content-Type': 'application/json' },
  });
}
