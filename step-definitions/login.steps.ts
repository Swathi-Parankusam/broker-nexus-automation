import {
    Given,
    When,
    Then
} from '@cucumber/cucumber';

import { LoginPage } from '../pages/LoginPage.ts';
import type { CustomWorld } from '../support/world.ts';

// =====================================================
// HELPER 1: GET PLAYWRIGHT PAGE SAFELY
// =====================================================

function getPage(world: CustomWorld) {
    if (!world.page) {
        throw new Error(
            'Browser page is not initialized. Please check support/hooks.ts.'
        );
    }

    return world.page;
}

// =====================================================
// HELPER 2: GET LOGIN PAGE
// =====================================================

function getLoginPage(world: CustomWorld): LoginPage {
    const page = getPage(world);

    if (!world.loginPage) {
        world.loginPage = new LoginPage(page);
    }

    return world.loginPage;
}

// =====================================================
// HELPER 3: GET ENVIRONMENT VARIABLES
// =====================================================

function getCredential(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `${name} is missing or empty. Please check your POSO .env file.`
        );
    }

    return value;
}

// =====================================================
// HELPER 4: DEMO PAUSE
// =====================================================

async function demoPause(
    world: CustomWorld,
    milliseconds = 1500
): Promise<void> {
    const page = getPage(world);

    if (process.env.DEMO_MODE === 'true') {
        await page.waitForTimeout(milliseconds);
    }
}

// =====================================================
// 1. OPEN POSO LOGIN PAGE
// =====================================================

Given(
    'I open the POSO login page',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Opening POSO login page...');

        await loginPage.navigate();
        await loginPage.verifyLoginFormVisible();

        await demoPause(this);

        console.log('POSO login page displayed.');
    }
);

// =====================================================
// 2. VERIFY EMAIL ADDRESS FIELD
// =====================================================

Then(
    'the Email Address field should be visible',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await loginPage.verifyEmailFieldVisible();
        await demoPause(this);

        console.log('Email Address field is visible.');
    }
);

// =====================================================
// 3. VERIFY EMAIL ADDRESS PLACEHOLDER
// =====================================================

Then(
    'the Email Address placeholder should be displayed',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await loginPage.verifyEmailPlaceholder();
        await demoPause(this);

        console.log('Email Address placeholder verified.');
    }
);

// =====================================================
// 4. VERIFY PASSWORD FIELD
// =====================================================

Then(
    'the Password field should be visible',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await loginPage.verifyPasswordFieldVisible();
        await demoPause(this);

        console.log('Password field is visible.');
    }
);

// =====================================================
// 5. VERIFY PASSWORD IS MASKED BY DEFAULT
// =====================================================

Then(
    'the Password field should be masked',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await loginPage.verifyPasswordMasked();
        await demoPause(this);

        console.log('Password is masked.');
    }
);

// =====================================================
// 6. VERIFY PASSWORD VISIBILITY ICON
// =====================================================

Then(
    'the password visibility icon should be visible',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await loginPage.verifyPasswordVisibilityIcon();
        await demoPause(this);

        console.log('Password visibility icon is visible.');
    }
);

// =====================================================
// 7. ENTER PASSWORD
// =====================================================

When(
    'I enter password {string}',
    async function (
        this: CustomWorld,
        password: string
    ) {
        const loginPage = getLoginPage(this);

        await loginPage.enterPassword(password);
        await demoPause(this);

        console.log('Password entered.');
    }
);

// =====================================================
// 8. CLICK PASSWORD VISIBILITY ICON
// =====================================================

When(
    'I click the password visibility icon',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await loginPage.clickPasswordVisibilityIcon();
        await demoPause(this);

        console.log('Password visibility icon clicked.');
    }
);

// =====================================================
// 9. VERIFY PASSWORD IS DISPLAYED IN PLAIN TEXT
// =====================================================

Then(
    'the Password field should be displayed in plain text',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await loginPage.verifyPasswordVisibleAsText();
        await demoPause(this);

        console.log('Password is displayed in plain text.');
    }
);

// =====================================================
// 10. ENTER EMAIL ADDRESS
// =====================================================

When(
    'I enter email {string}',
    async function (
        this: CustomWorld,
        email: string
    ) {
        const loginPage = getLoginPage(this);

        await loginPage.enterEmail(email);
        await demoPause(this);

        console.log('Email address entered.');
    }
);

// =====================================================
// 11. ENTER VALID POSO LOGIN CREDENTIALS
// =====================================================

