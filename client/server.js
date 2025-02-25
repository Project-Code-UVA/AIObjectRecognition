const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins (for development only)
    methods: ['GET', 'POST'],
  },
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });

  socket.on('photoData', (data) => {
    // console.log('Photo data received:', data);
    // Broadcast to all other connected clients
    io.emit('photoData', data);
  });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});