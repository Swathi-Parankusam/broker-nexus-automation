import {
    Given,
    When,
    Then
} from '@cucumber/cucumber';

import {
    expect,
    type Page
} from '@playwright/test';

import { LoginPage } from '../pages/LoginPage.ts';

// =====================================================
// CUSTOM WORLD TYPE
// =====================================================

type CustomWorld = {
    page?: Page | null;
};

// =====================================================
// HELPER 1: GET PLAYWRIGHT PAGE SAFELY
// =====================================================

function getPage(world: CustomWorld): Page {
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

const loginPages = new WeakMap<CustomWorld, LoginPage>();

function getLoginPage(world: CustomWorld): LoginPage {
    const page = getPage(world);

    let loginPage = loginPages.get(world);

    if (!loginPage) {
        loginPage = new LoginPage(page);
        loginPages.set(world, loginPage);
    }

    return loginPage;
}

// =====================================================
// HELPER 3: GET ENVIRONMENT VARIABLES
// =====================================================

function getCredential(name: string): string {
    const value = process.env[name];

    if (!value) {
        throw new Error(
            `${name} is missing or empty. Please check your .env file.`
        );
    }

    return value;
}

// =====================================================
// HELPER 4: DEMO PAUSE
// =====================================================

async function demoPause(
    world: CustomWorld,
    milliseconds = 3000
): Promise<void> {
    const page = getPage(world);

    await page.waitForTimeout(milliseconds);
}

// =====================================================
// HELPER 5: NORMALIZE URL
// =====================================================

function normalizeUrl(url: string): string {
    const parsedUrl = new URL(url);

    while (
        parsedUrl.pathname.length > 1 &&
        parsedUrl.pathname.endsWith('/')
    ) {
        parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
    }

    return parsedUrl.href.endsWith('/')
        ? parsedUrl.href.slice(0, -1)
        : parsedUrl.href;
}

// =====================================================
// HELPER 6: CHECK LOGIN FORM VISIBILITY
// =====================================================

async function isLoginFormVisible(
    loginPage: LoginPage
): Promise<boolean> {
    const emailVisible = await loginPage.emailInput
        .isVisible()
        .catch(() => false);

    const passwordVisible = await loginPage.passwordInput
        .isVisible()
        .catch(() => false);

    const buttonVisible = await loginPage.loginButton
        .isVisible()
        .catch(() => false);

    return emailVisible && passwordVisible && buttonVisible;
}

// =====================================================
// 1. OPEN BROKER NEXUS LOGIN PAGE
// =====================================================

Given(
    'I open the Broker Nexus login page',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Opening Broker Nexus login page...');

        await loginPage.navigate();

        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();

        await demoPause(this, 2000);

        console.log('Broker Nexus login page displayed.');
    }
);

// =====================================================
// 2. VERIFY EMAIL ADDRESS FIELD
// =====================================================

Then(
    'the Email Address field should be visible',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await expect(loginPage.emailInput).toBeVisible();

        await demoPause(this, 1500);

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

        await expect(loginPage.emailInput).toHaveAttribute(
            'placeholder',
            'Enter your email ID'
        );

        await demoPause(this, 1500);

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

        await expect(loginPage.passwordInput).toBeVisible();

        await demoPause(this, 1500);

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

        await expect(loginPage.passwordInput).toHaveAttribute(
            'type',
            'password'
        );

        await demoPause(this, 1500);

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
        await loginPage.inspectPasswordVisibilityIcon();
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

        await demoPause(this, 1500);

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

        await demoPause(this, 1500);

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

        await expect(loginPage.passwordInput).toHaveAttribute(
            'type',
            'text'
        );

        await demoPause(this, 1500);

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

        await demoPause(this, 1500);

        console.log('Email address entered.');
    }
);

// =====================================================
// 11. ENTER VALID LOGIN CREDENTIALS
// =====================================================

When(
    'I enter valid login credentials',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        const email = getCredential('BROKER_NEXUS_EMAIL');
        const password = getCredential('BROKER_NEXUS_PASSWORD');

        console.log('Entering valid login credentials...');

        await loginPage.enterEmail(email);
        await demoPause(this, 1500);

        await loginPage.enterPassword(password);
        await demoPause(this, 2000);

        console.log('Login credentials entered.');
    }
);

// =====================================================
// 12. CLICK LOGIN BUTTON
// =====================================================

When(
    'I click the Login button',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        await demoPause(this, 1500);

        console.log('Clicking Login button...');

        await loginPage.clickLogin();

        await demoPause(this, 2500);

        console.log('Login button clicked.');
    }
);

// =====================================================
// 13. VERIFY SUCCESSFUL LOGIN
// =====================================================

Then(
    'I should be logged in successfully',
    async function (this: CustomWorld) {
        const page = getPage(this);
        const loginPage = getLoginPage(this);

        const baseUrl = normalizeUrl(
            getCredential('BROKER_NEXUS_URL')
        );

        console.log('Verifying successful login...');

        await expect.poll(
            async () => {
                const currentUrl = normalizeUrl(page.url());

                const loginButtonVisible = await loginPage.loginButton
                    .isVisible()
                    .catch(() => false);

                return (
                    currentUrl !== baseUrl ||
                    !loginButtonVisible
                );
            },
            {
                message:
                    'Login was not confirmed. Expected navigation away from the login page or the Login button to disappear.',
                timeout: 15000,
                intervals: [500, 1000, 2000]
            }
        ).toBe(true);

        await demoPause(this, 2000);

        console.log('Login success condition verified.');
    }
);

