import { Page, Locator } from '@playwright/test';

export class ProjectDetailsPage {
  readonly page: Page;
  readonly tasksTab: Locator;
  readonly addTaskBtn: Locator;
  readonly taskTitleInput: Locator;
  readonly taskDescInput: Locator;
  readonly saveTaskBtn: Locator;
  readonly assigneeSelect: Locator;

  constructor(page: Page) {
    this.page = page;
    this.tasksTab = page.getByRole('tab', { name: 'Tasks' });
    this.addTaskBtn = page.getByRole('button', { name: 'Add Task' });
    this.taskTitleInput = page.getByLabel('Task Title', { exact: true });
    this.taskDescInput = page.getByLabel('Description');
    this.saveTaskBtn = page.getByRole('button', { name: 'Create Task' });
    this.assigneeSelect = page.getByLabel('Assign To (Optional)');
  }

  async goto(projectId: string) {
    await this.page.goto(`/projects/${projectId}`);
  }

  async createTask(title: string, assigneeName?: string) {
    await this.tasksTab.click();
    await this.addTaskBtn.click();
    
    // Fill the task title
    await this.taskTitleInput.fill(title);
    
    if (assigneeName) {
      await this.assigneeSelect.click();
      await this.page.getByRole('option', { name: assigneeName, exact: true }).click();
    }
    
    await this.saveTaskBtn.click();
  }
}
