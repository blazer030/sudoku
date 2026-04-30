# Android APK + Donate IAP + Analytics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship v2.0.0 of the Sudoku app to Google Play as a Capacitor-wrapped Android app, with a Donate tip jar backed by Google Play Billing and Firebase Analytics integration.

**Architecture:** Capacitor wraps the existing Vue + Vite build. Port/Adapter pattern isolates native integrations (analytics, billing, icon) in a new `src/infrastructure/` layer. A `usePlatform` composable plus a router guard and `v-if="isNative"` checks hide native-only features cleanly on web.

**Tech Stack:** Vue 3, Vite, Pinia, Capacitor 6, `@capacitor-firebase/analytics`, `capacitor-plugin-cdv-purchase` (Capacitor wrapper for `cordova-plugin-purchase` v13), `@capacitor-community/app-icon`, Vitest, @vue/test-utils.

**Spec:** `docs/superpowers/specs/2026-04-20-android-apk-donate-ga-design.md`

---

## File Structure

### Files to create

```
capacitor.config.ts                                        ← Capacitor config
public/privacy-policy.html                                 ← Privacy Policy (GitHub Pages)
android/                                                   ← Capacitor-generated native project
scripts/generate-launcher-icons.ts                         ← Tints base PNG for 6 themes

src/infrastructure/platform.ts                             ← Wraps Capacitor.isNativePlatform
src/infrastructure/analytics/FirebaseAnalyticsAdapter.ts
src/infrastructure/analytics/NoopAnalyticsAdapter.ts
src/infrastructure/billing/PlayBillingAdapter.ts
src/infrastructure/billing/NoopBillingAdapter.ts
src/infrastructure/icon/DynamicIconAdapter.ts
src/infrastructure/icon/NoopIconAdapter.ts

src/application/analytics/AnalyticsService.ts
src/application/billing/BillingService.ts
src/application/icon/IconService.ts

src/presentation/composables/usePlatform.ts
src/presentation/pages/donate/Donate.vue
src/presentation/pages/donate/components/DonateSuccess.vue

src/stores/donateStore.ts

src/__tests__/presentation/composables/usePlatform.test.ts
src/__tests__/router/nativeOnlyGuard.test.ts
src/__tests__/infrastructure/billing/PlayBillingAdapter.test.ts
src/__tests__/stores/donateStore.test.ts
src/__tests__/presentation/pages/donate/Donate.test.ts
src/__tests__/presentation/pages/settings/Settings.test.ts (if absent, create)
```

### Files to modify

```
package.json                                    ← version 2.0.0, deps, scripts
src/main.ts                                     ← Composition root for services
src/router.ts                                   ← /donate route + native-only guard
src/application/SettingsStorage.ts              ← matchLauncherIconToTheme field
src/stores/settingsStore.ts                     ← toggle state + icon sync
src/presentation/pages/settings/Settings.vue    ← Support section, icon toggle
src/presentation/pages/game/useGameCompletion.ts ← Emit game_complete
src/presentation/pages/game/useLeaveGame.ts     ← Emit game_abandon
src/presentation/pages/game/useHintActions.ts   ← Emit hint_used
src/stores/gameStore.ts                         ← Emit game_start
android/app/src/main/AndroidManifest.xml        ← activity-alias per theme
android/app/build.gradle                        ← versionCode, versionName
.gitignore                                      ← signing key files
```

---

## Phase 1 — Capacitor Skeleton

Goal: Web app packaged as an installable APK that boots to the home screen.

### Task 1: Bump package version to 2.0.0

**Files:**
- Modify: `package.json:3`

- [ ] **Step 1: Update version**

```json
{
  "name": "sudoku",
  "private": true,
  "version": "2.0.0"
}
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "🚧 chore: bump version to 2.0.0 for android release"
```

---

### Task 2: Install Capacitor core dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Install runtime and CLI**

```bash
npm install @capacitor/core @capacitor/app
npm install --save-dev @capacitor/cli cross-env
```

- [ ] **Step 2: Verify lint and tests still pass**

```bash
npm run lint
npx vitest run
```

Expected: Both commands exit 0.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "🚧 chore: install capacitor core and cli"
```

---

### Task 3: Create capacitor.config.ts

**Files:**
- Create: `capacitor.config.ts`

- [ ] **Step 1: Write config**

```ts
import type { CapacitorConfig } from "@capacitor/cli";

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

- [ ] **Step 2: Commit**

```bash
git add capacitor.config.ts
git commit -m "🚧 chore: add capacitor config for android build"
```

---

### Task 4: Add Android platform

**Files:**
- Create: `android/` (entire folder, generated)
- Modify: `package.json` (adds `@capacitor/android` dep)

- [ ] **Step 1: Produce an initial web build so Capacitor has a `webDir`**

```bash
npm run build
```

Expected: `dist/` exists.

- [ ] **Step 2: Install Android platform package and generate native project**

```bash
npm install @capacitor/android
npx cap add android
```

Expected: `android/` folder created with `android/app/src/main/AndroidManifest.xml` present.

- [ ] **Step 3: Sync web build into android**

```bash
npx cap sync android
```

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json android/
git commit -m "🚧 chore: add android platform via capacitor"
```

---

### Task 5: Configure Android versionCode and versionName

**Files:**
- Modify: `android/app/build.gradle` (search for `defaultConfig` block)

- [ ] **Step 1: Set version fields**

Locate the `defaultConfig` block (typically ~line 15-25) and set:

```gradle
defaultConfig {
    applicationId "io.github.blazer030.sudoku"
    minSdkVersion rootProject.ext.minSdkVersion
    targetSdkVersion rootProject.ext.targetSdkVersion
    versionCode 1
    versionName "2.0.0"
    testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    aaptOptions {
         noCompress "tflite"
    }
}
```

(If Capacitor's template already has `versionCode` and `versionName`, just change their values to `1` and `"2.0.0"`.)

- [ ] **Step 2: Commit**

```bash
git add android/app/build.gradle
git commit -m "🚧 chore: set android version to 2.0.0 (code 1)"
```

---

### Task 6: Add npm scripts for Android workflow

**Files:**
- Modify: `package.json` (scripts block)

- [ ] **Step 1: Add scripts**

Replace the `scripts` block with:

```json
"scripts": {
    "start": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "lint": "eslint . --max-warnings 0",
    "preview": "vite preview",
    "test": "vitest",
    "generate:icons": "npx tsx scripts/generate-pwa-icons.ts",
    "prebuild": "npm run generate:icons",
    "android:sync": "npm run build && npx cap sync android",
    "android:open": "npx cap open android",
    "android:run": "npm run build && npx cap run android",
    "android:build:dev": "cross-env VITE_APP_ENV=develop npm run build && npx cap sync android",
    "android:build:release": "cross-env VITE_APP_ENV=production npm run build && npx cap sync android"
}
```

- [ ] **Step 2: Verify scripts parse**

```bash
npm run android:sync -- --dry-run 2>&1 | head -5
```

(Don't require this to succeed fully; we just want JSON parseable.)

- [ ] **Step 3: Commit**

```bash
git add package.json
git commit -m "🚧 chore: add android build scripts"
```

---

### Task 7: Gate PWA service-worker registration behind native check

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Locate the existing PWA registration**

```bash
grep -n "registerSW\|virtual:pwa" src/main.ts src/**/*.ts 2>/dev/null
```

Identify where `vite-plugin-pwa` registers (may be automatic via `registerType: "autoUpdate"` — in that case only the manifest/entry behavior needs isolating; there is no explicit registerSW call to wrap). If no explicit call exists, add a guard wrapper for future SW registration calls. If one exists, wrap it.

- [ ] **Step 2: Add isNative guard (if an explicit registration exists)**

Wrap the registration:

```ts
import { Capacitor } from "@capacitor/core";

if (!Capacitor.isNativePlatform()) {
    // existing PWA registration call here
}
```

- [ ] **Step 3: Rebuild and verify web still works**

```bash
npm run build
```

Expected: Succeeds without errors.

- [ ] **Step 4: Commit (only if changes were needed)**

```bash
git add src/main.ts
git commit -m "🚧 chore: skip pwa registration on native platforms"
```

(Skip this commit if no code change was needed.)

---

### Task 8: Manual verification — APK boots

**Prerequisites:** Android Studio installed, an Android emulator configured.

- [ ] **Step 1: Open Android project in Android Studio**

```bash
npm run android:open
```

- [ ] **Step 2: Run on emulator via Android Studio (green Run button)**

- [ ] **Step 3: Confirm app launches and the home page ("New Game", "Continue", etc.) renders**

If broken, stop and debug before proceeding to Phase 2.

---

## Phase 2 — Platform Abstraction

Goal: `usePlatform` composable, `/donate` route placeholder, web redirect guard verified.

### Task 9: Add usePlatform composable with tests

**Files:**
- Create: `src/presentation/composables/usePlatform.ts`
- Create: `src/__tests__/presentation/composables/usePlatform.test.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/presentation/composables/usePlatform.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
    Capacitor: {
        isNativePlatform: vi.fn(),
        getPlatform: vi.fn(),
    },
}));

import { Capacitor } from "@capacitor/core";
import { usePlatform } from "@/presentation/composables/usePlatform";

describe("usePlatform", () => {
    beforeEach(() => {
        vi.mocked(Capacitor.isNativePlatform).mockReset();
        vi.mocked(Capacitor.getPlatform).mockReset();
    });

    it("reports isNative true when capacitor reports native platform", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        vi.mocked(Capacitor.getPlatform).mockReturnValue("android");

        const result = usePlatform();

        expect(result.isNative).toBe(true);
        expect(result.platform).toBe("android");
    });

    it("reports isNative false on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
        vi.mocked(Capacitor.getPlatform).mockReturnValue("web");

        const result = usePlatform();

        expect(result.isNative).toBe(false);
        expect(result.platform).toBe("web");
    });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run src/__tests__/presentation/composables/usePlatform.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/presentation/composables/usePlatform.ts`:

```ts
import { Capacitor } from "@capacitor/core";

export const usePlatform = () => ({
    isNative: Capacitor.isNativePlatform(),
    platform: Capacitor.getPlatform(),
});
```

- [ ] **Step 4: Run — expect pass**

```bash
npx vitest run src/__tests__/presentation/composables/usePlatform.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Verify full suite + lint**

```bash
npx vitest run
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/presentation/composables/usePlatform.ts src/__tests__/presentation/composables/usePlatform.test.ts
git commit -m "✨ feat: add usePlatform composable"
```

---

### Task 10: Add /donate route with placeholder component

**Files:**
- Create: `src/presentation/pages/donate/Donate.vue`
- Modify: `src/router.ts`

- [ ] **Step 1: Create placeholder Donate.vue**

```vue
<template>
    <div class="flex flex-col gap-5 h-dvh px-5 bg-background">
        <h1 class="text-foreground text-xl font-semibold pt-6">Support</h1>
        <p class="text-foreground-muted">Donate page placeholder.</p>
    </div>
</template>

<script lang="ts" setup>
</script>
```

- [ ] **Step 2: Register route**

Edit `src/router.ts`:

