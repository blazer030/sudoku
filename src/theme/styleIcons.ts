// Each style's app icon. The launcher and PWA generators (scripts/) and the app's own pictures of a
// style all draw from here, so the home screen shows what the app shows. Relative imports only.
//
// The artwork is a 108-unit square with no rounding; callers mask it. Digits are paths, not text:
// the fonts the app uses are not there when the generators rasterise the icon.
import { contrastRatio, mixColors } from "./contrast";
import { INK_SEAL_GLYPH_PATH } from "./inkSealGlyph";
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

// Cyberpunk: a cut-corner board outline in a cyan-to-magenta glow over a perspective floor, a cyan grid,
// a magenta cursor bar with yellow corner brackets, and two cyan squares. Ported from the style-research
// generator (icons.py). The gradient and glow are referenced by id, so an icon given a suffix keeps its
// ids apart from every other copy on the page (the 外觀 page draws several icons).
const CYBER_FLOOR = [
    `M0 78 L108 78`,
    `M0 86 L108 86 M0 96 L108 96 M20 108 L42 78 M54 108 L54 78 M88 108 L66 78`,
];
const CYBER_OUTLINE = "M32 22 H86 V70 L76 80 H22 V32 Z";
const CYBER_GRID = "M40 30 V72 M68 30 V72 M30 44 H78 M30 58 H78";
const CYBER_BRACKETS = "M44 47 h-4 v4 M64 55 h4 v-4";
const CYBER_SQUARES = [[31, 31], [71, 61]] as const;

const cyberIds = (idSuffix: string) => {
    const tail = idSuffix === "" ? "" : `-${idSuffix}`;
    return { edge: `cyber-edge${tail}`, glow: `cyber-glow${tail}` };
};

const cyberArtwork = (palette: Palette, idSuffix: string): string[] => {
    const ids = cyberIds(idSuffix);
    const glow = `filter="url(#${ids.glow})"`;
    return [
        `<defs><linearGradient id="${ids.edge}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${palette.accent}"/><stop offset="1" stop-color="${palette.primary}"/></linearGradient>`,
        `<filter id="${ids.glow}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`,
        `<path d="${CYBER_FLOOR[0]}" stroke="${palette.primary}" stroke-opacity="0.25"/>`,
        `<path d="${CYBER_FLOOR[1]}" stroke="${palette.primary}" stroke-opacity="0.18"/>`,
        `<path d="${CYBER_OUTLINE}" fill="none" stroke="url(#${ids.edge})" stroke-width="2.4" ${glow}/>`,
        `<path d="${CYBER_GRID}" stroke="${palette.accent}" stroke-opacity="0.45" stroke-width="1.2"/>`,
        `<rect x="44" y="47" width="20" height="8" fill="${palette.primary}" ${glow}/>`,
        `<path d="${CYBER_BRACKETS}" fill="none" stroke="${palette.signal}" stroke-width="2"/>`,
        ...CYBER_SQUARES.map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="6" fill="${palette.accent}" ${glow}/>`),
    ];
};

// Ink and washi: one brushed 圓相 (an enso) round a faint nine-cell grid on washi, a pale ink wash at the foot, and a
// vermilion seal stamped with 獨 at the bottom right. Ported from the style-research canvas (Ink.dc.html). The
// brush roughening is a filter referenced by id, so an icon given a suffix keeps it apart from other copies.
const INK_WASH_CURVE = "Q20 72 36 80 T70 76 T108 82";
const INK_ENSO = "M63 22 C40 18 22 34 22 54 C22 74 38 88 57 87 C75 86 88 72 87 53 C86 41 79 31 70 27";
const INK_GRID = "M44 38 V70 M64 38 V70 M38 46 H72 M38 62 H72";
// The seal: a 22-unit square turned 5 degrees anticlockwise about its centre
const INK_SEAL = { x: 69, y: 68, size: 22, radius: 3 };
const INK_SEAL_TURN = "rotate(-5 80 79)";
// 獨 at 15 units, centred on the seal, its baseline at 84 as the canvas sets the character: the em box's top
// sits 0.88 em above the baseline
const INK_GLYPH_SCALE = 15 / 1000;
const INK_GLYPH_ORIGIN = { x: 80 - 7.5, y: 84 - 0.88 * 15 };
const INK_GLYPH_PLACEMENT = `${INK_SEAL_TURN} translate(${INK_GLYPH_ORIGIN.x} ${INK_GLYPH_ORIGIN.y}) scale(${INK_GLYPH_SCALE})`;

const inkFilterId = (idSuffix: string): string => idSuffix === "" ? "ink-rough" : `ink-rough-${idSuffix}`;

const inkRoughFilter = (id: string): string =>
    `<defs><filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="11"/><feDisplacementMap in="SourceGraphic" scale="3"/></filter></defs>`;

// The wash runs `bleed` units past the left, right and bottom edges, so a foreground layer has no seam
const inkWash = (color: string, bleed: number): string =>
    `<path d="M${-bleed} 84 H0 ${INK_WASH_CURVE} H${ICON_SIZE + bleed} V${ICON_SIZE + bleed} H${-bleed} Z" fill="${color}" opacity=".07"/>`;

const inkBrush = (color: string, filterId: string): string[] => [
    `<g filter="url(#${filterId})" fill="none" stroke="${color}" stroke-linecap="round">`,
    `<path d="${INK_ENSO}" stroke-width="7"/>`,
    `<path d="${INK_GRID}" stroke-width="1.6" opacity=".55"/>`,
    "</g>",
];

const inkArtwork = (palette: Palette, bleed: number, idSuffix: string): string[] => {
    const filterId = inkFilterId(idSuffix);
    const { x, y, size, radius } = INK_SEAL;
    return [
        inkRoughFilter(filterId),
        inkWash(palette.foreground, bleed),
        ...inkBrush(palette.foreground, filterId),
        `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${radius}" transform="${INK_SEAL_TURN}" fill="${palette.primary}"/>`,
        `<path d="${INK_SEAL_GLYPH_PATH}" transform="${INK_GLYPH_PLACEMENT}" fill="${palette["on-primary"]}"/>`,
    ];
};

