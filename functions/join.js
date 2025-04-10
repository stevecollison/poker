import { Redis } from "@upstash/redis";

export async function onRequestPost(context) {
  const redis = new Redis({
    url: context.env.UPSTASH_REDIS_REST_URL,
    token: context.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const { sessionId, userName } = await context.request.json();
  const key = `session:${sessionId}`;
  const raw = await redis.get(key);

  let session;
  if (raw) {
    session = JSON.parse(raw);
  } else {
    session = {
      users: {},
      votes: {},
      votesRevealed: false,
    };
  }

  session.users[userName] = { name: userName, vote: null };

  if (Object.keys(session.users).length === 1) {
    session.users[userName].isAdmin = true;
  }

  await redis.set(key, JSON.stringify(session));

  return new Response(null, { status: 200 });
}
