import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*", // In production, restrict this to your app's domain
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Store active users
const activeUsers = new Map();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Add user to active users
  activeUsers.set(socket.id, {
    id: socket.id,
    name: `User-${socket.id.substring(0, 4)}`
  });
  
  // Broadcast updated user list
  io.emit('users_update', Array.from(activeUsers.values()));
  
  // Handle drawing events
  socket.on('draw_line', (data) => {
    // Broadcast to all clients except sender
    socket.broadcast.emit('draw_line', {
      ...data,
      userId: socket.id
    });
  });
  
  // Handle clear canvas event
  socket.on('clear_canvas', () => {
    socket.broadcast.emit('clear_canvas');
  });
  // Handle undo canvas event
  socket.on('undo', () => {
    socket.broadcast.emit('undo');
  });
   // Handle redo canvas event
  socket.on('redo', () => {
    socket.broadcast.emit('redo');
  });
  // Handle user name update
  socket.on('update_name', (name) => {
    if (activeUsers.has(socket.id)) {
      activeUsers.get(socket.id).name = name;
      io.emit('users_update', Array.from(activeUsers.values()));
    }
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers.delete(socket.id);
    io.emit('users_update', Array.from(activeUsers.values()));
  });
});

// Basic health check endpoint
app.get('/', (req, res) => {
  res.send('Drawing Board Server is running');
});

// Start server
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});