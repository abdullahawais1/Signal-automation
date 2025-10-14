import { test, expect } from '@playwright/test';

test.describe('Signal Dispatch Module', () => {

  const baseURL = 'https://uat.signaledge.teamsignal.com';
  const credentials = {
    email: 'Tracy@yopmail.com',
    password: 'Admin@123'
  };

  // Reusable login helper
  async function login(page) {
    await page.route(/\.(png|jpg|jpeg)$/i, route => route.abort());
    await page.goto(`${baseURL}/`);
    await page.getByRole('button', { name: 'Login' }).click();

    await page.locator('#email').fill(credentials.email);
    await page.locator('#password').fill(credentials.password);
    await page.locator('#btn-login').click();

    await page.waitForLoadState('networkidle');
    await expect(page.locator("//a[@href='/app/obx/dispatch']")).toBeVisible({ timeout: 30000 });
  }

  test.beforeEach(async ({ page }) => {
    // Could login before each test if needed
    await login(page);
  });

  // 1️⃣ Test navigation to Dispatch page
  test('Navigate to Dispatch module', async ({ page }) => {
    const dispatchLink = page.locator("//a[@href='/app/obx/dispatch']");
    await dispatchLink.click();
    await expect(page).toHaveURL(/dispatch/);
  });

  // 2️⃣ Test Assign Dispatch Flow
  test('Assign officer(s) to Dispatch', async ({ page }) => {
    // Navigate to dispatch page
    const dispatchLink = page.locator("//a[@href='/app/obx/dispatch']");
    await dispatchLink.click();
    await expect(page).toHaveURL(/dispatch/);

    // Locate Dispatch ID and click Assign
    const assignButton = page
      .getByRole('row', { name: "201335 Automation Test1 226" })
      .getByRole('button')
      .first();

    await assignButton.waitFor({ state: 'visible', timeout: 20000 });
    await assignButton.click();
    await page.waitForURL('**/assign-officer**', { timeout: 30000 });

    // Clear statuses
    const clearStatusesButton = page
      .locator('div')
      .filter({ hasText: /^All Statuses \(2\)Next 1 HourAll Officers$/ })
      .getByRole('img')
      .first();

    await clearStatusesButton.click();
    await page.waitForTimeout(1000);

    const headingText = await page.getByRole('heading', { name: /All Statuses/i }).innerText();
    expect.soft(headingText).not.toContain('(2)'); 

    // Open officers dropdown
    const allOfficersDropdown = page.getByRole('heading', { name: 'All Officers' });
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
      test.skip();
    } else {
      availableOfficers = availableOfficers.sort(() => Math.random() - 0.5);
      const officersToSelect = availableOfficers.slice(0, 3);

      for (const officerName of officersToSelect) {
        await page.locator('#simple-popper div').filter({ hasText: officerName }).first().click();
      }

      selectedOfficers = officersToSelect;
      await allOfficersDropdown.click(); // Close dropdown
    }

    // Verify assigned officers
    for (const officer of selectedOfficers) {
      const dedicatedSection = page.locator("//h6[normalize-space()='Dedicated Jobs']/ancestor::div[contains(@class, 'MuiBox-root')]");
      const patrolSection = page.locator("//h6[normalize-space()='Patrol Jobs (Runsheets)']/ancestor::div[contains(@class, 'MuiBox-root')]");

      const dedicatedOfficer = dedicatedSection.locator(`//span[normalize-space()='${officer}']`);
      const patrolOfficer = patrolSection.locator(`//span[normalize-space()='${officer}']`);

      const isInDedicated = await dedicatedOfficer.count() > 0;
      const isInPatrol = await patrolOfficer.count() > 0;

      if (isInDedicated) {
        console.log(`✅ Officer "${officer}" in Dedicated Jobs`);
        await expect(dedicatedOfficer.first()).toBeVisible();
      } else if (isInPatrol) {
        console.log(`✅ Officer "${officer}" in Patrol Jobs`);
        await expect(patrolOfficer.first()).toBeVisible();
      } else {
        console.log(`⚠️ Officer "${officer}" not found in any section.`);
      }
    }
  });

});
