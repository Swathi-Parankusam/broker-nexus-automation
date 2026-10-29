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

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  loginPage?: LoginPage;
}

setWorldConstructor(CustomWorld);
