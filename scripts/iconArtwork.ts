// The app icon: a 3×3 block of tiles on a rounded square in the theme's primary.
// public/sudoku-<theme>.svg and every launcher and PWA icon are rendered from this.
import { getPalette, STYLES } from "../src/theme/palettes";

export interface IconTheme {
    id: string;
    primary: string;
    background: string;
}

// Icons use the minimal style's light palette, whatever style the app is set to
const ICON_STYLE = "minimal";

export const ICON_THEMES: IconTheme[] = STYLES[ICON_STYLE].themes.map((theme) => {
    const palette = getPalette(ICON_STYLE, theme.id, "light");
    return { id: theme.id, primary: palette.primary, background: palette.background };
});

const TILE_ORIGINS = [48, 100, 152];
const TILE_SIZE = 40;

// Alternate tiles are solid, the rest faint, in a checkerboard
const tile = (x: number, y: number, solid: boolean): string =>
    `  <rect x="${x}" y="${y}" width="${TILE_SIZE}" height="${TILE_SIZE}" rx="12" fill="#FFFFFF"${solid ? "" : ` fill-opacity="0.25"`}/>`;

export const iconSvg = (primary: string): string => [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">`,
    `  <rect width="240" height="240" rx="60" fill="${primary}"/>`,
    ...TILE_ORIGINS.flatMap((y, rowIndex) =>
        TILE_ORIGINS.map((x, columnIndex) => tile(x, y, (rowIndex + columnIndex) % 2 === 1))),
    "</svg>",
    "",
].join("\n");
