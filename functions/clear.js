import { Redis } from "@upstash/redis";

export async function onRequestPost(context) {
  const redis = new Redis({
    url: context.env.UPSTASH_REDIS_REST_URL,
    token: context.env.UPSTASH_REDIS_REST_TOKEN,
  });

  try {
    const { sessionId } = await context.request.json();
    const key = `session:${sessionId}`;
    const raw = await redis.get(key);

    if (!raw) {
      return new Response("Session not found", { status: 404 });
    }

    const session = JSON.parse(raw);
    for (const user of Object.values(session.users || {})) {
      user.vote = null;
    }
    session.votesRevealed = false;

    await redis.set(key, JSON.stringify(session));

    return new Response(JSON.stringify(session), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("🔥 Error in /clear:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
