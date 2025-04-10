export async function onRequestPost(context) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
    const body = await context.request.json();
    const { sessionId } = body;
    const sessionKey = `session:${sessionId}`;
  
    // Fetch from Upstash
    const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });
  
    const data = await getResp.json();
    let session;
  
    try {
      session = JSON.parse(data.result || data.value);
    } catch (err) {
      console.error('❌ Failed to parse session:', err);
      return new Response(JSON.stringify({ error: 'Invalid session format' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  
    // Safety check
    if (!session || typeof session !== 'object') {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  
    // Reveal votes
    session.votesRevealed = true;
  
    // Save it back
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
  