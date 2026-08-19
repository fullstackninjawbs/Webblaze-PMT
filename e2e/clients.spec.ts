import { test, expect } from '@playwright/test';
import { ClientsPage } from './pages/ClientsPage';

test.describe('Clients Management E2E', () => {
  let clientsPage: ClientsPage;

  test.beforeEach(async ({ page }) => {
    clientsPage = new ClientsPage(page);
    await clientsPage.goto();
  });

  test('Admin can create a new client', async ({ page }) => {
    const testClientName = `E2E Client ${Date.now()}`;
    
    await clientsPage.createClient(testClientName, `test${Date.now()}@example.com`, 'Upwork', 'Hourly Rate');

    // Verify that the modal closed
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Verify the client is in the list
    await clientsPage.searchInput.fill(testClientName);
    const clientRow = page.locator('tr').filter({ hasText: testClientName });
    await expect(clientRow).toBeVisible({ timeout: 5000 });
  });
});
