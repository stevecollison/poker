export async function onRequestPost(context) {
    const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
    const body = await context.request.json();
    const { sessionId, userName, vote } = body;
    const sessionKey = `session:${sessionId}`;
  
    const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
      headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
    });
  
    let session = await getResp.json();
    session = session.result ? JSON.parse(session.result) : { users: [], votes: {}, votesRevealed: false };
  
    session.votes = session.votes || {};
    session.votes[userName] = vote;
  
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
  
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  