```ts
import Donate from "@/presentation/pages/donate/Donate.vue";

export const ROUTER_PATH = {
    home: "/",
    game: "/game",
    statistics: "/statistics",
    settings: "/settings",
    changelog: "/settings/changelog",
    donate: "/donate",
    gameReview: "/game-review/:index",
    gameReviewFor: (index: number) => `/game-review/${index}`,
    solverWalkthrough: "/solver",
};

export const router = createRouter({
    history: createWebHistory(baseUrl),
    routes: [
        { path: "/", component: Home },
        { path: "/game", component: Game },
        { path: "/statistics", component: Statistics },
        { path: "/settings", component: Settings },
        { path: "/settings/changelog", component: Changelog },
        { path: "/donate", component: Donate },
        { path: "/game-review/:index", component: GameReview, props: true },
        { path: "/solver", component: SolverWalkthrough },
        { path: "/:pathMatch(.*)*", redirect: "/" },
    ],
});
```

- [ ] **Step 3: Verify build still works**

```bash
npm run build
```

- [ ] **Step 4: Commit**

```bash
git add src/presentation/pages/donate/Donate.vue src/router.ts
git commit -m "✨ feat: add donate route placeholder"
```

---

### Task 11: Add native-only route guard with tests

**Files:**
- Create: `src/__tests__/router/nativeOnlyGuard.test.ts`
- Modify: `src/router.ts`

- [ ] **Step 1: Write the failing test**

`src/__tests__/router/nativeOnlyGuard.test.ts`:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@capacitor/core", () => ({
    Capacitor: {
        isNativePlatform: vi.fn(),
        getPlatform: vi.fn().mockReturnValue("web"),
    },
}));

import { Capacitor } from "@capacitor/core";
import { applyNativeOnlyGuard, NATIVE_ONLY_ROUTES } from "@/router";

describe("native-only route guard", () => {
    beforeEach(() => {
        vi.mocked(Capacitor.isNativePlatform).mockReset();
    });

    it("redirects /donate to / on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

        const result = applyNativeOnlyGuard({ path: "/donate" });

        expect(result).toBe("/");
    });

    it("allows /donate on native", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

        const result = applyNativeOnlyGuard({ path: "/donate" });

        expect(result).toBeUndefined();
    });

    it("allows non-native-only paths on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

        const result = applyNativeOnlyGuard({ path: "/settings" });

        expect(result).toBeUndefined();
    });

    it("lists /donate as native-only", () => {
        expect(NATIVE_ONLY_ROUTES).toContain("/donate");
    });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run src/__tests__/router/nativeOnlyGuard.test.ts
```

Expected: FAIL (`applyNativeOnlyGuard` not exported).

- [ ] **Step 3: Implement guard in router.ts**

Edit `src/router.ts` — add above the `router` export:

```ts
export const NATIVE_ONLY_ROUTES: string[] = ["/donate"];

export const applyNativeOnlyGuard = (to: { path: string }): string | undefined => {
    if (!NATIVE_ONLY_ROUTES.includes(to.path)) return undefined;
    if (Capacitor.isNativePlatform()) return undefined;
    return "/";
};
```

Add the import:

```ts
import { Capacitor } from "@capacitor/core";
```

Register the guard on the router (after `const router = createRouter(...)`):

```ts
router.beforeEach((to) => applyNativeOnlyGuard(to));
```

- [ ] **Step 4: Run — expect pass**

```bash
npx vitest run src/__tests__/router/nativeOnlyGuard.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Full suite + lint**

```bash
npx vitest run
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/router.ts src/__tests__/router/nativeOnlyGuard.test.ts
git commit -m "✨ feat: guard native-only routes and redirect web users to home"
```

---

## Phase 3 — Analytics

Goal: Events sent to Firebase Analytics from the 7 emission points in the spec.

### Task 12: Define AnalyticsService port and event types

**Files:**
- Create: `src/application/analytics/AnalyticsService.ts`

- [ ] **Step 1: Write the port**

```ts
import type { InjectionKey } from "vue";
import type { Difficulty } from "@/domain";

export type DonateTier = "coffee" | "lunch" | "coding_time";
// Play Console SKU is always `donate_${tier}`.

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

export const ANALYTICS_KEY: InjectionKey<AnalyticsService> = Symbol("AnalyticsService");
```

- [ ] **Step 2: Verify compiles**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/application/analytics/AnalyticsService.ts
git commit -m "✨ feat: define analytics service port and event types"
```

---

### Task 13: Create NoopAnalyticsAdapter and FirebaseAnalyticsAdapter

**Files:**
- Create: `src/infrastructure/analytics/NoopAnalyticsAdapter.ts`
- Create: `src/infrastructure/analytics/FirebaseAnalyticsAdapter.ts`

- [ ] **Step 1: Install Firebase analytics plugin**

```bash
npm install @capacitor-firebase/analytics
```

- [ ] **Step 2: Write noop adapter**

```ts
import type { AnalyticsEvent, AnalyticsService } from "@/application/analytics/AnalyticsService";

export class NoopAnalyticsAdapter implements AnalyticsService {
    async logEvent(_event: AnalyticsEvent): Promise<void> {
        // No-op; web has no analytics.
    }
}
```

- [ ] **Step 3: Write Firebase adapter**

```ts
import { FirebaseAnalytics } from "@capacitor-firebase/analytics";
import type { AnalyticsEvent, AnalyticsService } from "@/application/analytics/AnalyticsService";

export class FirebaseAnalyticsAdapter implements AnalyticsService {
    async logEvent(event: AnalyticsEvent): Promise<void> {
        const { name, ...params } = event;
        await FirebaseAnalytics.logEvent({ name, params });
    }
}
```

- [ ] **Step 4: Verify build**

```bash
npm run build
npm run lint
```

- [ ] **Step 5: Commit**

```bash
git add src/infrastructure/analytics/ package.json package-lock.json
git commit -m "✨ feat: add analytics adapters (noop + firebase)"
```

---

### Task 14: Wire composition root in main.ts

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Update main.ts**

```ts
import { createApp } from "vue";
import { createPinia } from "pinia";
import { Capacitor } from "@capacitor/core";
import "@/style/index.css";
import App from "@/presentation/App.vue";
import { router } from "@/router";

import { useSettingsStore } from "@/stores/settingsStore";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { FirebaseAnalyticsAdapter } from "@/infrastructure/analytics/FirebaseAnalyticsAdapter";
import { NoopAnalyticsAdapter } from "@/infrastructure/analytics/NoopAnalyticsAdapter";

const analytics: AnalyticsService = Capacitor.isNativePlatform()
    ? new FirebaseAnalyticsAdapter()
    : new NoopAnalyticsAdapter();

const app = createApp(App);
app.use(createPinia());
app.use(router);
app.provide(ANALYTICS_KEY, analytics);

useSettingsStore();

app.mount("#root");
```

- [ ] **Step 2: Verify build and tests**

```bash
npm run build
npx vitest run
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "✨ feat: wire analytics service in composition root"
```

---

### Task 15: Emit game_start from gameStore

**Files:**
- Modify: `src/stores/gameStore.ts`
- Modify: `src/__tests__/stores/gameStore.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/__tests__/stores/gameStore.test.ts` (inside the `describe("gameStore", ...)` block):

```ts
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";

