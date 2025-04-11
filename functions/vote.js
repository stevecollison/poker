import { Redis } from "@upstash/redis";

export async function onRequestPost(context) {
  const redis = new Redis({
    url: context.env.UPSTASH_REDIS_REST_URL,
    token: context.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    const { sessionId, userName, vote } = await context.request.json();
    const key = `session:${sessionId}`;
    const raw = await redis.get(key);

    if (!raw) {
      return new Response("Session not found", { status: 404 });
    }

    const session = JSON.parse(raw);
    session.users = session.users || [];

    const user = session.users.find(u => u.name === userName);
    if (!user) {
      return new Response("User not in session", { status: 400 });
    }

    user.vote = vote;

    await redis.set(key, JSON.stringify(session));

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("🔥 Error in /vote:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
