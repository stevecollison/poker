import { getSessionClient, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  try {
    let { sessionId, userName, vote } = await request.json();
    userName = userName.trim(); // ✅ Preserve casing

    const redis = getSessionClient(env);
    const session = await redis.get(`session:${sessionId}`);

    if (!session) {
      return new Response("Session not found", { status: 404 });
    }

    // ✅ Ensure users is an object (not array)
    session.users = session.users || {};

    const user = Object.values(session.users).find(
      u => u.name.toLowerCase() === userName.toLowerCase()
    );

    if (!user) {
      return new Response("User not in session", { status: 400 });
    }

    user.vote = vote;

    await saveSession(env, sessionId, session);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("🔥 Error in /vote:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
