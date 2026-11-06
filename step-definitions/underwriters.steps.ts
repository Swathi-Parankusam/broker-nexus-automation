import {
  Given,
  When,
  Then,
  setDefaultTimeout,
} from '@cucumber/cucumber';

import type { DataTable } from '@cucumber/cucumber';
import { expect } from '@playwright/test';

import { UnderwritersPage } from '../pages/UnderwritersPage.ts';
import type { CustomWorld } from '../support/world.ts';

setDefaultTimeout(180 * 1000);

// ==========================================================
// HELPER FUNCTIONS
// ==========================================================

function getUnderwritersPage(world: CustomWorld): UnderwritersPage {
  if (!world.underwritersPage) {
    throw new Error(
      'UnderwritersPage has not been initialized. Please log in first.',
    );
  }

  return world.underwritersPage;
}

function getPage(world: CustomWorld) {
  if (!world.page) {
    throw new Error('Browser page is not initialized.');
  }

  return world.page;
}

function convertDataTableToObject(
  dataTable: DataTable,
): Record<string, string> {
  const details: Record<string, string> = {};

  for (const row of dataTable.hashes()) {
    details[row.field] = row.value;
  }

  return details;
}

// ==========================================================
// BACKGROUND
// ==========================================================

Given(
  'I open the Chromium browser',
  async function (this: CustomWorld) {
    const page = getPage(this);

    await page.waitForLoadState('domcontentloaded');

    console.log('Chromium browser is ready.');
  },
);

Given(
  'I log in to Broker Nexus with valid credentials',
  async function (this: CustomWorld) {
    const email = process.env.BROKER_NEXUS_EMAIL;
    const password = process.env.BROKER_NEXUS_PASSWORD;
    const url = process.env.BROKER_NEXUS_URL;

    if (!email || !password || !url) {
      throw new Error(
        'Missing environment variables: BROKER_NEXUS_EMAIL, BROKER_NEXUS_PASSWORD, or BROKER_NEXUS_URL.',
      );
    }

    const page = getPage(this);

    await page.goto(url);

    await page.getByRole('textbox', {
      name: 'Email Address *',
    }).fill(email);

    await page.getByRole('textbox', {
      name: 'Password *',
    }).fill(password);

    await page.getByRole('button', {
      name: 'Login Icon Login',
    }).click();

    await page.waitForTimeout(2000);

    this.underwritersPage = new UnderwritersPage(page);

    console.log('Successfully logged in to Broker Nexus.');
  },
);

// ==========================================================
// NAVIGATION TO UNDERWRITERS
// ==========================================================

When(
  'I navigate to Administration and select Underwriters',
  async function (this: CustomWorld) {
    const underwritersPage = getUnderwritersPage(this);

    await underwritersPage.navigateToUnderwriters();

    await underwritersPage.verifyUnderwritersPageDisplayed();

    console.log('Successfully navigated to Underwriters.');
  },
);

// ==========================================================
// PAGE VALIDATION
// ==========================================================

Then(
  'the Underwriters page should be displayed',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwritersPageDisplayed();
  },
);

Then(
  'the underwriters list should be displayed',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwritersListDisplayed();
  },
);

// ==========================================================
// CREATE UNDERWRITER
// ==========================================================

When(
  'I select New Underwriter',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).selectNewUnderwriter();
  },
);

When(
  'I enter the following underwriter details',
  async function (this: CustomWorld, dataTable: DataTable) {
    const details = convertDataTableToObject(dataTable);

    await getUnderwritersPage(this).enterUnderwriterDetails(details);
  },
);

When(
  'I save the underwriter',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).saveUnderwriter();
  },
);

Then(
  'the underwriter should be created successfully',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwriterCreatedSuccessfully();
  },
);

// ==========================================================
// VISIT WEBSITE
// ==========================================================

When(
  'I select the Visit Website link',
  async function (this: CustomWorld) {
    this.websitePage =
      await getUnderwritersPage(this).selectVisitWebsite();
  },
);

