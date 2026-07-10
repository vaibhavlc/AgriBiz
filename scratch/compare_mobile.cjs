const { chromium, devices } = require('playwright');
const path = require('path');
const artDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\c07fd6e3-b41f-4677-979f-37472570aa00';

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const device = devices['iPhone 13'];
  const context = await browser.newContext({ ...device, deviceScaleFactor: 2 });
  const page = await context.newPage();

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(2000);

  // Navigate to Sales
  const salesBtn = page.locator('.mobile-bottom-nav button:has-text("Sales")');
  if (await salesBtn.count() > 0) await salesBtn.click();
  else await page.locator('text=Sales').first().click();
  await page.waitForTimeout(1500);

  // Screenshot: Invoice Creator
  await page.locator('button:has-text("New Invoice")').first().click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artDir, 'compare_invoice_mobile.png'), fullPage: false });
  console.log('Invoice captured');

  // Go back
  await page.locator('button:has-text("Cancel")').first().click();
  await page.waitForTimeout(1000);

  // Switch to Quotations tab
  await page.locator('text=Estimates & Quotations').click();
  await page.waitForTimeout(1000);

  // Screenshot: Quotation Creator
  await page.locator('button:has-text("New Quotation")').click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: path.join(artDir, 'compare_quot_mobile.png'), fullPage: false });
  console.log('Quotation captured');

  // Also get full page width measurements via JS
  const measurements = await page.evaluate(() => {
    const card = document.querySelector('.card');
    const body = document.body;
    return {
      bodyWidth: body.scrollWidth,
      viewportWidth: window.innerWidth,
      cardWidth: card ? card.getBoundingClientRect().width : null,
      cardRight: card ? card.getBoundingClientRect().right : null,
    };
  });
  console.log('Measurements:', JSON.stringify(measurements));

  await browser.close();
})();
