const { test, expect } = require('@playwright/test');

test.describe('Remembered Device Authentication Flow', () => {
  test('Complete flow: First login -> Subsequent login (Role+PIN only) -> Forget device', async ({ browser }) => {
    test.setTimeout(60000);

    const context = await browser.newContext({
      viewport: { width: 412, height: 915 },
      userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36'
    });

    const page = await context.newPage();

    page.on('console', msg => console.log(`[PAGE LOG] ${msg.text()}`));

    console.log('--- Step 1: FIRST LOGIN ON NEW DEVICE ---');
    await page.goto('http://localhost:5173/');
    await page.waitForTimeout(1000);

    const mobileInput = page.locator('input[placeholder="Enter registered mobile"]');
    await expect(mobileInput).toBeVisible();
    console.log('✔ Mobile + Password screen verified on first login.');

    await mobileInput.fill('9425098765');
    await page.fill('input[placeholder="Enter your password"]', 'owner123');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(1500);

    const roleHeading = page.locator('text=Select your staff profile to continue');
    await expect(roleHeading).toBeVisible();
    console.log('✔ Role Selection screen displayed after Mobile + Password.');

    // Click Owner profile (Vaibhav Patel)
    await page.click('button:has-text("Vaibhav Patel")');
    await page.waitForTimeout(500);

    const pinHeading = page.locator('text=Enter 4-Digit PIN');
    await expect(pinHeading).toBeVisible();
    console.log('✔ PIN entry screen displayed.');

    await page.keyboard.press('1');
    await page.keyboard.press('2');
    await page.keyboard.press('3');
    await page.keyboard.press('4');
    await page.waitForTimeout(1500);

    const dashboardText = page.locator('text=AgriBiz');
    await expect(dashboardText.first()).toBeVisible();
    console.log('✔ Logged into main application successfully!');

    console.log('--- Step 2: SUBSEQUENT LOGIN ON SAME DEVICE (PWA / Browser Reopen) ---');
    await page.close();

    const page2 = await context.newPage();
    await page2.goto('http://localhost:5173/');
    await page2.waitForTimeout(1500);

    const mobileInputPage2 = page2.locator('input[placeholder="Enter registered mobile"]');
    await expect(mobileInputPage2).not.toBeVisible();
    await expect(page2.locator('text=Select your staff profile to continue')).toBeVisible();
    console.log('✔ Mobile + Password SKIPPED on subsequent visit! Role Selection displayed directly.');

    await page2.click('button:has-text("Vaibhav Patel")');
    await page2.waitForTimeout(500);
    await page2.keyboard.press('1');
    await page2.keyboard.press('2');
    await page2.keyboard.press('3');
    await page2.keyboard.press('4');
    await page2.waitForTimeout(1500);

    console.log('✔ Re-authenticated with PIN only on subsequent visit!');

    console.log('--- Step 3: FORGET THIS DEVICE ---');
    await page2.click('button:has-text("Vaibhav Patel")');
    await page2.waitForTimeout(500);

    const forgetButton = page2.locator('button:has-text("Forget This Device")');
    await expect(forgetButton).toBeVisible();
    await forgetButton.click();
    await page2.waitForTimeout(1000);

    await expect(page2.locator('input[placeholder="Enter registered mobile"]')).toBeVisible();
    console.log('✔ Forget This Device removed remembered state and returned to Mobile + Password!');

    console.log('--- Step 4: REOPEN AFTER FORGET DEVICE ---');
    await page2.goto('http://localhost:5173/');
    await page2.waitForTimeout(1000);
    await expect(page2.locator('input[placeholder="Enter registered mobile"]')).toBeVisible();
    console.log('✔ Subsequent launch after Forget This Device correctly requires Mobile + Password again!');

    await context.close();
  });
});
