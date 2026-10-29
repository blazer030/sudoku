import { readFileSync } from "fs";
import postcss, { type Rule } from "postcss";
import { THEME_IDS_BY_STYLE, STYLE_IDS, STYLE_COLOR_MODES, type ColorMode, type ColorThemeId, type StyleId } from "@/theme/themeIds";
import { contrastRatio, mixColors } from "@/theme/contrast";
import { STYLES, getPalette, type Palette, type PaletteToken, type StyleOwnToken } from "@/theme/palettes";

const TEXT = 4.5;
const LARGE_OR_ICON = 3;

interface ContrastPair {
    name: string;
    foreground: (palette: Palette) => string;
    background: (palette: Palette) => string;
    minimum: number;
    /** Checked only in these styles; every style when left out. */
    styles?: readonly StyleId[];
    /** Skipped in these styles or style modes, whose own board model checks what they really draw instead. */
    exceptIn?: readonly Exemption[];
}

// A whole style ("pixel") or one of its modes ("pixel/light")
type Exemption = StyleId | `${StyleId}/${ColorMode}`;

const isExempt = (exceptIn: readonly Exemption[] | undefined, style: StyleId, mode: ColorMode): boolean =>
    exceptIn?.some(exemption => exemption === style || exemption === `${style}/${mode}`) ?? false;

const pair = (foreground: PaletteToken, background: PaletteToken, minimum = TEXT): ContrastPair => ({
    name: `${foreground} on ${background}`,
    foreground: palette => palette[foreground],
    background: palette => palette[background],
    minimum,
});

const tinted = (foreground: PaletteToken, tint: PaletteToken, alpha: number, base: PaletteToken, minimum: number): ContrastPair => ({
    name: `${foreground} on ${tint} ${alpha * 100}% over ${base}`,
    foreground: palette => palette[foreground],
    background: palette => mixColors(palette[tint], alpha, palette[base]),
    minimum,
});

const TEXT_PAIRS: readonly ContrastPair[] = [
    pair("foreground", "background"),
    pair("foreground", "card"),
    pair("foreground", "cell-clue"),
    pair("foreground-secondary", "background"),
    pair("foreground-secondary", "card"),
    pair("foreground-muted", "background"),
    pair("foreground-muted", "card"),
    pair("on-primary", "primary"),
    pair("on-primary", "primary-hover"),
    pair("on-danger", "danger"),
    pair("on-danger", "danger-hover"),
    pair("primary", "background"),
    pair("primary", "card"),
    pair("accent", "background"),
    pair("accent", "card"),
    pair("danger", "background"),
    // 藍曬圖's cards, dialogs and popovers are drawn in the page colour (its card hook), its card token only fills
    // the keys, which carry no red; its red reads on the page ("danger on background", "error on background")
    { ...pair("danger", "card"), exceptIn: ["blueprint/dark"] },
    pair("error", "background"),
    { ...pair("error", "card"), exceptIn: ["blueprint/dark"] },
    pair("error", "error-surface"),
    // Statistics and review badges, the hint step button
    pair("primary", "primary-light"),
    pair("on-toast", "toast"),
    // The continue card
    pair("on-featured", "featured"),
    // Cyberpunk's neon inks on their deep fills (lit and chosen pieces, signal tags). Its error ink on the
    // deep red is the generic pair above.
    { ...pair("primary-ink", "primary-light"), styles: ["cyber"] },
    { ...pair("signal", "signal-surface"), styles: ["cyber"] },
];

const BOARD_SURFACES: readonly PaletteToken[] = [
    "card", "cell-clue", "primary-light", "highlight", "cell-focus", "cell-scope", "cell-pattern", "error-surface",
    "cell-selected", "cell-peer",
];
const BOARD_INKS: readonly PaletteToken[] = ["foreground", "primary", "error", "note"];
// 8-bit paints its board in four fixed shades: the selected cell is inverted, 紅白機's same digit is a
// blue only white reads on, and scope, peer and error cells are patterns rather than tints. Its board
// model (PIXEL_BOARD_CASES) checks the ink drawn on each of those instead.
// 黑板's red chalk reads only 4.9:1 on the bare board, so it can lie on no wash brighter than a breath. An error
// cell takes the error surface over the peer and same-digit washes (its variant wins), and nothing red is drawn on
// the primary's soft surface, so in 黑板 those three pairs are never drawn; CHALKBOARD_BOARD_CASES checks where the
// red does land. On a hint's scope and pattern washes, the canvas's peer and same-digit washes, the red is only
// ever a struck-out note; CHALKBOARD_BOARD_CASES holds it to the mark's 3:1 there.
const CHALKBOARD_DARK_UNDRAWN: ReadonlySet<string> = new Set(["error on cell-peer", "error on highlight", "error on primary-light"]);
const CHALKBOARD_DARK_STRUCK_OUT: ReadonlySet<string> = new Set(["error on cell-scope", "error on cell-pattern"]);
// 藍曬圖's cells sit on the paper, never on the card, and its error cell lays its own error hatching over every wash (an
// error cell's variant wins over the selected, peer and same-digit ones), so its red digit lies only on the page and
// the error hatching. On a step's hatched scope cells, its same-digit pattern cells and its answer cell (the selected
// wash, which the focus and primary-light tokens share) the red is only ever a struck-out note. BLUEPRINT_BOARD_CASES
// checks where the red does land.
const BLUEPRINT_DARK_UNDRAWN: ReadonlySet<string> = new Set([
    "error on card", "error on primary-light", "error on highlight", "error on cell-focus", "error on cell-scope", "error on cell-pattern",
    "error on cell-selected", "error on cell-peer",
]);
const BOARD_PAIRS: readonly ContrastPair[] = BOARD_SURFACES.flatMap(surface => BOARD_INKS.map((ink) => {
    const boardPair = pair(ink, surface);
    const inChalkboardModel = CHALKBOARD_DARK_UNDRAWN.has(boardPair.name) || CHALKBOARD_DARK_STRUCK_OUT.has(boardPair.name);
    const exceptIn: readonly Exemption[] = [
        "pixel",
        ...(inChalkboardModel ? ["chalkboard/dark" as const] : []),
        ...(BLUEPRINT_DARK_UNDRAWN.has(boardPair.name) ? ["blueprint/dark" as const] : []),
    ];
    return { ...boardPair, exceptIn };
}));

