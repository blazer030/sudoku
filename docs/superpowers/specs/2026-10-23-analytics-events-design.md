# Analytics events — design

## Why

The owner wants GA to answer three things, most important first:

1. **How many people are active** (daily / weekly / monthly, and whether they come back).
2. **Which features people actually use.**
3. **Whether games reach an end** — finished or given up — and whether the difficulty feels right.

Today only Android reports to Firebase Analytics (`FirebaseAnalyticsAdapter`); the web build uses `NoopAnalyticsAdapter`. Events today: `game_start`, `game_complete`, `game_abandon`, `hint_used`, `donate_view`, `donate_tap`, `donate_success` (`src/application/analytics/AnalyticsService.ts`). Active users, retention, first open, app update and uninstall are collected automatically by the Firebase SDK and need no code.

## Goals

1. **Screen views.** Every route change logs a screen view, so GA knows which pages are opened. A Capacitor app is one Android activity, so Firebase's automatic screen tracking only ever sees `MainActivity`.
2. **User properties** describing the player's current setup, so every report (active users included) can be split by them: style, colour theme, light/dark, language, and on native whether the app icon follows the theme. They update whenever the setting changes.
3. **Walkthrough usage.** Whether people use 解題演示 and whether it works for them: what the solve attempt led to, and whether they played the walkthrough to its last step.
4. **Richer `game_complete`.** Adds undo count, number of wrong entries, and whether notes were used, so difficulty can be checked.
5. **Web reports too.** The web build sends the same events and properties through the Firebase JS SDK. The web build is not public yet; the owner wants it wired anyway.
6. **Privacy policy** (`public/privacy-policy.html`, English only) gains the web build in its Analytics section.

## Non-goals

- Logging every tap or button press.
- Any event for "opened a game and closed the app". It is read as `game_start − game_complete − game_abandon`, explained in the README note below rather than measured.
- Crash reporting (Crashlytics).
- A cookie consent banner for the web build. It is not public; consent is revisited before it is.
- Changing the Play Console Data safety form. The new data is still in-app interactions; the owner confirms the form already declares "App interactions" before release.

## Anti-goals

- Anything that identifies a person: no puzzle contents, no free text, no timestamps beyond what GA adds itself.
- Analytics breaking the app: every `logEvent` / property call stays fire-and-forget and never throws into the UI (as today: `void analytics?.logEvent(...)`).
- A test that pins exact copy (project rule); tests check that the right event and parameters are sent.

## Constraints

- Ports and adapters: `AnalyticsService` (application layer) grows the new calls; `FirebaseAnalyticsAdapter` and `NoopAnalyticsAdapter` implement them; `src/main.ts` picks the adapter. The domain layer imports nothing from analytics.
- Firebase limits: event and property names ≤ 24 chars for user properties / 40 for events, values ≤ 36 chars for user properties / 100 for event params, ≤ 25 user properties per project.
- The `@capacitor-firebase/analytics` plugin already provides `setCurrentScreen`, `setUserProperty` and a web implementation that uses the `firebase` JS SDK (already a dependency). The web build needs a Firebase **web app config** (apiKey, appId, measurementId, …) that the owner creates in the Firebase console; it goes in `.env` files as `VITE_FIREBASE_*`, not hard-coded. Without that config the web build keeps using `NoopAnalyticsAdapter`.
- Dev builds must not pollute production numbers: the web build only reports when the config is present and `VITE_APP_ENV` is `production` (`.env.production` already sets it; `.env` sets `develop`). The gate sits in `src/main.ts` where the adapter is picked. Android keeps reporting in every build as today; its debug builds go to DebugView via `android:debug-firebase`. *(My call.)*
- The web uses the same `FirebaseAnalyticsAdapter`; `main.ts` initialises the Firebase web app from the `VITE_FIREBASE_*` config before using it on web. *(My call.)*
- This work starts after `feature/appearance-page` is merged, so the `appearance` route, effective colour mode and the light/dark-only appearance already exist. A stored "system" no longer exists by then.

## Decided shape

### Screen views
- On every `router.afterEach`, call `setCurrentScreen` with a stable English screen name derived from the route, not the URL: `home`, `game`, `statistics`, `settings`, `appearance`, `changelog`, `donate`, `game_review`, `solver`. `/game-review/:index` reports `game_review` without the index.

### User properties
| Property | Values |
|---|---|
| `style` | `minimal` / `tactile` / `paper` (+ future styles) |
| `color_theme` | the theme id, e.g. `blueInk` |
| `color_mode` | the **effective** mode, `light` / `dark` (paper always `light`) |
| `language` | the app's locale, e.g. `zh-Hant`, `en` |
| `icon_follows_theme` | `true` / `false`; native only, not set on web |

Set once at start and again whenever the setting changes (watch the settings store).

### Walkthrough events
- One `walkthrough_solve` per press of 解題, logged once the outcome is known (after the player answers any dialog). `result`: `solved` (exactly one solution, the walkthrough starts), `no_solution`, `multiple_solutions`, `unknown_count` — matching the dialog kinds in `useWalkthroughDialog.ts`. For `multiple_solutions` and `unknown_count`, `confirmed` is `1` when the player went on anyway and `0` when they cancelled or dismissed the dialog; `result` keeps the dialog kind either way. Also `source`: `sample` when the board equals a `SAMPLE_PUZZLES` entry, else `own`. *(My call.)*
- `walkthrough_finish` when playback reaches the last step.

### `game_complete` additions
Derived from the replay steps at completion, so nothing new is saved:
- `undo_count` — steps with action `undo`.
- `wrong_entries` — every `fill` step whose value differs from the answer at that cell, counted even if it was later undone or erased: it measures how often the player slipped, not what is left at the end. `hint` steps never count. *(My call.)*
- `used_notes` — any `toggleNote` or `autoNotes` step (`1`/`0`; GA params are strings or numbers).

Games saved by 2.0.0 and earlier have no replay; then these three params are left out.

### Docs
- A short `docs/analytics.md` listing every event and property and what question each answers, plus how to read "games left without an ending" and that event parameters must be registered as custom dimensions in GA4 to show up in reports.
- Privacy policy (the owner said to add it; they review the wording): the Analytics section says it applies to Android and the web version, and lists the web's identifiers (the Firebase/GA client ID cookie) next to Android's.

## From the owner

- The Firebase **web app** is registered in project `sudoku-1878c` (no Firebase Hosting; the web build stays on GitHub Pages). Its config values are public identifiers and go into `.env.production` as `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`, `VITE_FIREBASE_MEASUREMENT_ID`.

## Left to the builder

- How the adapter interface is shaped (one `setUserProperties` call vs per property), and where the router hook and settings watcher live, following the existing ports-and-adapters layout.
- Exact screen-name mapping mechanics (route `name` vs a lookup table).
- How to detect "sample board unchanged".
- Test structure.
