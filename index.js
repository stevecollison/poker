// Simple Scrum Poker Server (Node.js + Express + Socket.IO)
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

const sessions = {}; // In-memory session storage

app.use(express.static(path.join(__dirname, 'public')));

app.get('/create-session', (req, res) => {
  const sessionId = nanoid(6);
  sessions[sessionId] = {
    users: {},
    votesRevealed: false,
    admin: null
  };
  res.json({ sessionId });
});

io.on('connection', (socket) => {
  socket.on('join', ({ sessionId, name }) => {
    if (!sessions[sessionId]) {
      socket.emit('error', 'Session does not exist.');
      return;
    }

    const session = sessions[sessionId];
    const isAdmin = Object.keys(session.users).length === 0;
    session.users[socket.id] = { name, vote: null, isAdmin };
    socket.join(sessionId);
    socket.sessionId = sessionId;

    io.to(sessionId).emit('state', {
      users: session.users,
      votesRevealed: session.votesRevealed
    });
  });

  socket.on('vote', (voteValue) => {
    const sessionId = socket.sessionId;
    if (!sessionId || !sessions[sessionId]) return;
    sessions[sessionId].users[socket.id].vote = voteValue;

    io.to(sessionId).emit('state', {
      users: sessions[sessionId].users,
      votesRevealed: sessions[sessionId].votesRevealed
    });
  });

  socket.on('reveal', () => {
    const sessionId = socket.sessionId;
    const user = sessions[sessionId]?.users[socket.id];
    if (!user?.isAdmin) return;

    sessions[sessionId].votesRevealed = true;
    io.to(sessionId).emit('state', {
      users: sessions[sessionId].users,
      votesRevealed: true
    });
  });

  socket.on('disconnect', () => {
    const sessionId = socket.sessionId;
    if (!sessionId || !sessions[sessionId]) return;

    delete sessions[sessionId].users[socket.id];

    if (Object.keys(sessions[sessionId].users).length === 0) {
      delete sessions[sessionId];
    } else {
      io.to(sessionId).emit('state', {
        users: sessions[sessionId].users,
        votesRevealed: sessions[sessionId].votesRevealed
      });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
