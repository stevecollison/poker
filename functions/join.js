import { Redis } from "@upstash/redis/cloudflare";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });

    if (request.method === "POST" && path === "/join") {
      return await handleJoin(request, redis);
    }

    if (request.method === "POST" && path === "/vote") {
      return await handleVote(request, redis);
    }

    if (request.method === "POST" && path === "/reveal") {
      return await handleReveal(request, redis);
    }

    return new Response("Not Found", { status: 404 });
  }
};

async function handleJoin(request, redis) {
  const body = await request.json();
  const { sessionId, userName } = body;

  const sessionKey = `session:${sessionId}`;
  const existing = (await redis.get(sessionKey)) || { users: [], votes: {} };

  if (!existing.users.includes(userName)) {
    existing.users.push(userName);
  }

  await redis.set(sessionKey, existing, { ex: 86400 }); // expire in 24h

  return new Response(JSON.stringify(existing), {
    headers: { "Content-Type": "application/json" }
  });
}

async function handleVote(request, redis) {
  const body = await request.json();
  const { sessionId, userName, vote } = body;

  const sessionKey = `session:${sessionId}`;
  const session = (await redis.get(sessionKey)) || { users: [], votes: {} };

  session.votes[userName] = vote;

  await redis.set(sessionKey, session, { ex: 86400 });

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
}

async function handleReveal(request, redis) {
  const body = await request.json();
  const { sessionId } = body;

  const sessionKey = `session:${sessionId}`;
  const session = await redis.get(sessionKey);

  if (!session) {
    return new Response(JSON.stringify({ error: "Session not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response(JSON.stringify(session), {
    headers: { "Content-Type": "application/json" }
  });
}
