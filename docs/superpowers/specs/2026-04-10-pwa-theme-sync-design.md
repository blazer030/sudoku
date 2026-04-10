# PWA Theme Sync Design

> 切換 color theme 時，PWA 相關的顏色與 icon 一起同步更新。

## Goal

切換 color theme 後，以下項目即時反映目前 theme 的配色：

1. `<meta name="theme-color">` — 手機瀏覽器網址列顏色
2. `<link rel="icon">` — 瀏覽器分頁 favicon
3. `<link rel="manifest">` — PWA 安裝時讀取的 manifest（含 `theme_color` 與 icon）
4. `<link rel="apple-touch-icon">` — iOS 加到主畫面的 icon

### Scope

- `background_color` 固定 `#F5F5F0`，不隨 theme 改變
- `name` / `description` 固定不動
- 已安裝的 PWA 不處理（OS 層級限制，無法動態更新）

---

## Architecture: Single Source of Truth

所有 theme 色彩集中在一個 TypeScript 設定表 `src/theme/themeConfig.ts`：

```ts
export interface ThemeDefinition {
    id: ColorThemeId;
    primary: string;   // meta theme-color, manifest theme_color, SVG 背景色
    accent: string;    // Settings.vue color picker 的右半圓色
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

此設定表被三處消費：

| 消費者 | 用途 |
|---|---|
| `scripts/generate-pwa-icons.ts` (build-time) | 產生每個 theme 的 PNG icon、SVG favicon、manifest 檔案 |
| `src/application/PwaThemeUpdater.ts` (runtime) | 查詢 theme 的 primary 色，更新 DOM 中的 meta/link |
| `src/presentation/pages/settings/Settings.vue` | 渲染 color picker 圓點（取代目前寫死的陣列） |

### Data Flow

```
                      THEMES (src/theme/themeConfig.ts)
                               |
                +--------------+--------------+
                |              |              |
           build-time       runtime       Settings.vue
                |              |              |
     +----------+------+       |          color picker
     |                 |       |
  scripts/        public/           document.head
  generate        manifest-         +- <meta theme-color>
  -pwa-icons.ts   {id}.webmanifest  +- <link rel=icon>
     |            pwa-{size}-{id}   +- <link rel=manifest>
     v            .png              +- <link rel=apple-touch-icon>
  (sharp)         sudoku-{id}.svg
                  apple-touch-icon-{id}.png
