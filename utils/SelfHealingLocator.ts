import type { Locator, Page } from '@playwright/test';
import type { LocatorConfig } from './LocatorConfig.js';

import fs from 'node:fs';
import path from 'node:path';

type HealingCache = Record<string, LocatorConfig>;

type Candidate = {
    tag: string;
    id: string;
    name: string;
    type: string;
    placeholder: string;
    ariaLabel: string;
    title: string;
    text: string;
    testId: string;
    score: number;
};

export class SelfHealingLocator {
    private readonly page: Page;
    private readonly cachePath: string;
    private readonly auditPath: string;

    constructor(page: Page) {
        this.page = page;

        this.cachePath = path.resolve(
            process.cwd(),
            'resources',
            'healing-cache.json'
        );

        this.auditPath = path.resolve(
            process.cwd(),
            'healing-logs',
            'healing-audit.log'
        );
    }

    // Read previously healed locators.
    private readCache(): HealingCache {
        if (!fs.existsSync(this.cachePath)) {
            return {};
        }

        try {
            const content = fs.readFileSync(
                this.cachePath,
                'utf8'
            ).trim();

            if (!content) {
                return {};
            }

            const parsed: unknown = JSON.parse(content);

            if (
                typeof parsed !== 'object' ||
                parsed === null ||
                Array.isArray(parsed)
            ) {
                throw new Error('Cache must contain a JSON object.');
            }

            return parsed as HealingCache;
        } catch (error) {
            throw new Error(
                `Unable to read healing cache: ${String(error)}`
            );
        }
    }

    // Save a successfully healed locator.
    private saveCache(
        key: string,
        config: LocatorConfig
    ): void {
        const cache = this.readCache();

        cache[key] = config;

        fs.mkdirSync(path.dirname(this.cachePath), {
            recursive: true
        });

        fs.writeFileSync(
            this.cachePath,
            JSON.stringify(cache, null, 2),
            'utf8'
        );
    }

    // Write healing activity to the audit log.
    private log(message: string): void {
        fs.mkdirSync(path.dirname(this.auditPath), {
            recursive: true
        });

        fs.appendFileSync(
            this.auditPath,
            `${new Date().toISOString()} | ${message}\n`,
            'utf8'
        );
    }

    // Convert locator configuration into a Playwright locator.
    private createLocator(config: LocatorConfig): Locator {
    switch (config.type) {
        case 'css':
            return this.page.locator(config.value);

        case 'xpath':
            return this.page.locator(`xpath=${config.value}`);

        case 'placeholder':
            return this.page.getByPlaceholder(config.value, {
                exact: true
            });

        case 'label':
            return this.page.getByLabel(config.value, {
                exact: true
            });

        case 'text':
            return this.page.getByText(config.value, {
                exact: true
            });

        case 'testId':
            return this.page.getByTestId(config.value);

        case 'altText':
            return this.page.getByAltText(config.value, {
                exact: true
            });

        case 'role':
            return this.page.getByRole(
                config.role as Parameters<Page['getByRole']>[0],
                {
                    name: config.name,
                    exact: true
                }
            );

        default:
            throw new Error(
                `Unsupported locator configuration: ${JSON.stringify(config)}`
            );
    }
}

    // Check whether a locator identifies exactly one visible element.
    private async isUniqueAndVisible(
        locator: Locator
    ): Promise<boolean> {
        try {
            const count = await locator.count();

            if (count !== 1) {
                return false;
            }

            return await locator.isVisible();
        } catch {
            return false;
        }
    }

