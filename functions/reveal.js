export async function onRequestPost(context) {
    try {
      const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = context.env;
      const body = await context.request.json();
      const { sessionId } = body;
      const sessionKey = `session:${sessionId}`;
  
      // Fetch the stored session from Upstash
      const getResp = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${sessionKey}`, {
        headers: { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` },
      });
  
      if (!getResp.ok) {
        throw new Error(`Upstash GET failed with status ${getResp.status}`);
      }
  
      let rawSession = await getResp.json();
      console.log("Raw Upstash GET response:", rawSession);
  
      // Parse the session strictly from the "value" property
      let session = null;
      if (rawSession && rawSession.value) {
        try {
          session = JSON.parse(rawSession.value);
        } catch (e) {
          console.error("Error parsing session value:", e);
          throw new Error("Failed to parse session value");
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
      const setResp = await fetch(`${UPSTASH_REDIS_REST_URL}/set/${sessionKey}`, {
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
  
      if (!setResp.ok) {
        throw new Error(`Upstash SET failed with status ${setResp.status}`);
      }
  
      return new Response(JSON.stringify(session), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error("Error in reveal function:", error);
      return new Response(JSON.stringify({ error: error.toString() }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
  