import { Page, Locator } from '@playwright/test';

export class ReleasesPage {
  readonly page: Page;
  readonly addReleaseBtn: Locator;
  readonly projectSelect: Locator;
  readonly departmentSelect: Locator;
  readonly teamMemberSelect: Locator;
  readonly detailsInput: Locator;
  readonly releaseDateInput: Locator;
  readonly saveReleaseBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addReleaseBtn = page.getByRole('button', { name: 'Add Release' });
    this.projectSelect = page.getByLabel('Project', { exact: true });
    this.departmentSelect = page.getByLabel('Department');
    this.teamMemberSelect = page.getByLabel('Team Member (Optional)');
    this.detailsInput = page.getByLabel('Release Details');
    this.releaseDateInput = page.getByLabel('Release Date');
    this.saveReleaseBtn = page.getByRole('button', { name: 'Create Release' });
  }

  async goto() {
    await this.page.goto('/releases');
  }

  async createRelease(projectName: string, department: string, details: string) {
    await this.addReleaseBtn.click();
    
    // Select Project
    await this.projectSelect.click();
    await this.page.getByRole('option', { name: projectName, exact: true }).click();
    
    // Select Department
    await this.departmentSelect.click();
    await this.page.getByRole('option', { name: department, exact: true }).click();
    
    // Fill Details
    await this.detailsInput.fill(details);
    
    // For Release Date, we can just pick today
    await this.releaseDateInput.click();
    // Simple way to select today in mantine datepicker
    const today = new Date().getDate().toString();
    await this.page.getByRole('button', { name: today, exact: true }).first().click();
    
    await this.saveReleaseBtn.click();
  }
}
