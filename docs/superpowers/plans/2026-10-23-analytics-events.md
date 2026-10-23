# Analytics Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** GA answers how many people are active, which features they use, and whether games end. It gets screen views, user properties, walkthrough events and a richer `game_complete`, reported from Android and the production web build.

**Architecture:** The `AnalyticsService` port gains `setScreen` and `setUserProperty`. `FirebaseAnalyticsAdapter` serves both Android and web, and its calls never reject. Two presentation-layer starters, `startScreenTracking` and `startUserPropertySync`, follow the pattern of `startLauncherIconSync` and are started from `src/main.ts`. Walkthrough and game-completion events are logged where those flows already live. A pure helper derives the new `game_complete` params from the replay.

**Tech Stack:** Vue 3 + TS, vue-router, Pinia, vue-i18n (composition mode), `@capacitor-firebase/analytics` 8.2 (its web half calls the `firebase` JS SDK 12), Vitest + @vue/test-utils.

**Spec:** `docs/superpowers/specs/2026-10-23-analytics-events-design.md`

## Global Constraints

- Ports and adapters: the domain layer imports nothing from analytics; `src/main.ts` picks the adapter.
- Every analytics call is fire-and-forget (`void analytics?.…`) and never breaks the UI.
- Event names are at most 40 characters and user property names at most 24. Property values are at most 36 characters and event param values at most 100. There are at most 25 user properties.
- Nothing that identifies a person: no puzzle contents, no free text, no extra timestamps.
- Tests check which event and params are sent, never copy text (project rule).
- The web build reports only when every `VITE_FIREBASE_*` value is present **and** `VITE_APP_ENV === "production"`. Android reports in every build, as today.
- Commits: English Conventional Commits with an emoji prefix, no trailers. Structural and behavioural changes go in separate commits. Commit at every GREEN.
- Before each commit, run `npx vitest run`, `npm run lint` and `npx vue-tsc --noEmit`. All must be clean.
- Identifiers are spelled out (`row`/`column`, never `r`/`c`/`i`/`idx`).

## Review Focus

1. **A blocked tracker on web** (an ad blocker stops gtag, or the SDK throws). The app keeps working with no unhandled rejection: adapter calls resolve even when the plugin rejects. *Test in Task 1.*
2. **A game resumed from a 2.0.0-era save without a replay.** `game_complete` leaves out `undo_count`, `wrong_entries` and `used_notes` instead of reporting counts from a partial history. *Test in Task 5.*
3. **Back pressed while the walkthrough is still checking the puzzle.** The outcome is unknown, so no `walkthrough_solve` is logged. *Test in Task 4.*
4. **The multiple-solutions or unknown-count dialog dismissed rather than cancelled.** This logs `confirmed: 0`. *Test in Task 4.*
5. **Language set to 跟隨系統 while the system language changes.** The `language` property follows the resolved locale, not the stored preference. *Test in Task 3.*

---

### Task 1: The analytics port grows screens and user properties

**Files:**
- Create: `src/__tests__/fixtures/analyticsSpy.ts`
- Modify: the 7 test files that build `{ logEvent }` analytics objects (`grep -rln "logEvent" src/__tests__`)
- Modify: `src/application/analytics/AnalyticsService.ts`, `src/infrastructure/analytics/FirebaseAnalyticsAdapter.ts`, `src/infrastructure/analytics/NoopAnalyticsAdapter.ts`
- Test: `src/__tests__/infrastructure/analytics/FirebaseAnalyticsAdapter.test.ts` (new)

**Interfaces:**
- Produces:
  - `type ScreenName = "home" | "game" | "statistics" | "settings" | "appearance" | "changelog" | "donate" | "game_review" | "solver"`
  - `type UserPropertyName = "style" | "color_theme" | "color_mode" | "language" | "icon_follows_theme"`
  - `AnalyticsService.setScreen(screen: ScreenName): Promise<void>`
  - `AnalyticsService.setUserProperty(name: UserPropertyName, value: string): Promise<void>`
  - Fixture `createAnalyticsSpy(): { logEvent: Mock; setScreen: Mock; setUserProperty: Mock }`. Each mock resolves to `undefined`, and the object is assignable to `AnalyticsService`.

