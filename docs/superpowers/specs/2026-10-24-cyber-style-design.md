# Cyberpunk style (`cyber`) — design

## Why

The owner researched six new looks on the style-research canvas (`feature/style-research`, `docs/style-research/project/Cyber.dc.html`; canvas https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE). They are building them into the app **one at a time**. 8-bit (`pixel`) shipped to `develop` on 2026-10-24; cyberpunk is next. This branch builds only cyberpunk. It is not merged until the owner has tried it and says so.

Cyberpunk should feel like solving sudoku on a HUD in a neon city at night:
- a near-black screen with neon magenta, cyan and yellow
- cut-corner panels with thin glowing edges
- a monospace "system" voice
- digits that glitch into place

The owner likes the canvas as a whole (2026-10-24). The only change they asked for is now on the canvas (commits `2784d6a`, `a343f2c`, `8af6dda` on `feature/style-research`):
- **Before:** every lit or chosen piece was a bright pink (or yellow) block, so text on it was hard to read.
- **Now:** it is a **deep fill with a neon edge and neon text**.

## Goals

1. **A fifth style.**
   - Id `cyber`, named 「賽博龐克」 / "Cyberpunk", listed after 8-bit.
   - It appears on the 外觀 page and everywhere a style is listed.
2. **Dark only.**
   - `STYLE_COLOR_MODES.cyber = ["dark"]`. On the canvas: 「只有深色：霓虹要在暗處才亮得起來」.
   - The 外觀 page hides the light/dark control, as it already does for light-only paper.
   - A player whose appearance setting is light still sees cyberpunk in dark, the same way paper ignores dark.
3. **One fixed palette, no theme choice.**
   - One theme, id `neon` (「霓虹」/"Neon"). The label exists only because `settings.colorThemes` needs one; it is never shown.
   - The 「色彩主題」 section is hidden, as for 8-bit.
   - With one theme and one mode, the Settings summary shows the style name alone. Code for this case exists but is untested, because no real style hit it until now. Cyberpunk now covers it.
4. **The canvas's look, through the existing skin hooks** (`data-skin`, `data-variant`, press attributes, `data-selected`, `data-hint-mode`, `.value-arrive`/`.value-leave`). Cyberpunk adds the decoration it needs; the app's layout stays as it is.
   - **Panels:**
     - Cards, keys, controls, tiles, options, segmented buttons, dialog buttons and the header pills have cut corners (a diagonal notch top-left and bottom-right). Each is drawn as a thin edge around a fill.
     - At rest the edge is translucent cyan and the fill is the panel colour.
   - **Lit and chosen pieces:**
     - Deep magenta fill `#4A0B40`, a magenta edge and pink text `#FF5AE0`. This covers:
       - toggles that are on (their description in `#F3B8E6`)
       - the chosen style, option, difficulty and segment
       - the chosen key and active game controls
       - the primary buttons and the play button
       - the final hint step's tag
       - emphasised notes
     - The hint-mode pill and the 「新紀錄！」 badge use deep yellow `#3A3506`, a yellow edge and yellow text.
     - The danger button uses deep red `#4A0A16`, a red edge and red text.
     - **No bright solid block carries text.** The one exception is the remaining-count badge: yellow with near-black digits, small, as on the canvas.
   - **Board:**
     - A 2px frame with a cyan-to-magenta gradient and cut corners.
     - Magenta box lines (2px) and faint cyan cell lines (1px).
     - Two HUD tags sit on the frame:
       - 「GRID 9×9」 at the top left.
       - 「CELL R4C7」 at the bottom right, naming the selected cell and hidden when nothing is selected. Both tags stay in English in both languages.
   - **Cells:**
     - Clues are in the foreground ink.
     - Player digits are cyan with a soft cyan glow.
     - Notes are in the monospace face. Same-digit notes are pink.
     - The selected cell has a faint yellow wash, a yellow digit with a glow, and four yellow corner brackets.
     - Same digit is a faint magenta wash with pink digits.
     - Same row, column and box is a faint cyan wash.
   - **Hint mode:**
     - Scope cells are a cyan wash and pattern cells a magenta wash.
     - The answer cell is a yellow wash with a yellow inset outline.
     - Eliminated notes are red and candidate notes cyan.
   - **Pages:**
     - A near-black page.
     - Faint scanlines over the whole screen, and a slow cyan beam sweeping down it.
     - A neon perspective floor grid at the bottom of the screen, scrolling towards the viewer.
   - **Home:**
     - Above the title, the small mark 「SYS://SUDOKU」 with a 3×3 grid whose diagonal squares are lit magenta.
     - The title in heavy type with a magenta/cyan split shadow. Every few seconds it glitches for a moment.
   - **Settings groups:**
     - Each group's header carries a running number (01, 02, …) on the right, in the monospace face.
     - Toggle indicators are short bars that glow when on.
     - Rows are separated by dashed cyan lines.