it("emits game_start analytics event on startNewGame", async () => {
    const logEvent = vi.fn().mockResolvedValue(undefined);
    const analytics: AnalyticsService = { logEvent };
    setActivePinia(createPinia());
    const pinia = createPinia();
    pinia.use(() => ({ analytics }));

    // Use inject-friendly provider pattern: pass analytics explicitly as parameter.
    const store = useGameStore();
    store.setAnalytics(analytics);

    await store.startNewGame("medium");

    expect(logEvent).toHaveBeenCalledWith({
        name: "game_start",
        difficulty: "medium",
    });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run src/__tests__/stores/gameStore.test.ts
```

Expected: FAIL (`setAnalytics` not on store; `logEvent` not called).

- [ ] **Step 3: Extend gameStore**

Edit `src/stores/gameStore.ts`:

```ts
import { defineStore } from "pinia";
import { computed, ref, shallowRef } from "vue";
import type { Difficulty } from "@/domain";
import { PuzzleCell } from "@/domain/board/PuzzleCell";
import { Sudoku } from "@/domain/game/Sudoku";
import { GameStateConverter, type GameState } from "@/application/GameState";
import { generatePuzzleAsync } from "@/application/PuzzleGenerationService";
import type { AnalyticsService } from "@/application/analytics/AnalyticsService";

export const useGameStore = defineStore("game", () => {
    const difficulty = ref<Difficulty | null>(null);
    const sudoku = shallowRef<Sudoku | null>(null);
    const elapsedSeconds = ref(0);
    const hasActiveGame = computed(() => sudoku.value !== null);
    let analytics: AnalyticsService | null = null;

    const setAnalytics = (service: AnalyticsService) => {
        analytics = service;
    };

    const setDifficulty = (value: Difficulty) => {
        difficulty.value = value;
    };

    const startNewGame = async (newDifficulty: Difficulty) => {
        const { puzzle, answer } = await generatePuzzleAsync(newDifficulty);
        const puzzleCells = puzzle.map((row) => row.map((value) => new PuzzleCell(value)));
        sudoku.value = Sudoku.restoreSave(answer, puzzleCells);
        difficulty.value = newDifficulty;
        elapsedSeconds.value = 0;
        void analytics?.logEvent({ name: "game_start", difficulty: newDifficulty });
    };

    const loadSavedGame = (state: GameState) => {
        sudoku.value = GameStateConverter.toSudoku(state);
        difficulty.value = state.difficulty;
        elapsedSeconds.value = state.elapsedSeconds;
    };

    return {
        difficulty,
        setDifficulty,
        sudoku,
        hasActiveGame,
        startNewGame,
        loadSavedGame,
        elapsedSeconds,
        setAnalytics,
    };
});
```

- [ ] **Step 4: Wire setAnalytics in main.ts**

After `app.use(createPinia())` and before `app.mount`:

```ts
const gameStore = useGameStore();
gameStore.setAnalytics(analytics);
```

(Add the import `import { useGameStore } from "@/stores/gameStore";` at the top.)

- [ ] **Step 5: Run — expect pass**

```bash
npx vitest run src/__tests__/stores/gameStore.test.ts
npx vitest run
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/stores/gameStore.ts src/__tests__/stores/gameStore.test.ts src/main.ts
git commit -m "✨ feat: emit game_start analytics event"
```

---

### Task 16: Emit game_complete from useGameCompletion

**Files:**
- Modify: `src/presentation/pages/game/useGameCompletion.ts`
- Create: `src/__tests__/presentation/pages/game/useGameCompletion.test.ts` (if absent; else extend)

- [ ] **Step 1: Inspect the existing hook**

```bash
cat src/presentation/pages/game/useGameCompletion.ts
```

Note the shape of the function and how `difficulty`, `elapsedSeconds`, `hintsUsed`, and `sudoku` are available.

- [ ] **Step 2: Write the failing test**

Create `src/__tests__/presentation/pages/game/useGameCompletion.test.ts` using a mounted component pattern. The test should:
- Mount a minimal harness that provides `ANALYTICS_KEY` with a mock `logEvent`.
- Trigger the completion path (simulate `sudoku.isCompleted()` becoming true).
- Assert `logEvent` called with `{ name: "game_complete", difficulty, time_seconds, hints_used }`.

Reference pattern from existing tests like `src/__tests__/presentation/Changelog.test.ts` for mount setup.

Example skeleton:

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, h, ref, nextTick } from "vue";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { useGameCompletion } from "@/presentation/pages/game/useGameCompletion";

// ...set up a fake sudoku with isCompleted ref, elapsedSeconds, hintTracker...

it("logs game_complete when sudoku becomes completed", async () => {
    const logEvent = vi.fn().mockResolvedValue(undefined);
    const analytics: AnalyticsService = { logEvent };

    // Mount a minimal Vue component that calls useGameCompletion
    // and provides ANALYTICS_KEY via app.provide.
    // After transitioning the sudoku to completed, await nextTick and assert.

    expect(logEvent).toHaveBeenCalledWith({
        name: "game_complete",
        difficulty: "easy",
        time_seconds: 300,
        hints_used: 1,
    });
});
```

(Fill in the exact mount/fake-sudoku scaffolding by reading `useGameCompletion.ts` and reusing fixtures from `src/__tests__/fixtures/`.)

- [ ] **Step 3: Run — expect failure**

```bash
npx vitest run src/__tests__/presentation/pages/game/useGameCompletion.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Modify useGameCompletion.ts**

Inject the analytics service via `inject(ANALYTICS_KEY)` and call `logEvent` at the point where the existing code detects completion. Include `difficulty`, `time_seconds: elapsedSeconds`, and `hints_used: sudoku.hintTracker.recordedUsed`.

- [ ] **Step 5: Run — expect pass**

```bash
npx vitest run src/__tests__/presentation/pages/game/useGameCompletion.test.ts
npx vitest run
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/presentation/pages/game/useGameCompletion.ts src/__tests__/presentation/pages/game/useGameCompletion.test.ts
git commit -m "✨ feat: emit game_complete analytics event"
```

---

### Task 17: Emit game_abandon from useLeaveGame

**Files:**
- Modify: `src/presentation/pages/game/useLeaveGame.ts`
- Create: `src/__tests__/presentation/pages/game/useLeaveGame.test.ts` (if absent; else extend)

- [ ] **Step 1: Inspect useLeaveGame and compute progress_pct**

```bash
cat src/presentation/pages/game/useLeaveGame.ts
```

`progress_pct` = `Math.round((filled_cells / 81) * 100)`. The existing `sudoku` object exposes `puzzle` cells; count cells where `cell.entry !== 0 || cell.isClue`.

- [ ] **Step 2: Write the failing test**

Mirror the structure of the Task 16 test. Mount a harness, provide `ANALYTICS_KEY`, invoke the leave action, and assert:

```ts
expect(logEvent).toHaveBeenCalledWith({
    name: "game_abandon",
    difficulty: "medium",
    progress_pct: 42,   // computed from the fake sudoku's filled cells
});
```

- [ ] **Step 3: Run — expect failure**

- [ ] **Step 4: Modify useLeaveGame.ts**

Inject `ANALYTICS_KEY` and call `logEvent` with the computed `progress_pct`. Compute `progress_pct` before clearing state, so it reflects the user's actual progress at abandon time.

- [ ] **Step 5: Run — expect pass + full suite + lint**

- [ ] **Step 6: Commit**

```bash
git commit -m "✨ feat: emit game_abandon analytics event"
```

---

### Task 18: Emit hint_used from useHintActions

**Files:**
- Modify: `src/presentation/pages/game/useHintActions.ts`
- Create: `src/__tests__/presentation/pages/game/useHintActions.test.ts` (or extend existing)

- [ ] **Step 1: Build the name mapping**

| Action id (existing) | Event `hint_type` |
|---|---|
| `autoNotes` | `auto_notes` |
| `checkConflicts` | `check_conflicts` |
| `checkErrors` | `check_errors` |
| `revealCell` | `reveal_cell` |

- [ ] **Step 2: Write the failing test**

```ts
// Four cases — one per action id.
it("logs hint_used with auto_notes for autoNotes action", async () => {
    const logEvent = vi.fn().mockResolvedValue(undefined);
    // mount harness providing ANALYTICS_KEY; trigger the autoNotes action.
    expect(logEvent).toHaveBeenCalledWith({ name: "hint_used", hint_type: "auto_notes" });
});
// ...repeat for checkConflicts → check_conflicts, etc.
```

- [ ] **Step 3: Run — expect failure**

- [ ] **Step 4: Implement in useHintActions.ts**

Inside the `switch (action)` block, after the existing hint application, add:

```ts
const analytics = inject(ANALYTICS_KEY);
const HINT_EVENT_NAME: Record<Exclude<HintAction, "close">, AnalyticsEvent & { name: "hint_used" } extends infer T ? T extends { hint_type: infer H } ? H : never : never> = {
    autoNotes: "auto_notes",
    checkConflicts: "check_conflicts",
    checkErrors: "check_errors",
    revealCell: "reveal_cell",
};

// In each case branch (or after the switch, guarded by !== "close"):
if (action !== "close") {
    void analytics?.logEvent({ name: "hint_used", hint_type: HINT_EVENT_NAME[action] });
}
```

(Simplify the type if the complex extraction is awkward — a plain `Record<Exclude<HintAction, "close">, "auto_notes" | "check_conflicts" | "check_errors" | "reveal_cell">` is fine.)

- [ ] **Step 5: Run — expect pass + full suite + lint**

- [ ] **Step 6: Commit**

```bash
git commit -m "✨ feat: emit hint_used analytics event per hint type"
```

---

### Task 19: Emit donate_view on Donate page mount

**Files:**
- Modify: `src/presentation/pages/donate/Donate.vue`

(Test will follow in Task 23 once the fuller Donate component is built. For now, a minimal emission is added.)

- [ ] **Step 1: Modify Donate.vue**

```vue
<template>
    <div class="flex flex-col gap-5 h-dvh px-5 bg-background">
        <h1 class="text-foreground text-xl font-semibold pt-6">Support</h1>
        <p class="text-foreground-muted">Donate page placeholder.</p>
    </div>
</template>

<script lang="ts" setup>
import { inject, onMounted } from "vue";
import { ANALYTICS_KEY } from "@/application/analytics/AnalyticsService";

const analytics = inject(ANALYTICS_KEY);

onMounted(() => {
    void analytics?.logEvent({ name: "donate_view" });
});
</script>
```

- [ ] **Step 2: Verify build + tests + lint**

```bash
npm run build
npx vitest run
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/presentation/pages/donate/Donate.vue
git commit -m "✨ feat: emit donate_view on donate page mount"
```

---

### Task 20: Firebase project setup (manual)

- [ ] **Step 1: Create Firebase project**

Visit [console.firebase.google.com](https://console.firebase.google.com/) → Add project → Name "Sudoku".

- [ ] **Step 2: Add Android app**

Firebase console → Project settings → Add app → Android → Package name `io.github.blazer030.sudoku` → Register.

- [ ] **Step 3: Download `google-services.json`**

Place at `android/app/google-services.json`. **Do not commit it if sensitive**; add to `.gitignore` if Firebase setup guide recommends.

- [ ] **Step 4: Follow Capacitor Firebase Analytics plugin setup**

Per [capawesome-team/capacitor-firebase](https://github.com/capawesome-team/capacitor-firebase/blob/main/packages/analytics/README.md):
- Add `google-services` Gradle plugin to `android/build.gradle`
- Add `apply plugin: 'com.google.gms.google-services'` to `android/app/build.gradle`

- [ ] **Step 5: Enable Analytics in Firebase console** (Dashboard → Analytics)

- [ ] **Step 6: Commit Android Gradle changes**

```bash
git add android/build.gradle android/app/build.gradle .gitignore
git commit -m "🚧 chore: wire firebase analytics into android project"
```

---

### Task 21: Manual verification — events reach Firebase

**Prerequisites:** Tasks 1-20 complete; Firebase project live; physical/emulator Android device connected.

- [ ] **Step 1: Build and install APK**

```bash
npm run android:build:dev
npm run android:open
```

In Android Studio, run on device.

- [ ] **Step 2: Exercise the app**
- Start a new game (easy) → `game_start`
- Use a hint (auto notes) → `hint_used`
- Complete the puzzle or leave → `game_complete` / `game_abandon`
- Navigate to `/donate` → `donate_view`

- [ ] **Step 3: Check Firebase real-time dashboard**

Firebase console → Analytics → Real-time. Expect to see event names in the left panel within 30 seconds.

- [ ] **Step 4: Take a screenshot for verification**

Save to a gitignored scratch folder or Slack the team.

**Do not commit.** This task produces no code changes.

---

## Phase 4 — Donate UI

Goal: The Donate page renders products, handles purchase flow state, and shows a success screen. Wired to `NoopBillingAdapter` for now; real Play Billing comes in Phase 5.

### Task 22: Define BillingService port and types

**Files:**
- Create: `src/application/billing/BillingService.ts`

- [ ] **Step 1: Write the port**

```ts
import type { InjectionKey } from "vue";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

export interface Product {
    id: string;              // Play SKU e.g. "donate_coffee"
    tier: DonateTier;        // "coffee" | "lunch" | "coding_time"
    label: string;           // "Coffee"
    priceText: string;       // "$2.99" or localized
    amountUsd: number;       // 2.99
}

export type PurchaseResult =
    | { kind: "success"; productId: string; tier: DonateTier; amountUsd: number }
    | { kind: "cancelled" }
    | { kind: "error"; reason: string };

export interface BillingService {
    loadProducts(): Promise<Product[]>;
    purchase(productId: string): Promise<PurchaseResult>;
    consumeAll(): Promise<void>;
}

export const BILLING_KEY: InjectionKey<BillingService> = Symbol("BillingService");
```

- [ ] **Step 2: Commit**

```bash
git add src/application/billing/BillingService.ts
git commit -m "✨ feat: define billing service port"
```

---

### Task 23: Create NoopBillingAdapter

**Files:**
- Create: `src/infrastructure/billing/NoopBillingAdapter.ts`

- [ ] **Step 1: Write adapter**

```ts
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

const FAKE_PRODUCTS: Product[] = [
    { id: "donate_coffee",       tier: "coffee",       label: "Coffee",      priceText: "$2.99", amountUsd: 2.99 },
    { id: "donate_lunch",        tier: "lunch",        label: "Lunch",       priceText: "$5.99", amountUsd: 5.99 },
    { id: "donate_coding_time",  tier: "coding_time",  label: "Coding Time", priceText: "$9.99", amountUsd: 9.99 },
];

export class NoopBillingAdapter implements BillingService {
    async loadProducts(): Promise<Product[]> {
        return FAKE_PRODUCTS;
    }
    async purchase(productId: string): Promise<PurchaseResult> {
        const product = FAKE_PRODUCTS.find((p) => p.id === productId);
        if (!product) return { kind: "error", reason: "Unknown product" };
        return { kind: "success", productId, tier: product.tier, amountUsd: product.amountUsd };
    }
    async consumeAll(): Promise<void> {
        // no-op
    }
}
```

Returning fake products (rather than empty) lets the web developer preview the UI without Android. When the real `PlayBillingAdapter` lands, it replaces this on native platforms only.

- [ ] **Step 2: Commit**

```bash
git add src/infrastructure/billing/NoopBillingAdapter.ts
git commit -m "✨ feat: add noop billing adapter with fake products"
```

---

### Task 24: Wire BillingService in composition root

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Add provision**

```ts
import { BILLING_KEY, type BillingService } from "@/application/billing/BillingService";
import { NoopBillingAdapter } from "@/infrastructure/billing/NoopBillingAdapter";

// After analytics setup:
const billing: BillingService = new NoopBillingAdapter();   // Replaced in Phase 5 on native.
app.provide(BILLING_KEY, billing);
```

- [ ] **Step 2: Commit**

```bash
git add src/main.ts
git commit -m "✨ feat: wire billing service in composition root"
```

---

### Task 25: Create donateStore with tests

**Files:**
- Create: `src/stores/donateStore.ts`
- Create: `src/__tests__/stores/donateStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useDonateStore } from "@/stores/donateStore";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

const sampleProducts: Product[] = [
    { id: "donate_coffee", tier: "coffee", label: "Coffee", priceText: "$2.99", amountUsd: 2.99 },
];

const mockBilling = (overrides: Partial<BillingService> = {}): BillingService => ({
    loadProducts: vi.fn().mockResolvedValue(sampleProducts),
    purchase: vi.fn().mockResolvedValue({ kind: "success", productId: "donate_coffee", tier: "coffee", amountUsd: 2.99 } satisfies PurchaseResult),
    consumeAll: vi.fn().mockResolvedValue(undefined),
    ...overrides,
});

describe("donateStore", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it("starts with empty products, no purchase in flight, no result", () => {
        const store = useDonateStore();
        expect(store.products).toEqual([]);
        expect(store.purchasing).toBeNull();
        expect(store.lastResult).toBeNull();
    });

    it("loadProducts fetches via billing service", async () => {
        const store = useDonateStore();
        const billing = mockBilling();
        store.setBilling(billing);

        await store.loadProducts();

        expect(billing.consumeAll).toHaveBeenCalled();
        expect(billing.loadProducts).toHaveBeenCalled();
        expect(store.products).toEqual(sampleProducts);
    });

    it("purchase sets purchasing then stores success result", async () => {
        const store = useDonateStore();
        store.setBilling(mockBilling());

        await store.purchase("donate_coffee");

        expect(store.purchasing).toBeNull();
        expect(store.lastResult).toEqual({
            kind: "success",
            productId: "donate_coffee",
            tier: "coffee",
            amountUsd: 2.99,
        });
    });

    it("blocks concurrent purchases", async () => {
        const store = useDonateStore();
        const purchaseFn = vi.fn().mockImplementation(
            () => new Promise((resolve) => setTimeout(() => resolve({ kind: "cancelled" }), 10))
        );
        store.setBilling(mockBilling({ purchase: purchaseFn }));

        const first = store.purchase("donate_coffee");
        const second = store.purchase("donate_lunch");

        await Promise.all([first, second]);
        expect(purchaseFn).toHaveBeenCalledTimes(1);
    });

    it("records cancelled result", async () => {
        const store = useDonateStore();
        store.setBilling(mockBilling({
            purchase: vi.fn().mockResolvedValue({ kind: "cancelled" } satisfies PurchaseResult),
        }));

        await store.purchase("donate_coffee");

        expect(store.lastResult).toEqual({ kind: "cancelled" });
    });
});
```

- [ ] **Step 2: Run — expect failure**

```bash
npx vitest run src/__tests__/stores/donateStore.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Implement donateStore**

