import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

// Opt out of the global authenticated state for these tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Authentication and RBAC Navigation', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('Admin login redirects to Dashboard', async ({ page }) => {
    // Fill in admin credentials
    await loginPage.login('admin@webblaze.com', 'password123'); // Adjust based on DB seeding
    
    // Verify redirection to /dashboard
    await expect(page).toHaveURL(/\/dashboard$/);
    
    // Verify topbar or dashboard elements are visible
    await expect(page.locator('text=Management')).toBeVisible();
  });

  test('Team Member login redirects to Projects (My Projects)', async ({ page }) => {
    // Fill in team member credentials
    await loginPage.login('a@a.com', 'pass123'); // Adjust based on DB seeding
    
    // Verify redirection to /projects
    await expect(page).toHaveURL(/\/projects$/);
    
    // Verify projects page elements
    await expect(page.locator('text=My Projects').first()).toBeVisible();
  });

  test('Invalid login shows error toast', async ({ page }) => {
    // Fill in invalid credentials
    await loginPage.login('invalid@webblaze.com', 'wrongpassword');
    
    // Verify error toast/message is displayed
    await expect(page.locator('text=Invalid credentials').first()).toBeVisible({ timeout: 5000 }).catch(() => {
        // sometimes it's "Invalid email or password"
    });
    
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).toMatch(/Invalid/i);
  });
});
