# PWA Theme Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When the user switches color theme, the browser address bar color, favicon, PWA manifest, and apple-touch-icon all update to match the selected theme.

**Architecture:** A single `themeConfig.ts` serves as the source of truth for all theme colors. At build time, a `sharp`-based script reads this config to generate per-theme PNG icons, SVG favicons, and webmanifest files into `public/`. At runtime, `settingsStore.applyColorTheme()` updates `<meta>` and `<link>` tags in `document.head` to point to the current theme's assets.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vitest, sharp (devDependency), vite-plugin-pwa

---

## File Structure

| File | Responsibility |
|---|---|
| `src/theme/themeConfig.ts` | Single source of truth: theme IDs, primary colors, accent colors |
| `src/application/PwaThemeUpdater.ts` | Pure DOM functions to update meta/link tags in document.head |
| `src/stores/settingsStore.ts` | (modify) Call PwaThemeUpdater from `applyColorTheme()` |
| `src/presentation/pages/settings/Settings.vue` | (modify) Import THEMES from themeConfig instead of hardcoded array |
| `scripts/generate-pwa-icons.ts` | Build-time script: generate themed PNGs, SVGs, and webmanifests |
| `vite.config.ts` | (modify) Set `manifest: false` |
| `index.html` | (modify) Point link/meta to green-themed defaults |
| `package.json` | (modify) Add sharp, generate:icons script, prebuild hook |

Test files:
| File | Tests |
|---|---|
| `src/__tests__/theme/themeConfig.test.ts` | Validates theme config completeness and format |
| `src/__tests__/application/PwaThemeUpdater.test.ts` | Tests DOM update functions |
| `src/__tests__/stores/settingsStore.test.ts` | (expand) Tests PwaThemeUpdater integration |

---

## Task 1: Create `themeConfig.ts` with tests

**Files:**
- Create: `src/theme/themeConfig.ts`
- Create: `src/__tests__/theme/themeConfig.test.ts`

- [ ] **Step 1: Write the failing test for theme completeness**

```ts
// src/__tests__/theme/themeConfig.test.ts
import type { ColorThemeId } from "@/application/SettingsStorage";
import { THEMES } from "@/theme/themeConfig";

describe("themeConfig", () => {
    const ALL_THEME_IDS: ColorThemeId[] = ["green", "blue", "purple", "orange", "pink", "teal"];

    it("should have a definition for every ColorThemeId", () => {
        const ids = THEMES.map((t) => t.id);
        expect(ids).toEqual(expect.arrayContaining(ALL_THEME_IDS));
        expect(ids).toHaveLength(ALL_THEME_IDS.length);
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/theme/themeConfig.test.ts`
Expected: FAIL — cannot find module `@/theme/themeConfig`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/theme/themeConfig.ts
import type { ColorThemeId } from "@/application/SettingsStorage";

export interface ThemeDefinition {
    id: ColorThemeId;
    primary: string;
    accent: string;
}

