# Android APK, Donate IAP, and Google Analytics Design

## Context

The Sudoku app has been a Vue 3 + Vite PWA deployed to GitHub Pages (`/sudoku/`) for internal testing only. The web build is not publicly promoted. This design moves the project toward its first public release: packaging the app as an Android APK via Capacitor, adding a donation tip jar backed by Google Play Billing, and integrating Firebase Analytics to measure usage.

All three concerns ship as a single coordinated release (v2.0.0) rather than separate rollouts.

## Goals

- Package the existing Vue web app as a native Android app and publish to Google Play.
- Add a Settings → Support → Donate page with three consumable IAP tiers.
- Integrate Firebase Analytics with a focused event schema (not a kitchen-sink of every user action).
- Keep the web build clean: native-only features must be cleanly hidden on web, with route guards redirecting `/donate` to the home page.
- Add a Settings toggle to let the launcher icon match the chosen color theme.
- Publish a minimal-compliance Privacy Policy that satisfies Play Store requirements.

## Non-Goals

- iOS packaging. Capacitor supports iOS, but this release is Android-only.
- Subscription or non-consumable IAP (the donate model is strictly consumable).
- A marketing landing page on the web build. The web build remains internal.
- RevenueCat or third-party billing abstraction layers. We talk directly to Play Billing.
- Cookie consent / GDPR banners on web (web is not public).
- Backwards-compatibility shims for pre-Android-7 devices (defer to Capacitor's default min SDK).

## Summary of Decisions

| Topic | Decision |
|---|---|
| Packaging tech | **Capacitor** wrapping the Vue build |
| Package name | `io.github.blazer030.sudoku` (immutable once published) |
| App display name | `Sudoku` |
| Version | `2.0.0` (first public release, intentional major bump) |
| Native sources committed | Yes — commit the `android/` folder |
| Launcher icon assets | Reuse existing PWA logo, tinted with each theme's primary color (6 variants) |
| Dynamic icon UX | Settings toggle; first enable shows a one-time restart-warning dialog; after that, theme changes swap the icon automatically; disabling the toggle leaves the icon at its last state |
| Donate model | Consumable tip jar, three tiers |
| Donate tiers | `donate_coffee` $2.99 · `donate_lunch` $5.99 · `donate_coding_time` $9.99 (USD base, auto-localized) |
| IAP plugin | `capacitor-plugin-cdv-purchase` (Capacitor wrapper for `cordova-plugin-purchase` v13, supports Google Play Billing 7) |
| Analytics SDK | `@capacitor-firebase/analytics` (Firebase) |
| Analytics events | Automatic events + `game_start`, `game_complete`, `game_abandon`, `hint_used`, `donate_view`, `donate_tap`, `donate_success` |
| Event naming | snake_case throughout (matches GA4 convention and is used directly in TypeScript types) |
| Platform gating | `Capacitor.isNativePlatform()` via `usePlatform` composable; web hides all native-only features; `/donate` is guarded and redirects to `/` |
| Analytics placement | Native only; web has no analytics |
| Privacy Policy | PrivacyPolicyGenerator-generated HTML at `public/privacy-policy.html`; deployed URL `https://blazer030.github.io/sudoku/privacy-policy.html` |
| Release track plan | Internal Testing → Production (skip Closed/Open Testing for first launch) |
| Feature toggle | Keep existing `VITE_APP_ENV` mechanism. Internal Testing builds use `develop`; Production builds use `production`. |

## Architecture

The design follows the existing DDD structure, adding a new `infrastructure/` layer for platform-specific adapters. The domain layer is unchanged.

### Layer Diagram

```
src/
├── domain/                      (unchanged — pure business logic)
├── application/
│   ├── analytics/               (NEW — AnalyticsService port + event types)
│   ├── billing/                 (NEW — BillingService port + result types)
│   ├── icon/                    (NEW — IconService port)
│   └── ...existing (GameState, Statistics, SettingsStorage)
├── infrastructure/              (NEW LAYER)
│   ├── platform.ts              (wraps Capacitor.isNativePlatform)
│   ├── analytics/
│   │   ├── FirebaseAnalyticsAdapter.ts
│   │   └── NoopAnalyticsAdapter.ts
│   ├── billing/
│   │   ├── PlayBillingAdapter.ts
│   │   └── NoopBillingAdapter.ts
│   └── icon/
│       ├── DynamicIconAdapter.ts
│       └── NoopIconAdapter.ts
├── presentation/
│   ├── composables/
│   │   └── usePlatform.ts       (NEW)
│   └── pages/
│       ├── settings/Settings.vue (MODIFIED — new Support section, dynamic icon toggle)
│       └── donate/               (NEW)
│           └── Donate.vue
└── stores/
    └── donateStore.ts           (NEW — product loading + purchase flow state)
```

### Dependency Direction

`domain ← application ← { infrastructure, presentation, stores }`. The domain never imports from any other layer; application defines ports; adapters live in infrastructure; presentation/stores consume applications through the provide/inject tree.

### Composition Root

`src/main.ts` wires the concrete implementations at bootstrap:

```ts
const isNative = Capacitor.isNativePlatform();

const analytics: AnalyticsService = isNative
    ? new FirebaseAnalyticsAdapter()
    : new NoopAnalyticsAdapter();

const billing: BillingService = isNative
    ? new PlayBillingAdapter()
    : new NoopBillingAdapter();

const icon: IconService = isNative
    ? new DynamicIconAdapter()
    : new NoopIconAdapter();

app.provide(ANALYTICS_KEY, analytics);
app.provide(BILLING_KEY, billing);
app.provide(ICON_KEY, icon);
```

Tests can inject mock services at the provide boundary without touching Capacitor plugins.

## Platform Abstraction Layer

### `usePlatform` Composable

`src/presentation/composables/usePlatform.ts`:

```ts
import { Capacitor } from "@capacitor/core";

export const usePlatform = () => ({
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
});
```

### Router Guard

`src/router/index.ts` adds a `beforeEach` guard for native-only routes:

```ts
const NATIVE_ONLY_ROUTES = ["/donate"];

router.beforeEach((to) => {
    const { isNative } = usePlatform();
    if (NATIVE_ONLY_ROUTES.includes(to.path) && !isNative) {
        return "/";
    }
});
```

### Settings Conditional Display

`Settings.vue` gates the Support section and the `Match launcher icon to theme` toggle behind `v-if="isNative"`. Web users see the existing Appearance / Gameplay / About layout with no placeholder entries.

## Capacitor Integration

### New Dependencies

```json
{
  "dependencies": {
    "@capacitor/core": "^6.x",
    "@capacitor/android": "^6.x",
    "@capacitor/app": "^6.x",
    "@capgo/capacitor-dynamic-icon": "^6.x",
    "@capacitor-firebase/analytics": "^6.x",
    "capacitor-plugin-cdv-purchase": "^13.x"
  },
  "devDependencies": {
    "@capacitor/cli": "^6.x"
  }
}
```

### `capacitor.config.ts`

```ts
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
    appId: "io.github.blazer030.sudoku",
    appName: "Sudoku",
    webDir: "dist",
    server: {
        androidScheme: "https",
    },
};

export default config;
```

### npm Scripts (additions)

```json
{
  "android:sync": "npm run build && npx cap sync android",
  "android:open": "npx cap open android",
  "android:run": "npm run build && npx cap run android",
  "android:build:dev": "cross-env VITE_APP_ENV=develop npm run build && npx cap sync android",
  "android:build:release": "cross-env VITE_APP_ENV=production npm run build && npx cap sync android"
}
```

`cross-env` is added to `devDependencies` to keep env-var syntax portable.

### Version Mapping

- `package.json` `"version"`: `"2.0.0"`
- `android/app/build.gradle` `versionName`: read from `package.json` via build script
- `android/app/build.gradle` `versionCode`: starts at `1`, increments by 1 per Play Store submission

### PWA Registration Gate

`src/main.ts` only registers the service worker when running on web:

```ts
if (!Capacitor.isNativePlatform()) {
    registerPwa();
}
```

The existing `vite-plugin-pwa` configuration is otherwise unchanged.

## Analytics Module

### Port: `AnalyticsService`

`src/application/analytics/AnalyticsService.ts`:

```ts
import type { Difficulty } from "@/domain/...";

export type DonateTier = "coffee" | "lunch" | "coding_time";
// Tier short name is used in analytics events; Play Console SKU is always `donate_${tier}`.

export type AnalyticsEvent =
    | { name: "game_start"; difficulty: Difficulty }
    | { name: "game_complete"; difficulty: Difficulty; time_seconds: number; hints_used: number }
    | { name: "game_abandon"; difficulty: Difficulty; progress_pct: number }
    | { name: "hint_used"; hint_type: "auto_notes" | "check_conflicts" | "check_errors" | "reveal_cell" }
    | { name: "donate_view" }
    | { name: "donate_tap"; tier: DonateTier }
    | { name: "donate_success"; tier: DonateTier; amount_usd: number };

export interface AnalyticsService {
    logEvent(event: AnalyticsEvent): Promise<void>;
}

export const ANALYTICS_KEY = Symbol("AnalyticsService") as InjectionKey<AnalyticsService>;
```

### Adapters

`FirebaseAnalyticsAdapter` (native):

```ts
import { FirebaseAnalytics } from "@capacitor-firebase/analytics";

export class FirebaseAnalyticsAdapter implements AnalyticsService {
    async logEvent(event: AnalyticsEvent) {
        const { name, ...params } = event;
        await FirebaseAnalytics.logEvent({ name, params });
    }
}
```

`NoopAnalyticsAdapter` (web): all methods resolve immediately and do nothing.

### Event Emission Points

| Event | Location |
|---|---|
| `game_start` | `gameStore.startGame()` after puzzle is generated |
| `game_complete` | Watcher on `sudoku.isCompleted()` transitioning to `true` in `Game.vue` |
| `game_abandon` | `LeaveGameDialog.vue` when the user confirms leaving |
| `hint_used` | `gameStore.useHint()` on successful hint application |
| `donate_view` | `Donate.vue` `onMounted` |
| `donate_tap` | Donate tier button click handler |
| `donate_success` | `donateStore` after `purchase` resolves successfully |

## Donate / IAP Module

### Port: `BillingService`

`src/application/billing/BillingService.ts`:

```ts
export interface Product {
    id: string;
    priceText: string;   // "$2.99" or localized equivalent
    amountUsd: number;
}

export type PurchaseResult =
    | { kind: "success"; productId: string; amountUsd: number }
    | { kind: "cancelled" }
    | { kind: "error"; reason: string };

export interface BillingService {
    loadProducts(): Promise<Product[]>;
    purchase(productId: string): Promise<PurchaseResult>;
    consumeAll(): Promise<void>;
}

export const BILLING_KEY = Symbol("BillingService") as InjectionKey<BillingService>;
```

### `donateStore`

```ts
state: {
    products: Product[];
    purchasing: string | null;      // productId in flight
    lastResult: PurchaseResult | null;
}

actions: {
    loadProducts(): Promise<void>;
    purchase(productId: string): Promise<void>;   // sets purchasing, awaits, stores lastResult
}
```

### `Donate.vue` Layout

Reuses the existing Settings card pattern (`bg-card rounded-2xl shadow-card-sm`):

```
┌──────────────────────────────────┐
│ ← Back          Support          │
├──────────────────────────────────┤
│ Sudoku is 100% free, no ads.     │
│ If you'd like to support         │
│ development:                     │
│                                  │
│ ┌────────────────────────────┐   │
│ │ ☕  Coffee         $2.99  →│   │
│ │ 🍱  Lunch          $5.99  →│   │
│ │ 💻  Coding Time    $9.99  →│   │
│ └────────────────────────────┘   │
│                                  │
│ Payments handled by Google Play  │
└──────────────────────────────────┘
```

### Success Animation

On `PurchaseResult.kind === "success"`, the page transitions to a celebration screen that reuses `FireworkCanvas`, displays "Thank you for the ${tier}!" with a tier-specific emoji, and offers a "Done" button that returns to Settings.

### Product-Consumption Policy

Because all three SKUs are **consumable**, every `loadProducts()` call is preceded by `consumeAll()` to clear any lingering unacknowledged purchases from prior sessions. This keeps the purchase history clean for repeat donations.

### Error Matrix

| Scenario | Handling |
|---|---|
| User cancels Play Billing sheet | `PurchaseResult = cancelled`; show Toast "Cancelled"; no analytics `donate_success` |
| Network failure during `loadProducts` | Empty product list; show inline Retry button |
| Purchase fails (network / Play error) | `PurchaseResult = error`; Toast with generic message; log reason to console |
| Duplicate rapid taps | `donateStore.purchasing` blocks re-entry |
| Unconsumed prior purchase | `consumeAll()` called at store init clears it before new purchases |

## Dynamic Icon Module

### Icon Assets

`scripts/generate-pwa-icons.ts` is extended with a theme-variant loop. Output:

```
android/app/src/main/res/mipmap-*/
├── ic_launcher_green/          (default at install)
├── ic_launcher_blue/
├── ic_launcher_purple/
├── ic_launcher_orange/
├── ic_launcher_pink/
└── ic_launcher_teal/
```

Each variant reuses the existing PWA logo art, only changing the background tint to match the theme's `primary` color.

### `AndroidManifest.xml`

Registers one primary launcher activity (green default) plus five `<activity-alias>` entries, one per non-default theme, with `android:enabled="false"` so only one is active at a time.

### Port: `IconService`

```ts
import type { ColorThemeId } from "@/application/SettingsStorage";

export interface IconService {
    setIcon(themeId: ColorThemeId): Promise<void>;
}

export const ICON_KEY = Symbol("IconService") as InjectionKey<IconService>;
```

### New Setting: `matchLauncherIconToTheme`

Added to `SettingsStorage.Settings` with default `false`. Persisted to localStorage alongside existing settings. The setter lives in `settingsStore`.

### Toggle UX Flow

**Toggle OFF → ON**

1. User taps toggle in Settings
2. Dialog: "Changing the launcher icon will briefly restart the app. Enable?"
3. If **Confirm**: `iconService.setIcon(currentTheme)` → set `matchLauncherIconToTheme = true`
4. If **Cancel**: toggle reverts, no side effects

**Toggle ON → OFF**

1. User taps toggle
2. Set `matchLauncherIconToTheme = false`. Icon is **not** reset; it keeps its last state.

**Color theme change while toggle is ON**

1. User changes color theme in Settings
2. `settingsStore.setColorTheme(newTheme)` runs
3. If `matchLauncherIconToTheme === true`, `iconService.setIcon(newTheme)` is called
4. Android briefly restarts the app (system behavior, unavoidable)

## Privacy Policy & Play Console

### Privacy Policy Content

Generated by [PrivacyPolicyGenerator.info](https://app-privacy-policy-generator.firebaseapp.com/) and placed at `public/privacy-policy.html`. Deployed URL: `https://blazer030.github.io/sudoku/privacy-policy.html`.

Required coverage:
- App name, developer contact email
- Data collected:
  - Firebase Analytics (anonymous session/device data, country-level location)
  - Custom events (difficulty, completion time, hint counts, donate tier — no PII)
- Third parties: Google Firebase, Google Play Billing
- Data not collected: name, email, payment details (Google handles)
- User rights: reset Advertising ID, uninstall to stop collection

### Play Console Checklist (Launch Preparation)

#### A. Account & Business (one-time, account-level)

- [ ] Developer account active (user has one; confirm no dormant-account issues)
- [ ] Payment profile (Google Payments merchant account) set up
- [ ] Tax info submitted — Taiwan residents use **W-8BEN** to avoid US 30% withholding
- [ ] Bank account for payouts linked
- [ ] Two-factor authentication enabled on the Google account

#### B. App Setup (per-app, Play Console)

- [ ] Create app: type = App (not Game), package name = `io.github.blazer030.sudoku`
- [ ] App name: `Sudoku`
- [ ] Default language: English (Chinese translations deferred)
- [ ] Category: Games > Puzzle
- [ ] Tags selected
- [ ] Short description (≤ 80 chars)
- [ ] Full description (≤ 4000 chars)
- [ ] App icon (512×512 PNG)
- [ ] Feature graphic (1024×500)
- [ ] Screenshots (≥ 2 phone shots; recommend 4–8)
- [ ] Content rating questionnaire (expected: Everyone)
- [ ] Target audience (age groups, children's flag)
- [ ] Data safety questionnaire — matches the analytics events we collect
- [ ] Privacy Policy URL filled in
- [ ] Ads: **No**
- [ ] Government / News / COVID-tracking flags: **No**

#### C. IAP Products (requires first build uploaded first)

- [ ] License testers: add developer Gmail to Setup → License testing
- [ ] Create 3 Consumable products:
  - [ ] `donate_coffee` · "Coffee" · $2.99 USD base
  - [ ] `donate_lunch` · "Lunch" · $5.99 USD base
  - [ ] `donate_coding_time` · "Coding Time" · $9.99 USD base
- [ ] Mark each product Active

#### D. Release

- [ ] Enable Google Play App Signing
- [ ] Generate upload key locally (`android/app/release-upload-key.jks`, gitignored)
- [ ] Store key passwords in `android/key.properties` (gitignored)
- [ ] Create Internal Testing track, add developer as tester
- [ ] Upload first AAB to Internal Testing
- [ ] Verify: analytics events reaching Firebase console; IAP sandbox works for all three products; dynamic icon swap works; privacy policy URL reachable
- [ ] Submit to Production (skip Closed/Open Testing for first launch)

## Testing Strategy

### Principle

Test what we decide. Do not test third-party SDK pass-throughs.

### What Gets Tested

| Area | Tested? | Notes |
|---|---|---|
| `usePlatform` composable | ✅ | Our judgment on `isNative` / `platform` |
| Router guard for native-only routes | ✅ | Our redirect logic |
| `PlayBillingAdapter` result transformation | ✅ | Maps Play Billing raw response → our `PurchaseResult` tri-state |
| `donateStore` state transitions | ✅ | Loading / purchasing / result flow |
| Analytics event emission timing | ✅ | Watchers/handlers wire to the right moments |
| `Settings.vue` conditional rendering | ✅ | `v-if="isNative"` branches; toggle dialog flow |
| `FirebaseAnalyticsAdapter` | ❌ | Pure pass-through `{ name, ...params } → SDK` |
| `NoopAnalyticsAdapter` / `NoopBillingAdapter` / `NoopIconAdapter` | ❌ | Empty implementations |
| `DynamicIconAdapter` | ❌ | Pure pass-through to plugin |
| Launcher icon actually swapped on device | ❌ | Manual verification only |

### Mocking Patterns

- Capacitor core: `vi.mock("@capacitor/core", () => ({ Capacitor: { isNativePlatform: vi.fn(), getPlatform: vi.fn() } }))`
- Application services in presentation tests: `provide(ANALYTICS_KEY, mockService)` at mount time
- `PlayBillingAdapter` tests: `vi.mock("capacitor-plugin-cdv-purchase", ...)` at module level — fake `store` object exposes spy-friendly `register`, `initialize`, `when()` chain, `get()`, `error()`; tests trigger captured event handlers (`approved`, `productUpdated`) directly to drive the adapter's promise resolution

### Manual Verification Checklist (per phase)

| Phase | Manual check |
|---|---|
| 1. Capacitor skeleton | APK launches in emulator; home screen renders |
| 2. Platform abstraction | Web: `/donate` redirects to `/`; native emulator: Donate entry visible |
| 3. Analytics | Firebase console shows real-time events after Internal Testing install |
| 4. Donate UI | UI renders in emulator; buttons produce Toasts (no real IAP yet) |
| 5. IAP | License tester account completes full purchase flow; Play Console shows test orders |
| 6. Dynamic icon | Toggle ON, change theme, confirm icon changes + brief restart |
| 7. Privacy policy & submission | Public URL reachable; Internal Testing build installs fine from Play Store; full regression on a real device |

### CI / Lint Gates

- `npm run lint` must pass with `--max-warnings 0` before commit
- `npx vitest run` must be green before commit
- `npm run build` must produce `dist/` before `cap sync`
- `npm run android:build:release` is manual only (requires signing keys; not in CI)

## Implementation Phases

Sequenced so each phase has an independent verification milestone.

1. **Capacitor skeleton** — install deps, `capacitor.config.ts`, `npx cap add android`, commit `android/`, verify APK launches.
2. **Platform abstraction** — `usePlatform`, router guard, Settings conditional rendering. Verify web redirect works.
3. **Analytics** — ports/adapters, emission points, Firebase project setup. Verify events in Firebase console via Internal Testing build.
4. **Donate UI** — `Donate.vue` + `donateStore`, wired to `NoopBillingAdapter` on both platforms as a temporary shim. Real Play Billing is wired in Phase 5. Verify page renders and tier buttons fire their handlers.
5. **IAP wiring** — Play Console products, `PlayBillingAdapter`, connect to `donateStore`. Verify sandbox purchases end-to-end.
6. **Dynamic icon** — generate 6 icon variants, update `AndroidManifest.xml` aliases, new Setting, toggle UX, wire to `settingsStore`.
7. **Privacy policy deployment + Production submission** — publish `public/privacy-policy.html`, fill Play Console fields, submit to Production.

## Open Questions / Risks

- **Developer account status** — user has a Play Console account but it has been dormant; verify it is still Active before starting Phase 1.
- **Firebase project ownership** — a new Firebase project is required for the app. Created during Phase 3.
- **Tax form (W-8BEN)** — must be submitted before the first payout; does not block upload.
- **Play Store review rejections** — Sudoku games with tip-jar IAP occasionally trigger "digital goods" policy reviews. If rejected, iterate on the Privacy Policy and Data Safety answers.
- **Dynamic icon plugin stability** — `@capgo/capacitor-dynamic-icon` handles the activity-alias swap; some third-party Android launchers may not refresh immediately. Documented as an acceptable caveat.
