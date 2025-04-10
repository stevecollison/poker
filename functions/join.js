import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function onRequestPost(context) {
  const { sessionId, userName } = await context.request.json();
  const key = `session:${sessionId}`;
  let session = await redis.get(key);

  if (session) {
    session = JSON.parse(session); // 🔥 just once
  } else {
    session = {
      users: {},
      votes: {},
      votesRevealed: false
    };
  }

  session.users[userName] = { name: userName, vote: null };

  if (Object.keys(session.users).length === 1) {
    session.users[userName].isAdmin = true;
  }

  await redis.set(key, JSON.stringify(session)); // ✅ one-layer serialization

  return new Response(null, { status: 200 });
}
