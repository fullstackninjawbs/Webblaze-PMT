import { Page, Locator } from '@playwright/test';

export class ClientsPage {
  readonly page: Page;
  readonly addClientBtn: Locator;
  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly companyNameInput: Locator;
  readonly sourceSelect: Locator;
  readonly billingTypeSelect: Locator;
  readonly saveBtn: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addClientBtn = page.getByRole('button', { name: 'Add Client' });
    this.nameInput = page.getByLabel('Client Name', { exact: true });
    this.emailInput = page.getByLabel('Email Address');
    this.companyNameInput = page.getByLabel('Company Name');
    this.sourceSelect = page.getByLabel('Source / Platform');
    this.billingTypeSelect = page.getByLabel('Billing Type');
    this.saveBtn = page.getByRole('button', { name: 'Create Client' });
    this.searchInput = page.getByPlaceholder('Search clients...');
  }

  async goto() {
    await this.page.goto('/clients');
  }

  async createClient(name: string, email: string, source: string, billingType: string) {
    await this.addClientBtn.click();
    await this.nameInput.fill(name);
    if (email) await this.emailInput.fill(email);
    
    // Select source
    await this.sourceSelect.click();
    await this.page.getByRole('option', { name: source, exact: true }).click();
    
    // Select billing type
    await this.billingTypeSelect.click();
    await this.page.getByRole('option', { name: billingType, exact: true }).click();
    
    await this.saveBtn.click();
  }
}
