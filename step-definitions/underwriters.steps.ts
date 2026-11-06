import {
    Given,
    When,
    Then
} from '@cucumber/cucumber';

import 'dotenv/config';

import { expect } from '@playwright/test';
import type { DataTable } from '@cucumber/cucumber';

import { CustomWorld } from '../support/world.js';

import {
    UnderwritersPage
} from '../pages/UnderwritersPage.js';

import type {
    UnderwriterDetails
} from '../pages/UnderwritersPage.js';

// --------------------------------------------------
// COMMON HELPERS
// --------------------------------------------------

function getUnderwritersPage(
    world: CustomWorld
): UnderwritersPage {

    if (!world.page) {
        throw new Error(
            'Browser page is not initialized. Check support/hooks.ts'
        );
    }

    if (!world.underwritersPage) {
        world.underwritersPage = new UnderwritersPage(world.page);
    }

    return world.underwritersPage;
}

function parseFieldValueTable(
    dataTable: DataTable
): Record<string, string> {

    const details: Record<string, string> = {};

    for (const row of dataTable.hashes()) {
        details[row.field.trim()] = row.value.trim();
    }

    return details;
}

function getUnderwriterDetails(
    dataTable: DataTable
): UnderwriterDetails {

    return parseFieldValueTable(dataTable) as UnderwriterDetails;
}

// --------------------------------------------------
// BACKGROUND
// --------------------------------------------------

Given(
    'I open the Chromium browser',
    async function (this: CustomWorld) {

        if (!this.page) {
            throw new Error(
                'Chromium page is not available. Verify the Before hook.'
            );
        }

        console.log('Chromium browser is ready');
    }
);

When(
    'I log in to POSO with valid credentials',
    async function (this: CustomWorld) {

        if (!this.page) {
            throw new Error('Browser page is not initialized.');
        }

        const email = process.env.POSO_EMAIL;
        const password = process.env.POSO_PASSWORD;
        const appUrl = process.env.POSO_URL;

        if (!email || !password || !appUrl) {
            throw new Error(
                'POSO URL or login credentials are missing in .env.'
            );
        }

        await this.page.goto(appUrl, {
            waitUntil: 'domcontentloaded'
        });

        await this.page.locator('#email').fill(email);
        await this.page.locator('#password').fill(password);

        const loginButton = this.page.locator('button[type="submit"]');

        await loginButton.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await loginButton.click();

        await this.page.waitForURL(
            url => !url.pathname.endsWith('/login'),
            { timeout: 30000 }
        );

        console.log('Successfully logged in to POSO');
    }
);

When(
    'I navigate to Administration and select Underwriters',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.navigateToUnderwriters();
    }
);

// --------------------------------------------------
// NAVIGATION VERIFICATION
// --------------------------------------------------

Then(
    'the Underwriters page should be displayed',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.verifyUnderwritersPageDisplayed();
    }
);

Then(
    'the underwriters list should be displayed',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.verifyUnderwritersListDisplayed();
    }
);

// --------------------------------------------------
// CREATE UNDERWRITER
// --------------------------------------------------

When(
    'I select New Underwriter',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.selectNewUnderwriter();
    }
);

When(
    'I enter the following underwriter details',
    async function (
        this: CustomWorld,
        dataTable: DataTable
    ) {

        const underwritersPage = getUnderwritersPage(this);
        const details = getUnderwriterDetails(dataTable);

        if (!details.companyName) {
            throw new Error(
                'Company name is required in the test data'
            );
        }

        this.currentUnderwriterIdentifier = details.companyName;

        await underwritersPage.enterUnderwriterDetails(details);
    }
);

When(
    'I save the underwriter',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.saveUnderwriter();
    }
);

Then(
    'the underwriter should be created successfully',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);
        const identifier = this.currentUnderwriterIdentifier;

        if (!identifier) {
            throw new Error(
                'Underwriter identifier is not available'
            );
        }

        await underwritersPage.verifyUnderwriterCreatedSuccessfully(
            identifier
        );
    }
);

// --------------------------------------------------
// SEARCH EXISTING UNDERWRITER
// --------------------------------------------------

When(
    'I search for an existing underwriter using the following details',
    async function (
        this: CustomWorld,
        dataTable: DataTable
    ) {

        const underwritersPage = getUnderwritersPage(this);
        const details = parseFieldValueTable(dataTable);

        const searchValue =
            details.email ||
            details.companyName ||
            details.phone;

        if (!searchValue) {
            throw new Error(
                'Provide email, companyName or phone in the search table'
            );
        }

        this.currentUnderwriterIdentifier = searchValue;

        await underwritersPage.searchExistingUnderwriter(
            searchValue
        );
    }
);

// --------------------------------------------------
// EDIT UNDERWRITER
// --------------------------------------------------

When(
    'I open the actions menu and select Edit',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.selectEditAction();
    }
);

When(
    'I update the following underwriter details',
    async function (
        this: CustomWorld,
        dataTable: DataTable
    ) {

        const underwritersPage = getUnderwritersPage(this);
        const details = getUnderwriterDetails(dataTable);

        await underwritersPage.updateUnderwriterDetails(details);
    }
);

When(
    'I change the company name to {string}',
    async function (
        this: CustomWorld,
        companyName: string
    ) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.changeCompanyName(companyName);
    }
);

When(
    'I cancel the underwriter changes',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.cancelUnderwriterChanges();
    }
);

When(
    'I save the underwriter changes',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.saveUnderwriterChanges();
    }
);

