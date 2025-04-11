import { get, set } from '@upstash/redis';

export async function getSession(sessionId) {
  const session = await get(sessionId);
  return session || { users: [], value: null, revealed: false };
}

export async function saveSession(sessionId, session) {
  await set(sessionId, session);
}
