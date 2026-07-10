const { chromium, devices } = require('playwright');
const path = require('path');

(async () => {
  console.log('Launching browser...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  
  const device = devices['iPhone 13'];
  const context = await browser.newContext({
    ...device,
    deviceScaleFactor: 2,
  });
  
  const page = await context.newPage();
  
  console.log('Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(3000);
  
  const artDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d9184de7-6115-4949-b546-1ebe4ff6f814';
  
  console.log('Navigating to Sales...');
  await page.locator('.mobile-bottom-nav button:has-text("Sales")').click();
  await page.waitForTimeout(2000);
  
  console.log('Opening first invoice details page...');
  await page.locator('.mobile-list-card-title button').first().click();
  await page.waitForTimeout(2000);
  
  console.log('Capturing mobile Invoice details view...');
  await page.screenshot({ path: path.join(artDir, 'mobile_invoice_details.png') });
  
  await browser.close();
  console.log('Invoice screenshot captured successfully.');
})();