```ts
import { defineStore } from "pinia";
import { ref } from "vue";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";

export const useDonateStore = defineStore("donate", () => {
    const products = ref<Product[]>([]);
    const purchasing = ref<string | null>(null);
    const lastResult = ref<PurchaseResult | null>(null);
    let billing: BillingService | null = null;

    const setBilling = (service: BillingService) => {
        billing = service;
    };

    const loadProducts = async () => {
        if (billing === null) return;
        await billing.consumeAll();
        products.value = await billing.loadProducts();
    };

    const purchase = async (productId: string) => {
        if (billing === null) return;
        if (purchasing.value !== null) return;
        purchasing.value = productId;
        try {
            lastResult.value = await billing.purchase(productId);
        } finally {
            purchasing.value = null;
        }
    };

    return { products, purchasing, lastResult, setBilling, loadProducts, purchase };
});
```

- [ ] **Step 4: Run — expect pass**

```bash
npx vitest run src/__tests__/stores/donateStore.test.ts
npx vitest run
npm run lint
```

- [ ] **Step 5: Wire donateStore to billing in main.ts**

After `app.provide(BILLING_KEY, billing)`:

```ts
import { useDonateStore } from "@/stores/donateStore";
// ...
const donateStore = useDonateStore();
donateStore.setBilling(billing);
```

- [ ] **Step 6: Commit**

```bash
git add src/stores/donateStore.ts src/__tests__/stores/donateStore.test.ts src/main.ts
git commit -m "✨ feat: add donate store with purchase flow"
```

---

### Task 26: Build Donate.vue UI

**Files:**
- Modify: `src/presentation/pages/donate/Donate.vue`
- Create: `src/presentation/pages/donate/components/DonateSuccess.vue`

- [ ] **Step 1: Implement DonateSuccess component**

```vue
<template>
    <div class="fixed inset-0 flex flex-col items-center justify-center bg-background z-30">
        <FireworkCanvas />
        <div class="relative flex flex-col items-center gap-4 p-6">
            <span class="text-6xl">{{ emoji }}</span>
            <span class="text-foreground text-2xl font-semibold">Thank you for the {{ label }}!</span>
            <button
                class="mt-6 px-8 py-3 bg-primary text-white rounded-2xl font-medium cursor-pointer"
                data-testid="donate-success-done"
                @click="$emit('done')"
            >
                Done
            </button>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import FireworkCanvas from "@/presentation/pages/game/components/FireworkCanvas.vue";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

const props = defineProps<{ tier: DonateTier }>();
defineEmits<{ done: [] }>();

const TIER_META: Record<DonateTier, { emoji: string; label: string }> = {
    coffee:       { emoji: "☕", label: "Coffee" },
    lunch:        { emoji: "🍱", label: "Lunch" },
    coding_time:  { emoji: "💻", label: "Coding Time" },
};

const emoji = computed(() => TIER_META[props.tier].emoji);
const label = computed(() => TIER_META[props.tier].label);
</script>
```

- [ ] **Step 2: Implement full Donate.vue**

```vue
<template>
    <div class="flex flex-col gap-5 h-dvh px-5 bg-background overflow-y-auto">
        <div class="flex items-center justify-between sticky top-0 bg-background pt-6 pb-3 z-10">
            <button
                class="flex items-center gap-2 cursor-pointer"
                data-testid="back-button"
                @click="goBack"
            >
                <ChevronLeft :size="24" class="text-foreground" />
                <span class="text-foreground text-base font-medium">Back</span>
            </button>
            <span class="text-foreground text-lg font-semibold">Support</span>
            <div class="w-15" />
        </div>

        <p class="text-foreground-muted text-[15px] leading-relaxed">
            Sudoku is 100% free, no ads.<br>
            If you'd like to support development:
        </p>

        <div class="bg-card rounded-2xl shadow-card-sm divide-y divide-border">
            <button
                v-for="product in store.products"
                :key="product.id"
                class="flex items-center justify-between w-full px-4 py-4 cursor-pointer disabled:opacity-50"
                :disabled="store.purchasing !== null"
                :data-testid="`donate-tier-${product.tier}`"
                @click="onTap(product)"
            >
                <div class="flex items-center gap-3">
                    <span class="text-2xl">{{ emojiFor(product.tier) }}</span>
                    <span class="text-foreground text-[15px] font-medium">{{ product.label }}</span>
                </div>
                <div class="flex items-center gap-1.5">
                    <span class="text-foreground-muted text-[15px]">{{ product.priceText }}</span>
                    <ChevronRight :size="18" class="text-foreground-muted" />
                </div>
            </button>
        </div>

        <p class="text-foreground-muted text-[12px] text-center">
            Payments handled by Google Play
        </p>

        <DonateSuccess
            v-if="successTier !== null"
            :tier="successTier"
            @done="dismissSuccess"
        />
    </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { useDonateStore } from "@/stores/donateStore";
import { ANALYTICS_KEY, type DonateTier } from "@/application/analytics/AnalyticsService";
import type { Product } from "@/application/billing/BillingService";
import DonateSuccess from "@/presentation/pages/donate/components/DonateSuccess.vue";

const router = useRouter();
const store = useDonateStore();
const analytics = inject(ANALYTICS_KEY);
const successTier = ref<DonateTier | null>(null);

const TIER_EMOJI: Record<DonateTier, string> = {
    coffee: "☕",
    lunch: "🍱",
    coding_time: "💻",
};

const emojiFor = (tier: DonateTier) => TIER_EMOJI[tier];

const goBack = () => router.back();

const onTap = async (product: Product) => {
    void analytics?.logEvent({ name: "donate_tap", tier: product.tier });
    await store.purchase(product.id);
};

const dismissSuccess = () => {
    successTier.value = null;
};

watch(() => store.lastResult, (result) => {
    if (result?.kind === "success") {
        successTier.value = result.tier;
        void analytics?.logEvent({
            name: "donate_success",
            tier: result.tier,
            amount_usd: result.amountUsd,
        });
    }
});

onMounted(async () => {
    void analytics?.logEvent({ name: "donate_view" });
    await store.loadProducts();
});
</script>
```

- [ ] **Step 3: Verify build + lint + existing tests**

```bash
npm run build
npx vitest run
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/presentation/pages/donate/Donate.vue src/presentation/pages/donate/components/DonateSuccess.vue
git commit -m "✨ feat: build donate page with tier list and success screen"
```

---

### Task 27: Add donate_tap and donate_success emission tests

**Files:**
- Create: `src/__tests__/presentation/pages/donate/Donate.test.ts`

- [ ] **Step 1: Write tests**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Donate from "@/presentation/pages/donate/Donate.vue";
import { ANALYTICS_KEY, type AnalyticsService } from "@/application/analytics/AnalyticsService";
import { useDonateStore } from "@/stores/donateStore";
import type { BillingService, Product } from "@/application/billing/BillingService";

const fakeProducts: Product[] = [
    { id: "donate_coffee", tier: "coffee", label: "Coffee", priceText: "$2.99", amountUsd: 2.99 },
];

const mountDonate = (analytics: AnalyticsService) => {
    setActivePinia(createPinia());
    const store = useDonateStore();
    const billing: BillingService = {
        loadProducts: vi.fn().mockResolvedValue(fakeProducts),
        purchase: vi.fn().mockResolvedValue({
            kind: "success",
            productId: "donate_coffee",
            tier: "coffee",
            amountUsd: 2.99,
        }),
        consumeAll: vi.fn().mockResolvedValue(undefined),
    };
    store.setBilling(billing);

    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div />" } }, { path: "/donate", component: Donate }],
    });

    return mount(Donate, {
        global: {
            plugins: [router],
            provide: { [ANALYTICS_KEY as symbol]: analytics },
        },
    });
};

describe("Donate.vue", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("emits donate_view on mount", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        mountDonate({ logEvent });
        await flushPromises();
        expect(logEvent).toHaveBeenCalledWith({ name: "donate_view" });
    });

    it("emits donate_tap when a tier is tapped", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const wrapper = mountDonate({ logEvent });
        await flushPromises();

        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(logEvent).toHaveBeenCalledWith({ name: "donate_tap", tier: "coffee" });
    });

    it("emits donate_success after a successful purchase", async () => {
        const logEvent = vi.fn().mockResolvedValue(undefined);
        const wrapper = mountDonate({ logEvent });
        await flushPromises();
        await wrapper.find("[data-testid='donate-tier-coffee']").trigger("click");
        await flushPromises();

        expect(logEvent).toHaveBeenCalledWith({
            name: "donate_success",
            tier: "coffee",
            amount_usd: 2.99,
        });
    });
});
```

- [ ] **Step 2: Run — expect pass (implementation already in place)**

```bash
npx vitest run src/__tests__/presentation/pages/donate/Donate.test.ts
```

If a test fails, inspect the DOM (`wrapper.html()`) and adjust selectors or state wiring.

- [ ] **Step 3: Commit**

```bash
git add src/__tests__/presentation/pages/donate/Donate.test.ts
git commit -m "🧪 test: cover donate analytics emissions"
```

---

### Task 28: Add Support section in Settings (native-only)

**Files:**
- Modify: `src/presentation/pages/settings/Settings.vue`
- Modify: `src/router.ts` (use `ROUTER_PATH.donate`)

- [ ] **Step 1: Modify Settings.vue**

Inside `<template>`, add after the `Gameplay` section and before the `About` section:

```vue
<div v-if="platform.isNative" class="flex flex-col gap-2">
    <span class="text-foreground-muted text-xs font-semibold tracking-wider uppercase px-1">Support</span>
    <div class="bg-card rounded-2xl px-4 shadow-card-sm">
        <button
            class="flex items-center justify-between py-3.5 cursor-pointer w-full"
            data-testid="donate-link"
            @click="goToDonate"
        >
            <span class="text-foreground text-[15px] font-medium">Donate</span>
            <ChevronRight :size="18" class="text-foreground-muted" />
        </button>
    </div>
