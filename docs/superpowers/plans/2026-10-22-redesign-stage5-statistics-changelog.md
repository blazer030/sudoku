# Redesign Stage 5 (Statistics and Changelog) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The day streak counts every day the player played, given-up games included, and stops at the first missed day (audit 10). Each difficulty shows its best time, its average over completed games and "completed / played" (audit 11). Recent games can be filtered by difficulty and show 20 at a time with "Show more" (audit 11). With no records, Statistics shows a prompt and a button home instead of numbers that look real (audit 12). The changelog speaks to players, and Android-only items carry an "App" badge driven by an `appOnly` flag instead of "(App)" in the text (audit 16).

**Architecture:** The streak becomes a pure `countPlayStreak` in `src/application/statistics/playStreak.ts`, which works on local calendar days. The statistics store keeps the per-difficulty numbers and now rounds the average. The newest-first list with each game's history index moves out of the store into a pure `listRecentGames` next to the page, so a filtered list still opens the right review. The changelog data changes shape to one object per bullet with both languages and an optional `appOnly`, so the two languages can never drift apart.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript strict, Tailwind v4 tokens, Pinia, vue-i18n, lucide-vue-next, Vitest + @vue/test-utils (jsdom), puppeteer-core for the visual pass.

**Spec:** `docs/superpowers/specs/2026-10-22-redesign-stage5-statistics-changelog-design.md`. Overview: `docs/superpowers/specs/2026-10-22-redesign-overview-design.md`. Builds on the stage 1–4 plans in `docs/superpowers/plans/2026-10-22-redesign-stage{1-foundation,2-game-screen,3-home-settings,4-walkthrough-review}.md`. In particular it uses stage 1's `SegmentedControl` and `v-press`, and assumes stage 3 Task 5b has already removed "Clear All Records" and `ClearRecordsDialog` from `Statistics.vue` and its tests.

---

## Global Constraints

**From the spec**

- **Day streak:** count the days with at least one recorded game, completed or given up. The name stays 「連續遊玩天數」 / "Day Streak". When today has no game, count back from yesterday. A missed day ends the streak.
- **Per difficulty:** best time, average time over completed games only, and completed games / games played.
- **Recent games:** a `SegmentedControl` above the list filters All, Easy, Medium, Hard. It shows the newest 20 games, and "Show more" at the bottom adds 20 each time.
- **Empty state:** with no records at all, show no 0, 0% or "--:--". Show an icon, 「還沒有遊戲紀錄」 and a 「開始第一局」 button that goes back to Home.
- "Clear All Records" is not on this page (stage 3).
- **Changelog:** rewrite the existing entries in players' words. "(App)" becomes a small "App" badge driven by a per-bullet `appOnly` flag. `docs/release.md` gains the rule "write in players' words, no implementation details". Do not write the next version's entry in this stage.

**From stages 1–4**

- Every colour comes from a token. `hardcodedColors.test.ts` stays green. This stage adds no palette token. The badge uses `primary` on `primary-light`, which `paletteContrast.test.ts` already checks.
- Every new button gets `v-press`, imported locally. Nothing new depends on hover.

**Project rules**

- **TDD:** write one failing test, then the minimum code to pass it. Commit after every green step. A defect fix gets an API-level failing test plus a minimal reproduction test, and both turn green together.
- **Commits**
  - Structural commits (rename, move, extract; behaviour unchanged) are separate from behavioural ones and say which they are.
  - Before every commit, run `npx vitest run && npm run lint && npx vue-tsc --noEmit`. There must be zero warnings.
  - Messages are English Conventional Commits with an emoji (🐛 ✨ ♻️ 🧪 📄). No `Co-Authored-By` or any other trailer.
- **Code**
  - `src/domain/` never imports from application, presentation or stores.
  - Spell out identifiers (`row`/`column`, not `r`/`c`; no `i`, `idx`, `el`, `ms`). Comments are in English.
- **Copy**
  - All new copy exists in both `en` and `zh-Hant`. `MessageSchema` typing makes `vue-tsc` enforce this.
  - zh text follows `docs/superpowers/specs/2026-10-21-i18n-zh-hant-design.md`: row = 列, column = 欄, 簡單／中等／困難, 解題演示, 遊戲回顧, 統計, 更新日誌, technique names per its glossary, and 「遊戲」, never 「對局」.
