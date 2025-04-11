import { getSession } from './lib/session.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const sessionId = url.searchParams.get('sessionId');

    const session = await getSession(env, sessionId);

    if (!session) {
      return new Response("Session not found", { status: 404 });
    }

    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error("🔥 Error in /state:", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