// Board layers must look different from each other, not just carry readable ink. 8-bit's four shades
// cannot sit that far apart (#8BAC0F on #9BBC0F is about 1.2): it tells its layers apart by pattern
// (dither, hatch, inversion), and its board model checks the ink on each pattern instead. Cyberpunk's
// states are neon washes over one dark panel, 7 to 18 percent of a colour on the card, so its layers
// differ in hue rather than in lightness; its edges and the cell's outlines tell them apart, and its
// board model checks the ink drawn on each. Ink and washi's board and cells are transparent on the page:
// clues sit on the bare page like every other cell, so there is no clue layer to set apart from the card,
// and a same-digit cell is told apart by its vermilion digit, not by a wash darker than the clue or peer
// cells'; its board model (INK_BOARD_CASES) checks the ink drawn on each wash. Chalkboard's board is the same:
// transparent cells on the page under faint washes of chalk or marker, a same-digit cell told apart by its
// yellow or orange digit; CHALKBOARD_BOARD_CASES checks the ink drawn on each wash. Blueprint's board is laid on the
// page's paper colour too: clues sit on the paper, a peer cell is told apart by its hatching and a same-digit cell by
// its amber or red digit, not by a wash darker than the rest; BLUEPRINT_BOARD_CASES checks the ink drawn on each.
const SURFACE_PAIRS: readonly ContrastPair[] = [
    { ...pair("cell-clue", "card", 1.25), exceptIn: ["pixel", "cyber", "ink", "chalkboard", "blueprint"] },
    { ...pair("highlight", "cell-clue", 1.25), exceptIn: ["pixel", "cyber", "ink", "chalkboard", "blueprint"] },
    { ...pair("highlight", "card", 1.25), exceptIn: ["pixel", "cyber", "chalkboard", "blueprint"] },
    { ...pair("highlight", "cell-peer", 1.25), exceptIn: ["pixel", "cyber", "ink", "chalkboard", "blueprint"] },
    { ...pair("cell-peer", "card", 1.08), exceptIn: ["pixel", "cyber"] },
    // The selection outline is a UI component, so 3:1 applies
    { ...pair("primary", "cell-selected", LARGE_OR_ICON), exceptIn: ["pixel"] },
];

const TINTED_PAIRS: readonly ContrastPair[] = [
    tinted("accent", "accent", 0.1, "card", TEXT),
    tinted("accent", "accent", 0.15, "card", LARGE_OR_ICON),
    tinted("danger", "danger", 0.1, "card", LARGE_OR_ICON),
    // The hint panel's digit chip
    tinted("on-primary", "on-primary", 0.1, "primary", TEXT),
    // The continue card's chips. 8-bit's skin draws them without the tint, as a transparent tag in a
    // 2px frame (the canvas's chip), and no four-green tint passes in 掌機; PIXEL_BOARD_CASES checks the drawn pair.
    { ...tinted("on-featured", "on-featured", 0.2, "featured", TEXT), exceptIn: ["pixel/light"] },
    // Loader text over stacked overlays
    tinted("on-scrim", "scrim", 0.65, "background", TEXT),
];

const PAPER_CSS = readFileSync("src/style/styles/paper/skin.css", "utf8");

// The texture dots are the border colour at no more than 40%
const GRAIN = 0.4;

// Paper's page texture: text crosses the ruled lines and the texture dots
const PAPER_INKS: readonly PaletteToken[] = ["foreground", "foreground-secondary", "foreground-muted", "primary"];
const PAPER_PAIRS: readonly ContrastPair[] = PAPER_INKS.flatMap(ink => [
    pair(ink, "rule"),
    tinted(ink, "border", GRAIN, "background", TEXT),
]).map(contrastPair => ({ ...contrastPair, styles: ["paper"] }));

const ALL_PAIRS = [...TEXT_PAIRS, ...BOARD_PAIRS, ...SURFACE_PAIRS, ...TINTED_PAIRS, ...PAPER_PAIRS];

// Paper's board is drawn on the page rather than on the card tokens: a sheet of card colour laid
// translucently over the page, its grain dots on top, and every cell variant a translucent wash
// over that. The sheet, washes and hatch are read from paper.css.
interface Wash { token: PaletteToken; alpha: number }

const paperCustomProperties = (selector: string): Map<string, string> => {
    const properties = new Map<string, string>();
    postcss.parse(PAPER_CSS).walkRules((rule) => {
        if (rule.parent?.type === "atrule" || rule.selector !== selector) return;
        rule.walkDecls(/^--paper-/, (declaration) => {
            properties.set(declaration.prop, declaration.value.replace(/\s+/g, " ").trim());
        });
    });
    return properties;
};

const PAPER_PROPERTIES = paperCustomProperties('[data-style="paper"]');

const paperWash = (name: string): Wash => {
    const value = PAPER_PROPERTIES.get(name);
    const match = /^color-mix\(in srgb, var\(--color-([\w-]+)\) ([\d.]+)%, transparent\)$/.exec(value ?? "");
    if (match === null) throw new Error(`paper.css sets no wash ${name} in the expected form: ${value}`);
    return { token: match[1] as PaletteToken, alpha: Number(match[2]) / 100 };
};

