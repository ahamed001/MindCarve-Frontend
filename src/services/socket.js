import { io } from 'socket.io-client';
import { NetworkService } from './networkService';
import { NetworkString } from './networkString';

/**
 * One shared Socket.IO connection for live updates. It only connects after login.
 *
 * Where it connects:
 *  - VITE_SOCKET_URL set (production): straight to the API host, e.g. https://mindcarve-backend.onrender.com.
 *    Vercel forwards /api to the API, but it can't forward WebSockets.
 *  - not set (development): this site's own origin; Vite forwards /socket.io to the local API.
 *
 * How it signs in: before every (re)connect it asks the API for a 60-second "socket pass"
 * (POST /api/auth/socket-token, which uses the normal login cookie). So no cookie has to cross sites.
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || undefined;

let socket = null;

const fetchPass = (cb) => {
  NetworkService.post(NetworkString.auth.socketToken)
    .then((res) => cb({ token: res?.data?.token }))
    .catch(() => cb({}));
};

export const connectSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, { withCredentials: true, autoConnect: false, transports: ['websocket', 'polling'], auth: fetchPass });
  }
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
