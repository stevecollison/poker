export async function onRequestPost(context) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
    const body = await context.request.json();
    const { sessionId } = body;
    const sessionKey = `session:${sessionId}`;
  
    const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });
  
    let rawSession = await getResp.json();
    // Check for 'result' first, then 'value'
    let session = rawSession.result
      ? JSON.parse(rawSession.result)
      : rawSession.value
        ? JSON.parse(rawSession.value)
        : null;
  
  
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  
    session.votesRevealed = true;
  
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
  