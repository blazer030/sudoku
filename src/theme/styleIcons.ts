// Each style's app icon. The launcher and PWA generators (scripts/) and the app's own pictures of a
// style all draw from here, so the home screen shows what the app shows. Relative imports only.
//
// The artwork is a 108-unit square with no rounding; callers mask it. Digits are paths, not text:
// the fonts the app uses are not there when the generators rasterise the icon.
import { contrastRatio, mixColors } from "./contrast";
import type { Palette } from "./paletteBuilder";
import type { StyleId } from "./themeIds";

const ICON_SIZE = 108;
// An adaptive icon's 108dp layers show their middle 72dp, so the foreground fits the artwork there
const ADAPTIVE_VIEWPORT = 72;
// Android tints the monochrome layer itself and reads only its alpha
const MONOCHROME_COLOR = "#FFFFFF";

const svgOf = (...content: string[]): string => [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ICON_SIZE} ${ICON_SIZE}">`,
    ...content,
    "</svg>",
    "",
].join("\n");

// The square, or with a bleed a larger one past each edge
const fillSquare = (color: string, bleed = 0): string => bleed === 0
    ? `<rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${color}"/>`
    : `<rect x="${-bleed}" y="${-bleed}" width="${ICON_SIZE + 2 * bleed}" height="${ICON_SIZE + 2 * bleed}" fill="${color}"/>`;

const ADAPTIVE_INSET = (ICON_SIZE - ADAPTIVE_VIEWPORT) / 2;
// How far past the artwork's edges the rest of the 108dp layer reaches, in artwork units
const ADAPTIVE_BLEED = ADAPTIVE_INSET * ICON_SIZE / ADAPTIVE_VIEWPORT;

const inAdaptiveViewport = (...content: string[]): string[] =>
    [`<g transform="translate(${ADAPTIVE_INSET} ${ADAPTIVE_INSET}) scale(${ADAPTIVE_VIEWPORT / ICON_SIZE})">`, ...content, "</g>"];

// Minimal: today's icon, a checkerboard of solid and faint tiles in on-primary on the primary
const MINIMAL_TILE_ORIGINS = [21.6, 45, 68.4];

const minimalTiles = (tileColor: string): string[] =>
    MINIMAL_TILE_ORIGINS.flatMap((y, row) => MINIMAL_TILE_ORIGINS.map((x, column) => {
        const solid = (row + column) % 2 === 1;
        return `<rect x="${x}" y="${y}" width="18" height="18" rx="5.4" fill="${tileColor}"${solid ? "" : ` fill-opacity="0.25"`}/>`;
    }));

// Tactile: a recessed tray of raised tiles; the centre tile is the theme colour with a 5, and the
// bottom-left tile is pressed down onto its ledge
interface TactileColors {
    well: string;
    tile: string;
    ledge: string;
    key: string;
    keyLedge: string;
    digit: string;
}

const TACTILE_TILE_ORIGINS = [21, 44, 67];
const TACTILE_LEDGE = 3;
const CENTRE = 1;
const PRESSED = { row: 2, column: 0 };
// A bold geometric 5 on the centre tile: top bar and stem, then the bowl starting inside the stem
const TACTILE_FIVE = "M56.9 50.9H51.6L51.3 55M51.6 54.3C52.2 53.6 53 53.3 53.9 53.3C55.4 53.3 56.6 54.4 56.6 55.9C56.6 57.4 55.4 58.4 53.9 58.4C52.7 58.4 51.7 58 50.9 57.2";

const tactileTile = (x: number, y: number, face: string, ledge?: string): string[] => [
    ...(ledge ? [`<rect x="${x}" y="${y + TACTILE_LEDGE}" width="20" height="20" rx="5" fill="${ledge}"/>`] : []),
    `<rect x="${x}" y="${y}" width="20" height="20" rx="5" fill="${face}"/>`,
];

const tactileTiles = (colors: TactileColors): string[] =>
    TACTILE_TILE_ORIGINS.flatMap((y, row) => TACTILE_TILE_ORIGINS.flatMap((x, column) => {
        if (row === CENTRE && column === CENTRE) return tactileTile(x, y, colors.key, colors.keyLedge);
        if (row === PRESSED.row && column === PRESSED.column) return tactileTile(x, y + TACTILE_LEDGE, colors.tile);
        return tactileTile(x, y, colors.tile, colors.ledge);
    }));

