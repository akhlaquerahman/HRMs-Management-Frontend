import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL 
  ? process.env.NEXT_PUBLIC_API_URL.replace('/api', '')
  : 'http://localhost:6002';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('⚡ [Socket.IO Client] Connected to Real-Time HRMS Gateway:', socket?.id);
    });

    socket.on('connect_error', (err) => {
      console.warn('⚠️ [Socket.IO Client] Connection error:', err.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 [Socket.IO Client] Disconnected:', reason);
    });
  }

  return socket;
};

export const joinUserRooms = (params: { userId?: string; employeeId?: string; departmentId?: string }) => {
  const s = getSocket();
  if (s && s.connected) {
    s.emit('join_room', params);
  } else if (s) {
    s.once('connect', () => {
      s.emit('join_room', params);
    });
  }
};