- [ ] **Step 1 (structural):** Add `createAnalyticsSpy()` with only `logEvent` for now. Replace the hand-built `{ logEvent }` objects in the existing tests with it. Run the full suite (green before and after), then commit `♻️ refactor: share one analytics spy across tests`.
- [ ] **Step 2: Failing adapter tests.** `vi.mock("@capacitor-firebase/analytics")` and test four things:
  - `setScreen("game_review")` calls `FirebaseAnalytics.setCurrentScreen({ screenName: "game_review" })`.
  - `setUserProperty("style", "paper")` calls `FirebaseAnalytics.setUserProperty({ key: "style", value: "paper" })`.
  - `logEvent({ name: "donate_view" })` still calls `logEvent({ name: "donate_view", params: {} })`.
  - When each plugin method rejects, the matching adapter method resolves to `undefined` (`await expect(…).resolves.toBeUndefined()`).
- [ ] **Step 3:** Run `npx vitest run src/__tests__/infrastructure/analytics`. It should FAIL because the methods don't exist yet.
- [ ] **Step 4:** Add the two types and two methods to the port, then implement them in both adapters.
  - Firebase adapter: wrap each plugin call so a rejection is swallowed, which is our call (see Review Focus 1). Do this for `logEvent` too.
  - Noop adapter: no-ops. Change its comment to say it is used when nothing reports (web outside production, or without config).
  - Add `setScreen` and `setUserProperty` mocks to `createAnalyticsSpy`.
- [ ] **Step 5:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 6:** Commit `✨ feat: let analytics report screens and user properties`.

### Task 2: A screen view per page

**Files:**
- Create: `src/presentation/analytics/screenTracking.ts`
- Modify: `src/main.ts` (call `startScreenTracking(router, analytics)` right after the adapter is chosen, before `app.mount`)
- Test: `src/__tests__/presentation/analytics/screenTracking.test.ts`

**Interfaces:**
- Consumes: `ScreenName`, `AnalyticsService` (Task 1), `ROUTER_PATH` and `router` from `@/router`.
- Produces:
  - `screenNameFor(routePath: string): ScreenName | null`. It takes the matched route's path pattern, e.g. `"/game-review/:index"`.
  - `startScreenTracking(router: Router, analytics: AnalyticsService): () => void`. It registers `router.afterEach`, skips navigation failures, and calls `void analytics.setScreen(name)` with the name for `to.matched[0]?.path`, skipping when that name is `null`. The returned function removes the hook.

- [ ] **Step 1: Failing tests.**
  - `screenNameFor` maps every `ROUTER_PATH` pattern:
    - `"/"`→`home`, `"/game"`→`game`, `"/statistics"`→`statistics`, `"/settings"`→`settings`, `"/settings/appearance"`→`appearance`
    - `"/settings/changelog"`→`changelog`, `"/donate"`→`donate`, `"/game-review/:index"`→`game_review`, `"/solver"`→`solver`
    - `"/nope"` returns `null`.
  - Guard test: every route in `router.options.routes` except the `/:pathMatch(.*)*` catch-all has a non-null name, so a new page can't go untracked.
  - With a `createRouter({ history: createMemoryHistory(), routes })` over stub components, check three cases:
    - Pushing `/game-review/3` reports `setScreen("game_review")` once.
    - A navigation cancelled by a guard returning `false` reports nothing.
    - After the stop function runs, navigations report nothing.
