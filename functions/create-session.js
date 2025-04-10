export async function onRequestGet() {
    const nanoid = () =>
      crypto.randomUUID().replace(/-/g, '').slice(0, 6); // Simple fallback
  
    const sessionId = nanoid();
  
    return new Response(JSON.stringify({ sessionId }), {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
  