5. **Motion:**
   - **Filling a digit:** it glitches into place (offset slices and a magenta/cyan split), held frames over about 0.55s. A cyan scan line runs down the cell at the same time.
   - **Erasing:** a magenta scan line runs up the cell.
   - Background motion: the beam sweep, the floor scroll and the title glitch.
   - **Completing the puzzle:** the completion dialog adds the canvas's slowly turning dashed HUD ring and 「// MISSION COMPLETE」 in glowing yellow.
   - Reduced motion turns every one of these off, as for the other styles.
6. **Type:**
   - Orbitron for digits (board, keys, counts).
   - Share Tech Mono for the system voice: the timer, notes, HUD tags, the Home mark, section labels, group numbers, toasts and version numbers.
   - All other text, Chinese and English, uses the system's sans: PingFang TC, or Noto Sans TC on Android. That is what the canvas's Noto Sans TC stands for.
   - Orbitron and Share Tech Mono are self-hosted like today's fonts.
7. **App icon:** the canvas's neon icon.
   - It shows a near-black square with a magenta horizon grid and a cut-corner board in a cyan-to-magenta glowing edge. Inside are faint grid lines, a lit magenta bar with yellow brackets, and two cyan squares in opposite corners.
   - It is drawn into `styleIcons.ts`. That also gives the 外觀 page its card.
   - It also gets one launcher icon (dark), the PWA icon and manifest, and the first-paint colours in `index.html`.

## Non-goals

- The other four researched styles: 水墨和紙, 黑板粉筆, 藍圖工程, 極光玻璃.
- A light mode for cyberpunk. The canvas still carries leftover light-mode tokens; they are ignored.
- Sound.
- Changing the layout or markup structure of shared screens for cyberpunk's sake. Where a canvas detail would need new layout, it is drawn with pseudo-elements and data attributes, or left out.
- Merging into `develop` or releasing.

## Anti-goals

- **Other styles change:** any change in look or behaviour for minimal, tactile, paper or 8-bit. Their tests stay as they are, except lists that enumerate styles.
- **Bright blocks with text:** text on a bright solid block, other than the small count badge. This is the one thing the owner asked to fix.
- **Contrast failures:** text that fails contrast. `paletteContrast.test.ts` covers `cyber` like every style.
- **A fake light palette:** inventing a light palette just so code that assumes "every style has light" keeps working. Cyberpunk has no light mode, and the code says so.
- **Hard-coded style checks:** `cyber` checks inside shared components. Behaviour hangs off data (style ids, mode lists, theme counts, skin hooks).
- **Decoration in the way:** decoration that blocks taps or covers the board's digits. The scanlines, beam and floor never take pointer events and sit under the board's contents.

## Constraints

- **Registration follows `CLAUDE.md`:**
  - `src/style/styles/cyber/` with `palette.ts`, `skin.css` and `fonts.ts` (a load gate like `syncPixelFonts`, wired in `appearanceSync.ts`).
  - Register in `theme/palettes.ts` `STYLES` (key order = `STYLE_IDS`), `style/index.css` and `theme/styleIcons.ts`.
  - Also register in `STYLE_IDS` / `THEME_IDS_BY_STYLE` / `STYLE_COLOR_MODES` in `theme/themeIds.ts`. It does not go in `STYLE_MODE_NAMES`, since there is only one mode and it is never named.
  - Add the `barColors` block in `index.html`.
  - Add the i18n names: `settings.style.names` and `settings.colorThemes`.
  - Add the entry in `REQUIRED_SELECTORS` in `styleCoverage.test.ts`.
  - Then run `npm run generate:theme-css`, `generate:fonts`, `generate:icons` and `generate:launcher-icons`.
- **Dark-only is new.** Today every style has a light palette (`ThemePalette.light` is required), and several places fall back to light:
  - `getPalette`
  - `index.html`'s first-paint script, which reads a style's `light` colours to pick the theme
  - the theme-CSS generator
  - the contrast tests
  - the PWA icon and manifest, which take the light icon key

  A style's first mode in `STYLE_COLOR_MODES` is already its fallback, so cyberpunk's fallback is dark.

  **Single-mode styles are one mechanism, not two (owner, 2026-10-24).** More light-only styles are coming. Light-only and dark-only are the same case: a style with one mode. So a theme carries a palette for each mode its style has, and every place listed above asks for the style's modes rather than assuming light. Light-only (paper's `lightOnlyThemeBuilder`) moves onto the same model. Paper's look and its tests' outcomes stay as they are.
