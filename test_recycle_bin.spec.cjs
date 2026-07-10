const { test, expect } = require('@playwright/test');

test('test recycle bin end-to-end flow', async ({ page }) => {
  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`[CONSOLE ERROR] ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    console.error(`[PAGE ERROR] ${err.message}`);
  });

  // Handle all confirm/dialog boxes automatically (e.g., delete confirmation prompts)
  page.on('dialog', async dialog => {
    console.log(`[DIALOG] ${dialog.message()}`);
    await dialog.accept();
  });

  await page.goto('http://localhost:5173/');
  await page.waitForTimeout(500);

  // 1. Navigate to Customers tab
  console.log('Navigating to Customers page...');
  await page.click('text=Customers');
  await page.waitForTimeout(500);

  // Capture name of first customer to verify deletion
  const customerLink = page.locator('button.table-link-btn.supplier-link').first();
  const customerName = await customerLink.innerText();
  console.log(`Deleting customer: ${customerName}`);

  // Trigger actions menu dropdown
  const actionButton = page.locator('button[title="Actions"]').first();
  await actionButton.click();
  await page.waitForTimeout(200);

  // Click Delete Profile
  await page.click('text=Delete Profile');
  await page.waitForTimeout(500);

  // Verify the customer is no longer visible in the table list
  const textMatches = await page.locator(`text=${customerName}`).count();
  console.log(`Matches count for ${customerName} in Customers table after deletion: ${textMatches}`);
  expect(textMatches).toBe(0);

  // 2. Navigate to Recycle Bin
  console.log('Navigating to Recycle Bin...');
  await page.click('text=Recycle Bin');
  await page.waitForTimeout(500);

  // Verify the deleted customer is in the Recycle Bin list
  const recycleBinItemText = page.locator(`text=${customerName}`).first();
  await expect(recycleBinItemText).toBeVisible();

  // Click View details to inspect metadata
  console.log('Checking View details modal content...');
  const viewDetailsButton = page.locator('button[title="View details"]').first();
  await viewDetailsButton.click();
  await page.waitForTimeout(500);

  // Verify modal elements
  await expect(page.locator('text=Deleted Record Details')).toBeVisible();
  await expect(page.locator('text=Record Details').first()).toBeVisible();
  await expect(page.locator('text=Outstanding:')).toBeVisible();

  // Close details modal
  await page.click('text=Close');
  await page.waitForTimeout(200);

  // Click the Restore button (using the RotateCcw icon button)
  console.log('Restoring customer from Recycle Bin...');
  const restoreButton = page.locator('button[title="Restore record"]').first();
  await restoreButton.click();
  await page.waitForTimeout(200);

  // Confirm restoration in modal
  await page.click('text=Confirm Restore');
  await page.waitForTimeout(500);

  // Verify it's no longer in the Recycle Bin
  const recycleBinCount = await page.locator(`text=${customerName}`).count();
  expect(recycleBinCount).toBe(0);

  // 3. Navigate back to Customers and verify customer is present again
  console.log('Navigating back to Customers page to check restoration...');
  await page.click('text=Customers');
  await page.waitForTimeout(500);
  
  const customerRestoredText = page.locator(`text=${customerName}`).first();
  await expect(customerRestoredText).toBeVisible();

  // 4. Delete the customer again to verify permanent deletion
  console.log('Deleting customer again...');
  await actionButton.click();
  await page.waitForTimeout(200);
  await page.click('text=Delete Profile');
  await page.waitForTimeout(500);

  // Go to Recycle Bin
  await page.click('text=Recycle Bin');
  await page.waitForTimeout(500);

  // Click Delete Permanently
  console.log('Permanently deleting customer from Recycle Bin...');
  const permanentDeleteButton = page.locator('button[title="Delete permanently"]').first();
  await permanentDeleteButton.click();
  await page.waitForTimeout(200);

  // Confirm permanent deletion in confirmation dialog
  await page.click('text=Delete Permanently');
  await page.waitForTimeout(500);

  // Verify it is gone forever
  const finalRecycleBinCount = await page.locator(`text=${customerName}`).count();
  expect(finalRecycleBinCount).toBe(0);
  console.log('Recycle Bin end-to-end verification successfully completed!');
});