const tactileFive = (color: string): string =>
    `<path d="${TACTILE_FIVE}" fill="none" stroke="${color}" stroke-width="2.2"/>`;

const tactileArtwork = (colors: TactileColors): string[] => [
    `<rect x="15" y="15" width="78" height="78" rx="12" fill="${colors.well}"/>`,
    ...tactileTiles(colors),
    tactileFive(colors.digit),
];

// A dark palette's background is closer to black than to white. The palette carries no mode, and
// callers pass one from getPalette(style, theme, mode).
const isDark = (palette: Palette): boolean =>
    contrastRatio(palette.background, "#000000") < contrastRatio(palette.background, "#FFFFFF");

// The well is the tray darkened by the shadow so it sinks in both modes: dark needs far more of
// the shadow to show (the canvas: #DCD6CB on #EBE7E0 in light, #111214 on #1A1C1F in dark). Tiles
// are lighter than the well: the card in light, the raised cell-clue in dark. Ledges are the skin's
// own edges (tactile/skin.css): 28% shadow in the background for every tile (--tactile-edge), 60%
// shadow in the primary for the centre tile (--tactile-edge-on-primary).
const WELL_SHADOW = { light: 0.09, dark: 0.35 };

const tactileColors = (palette: Palette): TactileColors => {
    const dark = isDark(palette);
    return {
        well: mixColors(palette.shadow, dark ? WELL_SHADOW.dark : WELL_SHADOW.light, palette.background),
        tile: dark ? palette["cell-clue"] : palette.card,
        ledge: mixColors(palette.shadow, 0.28, palette.background),
        key: palette.primary,
        keyLedge: mixColors(palette.shadow, 0.6, palette.primary),
        digit: palette["on-primary"],
    };
};

// Paper: ruled loose-leaf with a margin and three holes, a hand-drawn grid in the ink, a printed 3,
// a handwritten 7 circled in red and a handwritten 4
interface PaperColors {
    rule: string;
    margin: string;
    hole: string;
    ink: string;
    circle: string;
}

const PAPER_GRID = "M36 29 Q63 27.5 90 29.5 Q91.5 56 89.5 83.5 Q63 85 36.5 83 Q35 56 36 29Z";
const PAPER_GRID_LINES = "M54.5 30 Q53.5 56 54.5 82.5 M72 29.5 Q73 56 71.5 83 M37 47.5 Q63 46.5 89.5 48 M36.5 65.5 Q63 66.5 90 65";
// A printed 3 with ball terminals, standing on the top-left cell's baseline
const PAPER_THREE = "M42.9 37.4C43.3 36.1 44.3 35.6 45.5 35.6C47 35.6 48 36.5 48 37.7C48 38.9 46.9 39.6 44.8 39.6C47.5 39.6 48.6 40.6 48.6 41.8C48.6 43.1 47.3 43.4 45.5 43.4C44 43.4 42.9 43 42.3 42";
const PAPER_SEVEN = "M60.2 54.3Q63 53.7 66 53.7Q63.5 57.2 62.4 61.3";
const PAPER_FOUR = "M79.6 70.6Q78.3 73.6 77 76Q80.4 75.9 84.2 75.4M82.4 71.4Q82.2 75.2 82.6 79.1";
const PAPER_CIRCLE = "M63.5 50 Q55 50 55.5 57.5 Q56.5 64.5 64 64 Q71 63 70.5 56.5 Q69.5 50.5 62 51.5";

// Rules every 12 units from 22 to 94, leaving the sheet's head and foot clear
const PAPER_RULE_STEP = 12;
const PAPER_FIRST_RULE = 22;
const PAPER_LAST_RULE = 94;

// The sheet runs `bleed` units past each edge of the artwork, rules continuing beyond it, so a
// foreground layer has no seam where a launcher shows more than the 72dp viewport
const paperRules = (bleed: number): number[] => {
    const rules: number[] = [];
    for (let rule = PAPER_FIRST_RULE - PAPER_RULE_STEP * Math.floor((PAPER_FIRST_RULE + bleed) / PAPER_RULE_STEP);
        rule <= ICON_SIZE + bleed; rule += PAPER_RULE_STEP) {
        if (rule < 0 || rule > ICON_SIZE || (rule >= PAPER_FIRST_RULE && rule <= PAPER_LAST_RULE)) rules.push(rule);
    }
    return rules;
};

