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
    accept: string;
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

    // --------------------------------------------------
    // CACHE
    // --------------------------------------------------

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
                throw new Error(
                    'Cache must contain a JSON object.'
                );
            }

            return parsed as HealingCache;
        } catch (error) {
            this.log(
                `CACHE_READ_ERROR | ${String(error)}`
            );

            return {};
        }
    }

    private saveCache(
        key: string,
        config: LocatorConfig
    ): void {
        try {
            const cache = this.readCache();

            cache[key] = config;

            fs.mkdirSync(
                path.dirname(this.cachePath),
                {
                    recursive: true
                }
            );

            fs.writeFileSync(
                this.cachePath,
                JSON.stringify(cache, null, 2),
                'utf8'
            );

            this.log(
                `CACHE_SAVED | ${key} | ${JSON.stringify(config)}`
            );
        } catch (error) {
            this.log(
                `CACHE_SAVE_ERROR | ${key} | ${String(error)}`
            );
        }
    }

    // --------------------------------------------------
    // AUDIT LOG
    // --------------------------------------------------

    private log(message: string): void {
        try {
            fs.mkdirSync(
                path.dirname(this.auditPath),
                {
                    recursive: true
                }
            );

            fs.appendFileSync(
                this.auditPath,
                `${new Date().toISOString()} | ${message}\n`,
                'utf8'
            );
        } catch {
            // Logging must never interrupt test execution.
        }
    }

    // --------------------------------------------------
    // CREATE PLAYWRIGHT LOCATOR
    // --------------------------------------------------

    private createLocator(
        config: LocatorConfig
    ): Locator {
        switch (config.type) {
            case 'css':
                return this.page.locator(config.value);

            case 'xpath':
                return this.page.locator(
                    `xpath=${config.value}`
                );

            case 'placeholder':
                return this.page.getByPlaceholder(
                    config.value,
                    {
                        exact: true
                    }
                );

            case 'label':
                return this.page.getByLabel(
                    config.value,
                    {
                        exact: true
                    }
                );

            case 'text':
                return this.page.getByText(
                    config.value,
                    {
                        exact: true
                    }
                );

            case 'testId':
                return this.page.getByTestId(
                    config.value
                );

            case 'altText':
                return this.page.getByAltText(
                    config.value,
                    {
                        exact: true
                    }
                );

            case 'role':
                return this.page.getByRole(
                    config.role as Parameters<
                        Page['getByRole']
                    >[0],
                    {
                        name: config.name,
                        exact: true
                    }
                );

            default:
                throw new Error(
                    `Unsupported locator configuration: ` +
                    `${JSON.stringify(config)}`
                );
        }
    }

    // --------------------------------------------------
    // NORMALIZE TEXT
    // --------------------------------------------------

    private normalizeText(value: string): string {
        return value
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/[-_]+/g, ' ')
            .toLowerCase()
            .trim();
    }

    // --------------------------------------------------
    // CHECK WHETHER KEY REPRESENTS FILE UPLOAD
    // --------------------------------------------------

    private isFileUploadKey(key: string): boolean {
        const normalizedKey = this.normalizeText(key);

        return (
            normalizedKey.includes('upload') ||
            normalizedKey.includes('file') ||
            normalizedKey.includes('logo') ||
            normalizedKey.includes('document') ||
            normalizedKey.includes('attachment')
        );
    }

    // --------------------------------------------------
    // VALIDATE LOCATOR
    // --------------------------------------------------

    private async isUniqueAndVisible(
        locator: Locator,
        allowHiddenFileInput = false
    ): Promise<boolean> {
        try {
            const count = await locator.count();

            if (count !== 1) {
                return false;
            }

            // Normal visible element.
            if (await locator.isVisible()) {
                return true;
            }

            // Hidden file inputs are valid for setInputFiles().
            if (allowHiddenFileInput) {
                const type = await locator.getAttribute('type');

                if (type?.toLowerCase() === 'file') {
                    this.log(
                        'HIDDEN_FILE_INPUT_ACCEPTED'
                    );

                    return true;
                }
            }

            return false;
        } catch {
            return false;
        }
    }

    // --------------------------------------------------
    // DISCOVER CANDIDATES
    // --------------------------------------------------

    private async discoverCandidates(
        key: string
    ): Promise<LocatorConfig[]> {
        const normalizedKey = this.normalizeText(key);

        const words = normalizedKey
            .split(/\s+/)
            .filter(word => word.length > 1);

        const isUploadSearch =
            this.isFileUploadKey(key);

        this.log(
            `DISCOVERY_STARTED | ${key} | ` +
            `normalized=${normalizedKey}`
        );

        // Include input[type=file] explicitly.
        const candidates = await this.page
            .locator(
                'input, button, textarea, select, a, [role], [data-testid]'
            )
            .evaluateAll(
                (elements, searchData) => {
                    const {
                        normalizedKey,
                        words,
                        isUploadSearch
                    } = searchData;

                    const normalize = (
                        value: string
                    ): string => {
                        return value
                            .replace(
                                /([a-z])([A-Z])/g,
                                '$1 $2'
                            )
                            .replace(
                                /[-_]+/g,
                                ' '
                            )
                            .toLowerCase()
                            .trim();
                    };

                    return elements.map(element => {
                        const el =
                            element as HTMLElement;

                        const tag =
                            el.tagName.toLowerCase();

                        const input =
                            el as HTMLInputElement;

                        const id =
                            el.id ?? '';

                        const name =
                            el.getAttribute('name') ?? '';

                        const type =
                            el.getAttribute('type') ?? '';

                        const placeholder =
                            el.getAttribute(
                                'placeholder'
                            ) ?? '';

                        const ariaLabel =
                            el.getAttribute(
                                'aria-label'
                            ) ?? '';

                        const title =
                            el.getAttribute(
                                'title'
                            ) ?? '';

                        const testId =
                            el.getAttribute(
                                'data-testid'
                            ) ?? '';

                        const accept =
                            el.getAttribute(
                                'accept'
                            ) ?? '';

                        const text =
                            (
                                el.innerText ??
                                el.textContent ??
                                ''
                            ).trim();

                        const attributes = [
                            id,
                            name,
                            type,
                            placeholder,
                            ariaLabel,
                            title,
                            testId,
                            accept,
                            text
                        ]
                            .join(' ');

                        const normalizedAttributes =
                            normalize(attributes);

                        const normalizedId =
                            normalize(id);

                        const normalizedName =
                            normalize(name);

                        let score = 0;

                        // ----------------------------------
                        // EXACT MATCHES
                        // ----------------------------------

                        if (
                            normalizedId === normalizedKey
                        ) {
                            score += 50;
                        }

                        if (
                            normalizedName === normalizedKey
                        ) {
                            score += 45;
                        }

                        if (
                            normalizedAttributes.includes(
                                normalizedKey
                            )
                        ) {
                            score += 20;
                        }

                        // ----------------------------------
                        // WORD MATCHING
                        // ----------------------------------

                        let matchedWords = 0;

                        for (const word of words) {
                            if (
                                normalizedAttributes.includes(
                                    word
                                )
                            ) {
                                matchedWords++;
                                score += 5;
                            }
                        }

                        if (
                            words.length > 0 &&
                            matchedWords === words.length
                        ) {
                            score += 15;
                        }

                        // ----------------------------------
                        // EMAIL
                        // ----------------------------------

                        if (
                            normalizedKey.includes('email') &&
                            (
                                type.toLowerCase() === 'email' ||
                                normalizedId.includes('email') ||
                                normalizedName.includes('email') ||
                                normalize(
                                    placeholder
                                ).includes('email')
                            )
                        ) {
                            score += 20;
                        }

                        // ----------------------------------
                        // PASSWORD
                        // ----------------------------------

                        if (
                            normalizedKey.includes(
                                'password'
                            ) &&
                            (
                                type.toLowerCase() === 'password' ||
                                normalizedId.includes(
                                    'password'
                                ) ||
                                normalizedName.includes(
                                    'password'
                                ) ||
                                normalize(
                                    placeholder
                                ).includes(
                                    'password'
                                )
                            )
                        ) {
                            score += 20;
                        }

                        // ----------------------------------
                        // COMPANY NAME
                        // ----------------------------------

                        if (
                            normalizedKey.includes(
                                'company'
                            ) &&
                            normalizedKey.includes(
                                'name'
                            ) &&
                            (
                                normalizedId.includes(
                                    'company name'
                                ) ||
                                normalizedName.includes(
                                    'company'
                                ) ||
                                normalize(
                                    placeholder
                                ).includes(
                                    'company name'
                                )
                            )
                        ) {
                            score += 20;
                        }

                        // ----------------------------------
                        // FILE UPLOAD
                        // ----------------------------------

                        if (
                            isUploadSearch &&
                            tag === 'input' &&
                            type.toLowerCase() === 'file'
                        ) {
                            // File inputs should receive a
                            // strong score even if hidden.
                            score += 40;

                            if (
                                normalizedId.includes(
                                    'logo'
                                )
                            ) {
                                score += 20;
                            }

                            if (
                                normalizedId.includes(
                                    'upload'
                                )
                            ) {
                                score += 15;
                            }

                            if (
                                normalizedKey.includes(
                                    'logo'
                                ) &&
                                normalizedId.includes(
                                    'logo'
                                )
                            ) {
                                score += 25;
                            }

                            if (
                                normalizedKey.includes(
                                    'upload'
                                ) &&
                                normalizedId.includes(
                                    'upload'
                                )
                            ) {
                                score += 25;
                            }
                        }

                        // ----------------------------------
                        // LOGIN BUTTON
                        // ----------------------------------

                        if (
                            tag === 'button' &&
                            normalizedKey.includes(
                                'login'
                            )
                        ) {
                            score += 10;
                        }

                        return {
                            tag,
                            id,
                            name,
                            type,
                            placeholder,
                            ariaLabel,
                            title,
                            text,
                            testId,
                            accept,
                            score
                        };
                    });
                },
                {
                    normalizedKey,
                    words,
                    isUploadSearch
                }
            ) as Candidate[];

        const ranked = candidates
            .filter(
                candidate =>
                    candidate.score > 0
            )
            .sort(
                (a, b) =>
                    b.score - a.score
            );

        this.log(
            `DISCOVERY_CANDIDATES | ${key} | ` +
            JSON.stringify(
                ranked.slice(0, 10)
            )
        );

        if (ranked.length === 0) {
            return [];
        }

        const best = ranked[0];

        // Reject only genuinely ambiguous candidates.
        if (
            ranked.length > 1 &&
            best.score === ranked[1].score
        ) {
            this.log(
                `DISCOVERY_AMBIGUOUS | ${key} | ` +
                `topScore=${best.score}`
            );

            return [];
        }

        let config: LocatorConfig | undefined;

        // ----------------------------------------------
        // LOCATOR PRIORITY
        // ----------------------------------------------

        if (best.testId) {
            config = {
                type: 'testId',
                value: best.testId
            };
        } else if (best.id) {
            config = {
                type: 'css',
                value: `#${best.id}`
            };
        } else if (
            best.name &&
            (
                best.tag === 'input' ||
                best.tag === 'textarea' ||
                best.tag === 'select'
            )
        ) {
            config = {
                type: 'css',
                value:
                    `${best.tag}[name="${best.name}"]`
            };
        } else if (best.placeholder) {
            config = {
                type: 'placeholder',
                value: best.placeholder
            };
        } else if (
            best.ariaLabel &&
            best.tag === 'button'
        ) {
            config = {
                type: 'role',
                role: 'button',
                name: best.ariaLabel
            };
        } else if (
            best.title &&
            best.tag === 'button'
        ) {
            config = {
                type: 'role',
                role: 'button',
                name: best.title
            };
        } else if (
            best.text &&
            (
                best.tag === 'button' ||
                best.tag === 'a'
            )
        ) {
            config = {
                type: 'text',
                value: best.text
            };
        }

        if (config) {
            this.log(
                `DISCOVERY_SELECTED | ${key} | ` +
                `score=${best.score} | ` +
                `${JSON.stringify(config)}`
            );

            return [config];
        }

        return [];
    }

    // --------------------------------------------------
    // MAIN SELF-HEALING METHOD
    // --------------------------------------------------

    async find(
        key: string,
        primary: LocatorConfig,
        fallbacks: LocatorConfig[] = []
    ): Promise<Locator> {
        this.log(
            `FIND_STARTED | ${key}`
        );

        const allowHiddenFileInput =
            this.isFileUploadKey(key);

        const cache = this.readCache();
        const cached = cache[key];

        // ----------------------------------------------
        // 1. TRY CACHED LOCATOR
        // ----------------------------------------------

        if (cached) {
            const cachedLocator =
                this.createLocator(cached);

            if (
                await this.isUniqueAndVisible(
                    cachedLocator,
                    allowHiddenFileInput
                )
            ) {
                this.log(
                    `CACHE_HIT | ${key} | ` +
                    `${JSON.stringify(cached)}`
                );

                return cachedLocator;
            }

            this.log(
                `CACHE_STALE | ${key}`
            );
        }

        // ----------------------------------------------
        // 2. TRY PRIMARY LOCATOR
        // ----------------------------------------------

        const originalLocator =
            this.createLocator(primary);

        if (
            await this.isUniqueAndVisible(
                originalLocator,
                allowHiddenFileInput
            )
        ) {
            this.log(
                `ORIGINAL_OK | ${key}`
            );

            return originalLocator;
        }

        this.log(
            `ORIGINAL_FAILED | ${key} | ` +
            `${JSON.stringify(primary)}`
        );

        // ----------------------------------------------
        // 3. TRY FALLBACKS
        // ----------------------------------------------

        for (const fallback of fallbacks) {
            const locator =
                this.createLocator(fallback);

            if (
                await this.isUniqueAndVisible(
                    locator,
                    allowHiddenFileInput
                )
            ) {
                this.saveCache(
                    key,
                    fallback
                );

                this.log(
                    `HEALED_BY_FALLBACK | ${key} | ` +
                    `${JSON.stringify(fallback)}`
                );

                return locator;
            }
        }

        // ----------------------------------------------
        // 4. DOM DISCOVERY
        // ----------------------------------------------

        const discovered =
            await this.discoverCandidates(key);

        for (const candidate of discovered) {
            const locator =
                this.createLocator(candidate);

            if (
                await this.isUniqueAndVisible(
                    locator,
                    allowHiddenFileInput
                )
            ) {
                this.saveCache(
                    key,
                    candidate
                );

                this.log(
                    `HEALED_BY_DISCOVERY | ${key} | ` +
                    `${JSON.stringify(candidate)}`
                );

                return locator;
            }
        }

        // ----------------------------------------------
        // 5. FAILED
        // ----------------------------------------------

        this.log(
            `HEALING_FAILED | ${key}`
        );

        throw new Error(
            `Self-healing failed for "${key}". ` +
            'No suitable unique locator could be identified safely.'
        );
    }
}