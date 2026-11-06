import { expect, type Page } from '@playwright/test';

import { SelfHealingActions } from '../utils/SelfHealingActions.js';
import type { LocatorConfig } from '../utils/LocatorConfig.js';

export class LoginPage {
    readonly page: Page;
    readonly actions: SelfHealingActions;

    // =====================================================
    // CENTRALIZED LOCATOR CONFIGURATIONS
    // =====================================================

    private readonly emailLocator: LocatorConfig = {
        type: 'role',
        role: 'textbox',
        name: 'Email Address *'
    };

    private readonly passwordLocator: LocatorConfig = {
        type: 'role',
        role: 'textbox',
        name: 'Password *'
    };

    private readonly passwordVisibilityLocator: LocatorConfig = {
        type: 'altText',
        value: 'Toggle Password Visibility'
    };

    private readonly loginButtonLocator: LocatorConfig = {
        type: 'role',
        role: 'button',
        name: 'Login Icon Login'
    };

    // =====================================================
    // CONSTRUCTOR
    // =====================================================

    constructor(page: Page) {
        this.page = page;
        this.actions = new SelfHealingActions(page);
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

        const email = await this.actions.getLocator(
            'emailInput',
            this.emailLocator
        );

        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordLocator
        );

        const visibilityIcon = await this.actions.getLocator(
            'passwordVisibilityIcon',
            this.passwordVisibilityLocator
        );

        const loginButton = await this.actions.getLocator(
            'loginButton',
            this.loginButtonLocator
        );

        console.log('Email locator count:', await email.count());
        console.log('Password locator count:', await password.count());

        console.log(
            'Password visibility icon count:',
            await visibilityIcon.count()
        );

        console.log(
            'Login button locator count:',
            await loginButton.count()
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
        const email = await this.actions.getLocator(
            'emailInput',
            this.emailLocator
        );

        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordLocator
        );

        const loginButton = await this.actions.getLocator(
            'loginButton',
            this.loginButtonLocator
        );

        await expect(email).toBeVisible({ timeout: 15000 });
        await expect(password).toBeVisible({ timeout: 10000 });
        await expect(loginButton).toBeVisible({ timeout: 10000 });

        console.log('Login form is visible.');
    }

    // =====================================================
    // EMAIL FIELD
    // =====================================================

    async enterEmail(email: string): Promise<void> {
        await this.actions.fill(
            'emailInput',
            this.emailLocator,
            email
        );

        console.log('Email address entered.');
    }

    async verifyEmailFieldVisible(): Promise<void> {
        const email = await this.actions.getLocator(
            'emailInput',
            this.emailLocator
        );

        await expect(email).toBeVisible({ timeout: 10000 });

        console.log('Email field is visible.');
    }

    async verifyEmailPlaceholder(): Promise<void> {
        const email = await this.actions.getLocator(
            'emailInput',
            this.emailLocator
        );

        await expect(email).toHaveAttribute(
            'placeholder',
            'Enter your email ID'
        );

        console.log('Email Address placeholder verified.');
    }

    // =====================================================
    // PASSWORD FIELD
    // =====================================================

    async enterPassword(password: string): Promise<void> {
        await this.actions.fill(
            'passwordInput',
            this.passwordLocator,
            password
        );

        console.log('Password entered.');
    }

    async verifyPasswordFieldVisible(): Promise<void> {
        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordLocator
        );

        await expect(password).toBeVisible({ timeout: 10000 });

        console.log('Password field is visible.');
    }

    async verifyPasswordMasked(): Promise<void> {
        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordLocator
        );

        await expect(password).toHaveAttribute(
            'type',
            'password'
        );

        console.log('Password field is masked.');
    }

    async verifyPasswordVisibleAsText(): Promise<void> {
        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordLocator
        );

        await expect(password).toHaveAttribute(
            'type',
            'text',
            { timeout: 5000 }
        );

        console.log('Password is displayed as plain text.');
    }

    // =====================================================
    // PASSWORD VISIBILITY ICON
    // =====================================================

    async verifyPasswordVisibilityIcon(): Promise<void> {
        const icon = await this.actions.getLocator(
            'passwordVisibilityIcon',
            this.passwordVisibilityLocator
        );

        await expect(icon).toBeVisible({ timeout: 10000 });

        console.log('Password visibility icon is visible.');
    }

    async clickPasswordVisibilityIcon(): Promise<void> {
        await this.actions.click(
            'passwordVisibilityIcon',
            this.passwordVisibilityLocator
        );

        console.log('Password visibility icon clicked.');
    }

    // =====================================================
    // PASSWORD VISIBILITY DEBUG
    // =====================================================

    async inspectPasswordVisibilityIcon(): Promise<void> {
        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordLocator
        );

        console.log('\n========== PASSWORD FIELD DEBUG ==========');

        console.log(
            'Password input HTML:',
            await password.evaluate(element => element.outerHTML)
        );

        console.log(
            'Password parent HTML:',
            await password.evaluate(
                element => element.parentElement?.outerHTML ?? 'No parent'
            )
        );

        console.log(
            'Password grandparent HTML:',
            await password.evaluate(
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

        console.log('========== END PASSWORD FIELD DEBUG ==========\n');
    }

    // =====================================================
    // LOGIN BUTTON
    // =====================================================

    async clickLogin(): Promise<void> {
        await this.actions.click(
            'loginButton',
            this.loginButtonLocator
        );

        console.log('Login button clicked.');
    }

    async verifyLoginButtonVisible(): Promise<void> {
        const loginButton = await this.actions.getLocator(
            'loginButton',
            this.loginButtonLocator
        );

        await expect(loginButton).toBeVisible({ timeout: 10000 });

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
            { timeout: 15000 }
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

        await this.actions.click(
            'profileIcon',
            {
                type: 'role',
                role: 'button',
                name: 'Profile'
            },
            [
                {
                    type: 'role',
                    role: 'button',
                    name: 'Account'
                },
                {
                    type: 'role',
                    role: 'button',
                    name: 'User menu'
                },
                {
                    type: 'role',
                    role: 'button',
                    name: 'A'
                },
                {
                    type: 'css',
                    value: '[aria-label*="profile" i]'
                },
                {
                    type: 'css',
                    value: '[aria-label*="account" i]'
                },
                {
                    type: 'css',
                    value: '[title*="profile" i]'
                },
                {
                    type: 'css',
                    value: '[aria-haspopup="menu"]'
                }
            ]
        );

        console.log('Profile control clicked.');
    }

    // =====================================================
    // LOGOUT OPTION
    // =====================================================

    async clickLogoutOption(): Promise<void> {
        console.log('Looking for the logout option...');

        await this.actions.click(
            'logoutOption',
            {
                type: 'role',
                role: 'menuitem',
                name: 'Sign out'
            },
            [
                {
                    type: 'role',
                    role: 'menuitem',
                    name: 'Log out'
                },
                {
                    type: 'role',
                    role: 'menuitem',
                    name: 'Logout'
                },
                {
                    type: 'role',
                    role: 'button',
                    name: 'Sign out'
                },
                {
                    type: 'role',
                    role: 'button',
                    name: 'Logout'
                },
                {
                    type: 'text',
                    value: 'Logout'
                }
            ]
        );

        console.log('Logout option clicked.');
    }

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

        const emailVisible = await this.actions.isVisible(
            'emailInput',
            this.emailLocator
        );

        const passwordVisible = await this.actions.isVisible(
            'passwordInput',
            this.passwordLocator
        );

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