Then(
  'the underwriter website should open successfully',
  async function (this: CustomWorld) {
    if (!this.websitePage) {
      throw new Error('Website popup was not opened.');
    }

    await getUnderwritersPage(this).verifyWebsiteOpened(
      this.websitePage,
    );
  },
);

When(
  'I return to the Broker Nexus application',
  async function (this: CustomWorld) {
    if (!this.websitePage) {
      throw new Error('Website popup is not available.');
    }

    await getUnderwritersPage(this).returnToBrokerNexus(
      this.websitePage,
    );

    this.websitePage = undefined;
  },
);

// ==========================================================
// SEARCH
// ==========================================================

When(
  'I search for an existing underwriter using the following details',
  async function (this: CustomWorld, dataTable: DataTable) {
    const details = convertDataTableToObject(dataTable);

    await getUnderwritersPage(this).searchExistingUnderwriter(details);
  },
);

When(
  'I search for an underwriter using {string} with value {string}',
  async function (
    this: CustomWorld,
    searchField: string,
    searchValue: string,
  ) {
    console.log(`Searching by ${searchField}: ${searchValue}`);

    await getUnderwritersPage(this).searchUnderwriter(searchValue);
  },
);

Then(
  'the matching underwriter records should be displayed',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyMatchingRecordsDisplayed();
  },
);

Then(
  'no matching underwriter records should be displayed',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyNoMatchingRecords();
  },
);

// ==========================================================
// EDIT UNDERWRITER
// ==========================================================

When(
  'I open the actions menu and select Edit',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).openActionsMenuAndSelectEdit();
  },
);

When(
  'I enter the following optional underwriter details',
  async function (this: CustomWorld, dataTable: DataTable) {
    const details = convertDataTableToObject(dataTable);

    await getUnderwritersPage(this).enterOptionalUnderwriterDetails(
      details,
    );
  },
);

When(
  'I update the following underwriter details',
  async function (this: CustomWorld, dataTable: DataTable) {
    const details = convertDataTableToObject(dataTable);

    await getUnderwritersPage(this).updateUnderwriterDetails(details);
  },
);

// ==========================================================
// API CONFIGURATION
// ==========================================================

When(
  'I enable API Available',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).configureApiAvailable(true);

    console.log('API Available enabled.');
  },
);

When(
  'I enter the following API details',
  async function (this: CustomWorld, dataTable: DataTable) {
    const details = convertDataTableToObject(dataTable);

    const webhookUrl =
      details.webhookUrl ??
      details.WebhookURL ??
      details['Webhook URL'];

    const apiKey =
      details.apiKey ??
      details.APIKey ??
      details['API Key'];

    if (!webhookUrl || !apiKey) {
      throw new Error(
        'Webhook URL or API Key is missing from the API details table.',
      );
    }

    await getUnderwritersPage(this).configureApiAvailable(
      true,
      webhookUrl,
      apiKey,
    );

    console.log('Webhook URL and API Key entered.');
  },
);

When(
  'I upload a valid company logo',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).uploadCompanyLogo();
  },
);

When(
  'I save the underwriter changes',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).saveUnderwriterChanges();
  },
);

Then(
  'the underwriter should be updated successfully',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwriterUpdatedSuccessfully();
  },
);

Then(
  'the updated underwriter details should be displayed',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUpdatedUnderwriterDetails({
      companyName: 'UW Test Company Updated',
      phone: '98765432110',
      description: 'Updated underwriter details',
    });
  },
);

// ==========================================================
// CHANGE COMPANY NAME AND CANCEL
// ==========================================================

When(
  'I change the company name to {string}',
  async function (this: CustomWorld, companyName: string) {
    await getUnderwritersPage(this).changeCompanyName(companyName);
  },
);

When(
  'I cancel the underwriter changes',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).cancelUnderwriterChanges();
  },
);

Then(
  'the original underwriter details should remain unchanged',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyOriginalDetailsRemainUnchanged(
      'UW Test Company Updated',
    );
  },
);

// ==========================================================
// FILTER BY STATUS
// ==========================================================