Then(
    'the underwriter changes should be saved successfully',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);
        const identifier = this.currentUnderwriterIdentifier;

        if (!identifier) {
            throw new Error(
                'Underwriter identifier is not available for verification'
            );
        }

        await underwritersPage.verifyUnderwriterDisplayed(identifier);
    }
);

Then(
    'the original underwriter details should remain unchanged',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.verifyOriginalUnderwriterDetailsUnchanged();
    }
);

// --------------------------------------------------
// OPTIONAL UNDERWRITER DETAILS
// --------------------------------------------------

When(
    'I enter the following optional underwriter details',
    async function (
        this: CustomWorld,
        dataTable: DataTable
    ) {

        const underwritersPage = getUnderwritersPage(this);
        const details = getUnderwriterDetails(dataTable);

        await underwritersPage.enterOptionalUnderwriterDetails(details);
    }
);

When(
    'I enable API Available',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.configureApiAvailable(true);
    }
);

When(
    'I enter the following API details',
    async function (
        this: CustomWorld,
        dataTable: DataTable
    ) {

        const underwritersPage = getUnderwritersPage(this);
        const details = getUnderwriterDetails(dataTable);

        await underwritersPage.fillApiDetails(details);
    }
);

When(
    'I upload a valid company logo',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.uploadCompanyLogo();
    }
);

// --------------------------------------------------
// SEARCH UNDERWRITERS
// --------------------------------------------------

When(
    'I search for an underwriter using {string} with value {string}',
    async function (
        this: CustomWorld,
        searchField: string,
        searchValue: string
    ) {

        const underwritersPage = getUnderwritersPage(this);

        console.log(
            `Search field: ${searchField}, Search value: ${searchValue}`
        );

        this.currentUnderwriterIdentifier = searchValue;

        await underwritersPage.searchUnderwriter(searchValue);
    }
);

Then(
    'the matching underwriter records should be displayed',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);
        const identifier = this.currentUnderwriterIdentifier;

        if (!identifier) {
            throw new Error(
                'Search identifier is not available'
            );
        }

        await underwritersPage.verifyMatchingRecordsDisplayed(identifier);
    }
);

Then(
    'no matching underwriter records should be displayed',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);
        const identifier = this.currentUnderwriterIdentifier;

        if (!identifier) {
            throw new Error(
                'Search identifier is not available'
            );
        }

        await underwritersPage.verifyNoMatchingRecords(identifier);
    }
);

// --------------------------------------------------
// FILTER UNDERWRITERS
// --------------------------------------------------

When(
    'I filter underwriters by status {string}',
    async function (
        this: CustomWorld,
        status: string
    ) {

        const underwritersPage = getUnderwritersPage(this);

        if (status !== 'Active' && status !== 'Inactive') {
            throw new Error(
                `Unsupported underwriter status: ${status}`
            );
        }

        await underwritersPage.filterByStatus(status);
    }
);

When(
    'I apply the filter {string} with value {string}',
    async function (
        this: CustomWorld,
        filterName: string,
        value: string
    ) {

        const underwritersPage = getUnderwritersPage(this);

        this.currentUnderwriterIdentifier = value;

        await underwritersPage.applyFilter(
            filterName,
            value
        );
    }
);

Then(
    'the underwriter list should match the filter {string} with value {string}',
    async function (
        this: CustomWorld,
        filterName: string,
        value: string
    ) {

        const underwritersPage = getUnderwritersPage(this);

        console.log(
            `Verifying ${filterName} filter with value: ${value}`
        );

        await underwritersPage.verifyFilterResult(
            filterName,
            value
        );
    }
);

When(
    'I filter underwriters by Last Updated date {string}',
    async function (
        this: CustomWorld,
        date: string
    ) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.filterByLastUpdatedDate(date);
    }
);

Then(
    'the underwriter list should match the selected Last Updated date {string}',
    async function (
        this: CustomWorld,
        date: string
    ) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.verifyLastUpdatedFilterResult(date);
    }
);

When(
    'I clear all underwriter filters',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.clearFilters();
    }
);

// --------------------------------------------------
// ACTIVATE / DEACTIVATE
// --------------------------------------------------

Then(
    'the underwriter should be displayed with {string} status',
    async function (status: 'Active' | 'Inactive') {
        const underwritersPage = getUnderwritersPage(this);

        if (!['Active', 'Inactive'].includes(status)) {
            throw new Error(`Unsupported underwriter status: ${status}`);
        }

        await underwritersPage.verifyUnderwriterStatus(status);
    }
);

When(
    'I open the actions menu and select Deactivate',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.selectDeactivateAction();
    }
);

When(
    'I confirm the deactivation',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.confirmDeactivation();
    }
);

When(
    'I open the actions menu and select Activate',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.selectActivateAction();
    }
);

When(
    'I confirm the activation',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.confirmActivation();
    }
);

// --------------------------------------------------
// NEGATIVE SCENARIOS
// --------------------------------------------------

When(
    'I leave all mandatory fields empty',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.leaveMandatoryFieldsEmpty();
    }
);

Then(
    'the mandatory field validation messages should be displayed',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.verifyMandatoryFieldValidation();
    }
);

Then(
    'the underwriter should not be created',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.verifyEmptyUnderwriterNotCreated();
    }
);

// --------------------------------------------------
// LOGOUT
// --------------------------------------------------

When(
    'I log out from POSO',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.logoutFromPOSO();
    }
);

Then(
    'I should be redirected to the POSO login page',
    async function (this: CustomWorld) {

        const underwritersPage = getUnderwritersPage(this);

        await underwritersPage.verifyLoginPageDisplayed();
    }
);