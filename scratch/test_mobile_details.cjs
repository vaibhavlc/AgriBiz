const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  // Set session in localStorage before navigating
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

  async function getOverflowElements(pageName) {
    const overflowInfo = await page.evaluate(() => {
      const scrollW = document.documentElement.scrollWidth;
      const windowW = window.innerWidth;
      const bodyW = document.body.clientWidth;

      const all = Array.from(document.querySelectorAll('*'));
      const overflowing = [];
      for (const el of all) {
        const rect = el.getBoundingClientRect();
        if (rect.right > windowW + 1) {
          overflowing.push({
            tag: el.tagName,
            class: (el.className || '').toString().slice(0, 40),
            id: el.id,
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            text: (el.textContent || '').trim().substring(0, 25)
          });
        }
      }
      return { overflow: scrollW > windowW + 1, scrollW, windowW, bodyW, elements: overflowing };
    });

    console.log(`\n--- Page: ${pageName} ---`);
    console.log(`ScrollWidth: ${overflowInfo.scrollW}, WindowWidth: ${overflowInfo.windowW}, Overflow: ${overflowInfo.overflow}`);
    if (overflowInfo.overflow || overflowInfo.elements.length > 0) {
      console.log(`OVERFLOW DETECTED! Count: ${overflowInfo.elements.length}`);
      console.log('Top 5 overflowing elements:', overflowInfo.elements.slice(0, 5));
    } else {
      console.log('Clean layout - No horizontal overflow.');
    }
  }

  // 1. Dashboard
  await getOverflowElements('Dashboard');
  await page.screenshot({ path: 'scratch/mobile_dashboard_logged.png', fullPage: true });

  // Check sidebar toggle visibility
  const menuToggle = await page.isVisible('.menu-toggle');
  console.log('Menu Toggle Visible on 375px:', menuToggle);

  // 2. Click through bottom nav items
  const navButtons = await page.$$('.mobile-bottom-nav button');
  console.log(`Found ${navButtons.length} bottom nav buttons`);

  for (let i = 0; i < navButtons.length; i++) {
    const btnText = await navButtons[i].textContent();
    await navButtons[i].click();
    await page.waitForTimeout(600);
    const cleanName = btnText.trim();
    await getOverflowElements(`Tab: ${cleanName}`);

    // If Sales tab, try opening Create Invoice
    if (cleanName.includes('Sales')) {
      const createBtn = page.locator('button:has-text("Create Invoice"), button:has-text("New Invoice")').first();
      if (await createBtn.isVisible()) {
        await createBtn.click();
        await page.waitForTimeout(600);
        await getOverflowElements('Sales -> Create Invoice');
        await page.screenshot({ path: 'scratch/mobile_sales_create.png', fullPage: true });

        const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Back")').first();
        if (await cancelBtn.isVisible()) await cancelBtn.click();
      }
    }

    // If Purchases tab, try opening Enter Purchase
    if (cleanName.includes('Purchases')) {
      const enterBtn = page.locator('button:has-text("Enter Purchase"), button:has-text("New Purchase")').first();
      if (await enterBtn.isVisible()) {
        await enterBtn.click();
        await page.waitForTimeout(600);
        await getOverflowElements('Purchases -> Enter Purchase');
        await page.screenshot({ path: 'scratch/mobile_purchases_entry.png', fullPage: true });

        const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Back")').first();
        if (await cancelBtn.isVisible()) await cancelBtn.click();
      }
    }
  }

  await browser.close();
})();
