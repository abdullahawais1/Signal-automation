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

    // ---------------------- STEP 3: OPEN OFFICERS DROPDOWN & SELECT OFFICERS ----------------------
    const allOfficersDropdown = page.getByRole('heading', { name: 'All Officers' });
    await allOfficersDropdown.waitFor({ state: 'visible', timeout: 15000 });
    await allOfficersDropdown.click();

    const officersDropdownPanel = page.locator('#simple-popper');
    await expect(officersDropdownPanel).toBeVisible({ timeout: 10000 });

    let availableOfficers = (
      await page.locator('#simple-popper div.MuiBox-root.css-0').allInnerTexts()
    )
      .map(name => name.replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
      .filter(name => name.length > 0);

    let selectedOfficers = [];

    if (availableOfficers.length === 0) {
      console.log('⚠️ No officers available to select.');
    } else {
      availableOfficers = availableOfficers.sort(() => Math.random() - 0.5);
      const officersToSelect = availableOfficers.slice(0, 3);
      console.log(`✅ Selecting officers: ${officersToSelect.join(', ')}`);

      for (const officerName of officersToSelect) {
        const officerLocator = page
          .locator('#simple-popper div')
          .filter({ hasText: officerName })
          .first();

        await officerLocator.scrollIntoViewIfNeeded();
        await officerLocator.click();
      }

      selectedOfficers = officersToSelect;
      console.log('✅ Selected officer(s):', selectedOfficers);

      const allOfficersHeader = page.getByRole('heading', { name: /All Officers/i });
      await allOfficersHeader.click();
      await expect(page.locator('#simple-popper')).toBeHidden({ timeout: 5000 });
    }

    // ---------------------- STEP 4: VERIFY SELECTED OFFICERS IN JOB SECTIONS ----------------------
    console.log('🔍 Verifying selected officers in job sections...');

    for (const officerName of selectedOfficers) {
      let found = false;

      const dedicatedLocator = page.locator(
        "div.MuiAccordion-root",
        { has: page.locator("h6", { hasText: "Dedicated Jobs" }) }
      ).locator(`text=${officerName}`);

      await page.waitForTimeout(1000);

      if (await dedicatedLocator.isVisible()) {
        console.log(`✅ Officer "${officerName}" found in Dedicated Jobs section.`);
        found = true;
      } else {
        const patrolLocator = page.locator(
          "div.MuiAccordion-root",
          { has: page.locator("h6", { hasText: "Patrol Jobs (Runsheets)" }) }
        ).locator(`text=${officerName}`);

        await page.waitForTimeout(1000);

        if (await patrolLocator.isVisible()) {
          console.log(`✅ Officer "${officerName}" found in Patrol Jobs section.`);
          found = true;
        }
      }

      if (!found) {
        console.log(`❌ Officer "${officerName}" not found in either Dedicated or Patrol Jobs sections.`);
      }
    }

    console.log('✅ Verification of selected officers completed.');
  });
});
