import { Page, Locator } from '@playwright/test';

export class ProjectsPage {
  readonly page: Page;
  readonly newProjectButton: Locator;
  readonly projectNameInput: Locator;
  readonly clientSelect: Locator;
  readonly typeSelect: Locator;
  readonly createProjectButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.newProjectButton = page.getByRole('button', { name: 'New Project' });
    this.projectNameInput = page.getByPlaceholder('e.g., E-Commerce Platform');
    this.clientSelect = page.locator('label').filter({ hasText: 'Client' }).locator('..').locator('input'); // Basic mantine select locator
    this.typeSelect = page.locator('label').filter({ hasText: 'Department (Type)' }).locator('..').locator('input');
    this.createProjectButton = page.getByRole('button', { name: 'Create Project' });
  }

  async goto() {
    await this.page.goto('/projects');
  }

  async createProject(name: string, clientName: string, department: string) {
    await this.newProjectButton.click();
    await this.projectNameInput.fill(name);

    // Select Client
    await this.clientSelect.click();
    await this.page.getByRole('option', { name: clientName }).click();

    // Select Department
    await this.typeSelect.click();
    await this.page.getByRole('option', { name: department }).click();

    // Submit
    await this.createProjectButton.click();
  }
}
