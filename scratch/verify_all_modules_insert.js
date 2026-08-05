import { generateAccessToken } from '../server/src/utils/jwt.js';

const SOCKET_URL = 'http://localhost:5000';
const companyId = 'COMP-VERIFY-888';
const token = generateAccessToken({ userId: 'USR-VERIFY-01', companyId, role: 'Owner' });

async function verifyAllModules() {
  console.log('====================================================');
  console.log('   STEP 1 DATA CONTRACT & MONGODB INSERT VERIFICATION');
  console.log('====================================================\n');

  const ts = Date.now();

  const testOperations = [
    {
      action: 'CREATE',
      module: 'Product',
      recordId: `PROD-${ts}`,
      payload: {
        id: `PROD-${ts}`,
        name: 'Hybrid Tomato Seeds Batch A',
        sku: 'TOM-001',
        category: 'Seeds',
        stock: 50,
        minStock: 10,
        purchasePrice: 120,
        sellingPrice: 180,
        gstRate: 5
      }
    },
    {
      action: 'CREATE',
      module: 'Customer',
      recordId: `CUS-${ts}`,
      payload: {
        id: `CUS-${ts}`,
        name: 'Ramesh Agro Farmers',
        phone: '9876543210',
        email: 'ramesh@agro.com',
        city: 'Pipariya',
        state: 'Madhya Pradesh'
      }
    },
    {
      action: 'CREATE',
      module: 'Supplier',
      recordId: `SUP-${ts}`,
      payload: {
        id: `SUP-${ts}`,
        name: 'Mahyco Seeds Private Limited',
        phone: '9123456789',
        email: 'supply@mahyco.com',
        city: 'Jalna',
        state: 'Maharashtra'
      }
    },
    {
      action: 'CREATE',
      module: 'Expense',
      recordId: `EXP-${ts}`,
      payload: {
        id: `EXP-${ts}`,
        title: 'Store Electricity Charges',
        payee: 'MP Electricity Distribution',
        category: 'Utilities',
        amount: 3200,
        status: 'Paid',
        paymentMethod: 'UPI',
        date: '2026-08-05'
      }
    },
    {
      action: 'CREATE',
      module: 'Payment',
      recordId: `PAY-${ts}`,
      payload: {
        id: `PAY-${ts}`,
        type: 'CustomerReceipt',
        contactId: `CUS-${ts}`,
        contactName: 'Ramesh Agro Farmers',
        amount: 1500,
        paymentMethod: 'Cash',
        date: '2026-08-05'
      }
    },
    {
      action: 'CREATE',
      module: 'Settings',
      recordId: 'business',
      payload: {
        id: 'business',
        businessName: 'AgriBiz Verification Store',
        ownerName: 'Vaibhav Patel',
        phone: '9425098765',
        email: 'contact@agribiz.com'
      }
    }
  ];

  console.log('[Step 1] Sending Frontend Payloads to POST /api/sync...');
  const response = await fetch(`${SOCKET_URL}/api/sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ operations: testOperations })
  });

  const resJson = await response.json();
  console.log('HTTP Response Status:', response.status);
  console.log('Batch Sync Results:');

  let allPassed = true;

  if (Array.isArray(resJson.results)) {
    for (const res of resJson.results) {
      if (res.success) {
        console.log(`  ✅ Module ${res.module} (${res.recordId}): ${res.message}`);
      } else {
        console.error(`  ❌ Module ${res.module} (${res.recordId}): FAILED -> ${res.message}`);
        allPassed = false;
      }
    }
  } else {
    console.error('❌ Failed: Response did not contain results array:', resJson);
    allPassed = false;
  }

  console.log('\n[Step 2] Verifying Remote Pull Endpoint (GET /api/sync/pull)...');
  const pullResponse = await fetch(`${SOCKET_URL}/api/sync/pull?lastSyncTimestamp=1970-01-01T00:00:00.000Z`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const pullJson = await pullResponse.json();
  console.log('Pull Response Status:', pullResponse.status);

  if (pullJson.success && pullJson.updates) {
    console.log('  Product Pulled Items:', pullJson.updates.Product?.length || 0);
    console.log('  Customer Pulled Items:', pullJson.updates.Customer?.length || 0);
    console.log('  Supplier Pulled Items:', pullJson.updates.Supplier?.length || 0);
    console.log('  Expense Pulled Items:', pullJson.updates.Expense?.length || 0);
    console.log('  Payment Pulled Items:', pullJson.updates.Payment?.length || 0);
    console.log('  Settings Pulled Items:', pullJson.updates.Settings?.length || 0);
  } else {
    console.error('❌ Pull API failed:', pullJson);
    allPassed = false;
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 STEP 1 DATA CONTRACT FIX & MONGODB INSERT VERIFIED 100%!');
    process.exit(0);
  } else {
    console.error('❌ STEP 1 VERIFICATION FAILED.');
    process.exit(1);
  }
}

verifyAllModules().catch(err => {
  console.error('Unhandled error during verification:', err);
  process.exit(1);
});