const paperSheet = (colors: PaperColors, bleed = 0): string[] => [
    `<g stroke="${colors.rule}" stroke-width="1.2"><path d="${paperRules(bleed).map(rule => `M${-bleed} ${rule}H${ICON_SIZE + bleed}`).join("")}"/></g>`,
    `<path d="M24 ${-bleed}V${ICON_SIZE + bleed}" stroke="${colors.margin}" stroke-width="1.6"/>`,
    `<g fill="${colors.hole}"><circle cx="11" cy="28" r="4"/><circle cx="11" cy="54" r="4"/><circle cx="11" cy="80" r="4"/></g>`,
];

const paperWriting = (colors: Pick<PaperColors, "ink" | "circle">): string[] => [
    `<g fill="none" stroke="${colors.ink}" stroke-linecap="round"><path d="${PAPER_GRID}" stroke-width="2.4"/><path d="${PAPER_GRID_LINES}" stroke-width="1.4"/></g>`,
    `<path d="${PAPER_THREE}" fill="none" stroke="${colors.ink}" stroke-width="1.3"/>`,
    `<g fill="${colors.ink}"><circle cx="43" cy="37.6" r="0.9"/><circle cx="42.4" cy="42.1" r="0.9"/></g>`,
    `<g fill="none" stroke="${colors.ink}" stroke-linecap="round" stroke-linejoin="round"><path d="${PAPER_SEVEN}" stroke-width="1.8"/><path d="${PAPER_FOUR}" stroke-width="1.6"/></g>`,
    `<path d="${PAPER_CIRCLE}" fill="none" stroke="${colors.circle}" stroke-width="1.8" stroke-linecap="round"/>`,
];

const paperColors = (palette: Palette): PaperColors => ({
    rule: palette.rule,
    margin: palette["margin-line"],
    // The holes take the paper's border tone
    hole: palette.border,
    ink: palette.primary,
    circle: palette.danger,
});

// 8-bit: the board as a game screen on a 54×54 pixel grid, 2 units a pixel. Three hearts over a 3×3
// box holding 1, 5 and 9, with a cursor in the top-right cell. 掌機 (light) draws it in the four
// greens; 紅白機 (dark) in the console colours, with a star field around it. Ported from the
// style-research generator (pixelicon.py).
const PIXEL_UNIT = 2;
const PIXEL_HEART = [
    ".XX.XX.",
    "XXXXXXX",
    "XXXXXXX",
    ".XXXXX.",
    "..XXX..",
    "...X...",
];
const PIXEL_DIGITS = {
    1: ["..X..", ".XX..", "..X..", "..X..", "..X..", "..X..", ".XXX."],
    5: ["XXXXX", "X....", "XXXX.", "....X", "....X", "X...X", ".XXX."],
    9: [".XXX.", "X...X", "X...X", ".XXXX", "....X", "...X.", ".XX.."],
} as const;
const PIXEL_HEART_LEFTS = [14, 23, 32];
const PIXEL_HEART_TOP = 6;
// The box: three 10-pixel cells and four 1-pixel lines, 34 pixels square
const PIXEL_CELL = 10;
const PIXEL_BOX_LEFT = 10;
const PIXEL_BOX_TOP = 14;
const PIXEL_BOX_SIZE = 3 * PIXEL_CELL + 4;
// The console's red: the hearts are art, not text, so they keep it on black
const PIXEL_HEART_RED = "#F83800";

type StarTone = "bright" | "dim" | "blue" | "gold";
// A sparse star field in the margins around the hearts and the box, clear of the point at 5% across
// and halfway down where the icon assets sample the background
const PIXEL_STARS: readonly (readonly [number, number, StarTone])[] = [
    [3, 4, "bright"], [8, 2, "dim"], [19, 2, "dim"], [29, 1, "bright"], [41, 4, "dim"], [47, 3, "blue"],
    [51, 9, "bright"], [2, 13, "gold"], [46, 17, "dim"], [6, 20, "dim"], [52, 24, "blue"], [4, 30, "bright"],
    [48, 34, "bright"], [7, 40, "blue"], [51, 44, "dim"], [2, 49, "dim"], [12, 51, "bright"], [24, 50, "dim"],
    [33, 52, "gold"], [46, 50, "bright"],
];
// Two twinkling stars: a bright centre with dim arms
const PIXEL_TWINKLES: readonly (readonly [number, number])[] = [[48, 9], [5, 45]];
const PIXEL_TWINKLE_ARMS = [[-1, 0], [1, 0], [0, -1], [0, 1]] as const;

