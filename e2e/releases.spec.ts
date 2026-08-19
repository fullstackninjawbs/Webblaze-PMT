import { test, expect } from '@playwright/test';
import { ReleasesPage } from './pages/ReleasesPage';

test.describe('Releases Management E2E', () => {
  let releasesPage: ReleasesPage;

  test.beforeEach(async ({ page }) => {
    releasesPage = new ReleasesPage(page);
    await releasesPage.goto();
  });

  test('Admin can create a new release', async ({ page }) => {
    const testReleaseDetails = `E2E Release Details ${Date.now()}`;
    const testProjectName = 'Acme Corp - Platform Migration'; // Assuming a project exists
    const testDepartment = 'Fullstack';
    
    try {
      await releasesPage.createRelease(testProjectName, testDepartment, testReleaseDetails);

      // Verify that the modal closed
      await expect(page.getByRole('dialog')).not.toBeVisible();
      
      // Verify the release is in the list
      const releaseCard = page.locator('.mantine-Card-root').filter({ hasText: testReleaseDetails });
      await expect(releaseCard).toBeVisible({ timeout: 5000 });
    } catch (e) {
      console.log('Test might have failed because the Project name is incorrect in the seed data.');
      throw e;
    }
  });
});
