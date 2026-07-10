const { chromium } = require('playwright');

(async () => {
  console.log('Launching local Chrome...');
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();

  // Log all console messages
  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type().toUpperCase()}: ${msg.text()}`);
  });

  // Log page errors
  page.on('pageerror', err => {
    console.error(`[BROWSER PAGE ERROR] ${err.message}\nStack: ${err.stack}`);
  });

  // Log downloads
  page.on('download', download => {
    console.log(`[DOWNLOAD STARTED] Filename: ${download.suggestedFilename()}`);
  });

  console.log('Navigating to http://localhost:5173/');
  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(1000);

  // Click on "Business Reports" link
  console.log('Clicking on Business Reports nav item...');
  await page.click('text=Business Reports');
  await page.waitForTimeout(2000);

  // GSTR-1
  console.log('\n--- TESTING GSTR-1 ---');
  console.log('Clicking on GSTR-1 Return tab...');
  await page.click('text=GSTR-1 Return');
  await page.waitForTimeout(1000);

  console.log('Clicking Export CSV...');
  await page.click('text=Export CSV');
  await page.waitForTimeout(1500);

  console.log('Clicking Save PDF...');
  await page.click('text=Save PDF');
  await page.waitForTimeout(2500);

  // GSTR-2
  console.log('\n--- TESTING GSTR-2 ---');
  console.log('Clicking on GSTR-2 Inward tab...');
  await page.click('text=GSTR-2 Inward');
  await page.waitForTimeout(1000);

  console.log('Clicking Export CSV...');
  await page.click('text=Export CSV');
  await page.waitForTimeout(1500);

  console.log('Clicking Save PDF...');
  await page.click('text=Save PDF');
  await page.waitForTimeout(2500);

  // GSTR-3B
  console.log('\n--- TESTING GSTR-3B ---');
  console.log('Clicking on GSTR-3B Return tab...');
  await page.click('text=GSTR-3B Return');
  await page.waitForTimeout(1000);

  console.log('Clicking Export CSV...');
  await page.click('text=Export CSV');
  await page.waitForTimeout(1500);

  console.log('Clicking Save PDF...');
  await page.click('text=Save PDF');
  await page.waitForTimeout(2500);

  await browser.close();
  console.log('\nTesting completed.');
})();
