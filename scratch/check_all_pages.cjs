const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

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

  const pagesToTest = [
    { name: 'Dashboard', selector: null },
    { name: 'Sales', selector: 'button:has-text("Sales")' },
    { name: 'Purchases', selector: 'button:has-text("Purchases")' },
    { name: 'Inventory', selector: 'button:has-text("Inventory")' },
    { name: 'Expenses', selector: 'button:has-text("Expenses")' },
    { name: 'Payments', selector: 'button:has-text("Payments")' },
    { name: 'Customers', selector: 'button:has-text("Customers")' },
    { name: 'Suppliers', selector: 'button:has-text("Suppliers")' },
    { name: 'Reports', selector: 'button:has-text("Reports")' },
    { name: 'RecycleBin', selector: 'button:has-text("Recycle Bin")' },
    { name: 'Settings', selector: 'button:has-text("Settings")' },
  ];

  for (const p of pagesToTest) {
    if (p.selector) {
      const btn = page.locator(p.selector).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(500);
      }
    }

    const docScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const bodyScrollWidth = await page.evaluate(() => document.body.scrollWidth);
    const windowWidth = await page.evaluate(() => window.innerWidth);

    const hasPageOverflow = docScrollWidth > windowWidth || bodyScrollWidth > windowWidth;

    console.log(`Page: [${p.name}] - DocScrollW: ${docScrollWidth}, BodyScrollW: ${bodyScrollWidth}, WindowW: ${windowWidth}, HAS OVERFLOW: ${hasPageOverflow}`);

    await page.screenshot({ path: `scratch/mobile_page_${p.name}.png`, fullPage: false });
  }

  await browser.close();
})();
