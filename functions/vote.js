import { Redis } from "@upstash/redis";

export async function onRequestPost(context) {
  const redis = new Redis({
    url: context.env.UPSTASH_REDIS_REST_URL,
    token: context.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const { sessionId, userName, vote } = await context.request.json();
  const key = `session:${sessionId}`;
  const raw = await redis.get(key);

  if (!raw) {
    return new Response("Session not found", { status: 404 });
  }

  const session = JSON.parse(raw);
  if (!session.users[userName]) {
    return new Response("User not in session", { status: 400 });
  }

  session.users[userName].vote = vote;

  await redis.set(key, JSON.stringify(session));

  return new Response(null, { status: 200 });
}
