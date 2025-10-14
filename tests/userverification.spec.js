import { test, expect } from '@playwright/test';
import { time } from 'console';

test('signal dispatch', async ({ page }) => {
  // Block heavy resources like images
  await page.route(/\.(png|jpg|jpeg)$/i, route => route.abort());

  // Define constants (base URL + credentials)
  const baseURL = 'https://uat.signaledge.teamsignal.com';
  const credentials = {
    email: 'Tracy@yopmail.com',
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
    .getByRole('row', { name: "201335 Automation Test1 226" })
    .getByRole('button')
    .first();

  await assignButton.waitFor({ state: 'visible', timeout: 20000 });
  await assignButton.click();

  // Wait for navigation to Assign Dispatch page
  await page.waitForURL('**/assign-officer**', { timeout: 30000 });

  // Confirm Assign Dispatch page loaded
  await expect(page).toHaveURL(/assign-officer/);

  // Step 2: Reset All Statuses using cross icon 
  const clearStatusesButton = page
    .locator('div')
    .filter({ hasText: /^All Statuses \(2\)Next 1 HourAll Officers$/ })
    .getByRole('img')
    .first();

  await clearStatusesButton.waitFor({ state: 'visible', timeout: 15000 });
  await clearStatusesButton.click();
  await page.waitForTimeout(1000);

  // Verify that statuses are cleared
  const allStatusesHeading = page.getByRole('heading', { name: /All Statuses/i });
  await expect.soft(allStatusesHeading).toBeVisible();
  const headingText = await allStatusesHeading.innerText();
  expect.soft(headingText).not.toContain('(2)'); 

  // Step 3: Open All Officers dropdown
  const allOfficersDropdown = page.getByRole('heading', { name: 'All Officers' });
  await allOfficersDropdown.waitFor({ state: 'visible', timeout: 15000 });
  await allOfficersDropdown.click();

  // Verify dropdown opened
  const officersDropdownPanel = page.locator('#simple-popper');
  await expect(officersDropdownPanel).toBeVisible({ timeout: 10000 });

    // Step 4: Dynamically select available officers
  let availableOfficers = (
    await page.locator('#simple-popper div.MuiBox-root.css-0').allInnerTexts()
  )
    .map(name => name.replace(/[\u200B-\u200D\uFEFF]/g, '').trim())
    .filter(name => name.length > 0);

// Initialize variable in outer scope
let selectedOfficers = [];

if (availableOfficers.length === 0) {
  console.log('⚠️ No officers available to select.');
} else {
  availableOfficers = availableOfficers.sort(() => Math.random() - 0.5);

  // Select up to 2 officers
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

  // Close dropdown by clicking heading again
  const allOfficersHeader = page.getByRole('heading', { name: /All Officers/i });
  await allOfficersHeader.click();
  await expect(page.locator('#simple-popper')).toBeHidden({ timeout: 5000 });
}

console.log('🔍 Verifying selected officers in job sections...');

for (const officerName of selectedOfficers) {
  let found = false;

  // --- Dedicated Jobs check ---

  const dedicatedLocator = page.locator(
  "div.MuiAccordion-root", 
  { has: page.locator("h6", { hasText: "Dedicated Jobs" }) }
).locator(`text=${officerName}`);


  await page.waitForTimeout(1000); 

  if (await dedicatedLocator.isVisible()) {
    console.log(`✅ Officer "${officerName}" found in Dedicated Jobs section.`);
    found = true;
  } else {
    // --- Patrol Jobs check ---
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