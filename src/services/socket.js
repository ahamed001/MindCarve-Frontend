import { io } from 'socket.io-client';

/**
 * One shared Socket.IO connection for live updates.
 * It signs in with the same HttpOnly session cookie as the API, so it only connects after login.
 * In development Vite proxies /socket.io to the API; in production it uses the API's origin.
 */
const apiBase = import.meta.env.VITE_API_BASE_URL || '';
const origin = /^https?:\/\//.test(apiBase) ? new URL(apiBase).origin : undefined;

let socket = null;

export const connectSocket = () => {
  if (!socket) socket = io(origin, { withCredentials: true, autoConnect: false, transports: ['websocket', 'polling'] });
  if (!socket.connected) socket.connect();
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