</div>
```

In `<script setup>`:

```ts
import { usePlatform } from "@/presentation/composables/usePlatform";

const platform = usePlatform();

const goToDonate = () => {
    void router.push(ROUTER_PATH.donate);
};
```

- [ ] **Step 2: Write the failing test** (create or extend `src/__tests__/presentation/pages/settings/Settings.test.ts`)

```ts
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Settings from "@/presentation/pages/settings/Settings.vue";

vi.mock("@capacitor/core", () => ({
    Capacitor: {
        isNativePlatform: vi.fn(),
        getPlatform: vi.fn().mockReturnValue("web"),
    },
}));

import { Capacitor } from "@capacitor/core";

const mountSettings = () => {
    setActivePinia(createPinia());
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div />" } },
            { path: "/settings", component: Settings },
            { path: "/donate", component: { template: "<div />" } },
        ],
    });
    return mount(Settings, { global: { plugins: [router] } });
};

describe("Settings.vue - Support section", () => {
    it("hides Support section on web", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
        const wrapper = mountSettings();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(false);
    });

    it("shows Support section on native", () => {
        vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
        const wrapper = mountSettings();
        expect(wrapper.find("[data-testid='donate-link']").exists()).toBe(true);
    });
});
```

- [ ] **Step 3: Run — expect pass (code already in place from Step 1)**

```bash
npx vitest run src/__tests__/presentation/pages/settings/Settings.test.ts
npx vitest run
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/presentation/pages/settings/Settings.vue src/router.ts src/__tests__/presentation/pages/settings/Settings.test.ts
git commit -m "✨ feat: add support section to settings on native"
```

---

## Phase 5 — IAP Wiring

Goal: Real Play Billing on native. License Tester can complete a sandbox purchase end-to-end.

### Task 29: Install Play Billing plugin

**Files:**
- Modify: `package.json`, `package-lock.json`

> **Plugin choice:** `capacitor-plugin-cdv-purchase` is the Capacitor wrapper for `cordova-plugin-purchase` v13. It targets Google Play Billing 7 on Android and StoreKit 2 on iOS, has zero runtime deps, and exposes an event-driven `CdvPurchase.store` API. This replaces the originally specced `@squareetlabs/capacitor-google-play-billing`, which is not published on npm.

- [ ] **Step 1: Install**

```bash
npm install capacitor-plugin-cdv-purchase
npx cap sync android
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json android/
git commit -m "🚧 chore: install play billing plugin"
```

---

### Task 30: Implement PlayBillingAdapter with result-transformation tests

**Files:**
- Create: `src/infrastructure/billing/PlayBillingAdapter.ts`
- Create: `src/__tests__/infrastructure/billing/PlayBillingAdapter.test.ts`

- [ ] **Step 1: Inspect plugin API**

```bash
ls node_modules/capacitor-plugin-cdv-purchase/
cat node_modules/capacitor-plugin-cdv-purchase/types/index.d.ts
```

Key surface used by the adapter (from `CdvPurchase` namespace in `node_modules/capacitor-plugin-cdv-purchase/www/store.d.ts`):

- `store.register([{ id, type: ProductType.CONSUMABLE, platform: Platform.GOOGLE_PLAY }, ...])` — declare products at startup
- `store.initialize([Platform.GOOGLE_PLAY])` → `Promise<IError[]>` — kick off the platform adapter
- `store.when()` → fluent `When` chain with `productUpdated(cb)`, `approved(cb)`, `error(cb)` — register event listeners
- `store.get(id, Platform.GOOGLE_PLAY)` → `Product | undefined` with `.getOffer()` and `.pricing` (`{ price, priceMicros, currency }`)
- `offer.order()` → `Promise<IError | undefined>` — launches Google Play purchase UI; resolves with `IError` on failure (including `ErrorCode.PAYMENT_CANCELLED`) or `undefined` if the flow proceeds to the `approved` event
- `transaction.finish()` → `Promise<void>` — for consumables this calls `consumePurchase` natively; we call it from the `approved` callback
- `store.localTransactions` → array of all known transactions; used by `consumeAll` to clean up unfinished purchases on startup

Because the API is event-driven, the adapter has to bridge events to the port's promise-based contract:

- `loadProducts()`: register products + initialize on first call, then resolve once a `productUpdated` callback has supplied pricing for every registered SKU
- `purchase(id)`: store a pending resolver keyed by productId, call `offer.order()`. If `order()` resolves with a non-cancellation error, resolve immediately. Otherwise wait for the `approved` event matching the productId, call `transaction.finish()`, then resolve with `kind: "success"`
- `consumeAll()`: iterate `store.localTransactions`, call `.finish()` on any whose `state` is APPROVED but not yet FINISHED — guards against the user closing the app between approve and consume

- [ ] **Step 2: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

type EventName =
    | "productUpdated" | "receiptUpdated" | "approved" | "verified" | "unverified"
    | "initiated" | "pending" | "finished" | "receiptsReady" | "receiptsVerified" | "storefrontUpdated" | "updated";

interface FakeOffer {
    order: ReturnType<typeof vi.fn>;
}
interface FakeProduct {
    id: string;
    pricing: { price: string; priceMicros: number; currency?: string };
    getOffer: () => FakeOffer;
}
interface FakeTransaction {
    products: { id: string }[];
    state: "approved" | "finished" | "initiated" | "pending" | "cancelled" | "";
    finish: ReturnType<typeof vi.fn>;
}

const handlers = new Map<EventName, Array<(arg: unknown) => void>>();
const errorHandlers: Array<(error: { code: number; message: string }) => void> = [];
const productById = new Map<string, FakeProduct>();
const localTransactions: FakeTransaction[] = [];

const registerSpy = vi.fn();
const initializeSpy = vi.fn().mockResolvedValue([]);

const whenChain: Record<EventName, (cb: (arg: unknown) => void) => unknown> = {} as never;
(["productUpdated", "receiptUpdated", "approved", "verified", "unverified", "initiated", "pending", "finished", "receiptsReady", "receiptsVerified", "storefrontUpdated", "updated"] as EventName[])
    .forEach((event) => {
        whenChain[event] = (cb) => {
            const list = handlers.get(event) ?? [];
            list.push(cb);
            handlers.set(event, list);
            return whenChain;
        };
    });

const fakeStore = {
    register: registerSpy,
    initialize: initializeSpy,
    when: () => whenChain,
    get: (id: string) => productById.get(id),
    error: (cb: (error: { code: number; message: string }) => void) => { errorHandlers.push(cb); },
    get localTransactions(): FakeTransaction[] { return localTransactions; },
};

vi.mock("capacitor-plugin-cdv-purchase", () => ({
    store: fakeStore,
    ProductType: { CONSUMABLE: "consumable" },
    Platform: { GOOGLE_PLAY: "android-playstore" },
    ErrorCode: { PAYMENT_CANCELLED: 5, PURCHASE: 2 },
}));

import { PlayBillingAdapter } from "@/infrastructure/billing/PlayBillingAdapter";

const fireProductUpdated = (product: FakeProduct) => {
    productById.set(product.id, product);
    handlers.get("productUpdated")?.forEach((cb) => cb(product));
};

const fireApproved = (transaction: FakeTransaction) => {
    handlers.get("approved")?.forEach((cb) => cb(transaction));
};

const buildProduct = (id: string, price: string, priceMicros: number): FakeProduct => {
    const offer: FakeOffer = { order: vi.fn().mockResolvedValue(undefined) };
    return { id, pricing: { price, priceMicros, currency: "USD" }, getOffer: () => offer };
};

beforeEach(() => {
    handlers.clear();
    errorHandlers.length = 0;
    productById.clear();
    localTransactions.length = 0;
    registerSpy.mockClear();
    initializeSpy.mockClear();
    initializeSpy.mockResolvedValue([]);
});

describe("PlayBillingAdapter", () => {
    it("loadProducts registers the three donate SKUs and resolves once productUpdated fires for each", async () => {
        const adapter = new PlayBillingAdapter();
        const promise = adapter.loadProducts();

        expect(registerSpy).toHaveBeenCalledWith([
            { id: "donate_coffee",      type: "consumable", platform: "android-playstore" },
            { id: "donate_lunch",       type: "consumable", platform: "android-playstore" },
            { id: "donate_coding_time", type: "consumable", platform: "android-playstore" },
        ]);
        expect(initializeSpy).toHaveBeenCalledWith(["android-playstore"]);

        fireProductUpdated(buildProduct("donate_coffee",      "$2.99", 2_990_000));
        fireProductUpdated(buildProduct("donate_lunch",       "$5.99", 5_990_000));
        fireProductUpdated(buildProduct("donate_coding_time", "$9.99", 9_990_000));

        await expect(promise).resolves.toEqual([
            { id: "donate_coffee",      tier: "coffee",      label: "Coffee",      priceText: "$2.99", amountUsd: 2.99 },
            { id: "donate_lunch",       tier: "lunch",       label: "Lunch",       priceText: "$5.99", amountUsd: 5.99 },
            { id: "donate_coding_time", tier: "coding_time", label: "Coding Time", priceText: "$9.99", amountUsd: 9.99 },
        ]);
    });

    it("purchase resolves with success after the approved callback finishes the transaction", async () => {
        const adapter = new PlayBillingAdapter();
        const productsPromise = adapter.loadProducts();
        const product = buildProduct("donate_coffee", "$2.99", 2_990_000);
        fireProductUpdated(product);
        fireProductUpdated(buildProduct("donate_lunch",       "$5.99", 5_990_000));
        fireProductUpdated(buildProduct("donate_coding_time", "$9.99", 9_990_000));
        await productsPromise;

        const finishSpy = vi.fn().mockResolvedValue(undefined);
        const purchasePromise = adapter.purchase("donate_coffee");
        await Promise.resolve();
        fireApproved({ products: [{ id: "donate_coffee" }], state: "approved", finish: finishSpy });

        await expect(purchasePromise).resolves.toEqual({
            kind: "success", productId: "donate_coffee", tier: "coffee", amountUsd: 2.99,
        });
        expect(product.getOffer().order).toHaveBeenCalled();
        expect(finishSpy).toHaveBeenCalled();
    });

    it("purchase resolves with cancelled when order returns PAYMENT_CANCELLED", async () => {
        const adapter = new PlayBillingAdapter();
        const productsPromise = adapter.loadProducts();
        const product = buildProduct("donate_coffee", "$2.99", 2_990_000);
        product.getOffer().order.mockResolvedValue({ code: 5, message: "User cancelled" });
        fireProductUpdated(product);
        fireProductUpdated(buildProduct("donate_lunch",       "$5.99", 5_990_000));
        fireProductUpdated(buildProduct("donate_coding_time", "$9.99", 9_990_000));
        await productsPromise;

        await expect(adapter.purchase("donate_coffee")).resolves.toEqual({ kind: "cancelled" });
    });

    it("purchase resolves with error when order returns a non-cancellation error", async () => {
        const adapter = new PlayBillingAdapter();
        const productsPromise = adapter.loadProducts();
        const product = buildProduct("donate_coffee", "$2.99", 2_990_000);
        product.getOffer().order.mockResolvedValue({ code: 2, message: "Service disconnected" });
        fireProductUpdated(product);
        fireProductUpdated(buildProduct("donate_lunch",       "$5.99", 5_990_000));
        fireProductUpdated(buildProduct("donate_coding_time", "$9.99", 9_990_000));
        await productsPromise;

        await expect(adapter.purchase("donate_coffee")).resolves.toEqual({ kind: "error", reason: "Service disconnected" });
    });

    it("consumeAll finishes any approved-but-unfinished local transaction", async () => {
        const finishApproved = vi.fn().mockResolvedValue(undefined);
        const finishAlreadyDone = vi.fn().mockResolvedValue(undefined);
        localTransactions.push(
            { products: [{ id: "donate_coffee" }], state: "approved", finish: finishApproved },
            { products: [{ id: "donate_lunch" }],  state: "finished", finish: finishAlreadyDone },
        );

        const adapter = new PlayBillingAdapter();
        await adapter.consumeAll();

        expect(finishApproved).toHaveBeenCalled();
        expect(finishAlreadyDone).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 3: Run — expect failure**

```bash
npx vitest run src/__tests__/infrastructure/billing/PlayBillingAdapter.test.ts
```

Expected: FAIL (module not found).

- [ ] **Step 4: Implement PlayBillingAdapter**

```ts
import { store, ProductType, Platform, ErrorCode } from "capacitor-plugin-cdv-purchase";
import type { Product as CdvProduct, Transaction, IError } from "capacitor-plugin-cdv-purchase";
import type { BillingService, Product, PurchaseResult } from "@/application/billing/BillingService";
import type { DonateTier } from "@/application/analytics/AnalyticsService";

