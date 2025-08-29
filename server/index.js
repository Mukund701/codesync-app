const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const socketIdToUsernameMap = new Map();

function getUsersInRoom(roomId) {
  const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
  if (!socketsInRoom) {
    return [];
  }
  return Array.from(socketsInRoom).map(socketId => ({
    id: socketId,
    username: socketIdToUsernameMap.get(socketId) || 'Anonymous'
  }));
}

io.on('connection', (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  socket.on('joinRoom', ({ roomId, username }) => {
    socketIdToUsernameMap.set(socket.id, username);
    socket.join(roomId);
    console.log(`User ${username} (${socket.id}) joined room: ${roomId}`);
    
    socket.to(roomId).emit('user:joined', { username });

    const users = getUsersInRoom(roomId);
    io.in(roomId).emit('updateUserList', users);
  });

  socket.on('codeChange', (data) => {
    const { roomId, newCode } = data;
    socket.to(roomId).emit('codeUpdate', newCode);
  });

  socket.on('language:change', (data) => {
    const { roomId, newLanguage } = data;
    socket.to(roomId).emit('language:update', newLanguage);
  });

  socket.on('cursor:move', (data) => {
    const { roomId, position } = data;
    // --- Corrected: Get username and include it in the broadcast ---
    const username = socketIdToUsernameMap.get(socket.id);
    socket.to(roomId).emit('cursor:update', { 
      userId: socket.id, 
      username: username,
      position 
    });
  });

  socket.on('selection:change', (data) => {
    const { roomId, selection } = data;
    // --- Corrected: Get username and include it in the broadcast ---
    const username = socketIdToUsernameMap.get(socket.id);
    socket.to(roomId).emit('selection:update', { 
      userId: socket.id, 
      username: username,
      selection 
    });
  });

  socket.on('disconnecting', () => {
    const rooms = Array.from(socket.rooms);
    const username = socketIdToUsernameMap.get(socket.id);
    
    rooms.forEach(roomId => {
      if (roomId !== socket.id) {
        socket.to(roomId).emit('cursor:remove', { userId: socket.id });

        const remainingUsers = getUsersInRoom(roomId).filter(user => user.id !== socket.id);
        socket.to(roomId).emit('updateUserList', remainingUsers);

        if (username) {
          socket.to(roomId).emit('user:left', { username });
        }
      }
    });

    socketIdToUsernameMap.delete(socket.id);
  });

  socket.on('disconnect', () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