When(
    'I enter valid login credentials',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        const email = getCredential('POSO_EMAIL');
        const password = getCredential('POSO_PASSWORD');

        console.log('Entering valid POSO login credentials...');

        await loginPage.enterEmail(email);
        await demoPause(this);

        await loginPage.enterPassword(password);
        await demoPause(this);

        console.log('POSO login credentials entered.');
    }
);

// =====================================================
// 12. SUBMIT LOGIN FORM
// =====================================================

async function submitLogin(world: CustomWorld): Promise<void> {
    const loginPage = getLoginPage(world);

    console.log('Submitting POSO login form...');

    await loginPage.clickLogin();
    await demoPause(world, 2000);

    console.log('POSO login form submitted.');
}

When(
    'I submit the login form',
    async function (this: CustomWorld) {
        await submitLogin(this);
    }
);

When(
    'I click the Login button',
    async function (this: CustomWorld) {
        await submitLogin(this);
    }
);

// =====================================================
// 13. VERIFY SUCCESSFUL LOGIN
// =====================================================

Then(
    'I should be logged in successfully',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Verifying successful POSO login...');

        await loginPage.verifyLoginSuccessful();
        await demoPause(this);

        console.log('POSO login success verified.');
    }
);

// =====================================================
// 14. VERIFY HOMEPAGE AFTER LOGIN
// =====================================================

Then(
    'I should see the homepage',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Verifying POSO homepage...');

        await loginPage.verifyHomepageVisible();
        await demoPause(this);

        console.log('POSO homepage is visible.');
    }
);

// =====================================================
// 15. ENTER A PASSWORD CONTAINING ONLY SPACES
// =====================================================

When(
    'I enter a password containing only spaces',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Entering whitespace-only password...');

        await loginPage.enterPassword('   ');
        await demoPause(this);

        console.log('Whitespace-only password entered.');
    }
);

// =====================================================
// 16. VERIFY LOGIN IS REJECTED
// =====================================================

Then(
    'login should be rejected',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Verifying POSO login rejection...');

        await loginPage.verifyLoginRejected();
        await demoPause(this);

        console.log('POSO login rejection verified.');
    }
);

// =====================================================
// 17. OPEN ACCOUNT MENU
// =====================================================

async function openAccountMenu(world: CustomWorld): Promise<void> {
    const loginPage = getLoginPage(world);

    console.log('Opening POSO Account menu...');

    await loginPage.clickAccountMenu();
    await demoPause(world);

    console.log('POSO Account menu opened.');
}

When(
    'I open the Account menu',
    async function (this: CustomWorld) {
        await openAccountMenu(this);
    }
);

When(
    'I click the Profile Icon',
    async function (this: CustomWorld) {
        await openAccountMenu(this);
    }
);

// =====================================================
// 18. CLICK SIGN OUT OPTION
// =====================================================

async function signOut(world: CustomWorld): Promise<void> {
    const loginPage = getLoginPage(world);

    console.log('Clicking POSO Sign out option...');

    await loginPage.clickLogoutOption();
    await demoPause(world, 2000);

    console.log('POSO Sign out option clicked.');
}

When(
    'I click the Sign out option',
    async function (this: CustomWorld) {
        await signOut(this);
    }
);

When(
    'I click the Logout option',
    async function (this: CustomWorld) {
        await signOut(this);
    }
);

When(
    'I click the Logout button',
    async function (this: CustomWorld) {
        await signOut(this);
    }
);

// =====================================================
// 19. VERIFY SUCCESSFUL LOGOUT
// =====================================================

Then(
    'I should be logged out successfully',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Verifying successful POSO logout...');

        await loginPage.verifyLoggedOut();
        await demoPause(this);

        console.log('POSO logout successful.');
    }
);

// =====================================================
// 20. VERIFY REDIRECTION TO LOGIN PAGE
// =====================================================

Then(
    'I should be redirected to the login page',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Verifying redirection to POSO login page...');

        await loginPage.verifyLoggedOut();
        await demoPause(this);

        console.log('Redirected to POSO login page.');
    }
);

// =====================================================
// 21. DEBUG PASSWORD VISIBILITY ELEMENTS
// =====================================================

When(
    'I inspect the password visibility elements',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Inspecting POSO password visibility elements...');

        await loginPage.inspectPasswordVisibilityIcon();

        console.log('Password visibility inspection completed.');
    }
);