const TIER_META: Record<string, { tier: DonateTier; label: string }> = {
    donate_coffee:       { tier: "coffee",       label: "Coffee" },
    donate_lunch:        { tier: "lunch",        label: "Lunch" },
    donate_coding_time:  { tier: "coding_time",  label: "Coding Time" },
};

const PRODUCT_IDS = Object.keys(TIER_META);

export class PlayBillingAdapter implements BillingService {
    private initialized = false;
    private cachedProducts = new Map<string, Product>();
    private productsReady: Promise<Product[]> | null = null;
    private pendingPurchases = new Map<string, (result: PurchaseResult) => void>();

    private ensureSetup(): void {
        if (this.initialized) return;
        this.initialized = true;
        store.register(PRODUCT_IDS.map((id) => ({
            id,
            type: ProductType.CONSUMABLE,
            platform: Platform.GOOGLE_PLAY,
        })));
        store.when()
            .productUpdated((product) => this.handleProductUpdated(product))
            .approved((transaction) => this.handleApproved(transaction));
        void store.initialize([Platform.GOOGLE_PLAY]);
    }

    loadProducts(): Promise<Product[]> {
        this.ensureSetup();
        if (this.productsReady === null) {
            this.productsReady = new Promise<Product[]>((resolve) => {
                this.resolveProductsWhenReady = resolve;
                this.maybeResolveProducts();
            });
        }
        return this.productsReady;
    }

    purchase(productId: string): Promise<PurchaseResult> {
        this.ensureSetup();
        const product = store.get(productId, Platform.GOOGLE_PLAY);
        const offer = product?.getOffer();
        if (offer === undefined) {
            return Promise.resolve({ kind: "error", reason: "Product not available" });
        }
        return new Promise<PurchaseResult>((resolve) => {
            this.pendingPurchases.set(productId, resolve);
            void offer.order().then((error) => {
                if (error === undefined) return;
                this.pendingPurchases.delete(productId);
                if (error.code === ErrorCode.PAYMENT_CANCELLED) {
                    resolve({ kind: "cancelled" });
                } else {
                    resolve({ kind: "error", reason: error.message });
                }
            });
        });
    }

    async consumeAll(): Promise<void> {
        this.ensureSetup();
        for (const transaction of store.localTransactions) {
            if (transaction.state === "approved") {
                await transaction.finish();
            }
        }
    }

    private resolveProductsWhenReady: ((products: Product[]) => void) | null = null;

    private handleProductUpdated(product: CdvProduct): void {
        const meta = TIER_META[product.id];
        if (meta === undefined) return;
        const pricing = product.pricing;
        if (pricing === undefined) return;
        this.cachedProducts.set(product.id, {
            id: product.id,
            tier: meta.tier,
            label: meta.label,
            priceText: pricing.price,
            amountUsd: pricing.priceMicros / 1_000_000,
        });
        this.maybeResolveProducts();
    }

    private maybeResolveProducts(): void {
        if (this.resolveProductsWhenReady === null) return;
        if (this.cachedProducts.size < PRODUCT_IDS.length) return;
        const ordered = PRODUCT_IDS
            .map((id) => this.cachedProducts.get(id))
            .filter((entry): entry is Product => entry !== undefined);
        this.resolveProductsWhenReady(ordered);
        this.resolveProductsWhenReady = null;
    }

    private handleApproved(transaction: Transaction): void {
        const productId = transaction.products[0]?.id;
        if (productId === undefined) return;
        void transaction.finish();
        const resolve = this.pendingPurchases.get(productId);
        const product = this.cachedProducts.get(productId);
        if (resolve === undefined || product === undefined) return;
        this.pendingPurchases.delete(productId);
        resolve({ kind: "success", productId, tier: product.tier, amountUsd: product.amountUsd });
    }
}

// Re-export to silence unused-import warnings if `IError` ends up unused after refactors.
export type { IError };
```

- [ ] **Step 5: Run — expect pass**

```bash
npx vitest run src/__tests__/infrastructure/billing/PlayBillingAdapter.test.ts
npx vitest run
npm run lint
```

- [ ] **Step 6: Commit**

```bash
git add src/infrastructure/billing/PlayBillingAdapter.ts src/__tests__/infrastructure/billing/PlayBillingAdapter.test.ts
git commit -m "✨ feat: add play billing adapter with purchase flow"
```

---

### Task 31: Swap PlayBillingAdapter into composition root on native

**Files:**
- Modify: `src/main.ts`

- [ ] **Step 1: Conditional wiring**

```ts
import { PlayBillingAdapter } from "@/infrastructure/billing/PlayBillingAdapter";

const billing: BillingService = Capacitor.isNativePlatform()
    ? new PlayBillingAdapter()
    : new NoopBillingAdapter();
```

- [ ] **Step 2: Verify build + lint + tests**

```bash
npm run build
npx vitest run
npm run lint
```

- [ ] **Step 3: Commit**

```bash
git add src/main.ts
git commit -m "✨ feat: use play billing adapter on native platforms"
```

---

### Task 32: Create Play Console IAP products (manual)

**Prerequisite:** Task 42 (first AAB uploaded) is required before Play Console will let you create IAP products. Come back to this task after Task 42.

- [ ] **Step 1: Open Play Console → Monetize → Products → In-app products**

- [ ] **Step 2: Create three Consumable products**

| Product ID | Name | Description | Price |
|---|---|---|---|
| `donate_coffee` | Coffee | A small tip to support development | $2.99 |
| `donate_lunch` | Lunch | A medium tip | $5.99 |
| `donate_coding_time` | Coding Time | A generous tip | $9.99 |

Each product: type = Consumable, status = Active.

- [ ] **Step 3: Add yourself as License Tester**

Play Console → Setup → License testing → add your Gmail → License response = "LICENSED".

- [ ] **Step 4: Manual verification: complete a sandbox purchase**

Install the Internal Testing build on your device (must be signed in as the License Tester Google account). Open Donate, tap a tier, Google Play shows "This is a test purchase", complete flow. Expect:
- Donate page shows success screen
- Firebase real-time events: `donate_tap`, `donate_success` (with correct tier and amount_usd)
- Play Console → Orders shows the test order

**Do not commit.** This task is Play Console configuration only.

---

## Phase 6 — Dynamic Launcher Icon

Goal: 6 theme-variant launcher icons; settings toggle that syncs icon to color theme after a one-time confirmation.

### Task 33: Install dynamic icon plugin

> **Plugin choice:** `@capacitor-community/app-icon@^7` is the official community plugin for changing launcher icons on Android (and iOS). API: `AppIcon.change({ name, disable, suppressNotification })` where `name` is the activity-alias short name (without leading dot) and `disable` lists all OTHER alias names to disable simultaneously. This replaces the originally specced `@capgo/capacitor-dynamic-icon`, which is not published on npm.

- [ ] **Step 1: Install**

```bash
npm install @capacitor-community/app-icon
npx cap sync android
```

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json android/
git commit -m "🚧 chore: install dynamic icon plugin"
```

---

### Task 34: Generate 6 launcher icon PNGs per theme

**Files:**
- Create: `scripts/generate-launcher-icons.ts`
- Create: `android/app/src/main/res/mipmap-*/ic_launcher_<theme>.png` (for each theme and density)

- [ ] **Step 1: Inspect existing icon-generation script**

```bash
cat scripts/generate-pwa-icons.ts
```

This script uses `sharp` to scale the master PWA logo. Reuse the loading/scaling pipeline.

- [ ] **Step 2: Write the launcher-icon generator**

```ts
// scripts/generate-launcher-icons.ts
import sharp from "sharp";
import { mkdirSync } from "fs";
import path from "path";

const THEMES: { id: string; color: string }[] = [
    { id: "green",  color: "#3D8A5A" },
    { id: "blue",   color: "#4A7AB5" },
    { id: "purple", color: "#7B5EA7" },
    { id: "orange", color: "#C08040" },
    { id: "pink",   color: "#B5607A" },
    { id: "teal",   color: "#4A9A9A" },
];

const DENSITIES: { name: string; size: number }[] = [
    { name: "mipmap-mdpi",    size: 48 },
    { name: "mipmap-hdpi",    size: 72 },
    { name: "mipmap-xhdpi",   size: 96 },
    { name: "mipmap-xxhdpi",  size: 144 },
    { name: "mipmap-xxxhdpi", size: 192 },
];

const SOURCE_LOGO = path.resolve("public/pwa-512x512.png");  // existing asset
const RES_ROOT = path.resolve("android/app/src/main/res");

async function main() {
    for (const theme of THEMES) {
        for (const { name, size } of DENSITIES) {
            const outDir = path.join(RES_ROOT, name);
            mkdirSync(outDir, { recursive: true });
            const outPath = path.join(outDir, `ic_launcher_${theme.id}.png`);

            const background = await sharp({
                create: {
                    width: size,
                    height: size,
                    channels: 4,
                    background: theme.color,
                },
            }).png().toBuffer();

            const logo = await sharp(SOURCE_LOGO).resize(Math.round(size * 0.65)).toBuffer();

            await sharp(background)
                .composite([{ input: logo, gravity: "center" }])
                .toFile(outPath);
        }
    }
    console.log(`Generated ${THEMES.length * DENSITIES.length} launcher icons.`);
}

void main();
```

