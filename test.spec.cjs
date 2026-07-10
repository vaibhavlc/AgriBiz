const { test, expect } = require('@playwright/test');

test('test reports buttons', async ({ page }) => {
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`[PAGE ERROR] ${err.message}`);
  });

  await page.goto('http://localhost:5173/');
  
  // Click on "Business Reports" nav item
  await page.click('text=Business Reports');
  await page.waitForTimeout(2000);

  // Click on GSTR-1
  await page.click('text=GSTR-1 Return');
  await page.waitForTimeout(1000);

  // Click Save PDF
  console.log('Clicking Save PDF for GSTR-1...');
  await page.click('text=Save PDF');
  await page.waitForTimeout(2000);

  // Click Export CSV
  console.log('Clicking Export CSV for GSTR-1...');
  await page.click('text=Export CSV');
  await page.waitForTimeout(2000);
});
