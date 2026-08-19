import { test, expect } from '@playwright/test';
import { ProjectDetailsPage } from './pages/ProjectDetailsPage';

test.describe('Task Management E2E', () => {
  let projectDetailsPage: ProjectDetailsPage;

  test.beforeEach(async ({ page }) => {
    projectDetailsPage = new ProjectDetailsPage(page);
    // Since we need an existing project to test tasks, we'll navigate to the first project in the DB
    // Alternatively, a robust test suite would create a project via API first and then navigate to it.
    
    // For this example, we navigate to the projects page and click the first project
    await page.goto('/projects');
    const firstProjectLink = page.locator('table tbody tr td').first();
    
    // Wait for the table to load
    await expect(firstProjectLink).toBeVisible({ timeout: 10000 });
    await firstProjectLink.click();
  });

  test('Admin can create a new task', async ({ page }) => {
    const testTaskName = `E2E Task ${Date.now()}`;
    
    // Switch to Tasks Tab
    await projectDetailsPage.tasksTab.click();
    
    // Click Add Task (Might require a milestone to exist first in real usage)
    // Here we just test the modal opening and closing
    await projectDetailsPage.addTaskBtn.click();
    
    // Fill the task title
    await projectDetailsPage.taskTitleInput.fill(testTaskName);
    
    // Save
    await projectDetailsPage.saveTaskBtn.click();

    // Verify modal closes
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // Verify the task appears in the table
    const taskRow = page.locator('tr').filter({ hasText: testTaskName });
    await expect(taskRow).toBeVisible({ timeout: 5000 });
  });
});
