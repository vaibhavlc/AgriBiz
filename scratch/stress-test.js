import { io } from 'socket.io-client';

const API_URL = 'http://localhost:5000/api/v1';
const SOCKET_URL = 'http://localhost:5000';

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function loginUser(mobile, password, role) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mobile, password, role })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Login failed: ${data.message}`);
  return data.accessToken;
}

async function registerSecondCompany() {
  const randomMobile = '9' + Math.floor(100000000 + Math.random() * 900000000).toString();
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      businessName: 'Secondary Test Business',
      ownerName: 'Secondary Owner',
      mobile: randomMobile,
      password: 'secondarypass'
    })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Registration failed: ${data.message}`);
  return data.accessToken;
}

async function runStressTest() {
  console.log('--- STARTING CONCURRENT MULTI-USER SOCKET.IO STRESS TEST ---');
  
  let socketA, socketB, socketC;
  
  try {
    // 1. Log in Device A (Owner - Company 1)
    console.log('\n[Step 1] Authenticating Client A (Company 1)...');
    const tokenA = await loginUser('9425098765', 'owner123', 'Owner');
    
    // 2. Log in Device B (Accountant - Company 1)
    console.log('[Step 2] Authenticating Client B (Company 1)...');
    const tokenB = await loginUser('9876500112', 'deepakpassword', 'Accounts');
    
    // 3. Register & Log in Device C (Owner - Company 2)
    console.log('[Step 3] Registering and Authenticating Client C (Company 2)...');
    const tokenC = await registerSecondCompany();

    // 4. Establish Socket.IO connections
    console.log('\n[Step 4] Connecting WebSockets to Server...');
    
    const eventsA = [];
    const eventsB = [];
    const eventsC = [];

    socketA = io(SOCKET_URL, { auth: { token: tokenA }, transports: ['websocket'] });
    socketB = io(SOCKET_URL, { auth: { token: tokenB }, transports: ['websocket'] });
    socketC = io(SOCKET_URL, { auth: { token: tokenC }, transports: ['websocket'] });

    socketA.on('sync:data-changed', (e) => eventsA.push(e));
    socketB.on('sync:data-changed', (e) => eventsB.push(e));
    socketC.on('sync:data-changed', (e) => eventsC.push(e));

    // Wait for connection shakes
    await delay(1500);
    console.log(`Socket A connected: ${socketA.connected}`);
    console.log(`Socket B connected: ${socketB.connected}`);
    console.log(`Socket C connected: ${socketC.connected}`);

    if (!socketA.connected || !socketB.connected || !socketC.connected) {
      throw new Error('WebSocket connection handshakes failed.');
    }
    console.log('✅ All devices connected and joined their respective company rooms.');

    // 5. Client A pushes an update via Sync API
    console.log('\n[Step 5] Triggering sync mutation push from Device A...');
    const recordId = 'PROD-STRESS-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const mockProduct = {
      productId: recordId,
      name: 'Stress Test Fertilizers',
      sku: 'SKU-STRESS-999',
      category: 'Fertilizers',
      stock: 120,
      sellingPrice: 500,
      purchasePrice: 400,
      gstRate: 18,
      deviceId: 'DEVICE-A-TERMINAL',
      version: 1
    };

    const pushRes = await fetch(`${API_URL}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenA}`
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
    if (!pushRes.ok) throw new Error(`Push request failed: ${pushResult.message}`);
    console.log('Device A upload successful.');

    // Wait for Socket broadcasts to propagate
    console.log('Waiting for real-time propagation...');
    await delay(1500);

    // 6. Verify event delivery metrics
    console.log('\n[Step 6] Verifying Broadcast Metrics & Privacy Isolation...');
    
    console.log(`Client A received events: ${eventsA.length}`);
    console.log(`Client B (same company) received events: ${eventsB.length}`);
    console.log(`Client C (different company) received events: ${eventsC.length}`);

    // Checks:
    // A should ignore its own changes based on senderDeviceId, but since we didn't filter on server,
    // it receives the event. However, client-side socketService filter will discard it.
    // Client B must have received the event!
    if (eventsB.length === 0) {
      throw new Error('❌ Integration failure: Client B in the same company was NOT notified of the database changes.');
    }
    console.log('✅ Client B successfully notified: ', JSON.stringify(eventsB[0]));

    // Client C MUST NOT receive the event!
    if (eventsC.length > 0) {
      throw new Error('❌ Security alert: Client C in a different company received the broadcast payload! Data leakage detected.');
    }
    console.log('✅ Data Leak Check Passed: Client C received 0 events.');

    console.log('\n--- ALL CONCURRENT STRESS & ISOLATION TESTS COMPLETED SUCCESSFULLY! ---');

  } catch (error) {
    console.error('\n❌ STRESS TEST EXECUTION FAILED:', error.message || error);
  } finally {
    // 7. Cleanup sockets
    if (socketA) socketA.disconnect();
    if (socketB) socketB.disconnect();
    if (socketC) socketC.disconnect();
  }
}

runStressTest();
