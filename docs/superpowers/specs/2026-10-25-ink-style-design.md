# 水墨和紙 style (`ink`) — design

## Why

The owner is building the style-research looks into the app one at a time. 8-bit (`pixel`) and cyberpunk (`cyber`) are on `develop`; 水墨和紙 is next. This branch (`feature/style-ink`, from `develop` a5fcffd) builds only ink. It is not merged until the owner has tried it.

The owner's rule for this one: **build exactly what the design canvas shows.** They will ask for corrections after seeing it. Where the canvas leaves something open, or where it collides with a repo rule, the builder decides and lists the decision under "Calls made by the builder" at the end, so the owner can check them.

Ink should feel like solving sudoku with a brush on washi:
- warm washi paper with faint fibres
- brush grid lines with a heavy box line and a pale cell line, rough at the edge
- digits that bleed into the paper as they are entered and wash away when erased
- a vermilion (朱紅) seal for everything chosen

## Sources (read-only, `feature/style-research` worktree)

`/Users/ethan/Project/sudoku/.worktrees/style-research/docs/style-research/project/`:

| File | What it fixes |
|---|---|
| `Ink.dc.html` | Every screen: Home, game, keypad, hint steps, statistics, review, walkthrough, settings, dialogs, app icon. Its `.m-light` and `.art` blocks and the rules after `.ic{stroke-width:1.6}` are the look. |
| `MomentsInk.dc.html` | Loading and the celebration, plus their reduced-motion end states. |
| `GroupInk.dc.html` | Row, column and box completion. |
| `Main.dc.html` | 「水墨只做淺色」, 「只有淺色・配色固定」, the colour strip and the app icon. |
| `canvas.json` | The design notes `note3`, `momentsNote6` and `groupNote6`. |

Ignored on the canvas: the `.m-dark` block and the `.t1`–`.t3` seal colours (note3: 「墨夜不像水墨，拿掉。印泥也固定朱紅，不給主題色」), the other proposed styles on its 外觀 page (黑板粉筆, 藍圖工程, 極光玻璃), and the canvas's own tool bars.

## Goals

1. **A sixth style.**
   - Id `ink`, named 「水墨和紙」 / "Ink & Washi", listed after cyberpunk.
   - It appears on the 外觀 page and everywhere a style is listed.
2. **Light only** (`STYLE_COLOR_MODES.ink = ["light"]`), the same single-mode mechanism paper uses (`lightOnlyThemeBuilder`). A player whose appearance setting is dark still sees ink in light.
3. **One fixed palette, no theme choice.** One theme, id `vermilion` (「朱紅」/"Vermilion"); the label exists only because `settings.colorThemes` needs one. The 「色彩主題」 section and the light/dark control are hidden, as for cyberpunk. The settings summary shows the style name alone.
4. **The canvas's look, through skin hooks.** Everything visual is `[data-style="ink"]` CSS in `src/style/styles/ink/skin.css`, plus SVG files it masks by, plus the moments components. Hooks it lacks are added as generic `data-skin` tokens or data attributes (Goal 9).
5. **Motion** as the canvas and the owner's motion rules say (see Motion).
6. **Type:** Yuji Boku (brush titles), Noto Serif TC (all other text), EB Garamond (digits), all bundled (see Fonts).
7. **App icon:** the canvas's light-only icon: a one-stroke 圓相 and a faint 九宮 on washi, a vermilion 「獨」 seal bottom right. It also gets one launcher icon, the PWA icon and manifest, and first-paint colours.
8. **Changelog:** `UNRELEASED_CHANGES` already has the new-styles line 「全新風格「8-bit 電玩」與「賽博龐克」」. Ink joins it, the way cyberpunk joined 8-bit's: 「全新風格「8-bit 電玩」、「賽博龐克」與「水墨和紙」」 / "New styles: 8-bit, Cyberpunk and Ink & Washi". No new line.
9. **New generic hooks**, styled by nobody but ink for now:
   - `data-skin="board-grid"` on the inner grid of the three boards (game, Game Review, Walkthrough).
   - `data-skin="dialog-title"` on the headings of the new-game, leave-game, clear-records and walkthrough dialogs.
   - `data-skin="loader-scrim"` on `PuzzleLoader`'s full-screen layer.
   - `data-leaving-value="<digit>"` on a cell while it carries `.value-leave`, naming the digit that just left.

