import { customAlphabet } from 'nanoid';

export async function onRequest({ request, env }) {
  try {
    const redisUrl = env.UPSTASH_REDIS_REST_URL;
    const redisToken = env.UPSTASH_REDIS_REST_TOKEN;

    const nanoid = customAlphabet('abcdefghijklmnopqrstuvwxyz0123456789', 8);
    const sessionId = nanoid();

    const session = {
      users: [],
      votes: {},
      revealed: false,
    };

    const response = await fetch(`${redisUrl}/set/${sessionId}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        value: session,
        expiration: 86400, // 1 day
      }),
    });

    if (!response.ok) {
      throw new Error(`Upstash error: ${response.status} ${await response.text()}`);
    }

    return new Response(JSON.stringify({ sessionId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('🔥 Error creating session:', err);
    return new Response('Internal Server Error', { status: 500 });
  }
}