// The seal's rounded square in the glyph's em units, so one even-odd path holds both and 獨 cuts through
const inkSealOutlineInGlyphUnits = (): string => {
    const toGlyph = (length: number): number => Math.round(length / INK_GLYPH_SCALE * 100) / 100;
    const radius = toGlyph(INK_SEAL.radius);
    const start = toGlyph(INK_SEAL.x + INK_SEAL.radius - INK_GLYPH_ORIGIN.x);
    const top = toGlyph(INK_SEAL.y - INK_GLYPH_ORIGIN.y);
    const straight = toGlyph(INK_SEAL.size - 2 * INK_SEAL.radius);
    const corner = `a${radius} ${radius} 0 0 1`;
    return `M${start} ${top}h${straight}${corner} ${radius} ${radius}v${straight}${corner} ${-radius} ${radius}`
        + `h${-straight}${corner} ${-radius} ${-radius}v${-straight}${corner} ${radius} ${-radius}Z`;
};

const inkMonochrome = (color: string): string[] => [
    inkRoughFilter(inkFilterId("")),
    ...inkBrush(color, inkFilterId("")),
    `<path d="${inkSealOutlineInGlyphUnits()}${INK_SEAL_GLYPH_PATH}" transform="${INK_GLYPH_PLACEMENT}" fill="${color}" fill-rule="evenodd"/>`,
];

// Chalkboard: a board in its frame (the wooden tray's wood round the 黑板, grey round the 白板), a hand-drawn grid in
// the chalk or marker, a ring round the top-left cell, a 7 at the bottom right, and two stubs along the board's foot.
// Ported from the style-research canvas (Chalk.dc.html). The canvas roughens the chalk with a filter; the icon
// draws the strokes plain, so no filter runs on the launcher or the 外觀 page.
const CHALKBOARD_BOARD = { inset: 8, size: 92, radius: 4 };
const CHALKBOARD_GRID = "M44 24 Q43 54 45 84 M65 23 Q66 54 64 85 M24 44 Q54 42 84 45 M23 65 Q54 66 85 63";
const CHALKBOARD_RING = "M45 38 Q34 36 33 46 Q34 57 46 56 Q56 54 55 45 Q53 37 44 39";
// Caveat Brush's 7 (ofl/caveatbrush/CaveatBrush-Regular.ttf, google/fonts at the commit scripts/generate-fonts.ts
// pins) at 22 units, centred on x 74 with its baseline at y 83 as the canvas sets it, outlined once with harfbuzzjs
const CHALKBOARD_SEVEN = "M71.1 80Q71.1 79.6 71.2 79Q71.4 78.3 71.5 78.1Q71.6 77.9 71.6 77.7Q71.6 77.6 71.8 77.2Q72 76.8 72 76.8Q72.1 76.7 72.1 76.5Q72.2 76.4 72.3 75.9Q72.4 75.9 72.6 75.5Q72.6 75.2 72.7 75.1Q72.7 75.1 72.8 75Q72.8 75 72.9 74.6Q73.1 74.2 73.1 74.2Q73.1 74.2 73.1 74.1Q73.3 73.7 73.4 73.6Q73.5 73.1 73.6 72.8Q73.8 72.4 73.8 72.2Q73.9 71.9 73.9 71.8Q73.8 71.7 73 71.8Q72.2 71.9 71.3 71.7Q71 71.7 70.8 71.5Q70.6 71.2 70.5 71.1Q70.1 71 69.8 70.3Q69.6 69.9 69.6 69.5Q69.6 69.2 70 68.8Q70.2 68.8 70.3 68.9Q70.7 68.9 71.5 69Q72.1 69 72.3 68.9Q72.5 68.9 72.6 68.9L72.9 68.9Q73.1 68.8 73.4 68.7Q73.6 68.7 73.7 68.6Q73.9 68.5 74 68.5Q74.2 68.5 75 68.6Q75.2 68.5 75.3 68.5Q75.5 68.5 76.5 68.6Q76.6 68.6 76.8 68.8Q77 69 77.1 69.3Q77.2 69.6 77.1 69.7Q77.1 69.8 77.1 69.8Q77.2 69.9 77.5 70Q77.8 70.4 78.2 70.6Q78.2 70.6 78.2 70.7Q78.3 70.8 78.3 70.8Q78.4 70.9 78.4 71Q78.7 71.2 78.1 71.3Q77.7 71.4 76.8 72.8Q76 74.3 75.1 76.2Q74.6 77.1 74 79Q73.5 80.9 73.6 82.4Q73.5 82.7 73.4 82.9Q73.2 83.1 73.1 83Q72.9 82.8 72.5 82.9Q72.2 83 72 83Q71.8 83 71.4 82.5Q70.9 82 71.1 80Z";
const CHALKBOARD_STUBS = { chalk: { x: 16, width: 22 }, coloured: { x: 42, width: 14 }, y: 92, height: 5, radius: 2 };