## The look

### Palette (light only)

| Role | Token | Colour |
|---|---|---|
| Washi page | `background` | `#F2ECDF` |
| Card, dialog | `card` | `#FBF7EE` |
| Ink (text, clues, grid) | `foreground` | `#1E1B16` |
| Pale ink (secondary text, notes) | `foreground-secondary`, `note` | `#5C554A` |
| Blue-black player ink | `accent` | `#2C3E5C` |
| Vermilion seal | `primary`, `primary-ink` | `#B3261E` |
| On the seal | `on-primary` | `#FFF8F0` |
| Error, danger | `error`, `danger` | `#A0281E` |
| Edge line | `border` | ink at 22% over the page |
| Continue card | `featured` / `on-featured` | the card / ink |
| Same digit wash | `highlight` | seal at 11% over the page |
| Peer and scope wash | `cell-peer`, `cell-scope` | ink at 5% over the page |
| Hint pattern wash | `cell-pattern` | seal at 10% over the page |
| Seal surface | `primary-light` | seal at 12% over the card |
| Toast | `toast` / `on-toast` | ink / the page |
| Scrim | `scrim` | ink |

- Washes are mixed over the **page**, not the card, because ink's cells and board are transparent: the page is what is under them.
- Contrast (rough): seal on the page about 5.5:1; seal on the same-digit wash about 4.7:1; pale ink on the page about 6.2:1; `#FFF8F0` on the seal about 6:1.

### Page and paper
- The page is washi: the canvas's `.m-light .scr` layers (a soft top-left light, a warm bottom-right shade, two crossing fibre hatches and a 6px dot grain), rebuilt from tokens with `color-mix()`, on the app root's `page-ruled` hook.
- Long curved fibres over that: the canvas's `.fibres` SVG, as a static mask image on the root's `::before`, in `--color-foreground` at the canvas's fibre strength. It never takes taps and sits under content.
- Cards, groups, tiles, keys and the new-game card are washi slips: the card at 62% over the page with a 1px edge line (inset `box-shadow`, not `border`). Dialogs, the hint menu and the step panels are the solid card with the canvas's long soft shadow.
- Radii are the canvas's uneven brush corners (`4px 3px 5px 3px`, `6px 3px 7px 4px`); a skin may set `border-radius`.

### Board
- No frame, no card: the board and its cells are transparent on the washi.
- **Brush lines:** the canvas's `.inkgrid` drawing: twelve cell lines at 32% ink, four box lines at 90% ink and the outer frame in full ink, every line a slightly wavering filled band, the edges roughened by `feTurbulence` + `feDisplacementMap` (frequency 0.85, two octaves, seed 4, scale 2.6). It is one static SVG file, `src/style/styles/ink/brush-grid.svg`, shown as a `mask-image` on `[data-skin~="board-grid"]::after` in `--color-foreground`. The cell borders' `--board-line` / `--board-box-line` and the grid's own border colour turn transparent only where the mask is supported.
- **Digits:** clues in ink, Garamond 600; player digits in blue-black Garamond italic 500; lining (等高) figures, as the canvas sets them.
- **Selected cell:** no fill. A vermilion 圓相 on the cell's `::after`: a ring open at the top-left, thin on the left, heavy at the bottom, turned −28°.
- **Same digit:** the same-digit wash and the digit in vermilion. **Peers:** the pale ink wash.
- **Notes:** pale ink Garamond; the selected digit's note in vermilion.
- **Hint mode:** scope cells the peer wash; pattern cells the seal wash; the answer cell the 圓相 and no fill; candidate notes in blue-black italic; emphasised notes a thin vermilion ring; eliminated notes in vermilion.
- Z-order inside the grid: cell washes → group brush (1) → digits (2) → brush lines (3) → 圓相 (4).

