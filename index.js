const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const sessions = {};

app.use(express.static(path.join(__dirname, 'public')));

app.get('/create-session', (req, res) => {
  const sessionId = nanoid(6);
  sessions[sessionId] = { users: {}, votesRevealed: false, admin: null };
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
    io.to(sessionId).emit('state', { users: session.users, votesRevealed: session.votesRevealed });
  });

  socket.on('vote', (value) => {
    const session = sessions[socket.sessionId];
    if (session && session.users[socket.id]) {
      session.users[socket.id].vote = value;
      io.to(socket.sessionId).emit('state', { users: session.users, votesRevealed: session.votesRevealed });
    }
  });

  socket.on('reveal', () => {
    const session = sessions[socket.sessionId];
    if (!session) return;
    if (session.users[socket.id]?.isAdmin) {
      session.votesRevealed = true;
      io.to(socket.sessionId).emit('state', { users: session.users, votesRevealed: true });
    }
  });

  socket.on('clear', () => {
    const session = sessions[socket.sessionId];
    if (!session) return;
    if (session.users[socket.id]?.isAdmin) {
      Object.values(session.users).forEach(u => u.vote = null);
      session.votesRevealed = false;
      io.to(socket.sessionId).emit('state', { users: session.users, votesRevealed: false });
    }
  });

  socket.on('disconnect', () => {
    const session = sessions[socket.sessionId];
    if (session) {
      delete session.users[socket.id];
      if (Object.keys(session.users).length === 0) {
        delete sessions[socket.sessionId];
      } else {
        io.to(socket.sessionId).emit('state', { users: session.users, votesRevealed: session.votesRevealed });
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