- [ ] **Step 3: Add npm script**

In `package.json`, add to scripts:

```json
"generate:launcher-icons": "npx tsx scripts/generate-launcher-icons.ts"
```

- [ ] **Step 4: Run the generator**

```bash
npm run generate:launcher-icons
```

Expected: 30 PNGs created (6 themes × 5 densities).

- [ ] **Step 5: Commit**

```bash
git add scripts/generate-launcher-icons.ts package.json android/app/src/main/res/mipmap-*/ic_launcher_*.png
git commit -m "🚧 chore: generate launcher icons for 6 color themes"
```

---

### Task 35: Add activity-alias entries to AndroidManifest

**Files:**
- Modify: `android/app/src/main/AndroidManifest.xml`

- [ ] **Step 1: Locate the main `<activity android:name=".MainActivity"` block**

- [ ] **Step 2: Change its `android:icon` to reference the default theme (green)**

```xml
<activity
    android:name=".MainActivity"
    android:icon="@mipmap/ic_launcher_green"
    android:roundIcon="@mipmap/ic_launcher_green"
    ...>
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

- [ ] **Step 3: Add 6 activity-alias entries — one per theme (green, blue, purple, orange, pink, teal)**

Just below the main `<activity>` block, still inside `<application>`. The plugin's `AppIcon.change({ name })` API uses the alias short name (without the leading dot), so we name aliases `.green`, `.blue`, `.purple`, `.orange`, `.pink`, `.teal`. We add `.green` too so the adapter can use a single uniform code path for every theme — first install shows green via `<activity android:icon="@mipmap/ic_launcher_green">`, and `change({name: 'green'})` switches to the alias without a visible change.

```xml
<activity-alias
    android:name=".green"
    android:enabled="false"
    android:icon="@mipmap/ic_launcher_green"
    android:roundIcon="@mipmap/ic_launcher_green"
    android:targetActivity=".MainActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity-alias>

<activity-alias
    android:name=".blue"
    android:enabled="false"
    android:icon="@mipmap/ic_launcher_blue"
    android:roundIcon="@mipmap/ic_launcher_blue"
    android:targetActivity=".MainActivity"
    android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity-alias>

<!-- Repeat for .purple, .orange, .pink, .teal — same shape, only android:name and the two icon refs change. -->
```

All 6 aliases have `android:enabled="false"` — only the main `.MainActivity` (showing the green icon) is active on first install.

- [ ] **Step 4: Verify APK still builds**

```bash
npm run android:sync
```

Then in Android Studio, build APK (Build → Build Bundle(s)/APK(s) → Build APK(s)). If it fails, fix manifest errors before proceeding.

- [ ] **Step 5: Commit**

```bash
git add android/app/src/main/AndroidManifest.xml
git commit -m "🚧 chore: add activity-alias entries for per-theme icons"
```

---

### Task 36: Define IconService and adapters

**Files:**
- Create: `src/application/icon/IconService.ts`
- Create: `src/infrastructure/icon/DynamicIconAdapter.ts`
- Create: `src/infrastructure/icon/NoopIconAdapter.ts`

- [ ] **Step 1: Write port**

```ts
import type { InjectionKey } from "vue";
import type { ColorThemeId } from "@/application/SettingsStorage";

export interface IconService {
    setIcon(themeId: ColorThemeId): Promise<void>;
}

export const ICON_KEY: InjectionKey<IconService> = Symbol("IconService");
```

- [ ] **Step 2: Write dynamic adapter**

```ts
import { AppIcon } from "@capacitor-community/app-icon";
import type { ColorThemeId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

// Activity-alias short names declared in AndroidManifest.xml (without the leading dot).
// All 6 themes are aliases so the adapter has one uniform code path.
const ALIAS_NAMES: ColorThemeId[] = ["green", "blue", "purple", "orange", "pink", "teal"];

export class DynamicIconAdapter implements IconService {
    async setIcon(themeId: ColorThemeId): Promise<void> {
        const others = ALIAS_NAMES.filter((id) => id !== themeId);
        await AppIcon.change({ name: themeId, disable: others, suppressNotification: false });
    }
}
```

The `disable` array is REQUIRED on Android — passing all other theme aliases ensures only one alias is enabled at a time. `suppressNotification` is iOS-only and ignored on Android. Verify the import name and method signature match the installed version.

- [ ] **Step 3: Write noop adapter**

```ts
import type { ColorThemeId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

export class NoopIconAdapter implements IconService {
    async setIcon(_themeId: ColorThemeId): Promise<void> {
        // no-op
    }
}
```

- [ ] **Step 4: Wire in main.ts**

```ts
import { ICON_KEY, type IconService } from "@/application/icon/IconService";
import { DynamicIconAdapter } from "@/infrastructure/icon/DynamicIconAdapter";
import { NoopIconAdapter } from "@/infrastructure/icon/NoopIconAdapter";

const icon: IconService = Capacitor.isNativePlatform()
    ? new DynamicIconAdapter()
    : new NoopIconAdapter();
app.provide(ICON_KEY, icon);
```

- [ ] **Step 5: Commit**

```bash
git add src/application/icon/ src/infrastructure/icon/ src/main.ts
git commit -m "✨ feat: add icon service port and adapters"
```

---

### Task 37: Add matchLauncherIconToTheme setting

**Files:**
- Modify: `src/application/SettingsStorage.ts`
- Modify: `src/stores/settingsStore.ts`

- [ ] **Step 1: Extend Settings**

```ts
// src/application/SettingsStorage.ts
export interface Settings {
    colorTheme: ColorThemeId;
    highlightSameDigit: boolean;
    completionFlash: boolean;
    autoRemoveNotes: boolean;
    showRemainingCount: boolean;
    matchLauncherIconToTheme: boolean;
}

const DEFAULT_SETTINGS: Settings = {
    colorTheme: "green",
    highlightSameDigit: true,
    completionFlash: true,
    autoRemoveNotes: true,
    showRemainingCount: true,
    matchLauncherIconToTheme: false,
};
```

(The existing `{ ...DEFAULT_SETTINGS, ...parsed }` spread ensures backward compatibility.)

- [ ] **Step 2: Extend settingsStore**

```ts
const matchLauncherIconToTheme = ref(settings.matchLauncherIconToTheme);

const setMatchLauncherIconToTheme = (value: boolean) => {
    matchLauncherIconToTheme.value = value;
    persistAll();
};
```

Include in `persistAll()`:

```ts
const persistAll = () => {
    saveSettings({
        // ...existing...
        matchLauncherIconToTheme: matchLauncherIconToTheme.value,
    });
};
```

Return `matchLauncherIconToTheme` and `setMatchLauncherIconToTheme` from the store.

- [ ] **Step 3: Verify lint + tests**

```bash
npx vitest run
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/application/SettingsStorage.ts src/stores/settingsStore.ts
git commit -m "✨ feat: add matchLauncherIconToTheme setting"
```

---

### Task 38: Sync icon when theme changes and toggle is ON

**Files:**
- Modify: `src/stores/settingsStore.ts`

- [ ] **Step 1: Write the failing test** — create `src/__tests__/stores/settingsStore.test.ts` if absent

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPinia, setActivePinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import type { IconService } from "@/application/icon/IconService";

vi.mock("@/application/PwaThemeUpdater", () => ({
    updateMetaThemeColor: vi.fn(),
    updateFavicon: vi.fn(),
    updateManifestLink: vi.fn(),
    updateAppleTouchIcon: vi.fn(),
}));

describe("settingsStore — icon sync", () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it("calls IconService.setIcon when theme changes and toggle is ON", async () => {
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const icon: IconService = { setIcon };
        const store = useSettingsStore();
        store.setIconService(icon);
        store.setMatchLauncherIconToTheme(true);

        store.setColorTheme("blue");

        // wait a tick for any async ops in the handler
        await Promise.resolve();

        expect(setIcon).toHaveBeenCalledWith("blue");
    });

    it("does NOT call IconService.setIcon when toggle is OFF", async () => {
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const store = useSettingsStore();
        store.setIconService({ setIcon });
        // toggle is false by default

        store.setColorTheme("blue");
        await Promise.resolve();

        expect(setIcon).not.toHaveBeenCalled();
    });

    it("calls IconService.setIcon when toggle transitions OFF → ON", async () => {
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const store = useSettingsStore();
        store.setIconService({ setIcon });
        store.setColorTheme("purple");
        setIcon.mockClear();

        store.setMatchLauncherIconToTheme(true);
        await Promise.resolve();

        expect(setIcon).toHaveBeenCalledWith("purple");
    });

    it("does not call setIcon when toggle transitions ON → OFF (icon stays)", async () => {
        const setIcon = vi.fn().mockResolvedValue(undefined);
        const store = useSettingsStore();
        store.setIconService({ setIcon });
        store.setMatchLauncherIconToTheme(true);
        setIcon.mockClear();

        store.setMatchLauncherIconToTheme(false);
        await Promise.resolve();

        expect(setIcon).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run — expect failure**

- [ ] **Step 3: Extend settingsStore**

```ts
import type { IconService } from "@/application/icon/IconService";

// inside defineStore:
let iconService: IconService | null = null;
const setIconService = (service: IconService) => {
    iconService = service;
};

const setColorTheme = (id: ColorThemeId) => {
    colorTheme.value = id;
    applyColorTheme();
    persistAll();
    if (matchLauncherIconToTheme.value) {
        void iconService?.setIcon(id);
    }
};

const setMatchLauncherIconToTheme = (value: boolean) => {
    const wasOn = matchLauncherIconToTheme.value;
    matchLauncherIconToTheme.value = value;
    persistAll();
    if (!wasOn && value) {
        // OFF → ON: sync icon immediately
        void iconService?.setIcon(colorTheme.value);
    }
    // ON → OFF: icon stays at last state (no action).
};
```

Return `setIconService` from the store.

- [ ] **Step 4: Wire in main.ts**

```ts
const settingsStore = useSettingsStore();
settingsStore.setIconService(icon);
```

(Place after `useSettingsStore()` is first called.)

- [ ] **Step 5: Run — expect pass + full suite + lint**

- [ ] **Step 6: Commit**

```bash
git add src/stores/settingsStore.ts src/__tests__/stores/settingsStore.test.ts src/main.ts
git commit -m "✨ feat: sync launcher icon with color theme when toggle is on"
```

---

### Task 39: Add icon toggle UI with confirmation dialog

**Files:**
- Modify: `src/presentation/pages/settings/Settings.vue`

- [ ] **Step 1: Add to the Appearance section, after the color theme grid**

```vue
<div v-if="platform.isNative" class="flex items-center justify-between py-3.5">
    <div class="flex flex-col gap-0.5">
        <span class="text-foreground text-[15px] font-medium">Match launcher icon to theme</span>
        <span class="text-foreground-muted text-[13px]">App will briefly restart when changed</span>
    </div>
    <button
        class="relative w-11 h-6 rounded-full transition-colors duration-200 shrink-0 ml-4"
        :class="settingsStore.matchLauncherIconToTheme ? 'bg-primary' : 'bg-foreground-muted'"
        data-testid="toggle-matchLauncherIconToTheme"
        @click="onToggleMatchIcon"
    >
        <div
            class="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-card-sm transition-transform duration-200"
            :class="settingsStore.matchLauncherIconToTheme ? 'translate-x-5.5' : 'translate-x-0.5'"
        />
    </button>
</div>

<div
    v-if="showIconConfirmDialog"
    class="fixed inset-0 bg-black/40 flex items-center justify-center z-40"
>
    <div class="bg-card rounded-2xl p-6 max-w-xs mx-4">
        <p class="text-foreground text-[15px] mb-4">
            Changing the launcher icon will briefly restart the app. Enable?
        </p>
        <div class="flex justify-end gap-3">
            <button
                class="px-4 py-2 text-foreground-muted cursor-pointer"
                data-testid="icon-dialog-cancel"
                @click="cancelEnable"
            >
                Cancel
            </button>
            <button
                class="px-4 py-2 bg-primary text-white rounded-xl cursor-pointer"
                data-testid="icon-dialog-confirm"
                @click="confirmEnable"
            >
                Enable
            </button>
        </div>
    </div>
</div>
```

In `<script setup>`:

```ts
const showIconConfirmDialog = ref(false);

const onToggleMatchIcon = () => {
    if (!settingsStore.matchLauncherIconToTheme) {
        showIconConfirmDialog.value = true;
    } else {
        settingsStore.setMatchLauncherIconToTheme(false);
    }
};

const confirmEnable = () => {
    settingsStore.setMatchLauncherIconToTheme(true);
    showIconConfirmDialog.value = false;
};

const cancelEnable = () => {
    showIconConfirmDialog.value = false;
};
```

- [ ] **Step 2: Add tests** to `src/__tests__/presentation/pages/settings/Settings.test.ts`

```ts
it("shows confirm dialog when enabling match launcher icon", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const wrapper = mountSettings();
    await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
    expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(true);
});

it("enables the setting only after confirm", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const wrapper = mountSettings();
    await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
    await wrapper.find("[data-testid='icon-dialog-confirm']").trigger("click");
    // Assert via store state that matchLauncherIconToTheme is true.
    const { useSettingsStore } = await import("@/stores/settingsStore");
    expect(useSettingsStore().matchLauncherIconToTheme).toBe(true);
});