### Screens
- **Home:** the logo becomes a vermilion seal reading 「數獨」 (vertical, Noto Serif TC 900, an inner paper-coloured ring, turned −4°). The title 「數獨」/"Sudoku" in Yuji Boku. Three misty ink mountains along the bottom of the screen (the canvas's `.mountains`, a static mask image) behind the tiles. Continue card chips become plain pale text joined by a vermilion 「・」. The chosen difficulty has no fill, only a short vermilion brush underline. The new-game button is the seal with an inner paper ring. Tile icons in vermilion.
- **Game header:** the difficulty pill is a vermilion outline with brush corners; the hint-mode pill is solid vermilion. The timer in Garamond.
- **Controls:** pale ink; an active control is vermilion on the seal surface.
- **Keypad:** washi keys with an edge line and Garamond 600 digits. The chosen key is a solid seal turned −3°. A finished key fades to 30%. The remaining-count badge is a page-coloured disc with a vermilion ring and vermilion Garamond digits.
- **Settings:** group headings and their icons in vermilion; the chosen option and toggle cards outlined in vermilion; toggle indicators are small squares that become a seal turned −8° when on; swatches are slightly irregular circles; the chosen segment has a vermilion underline instead of a fill; row separators dotted.
- **Dialogs:** titles in Yuji Boku; dialog icons are vermilion outline circles (warning ones in the error colour); secondary and ghost buttons are an edge-line outline; the danger button solid error.
- **Statistics and review:** big numbers in Garamond italic 600; recent-game chips are outline circles; separators dotted; step tags a vermilion outline, the final step a solid seal turned −2°; the playback dots small with the current one a vermilion dot; the progress bar a thin ink stroke; the play button a vermilion blot.
- **Toast:** ink with brush corners.

### Motion

The owner's rules: the 「動態效果」 setting gates the fill/erase digit animation, the group effect, the hint pop and the celebration. Loaders and ambient background ignore it; only system reduced motion stops those. Group effects have no still cue. Words in effects follow the language when they read as a message; ink seals are emblems and stay 「題」「過關」「數獨」「獨」 in both languages. The final entry plays only the celebration (existing behaviour).

- **Filling a digit** (`.value-arrive`): the digit sharpens out of a blur, from 145% size and transparent to sharp, over 0.9s (`cubic-bezier(.2,.7,.2,1)`). Behind it, on the cell's `::before`, a faint ink halo (a soft radial wash) spreads from 20% to 140% and fades out, over 0.9s.
- **Erasing** (`.value-leave`): the old digit, drawn on the cell's `::before` from `data-leaving-value`, blurs, drifts 5px down, grows to 125% and fades, over 0.8s, as if washed off.
- **Ambient:** none. The washi, fibres and mountains are still.
- **Loading** (`InkLoader`, from MomentsInk): a washi slip on a beige paper fog (the page at 66%, not a dark scrim). On it a brush paints a 九宮: the frame's four strokes, then the four inner lines, each heavy where it lands, thinning to a dry split tail. Then digits 5, 9, 1, 7 are inked in (from 135% and pale to clear), a small vermilion 「題」 seal is pressed, and the slip fades. 4.2s a round, seamless. The caption follows the language (`home.generatingPuzzle` or the host's message). Under system reduced motion the box, digits and seal are drawn and still.
- **Row / column completed** (from GroupInk): one real brush stroke along the row (left to right; a column top to bottom), wet and heavy with a blot where it lands, tapering to a split dry-brush tail past the board edge. It is revealed along its centre line by a mask in 0.44s, holds, and fades: 1s in all, from 80ms. The digits it crosses get a paper-coloured halo while it is there.
- **Box completed:** a vermilion 圓相 round the box drawn the same way, heaviest where it starts, thinning, left open with a dry-brush gap; revealed in 0.54s, 1.06s in all, from 160ms (80ms after a row or column completed by the same entry, like two strokes written in one go).
- **Celebration** (from MomentsInk):
  1. Two deep ink washes bloom under the board (1.4s, the second 200ms later) and the digits take ink from the centre outward: each pales and swells a little, then returns, 640ms, delayed 55ms per row and column from the centre, keeping a paper halo.
  2. The dialog opens as the board settles. The card unrolls like a hanging scroll, top to bottom, between two wooden rods, in 0.8s.
  3. The title 「恭喜過關！」 is brushed in left to right (0.62s).
  4. A vermilion 「過關」 seal is pressed on the card's top right (0.38s, a slight overshoot).
  - **Still** (motion off or reduced): the scroll hangs open with its rods, the title is written, the seal is on, and the board keeps one faint still wash.