- Everything must fit and work at 360px phone width.

## Review Focus

These are the five real-world inputs most likely to break this stage. Each maps to a named test.

1. **Opening a review from a filtered list.** Today `openReview` turns the display position into a history index with `length - 1 - displayIndex`. Once the list is filtered, that formula opens a different game. Covered by Task 3 "should open the review of the tapped game while filtered".
2. **A missed day in the middle of a streak, and games near local midnight.** Today's loop accepts a date that is one day *before* the expected one at every step, so it skips single gaps anywhere (today, 2 days ago and 3 days ago count as 3). Dates are stored as UTC ISO strings, so a game at 00:05 in Taipei is the previous day in UTC. Covered by Task 1 "should break at a missed day" and "should count a game just after local midnight as that local day".
3. **An average that is not a whole number of seconds.** Two wins of 100 s and 51 s average 75.5 s, and `formatTime(75.5)` prints `"01:15.5"`. Covered by Task 2 "should round the average to whole seconds" and "should show the rounded average".
4. **Switching the filter after "Show more", and exactly 20 games.** A kept `visibleCount` would open the next filter already expanded. An off-by-one would show a "Show more" button that adds nothing. Covered by Task 3 "should start from 20 again after switching filters" and "should not offer more when exactly 20 games exist".
5. **Places that still look like data with nothing behind them.** These are: the whole page with no records, a difficulty never played, a difficulty with games but no win, and a filter with no games. Covered by Task 4 "should show no numbers before the first game", and by Task 2 "should say a difficulty was not played yet" and "should show a dash when a difficulty has no win". The filter case is covered by Task 3 "should say when a difficulty has no games yet".

---

### Task 1: Day streak counts every day played

**Files:**
- Create: `src/application/statistics/playStreak.ts`, `src/__tests__/application/statistics/playStreak.test.ts`
- Modify: `src/presentation/pages/statistics/Statistics.vue` (drop the inline `dayStreak` loop)
- Test: `src/__tests__/presentation/Statistics.test.ts`

**Interfaces (Produces):**
```ts
// playStreak.ts — completion-agnostic by design: it only sees dates
export const countPlayStreak: (gameDates: readonly string[], now: Date) => number;
// Statistics.vue: dayStreak = computed(() => countPlayStreak(statisticsStore.history.map(game => game.date), new Date()))
```

**Algorithm:**
1. Turn each date into a local day key `${getFullYear()}-${getMonth()}-${getDate()}`. Skip dates that do not parse (`Number.isNaN(date.getTime())`).
2. Start the cursor at local today, `new Date(now.getFullYear(), now.getMonth(), now.getDate())`. If today's key is missing, step back one day first.
3. While the cursor's key is in the set, count it and step back with `cursor.setDate(cursor.getDate() - 1)`.

Stepping by calendar day, not by 86 400 000 ms, keeps the count right across DST changes.