```

---

## Build-time: Icon & Manifest Generation Script

### `scripts/generate-pwa-icons.ts`

使用 `sharp` 讀取 `public/sudoku.svg`（green 版本作為模板），將 `fill="#3D8A5A"` 替換為各 theme 的 `primary` 色後 rasterize。

### Output Files (all in `public/`)

| Pattern | Count | Purpose |
|---|---|---|
| `pwa-192x192-{id}.png` | 6 | manifest icon |
| `pwa-512x512-{id}.png` | 6 | manifest icon + maskable |
| `apple-touch-icon-{id}.png` | 6 | iOS homescreen icon |
| `sudoku-{id}.svg` | 6 | browser favicon |
| `manifest-{id}.webmanifest` | 6 | per-theme PWA manifest |

Total: 30 files.

### Manifest Template

Each `manifest-{id}.webmanifest`:

```json
{
  "name": "Sudoku",
  "short_name": "Sudoku",
  "description": "Train your brain with Sudoku puzzles",
  "theme_color": "<primary>",
  "background_color": "#F5F5F0",
  "display": "standalone",
  "icons": [
    { "src": "pwa-192x192-{id}.png", "sizes": "192x192", "type": "image/png" },
    { "src": "pwa-512x512-{id}.png", "sizes": "512x512", "type": "image/png" },
    { "src": "pwa-512x512-{id}.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### Execution

- `npm run generate:icons` — standalone command
- `package.json` adds `"prebuild": "npm run generate:icons"` — auto-run before build
- Output files are **committed to repo** (not gitignored), so dev server works without running the script first
- `sharp` added as a devDependency

### Cleanup (after generation completes)

Delete old non-themed files (the generate script uses `public/sudoku.svg` as template, so cleanup happens after all themed variants are generated):
- `public/pwa-192x192.png`
- `public/pwa-512x512.png`
- `public/apple-touch-icon.png`
- `public/sudoku.svg` (replaced by `sudoku-{id}.svg` variants)

### vite-plugin-pwa Config Change

In `vite.config.ts`:
- Set `manifest: false` (disable auto-generated manifest)
- Keep workbox, registerType, runtimeCaching unchanged

---

## Runtime: Theme Switching

### New module: `src/application/PwaThemeUpdater.ts`

Pure DOM operations, no Vue/Pinia dependency. Provides 4 functions:

| Function | Action |
|---|---|
| `updateMetaThemeColor(id)` | Set `<meta name="theme-color">` content to theme's primary color |
| `updateFavicon(id)` | Set `<link rel="icon">` href to `${base}sudoku-${id}.svg` |
| `updateManifestLink(id)` | Set `<link rel="manifest">` href to `${base}manifest-${id}.webmanifest` |
| `updateAppleTouchIcon(id)` | Set `<link rel="apple-touch-icon">` href to `${base}apple-touch-icon-${id}.png` |

`base` comes from `import.meta.env.BASE_URL` (dev: `/`, prod: `/sudoku/`).

All functions are graceful — if the target element is not found, they do nothing (no throw).

### `settingsStore.applyColorTheme()` Expansion

```ts
const applyColorTheme = () => {
    const id = colorTheme.value;
    document.documentElement.dataset.colorTheme = id;  // existing
    updateMetaThemeColor(id);                           // new
    updateFavicon(id);                                  // new
    updateManifestLink(id);                             // new
    updateAppleTouchIcon(id);                           // new
};
```

### index.html Initial State

Defaults to green (the default theme):

```html
<meta name="theme-color" content="#3D8A5A" />
<link href="/sudoku-green.svg" rel="icon" type="image/svg+xml" />
<link href="/apple-touch-icon-green.png" rel="apple-touch-icon" />
```

On app startup, `settingsStore` initializes and calls `applyColorTheme()` which reads the real theme from localStorage and updates all links/meta. The time gap is negligible.

---

## Settings.vue Integration

Replace the hardcoded `colorThemes` array with an import from `themeConfig.ts`:

```ts
// Before
const colorThemes: ColorThemeOption[] = [
    { id: "green", hex: "#3D8A5A", accentHex: "#D89575" },
    // ...
];

// After
import { THEMES } from "@/theme/themeConfig";
// THEMES provides id, primary, accent — map to template needs
```

CSS in `index.css` is **not changed** — CSS variable definitions remain in `[data-color-theme="..."]` blocks since they define many more variables beyond primary/accent.

---

## Files Changed

| File | Change |
|---|---|
| `src/theme/themeConfig.ts` | **New**: THEMES config + ThemeDefinition type |
| `src/application/PwaThemeUpdater.ts` | **New**: 4 DOM update functions |
| `src/stores/settingsStore.ts` | **Modified**: expand `applyColorTheme()` |
| `src/presentation/pages/settings/Settings.vue` | **Modified**: import THEMES instead of hardcoded array |
| `scripts/generate-pwa-icons.ts` | **New**: build-time icon/manifest generation |
| `vite.config.ts` | **Modified**: `manifest: false` |
| `index.html` | **Modified**: link/meta point to green variants |
| `package.json` | **Modified**: add sharp devDep, generate:icons script, prebuild hook |
| `public/` | **New**: 30 themed files; **Delete**: 4 old files |

### Unchanged

- `src/style/index.css` — CSS variable definitions untouched
- `src/application/SettingsStorage.ts` — `ColorThemeId` type untouched
- Service worker / workbox config untouched
- Domain layer untouched

---

## Testing Strategy

### 1. `themeConfig` — `src/__tests__/theme/themeConfig.test.ts`

- Every theme has `id`, `primary`, `accent`
- `primary` / `accent` are valid hex color format
- `id` covers all `ColorThemeId` values (prevent missing entries)

### 2. `PwaThemeUpdater` — `src/__tests__/application/PwaThemeUpdater.test.ts`

- `updateMetaThemeColor(id)`: `<meta name="theme-color">` content matches theme's primary
- `updateFavicon(id)`: `<link rel="icon">` href contains `sudoku-{id}.svg`
- `updateManifestLink(id)`: `<link rel="manifest">` href contains `manifest-{id}.webmanifest`
- `updateAppleTouchIcon(id)`: `<link rel="apple-touch-icon">` href contains `apple-touch-icon-{id}.png`
- Graceful when target element not found (no throw)

Test environment: jsdom, insert mock meta/link elements into document.head before each test.

### 3. `settingsStore` — expand existing tests

- `setColorTheme("blue")` calls PwaThemeUpdater functions (mock PwaThemeUpdater, verify calls)

### 4. `Settings.vue` — existing tests

Existing tests should pass as-is since only the import source changes.

### 5. Generate script — no unit test

Validation via manual review of output files. Script output is binary (PNG), testing sharp rasterization adds no value.

### Not Covered (manual testing)

- PNG image quality / color correctness
- Installed PWA behavior
- Service worker cache update strategy