- **Skin rules** (`styleSheetRules.ts`):
  - Selectors are scoped to `[data-style="cyber"]`, and keyframes are prefixed `cyber-`.
  - No layout properties outside `::before`/`::after`.
  - Every animation is stopped under `prefers-reduced-motion`.
  - Scales stay within 1–1.5.
  - The press hooks required by `styleCoverage.test.ts` are styled.
  - A missing hook is added to the component as a `data-skin` token or a data attribute, and `skinHooks.test.ts` stays green. One known case: the selected cell's name for the 「CELL R4C7」 tag.
- **Palette:** the canvas's `.m-dark` block, with the deep fills above.

  | Role | Colour |
  |---|---|
  | Page | `#07070D` |
  | Panel / card | `#0E0F1C` |
  | Text | `#E6F6FF` |
  | Secondary text | `#8EA3BD` |
  | Edge | cyan at 45% |
  | Magenta (accent, box lines) | `#FF2BD6` |
  | Pink text | `#FF5AE0` |
  | Cyan (player digits, timer, HUD) | `#00F0FF` |
  | Yellow (selection, badge, hint) | `#FCEE0A` |
  | Error | `#FF4D6D` |
  | Deep fills | magenta `#4A0B40`, yellow `#3A3506`, red `#4A0A16` |

- **Contrast:**
  - Pink `#FF5AE0` on deep magenta is about 5.5:1.
  - Error red on deep red is about 4.9:1.
  - Yellow on deep yellow is about 10:1.
  - Secondary text on the panel is well over 4.5:1.

  Some generic board checks may not fit a style whose cell states are translucent washes on one dark panel, such as the 1.25 surface separation. *(My call:)* if so, cyberpunk gets its own board model, like paper's and pixel's: for each cell state, the ink actually drawn on the surface actually drawn. Every ink pair must still pass. The generic cases skip `cyber` only for the rules its model replaces, and each skipped rule is named in the test.
- **Motion hooks:** filling uses `.value-arrive` and erasing `.value-leave`, as 8-bit does. Animations stay shorter than `ARRIVAL_SETTLE_MS` (1000ms). An animation on a cell's `::before`/`::after` settles `arriving`/`leaving` when it ends (`CLAUDE.md`, Skin hooks).
- **Background motion:** the sweep and floor scroll animate `transform` (or `opacity`) only, never `top` or `background-position`, so a low-end Android phone does not repaint the whole screen every frame. *(My call; the canvas animates `top` and `background-position`.)*
- **No raw colours in a skin:** `hardcodedColors.test.ts` bans hex and `rgba()` in `skin.css`. Every neon colour, wash and deep fill comes from `PALETTE_TOKENS`, `color-mix()` of them, or new shared tokens with aliases (the way paper added `rule`/`margin-line`).
- **No layout from a skin:** `styleSheetRules` counts `letter-spacing` and `font-size` as layout. *(My call:)* the canvas's wide tracking and its 56px title are left out. The title's letters may still spread through `title-glyph`'s allowed `margin-inline`.
- **Chinese title weight:** PingFang TC stops at Semibold, so 「數獨」 is not as heavy as the canvas's weight 900. *(My call: accepted, since the body face is the system's.)*
- **The 「CELL」 tag** names the cell carrying `data-selected`. *(My call.)* That matches the canvas in play and in Game Review. During Walkthrough playback, where nothing is selected, the tag is hidden. In hint mode it names the player's selection rather than the answer cell. Following the canvas's "focus cell" there would need each page to pass its focus cell; that is left for later if the owner asks.
- **Fonts:**
  - Set up through `scripts/generate-fonts.ts`: subset, licence files in `public/fonts/licenses/`, and `bundledFonts.test.ts` updated.
  - Both faces are OFL. Orbitron is subset to digits and Latin; Share Tech Mono to Latin.
- **Launcher icons:**
  - One new alias. Its key follows `launcherIconKey`: `cyberNeonDark`.
  - The count in `launcherIcon.test.ts` goes from 25 to 26.
  - Legacy aliases are untouched.
- **Release safety:**
  - No feature toggle (same as 8-bit). The branch is merged only after the owner has finished checking cyberpunk.
  - The player-facing line in `UNRELEASED_CHANGES` (「全新風格」 or similar) is added when the branch is merged, if one is not already there.

## Left to the builder

- How the single-mode model looks in `paletteBuilder` (for example a per-mode map, or `light` and `dark` both optional with one builder per mode) and in `index.html`'s first-paint script, within the anti-goal above and the one-mechanism rule.
- The exact token mapping inside the palette for every `PALETTE_TOKENS` entry, within the colours and contrast rules above.
- How the cut corners and edges are drawn. The canvas uses `clip-path` on `::before` (edge) and `::after` (fill), but the app's components may already use those pseudo-elements.
- Where the page-wide scanlines, beam and floor hang: a fixed pseudo-element on the page root, or the `page` skin hook.
- How the HUD tags and the Home mark get their text: CSS `content` from a data attribute, or a small hook.
- The glitch keyframes' exact slices.
- Test structure.
