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
  
  const artDir = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\c07fd6e3-b41f-4677-979f-37472570aa00';
  
  console.log('Navigating to Sales...');
  // Check if we are on mobile bottom nav
  const salesBtn = page.locator('.mobile-bottom-nav button:has-text("Sales")');
  if (await salesBtn.count() > 0) {
    await salesBtn.click();
  } else {
    await page.locator('text=Sales').click();
  }
  await page.waitForTimeout(2000);
  
  console.log('Switching to Estimates & Quotations tab...');
  await page.locator('text=Estimates & Quotations').click();
  await page.waitForTimeout(1000);
  
  console.log('Clicking New Quotation...');
  await page.locator('button:has-text("New Quotation")').click();
  await page.waitForTimeout(2000);
  
  console.log('Capturing mobile New Quotation form (Step 1)...');
  await page.screenshot({ path: path.join(artDir, 'mobile_new_quotation_step1.png'), fullPage: true });
  
  await browser.close();
  console.log('Mobile quotation screenshots captured successfully.');
})();
