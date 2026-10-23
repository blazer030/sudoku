# 8-bit style (`pixel`) — design

## Why

The owner researched six new looks on the style-research canvas (`feature/style-research`, `docs/style-research/project/Pixel.dc.html`; canvas https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE) and wants them built into the app **one at a time**, 8-bit first. This branch builds only 8-bit; it is not merged until the owner has tried it and says so.

8-bit should feel like playing sudoku on a 1989 handheld or a red-and-white home console: square pixels, a pixel font, hard shadows, and motion that jumps in steps instead of easing.

## Goals

1. A fourth style, id `pixel`, named 「8-bit 電玩」 / "8-bit", listed after paper (the 外觀 page's grid has no groups). It appears on the 外觀 page and everywhere a style is listed.
2. **Two modes with the style's own names:** light is 「掌機」, dark is 「紅白機」. Other styles keep 淺色／深色. The names appear wherever the app names a mode for that style (the 外觀 page's light/dark control and the Settings summary).
3. **One fixed palette per mode, no theme choice** (owner, 2026-10-23: changing the colours loses the feel).
   - 掌機: the classic four greens `#0F380F` `#306230` `#8BAC0F` `#9BBC0F`.
   - 紅白機: NES colours on black, as on the canvas (`#FCFCFC` `#6C6C6C` `#1E1E3C` `#000000`, entry `#3CBCFC`, highlight `#F8B800`, error red, same-digit blue `#0058F8`).
   - Any style with a single theme hides the 「色彩主題」 section on the 外觀 page, the same way a single-mode style already hides 深淺色. The Settings summary then shows only the mode name.
4. **Pixel type:** a pixel font for digits and Latin text, a pixel font for Chinese, and a small pixel font for notes. All are self-hosted like today's fonts.
5. **Board, keys and chrome in pixel form, through the existing skin hooks** (`data-skin`, `data-variant`, press attributes):
   - The board has thin 2px cell lines and 4px box lines, inside a notched pixel frame.
   - Same row/column/box is marked with a 2px dither pattern; same digit is a solid fill.
   - The selected cell is inverted, with a blinking corner cursor.
   - Keys are square, with a hard drop shadow. Pressing one moves the key 4px into its shadow.
   - The remaining-count badge is a small square pixel tag.
6. **Motion in steps:** every 8-bit animation uses `steps()`, never smooth easing.
   - Filling a digit makes it pop in four steps while eight pixels burst outward.
   - Erasing bursts the same pixels in a light colour.
   - The cursor blinks.
   - Reduced motion turns all of this off, as for the other styles.
7. **App icon:** the sudoku-screen icon from the canvas. It has three hearts, a 3×3 box with 1, 5 and 9, and a cursor in the top-right cell; the dark one adds a star field. It is drawn into `styleIcons.ts`, with launcher icons for 掌機 and 紅白機, PWA icons/manifest for the light key, and the first-paint colours in `index.html`.

## Non-goals

- The other five researched styles.
- Sound effects. The canvas lists an optional 8-bit sound module; the app has no audio at all today.
- Changing layout or markup structure of shared screens for 8-bit's sake. 8-bit is a skin. Where a canvas detail needs layout (for example the home screen's decorations), it is left out rather than forking a component.
- Per-style theme memory changes. The existing "remember the theme per style, else the first" already covers a one-theme style.
- Merging into `develop` or releasing.

## Anti-goals

- Any change in look or behaviour for minimal, tactile or paper. Their tests stay as they are, except lists that enumerate styles.
- Text that fails contrast. `paletteContrast.test.ts` stays and covers `pixel` like every style.
- Smooth tweens, blur or glow. They read as "modern", not 8-bit.
- Hard-coding `pixel` checks inside shared components. Behaviour hangs off data (style ids, mode lists, theme counts, skin hooks).

## Constraints

- **Registration follows `CLAUDE.md`:**
  - `src/style/styles/pixel/` with `palette.ts` and `skin.css`, plus `fonts.ts` if the fonts need a load gate as paper's do.
  - Register in `theme/palettes.ts` `STYLES` (key order = `STYLE_IDS`), `style/index.css`, `theme/styleIcons.ts`, and `STYLE_IDS` / `THEME_IDS_BY_STYLE` / `STYLE_COLOR_MODES` in `theme/themeIds.ts`.
  - Then run `npm run generate:theme-css`, `generate:icons`, `generate:launcher-icons` and `generate:fonts`.
  - `CLAUDE.md` gets the steps it is missing: the `index.html` colour block, the i18n names, the icon and font scripts, and `styleCoverage`.
- **Skin rules** (`styleSheetRules.ts`):
  - Selectors are scoped to `[data-style="pixel"]`, and keyframes are prefixed `pixel-`.
  - No layout properties outside `::before`/`::after`.
  - Every animation is stopped under `prefers-reduced-motion`.
  - Scales stay within 1–1.5.
  - The press hooks required by `styleCoverage.test.ts` are styled.
  - Where a hook is missing, it is added to the component as a `data-skin` token (for example `badge` on the remaining-count badge), and `skinHooks.test.ts` stays green.