const over = (wash: Wash, palette: Palette, base: string): string => mixColors(palette[wash.token], wash.alpha, base);

const PAPER_CELL_VARIANTS = ["clue", "peer", "same-digit", "selected", "scope", "pattern", "focus", "answer", "error", "wrong"] as const;
type PaperCellVariant = "default" | typeof PAPER_CELL_VARIANTS[number];

/** What a cell of this variant shows under the board's ink, on a board laid over `page`. */
const paperCellSurface = (variant: PaperCellVariant, palette: Palette, page: string): string => {
    const sheet = over(paperWash("--paper-sheet"), palette, page);
    return variant === "default" ? sheet : over(paperWash(`--paper-wash-${variant}`), palette, sheet);
};

interface PaperBoardCase { label: string; foreground: string; background: string; minimum: number }

const PAPER_BOARD_CASES: PaperBoardCase[] = STYLES.paper.themes.flatMap((theme) => {
    const palette = getPalette("paper", theme.id, "light");
    const prefix = `paper/${theme.id}/light`;
    const surface = (variant: PaperCellVariant) => paperCellSurface(variant, palette, palette.background);
    // Each surface alone, under a grain dot, and for clue squares under a hatch stroke
    const inkSurfaces = (["default", ...PAPER_CELL_VARIANTS] as const).flatMap((variant) => {
        const flat = surface(variant);
        const layers = [{ name: variant, colour: flat }, { name: `${variant} under a dot`, colour: mixColors(palette.border, GRAIN, flat) }];
        if (variant === "clue") layers.push({ name: "clue under a hatch stroke", colour: over(paperWash("--paper-hatch"), palette, flat) });
        return layers;
    });
    const inks = inkSurfaces.flatMap(layer => BOARD_INKS.map(ink => ({
        label: `${prefix}: ${ink} on ${layer.name} ≥ ${TEXT}`,
        foreground: palette[ink],
        background: layer.colour,
        minimum: TEXT,
    })));
    const apart = ([
        ["clue", "default", 1.25],
        ["same-digit", "clue", 1.25],
        ["same-digit", "default", 1.25],
        ["same-digit", "peer", 1.25],
        ["peer", "default", 1.08],
    ] as const).map(([upper, lower, minimum]) => ({
        label: `${prefix}: ${upper} apart from ${lower} ≥ ${minimum}`,
        foreground: surface(upper),
        background: surface(lower),
        minimum,
    }));
    const circle = { label: `${prefix}: primary on selected ≥ ${LARGE_OR_ICON}`, foreground: palette.primary, background: surface("selected"), minimum: LARGE_OR_ICON };
    // The completion card's 完成 stamp: its date is small text in the stamp's ink; its word is large and
    // also crosses the mask's worn rings. The solved board's red check is a mark over the sheet.
    const stampInk = over(paperWash("--paper-stamp-ink"), palette, palette.card);
    const wornStampInk = over({ ...paperWash("--paper-stamp-ink"), alpha: paperWash("--paper-stamp-ink").alpha * paperWash("--paper-stamp-wear").alpha }, palette, palette.card);
    const stamp = [
        { label: `${prefix}: stamp ink on the card ≥ ${TEXT}`, foreground: stampInk, background: palette.card, minimum: TEXT },
        { label: `${prefix}: stamp ink in its worn rings on the card ≥ ${LARGE_OR_ICON}`, foreground: wornStampInk, background: palette.card, minimum: LARGE_OR_ICON },
        { label: `${prefix}: check ink on the sheet ≥ ${LARGE_OR_ICON}`, foreground: over(paperWash("--paper-check-ink"), palette, surface("default")), background: surface("default"), minimum: LARGE_OR_ICON },
    ];
    return [...inks, ...apart, circle, ...stamp];
});

// Each style is checked in the modes it has
const modeCases = <Case>(build: (style: StyleId, themeId: ColorThemeId, mode: ColorMode, palette: Palette) => Case[]): Case[] =>
    Object.values(STYLES).flatMap(style => style.themes.flatMap(theme =>
        STYLE_COLOR_MODES[style.id].flatMap(mode => build(style.id, theme.id, mode, getPalette(style.id, theme.id, mode)))));

const CASES = modeCases((style, themeId, mode, palette) =>
    ALL_PAIRS.filter(contrastPair => (contrastPair.styles?.includes(style) ?? true) && !isExempt(contrastPair.exceptIn, style, mode)).map(contrastPair => ({
        prefix: `${style}/${themeId}/${mode}`,
        label: `${style}/${themeId}/${mode}: ${contrastPair.name} ≥ ${contrastPair.minimum}`,
        palette,
        contrastPair,
    })));

// Text levels must stay apart, so notes and secondary text never read as bright as primary text.
// 掌機 has one text ink, #0F380F, the only green that reads on the light greens; its levels differ by
// font and size instead. 黑板's pale chalk is the canvas's, a hair under the step to the white chalk (1.296).
const ONE_TEXT_INK: readonly Exemption[] = ["pixel/light"];
const TEXT_HIERARCHY: readonly { name: string; upper: PaletteToken; lower: PaletteToken; minimum: number; exceptIn?: readonly Exemption[] }[] = [
    { name: "foreground over foreground-secondary", upper: "foreground", lower: "foreground-secondary", minimum: 1.3, exceptIn: ["chalkboard/dark"] },
    { name: "foreground over foreground-muted", upper: "foreground", lower: "foreground-muted", minimum: 1.4 },
    { name: "foreground-secondary over foreground-muted", upper: "foreground-secondary", lower: "foreground-muted", minimum: 1.05 },
];

