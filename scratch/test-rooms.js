import { io } from 'socket.io-client';

async function run() {
  const SOCKET_URL = 'http://localhost:5000';
  
  // Login first to get token
  const res = await fetch('http://localhost:5000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9425098765', password: 'owner123', role: 'Owner' })
  });
  const data = await res.json();
  const token = data.accessToken;
  console.log('Logged in. Token retrieved.');

  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket']
  });

  socket.on('connect', () => {
    console.log('Socket connected! ID:', socket.id);
  });

  socket.on('sync:data-changed', (e) => {
    console.log('Received sync:data-changed event:', e);
  });

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason);
  });

  // Wait 5 seconds to receive any manual event or trigger
  console.log('Waiting for events... (You can trigger sync from client or stress test)');
  await new Promise(resolve => setTimeout(resolve, 5000));
  socket.disconnect();
}

run().catch(console.error);
