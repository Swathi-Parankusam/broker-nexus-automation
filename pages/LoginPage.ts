import { expect, type Locator, type Page } from '@playwright/test';

export class LoginPage {
    readonly page: Page;

    readonly emailInput: Locator;
    readonly passwordInput: Locator;
    readonly passwordVisibilityIcon: Locator;
    readonly loginButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Login page locators
        this.emailInput = page.getByRole('textbox', {
            name: 'Email Address *'
        });

        this.passwordInput = page.getByRole('textbox', {
            name: 'Password *'
        });

        // Password visibility toggle is an image with this alt text
        this.passwordVisibilityIcon = page.getByAltText(
            'Toggle Password Visibility'
        );

        this.loginButton = page.getByRole('button', {
            name: 'Login Icon Login'
        });
    }

    // =====================================================
    // NAVIGATE TO LOGIN PAGE
    // =====================================================

    async navigate(): Promise<void> {
        const url = process.env.BROKER_NEXUS_URL;

        if (!url) {
            throw new Error(
                'BROKER_NEXUS_URL is missing from the .env file.'
            );
        }

        console.log('Opening Broker Nexus login page...');
        console.log('Configured URL:', url);

        await this.page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        console.log('Navigation completed.');
        console.log('Current URL:', this.page.url());
        console.log('Page title:', await this.page.title());

        // Diagnostic information for login locators
        console.log(
            'Email locator count:',
            await this.emailInput.count()
        );

        console.log(
            'Password locator count:',
            await this.passwordInput.count()
        );

        console.log(
            'Password visibility icon count:',
            await this.passwordVisibilityIcon.count()
        );

        console.log(
            'Login button locator count:',
            await this.loginButton.count()
        );

        const inputDetails = await this.page
            .locator('input')
            .evaluateAll(inputs =>
                inputs.map(input => ({
                    type: input.getAttribute('type'),
                    name: input.getAttribute('name'),
                    id: input.id,
                    placeholder: input.getAttribute('placeholder'),
                    ariaLabel: input.getAttribute('aria-label')
                }))
            );

        console.log('Input fields found on page:', inputDetails);
        console.log('Broker Nexus login page navigation completed.');
    }

    // =====================================================
    // VERIFY LOGIN FORM
    // =====================================================

    async verifyLoginFormVisible(): Promise<void> {
        await this.emailInput.waitFor({
            state: 'visible',
            timeout: 15000
        });

        await this.passwordInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.loginButton.waitFor({
            state: 'visible',
            timeout: 10000
        });

        console.log('Login form is visible.');
    }

    // =====================================================
    // EMAIL FIELD
    // =====================================================

    async enterEmail(email: string): Promise<void> {
        await this.emailInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.emailInput.fill(email);
    }

    async verifyEmailFieldVisible(): Promise<void> {
        await this.emailInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        console.log('Email field is visible.');
    }

    async verifyEmailPlaceholder(): Promise<void> {
        await this.emailInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        const placeholder =
            await this.emailInput.getAttribute('placeholder');

        console.log('Email placeholder:', placeholder);
    }

    // =====================================================
    // PASSWORD FIELD
    // =====================================================

    async enterPassword(password: string): Promise<void> {
        await this.passwordInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.passwordInput.fill(password);

        console.log('Password entered.');
    }

    async verifyPasswordFieldVisible(): Promise<void> {
        await this.passwordInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        console.log('Password field is visible.');
    }

    async verifyPasswordMasked(): Promise<void> {
        await this.passwordInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        const inputType =
            await this.passwordInput.getAttribute('type');

        if (inputType !== 'password') {
            throw new Error(
                `Expected password field type to be "password", ` +
                `but received "${inputType}".`
            );
        }

        console.log('Password field is masked.');
    }

    // =====================================================
    // PASSWORD VISIBILITY ICON
    // =====================================================

    /**
     * Verifies that the password visibility image exists
     * and is visible.
     */
    async verifyPasswordVisibilityIcon(): Promise<void> {
        const count = await this.passwordVisibilityIcon.count();

        console.log(
            'Password visibility icon count:',
            count
        );

        if (count === 0) {
            throw new Error(
                'Password visibility icon was not found. ' +
                'Expected an image with alt text ' +
                '"Toggle Password Visibility".'
            );
        }

        await this.passwordVisibilityIcon.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await expect(
            this.passwordVisibilityIcon
        ).toBeVisible();

        console.log('Password visibility icon is visible.');
    }

    /**
     * Clicks the password visibility image.
     *
     * Playwright locates the image by its accessible alt text.
     */
    async clickPasswordVisibilityIcon(): Promise<void> {
        await this.passwordVisibilityIcon.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.passwordVisibilityIcon.click();

        console.log('Password visibility icon clicked.');
    }

    /**
     * Verifies that clicking the visibility toggle
     * displays the password as plain text.
     */
    async verifyPasswordVisibleAsText(): Promise<void> {
        await this.passwordInput.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await expect(this.passwordInput).toHaveAttribute(
            'type',
            'text',
            {
                timeout: 5000
            }
        );

        console.log(
            'Password is displayed as plain text.'
        );
    }

    /**
     * Optional diagnostic method.
     *
     * Prints the password input HTML, surrounding elements,
     * buttons, and password visibility images.
     */
    async inspectPasswordVisibilityIcon(): Promise<void> {
        console.log(
            '\n========== PASSWORD FIELD DEBUG =========='
        );

        console.log(
            'Password input HTML:',
            await this.passwordInput.evaluate(
                element => element.outerHTML
            )
        );

        console.log(
            'Password parent HTML:',
            await this.passwordInput.evaluate(
                element =>
                    element.parentElement?.outerHTML ??
                    'No parent'
            )
        );

        console.log(
            'Password grandparent HTML:',
            await this.passwordInput.evaluate(
                element =>
                    element.parentElement?.parentElement?.outerHTML ??
                    'No grandparent'
            )
        );

        const buttonDetails = await this.page
            .locator('button')
            .evaluateAll(buttons =>
                buttons.map((button, index) => ({
                    index,
                    text: button.textContent?.trim(),
                    type: button.getAttribute('type'),
                    ariaLabel: button.getAttribute('aria-label'),
                    title: button.getAttribute('title'),
                    html: button.outerHTML
                }))
            );

        console.log(
            'Buttons on page:',
            JSON.stringify(buttonDetails, null, 2)
        );

        const imageDetails = await this.page
            .locator('img')
            .evaluateAll(images =>
                images.map((image, index) => ({
                    index,
                    alt: image.getAttribute('alt'),
                    src: image.getAttribute('src'),
                    html: image.outerHTML
                }))
            );

        console.log(
            'Images on page:',
            JSON.stringify(imageDetails, null, 2)
        );

        const possibleControls = await this.page
            .locator(
                '[role="button"], [aria-label], [title], ' +
                '[data-testid], svg'
            )
            .evaluateAll(elements =>
                elements.map((element, index) => ({
                    index,
                    tag: element.tagName,
                    role: element.getAttribute('role'),
                    ariaLabel: element.getAttribute('aria-label'),
                    title: element.getAttribute('title'),
                    testId: (element as HTMLElement).dataset.testid,
                    html: element.outerHTML.slice(0, 500)
                }))
            );

        console.log(
            'Potential visibility controls:',
            JSON.stringify(possibleControls, null, 2)
        );

        console.log(
            '========== END PASSWORD FIELD DEBUG ==========\n'
        );
    }

    // =====================================================
    // LOGIN BUTTON
    // =====================================================

    async clickLogin(): Promise<void> {
        await this.loginButton.waitFor({
            state: 'visible',
            timeout: 10000
        });

        await this.loginButton.click();

        console.log('Login button clicked.');
    }

    async verifyLoginButtonVisible(): Promise<void> {
        await this.loginButton.waitFor({
            state: 'visible',
            timeout: 10000
        });

        console.log('Login button is visible.');
    }

    // =====================================================
    // VERIFY SUCCESSFUL LOGIN
    // =====================================================

    async verifyLoginSuccessful(): Promise<void> {
        const configuredUrl = process.env.BROKER_NEXUS_URL;

        if (!configuredUrl) {
            throw new Error(
                'BROKER_NEXUS_URL is missing from the .env file.'
            );
        }

        const baseUrl = new URL(configuredUrl);

        const normalizePath = (pathname: string): string => {
            let end = pathname.length;

            while (end > 0 && pathname[end - 1] === '/') {
                end--;
            }

            return pathname.slice(0, end) || '/';
        };

        const configuredPath = normalizePath(baseUrl.pathname);

        await this.page.waitForURL(
            url => {
                const currentPath = normalizePath(url.pathname);

                return (
                    url.origin === baseUrl.origin &&
                    currentPath !== configuredPath &&
                    !currentPath.endsWith('/login')
                );
            },
            {
                timeout: 15000
            }
        );

        console.log('Successful-login navigation detected.');
        console.log('Current URL:', this.page.url());
    }

    async verifyHomepageVisible(): Promise<void> {
        await this.verifyLoginSuccessful();

        await this.page.locator('body').waitFor({
            state: 'visible',
            timeout: 10000
        });

        console.log('Post-login page is visible.');
    }

    // =====================================================
    // PROFILE ICON
    // =====================================================

    async clickProfileIcon(): Promise<void> {
        console.log('Looking for the profile icon...');

        const profileLocators: Locator[] = [
            this.page.getByRole('button', {
                name: /profile|account|user menu/i
            }),

            this.page.getByRole('button', {
                name: /^A$/
            }),

            this.page.locator('[aria-label*="profile" i]'),

            this.page.locator('[aria-label*="account" i]'),

            this.page.locator('[title*="profile" i]'),

            this.page.locator('[aria-haspopup="menu"]')
        ];

        for (const locator of profileLocators) {
            const count = await locator.count();

            for (let index = 0; index < count; index++) {
                const element = locator.nth(index);

                if (await element.isVisible()) {
                    await element.click();

                    console.log('Profile control clicked.');

                    return;
                }
            }
        }

        const buttons = await this.page
            .locator('button')
            .evaluateAll(elements =>
                elements.map((element, index) => ({
                    index,
                    text: element.textContent?.trim(),
                    ariaLabel: element.getAttribute('aria-label'),
                    title: element.getAttribute('title'),
                    role: element.getAttribute('role'),
                    html: element.outerHTML.slice(0, 250)
                }))
            );

        console.log(
            'Dashboard buttons for profile locator investigation:',
            buttons
        );

        throw new Error(
            'Could not find a visible profile icon. ' +
            'Review the dashboard button details in the terminal. ' +
            `Current URL: ${this.page.url()}`
        );
    }

    // =====================================================
    // LOGOUT OPTION
    // =====================================================

    async clickLogoutOption(): Promise<void> {
        console.log('Looking for the logout option...');

        const logoutLocators: Locator[] = [
            this.page.getByRole('menuitem', {
                name: /sign out|log out|logout/i
            }),

            this.page.getByRole('button', {
                name: /sign out|log out|logout/i
            }),

            this.page.getByText(
                /^(sign out|log out|logout)$/i
            )
        ];

        for (const locator of logoutLocators) {
            const count = await locator.count();

            for (let index = 0; index < count; index++) {
                const element = locator.nth(index);

                if (await element.isVisible()) {
                    await element.click();

                    console.log('Logout option clicked.');

                    return;
                }
            }
        }

        const menuElements = await this.page
            .locator(
                '[role="menu"], [role="menuitem"], ' +
                '[aria-haspopup], [aria-label*="logout" i], ' +
                '[aria-label*="sign out" i]'
            )
            .evaluateAll(elements =>
                elements.map((element, index) => ({
                    index,
                    tag: element.tagName,
                    text: element.textContent?.trim(),
                    role: element.getAttribute('role'),
                    ariaLabel: element.getAttribute('aria-label'),
                    ariaHasPopup: element.getAttribute('aria-haspopup'),
                    title: element.getAttribute('title'),
                    html: element.outerHTML.slice(0, 250)
                }))
            );

        console.log('Dashboard menu elements:', menuElements);

        throw new Error(
            'Could not find a visible logout option after clicking ' +
            'the profile icon. Review the menu element details in the terminal.'
        );
    }

    // =====================================================
    // VERIFY REDIRECTION TO LOGIN PAGE
    // =====================================================

    /*
    async verifyLoginPageRedirection(): Promise<void> {
        const configuredUrl = process.env.BROKER_NEXUS_URL;

        if (!configuredUrl) {
            throw new Error(
                'BROKER_NEXUS_URL is missing from the .env file.'
            );
        }

        const baseUrl = new URL(configuredUrl);

        const normalizePath = (pathname: string): string => {
            while (pathname.endsWith('/')) {
                pathname = pathname.slice(0, -1);
            }

            return pathname || '/';
        };

        const expectedPath = normalizePath(baseUrl.pathname);

        await this.page.waitForURL(
            url =>
                url.origin === baseUrl.origin &&
                normalizePath(url.pathname) === expectedPath,
            {
                timeout: 15000
            }
        );

        await this.verifyLoginFormVisible();

        console.log('Redirected to the login page.');
    }
    */

    // =====================================================
    // VERIFY LOGGED-OUT STATE
    // =====================================================

    async verifyLoggedOut(): Promise<void> {
        await this.verifyLoginFormVisible();

        console.log('Login form is visible after logout.');
    }

    // =====================================================
    // VERIFY INVALID LOGIN
    // =====================================================

    async verifyLoginRejected(): Promise<void> {
        await this.page.waitForTimeout(1500);

        const emailVisible =
            await this.emailInput.isVisible().catch(() => false);

        const passwordVisible =
            await this.passwordInput.isVisible().catch(() => false);

        const configuredUrl = process.env.BROKER_NEXUS_URL;

        if (!configuredUrl) {
            throw new Error(
                'BROKER_NEXUS_URL is missing from the .env file.'
            );
        }

        const currentUrl = new URL(this.page.url());
        const baseUrl = new URL(configuredUrl);

        const normalizePath = (pathname: string): string => {
            let normalizedPath = pathname;

            while (
                normalizedPath.length > 1 &&
                normalizedPath.endsWith('/')
            ) {
                normalizedPath = normalizedPath.slice(0, -1);
            }

            return normalizedPath || '/';
        };

        const currentPath = normalizePath(currentUrl.pathname);
        const configuredPath = normalizePath(baseUrl.pathname);

        const stillOnLoginPage =
            currentUrl.origin === baseUrl.origin &&
            (
                currentPath === configuredPath ||
                currentPath.endsWith('/login')
            );

        if (
            !emailVisible ||
            !passwordVisible ||
            !stillOnLoginPage
        ) {
            throw new Error(
                'Login rejection could not be confirmed. ' +
                `Current URL: ${this.page.url()}; ` +
                `Email visible: ${emailVisible}; ` +
                `Password visible: ${passwordVisible}.`
            );
        }

        console.log(
            'Login was not successful; the login form remains visible.'
        );
    }
}