interface PixelColors {
    line: string;
    given: string;
    centreDigit: string;
    heart: string;
    /** Left out, the parts are not drawn: the monochrome layer has no fills, cursor or stars. */
    centreCell?: string;
    cursor?: string;
    stars?: Record<StarTone, string>;
}

interface PixelDot { x: number; y: number; color: string }

const pixelCellOrigin = (index: number): number => 1 + index * (PIXEL_CELL + 1);

/** The pixels in paint order; a later pixel at the same spot covers an earlier one. */
const pixelDots = (colors: PixelColors): PixelDot[] => {
    const dots: PixelDot[] = [];
    const put = (x: number, y: number, color: string) => { dots.push({ x, y, color }); };
    const stamp = (rows: readonly string[], left: number, top: number, color: string) => {
        rows.forEach((row, rowIndex) => {
            for (let columnIndex = 0; columnIndex < row.length; columnIndex++) {
                if (row[columnIndex] === "X") put(left + columnIndex, top + rowIndex, color);
            }
        });
    };
    const { stars, centreCell, cursor } = colors;
    if (stars) {
        for (const [x, y, tone] of PIXEL_STARS) put(x, y, stars[tone]);
        for (const [x, y] of PIXEL_TWINKLES) {
            for (const [across, down] of PIXEL_TWINKLE_ARMS) put(x + across, y + down, stars.dim);
            put(x, y, stars.bright);
        }
    }
    for (const left of PIXEL_HEART_LEFTS) stamp(PIXEL_HEART, left, PIXEL_HEART_TOP, colors.heart);
    // The centre cell's fill sits behind the lines
    if (centreCell) {
        for (let down = 0; down < PIXEL_CELL; down++) {
            for (let across = 0; across < PIXEL_CELL; across++) {
                put(PIXEL_BOX_LEFT + pixelCellOrigin(1) + across, PIXEL_BOX_TOP + pixelCellOrigin(1) + down, centreCell);
            }
        }
    }
    for (let line = 0; line < 4; line++) {
        const offset = line * (PIXEL_CELL + 1);
        for (let along = 0; along < PIXEL_BOX_SIZE; along++) {
            put(PIXEL_BOX_LEFT + offset, PIXEL_BOX_TOP + along, colors.line);
            put(PIXEL_BOX_LEFT + along, PIXEL_BOX_TOP + offset, colors.line);
        }
    }
    // A 5×7 digit sits 3 in from its cell's left and 2 down from its top
    const digits = [[1, 0, 0, colors.given], [5, 1, 1, colors.centreDigit], [9, 2, 2, colors.given]] as const;
    for (const [digit, column, row, color] of digits) {
        stamp(PIXEL_DIGITS[digit], PIXEL_BOX_LEFT + pixelCellOrigin(column) + 3, PIXEL_BOX_TOP + pixelCellOrigin(row) + 2, color);
    }
    // The cursor: corner brackets inside the top-right cell
    if (cursor) {
        const left = PIXEL_BOX_LEFT + pixelCellOrigin(2) + 1;
        const top = PIXEL_BOX_TOP + pixelCellOrigin(0) + 1;
        const right = left + PIXEL_CELL - 3;
        const bottom = top + PIXEL_CELL - 3;
        for (let arm = 0; arm < 3; arm++) {
            put(left + arm, top, cursor); put(left, top + arm, cursor);
            put(right - arm, top, cursor); put(right, top + arm, cursor);
            put(left + arm, bottom, cursor); put(left, bottom - arm, cursor);
            put(right - arm, bottom, cursor); put(right, bottom - arm, cursor);
        }
    }
    return dots;
};

/** One rect per horizontal run of a colour, row by row, the topmost pixel winning at each spot. */
const pixelRects = (dots: readonly PixelDot[]): string[] => {
    const rows = new Map<number, Map<number, string>>();
    for (const { x, y, color } of dots) {
        const row = rows.get(y) ?? new Map<number, string>();
        row.set(x, color);
        rows.set(y, row);
    }
    const rect = (start: number, end: number, y: number, color: string): string =>
        `<rect x="${start * PIXEL_UNIT}" y="${y * PIXEL_UNIT}" width="${(end - start + 1) * PIXEL_UNIT}" height="${PIXEL_UNIT}" fill="${color}"/>`;
    return [...rows.keys()].sort((first, second) => first - second).flatMap((y) => {
        const row = rows.get(y) ?? new Map<number, string>();
        const runs: { start: number; end: number; color: string }[] = [];
        for (const x of [...row.keys()].sort((first, second) => first - second)) {
            const color = row.get(x) ?? "";
            const last = runs[runs.length - 1] as { start: number; end: number; color: string } | undefined;
            if (last?.end === x - 1 && last.color === color) last.end = x;
            else runs.push({ start: x, end: x, color });
        }
        return runs.map(run => rect(run.start, run.end, y, run.color));
    });
};