const HIERARCHY_CASES = modeCases((style, themeId, mode, palette) => (isExempt(ONE_TEXT_INK, style, mode) ? [] : TEXT_HIERARCHY)
    .filter(level => !isExempt(level.exceptIn, style, mode)).map(level => ({
    label: `${style}/${themeId}/${mode}: ${level.name} ≥ ${level.minimum}`,
    palette,
    level,
})));

// 8-bit's board: each cell state is the ink actually drawn on the surface actually drawn. Every cell lies
// on the page colour. A dither or hatch is the pattern shade checkered or striped over it (#8BAC0F over
// #9BBC0F in 掌機, #1E1E3C over #000000 in 紅白機), and a digit crosses both of its colours, so every ink
// on a pattern is checked on each colour rather than on their mix. Hint mode's pattern and answer cells
// are that shade solid. The skin (--pixel-pattern-shade) draws these.
const PIXEL_PATTERN_SHADE: Readonly<Record<ColorMode, PaletteToken>> = { light: "highlight", dark: "card" };
// A completed group's blink and the solved board's line clear (--pixel-flash-fill, --pixel-flash-ink)
// invert the cell in 掌機, as the GroupPixel board does; the light green would be only 1.2:1 on the page.
// 紅白機 lights it in the console blue under the white ink, since near-white on black flashed too hard.
const PIXEL_FLASH: Readonly<Record<ColorMode, { fill: PaletteToken; ink: PaletteToken }>> = {
    light: { fill: "foreground", ink: "background" },
    dark: { fill: "highlight", ink: "foreground" },
};
// Layers that must look different (SURFACE_PAIRS) stand 1.25:1 apart
const LAYER_APART = 1.25;

interface PixelBoardCase { label: string; foreground: string; background: string; minimum: number }

const PIXEL_BOARD_CASES: PixelBoardCase[] = STYLES.pixel.themes.flatMap(theme => STYLE_COLOR_MODES.pixel.map((mode) => {
    const palette = getPalette("pixel", theme.id, mode);
    const board = palette.background;
    const shade = palette[PIXEL_PATTERN_SHADE[mode]];
    // Player digits are the accent in 紅白機 (the canvas's entry blue)
    const inks: readonly PaletteToken[] = [...BOARD_INKS, "accent"];
    return { prefix: `pixel/${theme.id}/${mode}`, palette, board, shade, inks, flash: PIXEL_FLASH[mode] };
}).flatMap(({ prefix, palette, board, shade, inks, flash }) => {
    const drawn = (name: string, foreground: string, background: string, minimum = TEXT): PixelBoardCase => ({
        label: `${prefix}: ${name} ≥ ${minimum}`, foreground, background, minimum,
    });
    return [
        // Default, clue, player digit and note cells, and the clear pixels of a dither (scope, peer) or a
        // hatch (error, hint-wrong). An error cell that is also selected or the same digit is still drawn as
        // an error (the cell gives the error precedence), so its digit is never on the inverted cell or the
        // same-digit fill.
        ...inks.map(ink => drawn(`${ink} on the board (a pattern's clear pixels too)`, palette[ink], board)),
        // The shaded pixels of a dither or hatch, and hint mode's solid fill
        ...inks.map(ink => drawn(`${ink} on the pattern shade (a pattern's shaded pixels and the hint fill)`, palette[ink], shade)),
        // Error and wrong cells are framed 2px in the foreground ink inside their edge, across both of the hatch's colours
        drawn("error frame (foreground) on the hatch's clear pixels", palette.foreground, board, LARGE_OR_ICON),
        drawn("error frame (foreground) on the hatch's shaded pixels", palette.foreground, shade, LARGE_OR_ICON),
        // A step's answer cell keeps the board and is marked by the corner cursor, in the primary
        drawn("answer's cursor (primary) on the board", palette.primary, board, LARGE_OR_ICON),
        // The selected cell is inverted; its digit, notes and a highlighted note's disc take the page colour
        drawn("selected digit (background on foreground)", palette.background, palette.foreground),
        drawn("selected cell's highlighted note (foreground on its background disc)", palette.foreground, palette.background),
        // Same-digit cells are a solid fill with the foreground ink
        drawn("same digit (foreground on highlight)", palette.foreground, palette.highlight),
        // A completed group's cells flash solid, their digits in the flash's ink, and a hint's answer glows in
        // the primary's light surface ringed in the primary. Between flashes, and around the glow, digits take
        // the foreground ink, which the cases above check on every look under them. The selected cell flashes
        // like the rest (its digit takes the flash's ink too, so the case above covers it); only the hint glow
        // skips it (it is inverted; the cursor and the pop mark it), so no page-coloured digit is drawn on that.
        drawn(`completion flash's digits (${flash.ink}) on its fill (${flash.fill})`, palette[flash.ink], palette[flash.fill]),
        // The flash must show on the cells it lights: the board and a dither's shaded pixels
        drawn(`completion flash's fill (${flash.fill}) apart from the board`, palette[flash.fill], board, LAYER_APART),
        drawn(`completion flash's fill (${flash.fill}) apart from the pattern shade`, palette[flash.fill], shade, LAYER_APART),
        drawn("hint glow's digits (foreground) on its fill (primary-light)", palette.foreground, palette["primary-light"]),
        drawn("hint glow's ring (primary) on its fill (primary-light)", palette.primary, palette["primary-light"], LARGE_OR_ICON),
        // The continue card's chip: a transparent tag on the card's page colour
        drawn("continue-card chip (on-featured on featured)", palette["on-featured"], palette.featured),
        // The blinking corner cursor around the selected cell is a UI component, so 3:1 applies. It sits over
        // the neighbouring cells, so it crosses both of a pattern's colours.
        drawn("selection cursor (primary) on the board", palette.primary, board, LARGE_OR_ICON),
        drawn("selection cursor (primary) on the pattern shade", palette.primary, shade, LARGE_OR_ICON),
        drawn("selection cursor (primary) on the same-digit fill", palette.primary, palette.highlight, LARGE_OR_ICON),
    ];
}));

