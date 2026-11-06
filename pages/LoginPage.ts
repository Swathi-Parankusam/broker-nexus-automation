import { expect, type Page, type Locator } from '@playwright/test';
import { SelfHealingActions } from '../utils/SelfHealingActions.js';
import type { LocatorConfig } from '../utils/LocatorConfig.js';

export class LoginPage {
    private page: Page;
    private actions: SelfHealingActions;

    private readonly timeout = 30000;
    private readonly navigationRetries = 2;

    // =====================================================
    // POSO LOGIN PAGE LOCATORS - SELF HEALING
    // =====================================================

    private emailInput: LocatorConfig = {
        type: 'css',
        value: '#email'
    };

    private passwordInput: LocatorConfig = {
        type: 'css',
        value: '#password'
    };

    private passwordVisibilityIcon: LocatorConfig = {
        type: 'altText',
        value: 'Toggle Password Visibility'
    };

    private loginButton: LocatorConfig = {
        type: 'css',
        value: 'button[type="submit"]'
    };

    private signOutOption: LocatorConfig = {
        type: 'role',
        role: 'menuitem',
        name: 'Sign out'
    };

    // =====================================================
    // DIRECT PLAYWRIGHT LOCATOR
    // =====================================================

    private accountMenu: Locator;

    constructor(page: Page) {
        this.page = page;
        this.actions = new SelfHealingActions(page);

        // Profile initial -> nearest clickable button
        this.accountMenu = this.page
            .locator('span.rounded-full')
            .locator('xpath=ancestor::button[1]');
    }

    // =====================================================
    // OPEN POSO LOGIN PAGE WITH RETRY
    // =====================================================

