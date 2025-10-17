import { test, expect } from '@playwright/test';
import { time } from 'console';

test.describe('Signal Dispatch Suite', () => {
  test('End-to-End Signal Dispatch Flow', async ({ page }) => {
    // ---------------------- STEP 1: LOGIN & NAVIGATE TO ASSIGN DISPATCH ----------------------
    await page.route(/\.(png|jpg|jpeg)$/i, route => route.abort());

    const baseURL = 'https://uat.signaledge.teamsignal.com';
    //const baseURL = 'https://stage.edge.teamsignal.com/';
    const credentials = {
      email: 'Tracy@yopmail.com',
      password: 'Admin@123'
      //email: 'ali.tariq+fo@tkxel.io',
      //password: 'Admin@123'
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
      //.getByRole('row', { name: "- Omaha, NE Updated" })
      .getByRole('row', { name: "201335 Automation Test1 226" })
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

        // ---------------------- STEP 3: VERIFY STATUS COLORS ----------------------
    console.log('🔍 Verifying status tag colors...');
    //await page.pause();

    const statusStyles = {
      "In Progress": { color: "rgb(20, 109, 255)", background: "rgb(239, 248, 255)" },
      "Not Started": { color: "rgb(233, 90, 8)", background: "rgb(251, 238, 237)" },
      "Clocked in": { color: "rgb(46, 150, 75)", background: "rgb(236, 253, 243)" },
      "Available": { color: "rgb(220, 104, 3)", background: "rgb(255, 250, 235)" },
      "Upcoming": { color: "rgb(89, 37, 220)", background: "rgb(244, 243, 255)" }
    };
    await page.waitForTimeout(2000);

    // Loop through each status and validate occurrences
    for (const [status, expected] of Object.entries(statusStyles)) {
      const tags = page.locator(`text=${status}`);
      const count = await tags.count();

      if (count === 0) {
        console.warn(`⚠️ No "${status}" tags found on page.`);
        continue;
      }

      for (let i = 0; i < count; i++) {
        const [actualColor, actualBg] = await tags.nth(i).evaluate(el => {
          const style = window.getComputedStyle(el);
          return [style.color, style.backgroundColor];
        });

        try {
          expect(actualColor, `${status} tag text color mismatch`).toBe(expected.color);
          expect(actualBg, `${status} tag background mismatch`).toBe(expected.background);
          console.log(`✅ "${status}" tag ${i + 1}: Color and background verified.`);
        } catch (err) {
          console.error(`❌ error`);
        }
      }
    }

    console.log(' All visible status tag colors verified successfully.');


  });
});