- [ ] **Step 2:** Run the file; it should FAIL.
- [ ] **Step 3:** Implement it with a lookup table keyed by the `ROUTER_PATH` values. Wire it in `main.ts`.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: report a screen view for every page`.

### Task 3: User properties follow the settings

**Files:**
- Create: `src/presentation/analytics/userPropertySync.ts`
- Modify: `src/main.ts`. Call the sync **after** `startLocaleSync(...)`, so the first `language` is already resolved. Pass `storeToRefs(useSettingsStore())` refs, `i18n.global.locale` and `{ reportsIconSetting: Capacitor.isNativePlatform() }`.
- Test: `src/__tests__/presentation/analytics/userPropertySync.test.ts`

**Interfaces:**
- Consumes: `effectiveColorMode` from `@/theme/themeIds`, `AnalyticsService` (Task 1).
- Produces:
  - `interface UserPropertySources { style: Ref<StyleId>; colorTheme: Ref<ColorThemeId>; appearance: Ref<ColorMode>; matchLauncherIconToTheme: Ref<boolean>; locale: Ref<string> }`
  - `startUserPropertySync(sources: UserPropertySources, analytics: AnalyticsService, options: { reportsIconSetting: boolean }): () => void`

- [ ] **Step 1: Failing tests**, using plain `ref`s and `createAnalyticsSpy()`.
  - On start it sets all of these:
    - `style`
    - `color_theme`
    - `color_mode` = `effectiveColorMode(style, appearance)`
    - `language` = `locale`
    - `icon_follows_theme` = `"true"`/`"false"`, only when `reportsIconSetting` is true; never called when it is false.
  - With style `paper` and appearance `dark`, `color_mode` is `"light"`.
  - Changing `colorTheme` sets only `color_theme` again. Changing `appearance` on `paper` sets nothing, because the effective mode is unchanged.
  - Changing `locale` from `"en"` to `"zh-Hant"` sets `language` to `"zh-Hant"` (Review Focus 5: a system-language change arrives here through `startLocaleSync`).
  - After the stop function runs, changes set nothing.
- [ ] **Step 2:** Run it; it should FAIL.
- [ ] **Step 3:** Implement it with one `watch(..., { immediate: true })` per property, each over a `computed` value, so only a real change reports. Wire it in `main.ts`.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 5:** Commit `✨ feat: describe each player's setup as analytics user properties`.

### Task 4: Walkthrough events

**Files:**
- Modify: `src/application/analytics/AnalyticsService.ts` (event union), `src/presentation/pages/solver-walkthrough/samplePuzzles.ts`, `src/presentation/pages/solver-walkthrough/SolverWalkthrough.vue`
- Test: `src/__tests__/presentation/pages/solver-walkthrough/samplePuzzles.test.ts`, `src/__tests__/presentation/pages/solver-walkthrough/SolverWalkthrough.test.ts`

**Interfaces:**
- Produces:
  - Event union members:
    - `{ name: "walkthrough_solve"; result: "solved" | "no_solution"; source: "sample" | "own" }`
    - `{ name: "walkthrough_solve"; result: "multiple_solutions" | "unknown_count"; confirmed: 0 | 1; source: "sample" | "own" }`
    - `{ name: "walkthrough_finish" }`
  - `isSamplePuzzle(values: readonly (readonly number[])[]): boolean` in `samplePuzzles.ts`. It is true when the values equal some `SAMPLE_PUZZLES` entry's `puzzle` cell for cell.

- [ ] **Step 1: Failing `isSamplePuzzle` tests.**
  - Each sample is true.
  - A sample with one extra digit is false.
  - An empty board is false.
- [ ] **Step 2:** Run it to see it fail, implement it, and run it again to see it pass. Commit `✨ feat: tell a sample walkthrough puzzle from the player's own`.
- [ ] **Step 3: Failing page tests.** Mount with `provide: { [ANALYTICS_KEY]: spy }` and mock `checkPuzzleAsync` the way the existing tests do.
  - A sample puzzle with `solutionCount` 1 logs `{ name: "walkthrough_solve", result: "solved", source: "sample" }`.
  - A hand-entered puzzle with count 0 logs `result: "no_solution", source: "own"`. The log happens after the dialog closes.
  - Count 2 with the dialog confirmed logs `result: "multiple_solutions", confirmed: 1`. Count 2 with the dialog cancelled logs `confirmed: 0`. Count 2 with the dialog dismissed logs `confirmed: 0` (Review Focus 4).
  - `UNKNOWN_SOLUTION_COUNT` with the dialog confirmed logs `result: "unknown_count", confirmed: 1`.
  - Back while the check is still running logs nothing (Review Focus 3).
  - `walkthrough_finish` behaviour:
    - Stepping playback to the last position logs it once. Going back and forward again doesn't log it again.
    - Solving again (stop, then solve) logs it once more on reaching the end.
    - A path that hasn't reached the end logs nothing.
