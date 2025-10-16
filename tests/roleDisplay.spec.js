import { test, expect } from '@playwright/test';
import { time } from 'console';

test.describe('Signal Dispatch Suite', () => {
  test('End-to-End Signal Dispatch Flow', async ({ page }) => {
    // ---------------------- STEP 1: LOGIN & NAVIGATE TO ASSIGN DISPATCH ----------------------
    await page.route(/\.(png|jpg|jpeg)$/i, route => route.abort());

    //const baseURL = 'https://uat.signaledge.teamsignal.com';
    const baseURL = 'https://stage.edge.teamsignal.com/';
    const credentials = {
      //email: 'Tracy@yopmail.com',
      //password: 'Admin@123'
      email: 'ali.tariq+fo@tkxel.io',
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
      .getByRole('row', { name: "- Omaha, NE Updated" })
      //.getByRole('row', { name: "201335 Automation Test1 226" })
      .getByRole('button')
      .first();

    await assignButton.waitFor({ state: 'visible', timeout: 30000 });
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

// ---------------------- STEP 3: CHECK AVAILABLE USERS  ----------------------
const availableAccordion = page.locator(
  "div.MuiAccordion-root",
  { has: page.locator("h6", { hasText: "Available Users" }) }
);
await availableAccordion.waitFor({ state: 'visible', timeout: 15000 });
console.log("✅ Available Users section visible");

const officerNames = availableAccordion.locator("p.MuiTypography-body1");
const count = await officerNames.count();
console.log(`✅ Found ${count} officer name elements`);

const users = [];

for (let i = 0; i < count; i++) {
  const officerNameElement = officerNames.nth(i);

  const card = officerNameElement.locator(
    "xpath=ancestor::div[.//span[contains(@class,'MuiTypography-subtitle3')]][1]"
  );

  const name = (await officerNameElement.textContent().catch(() => '')).trim() || 'N/A';

  const status = (
    await card
      .locator("span:has-text('Clocked in'), span:has-text('Available')")
      .first()
      .textContent()
      .catch(() => '')
  ).trim() || 'N/A';

  const role = (
    await card
      .locator("span.MuiTypography-subtitle3")
      .filter({ hasNotText: '•' })
      .first()
      .textContent()
      .catch(() => '')
  ).trim() || 'N/A';

  users.push({ name, status, role });
}

console.table(users);


const statuses = users.map(u => u.status);
    const firstAvailableIndex = statuses.indexOf('Available');
    const lastClockedInIndex = statuses.lastIndexOf('Clocked in');

     if (lastClockedInIndex === -1) {
      console.warn('⚠️ No clocked-in officer available currently');
    } else if (firstAvailableIndex !== -1 && lastClockedInIndex !== -1) {
      expect(lastClockedInIndex).toBeLessThan(firstAvailableIndex);
      console.log('✅ "Clocked in" users appear before "Available" users');
    } else {
      console.warn('⚠️ Not enough data to validate order');
    }

});  });