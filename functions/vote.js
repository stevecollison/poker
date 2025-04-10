import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function onRequestPost(context) {
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
