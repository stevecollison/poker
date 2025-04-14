import { getSession, saveSession } from './session';

export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId');

  if (!sessionId) {
    return new Response(JSON.stringify({ error: 'Missing sessionId' }), { status: 400 });
  }

  const session = await getSession(sessionId);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Session not found' }), { status: 404 });
  }

  const users = session.users || {};
  const revealed = session.revealed || false;

  // Check if all non-admin users have voted
  const nonAdminUsers = Object.values(users).filter(u => !u.isAdmin);
  const allVoted = nonAdminUsers.length > 0 &&
                   nonAdminUsers.every(u => u.vote !== undefined && u.vote !== null);

  // Trigger sound one time for all users
  if (allVoted && !session.triggerSoundSent) {
    session.triggerSound = true;         // Tell frontend to play sound
    session.triggerSoundSent = true;     // Lock so it's only sent once
    await saveSession(sessionId, session);
  } else {
    session.triggerSound = false;        // Reset if already sent
  }

  return new Response(JSON.stringify({
    users,
    revealed,
    triggerSound: session.triggerSound || false
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