- [ ] **Step 4:** Run it; it should FAIL.
- [ ] **Step 5:** In `SolverWalkthrough.vue`:
  - Do `inject(ANALYTICS_KEY)`.
  - In `runSolver`, compute `source` from `isSamplePuzzle(userValues.value)` before the check, then log once the outcome is known. Nothing is logged when `check === null`.
  - Take `isLastStep` from `useWalkthroughPlayback`. Log `walkthrough_finish` when it turns true, at most once per `start()`.
  - Our call: a path with a single position counts as finished as soon as it starts.
- [ ] **Step 6:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 7:** Commit `✨ feat: report how walkthrough solves turn out`.

### Task 5: `game_complete` carries undo, wrong entries and notes

**Files:**
- Create: `src/application/analytics/summarizeReplay.ts`
- Modify: `src/application/analytics/AnalyticsService.ts` (add `undo_count?: number; wrong_entries?: number; used_notes?: 0 | 1` to `game_complete`), `src/presentation/pages/game/useGameCompletion.ts` (it already holds `sudoku`, so the answer is `sudoku.answer`)
- Test: `src/__tests__/application/analytics/summarizeReplay.test.ts`, `src/__tests__/presentation/pages/game/useGameCompletion.test.ts`

**Interfaces:**
- Consumes: `GameReplayData` (`initialBoard: CellState[][]`, `steps: GameStep[]`); `GameStep.action` is one of `"fill" | "erase" | "toggleNote" | "autoNotes" | "undo" | "hint"`.
- Produces: `summarizeReplay(replay: GameReplayData, answer: readonly (readonly number[])[]): ReplaySummary | null`, where `interface ReplaySummary { undoCount: number; wrongEntries: number; usedNotes: 0 | 1 }`. It returns `null` when the replay does not start at the beginning of the game, meaning some cell of `initialBoard` with `clue === 0` has an `entry` or `notes`. That is what a game resumed from a save without a replay looks like. Detecting it this way is our call.

- [ ] **Step 1: Failing `summarizeReplay` tests**, built on `knownPuzzle` fixtures.
  - `undoCount` counts `undo` steps.
  - `wrongEntries` counts `fill` steps whose `value !== answer[row][column]`. A wrong fill that is later undone or erased still counts. `hint` steps never count, and a correct fill doesn't count.
  - `usedNotes` is `1` when there is any `toggleNote` or `autoNotes` step, `0` otherwise.
  - An `initialBoard` with one player entry, or with one cell's notes, returns `null`.
  - An empty step list returns `{ undoCount: 0, wrongEntries: 0, usedNotes: 0 }`.
- [ ] **Step 2:** Run it to see it fail, implement it, and run it again to see it pass. Commit `✨ feat: summarise a game's replay for analytics`.
- [ ] **Step 3: Failing completion tests.**
  - A finished game whose replay has a wrong fill and an undo logs `game_complete` with `undo_count: 1, wrong_entries: 1, used_notes: 0` next to the existing params.
  - A replay whose `initialBoard` holds a player entry logs `game_complete` without those three keys: `expect(event).not.toHaveProperty("undo_count")` (Review Focus 2).
- [ ] **Step 4:** Run it; it should FAIL.
- [ ] **Step 5:** In `checkAndComplete`, call `getReplayData()` once and reuse it for both `recordGame` and the summary. Spread the summary's params into the event when it isn't `null`.
- [ ] **Step 6:** Run the full suite, lint and vue-tsc; all should be green.
- [ ] **Step 7:** Commit `✨ feat: add undo, wrong entries and notes to game_complete`.

### Task 6: The production web build reports too

**Files:**
- Create: `src/infrastructure/analytics/webFirebaseConfig.ts`
- Modify: `src/main.ts`, `src/env.d.ts` (declare the seven `VITE_FIREBASE_*` keys as `string | undefined`), `.env.production` (the seven values from `.superpowers/pending/firebase-web-config.env`, copied verbatim)
- Test: `src/__tests__/infrastructure/analytics/webFirebaseConfig.test.ts`

