import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';
import path from 'node:path';

import { SelfHealingActions } from '../utils/SelfHealingActions.js';
import type { LocatorConfig } from '../utils/LocatorConfig.js';

export interface UnderwriterDetails {
    companyName?: string;
    email?: string;
    phone?: string;
    website?: string;
    registrationNumber?: string;
    gst?: string;
    licenseNumber?: string;
    description?: string;

    address?: string;
    city?: string;
    state?: string;
    country?: string;
    pincode?: string;

    accountHolderName?: string;
    accountNumber?: string;
    bankCode?: string;
    branchName?: string;

    premiumRateBases?: string;
    useRatingTable?: string;

    underwriterApiUrl?: string;
    underwriterApiKey?: string;

    endorsementSubmissionMethod?: string;
    endorsementEmail?: string;
    endorsementApiUrl?: string;
}

export class UnderwritersPage {
    private page: Page;
    private actions: SelfHealingActions;

    private currentUnderwriterIdentifier = '';
    private originalCompanyName = '';
    private cancelledCompanyName = '';

    constructor(page: Page) {
        this.page = page;
        this.actions = new SelfHealingActions(page);
    }

    // --------------------------------------------------
    // COMMON HELPERS
    // --------------------------------------------------

    private async getElement(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {

        if (primary.type === 'css') {
            const directLocator = this.page.locator(primary.value);

            if (
                await directLocator.count().catch(() => 0) > 0 &&
                await directLocator.first().isVisible().catch(() => false)
            ) {
                return directLocator.first();
            }
        }

        for (const fallback of fallbacks) {
            let locator: Locator | undefined;

            if (fallback.type === 'css') {
                locator = this.page.locator(fallback.value);
            }

            if (fallback.type === 'placeholder') {
                locator = this.page.getByPlaceholder(
                    fallback.value,
                    { exact: true }
                );
            }

            if (
                locator &&
                await locator.count().catch(() => 0) > 0 &&
                await locator.first().isVisible().catch(() => false)
            ) {
                return locator.first();
            }
        }

        return await this.actions.getLocator(
            key,
            primary,
            fallbacks
        );
    }

    private getButton(name: string): Locator {
        return this.page.getByRole('button', {
            name,
            exact: true
        });
    }

    private async getTextbox(
        id: string,
        placeholder: string
    ): Promise<Locator> {

        const directLocator = this.page.locator(`#${id}`);

        if (
            await directLocator.count().catch(() => 0) > 0 &&
            await directLocator.first().isVisible().catch(() => false)
        ) {
            return directLocator.first();
        }

        console.log(`Direct ID locator not available: #${id}`);

        const placeholderLocator = this.page.getByPlaceholder(
            placeholder,
            { exact: true }
        );

        if (
            await placeholderLocator.count().catch(() => 0) > 0 &&
            await placeholderLocator.first().isVisible().catch(() => false)
        ) {
            return placeholderLocator.first();
        }

        console.log(`Trying Self-Healing locator for: ${id}`);

        return await this.getElement(
            id,
            { type: 'css', value: `#${id}` },
            [{ type: 'placeholder', value: placeholder }]
        );
    }

    private async scrollToElement(locator: Locator): Promise<void> {
        await locator.waitFor({
            state: 'attached',
            timeout: 15000
        });

        await locator.scrollIntoViewIfNeeded();
    }

    private async fillField(
        id: string,
        placeholder: string,
        value?: string
    ): Promise<void> {

        if (value === undefined || value === '') {
            return;
        }

        const field = await this.getTextbox(id, placeholder);

        await field.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await field.scrollIntoViewIfNeeded();
        await field.fill(value);

        console.log(`${id} entered successfully`);
    }

    private async clickAndWait(
        locator: Locator,
        description: string
    ): Promise<void> {

        await locator.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.scrollToElement(locator);
        await locator.click();

        console.log(`${description} clicked`);
    }

    private async ensureFiltersOpen(): Promise<void> {
    const emailFilter = this.page.getByRole('textbox', {
        name: 'Email'
    });

    const companyFilter = this.page.getByRole('textbox', {
        name: 'Company Name'
    });

    // If either filter field is visible, the filter panel is already open.
    if (
        await emailFilter.isVisible().catch(() => false) ||
        await companyFilter.isVisible().catch(() => false)
    ) {
        console.log('Filter panel is already open');
        return;
    }

    // Otherwise, open the filter panel.
    const filterButton = this.page.getByRole('button', {
        name: 'Filter options',
        exact: true
    });

    await filterButton.waitFor({
        state: 'visible',
        timeout: 15000
    });

    await filterButton.click();

    await emailFilter.waitFor({
        state: 'visible',
        timeout: 15000
    });

    console.log('Filter panel opened successfully');
}

    // --------------------------------------------------
    // POSO NAVIGATION
    // --------------------------------------------------

    async navigateToUnderwriters(): Promise<void> {

        console.log('Navigating to POSO Underwriters');

        const baseUrl = process.env.POSO_URL;

        if (!baseUrl) {
            throw new Error('POSO_URL is missing in the .env file');
        }

        if (!this.page.url().startsWith(baseUrl)) {
            await this.page.goto(baseUrl, {
                waitUntil: 'domcontentloaded',
                timeout: 60000
            });
        }

        const administration = this.page.getByRole('button', {
            name: 'Administration'
        });

        await administration.waitFor({
            state: 'visible',
            timeout: 20000
        });

        const isExpanded = await administration.getAttribute('aria-expanded');

        if (isExpanded !== 'true') {
            await administration.click();
        }

        const underwritersMenu = this.page.getByText(
            'Underwriters',
            { exact: true }
        ).last();

        await underwritersMenu.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await underwritersMenu.click();

        await this.page.waitForLoadState('domcontentloaded').catch(() => {});

        console.log('POSO Underwriters page opened');
    }

    async verifyUnderwritersPageDisplayed(): Promise<void> {
        await expect(this.getButton('New Underwriter')).toBeVisible({
            timeout: 15000
        });
    }

    async verifyUnderwritersListDisplayed(): Promise<void> {
        await expect(this.getTable()).toBeVisible({
            timeout: 15000
        });
    }

    async clickNewUnderwriter(): Promise<void> {

    await this.clickAndWait(
        this.getButton('New Underwriter'),
        'New Underwriter'
    );

    // Wait until the Underwriter form is fully opened
    await this.page.locator('#company-name').waitFor({
        state: 'visible',
        timeout: 15000
    });

    console.log('New Underwriter form opened successfully');
}

    async selectNewUnderwriter(): Promise<void> {
        await this.clickNewUnderwriter();
    }

    // --------------------------------------------------
    // COMPANY DETAILS
    // --------------------------------------------------

    async fillCompanyDetails(details: UnderwriterDetails): Promise<void> {

        await this.fillField('company-name', 'Enter company name', details.companyName);
        await this.fillField('email', 'Enter email address', details.email);
        await this.fillField('phone', 'Enter phone number', details.phone);
        await this.fillField('website', 'Enter website URL', details.website);
        await this.fillField('registration-number', 'Enter registration number', details.registrationNumber);
        await this.fillField('gst', 'Enter tax number', details.gst);
        await this.fillField('license-number', 'Enter license number', details.licenseNumber);
        await this.fillField('description', 'Enter company description', details.description);

        console.log('Company details entered');
    }

    // --------------------------------------------------
    // ADDRESS DETAILS
    // --------------------------------------------------

    async fillAddressDetails(details: UnderwriterDetails): Promise<void> {

        await this.fillField('address', 'Enter address', details.address);
        await this.fillField('city', 'Enter city', details.city);
        await this.fillField('state', 'Enter state', details.state);
        await this.fillField('country', 'Enter country', details.country);
        await this.fillField('pincode', 'Enter postal code', details.pincode);

        console.log('Address details entered');
    }

    // --------------------------------------------------
    // BANK DETAILS
    // --------------------------------------------------

    async fillBankDetails(details: UnderwriterDetails): Promise<void> {

        await this.fillField('accountHolderName', 'Enter account holder name', details.accountHolderName);
        await this.fillField('accountNumber', 'Enter account number', details.accountNumber);
        await this.fillField('bankCode', 'Enter branch code', details.bankCode);
        await this.fillField('branchName', 'Enter branch name', details.branchName);

        console.log('Bank details entered');
    }

    // --------------------------------------------------
    // PREMIUM RATE BASIS
    // --------------------------------------------------

    async selectPremiumRateBasis(value: string): Promise<void> {

        const dropdown = await this.getElement(
            'premium-rate-basis',
            { type: 'css', value: '#premiumRateBases' }
        );

        await this.scrollToElement(dropdown);
        await dropdown.selectOption(value);

        console.log(`Premium Rate Basis selected: ${value}`);
    }

    // --------------------------------------------------
    // CONNECT TO RATE TABLE
    // --------------------------------------------------

    async selectRatingTable(value: string): Promise<void> {

        const dropdown = await this.getElement(
            'rating-table',
            { type: 'css', value: '#useRatingTable' }
        );

        await this.scrollToElement(dropdown);

        const normalizedValue = value.toLowerCase();

        await dropdown.selectOption(
            normalizedValue === 'yes' ? 'true' : 'false'
        ).catch(async () => {
            await dropdown.selectOption({ label: value });
        });

        console.log(`Connect to Rate Table selected: ${value}`);
    }

    // --------------------------------------------------
    // API CONFIGURATION
    // --------------------------------------------------

    async configureApiAvailable(enabled: boolean): Promise<void> {

        const checkbox = await this.getElement(
            'api-available',
            { type: 'css', value: '#isApiEnable' }
        );

        await this.scrollToElement(checkbox);

        if (enabled && !await checkbox.isChecked()) {
            await checkbox.check();
        } else if (!enabled && await checkbox.isChecked()) {
            await checkbox.uncheck();
        }

        console.log(`API Available: ${enabled}`);
    }

    async fillApiDetails(details: UnderwriterDetails): Promise<void> {

        await this.fillField(
            'underwriterApiUrl',
            'https://insurer-api.example.com/webhook',
            details.underwriterApiUrl
        );

        await this.fillField(
            'underwriterApiKey',
            'Enter API key',
            details.underwriterApiKey
        );

        console.log('API details entered');
    }

    // --------------------------------------------------
    // ENDORSEMENT CONFIGURATION
    // --------------------------------------------------

    async selectSubmissionMethod(value: string): Promise<void> {

        const dropdown = await this.getElement(
            'endorsement-submission-method',
            { type: 'css', value: '#endorsementSubmissionMethod' }
        );

        await this.scrollToElement(dropdown);
        await dropdown.click();

        const option = this.page.getByText(value, { exact: true }).last();

        await option.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await option.click();

        console.log(`Submission Method selected: ${value}`);
    }

    async fillEndorsementDetails(details: UnderwriterDetails): Promise<void> {

        await this.fillField(
            'endorsementEmail',
            'endorsements@insurer.example.com',
            details.endorsementEmail
        );

        await this.fillField(
            'endorsementApiUrl',
            'https://insurer-api.example.com/endorsements',
            details.endorsementApiUrl
        );

        console.log('Endorsement details entered');
    }

    // --------------------------------------------------
    // COMPLETE FORM
    // --------------------------------------------------

    async fillDetails(details: UnderwriterDetails): Promise<void> {

        await this.fillCompanyDetails(details);
        await this.fillAddressDetails(details);
        await this.fillBankDetails(details);

        if (details.premiumRateBases) {
            await this.selectPremiumRateBasis(details.premiumRateBases);
        }

        if (details.useRatingTable) {
            await this.selectRatingTable(details.useRatingTable);
        }

        if (details.endorsementSubmissionMethod) {
            await this.selectSubmissionMethod(details.endorsementSubmissionMethod);
        }

        if (details.underwriterApiUrl || details.underwriterApiKey) {
            await this.configureApiAvailable(true);
            await this.fillApiDetails(details);
        }

        await this.fillEndorsementDetails(details);
    }

    async enterUnderwriterDetails(details: UnderwriterDetails): Promise<void> {
        await this.fillDetails(details);
    }

    async updateUnderwriterDetails(details: UnderwriterDetails): Promise<void> {
        await this.fillCompanyDetails(details);
        await this.fillAddressDetails(details);
        await this.fillBankDetails(details);

        console.log('Selected underwriter details updated');
    }

    async enterOptionalUnderwriterDetails(details: UnderwriterDetails): Promise<void> {

        if (details.premiumRateBases) {
            await this.selectPremiumRateBasis(details.premiumRateBases);
        }

        if (details.useRatingTable) {
            await this.selectRatingTable(details.useRatingTable);
        }

        if (details.endorsementSubmissionMethod) {
            await this.selectSubmissionMethod(details.endorsementSubmissionMethod);
        }

        await this.fillEndorsementDetails(details);
    }

    // --------------------------------------------------
    // LOGO UPLOAD
    // --------------------------------------------------

    async uploadCompanyLogo(filePath?: string): Promise<void> {

        const logoPath = filePath || process.env.UNDERWRITER_LOGO_PATH;

        if (!logoPath) {
            throw new Error('UNDERWRITER_LOGO_PATH is missing in .env');
        }

        const absolutePath = path.resolve(logoPath);

        const uploadInput = await this.getElement(
            'company-logo-upload',
            { type: 'css', value: '#logo-upload' }
        );

        await uploadInput.setInputFiles(absolutePath);

        console.log('Company logo uploaded');
    }

    // --------------------------------------------------
    // CREATE / SAVE UNDERWRITER
    // --------------------------------------------------

    async createUnderwriter(details: UnderwriterDetails): Promise<void> {
        await this.fillDetails(details);
        await this.saveUnderwriter();
    }

    async saveUnderwriter(): Promise<void> {
        await this.clickAndWait(
            this.getButton('Create Underwriter'),
            'Create Underwriter'
        );
    }

    async updateUnderwriter(): Promise<void> {
        await this.clickAndWait(
            this.getButton('Update Underwriter'),
            'Update Underwriter'
        );
    }

    async saveUnderwriterChanges(): Promise<void> {
        await this.updateUnderwriter();
    }

    async verifyUnderwriterCreatedSuccessfully(identifier: string): Promise<void> {
        await this.verifyUnderwriterDisplayed(identifier);
    }

    // --------------------------------------------------
    // CANCEL FORM / CANCEL EDIT
    // --------------------------------------------------

    async cancelUnderwriterForm(): Promise<void> {
        await this.clickAndWait(this.getButton('Cancel'), 'Cancel');
    }

    async changeCompanyName(companyName: string): Promise<void> {

        const companyNameField = await this.getTextbox(
            'company-name',
            'Enter company name'
        );

        this.originalCompanyName = (
            await companyNameField.inputValue()
        ).trim();

        this.cancelledCompanyName = companyName;

        await companyNameField.fill(companyName);

        console.log(`Temporary company name entered: ${companyName}`);
    }

    async cancelUnderwriterChanges(): Promise<void> {
        await this.cancelUnderwriterForm();
    }

    async verifyOriginalUnderwriterDetailsUnchanged(): Promise<void> {

        if (!this.originalCompanyName) {
            throw new Error('Original company name was not captured before editing');
        }

        const row = this.getUnderwriterRow(this.originalCompanyName);

        await expect(row.first()).toBeVisible({ timeout: 15000 });

        if (this.cancelledCompanyName) {
            await expect(
                this.getUnderwriterRow(this.cancelledCompanyName)
            ).toHaveCount(0);
        }

        console.log('Original underwriter details remain unchanged');
    }

    async verifyCreateFormDisplayed(): Promise<void> {
        await expect(this.getButton('Create Underwriter')).toBeVisible();
    }

    async verifyUpdateFormDisplayed(): Promise<void> {

    const updateButton = this.page.locator(
        'button[type="submit"]'
    ).filter({
        hasText: 'Update Underwriter'
    });

    await expect(updateButton).toBeVisible({
        timeout: 15000
    });

    await expect(
        this.page.locator('#company-name')
    ).toBeVisible({
        timeout: 15000
    });

    console.log('Update Underwriter form opened successfully');
}

    // --------------------------------------------------
    // SEARCH
    // --------------------------------------------------

    async openSearch(): Promise<void> {

        const searchInput = this.page.getByPlaceholder('Search...', {
            exact: true
        });

        if (await searchInput.isVisible().catch(() => false)) {
            return;
        }

        await this.page.getByRole('button', {
            name: 'Search items'
        }).click();

        await searchInput.waitFor({
            state: 'visible',
            timeout: 10000
        });
    }

    async searchUnderwriter(searchText: string): Promise<void> {

        await this.openSearch();

        const searchInput = this.page.getByPlaceholder('Search...', {
            exact: true
        });

        await searchInput.fill(searchText);
        await this.page.waitForTimeout(1000);

        this.currentUnderwriterIdentifier = searchText;

        console.log(`Searched for: ${searchText}`);
    }

    async searchExistingUnderwriter(searchText: string): Promise<void> {
        await this.searchUnderwriter(searchText);
    }

    async clearSearch(): Promise<void> {

        const searchInput = this.page.getByPlaceholder('Search...', {
            exact: true
        });

        if (await searchInput.isVisible().catch(() => false)) {
            await searchInput.clear();
            await this.page.waitForTimeout(500);
        }
    }

    async verifyMatchingRecordsDisplayed(identifier: string): Promise<void> {
        await this.verifyUnderwriterDisplayed(identifier);
    }

    async verifyNoMatchingRecords(identifier: string): Promise<void> {
        await expect(this.getUnderwriterRow(identifier)).toHaveCount(0);
    }

    // --------------------------------------------------
    // FILTERS
    // --------------------------------------------------

    async openFilters(): Promise<void> {
        await this.ensureFiltersOpen();
    }

    async filterByStatus(status: 'Active' | 'Inactive'): Promise<void> {

        await this.ensureFiltersOpen();

        const statusDropdown = this.page.locator('#filter-status');

        if (await statusDropdown.count() > 0) {

            const tagName = await statusDropdown.evaluate(
                element => element.tagName.toLowerCase()
            );

            if (tagName === 'select') {
                await statusDropdown.selectOption({ label: status });
            } else {
                await statusDropdown.click();

                const option = this.page.getByRole('option', {
                    name: status,
                    exact: true
                });

                if (await option.count() > 0) {
                    await option.last().click();
                } else {
                    await this.page.getByText(status, {
                        exact: true
                    }).last().click();
                }
            }

        } else {
            const statusLabel = this.page.getByText('Status', {
                exact: true
            }).last();

            await statusLabel.waitFor({
                state: 'visible',
                timeout: 10000
            });

            await statusLabel.click();

            const option = this.page.getByRole('option', {
                name: status,
                exact: true
            });

            if (await option.count() > 0) {
                await option.last().click();
            } else {
                await this.page.getByText(status, {
                    exact: true
                }).last().click();
            }
        }

        console.log(`Status filter applied: ${status}`);
    }

    async filterByCompanyName(companyName: string): Promise<void> {

        await this.ensureFiltersOpen();

        const companyFilter = this.page.getByRole('textbox', {
            name: 'Company Name'
        });

        await companyFilter.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await companyFilter.fill(companyName);

        console.log(`Company Name filter applied: ${companyName}`);
    }

    async filterByEmail(email: string): Promise<void> {

        await this.ensureFiltersOpen();

        const emailFilter = this.page.getByRole('textbox', {
            name: 'Email'
        });

        await emailFilter.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await emailFilter.fill(email);

        console.log(`Email filter applied: ${email}`);
    }

    async filterByLastUpdatedDate(date: string): Promise<void> {

        await this.ensureFiltersOpen();

        const [day, month, year] = date.split('/');

        if (!day || !month || !year) {
            throw new Error(
                `Invalid date format: ${date}. Expected DD/MM/YYYY`
            );
        }

        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        const dateInput = this.page.getByRole('textbox', {
            name: 'Last Updated'
        });

        if (await dateInput.count() > 0 && await dateInput.isVisible().catch(() => false)) {
            await dateInput.fill(formattedDate);
        } else {
            const fallbackInput = this.page.locator('#filter-updatedAt');

            await fallbackInput.waitFor({
                state: 'attached',
                timeout: 10000
            });

            await fallbackInput.evaluate((element, value) => {
                const input = element as HTMLInputElement;
                const setter = Object.getOwnPropertyDescriptor(
                    HTMLInputElement.prototype,
                    'value'
                )?.set;

                setter?.call(input, value);

                input.dispatchEvent(new Event('input', { bubbles: true }));
                input.dispatchEvent(new Event('change', { bubbles: true }));
            }, formattedDate);
        }

        console.log(`Last Updated filter applied: ${date}`);
    }

    async clearFilters(): Promise<void> {

        const clearButton = this.getButton('Clear filters');

        await clearButton.waitFor({
            state: 'visible',
            timeout: 10000
        });

        if (await clearButton.isEnabled()) {
            await clearButton.click();
        }

        console.log('Filters cleared');
    }

    async applyFilter(filterName: string, value: string): Promise<void> {

        const normalizedFilter = filterName.toLowerCase();

        if (normalizedFilter === 'email' || normalizedFilter === 'email address') {
            await this.filterByEmail(value);
        } else if (normalizedFilter === 'company name') {
            await this.filterByCompanyName(value);
        } else {
            throw new Error(`Unsupported filter type: ${filterName}`);
        }

        this.currentUnderwriterIdentifier = value;
    }

    async verifyFilterResult(
    filterName: string,
    value: string
): Promise<void> {

    const normalizedFilter = filterName.toLowerCase();

    const rows = this.page.locator('table tbody tr');

    if (normalizedFilter === 'email' ||
        normalizedFilter === 'email address') {

        const matchingRow = rows.filter({
            has: this.page.getByText(value, { exact: true })
        });

        await expect(matchingRow).toHaveCount(1, {
            timeout: 15000
        });

        await expect(
            matchingRow.getByText(value, { exact: true })
        ).toBeVisible();

        console.log(`Verified exact email match: ${value}`);
        return;
    }

    if (normalizedFilter === 'company name') {

        const matchingRows = rows.filter({
            has: this.page.getByText(value, { exact: false })
        });

        await expect(matchingRows.first()).toBeVisible({
            timeout: 15000
        });

        console.log(`Verified company name filter: ${value}`);
        return;
    }

    throw new Error(`Unsupported filter verification: ${filterName}`);
}

    async verifyLastUpdatedFilterResult(date: string): Promise<void> {

        const [day, month, year] = date.split('/');

        if (!day || !month || !year) {
            throw new Error(`Invalid date format: ${date}`);
        }

        const formattedDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        const dateInput = this.page.getByRole('textbox', {
            name: 'Last Updated'
        });

        if (await dateInput.count() > 0 && await dateInput.isVisible().catch(() => false)) {
            await expect(dateInput).toHaveValue(formattedDate);
        } else {
            await expect(this.page.locator('#filter-updatedAt')).toHaveValue(formattedDate);
        }

        const expectedDisplayDate = new Date(
            Date.UTC(Number(year), Number(month) - 1, Number(day))
        ).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'UTC'
        });