// =====================================================
// 14. VERIFY HOMEPAGE AFTER LOGIN
// =====================================================

Then(
    'I should see the homepage',
    async function (this: CustomWorld) {
        const page = getPage(this);

        console.log('Verifying Broker Nexus homepage...');

        await page.waitForLoadState('domcontentloaded');

        const baseUrl = normalizeUrl(
            getCredential('BROKER_NEXUS_URL')
        );

        await expect.poll(
            () => normalizeUrl(page.url()),
            {
                message:
                    'Expected the application to navigate away from the login page.',
                timeout: 15000,
                intervals: [500, 1000, 2000]
            }
        ).not.toBe(baseUrl);

        await expect(page.locator('body')).toBeVisible();

        await demoPause(this, 2000);

        console.log('Homepage visibility checks completed.');
    }
);

// =====================================================
// 15. ENTER A PASSWORD CONTAINING ONLY SPACES
// =====================================================

When(
    'I enter a password containing only spaces',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Entering a whitespace-only password...');

        await loginPage.enterPassword('   ');

        await demoPause(this, 1500);

        console.log('Whitespace-only password entered.');
    }
);

// =====================================================
// 16. VERIFY LOGIN IS REJECTED
// =====================================================

Then(
    'login should be rejected',
    async function (this: CustomWorld) {
        const page = getPage(this);
        const loginPage = getLoginPage(this);

        console.log('Verifying that login is rejected...');

        const baseUrl = normalizeUrl(
            getCredential('BROKER_NEXUS_URL')
        );

        await demoPause(this, 1500);

        const loginFormVisible = await isLoginFormVisible(loginPage);

        const currentUrl = normalizeUrl(page.url());

        const rejectionMessageVisible = await page.getByText(
            /invalid|incorrect|wrong|failed|required|enter.*email|enter.*password|unable to log in|authentication failed/i
        ).first().isVisible().catch(() => false);

        const remainedOnLoginPage = currentUrl === baseUrl;

        expect(
            loginFormVisible &&
            (remainedOnLoginPage || rejectionMessageVisible),
            [
                'Login rejection could not be confirmed.',
                `Current URL: ${page.url()}`,
                `Login form visible: ${loginFormVisible}`,
                `Rejection message visible: ${rejectionMessageVisible}`
            ].join('\n')
        ).toBe(true);

        await demoPause(this, 1500);

        console.log('Login rejection condition verified.');
    }
);

// =====================================================
// 17. CLICK LOGOUT BUTTON (LEGACY STEP)
// =====================================================

When(
    'I click the Logout button',
    async function (this: CustomWorld) {
        console.log('Clicking the Logout button...');

        await getPage(this).getByRole('button', { name: /logout/i }).click();

        await demoPause(this, 2000);

        console.log('Logout button clicked.');
    }
);

// =====================================================
// 18. VERIFY SUCCESSFUL LOGOUT
// =====================================================

Then(
    'I should be logged out successfully',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Verifying successful logout...');

        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();

        await demoPause(this, 2000);

        console.log('Logout successful: login form is visible.');
    }
);

// =====================================================
// 19. CLICK PROFILE ICON
// =====================================================

When(
    'I click the Profile Icon',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Clicking the Profile Icon...');

        await loginPage.clickProfileIcon();

        await demoPause(this, 1000);

        console.log('Profile Icon clicked.');
    }
);

// =====================================================
// 20. CLICK LOGOUT OPTION
// =====================================================

When(
    'I click the Logout option',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Clicking the Logout option...');

        await loginPage.clickLogoutOption();

        await demoPause(this, 2000);

        console.log('Logout option clicked.');
    }
);

// =====================================================
// 21. VERIFY REDIRECTION TO LOGIN PAGE
// =====================================================

/* Then(
    'I should be redirected to the login page',
    async function (this: CustomWorld) {
        const loginPage = getLoginPage(this);

        console.log('Verifying redirection to the login page...');

        await loginPage.verifyLoginPageRedirection();

        await expect(loginPage.emailInput).toBeVisible();
        await expect(loginPage.passwordInput).toBeVisible();
        await expect(loginPage.loginButton).toBeVisible();

        await demoPause(this, 2000);

        console.log('Redirected to the login page successfully.');
    }
); */   

// =====================================================
// 22. DEBUG: INSPECT PASSWORD VISIBILITY ELEMENTS
// =====================================================

When(
    'I inspect the password visibility elements',
    async function (this: CustomWorld) {
        console.log('Inspecting password visibility elements...');

        const passwordFields = await getPage(this)
            .locator('input[type="password"]')
            .evaluateAll((inputs) =>
                inputs.map(
                    (input) =>
                        input.parentElement?.outerHTML ??
                        input.outerHTML
                )
            );

        console.log(
            'Password visibility elements:',
            passwordFields
        );
    }
);
