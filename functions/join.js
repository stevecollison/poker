export async function onRequestPost(context) {
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
  const body = await context.request.json();
  const { sessionId, userName } = body;

  const sessionKey = `session:${sessionId}`;

  // Fetch current session from Upstash
  const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
    },
  });

  const raw = await getResp.json();

  let session;
  try {
    session = raw.result
      ? JSON.parse(raw.result)
      : raw.value
        ? JSON.parse(raw.value)
        : null;
  } catch (e) {
    console.error("Error parsing session:", e);
    session = null;
  }

  // If not found, initialize
  if (!session) {
    session = {
      users: [],
      votes: {},
      votesRevealed: false,
    };
  }

  // Add user if not already added
  if (!session.users.includes(userName)) {
    session.users.push(userName);
  }

  // Save back to Upstash
  await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      value: JSON.stringify(session), // ✅ Only one level of stringification
      expiration: 86400,
    }),
  });

  // Return session data to client
  return new Response(JSON.stringify(session), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
