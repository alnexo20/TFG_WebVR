import { io } from 'socket.io-client';

const socket = io('https://tfg-web-vr-server.vercel.app', {
  transports: ['websocket'],
  secure: true,
});

export default socket;