interface ChalkboardColors {
    board: string;
    writing: string;
    ring: string;
    stub: string;
}

// The ring is the canvas's hot colour: the yellow chalk on the 黑板, the blue marker on the 白板. The coloured stub
// is the primary in both, the yellow chalk or the orange marker.
const chalkboardColors = (palette: Palette): ChalkboardColors => ({
    board: palette.background,
    writing: palette.foreground,
    ring: isDark(palette) ? palette.primary : palette.accent,
    stub: palette.primary,
});

const chalkboardStub = (stub: { x: number; width: number }, color: string): string => {
    const { y, height, radius } = CHALKBOARD_STUBS;
    return `<rect x="${stub.x}" y="${y}" width="${stub.width}" height="${height}" rx="${radius}" fill="${color}"/>`;
};

const chalkboardWriting = (colors: Omit<ChalkboardColors, "board">): string[] => [
    `<path d="${CHALKBOARD_GRID}" fill="none" stroke="${colors.writing}" stroke-width="3.4" stroke-linecap="round"/>`,
    `<path d="${CHALKBOARD_RING}" fill="none" stroke="${colors.ring}" stroke-width="3" stroke-linecap="round"/>`,
    `<path d="${CHALKBOARD_SEVEN}" fill="${colors.writing}"/>`,
    chalkboardStub(CHALKBOARD_STUBS.chalk, colors.writing),
    chalkboardStub(CHALKBOARD_STUBS.coloured, colors.stub),
];

const chalkboardArtwork = (colors: ChalkboardColors): string[] => {
    const { inset, size, radius } = CHALKBOARD_BOARD;
    return [
        `<rect x="${inset}" y="${inset}" width="${size}" height="${size}" rx="${radius}" fill="${colors.board}"/>`,
        ...chalkboardWriting(colors),
    ];
};

const artworkOf = (style: StyleId, palette: Palette, bleed = 0, idSuffix = ""): string[] => {
    switch (style) {
        case "minimal": return minimalTiles(palette["on-primary"]);
        case "tactile": return tactileArtwork(tactileColors(palette));
        case "paper": {
            const colors = paperColors(palette);
            return [...paperSheet(colors, bleed), ...paperWriting(colors)];
        }
        case "pixel": return pixelArtwork(pixelColors(palette));
        case "cyber": return cyberArtwork(palette, idSuffix);
        case "ink": return inkArtwork(palette, bleed, idSuffix);
        case "chalkboard": return chalkboardArtwork(chalkboardColors(palette));
    }
};

/** The colour behind a style's artwork: the adaptive icon's background layer. */
export const styleIconBackground = (style: StyleId, palette: Palette): string => {
    if (style === "minimal") return palette.primary;
    // The frame round the board, so it carries on past the foreground's viewport
    if (style === "chalkboard" && palette["icon-frame"]) return palette["icon-frame"];
    return palette.background;
};

/**
 * A style's icon as a full 108-unit square SVG in the palette's colours, unrounded. An icon that uses
 * ids (cyberpunk's gradient and glow, ink's brush filter) takes `idSuffix` into them, so copies on one page do not share.
 */
export const styleIconSvg = (style: StyleId, palette: Palette, idSuffix = ""): string =>
    svgOf(fillSquare(styleIconBackground(style, palette)), ...artworkOf(style, palette, 0, idSuffix));

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
        // The board outline, grid, cursor bar and squares
        case "cyber": return [
            `<path d="${CYBER_OUTLINE}" fill="none" stroke="${color}" stroke-width="2.4"/>`,
            `<path d="${CYBER_GRID}" stroke="${color}" stroke-width="1.2"/>`,
            `<rect x="44" y="47" width="20" height="8" fill="${color}"/>`,
            ...CYBER_SQUARES.map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="6" fill="${color}"/>`),
        ];
        // The 圓相, the grid and the seal with 獨 cut out of it
        case "ink": return inkMonochrome(color);
        // The writing without the board and its frame: the grid, the ring, the 7 and the stubs
        case "chalkboard": return chalkboardWriting({ writing: color, ring: color, stub: color });
    }
};

/** The adaptive icon's monochrome layer: a one-colour silhouette for themed icons. */
export const styleIconMonochrome = (style: StyleId): string =>
    svgOf(...inAdaptiveViewport(...monochromeArtwork(style)));