// Cyberpunk's board: the ink actually drawn on the surface actually drawn (skin.css). Cells are washes
// over the card; glows (a digit's text-shadow, a cell's inner glow) do not count toward contrast.
interface CyberBoardCase { label: string; foreground: string; background: string; minimum: number }

const CYBER_BOARD_CASES: CyberBoardCase[] = STYLES.cyber.themes.flatMap(theme => STYLE_COLOR_MODES.cyber.flatMap((mode) => {
    const palette = getPalette("cyber", theme.id, mode);
    const prefix = `cyber/${theme.id}/${mode}`;
    const drawn = (name: string, foreground: string, background: string, minimum = TEXT): CyberBoardCase => ({
        label: `${prefix}: ${name} ≥ ${minimum}`, foreground, background, minimum,
    });
    // The hint's answer cell: a yellow wash (12% of the signal over the card) inside a signal outline
    const answerWash = mixColors(palette.signal, 0.12, palette.card);
    const surfaces: readonly (readonly [string, string])[] = [
        ["the card", palette.card],
        ["cell-peer", palette["cell-peer"]],
        ["cell-scope", palette["cell-scope"]],
        ["cell-pattern", palette["cell-pattern"]],
        ["cell-focus", palette["cell-focus"]],
        ["cell-selected", palette["cell-selected"]],
        ["highlight", palette.highlight],
        ["the answer wash", answerWash],
    ];
    // A clue, a player's digit and a note can lie on any wash a hint or the selection puts under them;
    // a hint's candidate note is cyan and an eliminated one red, on the hint's cells and the card
    const onEverySurface = (name: string, ink: string) => surfaces.map(([surface, background]) => drawn(`${name} on ${surface}`, ink, background));
    return [
        ...onEverySurface("clue (foreground)", palette.foreground),
        ...onEverySurface("entry (accent)", palette.accent),
        ...onEverySurface("note", palette.note),
        ...onEverySurface("candidate note (accent)", palette.accent),
        ...onEverySurface("eliminated note (error)", palette.error),
        drawn("clue on a clue cell", palette.foreground, palette["cell-clue"]),
        drawn("entry on a clue cell", palette.accent, palette["cell-clue"]),
        drawn("note on a clue cell", palette.note, palette["cell-clue"]),
        drawn("selected digit (signal) on cell-selected", palette.signal, palette["cell-selected"]),
        drawn("same digit (primary-ink) on highlight", palette["primary-ink"], palette.highlight),
        drawn("emphasised note (primary-ink) on primary-light", palette["primary-ink"], palette["primary-light"]),
        drawn("error digit (error) on error-surface", palette.error, palette["error-surface"]),
        drawn("clue in an error cell (foreground) on error-surface", palette.foreground, palette["error-surface"]),
        drawn("note in an error cell on error-surface", palette.note, palette["error-surface"]),
        drawn("selected cell's brackets (signal) on cell-selected", palette.signal, palette["cell-selected"], LARGE_OR_ICON),
        drawn("selected error cell's brackets (signal) on error-surface", palette.signal, palette["error-surface"], LARGE_OR_ICON),
        drawn("answer outline (signal) on the answer wash", palette.signal, answerWash, LARGE_OR_ICON),
        drawn("wrong cell's outline (error) on error-surface", palette.error, palette["error-surface"], LARGE_OR_ICON),
    ];
}));

// Ink and washi's board: the ink actually drawn on the surface actually drawn. The board and its cells are
// transparent, so every cell lies on the page or on a wash mixed over it (palette.ts).
interface InkBoardCase { label: string; foreground: string; background: string; minimum: number }

const INK_BOARD_CASES: InkBoardCase[] = STYLES.ink.themes.flatMap(theme => STYLE_COLOR_MODES.ink.flatMap((mode) => {
    const palette = getPalette("ink", theme.id, mode);
    const prefix = `ink/${theme.id}/${mode}`;
    const drawn = (name: string, foreground: string, background: string, minimum = TEXT): InkBoardCase => ({
        label: `${prefix}: ${name} ≥ ${minimum}`, foreground, background, minimum,
    });
    const surfaces: readonly (readonly [string, string])[] = [
        ["the page", palette.background],
        ["cell-peer", palette["cell-peer"]],
        ["cell-scope", palette["cell-scope"]],
        ["cell-pattern", palette["cell-pattern"]],
        ["highlight", palette.highlight],
    ];
    // A clue, a player's digit, a note and the vermilion (the same digit, the selected digit's note, a hint's
    // eliminated and emphasised candidates) can lie on any wash a hint or the selection puts under them
    const onEverySurface = (name: string, ink: string) => surfaces.map(([surface, background]) => drawn(`${name} on ${surface}`, ink, background));
    return [
        ...onEverySurface("clue (foreground)", palette.foreground),
        ...onEverySurface("entry and candidate note (accent)", palette.accent),
        ...onEverySurface("note", palette.note),
        ...onEverySurface("vermilion (primary-ink)", palette["primary-ink"]),
        // The ink ring around the selected digit's note is a mark, not text, so 3:1 applies
        ...surfaces.map(([surface, background]) => drawn(`note ring (primary) on ${surface}`, palette.primary, background, LARGE_OR_ICON)),
        drawn("error digit (error) on the page", palette.error, palette.background),
        drawn("error digit (error) on error-surface", palette.error, palette["error-surface"]),
    ];
}));

const CHALKBOARD_CSS = readFileSync("src/style/styles/chalkboard/skin.css", "utf8");

