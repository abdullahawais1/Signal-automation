import { test, expect } from '@playwright/test';
import { time } from 'console';

test.describe('Signal Dispatch Suite', () => {
  test('End-to-End Signal Dispatch Flow', async ({ page }) => {
    // ---------------------- STEP 1: LOGIN & NAVIGATE TO ASSIGN DISPATCH ----------------------
    await page.route(/\.(png|jpg|jpeg)$/i, route => route.abort());

    const baseURL = 'https://uat.signaledge.teamsignal.com';
    const credentials = {
      email: 'Tracy@yopmail.com',
      password: 'Admin@123'
    };

    const loginButton = page.getByRole('button', { name: 'Login' });
    const emailField = page.locator('#email');
    const passwordField = page.locator('#password');
    const submitButton = page.locator('#btn-login');

    await page.goto(`${baseURL}/`);
    await loginButton.waitFor({ state: 'visible', timeout: 20000 });
    await loginButton.click();

    await emailField.waitFor({ state: 'visible', timeout: 20000 });
    await emailField.fill(credentials.email);
    await passwordField.waitFor({ state: 'visible', timeout: 20000 });
    await passwordField.fill(credentials.password);

    await page.waitForLoadState('networkidle');
    await submitButton.waitFor({ state: 'visible', timeout: 20000 });
    await page.waitForTimeout(1000);
    await submitButton.click();

    await page.waitForLoadState('networkidle');
    const dispatchLink = page.locator("//a[@href='/app/obx/dispatch']");
    await expect(dispatchLink).toBeVisible({ timeout: 30000 });
    await dispatchLink.click();
    await page.waitForURL('**/app/obx/dispatch', { timeout: 20000 });

    const assignButton = page
      .getByRole('row', { name: "201335 Automation Test1 226" })
      .getByRole('button')
      .first();

    await assignButton.waitFor({ state: 'visible', timeout: 20000 });
    await assignButton.click();
    await page.waitForURL('**/assign-officer**', { timeout: 30000 });
    await expect(page).toHaveURL(/assign-officer/);

    console.log('✅ Navigated to Assign Dispatch page');

    // ---------------------- STEP 2: CLEAR ALL STATUSES ----------------------
    const clearStatusesButton = page
      .locator('div')
      .filter({ hasText: /^All Statuses \(2\)Next 1 HourAll Officers$/ })
      .getByRole('img')
      .first();

    await clearStatusesButton.waitFor({ state: 'visible', timeout: 15000 });
    await clearStatusesButton.click();
    await page.waitForTimeout(1000);

    const allStatusesHeading = page.getByRole('heading', { name: /All Statuses/i });
    await expect.soft(allStatusesHeading).toBeVisible();
    const headingText = await allStatusesHeading.innerText();
    expect.soft(headingText).not.toContain('(2)');

    console.log('✅ Cleared all statuses');

    // ---------------------- STEP 3: VERIFY CLOCKED-IN USERS APPEAR FIRST ----------------------
console.log('🔍 Verifying "Clocked in" users appear before "Available" users...');

// Anchor to "Available Users" accordion section
const availableUsersAccordion = page.locator(
  "div.MuiAccordion-root",
  { has: page.locator("h6", { hasText: "Available Users" }) }
);

// Wait for the accordion to be visible
await expect(availableUsersAccordion).toBeVisible({ timeout: 20000 });

// Now locate user cards *within* the Available Users accordion
const userCards = availableUsersAccordion.locator("div.jss172.MuiBox-root");

// Ensure cards are present
//await expect(userCards.first()).toBeVisible({ timeout: 20000 });

// Extract officer names and statuses dynamically
const userData = [];
const cardCount = await userCards.count();

for (let i = 0; i < cardCount; i++) {
  const card = userCards.nth(i);

  const name = (await card.locator("p.MuiTypography-body1").innerText().catch(() => 'Unknown')).trim();
  const isClockedIn = await card.locator("span:has-text('Clocked in')").isVisible().catch(() => false);
  const isAvailable = await card.locator("span:has-text('Available')").isVisible().catch(() => false);

  let status = 'Unknown';
  if (isClockedIn) status = 'Clocked in';
  else if (isAvailable) status = 'Available';

  userData.push({ name, status });
}

console.log(`✅ Extracted ${userData.length} users`);
console.table(userData);

// Verify "Clocked in" users appear before "Available" users
let seenAvailable = false;
for (const user of userData) {
  if (user.status === 'Available') seenAvailable = true;
  if (user.status === 'Clocked in' && seenAvailable) {
    console.log(`❌ Order violation: "${user.name}" (Clocked in) appeared after an Available user.`);
    throw new Error('Clocked-in order violated');
  }
}

console.log('✅ Order check passed: All "Clocked in" users appear before "Available" users.');


    
});  });
