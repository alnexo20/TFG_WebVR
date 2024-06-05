import { io } from 'socket.io-client';

const socket = io('https://brief-husky-nymphea.glitch.me', {
  extraHeaders: {
    "user-agent": "Mozilla",
  },
  path: '/socket.io',
  transports: ['websocket'],
  secure: true,
});

export default socket;