// Square pixels stay square when a launcher scales them
const pixelArtwork = (colors: PixelColors): string[] =>
    [`<g shape-rendering="crispEdges">`, ...pixelRects(pixelDots(colors)), "</g>"];

// 掌機: lines and digits in the darkest green, the centre cell in the light green, hearts and cursor
// in the dark green (the canvas's shadow shade). 紅白機: white lines and digits, a gold 5 on a navy
// cell, red hearts, a blue cursor, and stars in white, grey, blue and gold.
const pixelColors = (palette: Palette): PixelColors => isDark(palette)
    ? {
        line: palette.foreground,
        given: palette.foreground,
        centreCell: palette.card,
        centreDigit: palette.primary,
        heart: PIXEL_HEART_RED,
        cursor: palette.accent,
        stars: { bright: palette.foreground, dim: palette.border, blue: palette.accent, gold: palette.primary },
    }
    : {
        line: palette.foreground,
        given: palette.foreground,
        centreCell: palette.highlight,
        centreDigit: palette.foreground,
        heart: palette.shadow,
        cursor: palette.shadow,
    };

const artworkOf = (style: StyleId, palette: Palette, bleed = 0): string[] => {
    switch (style) {
        case "minimal": return minimalTiles(palette["on-primary"]);
        case "tactile": return tactileArtwork(tactileColors(palette));
        case "paper": {
            const colors = paperColors(palette);
            return [...paperSheet(colors, bleed), ...paperWriting(colors)];
        }
        case "pixel": return pixelArtwork(pixelColors(palette));
    }
};

/** The colour behind a style's artwork: the adaptive icon's background layer. */
export const styleIconBackground = (style: StyleId, palette: Palette): string =>
    style === "minimal" ? palette.primary : palette.background;

/** A style's icon as a full 108-unit square SVG in the palette's colours, unrounded. */
export const styleIconSvg = (style: StyleId, palette: Palette): string =>
    svgOf(fillSquare(styleIconBackground(style, palette)), ...artworkOf(style, palette));

/**
 * The adaptive icon's foreground layer: minimal's tiles alone; the other styles' whole artwork,
 * their background and paper's sheet filling the layer to its edges so no seam shows at the 72dp viewport.
 */
export const styleIconForeground = (style: StyleId, palette: Palette): string =>
    svgOf(...inAdaptiveViewport(...(style === "minimal"
        ? minimalTiles(palette["on-primary"])
        : [fillSquare(styleIconBackground(style, palette), ADAPTIVE_BLEED), ...artworkOf(style, palette, ADAPTIVE_BLEED)])));

const monochromeArtwork = (style: StyleId): string[] => {
    const color = MONOCHROME_COLOR;
    switch (style) {
        case "minimal": return minimalTiles(color);
        // The tiles' faces; the centre tile faint so its 5 stands out
        case "tactile": return TACTILE_TILE_ORIGINS.flatMap((y, row) => TACTILE_TILE_ORIGINS.map((x, column) => {
            const top = row === PRESSED.row && column === PRESSED.column ? y + TACTILE_LEDGE : y;
            const faint = row === CENTRE && column === CENTRE ? ` fill-opacity="0.35"` : "";
            return `<rect x="${x}" y="${top}" width="20" height="20" rx="5" fill="${color}"${faint}/>`;
        })).concat(tactileFive(color));
        // The writing without the sheet: grid, digits and circle
        case "paper": return paperWriting({ ink: color, circle: color });
        // The hearts, the box and its digits
        case "pixel": return pixelArtwork({ line: color, given: color, centreDigit: color, heart: color });
    }
};

/** The adaptive icon's monochrome layer: a one-colour silhouette for themed icons. */
export const styleIconMonochrome = (style: StyleId): string =>
    svgOf(...inAdaptiveViewport(...monochromeArtwork(style)));
