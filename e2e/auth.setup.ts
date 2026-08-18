import { test as setup, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage';

const adminFile = 'playwright/.auth/admin.json';

setup('authenticate as admin', async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.goto();
  
  // You will need to replace this with your actual admin credentials or read from process.env
  // For safety in this shared code, I will use placeholder emails.
  await loginPage.login('admin@webblaze.com', 'password123');
  
  // Wait until the page receives the cookies/tokens and redirects successfully.
  // Wait for the URL to change from /login to indicate successful authentication
  await page.waitForURL('**/dashboard');
  
  // End of authentication steps.
  await page.context().storageState({ path: adminFile });
});