- [ ] **Step 1: Write the failing tests.**
  - API-level, in `Statistics.test.ts`:
    - `it("should count a day with only a given-up game in the streak")`: use fake timers.
      - `setSystemTime(new Date(2026, 9, 21, 20, 0))` and record a given-up easy game.
      - `setSystemTime(new Date(2026, 9, 22, 9, 0))` and record a given-up hard game.
      - Mount → `day-streak` text contains `"2"`.
  - Minimal reproduction, in `playStreak.test.ts`. Use the helper `localIso(year, monthIndex, day, hour = 12, minute = 0)`, which returns `new Date(year, monthIndex, day, hour, minute).toISOString()`. `now` is `new Date(2026, 9, 22, 9, 0)` unless stated.
    - `it("should be 0 without games")`: `[]` → `0`.
    - `it("should count consecutive days up to today")`: 10/22, 10/21, 10/20 → `3`.
    - `it("should count a day once however many games it has")`: two games on 10/22 → `1`.
    - `it("should start from yesterday when today has no game")`: 10/21 and 10/20 → `2`.
    - `it("should be 0 when the last game was two days ago")`: 10/20 → `0`.
    - `it("should break at a missed day")`: 10/22, 10/20 and 10/19 → `1`. Today's loop returns 3.
    - `it("should count a game just after local midnight as that local day")`: `localIso(2026, 9, 22, 0, 5)` and `localIso(2026, 9, 21, 23, 55)` → `2`.
    - `it("should cross a month boundary")`: `now` is 2026-11-01 10:00, with games on 11/01, 10/31 and 10/30 → `3`.
    - `it("should ignore unreadable dates")`: `["not a date", localIso(2026, 9, 22)]` → `1`.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/application/statistics src/__tests__/presentation/Statistics.test.ts`. Expect FAIL. The page test shows `0`, because given-up games are not counted.
- [ ] **Step 3: Implement** `countPlayStreak` and use it in the page.
- [ ] **Step 4:** Run the same command again. Expect PASS. Then run the full gate.
- [ ] **Step 5: Commit** `🐛 fix: count every day played in the streak and stop at a missed day`

---

### Task 2: Best, average and completed games per difficulty

**Files:**
- Modify: `src/stores/statisticsStore.ts`, `Statistics.vue`, both message files (remove `statistics.bestTimes`)
- Test: `src/__tests__/stores/statisticsStore.test.ts`, `src/__tests__/presentation/Statistics.test.ts`

**Interfaces:** `DifficultyStats` keeps its shape. `averageTime` is now `Math.round(sum / wonGames.length)`, in whole seconds.

**Layout:** the "Best Times" section becomes `statistics.byDifficulty`. It is one `bg-card rounded-2xl p-4 shadow-card` card with three rows divided by `border-border`, one row per difficulty: `data-testid="difficulty-stats-<difficulty>"`.
- **Left:** the difficulty name, `text-base font-medium text-foreground w-16 shrink-0`.
- **Right, when `gamesPlayed > 0`:** a `grid grid-cols-3 flex-1` of three cells. Each cell has the value (`text-base font-semibold font-mono`) above its label (`text-[11px] text-foreground-secondary`).

  | testid | value | label key | value colour |
  |---|---|---|---|
  | `difficulty-best-<difficulty>` | `formatTime(bestTime)`, or `—` when null | `statistics.best` | `text-primary` |
  | `difficulty-average-<difficulty>` | `formatTime(averageTime)`, or `—` when null | `statistics.average` | `text-foreground` |
  | `difficulty-completed-<difficulty>` | `` `${gamesWon}/${gamesPlayed}` `` | `statistics.completed` | `text-foreground` |
- **Right, when `gamesPlayed === 0`:** one `text-sm text-foreground-muted` line, `statistics.notPlayed`. None of the three cells render. ⚙︎ A difficulty never played shows words, not dashes.

| key | en | zh-Hant |
|---|---|---|
| `statistics.byDifficulty` | "By Difficulty" | 「各難度」 |
| `statistics.best` | "Best" | 「最佳」 |
| `statistics.average` | "Average" | 「平均」 |
| `statistics.completed` | "Completed" | 「完成」 |
| `statistics.notPlayed` | "Not played yet" | 「還沒玩過」 |

- [ ] **Step 1: Write the failing tests.**
  - `statisticsStore.test.ts`:
    - `it("should round the average to whole seconds")`: easy wins of 100 and 51 → `averageTime` is `76`.
    - The existing "computes best, average…" case stays green. It already has the given-up 999 left out of the easy average of 75.
  - `Statistics.test.ts` replaces "should display best times per difficulty":
    - `it("should show best, average and completed games per difficulty")`: record easy 263 won, easy 300 won and easy 999 given up →
      - `difficulty-best-easy` is "04:23"
      - `difficulty-average-easy` is "04:42" (281.5 rounds to 282)
      - `difficulty-completed-easy` is "2/3"
    - `it("should show the rounded average")`: easy wins of 100 and 51 → `difficulty-average-easy` contains "01:16" and does not contain ".".
    - `it("should show a dash when a difficulty has no win")`: one given-up medium game → `difficulty-best-medium` and `difficulty-average-medium` are "—", and `difficulty-completed-medium` is "0/1".
    - `it("should say a difficulty was not played yet")`: with one easy game, `difficulty-stats-hard` contains "Hard" and "Not played yet", and `difficulty-best-hard` does not exist.
    - The zh label test drops 「最佳時間」 and 「清除所有紀錄」 and adds 「各難度」「最佳」「平均」「完成」.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: show best, average and completed games for each difficulty`

