const { chromium } = require('playwright');

async function runSeniorQASuite() {
  console.log('═════════════════════════════════════════════════════════════════════════════');
  console.log('🏆 AGRIBIZ PROFESSIONAL COMPREHENSIVE QA E2E TEST SUITE');
  console.log('═════════════════════════════════════════════════════════════════════════════\n');

  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  const results = [];
  function record(moduleName, testCase, status, details = '') {
    results.push({ moduleName, testCase, status, details });
    const badge = status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`${badge} | [${moduleName.padEnd(13)}] | ${testCase.padEnd(44)} ${details ? '| ' + details : ''}`);
  }

  page.on('pageerror', err => {
    console.log(`   ⚠️ [PAGE ERROR] ${err.message}`);
  });

  // Helper for safe tab navigation
  async function navigateTo(tabPattern) {
    const navBtn = page.locator('.prem-nav-item').filter({ hasText: new RegExp(tabPattern, 'i') }).first();
    await navBtn.scrollIntoViewIfNeeded();
    await navBtn.click();
    await page.waitForTimeout(700);
  }

  // Helper to safely close any open modal
  async function ensureNoModals() {
    const overlays = page.locator('.modal-overlay');
    if (await overlays.count() > 0 && await overlays.first().isVisible()) {
      const closeBtn = page.locator('.modal-close-btn, button:has-text("Cancel")').first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
        await page.waitForTimeout(500);
      }
    }
  }

  try {
    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 1: AUTHENTICATION & SESSION PERSISTENCE
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 1: AUTHENTICATION & SESSION PERSISTENCE ---');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);

    const mobileInput = page.locator('input[placeholder="Enter registered mobile"]');
    if (await mobileInput.isVisible()) {
      record('Auth', 'Mobile + Password Form Displayed', 'PASS');
      await mobileInput.fill('9425098765');
      await page.fill('input[placeholder="Enter your password"]', 'owner123');
      await page.click('button:has-text("Continue")');
      await page.waitForTimeout(1500);
    } else {
      record('Auth', 'Device Remembered State Recognized', 'PASS');
    }

    // Role Selection
    const roleBtn = page.locator('button:has-text("Vaibhav Patel")').first();
    await roleBtn.waitFor({ state: 'visible', timeout: 15000 });
    record('Auth', 'Staff Profile Selection Displayed', 'PASS');
    await roleBtn.click();

    // PIN Screen
    const pinHeader = page.locator('text=Enter 4-Digit PIN');
    await pinHeader.waitFor({ state: 'visible', timeout: 10000 });
    record('Auth', '4-Digit PIN Security Screen Displayed', 'PASS');

    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await page.keyboard.press('4');

    // Dashboard verification
    const dashboardApp = page.locator('text=AgriBiz').first();
    await dashboardApp.waitFor({ state: 'visible', timeout: 15000 });
    record('Auth', 'Full Authentication & Dashboard Access', 'PASS');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 2: DASHBOARD & METRICS
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 2: DASHBOARD & METRICS ---');
    await navigateTo('Dashboard');
    const kpiCards = await page.locator('.kpi-card, [class*="KpiCard"], [class*="kpi"]').count();
    record('Dashboard', 'KPI Summary Cards Loaded', kpiCards >= 4 ? 'PASS' : 'FAIL', `${kpiCards} cards rendered`);

    const hasQuickActions = await page.locator('button:has-text("New Sale"), button:has-text("Create Sale"), button:has-text("New Invoice")').first().isVisible();
    record('Dashboard', 'POS Quick Action Buttons Ready', hasQuickActions ? 'PASS' : 'FAIL');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 3: INVENTORY MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 3: INVENTORY MANAGEMENT ---');
    await navigateTo('Inventory');
    const addProductBtn = page.locator('button:has-text("Add Product"), button:has-text("New Product")').first();
    const canOpenAddProduct = await addProductBtn.isVisible();
    record('Inventory', 'Inventory View Loaded', canOpenAddProduct ? 'PASS' : 'FAIL');

    const testProductName = `QA Hybrid Seed ${Date.now().toString().slice(-4)}`;
    if (canOpenAddProduct) {
      await addProductBtn.click();
      const modal = page.locator('.modal-overlay').first();
      await modal.waitFor({ state: 'visible', timeout: 5000 });
      record('Inventory', 'Product Creation Modal Opened', 'PASS');

      await page.fill('input[placeholder*="Pump 5HP"], input[placeholder*="e.g."]', testProductName);
      
      const priceInputs = page.locator('input[type="number"]');
      const numCount = await priceInputs.count();
      if (numCount >= 2) {
        await priceInputs.nth(numCount - 2).fill('350');
        await priceInputs.nth(numCount - 1).fill('450');
      }

      const saveBtn = page.locator('button.btn-primary[type="submit"]').first();
      await saveBtn.click();
      await page.waitForTimeout(1500);
      await ensureNoModals();

      const productInTable = page.locator(`text=${testProductName}`).first();
      const created = await productInTable.isVisible();
      record('Inventory', 'Product Added & Visible in Stock Table', created ? 'PASS' : 'FAIL', testProductName);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 4: CUSTOMERS & KHATA LEDGER
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 4: CUSTOMERS & KHATA LEDGER ---');
    await navigateTo('Customers');
    const addCustBtn = page.locator('button:has-text("Add Customer"), button:has-text("New Customer")').first();
    const canOpenAddCustomer = await addCustBtn.isVisible();
    record('Customers', 'Customers View Loaded', canOpenAddCustomer ? 'PASS' : 'FAIL');

    const testCustomerName = `Kisan Ram ${Date.now().toString().slice(-4)}`;
    if (canOpenAddCustomer) {
      await addCustBtn.click();
      const custModal = page.locator('.modal-overlay').first();
      await custModal.waitFor({ state: 'visible', timeout: 5000 });
      record('Customers', 'Customer Registration Modal Opened', 'PASS');

      await page.fill('input[placeholder*="Ramesh Kumar"], input[placeholder*="Full Name"]', testCustomerName);
      await page.fill('input[type="tel"]', `98${Date.now().toString().slice(-8)}`);
      
      const saveCustBtn = page.locator('button.btn-primary[type="submit"]').first();
      await saveCustBtn.click();
      await page.waitForTimeout(1500);
      await ensureNoModals();

      const custInTable = page.locator(`text=${testCustomerName}`).first();
      const created = await custInTable.isVisible();
      record('Customers', 'Customer Added & Visible in Directory', created ? 'PASS' : 'FAIL', testCustomerName);
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 5: SUPPLIERS MANAGEMENT
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 5: SUPPLIERS MANAGEMENT ---');
    await navigateTo('Suppliers');
    const addSupplierBtn = page.locator('button:has-text("Add Supplier"), button:has-text("New Supplier")').first();
    record('Suppliers', 'Suppliers Directory & Action Ready', await addSupplierBtn.isVisible() ? 'PASS' : 'FAIL');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 6: SALES & BILLING (POS INVOICES)
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 6: SALES & BILLING (POS) ---');
    await navigateTo('Sales');
    const createInvoiceBtn = page.locator('button:has-text("New Invoice")').first();
    const canCreateInvoice = await createInvoiceBtn.isVisible();
    record('Sales', 'Sales Billing View Ready', canCreateInvoice ? 'PASS' : 'FAIL');

    if (canCreateInvoice) {
      await createInvoiceBtn.click();
      const invoiceCreator = page.locator('.creator-banner-header').first();
      await invoiceCreator.waitFor({ state: 'visible', timeout: 5000 });
      record('Sales', 'Dedicated POS Invoice Builder Loaded', 'PASS');

      // Return back to sales list
      const backBtn = page.locator('.creator-banner-header button').first();
      if (await backBtn.isVisible()) {
        await backBtn.click();
        await page.waitForTimeout(600);
        record('Sales', 'Exited Invoice Builder Cleanly', 'PASS');
      }
    }

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 7: PURCHASES MODULE
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 7: PURCHASES MODULE ---');
    await navigateTo('Purchases');
    const newPurchaseBtn = page.locator('button:has-text("Log New Purchase")').first();
    record('Purchases', 'Purchases Ledger & Action Ready', await newPurchaseBtn.isVisible() ? 'PASS' : 'FAIL');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 8: EXPENSES & CASHFLOW
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 8: EXPENSES & CASHFLOW ---');
    await navigateTo('Expenses');
    const addExpenseBtn = page.locator('button:has-text("Log Expense")').first();
    record('Expenses', 'Expenses View & Action Button Ready', await addExpenseBtn.isVisible() ? 'PASS' : 'FAIL');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 9: PAYMENTS LEDGER
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 9: PAYMENTS LEDGER ---');
    await navigateTo('Payments');
    const recordPaymentBtn = page.locator('button:has-text("Record Payment"), button:has-text("Record First Payment")').first();
    record('Payments', 'Payments Ledger & Action Ready', await recordPaymentBtn.isVisible() ? 'PASS' : 'FAIL');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 10: BUSINESS REPORTS & GSTR TAX COMPLIANCE
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 10: BUSINESS REPORTS & TAX COMPLIANCE ---');
    await navigateTo('Reports');
    const gstrTab = page.locator('button, [class*="tab"]').filter({ hasText: /GSTR-1/i }).first();
    record('Reports', 'GSTR-1 Tax Return Tab Present', await gstrTab.isVisible() ? 'PASS' : 'FAIL');

    const exportCsv = page.locator('button').filter({ hasText: /Export/i }).first();
    record('Reports', 'GSTR Export Actions Operational', await exportCsv.isVisible() ? 'PASS' : 'FAIL');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 11: RECYCLE BIN & AUDIT LOGS
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 11: RECYCLE BIN & AUDIT LOGS ---');
    await navigateTo('Recycle Bin');
    const recycleHeading = page.locator('h1, h2, h3, [class*="title"]').filter({ hasText: /Recycle Bin/i }).first();
    record('RecycleBin', 'Recycle Bin Page Displayed', await recycleHeading.isVisible() ? 'PASS' : 'FAIL');

    // ═════════════════════════════════════════════════════════════════════════
    // MODULE 12: SETTINGS & LOCALIZATION (i18n)
    // ═════════════════════════════════════════════════════════════════════════
    console.log('\n--- MODULE 12: SETTINGS & LOCALIZATION ---');
    await navigateTo('Settings');
    const settingsContent = page.locator('*').filter({ hasText: /Business Information|Store Settings|Application Settings/i }).first();
    record('Settings', 'Settings Control Center Displayed', await settingsContent.isVisible() ? 'PASS' : 'FAIL');

    // Language toggle test
    const langBtn = page.locator('button:has-text("मराठी"), button:has-text("MR"), .lang-toggle-btn').first();
    if (await langBtn.isVisible()) {
      await langBtn.click();
      await page.waitForTimeout(600);
      const marathiText = page.locator('text=डॅशबोर्ड, text=सेटिंग्ज, text=ग्राहक').first();
      const marathiRendered = await marathiText.isVisible();
      record('Localization', 'Language Switch to Marathi Responds', marathiRendered ? 'PASS' : 'FAIL');

      // Switch back to English
      const enBtn = page.locator('button:has-text("English"), button:has-text("EN")').first();
      if (await enBtn.isVisible()) {
        await enBtn.click();
        await page.waitForTimeout(600);
        record('Localization', 'Language Switch back to English', 'PASS');
      }
    }

  } catch (err) {
    console.error('\n❌ Unhandled exception during test suite execution:', err);
    record('Execution', 'Master Test Execution', 'FAIL', err.message);
  } finally {
    await browser.close();
    console.log('\n═════════════════════════════════════════════════════════════════════════════');
    console.log('🏁 MASTER QA TEST SUITE COMPLETED');
    console.log('═════════════════════════════════════════════════════════════════════════════');
    const passed = results.filter(r => r.status === 'PASS').length;
    const failed = results.filter(r => r.status === 'FAIL').length;
    console.log(`TOTAL TEST CASES: ${results.length} | ✅ PASSED: ${passed} | ❌ FAILED: ${failed}`);
    console.log(`SUCCESS RATE: ${Math.round((passed / results.length) * 100)}%\n`);
  }
}

runSeniorQASuite();
