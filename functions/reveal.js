export async function onRequestPost(context) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
    const body = await context.request.json();
    const { sessionId } = body;
    const sessionKey = `session:${sessionId}`;
  
    // Fetch the stored session from Upstash
    const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });
  
    let rawSession = await getResp.json();
    console.log("Raw Upstash GET response:", rawSession);
  
    // Try to parse the session from the "value" property
    let session = null;
    if (rawSession && rawSession.value) {
      try {
        session = JSON.parse(rawSession.value);
      } catch (e) {
        console.error("Error parsing session value:", e);
        session = null;
      }
    }
  
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  
    // Update session: reveal votes
    session.votesRevealed = true;
  
    // Save the updated session back to Upstash
    await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        value: JSON.stringify(session),
        expiration: 86400
      })
    });
  
    // Return the parsed session object to the client
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  