---

### Task 3: Recent games — filter and "Show more"

**Files:**
- Create: `src/presentation/pages/statistics/recentGames.ts`, `src/__tests__/presentation/pages/statistics/recentGames.test.ts`
- Modify: `src/stores/statisticsStore.ts` (drop `recentGames`), `Statistics.vue`, both message files
- Test: `src/__tests__/stores/statisticsStore.test.ts`, `src/__tests__/presentation/Statistics.test.ts`

**Interfaces (Produces):**
```ts
// recentGames.ts
export type RecentGamesFilter = "all" | Difficulty;
export interface RecentGame { game: GameResult; historyIndex: number }
export const RECENT_GAMES_PAGE_SIZE = 20;
export const listRecentGames: (history: readonly GameResult[], filter: RecentGamesFilter) => RecentGame[]; // newest first
// statisticsStore: the Statistics interface loses recentGames
```

**3a, structural:** extract the list.
- Add `listRecentGames(history)` with no filter parameter yet. It returns the games newest first, each with its own index in `history`.
- `Statistics.vue` renders from it. `openReview` uses `item.historyIndex` and no longer computes an index.
- Remove `recentGames` from the store's `Statistics` and its computed.
- [ ] **Step 1:** Write `recentGames.test.ts`: `it("should list the newest game first with its history index")`. Three games (easy, medium, hard) → difficulties `["hard", "medium", "easy"]` and `historyIndex` `[2, 1, 0]`. In `statisticsStore.test.ts`, remove `recentGames` from the empty `toEqual` and drop the two `recentGames` assertions. The new test now holds that check.
- [ ] **Step 2:** Run `npx vitest run src/__tests__/presentation/pages/statistics`. Expect FAIL (no module).
- [ ] **Step 3:** Implement the extraction.
- [ ] **Step 4:** Run the full gate. Expect PASS. `Statistics.test.ts` is unchanged and green.
- [ ] **Step 5: Commit** `♻️ refactor: list recent games with their history index outside the store`

**3b, behavioural:** add the filter and paging.

**Layout,** inside the recent games section, under its heading:
1. A `SegmentedControl` with `data-testid="recent-games-filter"` and `test-id-prefix="recent-filter"`. Its options are `all` (`statistics.filter.all`), then `easy`, `medium` and `hard` from `useDifficultyLabel`.
2. The list shows `listRecentGames(history, filter).slice(0, visibleCount)`.
3. `show-more-button` renders only while the filtered length is greater than `visibleCount`. A click adds `RECENT_GAMES_PAGE_SIZE`. It is a `v-press` button: `w-full h-11 bg-card rounded-xl shadow-card-sm text-primary text-sm font-semibold`.
4. When the filtered list is empty, `recent-games-empty` shows `statistics.filteredEmpty` in `text-sm text-foreground-muted text-center py-6`.

Decisions:
- The filter starts at `all` and is not saved. ⚙︎
- `watch(filter, () => { visibleCount.value = RECENT_GAMES_PAGE_SIZE; })`.
- The filter applies to the list only. The overview and per-difficulty numbers do not change with it. ⚙︎

| key | en | zh-Hant |
|---|---|---|
| `statistics.filter.all` | "All" | 「全部」 |
| `statistics.showMore` | "Show more" | 「顯示更多」 |
| `statistics.filteredEmpty` | "No games at this difficulty yet" | 「這個難度還沒有遊戲紀錄」 |

