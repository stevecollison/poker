import { nanoid } from 'nanoid'

export async function onRequestGet() {
  const sessionId = nanoid(6)

  return new Response(JSON.stringify({ sessionId }), {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}