        const rows = this.getTable().locator('tbody tr');

        await expect.poll(
            async () => await rows.count(),
            { timeout: 15000 }
        ).toBeGreaterThan(0);

        const rowCount = await rows.count();

        for (let index = 0; index < rowCount; index++) {
            await expect(rows.nth(index).locator('td').nth(3))
                .toHaveText(expectedDisplayDate);
        }

        console.log(`Verified Last Updated filter result: ${date}`);
    }

    // --------------------------------------------------
    // TABLE HELPERS
    // --------------------------------------------------

    private getTable(): Locator {
        return this.page.locator('table').first();
    }

    private getUnderwriterRow(identifier: string): Locator {
        return this.getTable()
            .locator('tbody tr')
            .filter({
                has: this.page.getByText(identifier, { exact: true })
            });
    }

    async verifyUnderwriterDisplayed(identifier: string): Promise<void> {

        const row = this.getUnderwriterRow(identifier);

        await expect(row.first()).toBeVisible({
            timeout: 15000
        });
    }

    async verifyUnderwriterNotCreated(identifier: string): Promise<void> {
        await expect(this.getUnderwriterRow(identifier)).toHaveCount(0);
    }

    async verifyUnderwriterStatus(status: 'Active' | 'Inactive'): Promise<void> {

        if (!this.currentUnderwriterIdentifier) {
            throw new Error('No underwriter identifier is available for status verification');
        }

        const email = this.currentUnderwriterIdentifier;
        const row = this.getUnderwriterRow(email);

        await expect(row).toHaveCount(1, { timeout: 15000 });

        await expect(row.locator('td').nth(1)).toHaveText(email);
        await expect(row.locator('td').nth(2)).toHaveText(status);

        console.log(`Verified ${email} with ${status} status`);
    }

    // --------------------------------------------------
    // ROW ACTIONS
    // --------------------------------------------------

    async openUnderwriterActions(identifier: string): Promise<void> {

        const row = this.getUnderwriterRow(identifier);

        await expect(row).toHaveCount(1, {
            timeout: 15000
        });

        await row.getByRole('button', {
            name: 'Open actions menu'
        }).click();
    }

    async openCurrentUnderwriterActions(): Promise<void> {

        if (!this.currentUnderwriterIdentifier) {
            throw new Error('Search for an underwriter before opening its actions');
        }

        await this.openUnderwriterActions(this.currentUnderwriterIdentifier);
    }

    private async clickRowAction(
    actionName: string
): Promise<void> {

    const menuItem = this.page.getByRole('menuitem', {
        name: actionName,
        exact: true
    });

    if (await menuItem.count() > 0) {
        await menuItem.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await menuItem.click();

        console.log(`${actionName} menu item clicked`);
        return;
    }

    const menuButton = this.page.getByRole('button', {
        name: actionName,
        exact: true
    });

    if (await menuButton.count() > 0) {
        await menuButton.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await menuButton.click();

        console.log(`${actionName} button clicked`);
        return;
    }

    const textOption = this.page.getByText(
        actionName,
        { exact: true }
    );

    await textOption.first().waitFor({
        state: 'visible',
        timeout: 10000
    });

    await textOption.first().click();

    console.log(`${actionName} action clicked`);
}

    async selectEditAction(): Promise<void> {

    await this.openCurrentUnderwriterActions();

    await this.clickRowAction('Edit');

    await this.page.waitForLoadState('domcontentloaded')
        .catch(() => {});

    await this.verifyUpdateFormDisplayed();

    console.log('Edit action selected');
}

    async editUnderwriter(identifier: string): Promise<void> {

    this.currentUnderwriterIdentifier = identifier;

    await this.openUnderwriterActions(identifier);

    await this.clickRowAction('Edit');

    await this.page.waitForLoadState('domcontentloaded')
        .catch(() => {});

    await this.verifyUpdateFormDisplayed();

    console.log('Edit action selected');
}

    async selectDeactivateAction(): Promise<void> {
        await this.openCurrentUnderwriterActions();
        await this.clickRowAction('Deactivate');

        console.log('Deactivate action selected');
    }

    async confirmDeactivation(): Promise<void> {

        await this.getButton('Deactivate').waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.getButton('Deactivate').click();

        console.log('Deactivation confirmed');
    }

    async selectActivateAction(): Promise<void> {
        await this.openCurrentUnderwriterActions();
        await this.clickRowAction('Activate');

        console.log('Activate action selected');
    }

    async confirmActivation(): Promise<void> {

        await this.getButton('Activate').waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.getButton('Activate').click();

        console.log('Activation confirmed');
    }

    async deactivateUnderwriter(identifier: string): Promise<void> {

        this.currentUnderwriterIdentifier = identifier;

        await this.selectDeactivateAction();
        await this.confirmDeactivation();
    }

    async activateUnderwriter(identifier: string): Promise<void> {

        this.currentUnderwriterIdentifier = identifier;

        await this.selectActivateAction();
        await this.confirmActivation();
    }

    // --------------------------------------------------
    // MANDATORY FIELD VALIDATION
    // --------------------------------------------------

    async leaveMandatoryFieldsEmpty(): Promise<void> {

        await this.verifyCreateFormDisplayed();

        console.log('Mandatory fields left empty');
    }

    async verifyMandatoryFieldValidation(): Promise<void> {

        const validationToast = this.page.locator('li[role="status"]').filter({
            hasText: 'Validation Error'
        });

        await expect(validationToast).toBeVisible({
            timeout: 10000
        });

        const expectedMessages = [
            'Company name is required',
            'Email is required',
            'Phone number is required',
            'Website is required',
            'Registration number is required',
            'GST number is required',
            'License number is required',
            'Description is required',
            'Address is required',
            'City is required',
            'State is required',
            'Country is required',
            'Postal code is required'
        ];

        for (const message of expectedMessages) {
            await expect(validationToast).toContainText(message);
        }

        console.log('Mandatory field validation messages verified');
    }

    async verifyEmptyUnderwriterNotCreated(): Promise<void> {

        await this.verifyCreateFormDisplayed();

        console.log('Underwriter was not created because mandatory fields are empty');
    }

    // --------------------------------------------------
    // NOTIFICATIONS
    // --------------------------------------------------

    async verifyNotification(message: string): Promise<void> {

        await expect(
            this.page.getByText(message, { exact: false }).first()
        ).toBeVisible({
            timeout: 15000
        });
    }

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------

    async logoutFromPOSO(): Promise<void> {

        const profile = this.page.locator('span.rounded-full').filter({
            hasText: 'A'
        }).first();

        await profile.click();

        await this.page.getByRole('menuitem', {
            name: 'Sign out'
        }).click();

        await this.verifyLoginPageDisplayed();

        console.log('Logged out from POSO');
    }

    async verifyLoginPageDisplayed(): Promise<void> {

        await expect(this.page.locator('#email')).toBeVisible({
            timeout: 15000
        });

        await expect(this.page.locator('#password')).toBeVisible();

        await expect(this.page.getByRole('button', {
            name: 'Login'
        })).toBeVisible();
    }

    // --------------------------------------------------
    // BACKWARD COMPATIBILITY
    // --------------------------------------------------

    async returnToBrokerNexus(): Promise<void> {
        await this.navigateToUnderwriters();
    }

    async logoutFromBrokerNexus(): Promise<void> {
        await this.logoutFromPOSO();
    }
}