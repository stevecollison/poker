export async function onRequestPost(context) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
    const body = await context.request.json();
    const { sessionId } = body;
  
    const sessionKey = `session:${sessionId}`;
  
    // Fetch current session data
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
      console.error("Failed to parse session:", e);
      session = null;
    }
  
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  
    // Update session state
    session.votesRevealed = true;
  
    // Save back to Upstash
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
  
    // Return updated session
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  