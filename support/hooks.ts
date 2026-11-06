import {
  BeforeAll,
  AfterAll,
  Before,
  After,
  Status,
  setDefaultTimeout,
} from '@cucumber/cucumber';

import {
  chromium,
  firefox,
  webkit,
  type Browser,
  type BrowserContext,
  type Page,
  type Video,
} from '@playwright/test';

import type { CustomWorld } from './world.ts';

import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

setDefaultTimeout(60000);

const screenshotDirectory = path.resolve('screenshots');
const videoDirectory = path.resolve('videos');
const reportDirectory = path.resolve('reports');

fs.mkdirSync(screenshotDirectory, { recursive: true });
fs.mkdirSync(videoDirectory, { recursive: true });
fs.mkdirSync(reportDirectory, { recursive: true });

let browser: Browser;

function createSafeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}

function createTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

async function captureAndAttachScreenshot(
  world: CustomWorld,
  page: Page | undefined,
  scenarioName: string,
  timestamp: string
): Promise<void> {
  if (!page || page.isClosed()) {
    console.warn(`Screenshot skipped: ${scenarioName}`);
    return;
  }

  const screenshotName =
    `${createSafeFileName(scenarioName)}_${timestamp}.png`;

  const screenshotPath = path.join(
    screenshotDirectory,
    screenshotName
  );

  try {
    const screenshotBuffer = await page.screenshot({
      path: screenshotPath,
      fullPage: true,
    });

    world.attach(screenshotBuffer, 'image/png');

    console.log(`Screenshot saved: ${screenshotPath}`);
  } catch (error) {
    console.error(`Screenshot capture failed:`, error);
  }
}

async function closeBrowserContext(
  context: BrowserContext | undefined,
  scenarioName: string
): Promise<void> {
  if (!context) return;

  try {
    await context.close();
    console.log(`Browser context closed: ${scenarioName}`);
  } catch (error) {
    console.error(`Context close failed:`, error);
  }
}

async function attachVideo(
  world: CustomWorld,
  video: Video | null,
  scenarioName: string
): Promise<void> {
  if (!video) return;

  try {
    const videoPath = await video.path();

    if (!fs.existsSync(videoPath)) return;

    const videoBuffer = fs.readFileSync(videoPath);

    world.attach(videoBuffer, 'video/webm');

    console.log(`Video attached: ${scenarioName}`);
  } catch (error) {
    console.error(`Video attachment failed:`, error);
  }
}

function logScenarioResult(
  status: string | undefined,
  scenarioName: string
): void {
  if (status === Status.PASSED) {
    console.log(`Scenario PASSED: ${scenarioName}`);
  } else if (status === Status.FAILED) {
    console.log(`Scenario FAILED: ${scenarioName}`);
  } else {
    console.log(`Scenario status: ${status ?? 'UNKNOWN'} - ${scenarioName}`);
  }
}

BeforeAll(async function () {
  const browserName = process.env.BROWSER || 'chromium';

  const launchOptions = {
    headless: false,
    slowMo: process.env.DEMO_MODE === 'true' ? 1000 : 0,
  };

  switch (browserName.toLowerCase()) {
    case 'firefox':
      browser = await firefox.launch(launchOptions);
      break;

    case 'webkit':
      browser = await webkit.launch(launchOptions);
      break;

    case 'chromium':
    default:
      browser = await chromium.launch(launchOptions);
      break;
  }

  console.log(`${browserName} browser launched successfully.`);
});

Before(async function (this: CustomWorld) {
  const context = await browser.newContext({
    viewport: {
      width: 1366,
      height: 768,
    },
    recordVideo: {
      dir: videoDirectory,
      size: {
        width: 1366,
        height: 768,
      },
    },
  });

  const page = await context.newPage();

  page.setDefaultTimeout(15000);

  this.browser = browser;
  this.context = context;
  this.page = page;

  console.log('New POSO browser context and page created.');
});

After(async function (this: CustomWorld, scenario) {
  const page = this.page;
  const context = this.context;
  const scenarioName = scenario.pickle.name;
  const timestamp = createTimestamp();

  const video: Video | null = page ? page.video() : null;

  await captureAndAttachScreenshot(
    this,
    page,
    scenarioName,
    timestamp
  );

  await closeBrowserContext(context, scenarioName);

  await attachVideo(this, video, scenarioName);

  logScenarioResult(
    scenario.result?.status,
    scenarioName
  );
});

AfterAll(async function () {
  if (browser) {
    await browser.close();
    console.log('POSO browser closed.');
  }
});