- [ ] **Step 1: Write the failing tests.**
  - `recentGames.test.ts`:
    - `it("should keep history indexes when filtered")`: history easy, hard, easy → filter `"easy"` gives `historyIndex` `[2, 0]`. Filter `"medium"` gives `[]`.
  - `Statistics.test.ts`:
    - Add `{ path: "/game-review/:index", component: { template: "<div>Review</div>" } }` to the test router.
    - Add a helper `recordEasyGames(count)`, which records won easy games with `elapsedSeconds: 100 + number`.
    - `it("should show the newest 20 games and more on request")`: 45 games →
      - 20 `recent-game` items, and the first contains `formatTime(144)` ("02:24")
      - after one `show-more-button` click, 40 items
      - after a second click, 45 items and no `show-more-button`
    - `it("should not offer more when exactly 20 games exist")`: 20 games → no `show-more-button`.
    - `it("should filter recent games by difficulty")`:
      - Record easy, hard and easy.
      - `recent-filter-all` has `aria-pressed="true"`.
      - Click `recent-filter-easy` → 2 items, each containing "Easy".
      - Under zh, `recent-filter-all` text is 「全部」.
    - `it("should start from 20 again after switching filters")`:
      - Record 30 easy and 30 hard, interleaved.
      - Click show more → 40 items.
      - Click `recent-filter-hard` → 20 items.
      - Click `recent-filter-all` → 20 items.
    - `it("should say when a difficulty has no games yet")`: only easy games → click `recent-filter-hard` → `recent-games-empty` says "No games at this difficulty yet" (under zh, 「這個難度還沒有遊戲紀錄」), and there is no `recent-game`.
    - `it("should open the review of the tapped game while filtered")`:
      - Record easy, hard and easy, each with `replay: { initialBoard: [], steps: [] }`.
      - Click `recent-filter-hard`, then click the first `recent-game`, then `flushPromises()`.
      - The route is `/game-review/1`.
- [ ] **Step 2:** Run both files. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: filter recent games by difficulty and show them 20 at a time`

---

### Task 4: Empty state without fake numbers

**Files:**
- Modify: `Statistics.vue`, both message files
- Test: `src/__tests__/presentation/Statistics.test.ts`

**Layout:**
- With `statistics.overall.gamesPlayed === 0`, the page renders only the header and `empty-state`. The overview, per-difficulty and recent games sections are all absent.
- `empty-state` is centred in the remaining height (`flex-1 flex flex-col items-center justify-center gap-3 pb-16`). It holds:
  - a `w-20 h-20 rounded-full bg-primary-light` circle with `ChartBar` (size 36, `text-primary`), `aria-hidden`
  - the title `statistics.empty.title` (`text-lg font-semibold text-foreground`)
  - the description `statistics.empty.description` (`text-sm text-foreground-secondary text-center`)
  - `start-first-game-button`: `v-press`, `h-12 px-6 mt-2 bg-primary text-on-primary rounded-xl shadow-primary font-semibold`. A click does `router.push(ROUTER_PATH.home)`.

| key | en | zh-Hant |
|---|---|---|
| `statistics.empty.title` (keep) | "No games played yet" | 「還沒有遊戲紀錄」 |
| `statistics.empty.description` (replace) | "Finish or give up a game and your stats appear here" | 「玩完或放棄一場遊戲後，統計就會出現在這裡」 |
| `statistics.empty.action` | "Play Your First Game" | 「開始第一局」 |

- [ ] **Step 1: Write the failing tests.** These replace "should show empty state when no games played".
  - `it("should show no numbers before the first game")`: with no records:
    - `games-won`, `win-rate`, `day-streak`, `[data-testid^='difficulty-stats-']` and `recent-games-filter` do not exist
    - `wrapper.text()` does not match `/\d/`
    - `empty-state` contains "No games played yet" and "Play Your First Game"
  - `it("should show the empty state in Traditional Chinese")`: under zh, it contains 「還沒有遊戲紀錄」 and 「開始第一局」, and `wrapper.text()` does not match `/\d/`.
  - `it("should go home from the first game button")`: push `/statistics`, click `start-first-game-button`, `flushPromises()` → the route is `/`.
  - `it("should hide the empty state once a game is recorded")`: one record → there is no `empty-state`, and `games-won` exists.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: replace statistics placeholders with a first-game prompt`

---

### Task 5: Changelog bullets carry an `appOnly` badge

