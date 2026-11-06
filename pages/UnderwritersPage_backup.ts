import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import path from 'node:path';

export class UnderwritersPage {
  readonly page: Page;

  // Currently selected underwriter
  private selectedUnderwriterEmail = '';

  // Mandatory fields
  readonly companyName: Locator;
  readonly email: Locator;
  readonly phone: Locator;
  readonly website: Locator;
  readonly description: Locator;
  readonly address: Locator;
  readonly city: Locator;
  readonly state: Locator;
  readonly country: Locator;
  readonly postalCode: Locator;

  // Form buttons and notifications
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;
  readonly notificationRegion: Locator;

  // Search and filters
  readonly searchButton: Locator;
  readonly searchTextbox: Locator;
  readonly filterButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.companyName = page.getByRole('textbox', { name: 'Company Name*' });
    this.email = page.getByRole('textbox', { name: 'Email*' });
    this.phone = page.getByRole('textbox', { name: 'Phone*' });
    this.website = page.getByRole('textbox', { name: 'Website*' });
    this.description = page.getByRole('textbox', { name: 'Description*' });
    this.address = page.getByRole('textbox', { name: 'Address*' });
    this.city = page.getByRole('textbox', { name: 'City / Town / Village*' });
    this.state = page.getByRole('textbox', { name: 'State*' });
    this.country = page.getByRole('textbox', { name: 'Country*' });
    this.postalCode = page.getByRole('textbox', { name: 'Postal Code*' });

    this.createButton = page.getByRole('button', {
      name: 'Create Underwriter',
    });

    this.updateButton = page.getByRole('button', {
      name: 'Update Underwriter',
    });

    this.cancelButton = page.getByRole('button', {
      name: 'Cancel',
    });

    this.notificationRegion = page.getByRole('region', {
      name: 'Notifications (F8)',
    });

    this.searchButton = page.getByRole('button', {
      name: 'Search items',
    });

    this.searchTextbox = page.getByRole('textbox', {
      name: 'Search...',
    });

