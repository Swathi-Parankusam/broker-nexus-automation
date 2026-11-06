import {
  setWorldConstructor,
  World,
} from '@cucumber/cucumber';

import type {
  Browser,
  BrowserContext,
  Page,
} from '@playwright/test';

import type { UnderwritersPage } from '../pages/UnderwritersPage.ts';

export class CustomWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  underwritersPage?: UnderwritersPage;
  websitePage?: Page;
}

setWorldConstructor(CustomWorld);