**Interfaces (Produces):**
```ts
// changelogData.ts
export interface ChangelogChange { text: Record<AppLocale, string>; appOnly?: boolean }
export interface ChangelogEntry { version: string; date: string; changes: ChangelogChange[] }
```
⚙︎ There is one object per bullet with both languages. The bullet counts match by construction, and `appOnly` cannot differ between languages.

**5a, structural:** change the shape.
- **Files:** `src/presentation/pages/settings/changelogData.ts`, `Changelog.vue`, `src/__tests__/presentation/Changelog.test.ts`.
- Pair each `en[n]` with `zh-Hant[n]` into `{ text: { en, "zh-Hant" } }`. Keep the text unchanged for now, "(App)" included.
- The page renders `change.text[appLocale]`.
- The tests change mechanically: `entry.changes.en` becomes `entry.changes.map(change => change.text.en)`, and the same for zh.
- "should have the same number of changes in every language" keeps its name. Its body becomes: for each entry and each locale, `entry.changes.filter(change => change.text[locale].trim() !== "")` has length `entry.changes.length`.
- [ ] **Step 1:** Make the change.
- [ ] **Step 2:** Run the full gate. Expect PASS.
- [ ] **Step 3: Commit** `♻️ refactor: store each changelog item with both languages together`

**5b, behavioural:** add the badge.
- **Files:** `changelogData.ts`, `Changelog.vue`, both message files, `docs/release.md`.
- Test: `Changelog.test.ts`.
- **Data:** remove " (App)" / "（App）" from the text and set `appOnly: true` on those bullets: both 2.1.1 items and the 2.0.0 launcher-icon item.
- **Badge:** after the text, `<span data-testid="changelog-app-badge" class="ml-1.5 inline-block align-[1px] rounded-full bg-primary-light text-primary text-[11px] font-semibold leading-4 px-1.5">` holding `changelog.appBadge`.
- **Note:** under the header, one `text-xs text-foreground-secondary px-1` line, `changelog-app-note` with `changelog.appNote`.
- **`docs/release.md` step 3:** replace the "(App)" sentence with: "Each change has its `text` in both `en` and `zh-Hant`. Mark Android-only changes with `appOnly: true`, which shows an "App" badge. Never write "(App)" in the text."

| key | en | zh-Hant |
|---|---|---|
| `changelog.appBadge` | "App" | 「App」 |
| `changelog.appNote` | "Items marked App apply to the Android app only." | 「標有 App 的項目只適用於 Android App。」 |

