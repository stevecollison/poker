export async function onRequestPost(context) {
    try {
      const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
      if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
        return new Response("Missing Upstash credentials", { status: 500 });
      }
  
      const body = await context.request.json();
      const { sessionId, userName, vote } = body;
  
      if (!sessionId || !userName || vote === undefined) {
        return new Response("Missing sessionId, userName, or vote", { status: 400 });
      }
  
      const sessionKey = `session:${sessionId}`;
      const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      });
  
      const raw = await getResp.json();
      let session;
  
      try {
        session = raw?.result ? JSON.parse(raw.result) : JSON.parse(raw?.value);
      } catch (err) {
        return new Response("Failed to parse session", { status: 500 });
      }
  
      if (!session) {
        return new Response(JSON.stringify({ error: 'Session not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
  
      session.votes = {
        ...(session.votes || {}),
        [userName]: vote,
      };
  
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
    } catch (err) {
      return new Response(`Server error: ${err}`, { status: 500 });
    }
  }
  