When(
  'I filter underwriters by status {string}',
  async function (this: CustomWorld, status: string) {
    await getUnderwritersPage(this).filterUnderwritersByStatus(status);
  },
);

Then(
  'the underwriter list should match the selected status {string}',
  async function (this: CustomWorld, status: string) {
    await getUnderwritersPage(this).verifyListMatchesStatus(status);
  },
);

// ==========================================================
// FILTER BY FIELD
// ==========================================================

When(
  'I apply the filter {string} with value {string}',
  async function (
    this: CustomWorld,
    filterField: string,
    filterValue: string,
  ) {
    await getUnderwritersPage(this).applyFilter(
      filterField,
      filterValue,
    );
  },
);

Then(
  'the underwriter list should match the filter {string} with value {string}',
  async function (
    this: CustomWorld,
    filterField: string,
    filterValue: string,
  ) {
    await getUnderwritersPage(this).verifyFilterApplied(
      filterField,
      filterValue,
    );
  },
);

// ==========================================================
// FILTER BY LAST UPDATED DATE
// ==========================================================

When(
  'I filter underwriters by Last Updated date {string}',
  async function (this: CustomWorld, lastUpdatedDate: string) {
    await getUnderwritersPage(this).filterByLastUpdated(
      lastUpdatedDate,
    );
  },
);

Then(
  'the underwriter list should match the selected Last Updated date {string}',
  async function (this: CustomWorld, lastUpdatedDate: string) {
    await getUnderwritersPage(this).verifyLastUpdatedFilter(
      lastUpdatedDate,
    );
  },
);

// ==========================================================
// CLEAR FILTERS AND VERIFY RESET
// ==========================================================

When(
  'I clear all underwriter filters',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).clearAllFilters();

    console.log('All underwriter filters cleared.');
  },
);

Then(
  'all underwriter filter fields should be reset',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyFilterFieldsReset();

    console.log('Verified that all underwriter filter fields are reset.');
  },
);

Then(
  'the default Active status should be selected',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyListMatchesStatus('Active');

    console.log('Verified that the default Active status is selected.');
  },
);

// ==========================================================
// ACTIVATE / DEACTIVATE
// ==========================================================

Then(
  'the underwriter should be displayed with Active status',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwriterStatus('Active');
  },
);

Then(
  'the underwriter should be displayed with Inactive status',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwriterStatus('Inactive');
  },
);

When(
  'I open the actions menu and select Deactivate',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).selectStatusAction('Deactivate');
  },
);

When(
  'I confirm the deactivation',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).confirmStatusAction('Deactivate');
  },
);

Then(
  'the underwriter status should be Inactive',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwriterStatus('Inactive');
  },
);

When(
  'I open the actions menu and select Activate',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).selectStatusAction('Activate');
  },
);

When(
  'I confirm the activation',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).confirmStatusAction('Activate');
  },
);

Then(
  'the underwriter should be activated successfully',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwriterActivated();
  },
);

// ==========================================================
// NEGATIVE SCENARIOS - MANDATORY FIELD VALIDATION
// ==========================================================

When(
  'I leave all mandatory fields empty',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).leaveAllMandatoryFieldsEmpty();

    console.log('All mandatory fields left empty.');
  },
);

Then(
  'the mandatory field validation messages should be displayed',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyMandatoryValidationMessages();

    console.log('Mandatory field validation messages verified.');
  },
);

Then(
  'the underwriter should not be created',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).verifyUnderwriterNotCreated();

    console.log('Verified that the underwriter was not created.');
  },
);

// ==========================================================
// LOGOUT
// ==========================================================

When(
  'I log out from Broker Nexus',
  async function (this: CustomWorld) {
    await getUnderwritersPage(this).logoutFromBrokerNexus();

    console.log('Logged out from Broker Nexus.');
  },
);

Then(
  'I should be redirected to the login page',
  async function (this: CustomWorld) {
    const page = getPage(this);

    await expect(
      page.getByRole('textbox', {
        name: 'Email Address *',
      }),
    ).toBeVisible({ timeout: 15000 });

    console.log('Successfully redirected to the Broker Nexus login page.');
  },
);