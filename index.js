// Scrum Poker Server using Express, Socket.IO and Redis (Upstash)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const path = require('path');
const Redis = require('ioredis');

const redis = new Redis(process.env.UPSTASH_REDIS_URL, {
  tls: {} // 👈 REQUIRED for Upstash to enable TLS
});

redis.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Redis session helpers
async function getSession(sessionId) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}

async function saveSession(sessionId, session) {
  await redis.set(`session:${sessionId}`, JSON.stringify(session), 'EX', 86400); // 1 day expiry
}

app.get('/create-session', async (req, res) => {
  const sessionId = nanoid(6);
  const session = {
    users: {},
    votesRevealed: false
  };
  await saveSession(sessionId, session);
  res.json({ sessionId });
});

io.on('connection', (socket) => {
  socket.on('join', async ({ sessionId, name }) => {
    const session = await getSession(sessionId);
    if (!session) {
      socket.emit('error', 'Session does not exist.');
      return;
    }

    const isAdmin = Object.keys(session.users).length === 0;
    session.users[socket.id] = { name, vote: null, isAdmin };
    await saveSession(sessionId, session);

    socket.join(sessionId);
    socket.sessionId = sessionId;

    io.to(sessionId).emit('state', {
      users: session.users,
      votesRevealed: session.votesRevealed
    });
  });

  socket.on('vote', async (voteValue) => {
    const sessionId = socket.sessionId;
    const session = await getSession(sessionId);
    if (!session) return;

    session.users[socket.id].vote = voteValue;
    await saveSession(sessionId, session);

    io.to(sessionId).emit('state', {
      users: session.users,
      votesRevealed: session.votesRevealed
    });

    const allVoted = Object.values(session.users)
      .filter(u => !u.isAdmin)
      .every(u => u.vote !== null && u.vote !== undefined);

    if (allVoted) {
      const adminSocketId = Object.entries(session.users)
        .find(([_, u]) => u.isAdmin)?.[0];

      if (adminSocketId) {
        io.to(adminSocketId).emit('everyoneVoted');
      }
    }
  });

  socket.on('reveal', async () => {
    const sessionId = socket.sessionId;
    const session = await getSession(sessionId);
    const user = session?.users[socket.id];
    if (!user?.isAdmin) return;

    session.votesRevealed = true;
    await saveSession(sessionId, session);

    io.to(sessionId).emit('state', {
      users: session.users,
      votesRevealed: true
    });
  });

  socket.on('clear', async () => {
    const sessionId = socket.sessionId;
    const session = await getSession(sessionId);
    const user = session?.users[socket.id];
    if (!user?.isAdmin) return;

    Object.values(session.users).forEach(u => u.vote = null);
    session.votesRevealed = false;
    await saveSession(sessionId, session);

    io.to(sessionId).emit('state', {
      users: session.users,
      votesRevealed: false
    });
  });

  socket.on('disconnect', async () => {
    const sessionId = socket.sessionId;
    const session = await getSession(sessionId);
    if (!session) return;

    delete session.users[socket.id];

    if (Object.keys(session.users).length === 0) {
      await redis.del(`session:${sessionId}`);
    } else {
      await saveSession(sessionId, session);
      io.to(sessionId).emit('state', {
        users: session.users,
        votesRevealed: session.votesRevealed
      });
    }
  });
});

// Serve index.html for all unmatched routes (like /abc123)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
