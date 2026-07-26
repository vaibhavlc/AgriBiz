const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    isMobile: true,
    hasTouch: true
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('[BROWSER CONSOLE]', msg.text()));
  page.on('pageerror', err => console.error('[BROWSER ERROR]', err));

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  await page.screenshot({ path: 'scratch/mobile_dashboard.png', fullPage: true });

  // Check if hamburger menu button is visible
  const menuToggleVisible = await page.isVisible('.menu-toggle');
  console.log('Menu Toggle Visible on 375px:', menuToggleVisible);

  // Check overflow-x on body/html
  const overflowX = await page.evaluate(() => {
    return document.documentElement.scrollWidth > window.innerWidth;
  });
  console.log('Horizontal Overflow detected on Dashboard:', overflowX);

  // Click tabs to test responsiveness of each tab
  const tabs = ['sales', 'purchases', 'inventory', 'customers', 'suppliers', 'payments', 'expenses', 'reports', 'settings', 'recycle_bin'];
  for (const tab of tabs) {
    try {
      // Find bottom nav item or navigation
      const navItem = page.locator(`.mobile-bottom-nav button:has-text("${tab}")`).first();
      if (await navItem.count() > 0) {
        await navItem.click();
        await page.waitForTimeout(500);
        const tabOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
        console.log(`Tab ${tab} - Horizontal Overflow: ${tabOverflow}`);
        await page.screenshot({ path: `scratch/mobile_${tab}.png`, fullPage: false });
      }
    } catch (e) {
      console.log(`Error testing tab ${tab}:`, e.message);
    }
  }

  await browser.close();
})();
