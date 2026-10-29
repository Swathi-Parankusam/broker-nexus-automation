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
  type Browser,
  type BrowserContext,
  type Page,
  type Video,
} from '@playwright/test';

import type { CustomWorld } from './world.ts';

import 'dotenv/config';

import fs from 'node:fs';
import path from 'node:path';

// =====================================================
// DEFAULT TIMEOUT
// =====================================================

setDefaultTimeout(60000);

// =====================================================
// DIRECTORIES
// =====================================================

const screenshotDirectory = path.resolve('screenshots');
const videoDirectory = path.resolve('videos');
const reportDirectory = path.resolve('reports');

fs.mkdirSync(screenshotDirectory, { recursive: true });
fs.mkdirSync(videoDirectory, { recursive: true });
fs.mkdirSync(reportDirectory, { recursive: true });

// =====================================================
// BROWSER CONFIGURATION
// =====================================================

let browser: Browser;

// =====================================================
// HELPER: CREATE SAFE FILE NAME
// =====================================================

function createSafeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9-_]/g, '_');
}

// =====================================================
// HELPER: CREATE TIMESTAMP
// =====================================================

function createTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, '-');
}

// =====================================================
// HELPER: CAPTURE AND ATTACH SCREENSHOT
// =====================================================

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
    console.log(`Screenshot attached: ${scenarioName}`);
  } catch (error) {
    console.error(
      `Unable to capture screenshot for ${scenarioName}:`,
      error
    );
  }
}

// =====================================================
// HELPER: CLOSE BROWSER CONTEXT
// =====================================================

async function closeBrowserContext(
  context: BrowserContext | undefined,
  scenarioName: string
): Promise<void> {
  if (!context) {
    return;
  }

  try {
    await context.close();
    console.log(`Browser context closed: ${scenarioName}`);
  } catch (error) {
    console.error(
      `Unable to close browser context for ${scenarioName}:`,
      error
    );
  }
}

// =====================================================
// HELPER: ATTACH VIDEO
// =====================================================

async function attachVideo(
  world: CustomWorld,
  video: Video | null,
  scenarioName: string
): Promise<void> {
  if (!video) {
    console.warn(`No video available: ${scenarioName}`);
    return;
  }

  try {
    // The video path becomes available after its context closes.
    const videoPath = await video.path();

    if (!fs.existsSync(videoPath)) {
      console.warn(`Video file not found: ${videoPath}`);
      return;
    }

    const videoBuffer = fs.readFileSync(videoPath);

    world.attach(videoBuffer, 'video/webm');

    console.log(`Video saved: ${videoPath}`);
    console.log(`Video attached: ${scenarioName}`);
  } catch (error) {
    console.error(
      `Unable to attach video for ${scenarioName}:`,
      error
    );
  }
}

// =====================================================
// HELPER: LOG SCENARIO RESULT
// =====================================================

function logScenarioResult(
  status: string | undefined,
  scenarioName: string
): void {
  if (status === Status.PASSED) {
    console.log(`Scenario PASSED: ${scenarioName}`);
    return;
  }

  if (status === Status.FAILED) {
    console.log(`Scenario FAILED: ${scenarioName}`);
    return;
  }

  console.log(
    `Scenario status: ${status ?? 'UNKNOWN'} - ${scenarioName}`
  );
}

// =====================================================
// BEFORE ALL SCENARIOS
// Launch the browser once.
// =====================================================

BeforeAll(async function () {
  browser = await chromium.launch({
    headless: false,
    slowMo: 3000,
  });

  console.log('Chromium browser launched successfully.');
});

// =====================================================
// BEFORE EACH SCENARIO
// Create a new context and page with video recording.
// =====================================================

Before(async function (this: CustomWorld) {
  const context: BrowserContext = await browser.newContext({
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

  const page: Page = await context.newPage();

  page.setDefaultTimeout(15000);

  this.browser = browser;
  this.context = context;
  this.page = page;

  console.log('New browser context and page created.');
});

// =====================================================
// AFTER EACH SCENARIO
// Capture screenshot, finalize video, and attach evidence.
// =====================================================

After(async function (this: CustomWorld, scenario) {
  const page = this.page;
  const context = this.context;
  const scenarioName = scenario.pickle.name;
  const timestamp = createTimestamp();

  // Obtain the video object before closing the context.
  const video: Video | null = page ? page.video() : null;

  // Capture and attach a screenshot for passed and failed scenarios.
  await captureAndAttachScreenshot(
    this,
    page,
    scenarioName,
    timestamp
  );

  // Close the context so Playwright finalizes the recording.
  await closeBrowserContext(context, scenarioName);

  // Attach the finalized video to the Cucumber scenario.
  await attachVideo(
    this,
    video,
    scenarioName
  );

  // Log the final scenario result.
  logScenarioResult(
    scenario.result?.status,
    scenarioName
  );
});

// =====================================================
// AFTER ALL SCENARIOS
// Close the browser after execution.
// =====================================================

AfterAll(async function () {
  if (!browser) {
    return;
  }

  await browser.close();

  console.log('Chromium browser closed.');
});