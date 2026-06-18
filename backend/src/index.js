const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require('socket.io');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(require('path').join(__dirname, '../uploads')));
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/documents', require('./routes/documents'));
// Test route
app.get('/', (req, res) => {
  res.json({ message: 'Nexus Backend Running!' });
});

// Socket.IO - WebRTC Signaling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a room
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId, socket.id);

    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId, socket.id);
    });
  });

  // WebRTC signaling - offer
  socket.on('offer', (data) => {
    socket.to(data.roomId).emit('offer', {
      offer: data.offer,
      from: socket.id
    });
  });

  // WebRTC signaling - answer
  socket.on('answer', (data) => {
    socket.to(data.roomId).emit('answer', {
      answer: data.answer,
      from: socket.id
    });
  });

  // ICE candidates
  socket.on('ice-candidate', (data) => {
    socket.to(data.roomId).emit('ice-candidate', {
      candidate: data.candidate,
      from: socket.id
    });
  });

  // Toggle audio/video status (notify others)
  socket.on('toggle-media', (data) => {
    socket.to(data.roomId).emit('user-toggle-media', {
      from: socket.id,
      audio: data.audio,
      video: data.video
    });
  });

  // End call
  socket.on('end-call', (roomId) => {
    socket.to(roomId).emit('call-ended');
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});