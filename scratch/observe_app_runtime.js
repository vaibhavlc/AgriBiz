import { io } from 'socket.io-client';
import { generateAccessToken } from '../server/src/utils/jwt.js';

const SOCKET_URL = 'http://localhost:5000';
const companyId = 'COMP-101';

const tokenDesktop = generateAccessToken({ userId: 'USR-OWNER-01', companyId, role: 'Owner' });
const tokenMobile = generateAccessToken({ userId: 'USR-OWNER-01', companyId, role: 'Owner' });

async function observeRuntime() {
  console.log('====================================================');
  console.log('       APPLICATION RUNTIME EXECUTION LOG TRACE      ');
  console.log('====================================================\n');

  const ts = Date.now();
  const expenseId = `EXP-OBSERVE-${ts}`;

  console.log(`[${new Date().toISOString()}] [CLIENT_SOCKET_CONNECTING] Desktop Socket & Mobile Socket connecting...`);

  // Device A (Desktop Owner)
  const socketDesktop = io(SOCKET_URL, {
    auth: { token: tokenDesktop, deviceId: 'dev_desktop_owner' },
    transports: ['websocket']
  });

  // Device B (Mobile Owner)
  const socketMobile = io(SOCKET_URL, {
    auth: { token: tokenMobile, deviceId: 'dev_mobile_owner' },
    transports: ['websocket']
  });

  await new Promise(r => setTimeout(r, 1200));

  console.log(`[${new Date().toISOString()}] [CLIENT_SOCKET_CONNECTED] Desktop Socket ID: ${socketDesktop.id} (Connected: ${socketDesktop.connected})`);
  console.log(`[${new Date().toISOString()}] [CLIENT_SOCKET_CONNECTED] Mobile Socket ID:  ${socketMobile.id} (Connected: ${socketMobile.connected})\n`);

  let mobileReceivedEvent = null;

  socketMobile.on('sync:data-changed', (data) => {
    const recvTime = new Date().toISOString();
    console.log(`[${recvTime}] [CLIENT_MOBILE_RECEPTION] Mobile Socket (${socketMobile.id}) Received Event:`, data);
    mobileReceivedEvent = data;
  });

  // Step 1: Simulate CRUD Request & Batch Sync Upload from Desktop
  console.log(`[${new Date().toISOString()}] [CLIENT_DESKTOP_CRUD] Desktop creating Expense (${expenseId})...`);

  const uploadPayload = {
    operations: [
      {
        action: 'CREATE',
        module: 'Expense',
        recordId: expenseId,
        payload: {
          id: expenseId,
          expenseId: expenseId,
          title: 'Store Pest Control Spray',
          payee: 'AgriPest Chemicals',
          category: 'Maintenance',
          amount: 2800,
          status: 'Paid',
          paymentMethod: 'UPI',
          date: '2026-08-05',
          deviceId: 'dev_desktop_owner',
          version: 1
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const startTime = Date.now();

  const syncResp = await fetch(`${SOCKET_URL}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenDesktop}`,
      'X-Socket-Id': socketDesktop.id,
      'X-Device-Id': 'dev_desktop_owner'
    },
    body: JSON.stringify(uploadPayload)
  });

  const syncResult = await syncResp.json();
  console.log(`[${new Date().toISOString()}] [CLIENT_DESKTOP_UPLOAD_RESP] HTTP Status: ${syncResp.status}`, syncResult.results?.[0] || syncResult);

  // Wait for socket broadcast propagation
  await new Promise(r => setTimeout(r, 1000));

  // Step 2: Simulate Mobile executing pullRemoteUpdates
  console.log(`\n[${new Date().toISOString()}] [CLIENT_MOBILE_PULL] Mobile executing GET /api/sync/pull...`);
  const pullResp = await fetch(`${SOCKET_URL}/api/sync/pull?module=Expense&recordId=${expenseId}`, {
    headers: { 'Authorization': `Bearer ${tokenMobile}` }
  });

  const pullResult = await pullResp.json();
  console.log(`[${new Date().toISOString()}] [CLIENT_MOBILE_PULL_RESP] HTTP Status: ${pullResp.status}`, pullResult.updates?.Expense?.[0] || pullResult);

  const duration = Date.now() - startTime;

  console.log('\n====================================================');
  console.log('               RUNTIME LOG EVALUATION               ');
  console.log('====================================================');
  console.log('1. CRUD Upload HTTP Status:', syncResp.status);
  console.log('2. MongoDB Document Created:', syncResult.results?.[0]?.success ? 'YES' : 'NO');
  console.log('3. Mobile Socket Event Received:', mobileReceivedEvent ? `YES (${mobileReceivedEvent.recordId})` : 'NO');
  console.log('4. Mobile Remote Pull Returned Expense:', pullResult.updates?.Expense?.[0]?.expenseId === expenseId ? 'YES' : 'NO');
  console.log('5. Total End-to-End Pipeline Latency:', `${duration} ms`);
  console.log('====================================================\n');

  socketDesktop.disconnect();
  socketMobile.disconnect();
}

observeRuntime().catch(err => {
  console.error('Unhandled runtime observation error:', err);
  process.exit(1);
});
