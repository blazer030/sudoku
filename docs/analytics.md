# Analytics

Events go through the `AnalyticsService` port (`src/application/analytics/AnalyticsService.ts`). Android uses Firebase Analytics; the production web build uses the Firebase web SDK. Everything else gets a no-op adapter.

## Events

| Event | Params | Question it answers |
| --- | --- | --- |
| `game_start` | `difficulty` | How many games start, per difficulty? |
| `game_complete` | `difficulty`, `time_seconds`, `hints_used`, `hints_total`, `undo_count`, `wrong_entries`, `used_notes` (0/1) | How long and how clean are finished games? The last three are left out for games resumed from a save without a full replay. |
| `game_abandon` | `difficulty`, `progress_pct`, `correct_pct`, `incorrect_pct` | How far do players get before quitting? |
| `hint_used` | `hint_type` (`auto_notes`, `check_conflicts`, `reveal_cell`) | Which hints do players reach for? |
| `donate_view` | none | How many players see the donate page? |
| `donate_tap` | `tier` | Which tier do they tap? |
| `donate_success` | `tier`, `amount_usd` | How many purchases finish, and for how much? |
| `walkthrough_solve` | `result` (`solved` (exactly one solution, so the walkthrough starts; it does not mean the human-technique path finishes the board), `no_solution`, `multiple_solutions`, `unknown_count`), `source` (`sample`, `own`), `confirmed` (0/1, only for `multiple_solutions` and `unknown_count`) | Do players use the solver on their own puzzles, and how does it end? |
| `walkthrough_finish` | none | How many walkthroughs are watched to the end? |
| `screen_view` | `firebase_screen` (`home`, `game`, `statistics`, `settings`, `appearance`, `changelog`, `donate`, `game_review`, `solver`) | Which screens do players visit? |

Games left without an ending = `game_start − game_complete − game_abandon`.

## User properties

| Property | Values |
| --- | --- |
| `style` | Visual style id |
| `color_theme` | Colour theme id |
| `color_mode` | Light or dark |
| `language` | App language |
| `icon_follows_theme` | Whether the launcher icon follows the theme. Android only. |

## GA4 setup

- Event params show in reports only after they are registered as custom dimensions or metrics (Admin → Custom definitions). Register `result`, `confirmed`, `source`, `undo_count`, `wrong_entries` and `used_notes`, plus the older params (`difficulty`, `time_seconds`, `hints_used`, `hints_total`, `progress_pct`, `correct_pct`, `incorrect_pct`, `hint_type`, `tier`, `amount_usd`) if they are missing.
- `firebase_screen` (from `screen_view`) needs no registration: GA4 shows it as the built-in "Page title and screen name" (Screen name) dimension.
- The web build suppresses gtag's automatic page_view on load in code (`send_page_view: false`). History-change page views are a separate Enhanced-measurement feature: on the web data stream, turn off Enhanced measurement's "Page changes based on browser history events". Otherwise GA adds its own `page_view` next to our `screen_view`.

## When it reports

- **Web**: only production builds (`VITE_APP_ENV=production`) with all seven `VITE_FIREBASE_*` values in `.env.production`. If the Firebase SDK fails to load, the app starts with no analytics.
- **Android**: always. Debug builds show up in DebugView.