// A step's answer cell is washed in the primary over the page by --chalkboard-answer-wash, set per mode in chalk's sheet
const chalkboardAnswerWash = (mode: ColorMode): number => {
    const selector = mode === "dark" ? ':root.dark[data-style="chalkboard"]' : '[data-style="chalkboard"]';
    let percent: string | undefined;
    postcss.parse(CHALKBOARD_CSS).walkRules((rule) => {
        if (rule.selector !== selector) return;
        rule.walkDecls("--chalkboard-answer-wash", (declaration) => { percent = declaration.value; });
    });
    if (percent === undefined) throw new Error(`no --chalkboard-answer-wash on ${selector}`);
    return parseFloat(percent) / 100;
};

// Chalkboard's board: the ink actually drawn on the surface actually drawn. The board and its cells are
// transparent, so every cell lies on the page or on a wash mixed over it (palette.ts). The red lies only on the
// bare board, the error surface and the hint's scope, pattern and answer washes (its struck-out notes).
interface ChalkboardBoardCase { label: string; foreground: string; background: string; minimum: number }

const CHALKBOARD_BOARD_CASES: ChalkboardBoardCase[] = STYLES.chalkboard.themes.flatMap(theme => STYLE_COLOR_MODES.chalkboard.flatMap((mode) => {
    const palette = getPalette("chalkboard", theme.id, mode);
    const prefix = `chalkboard/${theme.id}/${mode}`;
    const drawn = (name: string, foreground: string, background: string, minimum = TEXT): ChalkboardBoardCase => ({
        label: `${prefix}: ${name} ≥ ${minimum}`, foreground, background, minimum,
    });
    const surfaces: readonly (readonly [string, string])[] = [
        ["the page", palette.background],
        ["cell-peer", palette["cell-peer"]],
        ["cell-scope", palette["cell-scope"]],
        ["cell-pattern", palette["cell-pattern"]],
        ["highlight", palette.highlight],
        ["the answer wash", mixColors(palette.primary, chalkboardAnswerWash(mode), palette.background)],
    ];
    // A clue, a player's digit, a note and a highlighted note can lie on any wash a hint or the selection puts under them
    const onEverySurface = (name: string, ink: string) => surfaces.map(([surface, background]) => drawn(`${name} on ${surface}`, ink, background));
    return [
        ...onEverySurface("clue (foreground)", palette.foreground),
        ...onEverySurface("entry (accent)", palette.accent),
        ...onEverySurface("note", palette.note),
        ...onEverySurface("same digit and highlighted note (primary)", palette.primary),
        // The selection's chalk ring and a hint's emphasised note ring are marks, not text, so 3:1 applies
        ...surfaces.map(([surface, background]) => drawn(`ring (primary) on ${surface}`, palette.primary, background, LARGE_OR_ICON)),
        drawn("clue in an error cell (foreground) on error-surface", palette.foreground, palette["error-surface"]),
        drawn("note in an error cell on error-surface", palette.note, palette["error-surface"]),
        ...([["the page", palette.background], ["error-surface", palette["error-surface"]]] as const)
            .map(([surface, background]) => drawn(`error on ${surface}`, palette.error, background)),
        // A hint's struck-out notes: 黑板's red chalk on the canvas's washes (3.9:1 on the scope, 3.6:1 on the
        // pattern, 3.6:1 on the answer wash) is held to a mark's 3:1, its strike carrying it; 白板's red marker reads as text
        ...surfaces.filter(([surface]) => ["cell-scope", "cell-pattern", "the answer wash"].includes(surface))
            .map(([surface, background]) => drawn(`struck-out note (error) on ${surface}`, palette.error, background, mode === "dark" ? LARGE_OR_ICON : TEXT)),
    ];
}));

const BLUEPRINT_FRAME_STYLE = /<style scoped>([\s\S]*?)<\/style>/
    .exec(readFileSync("src/presentation/components/board-frame/blueprint/BlueprintBoardFrame.vue", "utf8"))?.[1] ?? "";

// What lies under the board frame's labels: their own paper backing if they carry one, else the graph paper, whose
// major lines are the darkest it puts under a glyph
const blueprintLabelGround = (palette: Palette): readonly [string, string] => {
    let backing: string | undefined;
    postcss.parse(BLUEPRINT_FRAME_STYLE).walkRules((rule) => {
        if (!rule.selectors.includes(".blueprint-frame-label")) return;
        rule.walkDecls(/^background(?:-color)?$/, (declaration) => { backing = declaration.value.trim(); });
    });
    if (backing === "var(--color-background)") return ["their paper backing", palette.background];
    const gridMajor = palette["grid-major"];
    if (gridMajor === undefined) throw new Error("blueprint has no grid-major");
    return ["the major grid lines", gridMajor];
};

// Blueprint's board: the ink actually drawn on the surface actually drawn. The grid is laid on the page's paper
// colour, every cell on the paper or on a wash or hatching mixed over it (palette.ts). A hatching's lines are the
// darkest a digit or note under them meets, so each is checked at its line colour. Its labels lie outside the board,
// on the graph paper (blueprintLabelGround).
interface BlueprintBoardCase { label: string; foreground: string; background: string; minimum: number }

