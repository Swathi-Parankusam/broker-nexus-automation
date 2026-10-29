import type { Locator, Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

export type LocatorConfig =
    | { type: 'css'; value: string }
    | { type: 'xpath'; value: string }
    | { type: 'placeholder'; value: string }
    | { type: 'label'; value: string }
    | { type: 'text'; value: string }
    | { type: 'testId'; value: string }
    | { type: 'role'; role: 'button'; name: string };

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

            case 'role':
                return this.page.getByRole(config.role, {
                    name: config.name,
                    exact: true
                });
        }
    }

    private async isUniqueAndVisible(
        locator: Locator
    ): Promise<boolean> {
        try {
            if (await locator.count() !== 1) {
                return false;
            }

            return await locator.isVisible();
        } catch {
            return false;
        }
    }

    /**
     * Builds possible locator alternatives from the current DOM.
     * Only candidates matching the intended element's semantic hints
     * are considered. Ambiguous candidates are rejected.
     */
    private async discoverCandidates(
        key: string
    ): Promise<LocatorConfig[]> {
        const candidates = await this.page
            .locator(
                'input, button, textarea, select, [role="button"], [data-testid]'
            )
            .evaluateAll((elements, locatorKey) => {
                const normalizedKey = String(locatorKey)
                    .replace(/([a-z])([A-Z])/g, '$1 $2')
                    .toLowerCase();

                const words = normalizedKey
                    .split(/[^a-z0-9]+/)
                    .filter(word => word.length > 1);

                return elements.map((element) => {
                    const el = element as HTMLElement;
                    const tag = el.tagName.toLowerCase();
                    const input = el as HTMLInputElement;

                    const attributes = [
                        el.id,
                        el.getAttribute('name') ?? '',
                        el.getAttribute('placeholder') ?? '',
                        el.getAttribute('aria-label') ?? '',
                        el.getAttribute('title') ?? '',
                        el.dataset.testid ?? '',
                        el.innerText ?? ''
                    ].join(' ').toLowerCase();

                    let score = 0;

                    for (const word of words) {
                        if (attributes.includes(word)) {
                            score += 2;
                        }
                    }

                    // Semantic checks for common form elements.
                    if (
                        normalizedKey.includes('email') &&
                        (
                            input.type === 'email' ||
                            input.name.toLowerCase().includes('email')
                        )
                    ) {
                        score += 4;
                    }

                    if (
                        normalizedKey.includes('password') &&
                        input.type === 'password'
                    ) {
                        score += 4;
                    }

                    if (
                        normalizedKey.includes('login') &&
                        tag === 'button'
                    ) {
                        score += 2;
                    }

                    return {
                        tag,
                        id: el.id,
                        name: el.getAttribute('name') ?? '',
                        type: input.type ?? '',
                        placeholder:
                            el.getAttribute('placeholder') ?? '',
                        ariaLabel:
                            el.getAttribute('aria-label') ?? '',
                        title: el.getAttribute('title') ?? '',
                        text: (el.innerText ?? '').trim(),
                        testId: el.dataset.testid ?? '',
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

        // Do not guess if the best candidates are equally likely.
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
            // Use an attribute selector to avoid CSS.escape dependencies.
            config = {
                type: 'css',
                value: `[id=${JSON.stringify(best.id)}]`
            };
        } else if (best.name) {
            // JSON.stringify safely quotes and escapes the attribute value.
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

    async find(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {
        const cache = this.readCache();
        const cached = cache[key];

        // 1. Try the previously healed locator.
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

        // 3. Try configured alternatives.
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

        // 4. Discover possible alternatives from the current DOM.
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

        this.log(`HEALING_FAILED | ${key}`);

        throw new Error(
            `Self-healing failed for "${key}". ` +
            'No unique, visible locator could be identified safely.'
        );
    }
}