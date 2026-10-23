// Each style's app icon. The launcher and PWA generators (scripts/) and the app's own pictures of a
// style all draw from here, so the home screen shows what the app shows. Relative imports only.
//
// The artwork is a 108-unit square with no rounding; callers mask it. Digits are paths, not text:
// the fonts the app uses are not there when the generators rasterise the icon.
import { mixColors } from "./contrast";
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

const fillSquare = (color: string): string => `<rect width="${ICON_SIZE}" height="${ICON_SIZE}" fill="${color}"/>`;

const inAdaptiveViewport = (...content: string[]): string[] => {
    const inset = (ICON_SIZE - ADAPTIVE_VIEWPORT) / 2;
    return [`<g transform="translate(${inset} ${inset}) scale(${ADAPTIVE_VIEWPORT / ICON_SIZE})">`, ...content, "</g>"];
};

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

// Ledges are the skin's own edges (tactile/skin.css): 28% shadow in the background for every tile
// (--tactile-edge), 60% shadow in the primary for the centre tile (--tactile-edge-on-primary)
const tactileColors = (palette: Palette): TactileColors => ({
    well: palette.border,
    tile: palette.card,
    ledge: mixColors(palette.shadow, 0.28, palette.background),
    key: palette.primary,
    keyLedge: mixColors(palette.shadow, 0.6, palette.primary),
    digit: palette["on-primary"],
});

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

const paperSheet = (colors: PaperColors): string[] => [
    `<g stroke="${colors.rule}" stroke-width="1.2"><path d="M0 22H108M0 34H108M0 46H108M0 58H108M0 70H108M0 82H108M0 94H108"/></g>`,
    `<path d="M24 0V108" stroke="${colors.margin}" stroke-width="1.6"/>`,
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

const artworkOf = (style: StyleId, palette: Palette): string[] => {
    switch (style) {
        case "minimal": return minimalTiles(palette["on-primary"]);
        case "tactile": return tactileArtwork(tactileColors(palette));
        case "paper": {
            const colors = paperColors(palette);
            return [...paperSheet(colors), ...paperWriting(colors)];
        }
    }
};

/** The colour behind a style's artwork: the adaptive icon's background layer. */
export const styleIconBackground = (style: StyleId, palette: Palette): string =>
    style === "minimal" ? palette.primary : palette.background;

/** A style's icon as a full 108-unit square SVG in the palette's colours, unrounded. */
export const styleIconSvg = (style: StyleId, palette: Palette): string =>
    svgOf(fillSquare(styleIconBackground(style, palette)), ...artworkOf(style, palette));

/** The adaptive icon's foreground layer: minimal's tiles alone, tactile's and paper's whole artwork. */
export const styleIconForeground = (style: StyleId, palette: Palette): string =>
    svgOf(...inAdaptiveViewport(...(style === "minimal"
        ? minimalTiles(palette["on-primary"])
        : [fillSquare(styleIconBackground(style, palette)), ...artworkOf(style, palette)])));

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
    }
};

/** The adaptive icon's monochrome layer: a one-colour silhouette for themed icons. */
export const styleIconMonochrome = (style: StyleId): string =>
    svgOf(...inAdaptiveViewport(...monochromeArtwork(style)));
