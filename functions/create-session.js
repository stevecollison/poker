import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid";

const redis = Redis.fromEnv();

export async function onRequestGet() {
  const sessionId = nanoid(6);
  const session = {
    users: {},
    votes: {},
    votesRevealed: false
  };

  await redis.set(`session:${sessionId}`, JSON.stringify(session));

  return new Response(JSON.stringify({ sessionId }), {
    headers: { "Content-Type": "application/json" }
  });
}
