# Per-style loading, group completion and puzzle completion (`style-moments`) — design

## Why

Every style looks its own except at three moments, which are still shared:
- the loading screen while a puzzle is generated: one Lottie animation for all styles
- the effect when the player completes a row, column or box: one ripple flash
- the puzzle-complete moment: canvas fireworks behind the 「恭喜過關！」 dialog

On 2026-10-24 the owner designed a per-style version of all three on the style-research canvas (https://claude.ai/artifact/72nsZrRhPbd5nfnKt8UnWE). The owner reviewed the designs and said 「設計目前好像都沒什麼太大問題了」. This project builds them for the five styles the app has: minimal, tactile, paper, pixel and cyber. It works on branch `feature/style-moments` and is merged only when the owner says so.

After this project, a separate refactor-and-cleanup pass will make adding the next style easier. That pass is not part of this spec. Still, build this in the way that makes it easiest: see Constraints, "One place per style".

## Visual reference (read-only, branch `feature/style-research`)

Use the worktree `/Users/ethan/Project/sudoku/.worktrees/style-research`. Files are under `docs/style-research/project/`:
- **Loading and puzzle completion:** `MomentsMinimal.dc.html`, `MomentsTactile.dc.html`, `MomentsPaper.dc.html`, `MomentsPixel.dc.html`, `MomentsCyber.dc.html`. Each has a 載入中 scene, a 過關 scene, mode toggles and a 減少動態 variant.
- **Row, column and box completion:** `GroupMinimal.dc.html` … `GroupCyber.dc.html`. Each shows 「完成一列」「完成一欄」「完成一宮」「同時完成列＋宮」.
- **Notes:** `canvas.json` holds one sticky note per board (`momentsNote1`–`5`, `groupNote1`–`5`). Each note describes the concept, the reduced-motion version and the implementation hints.

The boards are the look to match: colours, timing, sequence and copy. Their CSS keyframes are the starting point. Port them into the app's skins rather than reinventing them.

## Goals

1. **Loading, per style.**
   - The puzzle loader shows the style's own loading animation instead of the Lottie animation. It does this wherever the loader appears today: Home's new game, Game and the Walkthrough. It keeps the caption 「正在產生題目…」 and the scrim/card frame as each board draws it.
   - Each style's concept:
     - **minimal:** 3×3 squares light in solve order on a frosted card. The dark mode is the higher-contrast version.
     - **tactile:** tiles drop into a sunken tray, press down together, then lift.
     - **paper:** a pen draws a grid on a taped sticky note, writes digits, then the note is wiped.
     - **pixel:** an RPG window with the 3×3 mark lighting like a snake, NOW LOADING dots, and a block progress bar.
     - **cyber:** a HUD panel with counter-rotating rings, a typed generator log, and a progress bar that jumps back.
2. **Row, column and box completion, per style.**
   - When an entry completes one or more groups, the cells of those groups play the style's effect from the board.
   - The 「同時完成列＋宮」 case plays both, and a cell in both groups plays once.
   - Each style's effect:
     - **minimal:** a quiet wash spreading out from the entered cell.
     - **tactile:** keys press in one by one and spring back.
     - **paper:** a pencil strike through the row or column, and a hand-drawn loop around a box.
     - **pixel:** a line-clear blink, two hard steps at most, with pixel sparks.
     - **cyber:** scan beams from the cell, a box outline that steps out, and ROW/COL/BOX OK tags.
   - The effect is short (about 0.5–0.9s) and never blocks input.
3. **Puzzle completion, per style.**
   - When the puzzle is solved, the style's celebration plays: the board effect, then the dialog arriving in the style's way, then the style's final beat. This replaces the canvas fireworks in the game's completion dialog.
   - Each style's sequence:
     - **minimal:** a diagonal wash, the card rises, a ring is drawn around the trophy.
     - **tactile:** boxes 1 to 9 spring up, the card drops in like a tile, the trophy key is pressed.
     - **paper:** a red-pen ✓, the card lands, a hand-drawn underline, and a 「完成」 stamp with today's date in the board's date format.
     - **pixel:** rows flash like a line clear, STAGE CLEAR drops letter by letter, pixel bursts, the window opens in 4 steps.
     - **cyber:** a scan beam over the rows, yellow brackets lock on, 「// MISSION COMPLETE」 glitches in, and the card opens like a CRT.
   - The dialog's content and buttons stay as today: title, difficulty tag, 新紀錄 badge, time and hints, and actions. Only the way it arrives and its decoration change per style.
4. **The 「動態效果」 setting and reduced motion** (owner's rule, 2026-10-24):
   - **Group completion:** plays only when motion is allowed (`useMotionAllowed()`: setting on and no reduced motion). Otherwise nothing plays: no still cue, no flash.
   - **Puzzle completion:** when motion is not allowed, the style's still version is shown. That is the 減少動態 variant on each Moments board: for example paper's ✓, underline and stamp already in place, or pixel's STAGE CLEAR with still stars. The dialog then appears without motion.
   - **Loading:** plays regardless of the setting. Only system reduced motion swaps it for the board's still version.

## Non-goals

- The four research styles (ink, chalk, blueprint, aurora). Their boards exist, but they are not built.
- The refactor-and-cleanup pass. It follows as its own project.
- Sound.
- Changing when the completion dialog's content appears, its copy, or its buttons. Changing what statistics record.
- DonateSuccess's fireworks: the donate page stays as it is.

## Anti-goals

- **Unscoped changes:** a shared change that alters how a style looks or behaves without being in this design.
- **Blocking input:** an effect that blocks input or makes the player wait longer than today before they can act. Today the dialog appears after the group flash; the new sequence should finish within about the same time to the first tappable button, unless a board's timing says otherwise. Where it does, follow the board.
- **Unreadable digits:** an effect that hides digits for more than a moment or leaves them unreadable.
- **Flashing:** more than three flashes per second, or more than two flashes per row (pixel).
- **Style checks in shared components:** a style is reached through its own registered pieces, never through `if (style === "pixel")` in shared components.

## Constraints

- **One place per style.**
  - Each style's loader, celebration and group effect live with that style. That means `src/style/styles/<id>/` for CSS, plus a small per-style component folder in `presentation/` if markup is needed.
  - Each style's pieces are registered in one map keyed by style id, typed so that adding a style without its pieces is a type error, or else falls back to a declared default (minimal's). Pick one and document it in `CLAUDE.md` under "Registering a style".
  - The shared loader, completion dialog and board only ask that map.
- **Board hooks:**
  - Cells carry their row, column and box (for example `--cell-row`, `--cell-column`, `--cell-box`, or data attributes) and, while a group effect plays, which group kind they belong to (row, column or box) and the origin cell. Delays then come from CSS (`calc()` on those variables) rather than a JS timer per cell.
  - The board carries a "puzzle complete" state for the celebration's board effect.
  - Keep `useCompletionFlash`'s callback contract (`onComplete` after the effect), because the completion dialog waits on it.
- **Skin rules** (`styleSheetRules.ts`):
  - scoped selectors and prefixed keyframes;
  - no layout properties outside pseudo-elements;
  - no raw colours (tokens and `color-mix()`);
  - every animation stopped under `prefers-reduced-motion`.
  - The setting is enforced in code: when motion is not allowed, no classes or attributes that start animations are set.
- **Fonts:** only bundled faces.
  - Paper's 「完成」 and digits use WenKai and Caveat. Run `generate:fonts` for new characters.
  - Pixel uses Press Start 2P and Cubic 11; cyber uses Orbitron and Share Tech Mono.
  - Text drawn in CSS `content` or SVG is decorative, the same in both languages, and `aria-hidden`: STAGE CLEAR, MISSION COMPLETE, NOW LOADING, the generator log, ROW/COL/BOX OK.
  - Visible words in the dialog stay translated as today.
- **Lottie:** once no style uses the Lottie loader, remove `vue3-lottie` and `src/assets/lottie/sudoku-loader.json`.
- **Fireworks:** `FireworkCanvas` stays for DonateSuccess only. If DonateSuccess is its only user, keep it there.
- **Contrast:** the paper stamp's red, and any text a celebration draws (for example STAGE CLEAR on its window), must pass `paletteContrast` rules for text, or 3:1 for large display text.
- **Performance:** keep to transforms, opacity and small SVGs. No per-frame JS. Note anything heavy, such as cyber's glow and clip-path, for an Android check at the end.

## Calls made after the builder check *(my calls unless marked)*

- **The final entry (owner, 2026-10-24):** the entry that solves the puzzle plays the celebration only. It plays no group effect and no whole-board ripple first, because the celebration's board phase is the board effect.

- **When the celebration plays:** only on the "just completed" event in play, as the completion dialog is shown today. A game loaded already completed, Game Review, and reopening never replay it.
- **The still version of the celebration:** the board shows the board's end state as its 減少動態 variant draws it (paper's ✓, underline and stamp; pixel's STAGE CLEAR; cyber's brackets and text; minimal's tinted entries and ring; tactile's pressed trophy key). The dialog appears without motion.
- **The loader's frame:**
  - `PuzzleLoader` keeps the shared overlay: the scrim, its fade transition and the `visible` prop.
  - Each style's piece draws everything inside it: its own card (frosted card, tray, sticky note, RPG window, HUD panel) and the caption.
  - The `themeColor` and `size` props go if no caller needs them. Today no caller passes them.
