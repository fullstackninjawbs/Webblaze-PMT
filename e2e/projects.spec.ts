import { test, expect } from '@playwright/test';
import { ProjectsPage } from './pages/ProjectsPage';

test.describe('Project Creation E2E', () => {
  let projectsPage: ProjectsPage;

  test.beforeEach(async ({ page }) => {
    projectsPage = new ProjectsPage(page);
    await projectsPage.goto();
  });

  test('Admin can create a new project', async ({ page }) => {
    const testProjectName = `E2E Test Project ${Date.now()}`;
    
    // Attempt to create a project
    // NOTE: For this to work reliably, we need a Client and Department that exist in the DB.
    // If the selected client/department doesn't exist, this test will fail.
    // You should modify the names to match your DB seeds.
    const clientName = 'Acme Corp'; // Change to an actual client in your DB
    const departmentName = 'Fullstack'; // Change to an actual department

    try {
      await projectsPage.createProject(testProjectName, clientName, departmentName);

      // Verify that the modal closed and the new project appears in the list
      await expect(page.getByRole('dialog')).not.toBeVisible();
      
      // Wait for table to render the new row
      const projectRow = page.locator('tr').filter({ hasText: testProjectName });
      await expect(projectRow).toBeVisible({ timeout: 5000 });
    } catch (e) {
      console.log('Test might have failed because the Client or Department name is incorrect.');
      throw e;
    }
  });
});
