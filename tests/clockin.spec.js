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
      .filter({ hasText: /^All Statuses \(2\)/ })
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

     // Wait for Available Users accordion to appear
const availableAccordion = page.locator(
  "div.MuiAccordion-root",
  { has: page.locator("h6", { hasText: "Available Users" }) }
);

await availableAccordion.waitFor({ state: 'visible', timeout: 15000 });
console.log("✅ Available Users section visible");

// Locate user cards inside this accordion
const userCards = availableAccordion.locator(
  "xpath=.//span[normalize-space()='Clocked in' or normalize-space()='Available']" +
  "/ancestor::div[contains(@class,'MuiBox-root')][1]"
);


    const count = await userCards.count();
    console.log(`✅ Found ${count} officer cards`);

    const users = [];
    for (let i = 0; i < count; i++) {
      const card = userCards.nth(i);
      const name = (await card.locator("p").first().textContent().catch(() => '')).trim();
      const status = (await card.locator("span:has-text('Clocked in'), span:has-text('Available')").first().textContent().catch(() => '')).trim();
      users.push({ name, status });
    }

    console.table(users);
    

    // 🧠 Validate Clocked in appear before Available
    const statuses = users.map(u => u.status);
    const firstAvailableIndex = statuses.indexOf('Available');
    const lastClockedInIndex = statuses.lastIndexOf('Clocked in');

    if (firstAvailableIndex !== -1 && lastClockedInIndex !== -1) {
      expect(lastClockedInIndex).toBeLessThan(firstAvailableIndex);
      console.log('✅ Order validation passed: "Clocked in" users appear before "Available" users');
    } else {
      console.warn('⚠️ Not enough data to validate order (missing one of the statuses)');
    }

});  });