- **Contrast:**
  - In 掌機, only `#0F380F` passes 4.5:1 on the light greens (5.0 on `#8BAC0F`, 6.0 on `#9BBC0F`). `#306230` fails at 2.8–3.3, so every text role, notes and secondary text included, uses `#0F380F`. Hierarchy comes from font and size, as the canvas does.
  - In 紅白機, NES red on the navy surface is 4.25, so error digits use a lighter NES red or never sit on navy.
  - Several of the generic board checks cannot hold for a four-shade palette: surface separation of 1.25 (`#8BAC0F` on `#9BBC0F` is about 1.2), every ink on `cell-selected` (the selected cell is inverted), and every ink on the same-digit blue in 紅白機. *(Builder's call:)* pixel gets its own board model, like paper's `PAPER_BOARD_CASES`: for each cell state, the ink actually drawn on the surface actually drawn. Examples:
    - the inverted selected cell: `#9BBC0F` on `#0F380F`
    - white digits on the same-digit blue
    - a dither pattern counted as the mix of its two colours
  - Every one of those pairs must still pass. Where two surfaces differ by pattern rather than lightness (scope dither, error hatch), the model checks the pattern is present instead of the 1.25 lightness gap. The generic cases skip `pixel` only for the rules its model replaces, and each skipped rule is named in the test.
- **New motion hooks:**
  - Filling uses the existing `.value-arrive` (0 → digit).
  - Erasing has no hook today; a matching "value leaves" hook is added to the cell (digit → 0, not during hint replay, off under reduced motion). Styles that do not style it see no change.
  - Animations stay shorter than `ARRIVAL_SETTLE_MS`.
- **Telling cells apart without colour (掌機)** *(my call, from the canvas)*:
  - Player digits carry a 2px underline that clues don't have.
  - An error cell (檢查衝突) gets a diagonal pixel hatch in `#0F380F` behind its digit, and the digit blinks twice in steps.
  - Same-digit cells keep the solid `#8BAC0F` fill.
  - 紅白機 shows errors in NES red and has colour to spare, but uses the same underline and hatch for consistency.
- **Fonts:**
  - Through `scripts/generate-fonts.ts`: subset, licence files in `public/fonts/licenses/`, `bundledFonts.test.ts` updated.
  - The Chinese face is cut to the characters `src` uses, the same way WenKai is.
- **Launcher icons:** two new aliases (掌機, 紅白機). The count in `launcherIcon.test.ts` goes from 23 to 25; legacy aliases are untouched.
- **Release safety:** the style ships off in production through `featureToggle` (it shows in develop builds only). See "Needed from the owner".

## Decided shape

| | 掌機 (light) | 紅白機 (dark) |
|---|---|---|
| Background / card | `#9BBC0F` | `#000000` / `#1E1E3C` |
| Text (all roles) | `#0F380F` | `#FCFCFC`, secondary `#BCBCBC` |
| Player digits | `#0F380F` | `#3CBCFC` |
| Primary / buttons | `#0F380F` on `#9BBC0F` | `#F8B800` with black text |
| Same digit | `#8BAC0F` fill | `#0058F8` fill, white digit |
| Shadow | `#306230` | `#3C3C3C` |

The canvas's `.m-light` / `.m-dark` blocks in `Pixel.dc.html` are the reference for every other token.

- **Fonts**: see "Needed from the owner" item 2.
- **Theme id:** one theme, id `classic` (labels 「經典」/"Classic"). `settings.colorThemes` and the messages test need a label even though it is never shown.
- **Launcher keys** follow `launcherIconKey`: `pixelClassic` and `pixelClassicDark`.

## Needed from the owner

1. **Hide it in production until it's ready?** (recommended: yes)
   - With the feature toggle, 8-bit shows only in develop builds, so `develop` can still ship a release while 8-bit is unfinished.
   - Proposed scope: the 外觀 page and every style list skip `pixel` in production. The files (CSS, fonts, icons, the two launcher aliases) still ship, so turning it on later is a one-line change. A production build that reads a saved `pixel` falls back to minimal.
   - Without the toggle, merging means the next release includes 8-bit.
2. **Which pixel font for text.**
   - Press Start 2P is very wide: English set in it runs about 1.8× wider than today's font. A skin may not change sizes or layout, so English buttons, tiles and labels would overflow.
   - Proposal: Press Start 2P only for digits (board, keys, timer, counts); 俐方體 11 號 (Cubic 11, OFL, Traditional Chinese pixel font with its own Latin letters) for all other text in both languages; Silkscreen for notes.
   - Alternative: pixel type only for digits, and the system font for everything else.
3. **English mode names.** Proposed "Handheld" / "Console" (no Game Boy / Famicom trademarks). Cheap to change later.

## Left to the builder

- How per-style mode names are modelled: a per-style label map in `themeIds.ts`, or i18n keys `settings.colorMode.<style>.<mode>` with a fallback.
- How the single-theme rule is expressed (hide when `themes.length < 2`), and the matching Settings summary change.
- The exact token mapping inside `paletteBuilder` for both modes, within the contrast rules above.
- How the dither pattern, notched frame and corner cursor are drawn (pseudo-elements, background images, `box-shadow`).
- The burst animation's pixel layout.
- Test structure.
