import { test, expect } from '@playwright/test';

test('signal dispatch', async ({ page }) => {
  // Block heavy resources like images
  await page.route(/\.(png|jpg|jpeg)$/i, route => route.abort());

  // Define constants (base URL + credentials)
  const baseURL = 'https://uat.signaledge.teamsignal.com';
  const credentials = {
    email: 'Alsak232@yopmail.com',
    password: 'Admin@123'
  };

  // Page object–style locators
  const loginButton = page.getByRole('button', { name: 'Login' });
  const emailField = page.locator('#email');
  const passwordField = page.locator('#password');
  const submitButton = page.locator('#btn-login');

  // Navigate to base URL
  await page.goto(`${baseURL}/`);

  // Begin login process
  await loginButton.waitFor({ state: 'visible', timeout: 20000 });
  await loginButton.click();

  await emailField.waitFor({ state: 'visible', timeout: 20000 });
  await emailField.fill(credentials.email);
  await expect.soft(emailField).toBeVisible();
  await expect.soft(emailField).toBeEnabled();
  expect.soft(await emailField.inputValue()).not.toBe('');

  await passwordField.waitFor({ state: 'visible', timeout: 20000 });
  await passwordField.fill(credentials.password);
  await expect.soft(passwordField).toBeVisible();
  await expect.soft(passwordField).toBeEnabled();
  expect.soft(await passwordField.inputValue()).not.toBe('');

  await page.waitForLoadState('networkidle');
  await submitButton.waitFor({ state: 'visible', timeout: 20000 });
  await page.waitForTimeout(1000);
  await submitButton.click();

  // Wait for dashboard
  await page.waitForLoadState('networkidle');
  const dispatchLink = page.locator("//a[@href='/app/obx/dispatch']");
  await expect(dispatchLink).toBeVisible({ timeout: 30000 });

  // Click on Dispatch module
  await dispatchLink.click();
  await page.waitForURL('**/app/obx/dispatch', { timeout: 20000 });

  // Confirm navigation success
  await expect(page).toHaveURL(/dispatch/);

  // Locate Dispatch ID and click "Assign"
  const assignButton = page
    .getByRole('row', { name: "201331 Kendall Toyota 0233 -" })
    .getByRole('button')
    .first();

  await assignButton.waitFor({ state: 'visible', timeout: 20000 });
  await assignButton.click();

  // Wait for navigation to Assign Dispatch page
  await page.waitForURL('**/assign-officer**', { timeout: 30000 });

  // Confirm Assign Dispatch page loaded
  await expect(page).toHaveURL(/assign-officer/);

  // Open "All Statuses" dropdown
  const allStatusesDropdown = page.getByRole('heading', { name: 'All Statuses (2)' });
  await allStatusesDropdown.waitFor({ state: 'visible', timeout: 20000 });
  await allStatusesDropdown.click();

  // Wait for dropdown to appear
  const statusDropdown = page.locator('#simple-popper');
  await expect(statusDropdown).toBeVisible({ timeout: 20000 });

  const expectedStatuses = ['All Statuses', 'In Progress', 'Not Started', 'Upcoming', 'Clocked In', 'Available'];
  for (const status of expectedStatuses) {
  const option = statusDropdown.locator(`div:has-text("${status}")`);
  await expect.soft(option, `${status} should be visible in dropdown`).toBeVisible();}

  
  for (const status of expectedStatuses) {
  const option = statusDropdown.locator(`div:has-text("${status}")`);
  const checkedIcon = option.locator('svg rect[width="16"]');

  // Select
  await option.click();
  await expect.soft(checkedIcon, `${status} should be checked after click`).toBeVisible();

  // Deselect
  await option.click();
  await expect.soft(checkedIcon, `${status} should be unchecked after second click`).toHaveCount(0);
}


});
