import { io } from 'socket.io-client';
import { useAuthStore } from '@/stores/auth';

let socket = null;

export const connectSocket = () => {
  const authStore = useAuthStore();
  
  if (socket) {
    socket.disconnect();
  }

  const token = authStore.accessToken;
  if (!token) return null;

  socket = io('http://localhost:3000', {
    auth: {
      token: token
    }
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
