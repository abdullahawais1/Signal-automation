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

    // ---------------------- STEP 3: VERIFY JOB STATUS ORDER ----------------------
console.log('🔍 Verifying job status order in Dedicated and Patrol sections...');

// Status priority mapping 
const statusPriority = {
  "in progress": 1,
  "not started": 2,
  "upcoming": 3
};

// Helper function to verify order inside a section
async function verifySectionOrder(sectionName, headingText) {
  console.log(`Checking order for section: ${sectionName}`);

  // Locate the section container
  const section = page.locator("div.MuiAccordion-root", {
    has: page.locator("h6", { hasText: headingText })
  });

  // Wait for the section to appear
  await section.waitFor({ state: 'visible', timeout: 15000 });
  await page.waitForTimeout(1000);

  // Grab all visible status
  const statusElements = section.locator("span", { hasText: /In progress|Not started|Upcoming/i });
  const count = await statusElements.count();

  if (count === 0) {
    console.log(` No jobs found in ${sectionName} section.`);
    return;
  }

  const statuses = [];
  for (let i = 0; i < count; i++) {
    const text = (await statusElements.nth(i).innerText()).trim().toLowerCase();
    statuses.push(text);
  }

  // Convert to priority numbers
  const priorities = statuses.map(s => statusPriority[s] ?? 999);

  // Check if sorted correctly 
  let sorted = true;
  for (let i = 1; i < priorities.length; i++) {
    if (priorities[i] < priorities[i - 1]) {
      sorted = false;
      break;
    }
  }

  if (sorted) {
    console.log(`Order correct: ${statuses.join(' → ')}`);
  } else {
    console.log(`Order incorrect: Found [${statuses.join(', ')}]`);
  }
}

await verifySectionOrder('Dedicated Jobs', 'Dedicated Jobs');
await verifySectionOrder('Patrol Jobs', 'Patrol Jobs (Runsheets)');

console.log('Status order verification completed.');

});
});
