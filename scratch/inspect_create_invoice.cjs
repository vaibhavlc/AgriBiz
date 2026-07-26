const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

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

  const salesBtn = page.locator('button:has-text("Sales")').first();
  await salesBtn.click();
  await page.waitForTimeout(500);

  const createBtn = page.locator('button:has-text("Create Invoice"), button:has-text("New Invoice")').first();
  await createBtn.click();
  await page.waitForTimeout(600);

  const details = await page.evaluate(() => {
    const windowW = window.innerWidth;
    const all = Array.from(document.querySelectorAll('*'));
    const overflowing = [];
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      if (rect.right > windowW + 1) {
        overflowing.push({
          tag: el.tagName,
          class: (el.className || '').toString(),
          id: el.id,
          right: Math.round(rect.right),
          width: Math.round(rect.width),
          html: el.outerHTML.slice(0, 100)
        });
      }
    }
    return overflowing;
  });

  console.log('Detailed overflow elements in Create Invoice:', details);

  await browser.close();
})();
