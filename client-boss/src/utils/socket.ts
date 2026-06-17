import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const initSocket = (userId: string): Socket => {
  if (socket) {
    socket.disconnect();
  }

  socket = io({
    path: '/socket.io',
    transports: ['websocket', 'polling']
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket?.emit('join', userId);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
};

export const getSocket = (): Socket | null => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
