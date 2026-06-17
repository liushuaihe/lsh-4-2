import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server } from 'socket.io';
import { config } from './config';
import authRoutes from './routes/auth';
import gameRoutes from './routes/game';
import orderRoutes from './routes/order';
import walletRoutes from './routes/wallet';
import messageRoutes from './routes/message';
import certificationRoutes from './routes/certification';
import adminRoutes from './routes/admin';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ code: 200, message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/certifications', certificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: 'API not found' });
});

const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join', (userId: string) => {
    socket.join(userId);
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} joined with socket ${socket.id}`);
    io.emit('userOnline', userId);
  });

  socket.on('leave', (userId: string) => {
    socket.leave(userId);
    onlineUsers.delete(userId);
    console.log(`User ${userId} left`);
    io.emit('userOffline', userId);
  });

  socket.on('typing', (data: { senderId: string; receiverId: string; isTyping: boolean }) => {
    socket.to(data.receiverId).emit('typing', data);
  });

  socket.on('orderUpdate', (data: { orderId: string; userId: string }) => {
    socket.to(data.userId).emit('orderUpdate', data);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('userOffline', userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

server.listen(config.port, () => {
  console.log(`🚀 Server is running on http://localhost:${config.port}`);
  console.log(`📡 Socket.IO server is running`);
  console.log(`📊 API Base URL: http://localhost:${config.port}/api`);
});