    // Discover possible alternatives using semantic DOM information.
    private async discoverCandidates(
        key: string
    ): Promise<LocatorConfig[]> {
        const candidates = await this.page
            .locator(
                'input, button, textarea, select, a, [role], [data-testid]'
            )
            .evaluateAll((elements, locatorKey) => {
                const normalizedKey = String(locatorKey)
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .toLowerCase();

                const words = normalizedKey
                    .split(/[^a-z0-9]+/)
                    .filter(word => word.length > 1);

                return elements.map(element => {
                    const el = element as HTMLElement;
                    const tag = el.tagName.toLowerCase();

                    const input = el as HTMLInputElement;

                    const name =
                        el.getAttribute('name') ?? '';

                    const placeholder =
                        el.getAttribute('placeholder') ?? '';

                    const ariaLabel =
                        el.getAttribute('aria-label') ?? '';

                    const title =
                        el.getAttribute('title') ?? '';

                    const testId =
                        el.getAttribute('data-testid') ?? '';

                    const text =
                        (el.innerText ?? '').trim();

                    const id = el.id ?? '';

                    const attributes = [
                        id,
                        name,
                        placeholder,
                        ariaLabel,
                        title,
                        testId,
                        text
                    ].join(' ').toLowerCase();

                    let score = 0;

                    for (const word of words) {
                        if (attributes.includes(word)) {
                            score += 2;
                        }
                    }

                    // Email fields must have email-related evidence.
                    if (
                        normalizedKey.includes('email') &&
                        (
                            input.type === 'email' ||
                            name.toLowerCase().includes('email') ||
                            placeholder.toLowerCase().includes('email')
                        )
                    ) {
                        score += 4;
                    }

                    // Password fields must have password-related evidence.
                    if (
                        normalizedKey.includes('password') &&
                        (
                            input.type === 'password' ||
                            name.toLowerCase().includes('password') ||
                            placeholder.toLowerCase().includes('password')
                        )
                    ) {
                        score += 4;
                    }

                    // Login-related candidates must be actionable buttons.
                    if (
                        normalizedKey.includes('login') &&
                        tag === 'button'
                    ) {
                        score += 2;
                    }

                    return {
                        tag,
                        id,
                        name,
                        type: input.type ?? '',
                        placeholder,
                        ariaLabel,
                        title,
                        text,
                        testId,
                        score
                    };
                });
            }, key) as Candidate[];

        const ranked = candidates
            .filter(candidate => candidate.score >= 4)
            .sort((a, b) => b.score - a.score);

        if (ranked.length === 0) {
            return [];
        }

        // Reject equally ranked candidates rather than guessing.
        if (
            ranked.length > 1 &&
            ranked[0].score === ranked[1].score
        ) {
            this.log(
                `DISCOVERY_AMBIGUOUS | ${key} | ` +
                `top score=${ranked[0].score}`
            );

            return [];
        }

        const best = ranked[0];

        let config: LocatorConfig | undefined;

        if (best.testId) {
            config = {
                type: 'testId',
                value: best.testId
            };
        } else if (best.id) {
            config = {
                type: 'css',
                value: `[id=${JSON.stringify(best.id)}]`
            };
        } else if (best.name && (
            best.tag === 'input' ||
            best.tag === 'textarea' ||
            best.tag === 'select'
        )) {
            config = {
                type: 'css',
                value: `${best.tag}[name=${JSON.stringify(best.name)}]`
            };
        } else if (best.placeholder) {
            config = {
                type: 'placeholder',
                value: best.placeholder
            };
        } else if (best.ariaLabel && best.tag === 'button') {
            config = {
                type: 'role',
                role: 'button',
                name: best.ariaLabel
            };
        } else if (best.title && best.tag === 'button') {
            config = {
                type: 'role',
                role: 'button',
                name: best.title
            };
        } else if (best.text && best.tag === 'button') {
            config = {
                type: 'role',
                role: 'button',
                name: best.text
            };
        }

        return config ? [config] : [];
    }

    // Main locator resolution method.
    async find(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {
        const cache = this.readCache();
        const cached = cache[key];

        // 1. Try the cached locator.
        if (cached) {
            const cachedLocator = this.createLocator(cached);

            if (await this.isUniqueAndVisible(cachedLocator)) {
                this.log(
                    `CACHE_HIT | ${key} | ${JSON.stringify(cached)}`
                );

                return cachedLocator;
            }

            this.log(`CACHE_STALE | ${key}`);
        }

        // 2. Try the original locator.
        const originalLocator = this.createLocator(primary);

        if (await this.isUniqueAndVisible(originalLocator)) {
            this.log(`ORIGINAL_OK | ${key}`);

            return originalLocator;
        }

        this.log(`ORIGINAL_FAILED | ${key}`);

        // 3. Try explicitly configured fallbacks.
        for (const fallback of fallbacks) {
            const locator = this.createLocator(fallback);

            if (await this.isUniqueAndVisible(locator)) {
                this.saveCache(key, fallback);

                this.log(
                    `HEALED_BY_FALLBACK | ${key} | ` +
                    `${JSON.stringify(fallback)}`
                );

                return locator;
            }
        }

        // 4. Try DOM-based discovery.
        const discovered = await this.discoverCandidates(key);

        for (const candidate of discovered) {
            const locator = this.createLocator(candidate);

            if (await this.isUniqueAndVisible(locator)) {
                this.saveCache(key, candidate);

                this.log(
                    `HEALED_BY_DISCOVERY | ${key} | ` +
                    `${JSON.stringify(candidate)}`
                );

                return locator;
            }
        }

        // 5. No safe locator found.
        this.log(`HEALING_FAILED | ${key}`);

        throw new Error(
            `Self-healing failed for "${key}". ` +
            'No unique, visible locator could be identified safely.'
        );
    }
}