- **Progress bars:** the pixel and cyber progress bars and cyber's generator log are looping decoration. They are not tied to real progress.
- **Registration:** a typed map keyed by `StyleId`, so a new style without its loader, celebration and group pieces is a type error. `styleCoverage.test.ts` gains the selectors each style must style.
- **Words inside effects (owner, 2026-10-24):** text that reads as a message to the player follows the language; text that is a mark or emblem stays as drawn.
  - Paper's 「完成」 stamp follows the language: 「完成」 in zh-Hant, "SOLVED" in Caveat in English. It comes from the i18n messages.
  - STAGE CLEAR, NOW LOADING, MISSION COMPLETE and ROW/COL/BOX OK are English decoration in both languages.
  - For later styles: ink's 「題」/「過關」 seals stay Chinese, chalk's 「好棒！」 becomes "Great!" in English, and blueprint's 「核可」 keeps its 「APPROVED」 line.
- **The stamp's date:** follows the app's copy rule (「10/24」, slash date, no year). WenKai is bundled as a subset, so add 「完成」 and run `generate:fonts`.
- **Group overlays:**
  - Effects drawn per group, not per cell, get a board-level overlay layer in the board components: paper's strike and loop, cyber's beams, outline and ROW/COL/BOX OK tags, and pixel's sparks.
  - The overlay is positioned by the completed group (row or column index, box index) from the board's own coordinates. It is markup the style's piece renders, so the skin rules' "no layout outside pseudo-elements" applies to skin CSS only, not to these components.
  - A cell in both a row and a box takes the earlier group's cell effect once. The overlays for both groups still draw.
- **Board versus rules:** when a board's CSS breaks a skin rule, convert it (tokens, prefixed keyframes, transforms). Keep the look. Timing may move slightly (within about 20%) when the conversion needs it.

## Left to the builder

- The exact shape of the per-style registration (components, CSS-only classes, or both) within "One place per style".
- How a group effect knows its kind and origin: attributes on cells or on the board.
- How the celebration's board phase hands over to the dialog: a promise or callback from the style's piece, or a fixed duration per style. Whichever is chosen, the dialog stays in sync with the board.
- Test structure: sheet tests per skin, component tests for the registry and the motion gate.
