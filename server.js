const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static assets (public folder)
app.use(express.static('public'));

// Redirect root to new room
app.get('/', (req, res) => {
  res.redirect('/new');
});

// Route to generate a new chat room
app.get('/new', (req, res) => {
  const roomId = uuidv4();
  res.redirect(`/room/${roomId}`);
});

// Serve chat page for a given room
app.get('/room/:roomId', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  socket.on('join-room', (roomId, userName) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userName);
    console.log(`[JOIN] ${userName} joined room ${roomId}`);
    // Broadcast incoming messages to everyone in the room
    socket.on('message', (msg) => {
      io.to(roomId).emit('createMessage', msg, userName);
    });
    // Notify room when a user disconnects
    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userName);
      console.log(`[LEAVE] ${userName} left room ${roomId}`);
    });
  });
});

// Start HTTP + WebSocket server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Chatify running on port ${PORT}`));