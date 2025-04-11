import { getSession, saveSession } from './lib/session.js';

export async function onRequestPost({ request, env }) {
  try {
    let { sessionId, userName, vote } = await request.json();
    userName = userName.trim().toLowerCase();

    const session = await getSession(env, sessionId);

    if (!session) {
      return new Response("Session not found", { status: 404 });
    }

    session.users = session.users || {};

    if (!session.users[userName]) {
      return new Response("User not in session", { status: 400 });
    }

    session.users[userName].vote = vote;

    await saveSession(env, sessionId, session);

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("🔥 Error in /vote:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
