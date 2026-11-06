import type { Locator, Page } from '@playwright/test';

import type { LocatorConfig } from './LocatorConfig.js';
import { SelfHealingLocator } from './SelfHealingLocator.js';

export class SelfHealingActions {
    private readonly healingLocator: SelfHealingLocator;

    constructor(page: Page) {
        this.healingLocator = new SelfHealingLocator(page);
    }

    // Resolve a locator using the self-healing mechanism.
    async getLocator(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {
        return await this.healingLocator.find(
            key,
            primary,
            fallbacks
        );
    }

    // Click an element.
    async click(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<void> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        await locator.click();
    }

    // Enter text into an input field.
    async fill(
        key: string,
        primary: LocatorConfig,
        value: string,
        fallbacks: LocatorConfig[] = []
    ): Promise<void> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        await locator.fill(value);
    }

    // Clear an input field.
    async clear(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<void> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        await locator.clear();
    }

    // Select an option from a dropdown.
    async selectOption(
        key: string,
        primary: LocatorConfig,
        value: Parameters<Locator['selectOption']>[0],
        fallbacks: LocatorConfig[] = []
    ): Promise<void> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        await locator.selectOption(value);
    }

    // Check a checkbox.
    async check(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<void> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        await locator.check();
    }

    // Uncheck a checkbox.
    async uncheck(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<void> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        await locator.uncheck();
    }

    // Get text content from an element.
    async textContent(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<string | null> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        return await locator.textContent();
    }

    // Verify whether an element is visible.
    async isVisible(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<boolean> {
        try {
            const locator = await this.getLocator(
                key,
                primary,
                fallbacks
            );

            return await locator.isVisible();
        } catch {
            return false;
        }
    }

    // Verify whether an element is enabled.
    async isEnabled(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<boolean> {
        try {
            const locator = await this.getLocator(
                key,
                primary,
                fallbacks
            );

            return await locator.isEnabled();
        } catch {
            return false;
        }
    }

    // Upload a file.
    async setInputFiles(
        key: string,
        primary: LocatorConfig,
        files: Parameters<Locator['setInputFiles']>[0],
        fallbacks: LocatorConfig[] = []
    ): Promise<void> {
        const locator = await this.getLocator(
            key,
            primary,
            fallbacks
        );

        await locator.setInputFiles(files);
    }
}