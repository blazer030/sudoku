// The app icon: a 3×3 block of tiles on a rounded square in the theme's primary.
// Every favicon, launcher and PWA icon is rendered from this, one per style's theme and mode.
import { getPalette } from "../src/theme/palettes";
import { LAUNCHER_ICONS } from "../src/theme/launcherIcon";

export interface IconTheme {
    id: string;
    primary: string;
    onPrimary: string;
    background: string;
}

/** Every launcher icon: each style's theme in each mode it has, in that palette's primary and on-primary. */
export const ICON_VARIANTS: IconTheme[] = LAUNCHER_ICONS.map(({ key, style, themeId, mode }) => {
    const palette = getPalette(style, themeId, mode);
    return { id: key, primary: palette.primary, onPrimary: palette["on-primary"], background: palette.background };
});

const TILE_ORIGINS = [48, 100, 152];
const TILE_SIZE = 40;

// Alternate tiles are solid, the rest faint, in a checkerboard
const tile = (x: number, y: number, solid: boolean, tileColor: string): string =>
    `  <rect x="${x}" y="${y}" width="${TILE_SIZE}" height="${TILE_SIZE}" rx="12" fill="${tileColor}"${solid ? "" : ` fill-opacity="0.25"`}/>`;

// The tiles take the palette's on-primary, the colour it puts on the primary
export const iconSvg = ({ primary, onPrimary }: Pick<IconTheme, "primary" | "onPrimary">): string => [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240">`,
    `  <rect width="240" height="240" rx="60" fill="${primary}"/>`,
    ...TILE_ORIGINS.flatMap((y, rowIndex) =>
        TILE_ORIGINS.map((x, columnIndex) => tile(x, y, (rowIndex + columnIndex) % 2 === 1, onPrimary))),
    "</svg>",
    "",
].join("\n");