**Interfaces:**
- Produces: `readWebFirebaseConfig(env: Record<string, unknown>): FirebaseOptions | null`, using the type-only import `import type { FirebaseOptions } from "firebase/app"`. It maps `VITE_FIREBASE_API_KEY`→`apiKey`, `AUTH_DOMAIN`→`authDomain`, `PROJECT_ID`→`projectId`, `STORAGE_BUCKET`→`storageBucket`, `MESSAGING_SENDER_ID`→`messagingSenderId`, `APP_ID`→`appId`, `MEASUREMENT_ID`→`measurementId`. It returns `null` unless `env.VITE_APP_ENV === "production"` and all seven are non-empty strings.

- [ ] **Step 1: Failing tests.**
  - With production and all seven keys, it returns the mapped object.
  - With `VITE_APP_ENV: "develop"`, it returns `null`.
  - With production but one key missing or `""`, it returns `null`. Test that for each key with `it.each`.
- [ ] **Step 2:** Run it; it should FAIL.
- [ ] **Step 3:** Implement it, then wire `main.ts`. Off native, when the config is non-null:
  - `const { initializeApp } = await import("firebase/app"); initializeApp(config);`. The dynamic import keeps the Firebase app SDK out of the Android path.
  - Then use `FirebaseAnalyticsAdapter`.
  - Otherwise keep `NoopAnalyticsAdapter`. Native stays on `FirebaseAnalyticsAdapter` as today.
- [ ] **Step 4:** Run the full suite, lint and vue-tsc; all should be green. Run `npm run build` and confirm it succeeds.
- [ ] **Step 5:** Commit `✨ feat: report analytics from the production web build`.
- [ ] **Step 6 (manual check, report the result):** Run `npx vite --mode production --port 5199`. Open it in Chrome DevTools MCP, navigate Home → Settings → 外觀, and confirm `google-analytics.com/g/collect` requests carry `en=screen_view` and the user properties (`up.style` …). Then run `npm run start` (develop) and confirm no collect requests. If the browser tools are unavailable, say so in the report instead of skipping silently.

### Task 7: Docs and privacy policy

**Files:**
- Create: `docs/analytics.md`
- Modify: `public/privacy-policy.html`, `CLAUDE.md`, `README.md`

- [ ] **Step 1:** Write `docs/analytics.md`, in English and short:
  - A table of every event, with its params and the question it answers. This covers the existing 7 events plus `walkthrough_solve`, `walkthrough_finish`, the new `game_complete` params and `screen_view`.
  - A table of every user property, noting `icon_follows_theme` is Android only.
  - "Games left without an ending" = `game_start − game_complete − game_abandon`.
  - Event params must be registered as GA4 custom dimensions or metrics before reports show them. Register `result`, `confirmed`, `source`, `undo_count`, `wrong_entries` and `used_notes`, plus the existing ones if missing.
  - On the web stream, turn off Enhanced measurement's "Page changes based on browser history events" so page views are not counted twice next to our `screen_view`.
  - The web build reports only from production builds that have the `VITE_FIREBASE_*` config; Android reports always, with debug builds visible in DebugView.
- [ ] **Step 2:** Privacy policy, Analytics section.
  - "On Android" becomes "On Android and on the web version".
  - The identifiers bullet adds that on the web, Google Analytics stores a random client ID in a first-party cookie.
  - The app-activity bullet adds walkthrough use and per-game undo and mistake counts.
  - The "Your choices" list adds that on the web, clearing the site's cookies resets the client ID and browser tracking protection can block collection.
  - Update the "Last updated" date to 2026-10-23. The owner reviews the wording.
- [ ] **Step 3:** Update `CLAUDE.md` and `README.md`.
  - `CLAUDE.md` presentation list: add `analytics/` (screen tracking and user-property sync).
  - `CLAUDE.md` infrastructure line: Firebase now also serves the production web build.
  - `CLAUDE.md` Environment section: `.env.production` also holds the `VITE_FIREBASE_*` web config (public identifiers).
  - `README.md` lines 24, 36 and 73: Firebase Analytics on Android and the production web build.
- [ ] **Step 4:** Run the full suite and lint; both should be green.
- [ ] **Step 5:** Commit `📄 docs: document analytics events and the web build's collection`.
