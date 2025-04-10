export async function onRequestPost(context) {
  try {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
    if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
      console.error("Missing Upstash env variables");
      return new Response("Missing Upstash credentials", { status: 500 });
    }

    const body = await context.request.json();
    const { sessionId, userName } = body;
    console.log("Received join request for:", { sessionId, userName });

    if (!sessionId || !userName) {
      console.error("Missing sessionId or userName");
      return new Response("Missing sessionId or userName", { status: 400 });
    }

    const sessionKey = `session:${sessionId}`;
    const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });

    const raw = await getResp.json();
    console.log("Raw GET response from Upstash:", raw);

    let session;
    try {
      session = raw.result
        ? JSON.parse(raw.result)
        : raw.value
        ? JSON.parse(raw.value)
        : { users: [], votes: {}, votesRevealed: false };
    } catch (e) {
      console.error("Error parsing session JSON:", e);
      session = { users: [], votes: {}, votesRevealed: false };
    }

    if (!Array.isArray(session.users)) {
      session.users = [];
    }

    if (!session.users.includes(userName)) {
      session.users.push(userName);
    }

    const setResp = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
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

    if (!setResp.ok) {
      const text = await setResp.text();
      console.error("Failed to store session in Upstash:", text);
      return new Response("Failed to store session", { status: 500 });
    }

    console.log("Session stored successfully:", session);

    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error("Unexpected error in join.js:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
