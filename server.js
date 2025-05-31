import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const activeUsers = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  activeUsers.set(socket.id, {
    id: socket.id,
    name: `User-${socket.id.substring(0, 4)}`
  });
  
  io.emit('users_update', Array.from(activeUsers.values()));
  
  socket.on('draw_line', (data) => {
    socket.broadcast.emit('draw_line', {
      ...data,
      userId: socket.id
    });
  });
  



  socket.on('clear_canvas', () => {
    socket.broadcast.emit('clear_canvas');
  });


  socket.on('undo', () => {
    socket.broadcast.emit('undo');
  });


  socket.on('redo', () => {
    socket.broadcast.emit('redo');
  });


  socket.on('update_name', (name) => {
    if (activeUsers.has(socket.id)) {
      activeUsers.get(socket.id).name = name;
      io.emit('users_update', Array.from(activeUsers.values()));
    }
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    activeUsers.delete(socket.id);
    io.emit('users_update', Array.from(activeUsers.values()));
  });
});

app.get('/', (req, res) => {
  res.send('Drawing it Server is running');
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});