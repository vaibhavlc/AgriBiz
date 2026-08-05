import { io } from 'socket.io-client';
import { generateAccessToken } from '../server/src/utils/jwt.js';

const SOCKET_URL = 'http://localhost:5000';
const companyId = 'COMP-TRACE-999';

const tokenDeviceA = generateAccessToken({ userId: 'USR-DEV-A', companyId, role: 'Owner' });
const tokenDeviceB = generateAccessToken({ userId: 'USR-DEV-B', companyId, role: 'Accounts' });

async function tracePipeline() {
  console.log('====================================================');
  console.log(' STEP 2 - SYNCHRONIZATION PIPELINE DIAGNOSTIC TRACE ');
  console.log('====================================================\n');

  const ts = Date.now();
  const testRecordId = `EXP-TRACE-${ts}`;

  // Establish Sockets
  const socketA = io(SOCKET_URL, {
    auth: { token: tokenDeviceA, deviceId: 'dev_desktop_a' },
    transports: ['websocket']
  });

  const socketB = io(SOCKET_URL, {
    auth: { token: tokenDeviceB, deviceId: 'dev_mobile_b' },
    transports: ['websocket']
  });

  await new Promise(r => setTimeout(r, 1000));

  console.log(`Socket A Connected: ${socketA.connected} (ID: ${socketA.id})`);
  console.log(`Socket B Connected: ${socketB.connected} (ID: ${socketB.id})\n`);

  let socketEventReceived = null;

  socketB.on('sync:data-changed', (data) => {
    console.log('[STAGE 6] Socket B Received Event:', data);
    socketEventReceived = data;
  });

  // Stage 1 & 2 Simulation: Frontend Queue Sync Payload
  console.log('[STAGE 1 & 2] Simulating Frontend CRUD & queueSync for Expense creation...');
  const testPayload = {
    operations: [
      {
        action: 'CREATE',
        module: 'Expense',
        recordId: testRecordId,
        payload: {
          id: testRecordId,
          expenseId: testRecordId,
          title: 'Diesel for Store Generator',
          payee: 'Indian Oil Bunk',
          category: 'Fuel & Transportation',
          amount: 4500,
          status: 'Paid',
          paymentMethod: 'UPI',
          date: '2026-08-05',
          deviceId: 'dev_desktop_a',
          version: 1
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  // Stage 3: HTTP POST /api/sync
  console.log('[STAGE 3] Executing POST /api/sync (synchronizeLocalDatabase)...');
  const syncResp = await fetch(`${SOCKET_URL}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenDeviceA}`,
      'X-Socket-Id': socketA.id,
      'X-Device-Id': 'dev_desktop_a'
    },
    body: JSON.stringify(testPayload)
  });

  const syncResult = await syncResp.json();
  console.log('[STAGE 3 Result] HTTP Status:', syncResp.status, syncResult);

  // Wait for Socket Broadcast
  await new Promise(r => setTimeout(r, 1000));

  // Stage 4: MongoDB Persistence Check via Pull
  console.log('\n[STAGE 4 & 8] Executing GET /api/sync/pull (Targeted Single Record Fetch)...');
  const pullResp = await fetch(`${SOCKET_URL}/api/sync/pull?module=Expense&recordId=${testRecordId}`, {
    headers: { 'Authorization': `Bearer ${tokenDeviceB}` }
  });

  const pullResult = await pullResp.json();
  console.log('[STAGE 8 Result] HTTP Status:', pullResp.status, pullResult);

  socketA.disconnect();
  socketB.disconnect();

  console.log('\n====================================================');
  console.log('SUMMARY EVALUATION:');
  console.log('Stage 3 Upload Success:', syncResp.status === 200 && syncResult.results?.[0]?.success ? 'PASS' : 'FAIL');
  console.log('Stage 5 & 6 Socket Delivery:', socketEventReceived?.recordId === testRecordId ? 'PASS' : 'FAIL');
  console.log('Stage 8 Pull Data Returned:', pullResult.updates?.Expense?.[0]?.expenseId === testRecordId ? 'PASS' : 'FAIL');
  console.log('====================================================\n');
}

tracePipeline().catch(err => {
  console.error('Unhandled error during trace:', err);
  process.exit(1);
});
