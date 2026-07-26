const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE - ${msg.type()}]`, msg.text());
  });

  page.on('pageerror', err => {
    console.error('[BROWSER ERROR]', err.message);
  });

  // Inject session token
  await page.addInitScript(() => {
    localStorage.setItem('agribiz_auth_session', JSON.stringify({
      currentUserId: 'USR-OWNER-01',
      companyId: 'COMP-101',
      token: 'eyAgribizJWTToken_USR-OWNER-01_1700000000000',
      rememberMe: true
    }));
  });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // 1. Navigate to Settings page via bottom nav
  console.log('Navigating to Settings via bottom nav...');
  const settingsBtn = page.locator('.mobile-bottom-nav button:has-text("Settings")').first();
  await settingsBtn.click();
  await page.waitForTimeout(1000);

  // 2. Make a dirty change in Settings
  console.log('Making a dirty change in Business Name input...');
  const input = page.locator('input[placeholder*="Business Name"], input[name="businessName"]').first();
  if (await input.count() > 0) {
    await input.fill('Modified Business Name');
    await page.waitForTimeout(500);
  } else {
    const anyInput = page.locator('.form-control').first();
    await anyInput.fill('Dirty change text');
    await page.waitForTimeout(500);
  }

  // 3. Try to navigate to Sales tab via bottom nav
  console.log('Clicking Sales tab via bottom nav...');
  const salesBtn = page.locator('.mobile-bottom-nav button:has-text("Sales")').first();
  await salesBtn.click();
  await page.waitForTimeout(1000);

  // 4. Verify unsaved changes modal is visible
  const modalVisible = await page.isVisible('text=Unsaved Changes');
  console.log('Unsaved Changes Modal Visible:', modalVisible);

  if (modalVisible) {
    // 5. Click "Leave Page" button
    console.log('Clicking Leave Page...');
    const leaveBtn = page.locator('button:has-text("Leave"), button:has-text("Discard")').first();
    await leaveBtn.click();
    await page.waitForTimeout(2000);

    // 6. Check if we navigated to Sales page
    const activeTab = await page.evaluate(() => {
      const activeBtn = document.querySelector('.mobile-bottom-nav button[data-active="true"]');
      return activeBtn ? activeBtn.textContent.trim() : 'Unknown';
    });
    console.log('Active Tab after clicking Leave:', activeTab);
  }

  await browser.close();
})();
