export async function onRequest({ request, env }) {
  try {
    const { sessionId, userName } = await request.json();
    const redisUrl = env.UPSTASH_REDIS_REST_URL;
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

    // Get the session
    const res = await fetch(`${redisUrl}/get/${sessionId}`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
      },
    });

    const data = await res.json();
    if (!data.result) throw new Error('Session not found');

    const session = JSON.parse(data.result);

    // Ensure users list exists
    session.users = session.users || [];

    // Add the user if not already in the session
    if (!session.users.find(u => u.name === userName)) {
      const isAdmin = session.users.length === 0;
      session.users.push({ name: userName, vote: null, isAdmin });
    }

    // Save updated session back to Redis
    await fetch(`${redisUrl}/set/${sessionId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: session,
        expiration: 86400,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('🔥 Error in /join:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