## Fonts

| Face | Source (google/fonts, pinned commit) | Licence | Subset | Size measured |
|---|---|---|---|---|
| Yuji Boku | `ofl/yujiboku/YujiBoku-Regular.ttf` | OFL 1.1 | the brush strings only (below) + ASCII | about 20 KB |
| Noto Serif TC | `ofl/notoseriftc/NotoSerifTC[wght].ttf` | OFL 1.1 | the app's characters (as WenKai) + ASCII, weights 400–900 | about 250 KB |
| EB Garamond | `ofl/ebgaramond/EBGaramond[wght].ttf` | OFL 1.1 | digits and `:/%`, weights 500–700 | about 10 KB |
| EB Garamond Italic | `ofl/ebgaramond/EBGaramond-Italic[wght].ttf` | OFL 1.1 | digits, weights 500–600 | about 6 KB |

- All four are on the commit `scripts/generate-fonts.ts` pins (checked: each path answers 200).
- **Yuji Boku does cover Traditional Chinese** for what ink writes, contrary to the canvas note. It carries 「數獨」「恭喜過關！」「題」 and every dialog title tested; of the app's 451 Han characters it lacks only 14 (份你另咖哪啡嗎懂拖摒查漪產龐). No other brush face is needed, so there is **no licensing blocker**.
- **Brush strings:** Yuji Boku is set only on `title`, `complete-title` and `dialog-title`. The generator cuts it to the characters of those strings in both languages (`home.title`, the completion title and the four dialog titles' message keys, listed once in the generator) plus ASCII. English titles are in Yuji Boku too.
- **Fallback for a missing glyph:** the brush stack is `"Yuji Boku", "LXGW WenKai TC", <Noto Serif TC stack>`. LXGW WenKai TC is already bundled and covers every character the app writes, so a glyph Yuji Boku lacks falls to a 楷 face, never to tofu.
- **Seals** (「數獨」「題」「過關」) use Noto Serif TC 900, inside its subset because those characters are in the source.
- **Gate:** `syncInkFonts` (`styles/ink/fonts.ts`, on `markFontsReady`) marks `data-ink-fonts="ready"` once all four faces have loaded; the skin switches faces only then.

## Performance (Android WebView)

- **No live SVG filter in the DOM.** The roughened grid lines, fibres and mountains are static SVG *images* (mask files). The browser rasterises an image once per size; a live `feTurbulence` on an inline SVG would be recomputed whenever the board repaints (every tap). The group brushes' rough edges are drawn into their paths.
- **Blur only on one cell.** `filter: blur()` animates only on a single digit or its ghost (a box under 50px). Board-wide washes are radial gradients, soft by construction, animated by `opacity` and `transform` only. The canvas's `filter: blur(5px)` on the celebration washes is dropped for a softer gradient stop.
- Brush reveals animate a mask stroke's `stroke-dashoffset` (cheap), never the shape.

## Non-goals

- A dark mode, theme colours, the other three researched styles, sound.
- Layout changes to shared screens for ink's sake (see Calls 1 and 2).
- Merging into `develop` or releasing.

## Anti-goals

- **Other styles change.** minimal, tactile, paper, pixel and cyber look and behave as before; only tests that list every style change for them. The new hooks change no other style's look.
- **Hard-coded style checks** in shared components or theme code.
- **Contrast failures:** `paletteContrast.test.ts` covers `ink`, with an `INK_BOARD_CASES` model for its transparent board.
- **Decoration in the way:** fibres, mountains, washes and brushes never take taps and never cover a digit, except the grid lines and the 圓相, which cross digits only as the canvas draws them.
- **A board without lines.** Where mask images are unsupported, the cell borders stay.

## Constraints

- **Registration follows `CLAUDE.md`** (Registering a style, A new typeface, Board contrast, Skin hooks, Moments). Launcher key `inkVermilion`; launcher icons 26 → 27; `barColors.ink = { light: { vermilion: "#B3261E" } }` (the light theme-color is the primary, by `systemBarColor`).
- **Skin rules** (`styleSheetRules.ts`): scoped to `[data-style="ink"]`, keyframes prefixed `ink-`, no layout properties outside `::before`/`::after` (so no `letter-spacing`, `font-size`, `border` widths), every animation stopped under reduced motion, scales within 1–1.5.
- **No raw colours** in `skin.css` or the moments components (`hardcodedColors.test.ts`): tokens, `color-mix()` of them, and `currentColor` inside SVG.
- **Timing:** every cell animation ends before `ARRIVAL_SETTLE_MS` (1000ms). `groupEffectMs` 1100 (a box completed at its centre is two ripple steps out, 120ms, and its 圓相 ends at 1220ms); ink cells set `--group-ripple-step: 0ms` (a step may only shrink), since the brush is one stroke. `celebrationBoardMs` 1450.
- **Masks inside SVG** (`mask="url(#id)"` within the same `<svg>`) work in every engine; ids are per instance (`useId`). Only CSS masks that reference an element need `canMaskByReference`; ink uses none.

## Calls made by the builder

1. **Home stays the app's layout.** The canvas sets 「數獨」 vertical at 78px with the subtitle vertical beside it and the seal below. A skin may not change layout, so the title stays horizontal at the app's size in Yuji Boku, the logo (80px, above the title) becomes the seal, and the subtitle stays below.
2. **No wide tracking.** The canvas's `letter-spacing` (`.1em`–`.4em` on buttons, labels and titles) is layout by the sheet rules, so it is left out, as for cyberpunk.
3. **The celebration seal is MomentsInk's**, a 58px 「過關」 on the card's top right, not Ink.dc's 124px seal over the screen: the moments board is the specific one.
4. **Brush lines as a mask image on a `board-grid` hook**, not a component slot in the board: the same drawing, no new board component in three pages, and rasterised once (see Performance).
5. **Yuji Boku only on titles, English too;** cut to those strings (20 KB rather than 300 KB for every character).
6. Lining figures, as the canvas CSS and note3 (「等高數字」) say; not oldstyle.
7. The fill halo runs 0.9s, not the canvas's 1.1s, to end under `ARRIVAL_SETTLE_MS`.
8. The loader's beige fog comes from the new `loader-scrim` hook, so dialogs keep the canvas's ink scrim.
9. Ink-only details with no hook (the canvas's `.cav`, `.sec` labels, the 版本 row) follow the nearest token rule above; the builder lists any it could not reach in the visual check.
10. Theme id `vermilion`; English name "Ink & Washi".
11. The icon's 「獨」 is an outline path taken once from Noto Serif TC Black, not `<text>`, so launcher PNGs do not depend on fonts installed where they are generated.
12. The digit halo in a completed group sits on every digit of the group (the canvas only showed the middle row).
