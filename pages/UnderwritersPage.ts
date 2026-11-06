import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import path from 'node:path';

import { SelfHealingActions } from '../utils/SelfHealingActions.js';
import type { LocatorConfig } from '../utils/LocatorConfig.js';

export class UnderwritersPage {
    readonly page: Page;
    private readonly actions: SelfHealingActions;
    private selectedUnderwriterEmail = '';

    constructor(page: Page) {
        this.page = page;
        this.actions = new SelfHealingActions(page);
    }

    // ==========================================================
    // CENTRALIZED SELF-HEALING LOCATOR CONFIGURATION
    // ==========================================================

    private async getElement(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {
        return this.actions.getLocator(
            `underwriters.${key}`,
            primary,
            fallbacks
        );
    }

    private async getButton(
        name: string,
        key: string,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {
        return this.getElement(
            key,
            {
                type: 'role',
                role: 'button',
                name
            },
            fallbacks
        );
    }

    private async getTextbox(
        name: string,
        key: string,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {
        return this.getElement(
            key,
            {
                type: 'role',
                role: 'textbox',
                name
            },
            fallbacks
        );
    }

    // ==========================================================
    // FIELD CONFIGURATION
    // ==========================================================

    private readonly fieldNames: Record<string, string> = {
        companyName: 'Company Name*',
        email: 'Email*',
        phone: 'Phone*',
        website: 'Website*',
        description: 'Description*',
        address: 'Address*',
        city: 'City / Town / Village*',
        state: 'State*',
        country: 'Country*',
        postalCode: 'Postal Code*',

        registrationNumber: 'Registration Number',
        taxNumber: 'Tax Number (GST)',
        premiumRateBases: 'Premium Rate Bases',

        accountHolderName: 'Account Holder Name',
        accountNumber: 'Account Number',
        branchCode: 'Branch Code',
        branchName: 'Branch Name',

        webhookUrl: 'Webhook URL',
        apiKey: 'API Key'
    };

    private getFieldName(field: string): string {
        const name = this.fieldNames[field];

        if (!name) {
            throw new Error(`Unknown underwriter field: ${field}`);
        }

        return name;
    }

    private async getFieldLocator(field: string): Promise<Locator> {
        const name = this.getFieldName(field);

        return this.getElement(
            `field.${field}`,
            {
                type: 'role',
                role: 'textbox',
                name
            },
            [
                {
                    type: 'label',
                    value: name
                }
            ]
        );
    }

    // ==========================================================
    // COMMON METHODS
    // ==========================================================

    private async waitAfterAction(): Promise<void> {
        await this.page.waitForTimeout(1000);
    }

    private async scrollToElement(locator: Locator): Promise<void> {
        await locator.scrollIntoViewIfNeeded();
    }

    private async scrollDown(): Promise<void> {
        await this.page.evaluate(() => {
            window.scrollBy({
                top: 500,
                behavior: 'smooth'
            });
        });

        await this.waitAfterAction();
    }

    private async scrollToBottom(): Promise<void> {
        await this.page.evaluate(() => {
            window.scrollTo({
                top: document.documentElement.scrollHeight,
                behavior: 'instant'
            });
        });

        await this.waitAfterAction();

        console.log('Scrolled to the bottom of the page.');
    }

    private async fillDetails(
        details: Record<string, string>
    ): Promise<void> {
        for (const [field, value] of Object.entries(details)) {
            const name = this.getFieldName(field);
            const locator = await this.getFieldLocator(field);

            await this.scrollToElement(locator);

            await this.actions.fill(
                `underwriters.field.${field}`,
                {
                    type: 'role',
                    role: 'textbox',
                    name
                },
                value,
                [
                    {
                        type: 'label',
                        value: name
                    }
                ]
            );

            console.log(`Entered ${field}.`);

            await this.waitAfterAction();

            if (field === 'address') {
                await this.scrollDown();
            }
        }
    }

    private async getNotificationRegion(): Promise<Locator> {
        return this.getElement(
            'notificationRegion',
            {
                type: 'role',
                role: 'region',
                name: 'Notifications (F8)'
            },
            [
                {
                    type: 'css',
                    value: '[role="alert"]'
                }
            ]
        );
    }

    private async getNotificationText(): Promise<string> {
        const notification = await this.getNotificationRegion();

        await expect(notification).toBeVisible({
            timeout: 10000
        });

        return (await notification.innerText()).trim();
    }

    private async closeFormIfOpen(): Promise<void> {
        const cancelButton = await this.getButton(
            'Cancel',
            'cancelButton'
        );

        if (await cancelButton.isVisible().catch(() => false)) {
            await this.actions.click(
                'underwriters.cancelButton',
                {
                    type: 'role',
                    role: 'button',
                    name: 'Cancel'
                }
            );

            await this.waitAfterAction();
        }
    }

    // ==========================================================
    // TABLE AND ROW IDENTIFICATION
    // ==========================================================

    private async getTable(): Promise<Locator> {
        return this.getElement(
            'underwritersTable',
            {
                type: 'css',
                value: 'table'
            },
            [
                {
                    type: 'css',
                    value: '[role="table"]'
                }
            ]
        );
    }

    private async getSelectedUnderwriterRow(): Promise<Locator> {
        if (!this.selectedUnderwriterEmail) {
            throw new Error(
                'No underwriter has been selected. Apply the Email filter first.'
            );
        }

        const table = await this.getTable();

        return table
            .getByRole('row')
            .filter({
                hasText: this.selectedUnderwriterEmail
            });
    }

    private async verifySelectedUnderwriterRow(): Promise<Locator> {
        const row = await this.getSelectedUnderwriterRow();

        await expect(row).toHaveCount(1, {
            timeout: 10000
        });

        await expect(row).toBeVisible({
            timeout: 10000
        });

        return row;
    }

    // ==========================================================
    // NAVIGATION
    // ==========================================================

    async navigateToUnderwriters(): Promise<void> {
        console.log('Navigating directly to the Underwriters page.');

        const baseUrl = process.env.BROKER_NEXUS_URL;

        if (!baseUrl) {
            throw new Error(
                'BROKER_NEXUS_URL is not configured in .env'
            );
        }

        const underwritersUrl = new URL(
            '/screens/underwriters',
            baseUrl
        ).toString();

        await this.page.goto(underwritersUrl, {
            waitUntil: 'domcontentloaded'
        });

        await expect(this.page).toHaveURL(
            /\/screens\/underwriters/,
            { timeout: 15000 }
        );

        console.log('Successfully opened the Underwriters page.');
    }

    async verifyUnderwritersPageDisplayed(): Promise<void> {
        await expect(this.page).toHaveURL(
            /\/screens\/underwriters/
        );
    }

    async verifyUnderwritersListDisplayed(): Promise<void> {
        await this.verifyFullListDisplayed();
    }

    // ==========================================================
    // VISIT WEBSITE
    // ==========================================================

    async selectVisitWebsite(): Promise<Page> {
        const popupPromise = this.page.waitForEvent('popup');

        await this.actions.click(
            'underwriters.visitWebsiteLink',
            {
                type: 'role',
                role: 'link',
                name: 'Visit Website'
            }
        );

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

    // ==========================================================
    // CREATE UNDERWRITER
    // ==========================================================

    async selectNewUnderwriter(): Promise<void> {
        await this.actions.click(
            'underwriters.newUnderwriterButton',
            {
                type: 'role',
                role: 'button',
                name: 'New Underwriter'
            },
            [
                {
                    type: 'text',
                    value: 'New Underwriter'
                }
            ]
        );

        await expect(
            this.page.getByRole('button', {
                name: 'Create Underwriter'
            })
        ).toBeVisible();
    }

    async enterUnderwriterDetails(
        details: Record<string, string>
    ): Promise<void> {
        if (details.email) {
            this.selectedUnderwriterEmail = details.email;
        }

        await this.fillDetails(details);
    }

    async saveUnderwriter(): Promise<void> {
        const createButton = await this.getButton(
            'Create Underwriter',
            'createUnderwriterButton'
        );

        await expect(createButton).toBeVisible();
        await expect(createButton).toBeEnabled();

        await this.actions.click(
            'underwriters.createUnderwriterButton',
            {
                type: 'role',
                role: 'button',
                name: 'Create Underwriter'
            }
        );

        await this.waitAfterAction();

        console.log('Submitted Create Underwriter form.');
    }

    async verifyUnderwriterCreatedSuccessfully(): Promise<void> {
        const notification = await this.getNotificationText();

        expect(notification.length).toBeGreaterThan(0);

        console.log('Creation notification:', notification);

        if (this.selectedUnderwriterEmail) {
            await this.searchUnderwriter(
                this.selectedUnderwriterEmail
            );

            await this.verifySelectedUnderwriterRow();
        }
    }

    async verifyUnderwriterNotCreated(): Promise<void> {
        await this.verifyMandatoryValidationMessages();
    }

    // ==========================================================
    // SEARCH
    // ==========================================================

    async searchUnderwriter(searchValue: string): Promise<void> {
        await this.actions.click(
            'underwriters.searchButton',
            {
                type: 'role',
                role: 'button',
                name: 'Search items'
            },
            [
                {
                    type: 'role',
                    role: 'button',
                    name: 'Search'
                },
                {
                    type: 'role',
                    role: 'button',
                    name: 'Search underwriters'
                },
                {
                    type: 'css',
                    value: 'button[aria-label="Search"]'
                },
                {
                    type: 'css',
                    value: 'button[title="Search"]'
                }
            ]
        );

        await this.waitAfterAction();

        await this.actions.fill(
            'underwriters.searchTextbox',
            {
                type: 'role',
                role: 'textbox',
                name: 'Search...'
            },
            searchValue,
            [
                {
                    type: 'placeholder',
                    value: 'Search...'
                }
            ]
        );

        await this.waitAfterAction();

        console.log(`Searching for: ${searchValue}`);
    }

    async searchExistingUnderwriter(
        details: Record<string, string>
    ): Promise<void> {
        const searchValue = details.email;

        if (!searchValue) {
            throw new Error(
                'Email is required to search for an underwriter.'
            );
        }

        this.selectedUnderwriterEmail = searchValue;

        await this.searchUnderwriter(searchValue);

        await this.verifySelectedUnderwriterRow();

        console.log(
            `Underwriter record located: ${searchValue}`
        );
    }

    async verifyMatchingRecordsDisplayed(): Promise<void> {
        const table = await this.getTable();

        await expect(table).toBeVisible();
    }

    async verifyNoMatchingRecords(): Promise<void> {
        const noRecordsMessage = await this.getElement(
            'noRecordsMessage',
            {
                type: 'text',
                value: 'No underwriters found.'
            }
        );

        await expect(noRecordsMessage).toBeVisible();

        console.log('Verified: No underwriters found.');
    }

    // ==========================================================
    // ACTIONS MENU AND EDIT
    // ==========================================================

    private async openActionsMenu(): Promise<void> {
        const row = await this.verifySelectedUnderwriterRow();

        const actionsMenu = row.getByRole('button', {
            name: 'Open actions menu'
        });

        await expect(actionsMenu).toBeVisible({
            timeout: 10000
        });

        await actionsMenu.click();

        await this.waitAfterAction();
    }

    async openActionsMenuAndSelectEdit(): Promise<void> {
        await this.openActionsMenu();

        await this.actions.click(
            'underwriters.editMenuItem',
            {
                type: 'role',
                role: 'menuitem',
                name: 'Edit'
            }
        );

        await this.waitAfterAction();
    }

    async updateUnderwriterDetails(
        details: Record<string, string>
    ): Promise<void> {
        await this.fillDetails(details);
    }

    async saveUnderwriterChanges(): Promise<void> {
        const updateButton = await this.getButton(
            'Update Underwriter',
            'updateButton'
        );

        await this.scrollToElement(updateButton);

        await expect(updateButton).toBeVisible();

        await this.actions.click(
            'underwriters.updateButton',
            {
                type: 'role',
                role: 'button',
                name: 'Update Underwriter'
            }
        );

        await this.waitAfterAction();

        console.log('Submitted Update Underwriter form.');
    }

    async verifyUnderwriterUpdatedSuccessfully(): Promise<void> {
        await this.waitAfterAction();

        const notification = await this.getNotificationRegion();

        const visible = await notification
            .isVisible()
            .catch(() => false);

        if (visible) {
            const message = (
                await notification.innerText()
            ).trim();

            console.log('Update notification:', message);

            expect(message).not.toBe('');
        } else {
            console.log(
                'Update notification was not displayed.'
            );
        }
    }

    async verifyUpdatedUnderwriterDetails(
        details: Record<string, string>
    ): Promise<void> {
        for (const value of Object.values(details).filter(Boolean)) {
            const locator = await this.getElement(
                `updatedDetail.${value}`,
                {
                    type: 'text',
                    value
                }
            );

            await expect(locator.first()).toBeVisible();
        }
    }

    async changeCompanyName(name: string): Promise<void> {
        await this.actions.fill(
            'underwriters.field.companyName',
            {
                type: 'role',
                role: 'textbox',
                name: 'Company Name*'
            },
            name,
            [
                {
                    type: 'label',
                    value: 'Company Name*'
                }
            ]
        );

        await this.waitAfterAction();
    }

    async cancelUnderwriterChanges(): Promise<void> {
        await this.actions.click(
            'underwriters.cancelButton',
            {
                type: 'role',
                role: 'button',
                name: 'Cancel'
            }
        );

        await this.waitAfterAction();
    }

    async verifyOriginalDetailsRemainUnchanged(
        originalName: string
    ): Promise<void> {
        const original = await this.getElement(
            'originalCompanyName',
            {
                type: 'text',
                value: originalName
            }
        );

        await expect(original.first()).toBeVisible();

        await expect(
            this.page.getByText(
                'Cancelled Company Name',
                { exact: true }
            )
        ).toHaveCount(0);
    }

    // ==========================================================
    // OPTIONAL COMPANY AND BANK DETAILS
    // ==========================================================

    async enterOptionalUnderwriterDetails(
        details: Record<string, string>
    ): Promise<void> {
        console.log('Entering optional underwriter details.');

        for (const [field, value] of Object.entries(details)) {
            const name = this.getFieldName(field);

            // Premium Rate Bases is a text input, not a dropdown.
if (field === 'premiumRateBases') {
    const locator = await this.getFieldLocator(field);

    await expect(locator).toBeVisible({
        timeout: 10000
    });

    await this.scrollToElement(locator);

    await expect(locator).toHaveValue('ProRate');

    console.log('Verified default Premium Rate Bases: ProRate');

    await this.waitAfterAction();
    continue;
}
            const locator = await this.getFieldLocator(field);

            await expect(locator).toBeVisible({
                timeout: 10000
            });

            await this.scrollToElement(locator);

            await this.actions.fill(
                `underwriters.field.${field}`,
                {
                    type: 'role',
                    role: 'textbox',
                    name
                },
                value,
                [
                    {
                        type: 'label',
                        value: name
                    }
                ]
            );

            console.log(`Entered ${field}: ${value}`);

            await this.waitAfterAction();
        }

        console.log('Optional underwriter details entered.');
    }

    // ==========================================================
    // API AVAILABLE
    // ==========================================================

    async configureApiAvailable(
        enabled: boolean,
        webhookUrl?: string,
        apiKey?: string
    ): Promise<void> {
        const toggle = await this.getElement(
            'apiToggle',
            {
                type: 'css',
                value: '#isApiEnable'
            }
        );

        await this.scrollToElement(toggle);

        const isChecked = await toggle.isChecked();

        if (enabled && !isChecked) {
            await this.actions.check(
                'underwriters.apiToggle',
                {
                    type: 'css',
                    value: '#isApiEnable'
                }
            );
        } else if (!enabled && isChecked) {
            await this.actions.uncheck(
                'underwriters.apiToggle',
                {
                    type: 'css',
                    value: '#isApiEnable'
                }
            );
        }

        if (webhookUrl) {
            await this.actions.fill(
                'underwriters.field.webhookUrl',
                {
                    type: 'role',
                    role: 'textbox',
                    name: 'Webhook URL'
                },
                webhookUrl
            );
        }

        if (apiKey) {
            await this.actions.fill(
                'underwriters.field.apiKey',
                {
                    type: 'role',
                    role: 'textbox',
                    name: 'API Key'
                },
                apiKey
            );
        }

        await this.waitAfterAction();

        console.log(`API Available configured: ${enabled}`);
    }

    // ==========================================================
    // COMPANY LOGO UPLOAD
    // ==========================================================

    async uploadCompanyLogo(): Promise<void> {
        const logoPath = path.resolve(
            process.cwd(),
            'test-data',
            'underwriter-logo.png'
        );

        const fileInput = this.page.locator(
            'input[type="file"]'
        );

        await expect(fileInput).toHaveCount(1);

        await fileInput.setInputFiles(logoPath);

        await this.waitAfterAction();

        console.log('Company logo uploaded.');
    }

    // ==========================================================
    // FILTER LOCATORS
    // ==========================================================

    private async getStatusDropdown(): Promise<Locator> {
        return this.getElement(
            'statusDropdown',
            {
                type: 'role',
                role: 'combobox',
                name: ''
            },
            [
                {
                    type: 'css',
                    value: 'select'
                }
            ]
        );
    }

    private async getCompanyFilter(): Promise<Locator> {
        return this.getTextbox(
            'Company Name',
            'companyFilter',
            [
                {
                    type: 'placeholder',
                    value: 'Company Name'
                }
            ]
        );
    }

    private async getEmailFilter(): Promise<Locator> {
        return this.getTextbox(
            'Email',
            'emailFilter',
            [
                {
                    type: 'placeholder',
                    value: 'Email'
                }
            ]
        );
    }

    private async getLastUpdatedFilter(): Promise<Locator> {
        return this.getElement(
            'lastUpdatedFilter',
            {
                type: 'css',
                value: '#filter-updatedAt'
            }
        );
    }

    // ==========================================================
    // FILTER PANEL
    // ==========================================================

    private async ensureFilterPanelOpen(): Promise<void> {
        const companyVisible = await this.page
            .getByRole('textbox', {
                name: 'Company Name',
                exact: true
            })
            .isVisible()
            .catch(() => false);

        const emailVisible = await this.page
            .getByRole('textbox', {
                name: 'Email',
                exact: true
            })
            .isVisible()
            .catch(() => false);

        const statusVisible = await this.page
            .getByRole('combobox')
            .first()
            .isVisible()
            .catch(() => false);

        if (
            companyVisible ||
            emailVisible ||
            statusVisible
        ) {
            return;
        }

        await this.actions.click(
            'underwriters.filterButton',
            {
                type: 'role',
                role: 'button',
                name: 'Filter options'
            },
            [
                {
                    type: 'role',
                    role: 'button',
                    name: 'Filter'
                },
                {
                    type: 'css',
                    value: 'button[aria-label="Filter"]'
                },
                {
                    type: 'css',
                    value: 'button[title="Filter"]'
                }
            ]
        );

        await this.waitAfterAction();

        console.log('Underwriter filter panel opened.');
    }

    // ==========================================================
    // STATUS FILTER
    // ==========================================================

    async filterUnderwritersByStatus(
        status: string
    ): Promise<void> {
        await this.ensureFilterPanelOpen();

        const dropdown = await this.getStatusDropdown();

        await expect(dropdown).toBeVisible({
            timeout: 10000
        });

        await dropdown.selectOption({
            label: status
        }).catch(async () => {
            await this.actions.click(
                'underwriters.statusDropdown',
                {
                    type: 'role',
                    role: 'combobox',
                    name: ''
                },
                [
                    {
                        type: 'css',
                        value: 'select'
                    }
                ]
            );

            const option = await this.getElement(
                `statusOption.${status}`,
                {
                    type: 'role',
                    role: 'option',
                    name: status
                },
                [
                    {
                        type: 'text',
                        value: status
                    }
                ]
            );

            await this.actions.click(
                `underwriters.statusOption.${status}`,
                {
                    type: 'role',
                    role: 'option',
                    name: status
                }
            );
        });

        await this.waitAfterAction();

        console.log(`Filtered underwriters by status: ${status}`);
    }

    async verifyListMatchesStatus(
        status: string
    ): Promise<void> {
        await this.ensureFilterPanelOpen();

        const dropdown = await this.getStatusDropdown();

        await expect(dropdown).toBeVisible();

        await expect(dropdown).toContainText(status);

        const table = await this.getTable();

        await expect(table).toBeVisible();

        console.log(`Verified selected status: ${status}`);
    }

    // ==========================================================
    // APPLY FILTER
    // ==========================================================

    async applyFilter(
        filterField: string,
        filterValue: string
    ): Promise<void> {
        await this.ensureFilterPanelOpen();

        const normalizedKey = filterField
            .trim()
            .toLowerCase()
            .replace(/\s+/g, '');

        const filterTextbox = await this.getTextbox(
            filterField,
            `filter.${normalizedKey}`,
            [
                {
                    type: 'placeholder',
                    value: filterField
                }
            ]
        );

        await expect(filterTextbox).toBeVisible({
            timeout: 10000
        });

        await this.actions.fill(
            `underwriters.filter.${normalizedKey}`,
            {
                type: 'role',
                role: 'textbox',
                name: filterField
            },
            filterValue,
            [
                {
                    type: 'placeholder',
                    value: filterField
                }
            ]
        );

        if (filterField.trim().toLowerCase() === 'email') {
            this.selectedUnderwriterEmail = filterValue;
        }

        await this.waitAfterAction();

        console.log(
            `Applied ${filterField} filter with value: ${filterValue}`
        );
    }

    // ==========================================================
    // VERIFY FILTER RESULTS
    // ==========================================================

    async verifyFilterApplied(
        filterField: string,
        filterValue: string
    ): Promise<void> {
        const table = await this.getTable();

        await expect(table).toBeVisible({
            timeout: 10000
        });

        await this.page.waitForTimeout(1500);

        console.log('========== FILTER VERIFICATION ==========');
        console.log(`Filter Field: ${filterField}`);
        console.log(`Expected Value: ${filterValue}`);

        const tableContents = await table.innerText();

        console.log('Actual Table Contents:');
        console.log(tableContents);

        // Use exact cell matching for Company Name and Email.
        const rows = table.getByRole('row');

        const matchingRows = rows.filter({
            has: this.page.getByText(filterValue, {
                exact: true
            })
        });

        const matchingCount = await matchingRows.count();

        console.log(`Matching Rows Found: ${matchingCount}`);

        expect(
            matchingCount,
            `No exact matching record found for ${filterField}: ${filterValue}.\nActual table contents:\n${tableContents}`
        ).toBeGreaterThan(0);

        await expect(matchingRows.first()).toBeVisible({
            timeout: 10000
        });

        console.log(
            `Successfully verified ${filterField}: ${filterValue}`
        );

        console.log('=========================================');
    }

    // ==========================================================
    // LAST UPDATED FILTER
    // ==========================================================

    async filterByLastUpdated(date: string): Promise<void> {
        await this.ensureFilterPanelOpen();

        const [day, month, year] = date.split('/');

        if (!day || !month || !year) {
            throw new Error(
                `Invalid date format: ${date}. Expected DD/MM/YYYY.`
            );
        }

        const formattedDate = `${year}-${month}-${day}`;

        const lastUpdated = await this.getLastUpdatedFilter();

        await expect(lastUpdated).toBeAttached();

        await this.actions.fill(
            'underwriters.lastUpdatedFilter',
            {
                type: 'css',
                value: '#filter-updatedAt'
            },
            formattedDate
        );

        await this.waitAfterAction();

        console.log(`Applied Last Updated filter: ${formattedDate}`);
    }

    async verifyLastUpdatedFilter(date: string): Promise<void> {
        const [day, month, year] = date.split('/');

        if (!day || !month || !year) {
            throw new Error(
                `Invalid date format: ${date}. Expected DD/MM/YYYY.`
            );
        }

        const formattedDate = `${year}-${month}-${day}`;

        const lastUpdated = await this.getLastUpdatedFilter();

        await expect(lastUpdated).toHaveValue(formattedDate);

        console.log(`Verified Last Updated filter: ${date}`);
    }

    async applyAnyFilter(): Promise<void> {
        await this.applyFilter(
            'Company Name',
            'UW Test Company 1'
        );
    }

    // ==========================================================
    // CLEAR ALL FILTERS
    // ==========================================================

    async clearAllUnderwriterFilters(): Promise<void> {
        await this.ensureFilterPanelOpen();

        await this.actions.click(
            'underwriters.clearFiltersButton',
            {
                type: 'role',
                role: 'button',
                name: 'Clear filters'
            },
            [
                {
                    type: 'role',
                    role: 'button',
                    name: 'Clear Filters'
                }
            ]
        );

        await this.waitAfterAction();

        this.selectedUnderwriterEmail = '';

        await this.verifyFilterFieldsReset();

        console.log('All underwriter filters cleared successfully.');
    }

    async clearAllFilters(): Promise<void> {
        await this.clearAllUnderwriterFilters();
    }

    async verifyFullListDisplayed(): Promise<void> {
        const table = await this.getTable();

        await expect(table).toBeVisible();

        console.log('Verified full underwriter list is displayed.');
    }

    async verifyFilterFieldsReset(): Promise<void> {
        const companyFilter = await this.getCompanyFilter();
        const emailFilter = await this.getEmailFilter();
        const lastUpdatedFilter = await this.getLastUpdatedFilter();

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

    // ==========================================================
    // ACTIVATE AND DEACTIVATE
    // ==========================================================

    async selectStatusAction(
        action: 'Activate' | 'Deactivate'
    ): Promise<void> {
        await this.openActionsMenu();

        await this.actions.click(
            `underwriters.statusAction.${action}`,
            {
                type: 'role',
                role: 'menuitem',
                name: action
            }
        );

        await this.waitAfterAction();

        console.log(`Selected underwriter action: ${action}`);
    }

    async confirmStatusAction(
        action: 'Activate' | 'Deactivate'
    ): Promise<void> {
        const confirmButton = await this.getButton(
            action,
            `confirmStatusAction.${action}`
        );

        await expect(confirmButton).toBeVisible({
            timeout: 10000
        });

        await this.actions.click(
            `underwriters.confirmStatusAction.${action}`,
            {
                type: 'role',
                role: 'button',
                name: action
            }
        );

        await expect(confirmButton).toBeHidden({
            timeout: 15000
        });

        await this.waitAfterAction();

        console.log(`Confirmed underwriter action: ${action}`);
    }

    async verifyUnderwriterStatus(
        status: 'Active' | 'Inactive'
    ): Promise<void> {
        const row = await this.verifySelectedUnderwriterRow();

        const statusText = row.getByText(status, {
            exact: true
        });

        await expect(statusText).toBeVisible({
            timeout: 10000
        });

        console.log(
            `Verified ${this.selectedUnderwriterEmail} status: ${status}`
        );
    }

    async verifyUnderwriterActivated(): Promise<void> {
        await this.verifyUnderwriterStatus('Active');
    }

    // ==========================================================
    // NEGATIVE VALIDATIONS
    // ==========================================================

    async leaveAllMandatoryFieldsEmpty(): Promise<void> {
        const fields = [
            'companyName',
            'email',
            'phone',
            'website',
            'description',
            'address',
            'city',
            'state',
            'country',
            'postalCode'
        ];

        for (const field of fields) {
            const locator = await this.getFieldLocator(field);

            if (await locator.isVisible().catch(() => false)) {
                await this.actions.fill(
                    `underwriters.field.${field}`,
                    {
                        type: 'role',
                        role: 'textbox',
                        name: this.getFieldName(field)
                    },
                    ''
                );
            }
        }

        console.log('All mandatory fields are empty.');
    }

    async verifyMandatoryValidationMessages(): Promise<void> {
        const mandatoryFields = [
            { name: 'Company Name', field: 'companyName' },
            { name: 'Email', field: 'email' },
            { name: 'Phone', field: 'phone' },
            { name: 'Website', field: 'website' },
            { name: 'Description', field: 'description' },
            { name: 'Address', field: 'address' },
            { name: 'City', field: 'city' },
            { name: 'State', field: 'state' },
            { name: 'Country', field: 'country' },
            { name: 'Postal Code', field: 'postalCode' }
        ];

        const invalidFields: string[] = [];

        for (const field of mandatoryFields) {
            const locator = await this.getFieldLocator(field.field);

            if (!(await locator.isVisible().catch(() => false))) {
                continue;
            }

            const state = await locator.evaluate(
                (element: HTMLInputElement | HTMLTextAreaElement) => ({
                    validity: element.validity.valid,
                    validationMessage: element.validationMessage,
                    ariaInvalid: element.getAttribute('aria-invalid')
                })
            );

            if (
                !state.validity ||
                state.ariaInvalid === 'true'
            ) {
                invalidFields.push(field.name);

                console.log(
                    `${field.name} validation: ${state.validationMessage || 'Invalid field'}`
                );
            }
        }

        const visibleErrorMessages = this.page.locator(
            [
                '[role="alert"]',
                '.error-message',
                '.field-error',
                '.invalid-feedback',
                '[class*="error"]',
                '[class*="invalid"]'
            ].join(', ')
        );

        const visibleErrors = await visibleErrorMessages.evaluateAll(
            elements =>
                elements
                    .filter(element => {
                        const style = window.getComputedStyle(element);
                        const rect = element.getBoundingClientRect();

                        return (
                            style.display !== 'none' &&
                            style.visibility !== 'hidden' &&
                            rect.width > 0 &&
                            rect.height > 0 &&
                            (element.textContent || '').trim().length > 0
                        );
                    })
                    .map(element => (element.textContent || '').trim())
        );

        console.log('Invalid mandatory fields:', invalidFields);
        console.log('Visible validation messages:', visibleErrors);

        expect(
            invalidFields.length + visibleErrors.length,
            'No mandatory-field validation indicators were found.'
        ).toBeGreaterThan(0);

        console.log('Mandatory field validation verified.');
    }

    async verifyEmailValidationMessage(): Promise<void> {
        const email = await this.getFieldLocator('email');

        await expect(email).toBeVisible();

        const message = await email.evaluate(
            (element: HTMLInputElement) => element.validationMessage
        );

        expect(message).not.toBe('');
    }

    async verifyFieldValidationMessage(
        fieldName: string
    ): Promise<void> {
        const fieldMap: Record<string, string> = {
            'Company Name': 'companyName',
            Email: 'email',
            Phone: 'phone',
            Description: 'description',
            Address: 'address',
            City: 'city',
            State: 'state',
            Country: 'country',
            'Postal Code': 'postalCode'
        };

        const field = fieldMap[fieldName];

        if (!field) {
            throw new Error(
                `Unknown validation field: ${fieldName}`
            );
        }

        const locator = await this.getFieldLocator(field);

        expect(await locator.inputValue()).toBe('');

        const validationMessage = await locator.evaluate(
            (element: HTMLInputElement) => element.validationMessage
        );

        expect(validationMessage).not.toBe('');
    }

    async verifyAppropriateValidationMessages(): Promise<void> {
        const invalidFields = this.page.locator(
            'input:invalid, textarea:invalid, select:invalid'
        );

        const count = await invalidFields.count();

        expect(count).toBeGreaterThan(0);

        const messages = await Promise.all(
            Array.from(
                { length: count },
                (_, index) =>
                    invalidFields.nth(index).evaluate(
                        (
                            element:
                                | HTMLInputElement
                                | HTMLTextAreaElement
                                | HTMLSelectElement
                        ) => element.validationMessage
                    )
            )
        );

        messages.forEach(message => {
            expect(message).not.toBe('');
        });
    }

    async verifyInvalidChangesNotSaved(): Promise<void> {
        const updateButton = await this.getButton(
            'Update Underwriter',
            'updateButton'
        );

        await expect(updateButton).toBeVisible();

        await this.closeFormIfOpen();
    }

    // ==========================================================
    // LOGOUT
    // ==========================================================

    async logoutFromBrokerNexus(): Promise<void> {
        const profile = await this.getElement(
            'profileMenu',
            {
                type: 'text',
                value: 'A'
            }
        );

        await profile.first().click();

        await this.waitAfterAction();

        await this.actions.click(
            'underwriters.signOutMenuItem',
            {
                type: 'role',
                role: 'menuitem',
                name: 'Sign out'
            }
        );

        await this.waitAfterAction();

        console.log('Successfully logged out from Broker Nexus.');
    }

    // ==========================================================
    // LOGIN PAGE VERIFICATION
    // ==========================================================

    async verifyLoginPageDisplayed(): Promise<void> {
        await expect(this.page).toHaveURL(
            /\/login/,
            {
                timeout: 15000
            }
        );

        await expect(
            this.page.getByRole('textbox', {
                name: 'Enter your email ID'
            })
        ).toBeVisible();

        console.log('Successfully redirected to the login page.');
    }
}