const express = require('express');
const https = require('https');
const fs = require('fs');
const socketIo = require('socket.io');
const path = require('path');

const app = express();

// Self-signed certificate for HTTPS
const options = {
  key: fs.readFileSync(path.join(__dirname, 'key.pem')),
  cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

const server = https.createServer(options, app);
const io = socketIo(server, {
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000
});

app.use(express.static(path.join(__dirname, 'public')));

const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join', () => {
    if (users.has(socket.id)) return;
    
    users.set(socket.id, { joined: true });
    
    // Notify all other users about new connection
    socket.broadcast.emit('user-connected', socket.id);
    
    // Send existing users to new user (limit to first user for P2P)
    const existingUsers = Array.from(users.keys()).filter(id => id !== socket.id);
    if (existingUsers.length > 0) {
      socket.emit('existing-users', [existingUsers[0]]);
    }
    
    console.log('User joined:', socket.id, 'Total users:', users.size);
  });

  socket.on('offer', (data) => {
    if (users.has(data.target)) {
      socket.to(data.target).emit('offer', {
        offer: data.offer,
        sender: socket.id
      });
    }
  });

  socket.on('answer', (data) => {
    if (users.has(data.target)) {
      socket.to(data.target).emit('answer', {
        answer: data.answer,
        sender: socket.id
      });
    }
  });

  socket.on('ice-candidate', (data) => {
    if (users.has(data.target)) {
      socket.to(data.target).emit('ice-candidate', {
        candidate: data.candidate,
        sender: socket.id
      });
    }
  });

  socket.on('disconnect', () => {
    users.delete(socket.id);
    socket.broadcast.emit('user-disconnected', socket.id);
    console.log('User disconnected:', socket.id, 'Total users:', users.size);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`vChat HTTPS server running on port ${PORT}`);
  console.log(`Access at: https://localhost:${PORT}`);
});