    async navigate(): Promise<void> {
        const url = process.env.POSO_URL;

        if (!url) {
            throw new Error(
                'POSO_URL is missing in the .env file.'
            );
        }

        console.log('Opening POSO login page...');

        let lastError: unknown;

        for (
            let attempt = 1;
            attempt <= this.navigationRetries;
            attempt++
        ) {
            try {
                console.log(
                    `Opening POSO login page - Attempt ${attempt}/${this.navigationRetries}`
                );

                await this.page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: this.timeout
                });

                await this.page.locator('#email').waitFor({
                    state: 'visible',
                    timeout: this.timeout
                });

                // Validate self-healing locators
                await this.actions.getLocator(
                    'emailInput',
                    this.emailInput
                );

                await this.actions.getLocator(
                    'passwordInput',
                    this.passwordInput
                );

                await this.actions.getLocator(
                    'passwordVisibilityIcon',
                    this.passwordVisibilityIcon
                );

                console.log(
                    'POSO login page loaded successfully.'
                );

                return;

            } catch (error) {
                lastError = error;

                console.log(
                    `POSO navigation attempt ${attempt} failed.`
                );

                if (attempt < this.navigationRetries) {
                    console.log(
                        'Retrying POSO login page navigation...'
                    );

                    await this.page.waitForTimeout(3000);
                }
            }
        }

        throw lastError;
    }

    // =====================================================
    // EMAIL FIELD
    // =====================================================

    async enterEmail(email: string): Promise<void> {
        await this.actions.fill(
            'emailInput',
            this.emailInput,
            email
        );
    }

    async verifyEmailFieldVisible(): Promise<void> {
        const email = await this.actions.getLocator(
            'emailInput',
            this.emailInput
        );

        await expect(email).toBeVisible({
            timeout: this.timeout
        });
    }

    async verifyEmailPlaceholder(): Promise<void> {
        const email = await this.actions.getLocator(
            'emailInput',
            this.emailInput
        );

        await expect(email).toHaveAttribute(
            'placeholder',
            'Enter your email ID',
            {
                timeout: this.timeout
            }
        );
    }

    // =====================================================
    // PASSWORD FIELD
    // =====================================================

    async enterPassword(password: string): Promise<void> {
        await this.actions.fill(
            'passwordInput',
            this.passwordInput,
            password
        );
    }

    async verifyPasswordFieldVisible(): Promise<void> {
        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordInput
        );

        await expect(password).toBeVisible({
            timeout: this.timeout
        });
    }

    async verifyPasswordMasked(): Promise<void> {
        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordInput
        );

        await expect(password).toHaveAttribute(
            'type',
            'password',
            {
                timeout: this.timeout
            }
        );
    }

    async verifyPasswordPlainText(): Promise<void> {
        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordInput
        );

        await expect(password).toHaveAttribute(
            'type',
            'text',
            {
                timeout: this.timeout
            }
        );
    }

    // =====================================================
    // PASSWORD VISIBILITY ICON
    // =====================================================

    async verifyPasswordVisibilityIcon(): Promise<void> {
        const icon = await this.actions.getLocator(
            'passwordVisibilityIcon',
            this.passwordVisibilityIcon
        );

        await expect(icon).toBeVisible({
            timeout: this.timeout
        });
    }

    async clickPasswordVisibilityIcon(): Promise<void> {
        await this.actions.click(
            'passwordVisibilityIcon',
            this.passwordVisibilityIcon
        );
    }

    // =====================================================
    // LOGIN BUTTON
    // =====================================================

    async clickLogin(): Promise<void> {
        await this.actions.click(
            'loginButton',
            this.loginButton
        );
    }

    // =====================================================
    // VERIFY LOGIN SUCCESS
    // =====================================================

    async verifyLoginSuccessful(): Promise<void> {
        const loginUrl = process.env.POSO_URL;

        if (!loginUrl) {
            throw new Error(
                'POSO_URL is missing in the .env file.'
            );
        }

        const initialUrl = new URL(loginUrl);

        await expect.poll(
            () => this.page.url(),
            {
                timeout: this.timeout
            }
        ).not.toBe(initialUrl.href);

        await expect(
            this.page.locator('body')
        ).toBeVisible({
            timeout: this.timeout
        });

        console.log(
            'POSO login completed successfully.'
        );
    }

    // =====================================================
    // VERIFY HOMEPAGE
    // =====================================================

    async verifyHomepageVisible(): Promise<void> {
        await expect(
            this.page.locator('body')
        ).toBeVisible({
            timeout: this.timeout
        });

        console.log(
            'POSO homepage is visible.'
        );
    }

    // =====================================================
    // ACCOUNT MENU
    // =====================================================

    async openAccountMenu(): Promise<void> {
        console.log(
            'Waiting for Profile/Account menu...'
        );

        await this.accountMenu.waitFor({
            state: 'visible',
            timeout: this.timeout
        });

        await this.accountMenu.click({
            timeout: this.timeout
        });

        console.log(
            'Profile/Account menu opened successfully.'
        );

        const signOut = await this.actions.getLocator(
            'signOutOption',
            this.signOutOption
        );

        await expect(signOut).toBeVisible({
            timeout: this.timeout
        });
    }

    // =====================================================
    // SIGN OUT
    // =====================================================

    async clickSignOut(): Promise<void> {
        const signOut = await this.actions.getLocator(
            'signOutOption',
            this.signOutOption
        );

        await expect(signOut).toBeVisible({
            timeout: this.timeout
        });

        await signOut.click({
            timeout: this.timeout
        });

        console.log(
            'POSO Sign out clicked successfully.'
        );
    }

    // =====================================================
    // LOGIN FORM VERIFICATION
    // =====================================================

    async verifyLoginFormVisible(): Promise<void> {
        const email = await this.actions.getLocator(
            'emailInput',
            this.emailInput
        );

        const password = await this.actions.getLocator(
            'passwordInput',
            this.passwordInput
        );

        await expect(email).toBeVisible({
            timeout: this.timeout
        });

        await expect(password).toBeVisible({
            timeout: this.timeout
        });
    }

    // =====================================================
    // LOGOUT VERIFICATION
    // =====================================================

    async verifyLoggedOut(): Promise<void> {
        await this.page.locator('#email').waitFor({
            state: 'visible',
            timeout: this.timeout
        });

        await this.verifyLoginFormVisible();

        console.log(
            'POSO logout completed successfully.'
        );
    }

    // =====================================================
    // INVALID LOGIN VERIFICATION
    // =====================================================

    async verifyLoginRejected(): Promise<void> {
        const email = this.page.locator('#email');
        const password = this.page.locator('#password');

        await expect(email).toBeVisible({
            timeout: this.timeout
        });

        await expect(password).toBeVisible({
            timeout: this.timeout
        });

        console.log(
            'POSO login was rejected.'
        );
    }

    // =====================================================
    // WHITESPACE-ONLY PASSWORD
    // =====================================================

    async enterWhitespacePassword(): Promise<void> {
        await this.enterPassword('   ');
    }

    // =====================================================
    // COMPATIBILITY METHODS FOR CUCUMBER STEP DEFINITIONS
    // =====================================================

    async verifyPasswordVisibleAsText(): Promise<void> {
        await this.verifyPasswordPlainText();
    }

    async clickAccountMenu(): Promise<void> {
        await this.openAccountMenu();
    }

    async clickLogoutOption(): Promise<void> {
        await this.clickSignOut();
    }

    async inspectPasswordVisibilityIcon(): Promise<void> {
        const icon = await this.actions.getLocator(
            'passwordVisibilityIcon',
            this.passwordVisibilityIcon
        );

        console.log(
            'Password visibility icon inspection:'
        );

        console.log(
            'Visible:',
            await icon.isVisible()
        );

        console.log(
            'Enabled:',
            await icon.isEnabled()
        );

        console.log(
            'Element:',
            await icon.evaluate(
                element => element.outerHTML
            )
        );
    }
}