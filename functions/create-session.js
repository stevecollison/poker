import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";

export async function onRequestGet(context) {
  const redis = new Redis({
    url: context.env.UPSTASH_REDIS_REST_URL,
    token: context.env.UPSTASH_REDIS_REST_TOKEN,
  });

  const sessionId = nanoid(6);
  const session = {
    users: {},
    votes: {},
    votesRevealed: false,
  };

  await redis.set(`session:${sessionId}`, JSON.stringify(session));

  return new Response(JSON.stringify({ sessionId }), {
    headers: { "Content-Type": "application/json" },
  });
}