const BLUEPRINT_BOARD_CASES: BlueprintBoardCase[] = STYLES.blueprint.themes.flatMap(theme => STYLE_COLOR_MODES.blueprint.flatMap((mode) => {
    const palette = getPalette("blueprint", theme.id, mode);
    const prefix = `blueprint/${theme.id}/${mode}`;
    const drawn = (name: string, foreground: string, background: string, minimum = TEXT): BlueprintBoardCase => ({
        label: `${prefix}: ${name} ≥ ${minimum}`, foreground, background, minimum,
    });
    const ownToken = (token: StyleOwnToken): string => {
        const colour = palette[token];
        if (colour === undefined) throw new Error(`${prefix} has no ${token}`);
        return colour;
    };
    const page = ["the page", palette.background] as const;
    const hatching = ["the hatching", ownToken("hatch")] as const;
    // The selected cell's wash, which a step's answer cell takes too
    const selectedWash = ["the selected wash", palette["cell-selected"]] as const;
    // The same digit's wash, which a step's pattern cells take too
    const sameDigitWash = ["the same-digit wash", palette.highlight] as const;
    const errorHatching = ["the error hatching", ownToken("error-hatch")] as const;
    const on = (name: string, ink: string, surfaces: readonly (readonly [string, string])[], minimum = TEXT) =>
        surfaces.map(([surface, background]) => drawn(`${name} on ${surface}`, ink, background, minimum));
    return [
        // A clue or the player's digit (both in the ink) on a plain, peer, selected or same-digit cell, and in an error cell
        ...on("digit (foreground)", palette.foreground, [page, hatching, selectedWash, sameDigitWash, errorHatching]),
        // The same digit and the selected cell's digit
        ...on("chosen digit (primary)", palette.primary, [selectedWash, sameDigitWash]),
        // The player's notes and the selected digit's note, in a plain, peer or selected cell
        ...on("note", palette.note, [page, hatching, selectedWash]),
        ...on("highlighted note (primary)", palette.primary, [page, hatching, selectedWash]),
        // A wrong digit: an error cell's hatching lies over every other wash
        ...on("error digit (error)", palette.error, [page, errorHatching]),
        // A step's candidates, in plain, scope, pattern and answer cells
        ...on("candidate (foreground)", palette.foreground, [page, hatching, sameDigitWash, selectedWash]),
        drawn("emphasised candidate (on-primary) on primary", palette["on-primary"], palette.primary),
        // A step's struck-out notes are marks, their strike carrying them, so 3:1 applies
        ...on("struck-out note (error)", palette.error, [page, hatching, sameDigitWash, selectedWash], LARGE_OR_ICON),
        // The frame's labels, the target row's lit label and the target cell's tag beside the board
        ...on("label (foreground-secondary)", palette["foreground-secondary"], [blueprintLabelGround(palette)]),
        ...on("lit row label (primary)", palette.primary, [blueprintLabelGround(palette)]),
        drawn("cell tag (on-primary) on primary", palette["on-primary"], palette.primary),
        // The selected cell's dashed frame and the answer cell's solid one are marks, so 3:1 applies; a selected
        // error cell keeps its dashed frame over the error hatching
        ...on("selection frame (primary)", palette.primary, [selectedWash, errorHatching], LARGE_OR_ICON),
    ];
}));

const BLUEPRINT_SKIN = readFileSync("src/style/styles/blueprint/skin.css", "utf8");

// A recent game's row rules in skin.css: the one for both modes, then 藍曬圖's own, so the last one read wins
const blueprintRowRules = (mode: ColorMode): Rule[] => {
    const row = `[data-style="blueprint"] [data-skin~="recent-row"]`;
    const selectors = mode === "dark" ? [row, `:root.dark${row}`] : [row];
    const rules: Rule[] = [];
    postcss.parse(BLUEPRINT_SKIN).walkRules((rule) => {
        if (rule.selectors.some(selector => selectors.includes(selector))) rules.push(rule);
    });
    return rules.sort((first, second) => selectors.indexOf(first.selector) - selectors.indexOf(second.selector));
};

const blueprintRowDeclaration = (mode: ColorMode, property: string): string | undefined => {
    let value: string | undefined;
    for (const rule of blueprintRowRules(mode)) rule.walkDecls(property, (declaration) => { value = declaration.value.trim(); });
    return value;
};

// A recent game's row: a wash of a token over the graph paper, read back as the colour it lays
const blueprintRowGround = (palette: Palette, mode: ColorMode): string => {
    const wash = blueprintRowDeclaration(mode, "background-color");
    const match = /^color-mix\(in srgb, var\(--color-([a-z-]+)\) (\d+(?:\.\d+)?)%, transparent\)$/.exec(wash ?? "");
    if (match === null) throw new Error(`blueprint's ${mode} recent row lays no wash: ${wash}`);
    const [, token, percent] = match;
    return mixColors(palette[token as PaletteToken], Number(percent) / 100, palette.background);
};

// A token as a recent game's row sees it: the palette's (also when the row inherits it), unless the row points it at
// another token
const blueprintRowToken = (palette: Palette, mode: ColorMode, token: PaletteToken): string => {
    const pointed = /^var\(--color-([a-z-]+)\)$/.exec(blueprintRowDeclaration(mode, `--color-${token}`) ?? "");
    return pointed === null ? palette[token] : palette[pointed[1] as PaletteToken];
};

// What a recent game's row writes on its wash: its difficulty and time in the ink, its date and hints muted, "Gave
// up" in the danger colour, and its chip's 1px line and icon in the ink or the danger colour
const BLUEPRINT_ROW_CASES = STYLES.blueprint.themes.flatMap(theme => STYLE_COLOR_MODES.blueprint.flatMap((mode) => {
    const palette = getPalette("blueprint", theme.id, mode);
    const ground = blueprintRowGround(palette, mode);
    const drawn = (name: string, foreground: string, minimum = TEXT) => ({
        label: `blueprint/${theme.id}/${mode}: ${name} on the recent row ≥ ${minimum}`, foreground, background: ground, minimum,
    });
    return [
        drawn("difficulty and time (foreground)", palette.foreground),
        drawn("date and hints (foreground-muted)", blueprintRowToken(palette, mode, "foreground-muted")),
        drawn("gave up (danger)", palette.danger),
        drawn("chip (foreground)", palette.foreground, LARGE_OR_ICON),
        drawn("gave-up chip (danger)", palette.danger, LARGE_OR_ICON),
    ];
}));

