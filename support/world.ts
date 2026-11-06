import {
    setWorldConstructor,
    World,
} from '@cucumber/cucumber';

import type {
    Browser,
    BrowserContext,
    Page,
} from '@playwright/test';

import type { LoginPage } from '../pages/LoginPage.ts';
import type { UnderwritersPage } from '../pages/UnderwritersPage.ts';

export class CustomWorld extends World {

    // Browser configuration
    browser?: Browser;
    context?: BrowserContext;
    page?: Page;

    // Page Objects
    loginPage?: LoginPage;
    underwritersPage?: UnderwritersPage;

    // Additional page reference
    websitePage?: Page;

    // Underwriter test data
    currentUnderwriterIdentifier?: string;

}

setWorldConstructor(CustomWorld);
