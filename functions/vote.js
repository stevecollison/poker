export async function onRequestPost({ request, env }) {
    try {
      const { sessionId, userName, vote } = await request.json();
  
      const redisUrl = env.UPSTASH_REDIS_REST_URL;
      const redisToken = env.UPSTASH_REDIS_REST_TOKEN;
      const key = `session:${sessionId}`;
  
      // Get session
      const getRes = await fetch(`${redisUrl}/get/${key}`, {
        headers: {
          Authorization: `Bearer ${redisToken}`,
        },
      });
  
      const getData = await getRes.json();
      if (!getData.result) {
        return new Response("Session not found", { status: 404 });
      }
  
      const session = JSON.parse(getData.result);
      session.users = session.users || [];
  
      const user = session.users.find(u => u.name === userName);
      if (!user) {
        return new Response("User not in session", { status: 400 });
      }
  
      user.vote = vote;
  
      // Save session
      await fetch(`${redisUrl}/set/${key}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${redisToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          value: session,
          expiration: 86400,
        }),
      });
  
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
  
    } catch (err) {
      console.error("🔥 Error in /vote:", err);
      return new Response("Internal Server Error", { status: 500 });
    }
  }
  