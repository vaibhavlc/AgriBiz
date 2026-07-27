import { io } from 'socket.io-client';

async function run() {
  const SOCKET_URL = 'http://localhost:5000';
  const API_URL = 'http://localhost:5000/api/v1';

  // 1. Login User B (Accounts - Company 1) - listener
  const resB = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9876500112', password: 'deepakpassword', role: 'Accounts' })
  });
  const dataB = await resB.json();
  const tokenB = dataB.accessToken;
  console.log('User B (Listener) logged in.');

  // 2. Login User A (Owner - Company 1) - sender
  const resA = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile: '9425098765', password: 'owner123', role: 'Owner' })
  });
  const dataA = await resA.json();
  const tokenA = dataA.accessToken;
  console.log('User A (Sender) logged in.');

  // 3. Connect Socket B (Listener)
  const socketB = io(SOCKET_URL, {
    auth: { token: tokenB },
    transports: ['websocket']
  });

  let eventReceived = null;
  socketB.on('connect', () => {
    console.log('Socket B (Listener) connected! ID:', socketB.id);
  });

  socketB.on('sync:data-changed', (e) => {
    console.log('SUCCESS! Socket B received event:', e);
    eventReceived = e;
  });

  // Connect Socket A (Sender) so we also have its ID to pass in X-Socket-Id
  const socketA = io(SOCKET_URL, {
    auth: { token: tokenA },
    transports: ['websocket']
  });

  socketA.on('connect', () => {
    console.log('Socket A (Sender) connected! ID:', socketA.id);
  });

  // Wait 1.5 seconds for connections to settle
  await new Promise(resolve => setTimeout(resolve, 1500));

  // 4. Trigger Sync push from User A
  console.log('Triggering sync push request from User A...');
  const recordId = 'PROD-TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  const mockProduct = {
    productId: recordId,
    name: 'Test Fertilizers',
    sku: 'SKU-TEST-999',
    category: 'Fertilizers',
    stock: 100,
    sellingPrice: 400,
    purchasePrice: 300,
    gstRate: 18,
    deviceId: 'DEVICE-A-TEST',
    version: 1
  };

  const pushRes = await fetch(`${API_URL}/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`,
      'X-Socket-Id': socketA.id // Pass Socket A ID so it filters out self events if needed
    },
    body: JSON.stringify({
      operations: [
        {
          action: 'CREATE',
          module: 'Product',
          recordId: recordId,
          payload: mockProduct,
          timestamp: new Date().toISOString()
        }
      ]
    })
  });

  const pushResult = await pushRes.json();
  console.log('Sync push response status:', pushRes.status, 'Body:', pushResult);

  // Wait 2 seconds for event propagation
  console.log('Waiting for event propagation...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (eventReceived) {
    console.log('✅ TEST PASSED: Event successfully delivered in real-time!');
  } else {
    console.log('❌ TEST FAILED: Event not delivered.');
  }

  socketA.disconnect();
  socketB.disconnect();
}

run().catch(console.error);