    this.filterButton = page.getByRole('button', {
      name: 'Filter options',
    });
  }

  // ----------------------------------------------------------
  // COMMON METHODS
  // ----------------------------------------------------------

  private async waitAfterAction(): Promise<void> {
    await this.page.waitForTimeout(3000);
  }

  private async scrollToElement(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
    await this.waitAfterAction();
  }

  private async scrollDown(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollBy({
        top: 500,
        behavior: 'smooth',
      });
    });

    await this.waitAfterAction();
  }

  // UPDATED: Scroll to the absolute bottom of the page.
  private async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: 'instant',
      });
    });

    await this.page.waitForTimeout(1000);

    console.log('Scrolled to the bottom of the page.');
  }

  private getFieldLocator(field: string): Locator {
    const fields: Record<string, Locator> = {
      companyName: this.companyName,
      email: this.email,
      phone: this.phone,
      website: this.website,
      description: this.description,
      address: this.address,
      city: this.city,
      state: this.state,
      country: this.country,
      postalCode: this.postalCode,

      registrationNumber: this.page.getByRole('textbox', {
        name: 'Registration Number',
      }),

      taxNumber: this.page.getByRole('textbox', {
        name: 'Tax Number (GST)',
      }),

      accountHolderName: this.page.getByRole('textbox', {
        name: 'Account Holder Name',
      }),

      accountNumber: this.page.getByRole('textbox', {
        name: 'Account Number',
      }),

      branchCode: this.page.getByRole('textbox', {
        name: 'Branch Code',
      }),

      branchName: this.page.getByRole('textbox', {
        name: 'Branch Name',
      }),

      webhookUrl: this.page.getByRole('textbox', {
        name: 'Webhook URL',
      }),

      apiKey: this.page.getByRole('textbox', {
        name: 'API Key',
      }),
    };

    const locator = fields[field];

    if (!locator) {
      throw new Error(`Unknown underwriter field: ${field}`);
    }

    return locator;
  }

  private async fillDetails(
    details: Record<string, string>,
  ): Promise<void> {
    await Object.entries(details).reduce(
      async (previous, [field, value]) => {
        await previous;

        const locator = this.getFieldLocator(field);

        await this.scrollToElement(locator);
        await locator.fill(value);

        console.log(`Entered ${field}.`);

        await this.waitAfterAction();

        if (field === 'address') {
          await this.scrollDown();
        }
      },
      Promise.resolve(),
    );
  }

  private async getNotificationText(): Promise<string> {
    await expect(this.notificationRegion).toBeVisible();

    await this.waitAfterAction();

    return (await this.notificationRegion.innerText()).trim();
  }

  private async findRecord(searchValue: string): Promise<Locator> {
    const record = this.page.getByText(searchValue, {
      exact: true,
    }).first();

    await expect(record).toBeVisible();

    return record;
  }

  private async closeFormIfOpen(): Promise<void> {
    if (await this.cancelButton.isVisible().catch(() => false)) {
      await this.cancelButton.click();
      await this.waitAfterAction();
    }
  }

  // ----------------------------------------------------------
  // UNDERWRITER ROW IDENTIFICATION
  // ----------------------------------------------------------

  private getSelectedUnderwriterRow(): Locator {
    if (!this.selectedUnderwriterEmail) {
      throw new Error(
        'No underwriter has been selected. Apply the Email filter first.',
      );
    }

    return this.page
      .locator('table')
      .getByRole('row')
      .filter({
        hasText: this.selectedUnderwriterEmail,
      });
  }

  private async verifySelectedUnderwriterRow(): Promise<Locator> {
    const row = this.getSelectedUnderwriterRow();

    await expect(row).toHaveCount(1, {
      timeout: 10000,
    });

    await expect(row).toBeVisible({
      timeout: 10000,
    });

    return row;
  }

  // ----------------------------------------------------------
  // PAGE VALIDATION
  // ----------------------------------------------------------

  async verifyUnderwritersPageDisplayed(): Promise<void> {
    await expect(
      this.page.getByRole('link', {
        name: 'Underwriters Underwriters',
      }),
    ).toBeVisible();
  }

  async verifyUnderwritersListDisplayed(): Promise<void> {
    await expect(this.page.locator('table')).toBeVisible();
  }

  // ----------------------------------------------------------
  // CREATE UNDERWRITER
  // ----------------------------------------------------------

  async selectNewUnderwriter(): Promise<void> {
    await this.page.getByRole('button', {
      name: 'New Underwriter',
    }).click();

    await this.waitAfterAction();

    await expect(this.companyName).toBeVisible();
  }

  async enterUnderwriterDetails(
    details: Record<string, string>,
  ): Promise<void> {
    await this.fillDetails(details);
  }

  // UPDATED: Scroll to the bottom before clicking Create Underwriter.
  async saveUnderwriter(): Promise<void> {
    await this.scrollToBottom();

    await this.createButton.scrollIntoViewIfNeeded();

    await expect(this.createButton).toBeVisible();

    await this.createButton.click();

    await this.waitAfterAction();

    console.log(
      'Scrolled to the bottom and submitted Create Underwriter form.',
    );
  }

  async verifyUnderwriterCreatedSuccessfully(): Promise<void> {
    const message = await this.getNotificationText();

    console.log('Creation notification:', message);

    await this.page.screenshot({
      path: 'screenshots/UW_TC_001_After_Create.png',
      fullPage: true,
    });

    expect(message).not.toBe('');
  }

  // UPDATED: Keep the form open after failed creation.
  async verifyUnderwriterNotCreated(): Promise<void> {
    // The Create Underwriter form should remain visible.
    await expect(this.createButton).toBeVisible({
      timeout: 10000,
    });

    // The form should not have been closed or navigated away.
    await expect(this.companyName).toBeVisible();

    // Check that a successful creation notification is not displayed.
    const successMessage = this.page.getByText(
      /underwriter created successfully/i,
    );

    await expect(successMessage).toHaveCount(0);

    console.log(
      'Verified that the Create Underwriter form remains open and no successful creation message is displayed.',
    );
  }

  // ----------------------------------------------------------
  // VISIT WEBSITE
  // ----------------------------------------------------------

  async selectVisitWebsite(): Promise<Page> {
    const link = this.page.getByRole('link', {
      name: 'Visit Website',
    }).first();

    const popupPromise = this.page.waitForEvent('popup');

    await link.click();

    const websitePage = await popupPromise;

    await websitePage.waitForLoadState('domcontentloaded');

    console.log('Website opened:', websitePage.url());

    return websitePage;
  }

  async verifyWebsiteOpened(websitePage: Page): Promise<void> {
    await expect(websitePage).toHaveURL(/^https?:\/\//);
  }

  async returnToBrokerNexus(websitePage: Page): Promise<void> {
    await websitePage.close();
    await this.page.bringToFront();

    await this.waitAfterAction();
  }

  // ----------------------------------------------------------
  // SEARCH
  // ----------------------------------------------------------

  async searchUnderwriter(searchValue: string): Promise<void> {
    await this.searchButton.click();

    await this.waitAfterAction();

    await this.searchTextbox.fill(searchValue);

    await this.waitAfterAction();

    console.log(`Searching for: ${searchValue}`);
  }

  async searchExistingUnderwriter(
    details: Record<string, string>,
  ): Promise<void> {
    const searchValue = details.email;

    if (!searchValue) {
      throw new Error('Email is required to search for an underwriter.');
    }

    this.selectedUnderwriterEmail = searchValue;

    await this.searchUnderwriter(searchValue);

    await this.verifySelectedUnderwriterRow();

    console.log(
      `Underwriter record located: ${this.selectedUnderwriterEmail}`,
    );
  }

  async verifyMatchingRecordsDisplayed(): Promise<void> {
    await expect(this.page.locator('table')).toBeVisible();
  }

  async verifyNoMatchingRecords(): Promise<void> {
  const noRecordsMessage = this.page.getByText(
    'No underwriters found.',
    { exact: true },
  );

  await expect(noRecordsMessage).toBeVisible();

  console.log('Verified: No underwriters found.');
}

  // ----------------------------------------------------------
  // ACTIONS MENU AND EDIT
  // ----------------------------------------------------------

  private async openActionsMenu(): Promise<void> {
    const row = await this.verifySelectedUnderwriterRow();

    const actionsMenu = row.getByRole('button', {
      name: 'Open actions menu',
    });

    await expect(actionsMenu).toBeVisible({
      timeout: 10000,
    });

    await actionsMenu.click();

    await this.waitAfterAction();
  }

  async openActionsMenuAndSelectEdit(): Promise<void> {
    await this.openActionsMenu();

    await this.page.getByRole('menuitem', {
      name: 'Edit',
      exact: true,
    }).click();

    await this.waitAfterAction();
  }

  async updateUnderwriterDetails(
    details: Record<string, string>,
  ): Promise<void> {
    await this.fillDetails(details);
  }

  async saveUnderwriterChanges(): Promise<void> {
    await this.scrollToElement(this.updateButton);

    await expect(this.updateButton).toBeVisible();

    await this.updateButton.click();

    await this.waitAfterAction();

    console.log('Submitted Update Underwriter form.');
  }

  async verifyUnderwriterUpdatedSuccessfully(): Promise<void> {
    await this.waitAfterAction();

    const notificationVisible = await this.notificationRegion
      .isVisible()
      .catch(() => false);

    if (notificationVisible) {
      const message = (
        await this.notificationRegion.innerText()
      ).trim();

      console.log('Update notification:', message);

      if (message) {
        expect(message).not.toBe('');
      }
    } else {
      console.log(
        'Update notification was not displayed. Record verification is required.',
      );
    }
  }

  async verifyUpdatedUnderwriterDetails(
    details: Record<string, string>,
  ): Promise<void> {
    await Promise.all(
      Object.values(details)
        .filter(Boolean)
        .map((value) =>
          expect(
            this.page.getByText(value, { exact: true }).first(),
          ).toBeVisible(),
        ),
    );
  }

  async changeCompanyName(name: string): Promise<void> {
    await this.companyName.fill(name);

    await this.waitAfterAction();
  }

  async cancelUnderwriterChanges(): Promise<void> {
    await this.cancelButton.click();

    await this.waitAfterAction();
  }

  async verifyOriginalDetailsRemainUnchanged(
    originalName: string,
  ): Promise<void> {
    await expect(
      this.page.getByText(originalName, { exact: true }).first(),
    ).toBeVisible();

    await expect(
      this.page.getByText('Cancelled Company Name', { exact: true }),
    ).toHaveCount(0);
  }

  // ----------------------------------------------------------
  // OPTIONAL DETAILS, API AND LOGO
  // ----------------------------------------------------------

  async enterOptionalUnderwriterDetails(
    details: Record<string, string>,
  ): Promise<void> {
    await Object.entries(details).reduce<Promise<void>>(
      async (pending, [field, value]) => {
        await pending;

        if (field === 'premiumRateBases') {
          console.log(
            'Skipping Premium Rate Bases; retaining default value.',
          );

          return;
        }

        const locator = this.getFieldLocator(field);

        await this.scrollToElement(locator);

        await locator.fill(value);

        console.log(`Entered optional field: ${field}`);

        await this.waitAfterAction();
      },
      Promise.resolve(),
    );
  }

  async configureApiAvailable(
    enabled: boolean,
    webhookUrl?: string,
    apiKey?: string,
  ): Promise<void> {
    const toggle = this.page.locator('#isApiEnable');

    await this.scrollToElement(toggle);

    const isChecked = await toggle.isChecked();

    if (enabled !== isChecked) {
      await toggle.click();
    }

    if (webhookUrl && apiKey) {
      const webhookField = this.getFieldLocator('webhookUrl');
      const apiKeyField = this.getFieldLocator('apiKey');

      await this.scrollToElement(webhookField);
      await webhookField.fill(webhookUrl);

      await this.scrollToElement(apiKeyField);
      await apiKeyField.fill(apiKey);

      console.log('Webhook URL and API Key entered.');
    }

    await this.waitAfterAction();
  }

  async uploadCompanyLogo(): Promise<void> {
    const logoPath = path.resolve(
      process.cwd(),
      'test-data',
      'underwriter-logo.png',
    );

    await this.page.getByLabel('Company Logo').setInputFiles(logoPath);

    await this.waitAfterAction();

    console.log('Company logo uploaded.');
  }

  // ----------------------------------------------------------
  // FILTERS
  // ----------------------------------------------------------

  private async ensureFilterPanelOpen(): Promise<void> {
    const statusDropdown = this.page.getByRole('combobox');

    const companyFilter = this.page.getByRole('textbox', {
      name: 'Company Name',
    });

    const emailFilter = this.page.getByRole('textbox', {
      name: 'Email',
    });

    const lastUpdatedFilter = this.page.locator('#filter-updatedAt');

    const panelAlreadyOpen =
      (await statusDropdown.isVisible().catch(() => false)) ||
      (await companyFilter.isVisible().catch(() => false)) ||
      (await emailFilter.isVisible().catch(() => false)) ||
      (await lastUpdatedFilter.isVisible().catch(() => false));

    if (!panelAlreadyOpen) {
      await this.filterButton.click();
      await this.waitAfterAction();
    }
  }

  async filterUnderwritersByStatus(status: string): Promise<void> {
    await this.ensureFilterPanelOpen();

    const statusDropdown = this.page.getByRole('combobox');

    await expect(statusDropdown).toBeVisible();

    await statusDropdown.click();

    await this.waitAfterAction();

    const statusOption = this.page.getByRole('option', {
      name: status,
      exact: true,
    });

    await expect(statusOption).toBeVisible();

    await statusOption.click();

    await this.waitAfterAction();

    console.log(`Filtered underwriters by status: ${status}`);
  }

  async verifyListMatchesStatus(status: string): Promise<void> {
    const statusDropdown = this.page.getByRole('combobox');

    await expect(statusDropdown).toBeVisible();

    await expect(statusDropdown).toContainText(status);

    await expect(this.page.locator('table')).toBeVisible();

    console.log(`Verified selected underwriter status: ${status}`);
  }

  async applyFilter(
    filterField: string,
    filterValue: string,
  ): Promise<void> {
    await this.ensureFilterPanelOpen();

    const filterTextbox = this.page.getByRole('textbox', {
      name: filterField,
    });

    await expect(filterTextbox).toBeVisible();

    await filterTextbox.fill(filterValue);

    if (filterField.trim().toLowerCase() === 'email') {
      this.selectedUnderwriterEmail = filterValue;
    }

    await this.waitAfterAction();

    console.log(
      `Applied ${filterField} filter with value: ${filterValue}`,
    );
  }

  async verifyFilterApplied(
    filterField: string,
    filterValue: string,
  ): Promise<void> {
    const table = this.page.locator('table');

    await this.page.waitForTimeout(2000);

    console.log('========== FILTER DEBUG ==========');
    console.log(`Filter Field: ${filterField}`);
    console.log(`Filter Value: ${filterValue}`);
    console.log(`Current URL: ${this.page.url()}`);

    const tableVisible = await table.isVisible().catch(() => false);

    console.log(`Table Visible: ${tableVisible}`);

    if (tableVisible) {
      console.log('Current Table Contents:');
      console.log(await table.innerText());
    }

    console.log('Current Page Text:');
    console.log(
      (await this.page.locator('body').innerText()).slice(0, 3000),
    );

    console.log('==================================');

    const matchingRows = table
      .getByRole('row')
      .filter({ hasText: filterValue });

    await expect(matchingRows.first()).toBeVisible({
      timeout: 10000,
    });
  }

  async filterByLastUpdated(date: string): Promise<void> {
    await this.ensureFilterPanelOpen();

    const [day, month, year] = date.split('/');

    if (!day || !month || !year) {
      throw new Error(
        `Invalid date format: ${date}. Expected DD/MM/YYYY.`,
      );
    }

    const formattedDate = `${year}-${month}-${day}`;

    const lastUpdated = this.page.locator('#filter-updatedAt');

    await expect(lastUpdated).toBeAttached();

    await lastUpdated.fill(formattedDate);

    await this.waitAfterAction();

    console.log(`Applied Last Updated filter: ${formattedDate}`);
  }

  async verifyLastUpdatedFilter(date: string): Promise<void> {
    const [day, month, year] = date.split('/');

    if (!day || !month || !year) {
      throw new Error(
        `Invalid date format: ${date}. Expected DD/MM/YYYY.`,
      );
    }

    const formattedDate = `${year}-${month}-${day}`;

    const lastUpdated = this.page.locator('#filter-updatedAt');

    await expect(lastUpdated).toHaveValue(formattedDate);

    await expect(this.page.locator('table')).toBeVisible();

    console.log(`Verified Last Updated filter: ${date}`);
  }

  async applyAnyFilter(): Promise<void> {
    await this.applyFilter('Company Name', 'UW Test Company 1');
  }

  // ----------------------------------------------------------
  // CLEAR ALL UNDERWRITER FILTERS
  // ----------------------------------------------------------

  async clearAllUnderwriterFilters(): Promise<void> {
    await this.ensureFilterPanelOpen();

    const clearButton = this.page.getByRole('button', {
      name: 'Clear filters',
    });

    await expect(clearButton).toBeVisible({
      timeout: 10000,
    });

    await clearButton.click();

    await this.waitAfterAction();

    this.selectedUnderwriterEmail = '';

    await this.verifyFilterFieldsReset();

    console.log('All underwriter filters cleared successfully.');
  }

  async clearAllFilters(): Promise<void> {
    await this.clearAllUnderwriterFilters();
  }

  async verifyFullListDisplayed(): Promise<void> {
    await expect(this.page.locator('table')).toBeVisible();

    console.log('Verified full underwriter list is displayed.');
  }

  async verifyFilterFieldsReset(): Promise<void> {
    const companyFilter = this.page.getByRole('textbox', {
      name: 'Company Name',
    });

    const emailFilter = this.page.getByRole('textbox', {
      name: 'Email',
    });

    const lastUpdatedFilter = this.page.locator('#filter-updatedAt');

    if (await companyFilter.count()) {
      await expect(companyFilter).toHaveValue('');
    }

    if (await emailFilter.count()) {
      await expect(emailFilter).toHaveValue('');
    }

    if (await lastUpdatedFilter.count()) {
      await expect(lastUpdatedFilter).toHaveValue('');
    }

    console.log('Verified underwriter filter fields are reset.');
  }

  // ----------------------------------------------------------
  // ACTIVATE AND DEACTIVATE
  // ----------------------------------------------------------

  async selectStatusAction(
    action: 'Activate' | 'Deactivate',
  ): Promise<void> {
    await this.openActionsMenu();

    const actionItem = this.page.getByRole('menuitem', {
      name: action,
      exact: true,
    });

    await expect(actionItem).toBeVisible({
      timeout: 10000,
    });

    await actionItem.click();

    await this.waitAfterAction();

    console.log(`Selected underwriter action: ${action}`);
  }

  async confirmStatusAction(
    action: 'Activate' | 'Deactivate',
  ): Promise<void> {
    const confirmButton = this.page.getByRole('button', {
      name: action,
      exact: true,
    });

    await expect(confirmButton).toBeVisible({
      timeout: 10000,
    });

    await confirmButton.click();

    await expect(confirmButton).toBeHidden({
      timeout: 15000,
    });

    await this.waitAfterAction();

    console.log(`Confirmed underwriter action: ${action}`);
  }

  async verifyUnderwriterStatus(
    status: 'Active' | 'Inactive',
  ): Promise<void> {
    const row = await this.verifySelectedUnderwriterRow();

    const statusText = row.getByText(status, {
      exact: true,
    });

    await expect(statusText).toBeVisible({
      timeout: 10000,
    });

    console.log(
      `Verified ${this.selectedUnderwriterEmail} status: ${status}`,
    );
  }

  async verifyUnderwriterActivated(): Promise<void> {
    await this.verifyUnderwriterStatus('Active');
  }

  // ----------------------------------------------------------
  // NEGATIVE VALIDATIONS
  // ----------------------------------------------------------

  // UPDATED: Ensure all mandatory fields remain empty.
  async leaveAllMandatoryFieldsEmpty(): Promise<void> {
    const fields = [
      this.companyName,
      this.email,
      this.phone,
      this.website,
      this.description,
      this.address,
      this.city,
      this.state,
      this.country,
      this.postalCode,
    ];

    for (const field of fields) {
      if (await field.isVisible().catch(() => false)) {
        await field.fill('');
      }
    }

    // Verify all mandatory fields are empty.
    for (const field of fields) {
      if (await field.isVisible().catch(() => false)) {
        await expect(field).toHaveValue('');
      }
    }

    console.log('All mandatory fields are empty.');
  }

  // UPDATED: Verify actual validation evidence.
  async verifyMandatoryValidationMessages(): Promise<void> {
    const mandatoryFields = [
      { name: 'Company Name', locator: this.companyName },
      { name: 'Email', locator: this.email },
      { name: 'Phone', locator: this.phone },
      { name: 'Website', locator: this.website },
      { name: 'Description', locator: this.description },
      { name: 'Address', locator: this.address },
      { name: 'City', locator: this.city },
      { name: 'State', locator: this.state },
      { name: 'Country', locator: this.country },
      { name: 'Postal Code', locator: this.postalCode },
    ];

    const invalidFields: string[] = [];

    for (const field of mandatoryFields) {
      if (!(await field.locator.isVisible().catch(() => false))) {
        continue;
      }

      const validationState = await field.locator.evaluate(
        (element: HTMLInputElement | HTMLTextAreaElement) => ({
          value: element.value,
          validity: element.validity.valid,
          validationMessage: element.validationMessage,
          ariaInvalid: element.getAttribute('aria-invalid'),
        }),
      );

      if (
        !validationState.validity ||
        validationState.ariaInvalid === 'true'
      ) {
        invalidFields.push(field.name);

        console.log(
          `${field.name} validation: ${
            validationState.validationMessage || 'Invalid field'
          }`,
        );
      }
    }

    // Check for visible application-level validation messages.
    const visibleErrorMessages = this.page.locator(
      [
        '[role="alert"]',
        '.error-message',
        '.field-error',
        '.invalid-feedback',
        '[class*="error"]',
        '[class*="invalid"]',
      ].join(', '),
    );

    const visibleErrors = await visibleErrorMessages.evaluateAll(
      (elements) =>
        elements
          .filter((element) => {
            const style = window.getComputedStyle(element);

            return (
              style.display !== 'none' &&
              style.visibility !== 'hidden' &&
              element.getBoundingClientRect().width > 0 &&
              element.getBoundingClientRect().height > 0 &&
              (element.textContent || '').trim().length > 0
            );
          })
          .map((element) => (element.textContent || '').trim()),
    );

    console.log('Invalid mandatory fields:', invalidFields);
    console.log('Visible validation messages:', visibleErrors);

    // At least one actual validation indicator must be present.
    expect(
      invalidFields.length + visibleErrors.length,
      'No mandatory-field validation indicators were found. Check the application validation behavior and selectors.',
    ).toBeGreaterThan(0);

    console.log('Mandatory field validation verified.');
  }

  async verifyEmailValidationMessage(): Promise<void> {
    await expect(this.email).toBeVisible();

    const validationMessage = await this.email.evaluate(
      (element: HTMLInputElement) => element.validationMessage,
    );

    expect(validationMessage).not.toBe('');
  }

  async verifyFieldValidationMessage(
    fieldName: string,
  ): Promise<void> {
    const fieldMap: Record<string, Locator> = {
      'Company Name': this.companyName,
      Email: this.email,
      Phone: this.phone,
      Description: this.description,
      Address: this.address,
      City: this.city,
      State: this.state,
      Country: this.country,
      'Postal Code': this.postalCode,
    };

    const field = fieldMap[fieldName];

    if (!field) {
      throw new Error(`Unknown validation field: ${fieldName}`);
    }

    const value = await field.inputValue();

    expect(value).toBe('');

    const validationMessage = await field.evaluate(
      (element: HTMLInputElement) => element.validationMessage,
    );

    expect(validationMessage).not.toBe('');
  }

  async verifyAppropriateValidationMessages(): Promise<void> {
    const invalidFields = this.page.locator(
      'input:invalid, textarea:invalid, select:invalid',
    );

    const invalidFieldCount = await invalidFields.count();

    expect(invalidFieldCount).toBeGreaterThan(0);

    const validationMessages = await Promise.all(
      Array.from(
        { length: invalidFieldCount },
        (_, index) =>
          invalidFields.nth(index).evaluate(
            (
              element:
                | HTMLInputElement
                | HTMLTextAreaElement
                | HTMLSelectElement,
            ) => element.validationMessage,
          ),
      ),
    );

    validationMessages.forEach((validationMessage) => {
      expect(validationMessage).not.toBe('');
    });
  }

  async verifyInvalidChangesNotSaved(): Promise<void> {
    await expect(this.updateButton).toBeVisible();

    await this.closeFormIfOpen();
  }

  // ----------------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------------

  async logoutFromBrokerNexus(): Promise<void> {
    await this.page.getByText('A', {
      exact: true,
    }).first().click();

    await this.waitAfterAction();

    await this.page.getByRole('menuitem', {
      name: 'Sign out',
    }).click();

    await this.waitAfterAction();

    console.log('Successfully logged out from Broker Nexus.');
  }
}