describe("palette contrast", () => {
    it("should check every style, theme and the modes the style has", () => {
        const expected = STYLE_IDS.flatMap(style => THEME_IDS_BY_STYLE[style].flatMap(theme =>
            STYLE_COLOR_MODES[style].map(mode => `${style}/${theme}/${mode}`)));

        expect(new Set(CASES.map(contrastCase => contrastCase.prefix))).toEqual(new Set(expected));
    });

    it.each(HIERARCHY_CASES)("$label", ({ palette, level }) => {
        expect(contrastRatio(palette[level.upper], palette[level.lower])).toBeGreaterThanOrEqual(level.minimum);
    });

    it("should check paper's board on every theme", () => {
        expect(new Set(PAPER_BOARD_CASES.map(boardCase => boardCase.label.split(":")[0]))).toEqual(new Set(
            STYLES.paper.themes.map(theme => `paper/${theme.id}/light`)));
    });

    it.each(PAPER_BOARD_CASES)("$label", ({ foreground, background, minimum }) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it("should check pixel's board in both of its modes", () => {
        expect(new Set(PIXEL_BOARD_CASES.map(boardCase => boardCase.label.split(":")[0]))).toEqual(new Set(["pixel/classic/light", "pixel/classic/dark"]));
    });

    it("should model pixel's board in the drawn colours", () => {
        const handheldCase = (name: string) => PIXEL_BOARD_CASES.find(boardCase => boardCase.label.startsWith(`pixel/classic/light: ${name} `));

        expect(handheldCase("foreground on the board")).toMatchObject({ foreground: "#0F380F", background: "#9BBC0F" });
        expect(handheldCase("foreground on the pattern shade")).toMatchObject({ foreground: "#0F380F", background: "#8BAC0F" });
        expect(handheldCase("selected digit (background on foreground)")).toMatchObject({ foreground: "#9BBC0F", background: "#0F380F" });
        expect(handheldCase("same digit (foreground on highlight)")).toMatchObject({ foreground: "#0F380F", background: "#8BAC0F" });
        expect(handheldCase("continue-card chip (on-featured on featured)")).toMatchObject({ foreground: "#0F380F", background: "#9BBC0F" });

        const consoleCase = (name: string) => PIXEL_BOARD_CASES.find(boardCase => boardCase.label.startsWith(`pixel/classic/dark: ${name} `));

        expect(consoleCase("accent on the board")).toMatchObject({ foreground: "#3CBCFC", background: "#000000" });
        expect(consoleCase("foreground on the board")).toMatchObject({ foreground: "#FCFCFC", background: "#000000" });
        expect(consoleCase("foreground on the pattern shade")).toMatchObject({ foreground: "#FCFCFC", background: "#1E1E3C" });
        expect(consoleCase("same digit (foreground on highlight)")).toMatchObject({ foreground: "#FCFCFC", background: "#0058F8" });
        expect(consoleCase("selection cursor (primary) on the same-digit fill")).toMatchObject({ foreground: "#F8B800", background: "#0058F8" });
        expect(handheldCase("error frame (foreground) on the hatch's shaded pixels")).toMatchObject({ foreground: "#0F380F", background: "#8BAC0F" });
        expect(handheldCase("completion flash's digits (background) on its fill (foreground)")).toMatchObject({ foreground: "#9BBC0F", background: "#0F380F" });
        expect(consoleCase("completion flash's digits (foreground) on its fill (highlight)")).toMatchObject({ foreground: "#FCFCFC", background: "#0058F8" });
    });

    it("should check cyber's board in its one mode", () => {
        expect(new Set(CYBER_BOARD_CASES.map(boardCase => boardCase.label.split(":")[0]))).toEqual(new Set(["cyber/neon/dark"]));
    });

    it("should check ink's board in its one mode", () => {
        expect(new Set(INK_BOARD_CASES.map(boardCase => boardCase.label.split(":")[0]))).toEqual(new Set(["ink/vermilion/light"]));
    });

    it("should check chalkboard's board in both of its modes", () => {
        expect(new Set(CHALKBOARD_BOARD_CASES.map(boardCase => boardCase.label.split(":")[0]))).toEqual(new Set(["chalkboard/classic/light", "chalkboard/classic/dark"]));
    });

    it("should check blueprint's board on every paper in both of its modes", () => {
        expect(new Set(BLUEPRINT_BOARD_CASES.map(boardCase => boardCase.label.split(":")[0]))).toEqual(new Set(
            STYLES.blueprint.themes.flatMap(theme => STYLE_COLOR_MODES.blueprint.map(mode => `blueprint/${theme.id}/${mode}`))));
    });

    it.each(BLUEPRINT_BOARD_CASES)("$label", ({ foreground, background, minimum }) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it.each(BLUEPRINT_ROW_CASES)("$label", ({ foreground, background, minimum }) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it.each(CHALKBOARD_BOARD_CASES)("$label", ({ foreground, background, minimum }) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it.each(INK_BOARD_CASES)("$label", ({ foreground, background, minimum }) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it.each(CYBER_BOARD_CASES)("$label", ({ foreground, background, minimum }) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it.each(PIXEL_BOARD_CASES)("$label", ({ foreground, background, minimum }) => {
        expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(minimum);
    });

    it.each(CASES)("$label", ({ palette, contrastPair }) => {
        const ratio = contrastRatio(contrastPair.foreground(palette), contrastPair.background(palette));

        expect(ratio).toBeGreaterThanOrEqual(contrastPair.minimum);
    });
});