- [ ] **Step 1: Write the failing tests.**
  - `it("should mark app-only changes with a badge")`:
    - For every entry, the number of `changelog-app-badge` inside `changelog-entry-<version>` equals `entry.changes.filter(change => change.appOnly).length`.
    - `changelog-entry-2.1.1` has 2 badges and `changelog-entry-2.1.0` has 0.
    - The badge text is "App".
  - `it("should keep the App marker out of the text")`: no `change.text[locale]` matches `/\(App\)|（App）/`.
  - `it("should explain the App badge")`: `changelog-app-note` reads "Items marked App apply to the Android app only.", and under zh 「標有 App 的項目只適用於 Android App。」.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: mark app-only changelog items with a badge`

---

### Task 6: Changelog in players' words

**Files:**
- Modify: `src/presentation/pages/settings/changelogData.ts`, `docs/release.md`
- Test: `src/__tests__/presentation/Changelog.test.ts`

**New text.** Versions, dates and order do not change. ★ marks `appOnly: true`.

| version | # | en | zh-Hant |
|---|---|---|---|
| 2.1.1 | 1★ | Changing the app icon no longer closes the app; the new icon appears once you leave it | 更換 App 圖示時不會再關掉 App，離開 App 後就會看到新圖示 |
| | 2★ | Theme-colored app icons now fill the whole icon instead of sitting on a white circle | 配合主題顏色的 App 圖示改為填滿整個圖示，不再縮在白色圓底裡 |
| 2.1.0 | 1 | Now in Traditional Chinese; pick the language in Settings | 支援繁體中文，可以在設定中切換語言 |
| | 2 | The Walkthrough looks tidier on small screens | 解題演示在小螢幕上的畫面更整齊 |
| | 3 | The Walkthrough's step count is now centered | 解題演示的步數改為置中顯示 |
| | 4 | Game Review shows every move, even if you left a game and came back to it | 中途離開再回來的遊戲，遊戲回顧也會顯示每一步 |
| | 5 | Games you gave up by starting a new one can now be replayed from Statistics | 因為開始新遊戲而放棄的遊戲，也能從統計打開遊戲回顧 |
| 2.0.0 | 1 | Now available as an Android app | 推出 Android App |
| | 2★ | The app icon can match your color theme | App 圖示可以配合你選的色彩主題 |
| 1.6.0 | 1 | Hints and the Walkthrough know two more techniques: X-Chain and XY-Chain | 提示與解題演示新增兩種技巧：X 鏈與 XY 鏈 |
| | 2 | The Walkthrough draws chain links right on the board | 解題演示會直接在盤面上畫出鏈的連線 |
| | 3 | New Changelog page in Settings | 設定裡新增更新日誌頁面 |
| 1.5.1 | 1 | The Walkthrough no longer shows play buttons before you start solving | 解題演示在開始解題前不會再出現播放按鈕 |
| 1.5.0 | 1 | New Walkthrough: enter any puzzle and watch it solved step by step | 新增解題演示：輸入任何題目，一步一步看它怎麼解 |
| | 2 | Hints now tell you which technique they use | 提示會告訴你用的是哪一種技巧 |
| | 3 | Hints and the Walkthrough know more techniques: X-Wing, Swordfish, Jellyfish, XY-Wing, W-Wing, XYZ-Wing, WXYZ-Wing | 提示與解題演示新增技巧：X-Wing、Swordfish、Jellyfish、XY-Wing、W-Wing、XYZ-Wing、WXYZ-Wing |
| | 4 | Each difficulty now matches the techniques its puzzles need | 題目難度更準確，會依解題需要的技巧來分級 |
| 1.4.0 | 1 | New Game Review: replay a finished game from Statistics | 新增遊戲回顧：可以從統計重播玩過的遊戲 |
| | 2 | Smoother playback, with a progress bar you can drag | 播放更順暢，進度條可以拖曳 |
| | 3 | The title bar stays in view while you scroll Settings and Game Review | 捲動設定與遊戲回顧時，標題列會留在畫面上方 |
| 1.3.1 | 1 | Small fixes to keep the game running smoothly | 小幅修正，讓遊戲更穩定 |
| 1.3.0 | 1 | Fireworks when you solve a puzzle | 解完題目時會放煙火 |
| | 2 | Each color theme gets a matching home screen icon | 每種色彩主題都有同色的主畫面圖示 |
| | 3 | Settings is split into clear sections | 設定頁分成幾個區塊，更容易找到 |
| 1.2.0 | 1 | Choose from 6 color themes and turn game helpers on or off in Settings | 設定裡可以選 6 種色彩主題，也能開關遊戲輔助功能 |
| | 2 | Buttons and highlights follow your theme's color | 按鈕與標示會跟著主題換顏色 |
| | 3 | A ripple plays when you complete a row, column or box | 完成一列、一欄或一宮時會出現漣漪動畫 |
| | 4 | Pop-ups and the hint menu open and close more smoothly | 彈出視窗與提示選單的開關更順暢 |
| 1.1.1 | 1 | Highlighted notes keep their round shape on small screens | 小螢幕上被標示的筆記不會再變形 |
| 1.1.0 | 1 | Statistics tells you when you haven't played any games yet | 還沒玩過遊戲時，統計頁會清楚告訴你 |
| | 2 | You can clear all records from Statistics, after confirming | 可以在統計清除所有紀錄，清除前會先確認 |
| | 3 | Settings shows which version you're on | 設定頁會顯示目前的版本 |
| | 4 | Erasing a number also removes it from notes in the same row, column and box | 擦掉已填的數字時，同列、同欄、同宮筆記裡的相同數字也會一起清掉 |

- [ ] **Step 1: Write the failing test.**
  - `it("should describe changes in players' words")`:
    - No en text matches `/\b(PWA|manifest|launcher|gridlines?|modal|popup|toggles?|sticky|bug|solver)\b/i`.
    - No zh text contains any of 「PWA」「資訊清單」「格線」「對局」.
    - The 2.1.0 zh texts include 「解題演示在小螢幕上的畫面更整齊」, the spec's own example.
  - All earlier Changelog tests stay green, including the per-language count.
- [ ] **Step 2:** Run the file. Expect FAIL.
- [ ] **Step 3: Implement** the table.
- [ ] **Step 4:** Run the full gate. Expect PASS.
- [ ] **Step 5: Commit** `✨ feat: rewrite the changelog in players' words`
- [ ] **Step 6: Release rule.** In `docs/release.md` step 3, add after the language sentence: "Write for players: say what they will notice (for example "The Walkthrough looks tidier on small screens"), not how it was done. Leave out component, file and technical names (PWA, manifest, modal, gridline …), and follow the zh glossary in `docs/superpowers/specs/2026-10-21-i18n-zh-hant-design.md`."
- [ ] **Step 7: Commit** `📄 docs: require player-facing wording for changelog entries`

