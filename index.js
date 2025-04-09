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
    votesRevealed: false
  };
  res.json({ sessionId });
});

io.on('connection', (socket) => {
  // Handle user joining a session
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

  // Handle voting
  socket.on('vote', (voteValue) => {
    const sessionId = socket.sessionId;
    if (!sessionId || !sessions[sessionId]) return;

    const session = sessions[sessionId];
    session.users[socket.id].vote = voteValue;

    // Emit updated state to all users
    io.to(sessionId).emit('state', {
      users: session.users,
      votesRevealed: session.votesRevealed
    });

    // Notify admin if all non-admins have voted
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

  // Handle reveal request (admin only)
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

  // Handle clear request (admin only)
  socket.on('clear', () => {
    const sessionId = socket.sessionId;
    const session = sessions[sessionId];
    const user = session?.users[socket.id];
    if (!user?.isAdmin) return;

    Object.values(session.users).forEach(u => u.vote = null);
    session.votesRevealed = false;

    io.to(sessionId).emit('state', {
      users: session.users,
      votesRevealed: false
    });
  });

  // Handle disconnects
  socket.on('disconnect', () => {
    const sessionId = socket.sessionId;
    if (!sessionId || !sessions[sessionId]) return;

    const session = sessions[sessionId];
    delete session.users[socket.id];

    // Delete session if empty
    if (Object.keys(session.users).length === 0) {
      delete sessions[sessionId];
    } else {
      io.to(sessionId).emit('state', {
        users: session.users,
        votesRevealed: session.votesRevealed
      });
    }
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
