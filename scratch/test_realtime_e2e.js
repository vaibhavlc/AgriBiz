import { io } from 'socket.io-client';
import { generateAccessToken } from '../server/src/utils/jwt.js';

const SOCKET_URL = 'http://localhost:5000';

const companyId1 = 'COMP-TEST-101';
const companyId2 = 'COMP-TEST-202';

async function runRealtimeE2ETest() {
  console.log('====================================================');
  console.log('   REAL-TIME SYNCHRONIZATION E2E VERIFICATION TEST  ');
  console.log('====================================================\n');

  const tokenOwnerDesktop = generateAccessToken({ userId: 'USR-OWNER-01', companyId: companyId1, role: 'Owner' });
  const tokenOwnerMobile = generateAccessToken({ userId: 'USR-OWNER-01', companyId: companyId1, role: 'Owner' });
  const tokenAccountantLaptop = generateAccessToken({ userId: 'USR-ACCT-02', companyId: companyId1, role: 'Accounts' });
  const tokenCompany2Owner = generateAccessToken({ userId: 'USR-COMP2-01', companyId: companyId2, role: 'Owner' });

  const eventsB = [];
  const eventsC = [];
  const eventsD = [];

  console.log('[Step 1] Connecting 4 WebSocket Sockets to Local Backend...');
  
  // Socket A: Owner Desktop (Company 1)
  const socketA = io(SOCKET_URL, {
    auth: { token: tokenOwnerDesktop, deviceId: 'dev_desktop_owner' },
    transports: ['websocket']
  });

  // Socket B: Owner Mobile (Company 1 - Same Staff, Different Device)
  const socketB = io(SOCKET_URL, {
    auth: { token: tokenOwnerMobile, deviceId: 'dev_mobile_owner' },
    transports: ['websocket']
  });

  // Socket C: Accountant Laptop (Company 1 - Different Role)
  const socketC = io(SOCKET_URL, {
    auth: { token: tokenAccountantLaptop, deviceId: 'dev_laptop_accountant' },
    transports: ['websocket']
  });

  // Socket D: Company 2 Owner (Different Company Isolation Check)
  const socketD = io(SOCKET_URL, {
    auth: { token: tokenCompany2Owner, deviceId: 'dev_comp2_owner' },
    transports: ['websocket']
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));

  console.log(`Socket A (Owner Desktop) Connected: ${socketA.connected} (ID: ${socketA.id})`);
  console.log(`Socket B (Owner Mobile) Connected: ${socketB.connected} (ID: ${socketB.id})`);
  console.log(`Socket C (Accountant Laptop) Connected: ${socketC.connected} (ID: ${socketC.id})`);
  console.log(`Socket D (Company 2 Owner) Connected: ${socketD.connected} (ID: ${socketD.id})`);

  if (!socketA.connected || !socketB.connected || !socketC.connected || !socketD.connected) {
    console.error('❌ FAILED: Sockets could not connect to local server. Make sure local server is running on port 5000.');
    process.exit(1);
  }

  // Register listeners
  socketB.on('sync:data-changed', (data) => {
    console.log('\n⚡ [Socket B - Mobile Owner] Received Real-Time Event:', data);
    eventsB.push(data);
  });

  socketC.on('sync:data-changed', (data) => {
    console.log('\n⚡ [Socket C - Laptop Accountant] Received Real-Time Event:', data);
    eventsC.push(data);
  });

  socketD.on('sync:data-changed', (data) => {
    console.log('\n❌ [Socket D - Company 2] Received Leak Event:', data);
    eventsD.push(data);
  });

  console.log('\n[Step 2] Simulating Expense Creation by Socket A (Desktop Owner)...');

  const testExpenseId = `EXP-TEST-${Date.now()}`;

  // Triggering sync batch call from Socket A
  const testPayload = {
    operations: [
      {
        action: 'CREATE',
        module: 'Expense',
        recordId: testExpenseId,
        payload: {
          expenseId: testExpenseId,
          title: 'Store Electricity Bill',
          payee: 'MP Electricity Board',
          category: 'Utilities',
          amount: 2450,
          status: 'Paid',
          paymentMethod: 'UPI',
          date: new Date().toISOString().split('T')[0],
          deviceId: 'dev_desktop_owner'
        },
        timestamp: new Date().toISOString()
      }
    ]
  };

  const response = await fetch(`${SOCKET_URL}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenOwnerDesktop}`,
      'X-Socket-Id': socketA.id,
      'X-Device-Id': 'dev_desktop_owner'
    },
    body: JSON.stringify(testPayload)
  });

  const resJson = await response.json();
  console.log('HTTP POST /api/sync Response:', resJson.success ? 'SUCCESS' : 'FAILED', resJson.results || resJson);

  // Wait 1 second for socket broadcast propagation
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('\n====================================================');
  console.log('               VERIFICATION RESULTS                 ');
  console.log('====================================================');

  const mobileReceived = eventsB.length === 1 && eventsB[0].recordId === testExpenseId;
  const accountantReceived = eventsC.length === 1 && eventsC[0].recordId === testExpenseId;
  const companyIsolated = eventsD.length === 0;

  console.log(`1. Mobile Owner (Same Staff, Different Device) Received Event: ${mobileReceived ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`2. Accountant Laptop (Different Staff/Role) Received Event:     ${accountantReceived ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`3. Company 2 Isolation (No Cross-Company Leaks):                ${companyIsolated ? '✅ PASSED' : '❌ FAILED'}`);

  socketA.disconnect();
  socketB.disconnect();
  socketC.disconnect();
  socketD.disconnect();

  if (mobileReceived && accountantReceived && companyIsolated) {
    console.log('\n🎉 ALL REAL-TIME SYNCHRONIZATION E2E VERIFICATION TESTS PASSED!');
    process.exit(0);
  } else {
    console.error('\n❌ E2E VERIFICATION FAILED.');
    process.exit(1);
  }
}

runRealtimeE2ETest().catch((err) => {
  console.error('Unhandled error during E2E test execution:', err);
  process.exit(1);
});