---

### Task 7: Real-browser visual pass (360×780)

**Files:** scripts only, in `/private/tmp/claude-501/-Users-ethan-Project-sudoku/8581f059-8ad5-412a-943e-1b0b712810ab/scratchpad/shots/`, for example `stage5.mjs`. Reuse `audit-stats.mjs`, which seeds history through pinia (`pinia._s.get("statistics").history.splice(…)`). Add nothing to `src/` and no demo routes.

- [ ] **Step 1: Set up.**
  - Start a dev server of your own: `CHOKIDAR_USEPOLLING=1 npx vite --port <free port> --strictPort`, in the background.
  - Use puppeteer-core from `shots/node_modules` with `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`, a 360×780 viewport, `isMobile` and `hasTouch`.
  - Seed `sudoku-settings` (`language`, `appearance`, `colorTheme: "green"`) with `evaluateOnNewDocument`.
  - For "with records", seed 45 games across all three difficulties. Some are given up, a few have `replay`, and the dates cover the last 50 days with games on today, yesterday and the day before (streak 3). Medium has no win, and no hard game exists.
- [ ] **Step 2: Capture.** Use zh-Hant and en × light and dark. Save to `shots/stage5/<locale>-<mode>-<state>.png`. States:
  1. Statistics with no records.
  2. Statistics with records, at the top (overview and per difficulty).
  3. Statistics scrolled to recent games, filter All.
  4. The same after one "Show more".
  5. Filter Hard (the filtered-empty message).
  6. The changelog at the top (2.1.1 badges and the note).
  7. The changelog scrolled to 2.0.0.
- [ ] **Step 3: Measure.**
  - There is no horizontal overflow on Statistics or Changelog: `scrollWidth <= 360`.
  - Each per-difficulty value and label stays on one line, in en too ("Average", "Completed"): each cell's height is at most 1.5 × its `line-height` per line.
  - `show-more-button`, `start-first-game-button` and each filter option are at least 44 px tall.
  - With no records, `document.body.innerText` has no digit.
  - Clicking `start-first-game-button` lands on Home.
  - Tapping a recent game while filtered opens that game's review: the URL index equals the seeded history index of the tapped row.
- [ ] **Step 4: Review every shot.**
  - The App badge is readable and sits on the text's line in light and dark.
  - The empty-state circle and icon read in dark mode.
  - The dash for no-win values does not look like a broken layout.
  - The filter's sliding indicator lines up with four options.
  - Fix any problem test first (`🐛 fix: …`). Copy that does not fit gets shortened in both languages.
- [ ] **Step 5: Report to the user.** Give the shot folder path and list this plan's ⚙︎ choices for review:
  - A never-played difficulty says 「還沒玩過」. A difficulty with games but no win shows 「—」 for best and average.
  - The filter is not saved, resets "Show more" when changed, and affects only the list.
  - The empty-state description is new.
  - The changelog uses one object per bullet, with a note line explaining the App badge.
  - 2.0.0's "Now available as an Android app" is not badged, because it announces the app to everyone.
  - The 1.3.1 wording is "Small fixes…", because that release changed nothing a player could see.
  - The full rewrite table in Task 6.