export const THEMES: ThemeDefinition[] = [
    { id: "green",  primary: "#3D8A5A", accent: "#D89575" },
    { id: "blue",   primary: "#4A7AB5", accent: "#C49A5C" },
    { id: "purple", primary: "#7B5EA7", accent: "#5A9E8F" },
    { id: "orange", primary: "#C08040", accent: "#6888A5" },
    { id: "pink",   primary: "#B5607A", accent: "#5A9A8A" },
    { id: "teal",   primary: "#4A9A9A", accent: "#C07A6A" },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/theme/themeConfig.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/theme/themeConfig.ts src/__tests__/theme/themeConfig.test.ts
git commit -m "✨ feat: add themeConfig as single source of truth for theme colors"
```

- [ ] **Step 6: Write test for hex color format validation**

Add to `src/__tests__/theme/themeConfig.test.ts`:

```ts
    it("should have valid hex color format for primary and accent", () => {
        const hexPattern = /^#[0-9A-Fa-f]{6}$/;
        for (const theme of THEMES) {
            expect(theme.primary).toMatch(hexPattern);
            expect(theme.accent).toMatch(hexPattern);
        }
    });
```

- [ ] **Step 7: Run test to verify it passes (already valid)**

Run: `npx vitest run src/__tests__/theme/themeConfig.test.ts`
Expected: PASS (implementation already uses valid hex colors)

- [ ] **Step 8: Commit**

```bash
git add src/__tests__/theme/themeConfig.test.ts
git commit -m "🧪 test: add hex color format validation for themeConfig"
```

---

## Task 2: Create `PwaThemeUpdater.ts` — `updateMetaThemeColor`

**Files:**
- Create: `src/application/PwaThemeUpdater.ts`
- Create: `src/__tests__/application/PwaThemeUpdater.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/__tests__/application/PwaThemeUpdater.test.ts
import { updateMetaThemeColor } from "@/application/PwaThemeUpdater";

describe("PwaThemeUpdater", () => {
    describe("updateMetaThemeColor", () => {
        afterEach(() => {
            document.head.innerHTML = "";
        });

        it("should set meta theme-color content to the theme primary color", () => {
            const meta = document.createElement("meta");
            meta.name = "theme-color";
            meta.content = "#000000";
            document.head.appendChild(meta);

            updateMetaThemeColor("blue");

            expect(meta.content).toBe("#4A7AB5");
        });
    });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: FAIL — cannot find module `@/application/PwaThemeUpdater`

- [ ] **Step 3: Write minimal implementation**

```ts
// src/application/PwaThemeUpdater.ts
import { THEMES } from "@/theme/themeConfig";
import type { ColorThemeId } from "@/application/SettingsStorage";

const getPrimary = (id: ColorThemeId): string =>
    THEMES.find((t) => t.id === id)!.primary;

export const updateMetaThemeColor = (id: ColorThemeId): void => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (meta) meta.content = getPrimary(id);
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/PwaThemeUpdater.ts src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "✨ feat: add updateMetaThemeColor to PwaThemeUpdater"
```

- [ ] **Step 6: Write test for graceful handling when meta not found**

Add to the `updateMetaThemeColor` describe block:

```ts
        it("should not throw when meta theme-color element is missing", () => {
            expect(() => updateMetaThemeColor("blue")).not.toThrow();
        });
```

- [ ] **Step 7: Run test to verify it passes (already graceful)**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "🧪 test: add graceful handling test for updateMetaThemeColor"
```

---

## Task 3: Add `updateFavicon` to `PwaThemeUpdater`

**Files:**
- Modify: `src/application/PwaThemeUpdater.ts`
- Modify: `src/__tests__/application/PwaThemeUpdater.test.ts`

- [ ] **Step 1: Write the failing test**

Add a new describe block in `src/__tests__/application/PwaThemeUpdater.test.ts`:

```ts
    describe("updateFavicon", () => {
        afterEach(() => {
            document.head.innerHTML = "";
        });

        it("should set icon link href to themed svg path", () => {
            const link = document.createElement("link");
            link.rel = "icon";
            link.href = "/sudoku-green.svg";
            document.head.appendChild(link);

            updateFavicon("purple");

            expect(link.href).toContain("sudoku-purple.svg");
        });
    });
```

Update the import at top:

```ts
import { updateMetaThemeColor, updateFavicon } from "@/application/PwaThemeUpdater";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: FAIL — `updateFavicon` is not exported

- [ ] **Step 3: Write minimal implementation**

Add to `src/application/PwaThemeUpdater.ts`:

```ts
export const updateFavicon = (id: ColorThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}sudoku-${id}.svg`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/PwaThemeUpdater.ts src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "✨ feat: add updateFavicon to PwaThemeUpdater"
```

- [ ] **Step 6: Write graceful test**

Add to the `updateFavicon` describe block:

```ts
        it("should not throw when icon link is missing", () => {
            expect(() => updateFavicon("blue")).not.toThrow();
        });
```

- [ ] **Step 7: Run and verify**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "🧪 test: add graceful handling test for updateFavicon"
```

---

## Task 4: Add `updateManifestLink` to `PwaThemeUpdater`

**Files:**
- Modify: `src/application/PwaThemeUpdater.ts`
- Modify: `src/__tests__/application/PwaThemeUpdater.test.ts`

- [ ] **Step 1: Write the failing test**

Add a new describe block:

```ts
    describe("updateManifestLink", () => {
        afterEach(() => {
            document.head.innerHTML = "";
        });

        it("should set manifest link href to themed webmanifest path", () => {
            const link = document.createElement("link");
            link.rel = "manifest";
            link.href = "/manifest-green.webmanifest";
            document.head.appendChild(link);

            updateManifestLink("orange");

            expect(link.href).toContain("manifest-orange.webmanifest");
        });
    });
```

Update the import:

```ts
import { updateMetaThemeColor, updateFavicon, updateManifestLink } from "@/application/PwaThemeUpdater";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: FAIL — `updateManifestLink` is not exported

- [ ] **Step 3: Write minimal implementation**

Add to `src/application/PwaThemeUpdater.ts`:

```ts
export const updateManifestLink = (id: ColorThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) link.href = `${import.meta.env.BASE_URL}manifest-${id}.webmanifest`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/PwaThemeUpdater.ts src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "✨ feat: add updateManifestLink to PwaThemeUpdater"
```

- [ ] **Step 6: Write graceful test**

```ts
        it("should not throw when manifest link is missing", () => {
            expect(() => updateManifestLink("blue")).not.toThrow();
        });
```

- [ ] **Step 7: Run and verify**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "🧪 test: add graceful handling test for updateManifestLink"
```

---

## Task 5: Add `updateAppleTouchIcon` to `PwaThemeUpdater`

**Files:**
- Modify: `src/application/PwaThemeUpdater.ts`
- Modify: `src/__tests__/application/PwaThemeUpdater.test.ts`

- [ ] **Step 1: Write the failing test**

Add a new describe block:

```ts
    describe("updateAppleTouchIcon", () => {
        afterEach(() => {
            document.head.innerHTML = "";
        });

        it("should set apple-touch-icon link href to themed png path", () => {
            const link = document.createElement("link");
            link.rel = "apple-touch-icon";
            link.href = "/apple-touch-icon-green.png";
            document.head.appendChild(link);

            updateAppleTouchIcon("teal");

            expect(link.href).toContain("apple-touch-icon-teal.png");
        });
    });
```

Update the import:

```ts
import { updateMetaThemeColor, updateFavicon, updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: FAIL — `updateAppleTouchIcon` is not exported

- [ ] **Step 3: Write minimal implementation**

Add to `src/application/PwaThemeUpdater.ts`:

```ts
export const updateAppleTouchIcon = (id: ColorThemeId): void => {
    const link = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
    if (link) link.href = `${import.meta.env.BASE_URL}apple-touch-icon-${id}.png`;
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/application/PwaThemeUpdater.ts src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "✨ feat: add updateAppleTouchIcon to PwaThemeUpdater"
```

- [ ] **Step 6: Write graceful test**

```ts
        it("should not throw when apple-touch-icon link is missing", () => {
            expect(() => updateAppleTouchIcon("blue")).not.toThrow();
        });
```

- [ ] **Step 7: Run and verify**

Run: `npx vitest run src/__tests__/application/PwaThemeUpdater.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add src/__tests__/application/PwaThemeUpdater.test.ts
git commit -m "🧪 test: add graceful handling test for updateAppleTouchIcon"
```

---

## Task 6: Integrate `PwaThemeUpdater` into `settingsStore`

**Files:**
- Modify: `src/stores/settingsStore.ts`
- Modify: `src/__tests__/stores/settingsStore.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/stores/settingsStore.test.ts`:

```ts
import { updateMetaThemeColor, updateFavicon, updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";

vi.mock("@/application/PwaThemeUpdater", () => ({
    updateMetaThemeColor: vi.fn(),
    updateFavicon: vi.fn(),
    updateManifestLink: vi.fn(),
    updateAppleTouchIcon: vi.fn(),
}));
```

Add `afterEach` to clear mocks (add to the existing `beforeEach` block or add a new `afterEach`):

```ts
    afterEach(() => {
        vi.restoreAllMocks();
    });
```

Add new test:

```ts
    it("should call PwaThemeUpdater functions when setting color theme", () => {
        const store = useSettingsStore();

        store.setColorTheme("blue");

        expect(updateMetaThemeColor).toHaveBeenCalledWith("blue");
        expect(updateFavicon).toHaveBeenCalledWith("blue");
        expect(updateManifestLink).toHaveBeenCalledWith("blue");
        expect(updateAppleTouchIcon).toHaveBeenCalledWith("blue");
    });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/__tests__/stores/settingsStore.test.ts`
Expected: FAIL — `updateMetaThemeColor` not called (settingsStore doesn't call it yet)

- [ ] **Step 3: Modify settingsStore to call PwaThemeUpdater**

In `src/stores/settingsStore.ts`, add import and expand `applyColorTheme`:

```ts
import { updateMetaThemeColor, updateFavicon, updateManifestLink, updateAppleTouchIcon } from "@/application/PwaThemeUpdater";
```

Replace `applyColorTheme`:

```ts
    const applyColorTheme = () => {
        const id = colorTheme.value;
        document.documentElement.dataset.colorTheme = id;
        updateMetaThemeColor(id);
        updateFavicon(id);
        updateManifestLink(id);
        updateAppleTouchIcon(id);
    };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/__tests__/stores/settingsStore.test.ts`
Expected: PASS

- [ ] **Step 5: Run all tests to verify nothing is broken**

Run: `npx vitest run`
Expected: All tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/stores/settingsStore.ts src/__tests__/stores/settingsStore.test.ts
git commit -m "✨ feat: integrate PwaThemeUpdater into settingsStore"
```

---

## Task 7: Update `Settings.vue` to use `themeConfig`

**Files:**
- Modify: `src/presentation/pages/settings/Settings.vue`

- [ ] **Step 1: Run existing Settings tests to confirm baseline**

Run: `npx vitest run src/__tests__/presentation/Settings.test.ts`
Expected: All PASS

- [ ] **Step 2: Replace hardcoded color array with themeConfig import**

In `src/presentation/pages/settings/Settings.vue`, replace the script section's color-related code.

Remove the `ColorThemeOption` interface and `colorThemes` array. Replace with:

```ts
import { THEMES } from "@/theme/themeConfig";
```

Remove the `import type { ColorThemeId } from "@/application/SettingsStorage";` line (no longer needed directly).

In the template, replace `colorThemes` references with `THEMES`, and update property names:
- `color.hex` → `color.primary`
- `color.accentHex` → `color.accent`

The template's `v-for` becomes:

```html
                <button
                    v-for="color in THEMES"
                    :key="color.id"
```

And the style bindings:

```html
                        <div
                            class="w-1/2 h-full"
                            :style="{ backgroundColor: color.primary }"
                        />
                        <div
                            class="w-1/2 h-full"
                            :style="{ backgroundColor: color.accent }"
                        />
```

- [ ] **Step 3: Run Settings tests to verify nothing broke**

Run: `npx vitest run src/__tests__/presentation/Settings.test.ts`
Expected: All PASS (same 6 swatches rendered, same behavior)

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 5: Commit**

```bash
git add src/presentation/pages/settings/Settings.vue
git commit -m "♻️ refactor: use themeConfig in Settings.vue instead of hardcoded color array"
```

---

## Task 8: Update `index.html` and `vite.config.ts`

**Files:**
- Modify: `index.html`
- Modify: `vite.config.ts`

- [ ] **Step 1: Update index.html to use themed defaults (green)**

Replace the current head content in `index.html`:

```html
    <link href="/sudoku-green.svg" rel="icon" type="image/svg+xml" />
    <link href="/apple-touch-icon-green.png" rel="apple-touch-icon" />
```

These replace the current:
```html
    <link href="/sudoku.svg" rel="icon" type="image/svg+xml" />
    <link href="/apple-touch-icon.png" rel="apple-touch-icon" />
```

The `<meta name="theme-color" content="#3D8A5A" />` stays as-is (already green).

- [ ] **Step 2: Disable manifest generation in vite.config.ts**

In `vite.config.ts`, change the `manifest` property in the `VitePWA` config from the full manifest object to `false`:

```ts
            VitePWA({
                registerType: "autoUpdate",
                workbox: {
                    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
                    runtimeCaching: [
                        // ... keep existing runtimeCaching unchanged ...
                    ],
                },
                manifest: false,
            }),
```

Note: add `webmanifest` to `globPatterns` so the service worker precaches the manifest files.

- [ ] **Step 3: Add manifest link to index.html**

Since vite-plugin-pwa no longer generates the manifest link tag, add it manually to `index.html` `<head>`:

```html
    <link href="/manifest-green.webmanifest" rel="manifest" />
```

- [ ] **Step 4: Run all tests to verify nothing broke**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 5: Run lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add index.html vite.config.ts
git commit -m "🚧 chore: update index.html and vite config for per-theme PWA assets"
```

---

## Task 9: Create the icon generation script

**Files:**
- Create: `scripts/generate-pwa-icons.ts`
- Modify: `package.json`

- [ ] **Step 1: Install sharp**

Run: `npm install --save-dev sharp @types/sharp`

- [ ] **Step 2: Create the generation script**

```ts
// scripts/generate-pwa-icons.ts
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ThemeDef {
    id: string;
    primary: string;
}

const THEMES: ThemeDef[] = [
    { id: "green",  primary: "#3D8A5A" },
    { id: "blue",   primary: "#4A7AB5" },
    { id: "purple", primary: "#7B5EA7" },
    { id: "orange", primary: "#C08040" },
    { id: "pink",   primary: "#B5607A" },
    { id: "teal",   primary: "#4A9A9A" },
];

const MANIFEST_TEMPLATE = {
    name: "Sudoku",
    short_name: "Sudoku",
    description: "Train your brain with Sudoku puzzles",
    background_color: "#F5F5F0",
    display: "standalone" as const,
};

const PUBLIC_DIR = resolve(__dirname, "../public");
const SVG_TEMPLATE_PATH = resolve(PUBLIC_DIR, "sudoku-green.svg");

const generateThemedSvg = (svgContent: string, primary: string): string =>
    svgContent.replace(/fill="#3D8A5A"/g, `fill="${primary}"`);

const generatePngFromSvg = async (svg: string, size: number): Promise<Buffer> =>
    sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();

const generateManifest = (id: string, primary: string): string =>
    JSON.stringify(
        {
            ...MANIFEST_TEMPLATE,
            theme_color: primary,
            icons: [
                { src: `pwa-192x192-${id}.png`, sizes: "192x192", type: "image/png" },
                { src: `pwa-512x512-${id}.png`, sizes: "512x512", type: "image/png" },
                { src: `pwa-512x512-${id}.png`, sizes: "512x512", type: "image/png", purpose: "maskable" },
            ],
        },
        null,
        2,
    );

const main = async () => {
    mkdirSync(PUBLIC_DIR, { recursive: true });

    // Read the green SVG as the template (it has fill="#3D8A5A")
    const baseSvg = readFileSync(SVG_TEMPLATE_PATH, "utf-8");

    for (const theme of THEMES) {
        const svg = generateThemedSvg(baseSvg, theme.primary);

        // Write themed SVG favicon
        writeFileSync(resolve(PUBLIC_DIR, `sudoku-${theme.id}.svg`), svg);

        // Generate PNGs
        const [png192, png512] = await Promise.all([
            generatePngFromSvg(svg, 192),
            generatePngFromSvg(svg, 512),
        ]);
        writeFileSync(resolve(PUBLIC_DIR, `pwa-192x192-${theme.id}.png`), png192);
        writeFileSync(resolve(PUBLIC_DIR, `pwa-512x512-${theme.id}.png`), png512);
        writeFileSync(resolve(PUBLIC_DIR, `apple-touch-icon-${theme.id}.png`), png512);

        // Write manifest
        writeFileSync(
            resolve(PUBLIC_DIR, `manifest-${theme.id}.webmanifest`),
            generateManifest(theme.id, theme.primary),
        );

        console.log(`Generated assets for theme: ${theme.id}`);
    }

    console.log("Done! All themed PWA assets generated.");
};

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
```

Note: The script duplicates the theme list rather than importing from `src/theme/themeConfig.ts` because it runs as a standalone Node script outside the Vite/TypeScript project context. When adding a new theme, both places must be updated — the themeConfig test (Task 1) guards against missing entries.

- [ ] **Step 3: Add scripts to package.json**

Add to `"scripts"` section:

```json
    "generate:icons": "npx tsx scripts/generate-pwa-icons.ts",
    "prebuild": "npm run generate:icons",
```

- [ ] **Step 4: Install tsx as devDependency (to run TypeScript scripts)**

Run: `npm install --save-dev tsx`

- [ ] **Step 5: Commit script and package.json changes**

```bash
git add scripts/generate-pwa-icons.ts package.json package-lock.json
git commit -m "✨ feat: add PWA icon generation script with sharp"
```

---

## Task 10: Generate themed assets and clean up old files

**Files:**
- Modify: `public/` (generate new, delete old)

- [ ] **Step 1: Run the generation script**

The green SVG template must exist first. Rename current `public/sudoku.svg` to `public/sudoku-green.svg`:

Run: `mv public/sudoku.svg public/sudoku-green.svg`

- [ ] **Step 2: Run the generator**

Run: `npm run generate:icons`
Expected: Console output showing 6 themes generated. Files appear in `public/`:
- `sudoku-{id}.svg` × 6
- `pwa-192x192-{id}.png` × 6
- `pwa-512x512-{id}.png` × 6
- `apple-touch-icon-{id}.png` × 6
- `manifest-{id}.webmanifest` × 6

- [ ] **Step 3: Verify the generated files exist**

Run: `ls public/pwa-192x192-*.png public/pwa-512x512-*.png public/apple-touch-icon-*.png public/sudoku-*.svg public/manifest-*.webmanifest | wc -l`
Expected: `30`

- [ ] **Step 4: Delete old non-themed files**

Run:
```bash
rm public/pwa-192x192.png public/pwa-512x512.png public/apple-touch-icon.png
```

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 6: Run build to verify everything works end-to-end**

Run: `npm run build`
Expected: Build succeeds (prebuild generates icons, vue-tsc passes, vite build completes)

- [ ] **Step 7: Commit all generated assets and cleanup**

```bash
git add public/
git commit -m "✨ feat: generate per-theme PWA icons, manifests, and favicons

- Generate 6 themed SVG favicons, PNG icons, and webmanifests
- Remove old non-themed pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png"
```

---

## Task 11: Final verification

- [ ] **Step 1: Run all tests**

Run: `npx vitest run`
Expected: All PASS

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: PASS with 0 warnings

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Manual verification with dev server**

Run: `npm run start`

Check in browser:
1. Open DevTools → Elements → `<head>` — verify `<meta name="theme-color">`, `<link rel="icon">`, `<link rel="manifest">`, `<link rel="apple-touch-icon">` all point to green variants
2. Go to Settings page, switch to "blue" theme
3. Verify the above tags now point to blue variants
4. Refresh the page — verify the blue theme persists (read from localStorage)
5. Check the browser tab favicon changed to blue

- [ ] **Step 5: Commit any final fixes if needed**