it("cancel keeps the setting off", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const wrapper = mountSettings();
    await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
    await wrapper.find("[data-testid='icon-dialog-cancel']").trigger("click");
    const { useSettingsStore } = await import("@/stores/settingsStore");
    expect(useSettingsStore().matchLauncherIconToTheme).toBe(false);
});

it("disables without dialog when toggling off", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const wrapper = mountSettings();
    await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
    await wrapper.find("[data-testid='icon-dialog-confirm']").trigger("click");
    await wrapper.find("[data-testid='toggle-matchLauncherIconToTheme']").trigger("click");
    expect(wrapper.find("[data-testid='icon-dialog-confirm']").exists()).toBe(false);
    const { useSettingsStore } = await import("@/stores/settingsStore");
    expect(useSettingsStore().matchLauncherIconToTheme).toBe(false);
});
```

- [ ] **Step 3: Run tests + lint**

```bash
npx vitest run src/__tests__/presentation/pages/settings/Settings.test.ts
npx vitest run
npm run lint
```

- [ ] **Step 4: Commit**

```bash
git add src/presentation/pages/settings/Settings.vue src/__tests__/presentation/pages/settings/Settings.test.ts
git commit -m "✨ feat: add match-launcher-icon toggle with confirm dialog"
```

---

### Task 40: Manual icon verification on device

- [ ] **Step 1: Build and install**

```bash
npm run android:build:dev
```

Install on device via Android Studio.

- [ ] **Step 2: Flow check**
1. Open Settings. Default launcher icon = green (current theme). Toggle should read OFF.
2. Tap toggle → dialog appears → tap Enable. App restarts.
3. After restart, launcher shows green icon (matches current theme).
4. Change color theme to blue. App restarts; launcher icon is now blue.
5. Tap toggle OFF. Icon stays blue.
6. Change theme to pink. Launcher icon stays blue (toggle off).
7. Re-enable toggle, tap Enable. Icon changes to pink.

- [ ] **Step 3: Document any rough edges** (e.g., third-party launcher caching) in the spec's "Open Questions / Risks" section if found.

No code commit for this task (unless issues surface).

---

## Phase 7 — Privacy Policy & Play Store Submission

### Task 41: Generate and commit Privacy Policy

**Files:**
- Create: `public/privacy-policy.html`

- [ ] **Step 1: Generate HTML**

Use [PrivacyPolicyGenerator.info](https://app-privacy-policy-generator.firebaseapp.com/). Fill fields:
- App name: Sudoku
- Platform: Android
- Developer contact email: (your email)
- Data collected: "Anonymous analytics (device info, country, app usage)"
- Third parties: Google Firebase, Google Play Billing

Save generated HTML.

- [ ] **Step 2: Place in `public/privacy-policy.html`**

Prepend a simple `<head>` with `<meta charset="utf-8">` and a `<title>` if the generator omits them. Use Tailwind-free plain HTML — it's a legal page, styling doesn't matter.

- [ ] **Step 3: Verify**

```bash
npm run build
open dist/privacy-policy.html
```

Confirm the page renders.

- [ ] **Step 4: Commit**

```bash
git add public/privacy-policy.html
git commit -m "📄 docs: add privacy policy for google play submission"
```

- [ ] **Step 5: Push to GitHub and wait for Pages redeploy**

```bash
git push origin develop
```

Visit `https://blazer030.github.io/sudoku/privacy-policy.html` after Pages builds (~1 min). Confirm reachable.

---

### Task 42: Configure signing key and first AAB upload

**Files:**
- Modify: `.gitignore`
- Create: `android/app/release-upload-key.jks` (gitignored)
- Create: `android/key.properties` (gitignored)
- Modify: `android/app/build.gradle`

- [ ] **Step 1: Generate upload keystore**

```bash
cd android/app
keytool -genkey -v -keystore release-upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias sudoku-upload
```

Follow prompts (name, password). Remember the passwords — you need them for every release build.

- [ ] **Step 2: Add `android/key.properties`**

```properties
storePassword=<your store password>
keyPassword=<your key password>
keyAlias=sudoku-upload
storeFile=release-upload-key.jks
```

- [ ] **Step 3: Update `.gitignore` at repo root**

```
android/app/release-upload-key.jks
android/key.properties
```

- [ ] **Step 4: Wire keys into `android/app/build.gradle`**

At the top of the file:

```gradle
def keystoreProperties = new Properties()
def keystorePropertiesFile = rootProject.file('key.properties')
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}
```

Inside `android { ... }` block:

```gradle
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile keystoreProperties['storeFile'] ? file(keystoreProperties['storeFile']) : null
        storePassword keystoreProperties['storePassword']
    }
}

buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled false
        proguardFiles getDefaultProguardFiles('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

- [ ] **Step 5: Build release AAB**

In Android Studio: Build → Generate Signed Bundle/APK → Android App Bundle → choose the `release-upload-key.jks`.

Or via CLI:

```bash
npm run android:build:release
cd android
./gradlew bundleRelease
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

- [ ] **Step 6: Upload to Play Console — Internal Testing track**

- Play Console → Testing → Internal testing → Create new release
- Upload `app-release.aab`
- Add release notes
- Save → Review release → Start rollout to Internal testing

Wait for "Available" status (usually instant for Internal Testing).

- [ ] **Step 7: Commit Gradle/config changes**

```bash
git add .gitignore android/app/build.gradle
git commit -m "🚧 chore: wire signing config for release builds"
```

---

### Task 43: Play Console setup (manual)

Work through the full checklist from the spec's Play Console section. Each item below is a Play Console page/form:

- [ ] Developer account: verify Active status; complete identity/phone verification if prompted
- [ ] Payment profile set up (Google Payments merchant account)
- [ ] Tax form W-8BEN submitted
- [ ] Bank account linked
- [ ] Two-factor authentication active on the Google account
- [ ] Create app: package name = `io.github.blazer030.sudoku`, type = App, category = Games > Puzzle
- [ ] Short description (≤ 80 chars)
- [ ] Full description (≤ 4000 chars)
- [ ] App icon (512×512)
- [ ] Feature graphic (1024×500)
- [ ] Screenshots (≥ 2 phone shots; recommend 4–8)
- [ ] Content rating questionnaire → expect Everyone
- [ ] Target audience: adults, not directed at children
- [ ] Data safety questionnaire: collect App activity, Device/other identifiers (both anonymized for Analytics)
- [ ] Ads: No
- [ ] Privacy Policy URL: `https://blazer030.github.io/sudoku/privacy-policy.html`
- [ ] Government / News / COVID-tracking: No
- [ ] License testers list includes your Gmail
- [ ] IAP products created and Active (from Task 32)

**No code commits.** This task is Play Console configuration.

---

### Task 44: Submit to Production

**Prerequisites:** Internal Testing verification complete (Task 21, 32 manual checks all pass).

- [ ] **Step 1: In Play Console → Production → Create new release**

- [ ] **Step 2: Reuse AAB from Internal Testing** (or upload a new one if you changed anything)

- [ ] **Step 3: Review release → Submit for review**

Google review typically takes 1–7 days for new apps.

- [ ] **Step 4: Once approved, add changelog entry**

Edit `src/presentation/pages/settings/Changelog.vue` (or the changelog data source it reads from) to add a v2.0.0 entry:

> **v2.0.0 — First Android release**
> - Packaged for Google Play
> - Added Support/Donate section with tip jar
> - Added dynamic launcher icon option
> - Added anonymous usage analytics

- [ ] **Step 5: Commit changelog and tag**

```bash
git add src/presentation/pages/settings/Changelog.vue
git commit -m "📄 docs: add 2.0.0 entry to changelog"
git tag 2.0.0
git push origin develop --tags
```

---

## Self-Review

### Spec Coverage Check

| Spec Section | Covered By |
|---|---|
| Capacitor wrapping | Tasks 1-8 |
| Package name, app name, version | Tasks 1, 3, 5 |
| `usePlatform` + route guard | Tasks 9-11 |
| AnalyticsService port + adapters | Tasks 12-14 |
| All 7 analytics emission points | Tasks 15-19 (game_start, game_complete, game_abandon, hint_used, donate_view, donate_tap, donate_success) + 27 (donate events wired) |
| Firebase project setup | Task 20 |
| BillingService + Donate UI | Tasks 22-28 |
| PlayBillingAdapter (tested) | Task 30 |
| Play Console IAP products | Task 32 |
| Dynamic icon (6 variants + toggle + confirm + sync) | Tasks 33-40 |
| Privacy Policy + public URL | Task 41 |
| Signing key + first AAB | Task 42 |
| Play Console checklist | Task 43 |
| Production release + changelog | Task 44 |

No gaps identified.

### Placeholder Scan

No TBDs, TODOs, or "add appropriate..." phrases. Every step contains the actual command or code. Two points with minor open-ended language:
- Task 7 Step 1 instructs checking whether the service-worker call exists before adding a guard — this is conditional on existing state, not a placeholder.
- Task 16 Step 4 describes "call logEvent at the point where the existing code detects completion" — the test in Step 2 defines the behavior exactly; the implementer has clear guidance.

### Type/Name Consistency

- `AnalyticsService`, `BillingService`, `IconService` — consistent across tasks
- Injection keys: `ANALYTICS_KEY`, `BILLING_KEY`, `ICON_KEY` — consistent
- Tier ids: `coffee`, `lunch`, `coding_time` — consistent in events and Play Console SKUs (`donate_${tier}`)
- Hint types: `auto_notes`, `check_conflicts`, `check_errors`, `reveal_cell` — consistent

Plan is internally consistent.
