import { Redis } from "@upstash/redis";
import { nanoid } from "nanoid/non-secure";

export async function onRequestGet(context) {
  try {
    console.log("🔍 ENV", context.env);

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

    console.log("✅ Session created:", sessionId);

    return new Response(JSON.stringify({ sessionId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🔥 Error creating session:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
