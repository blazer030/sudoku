// The app icons: each style's artwork (src/theme/styleIcons.ts), one per style's theme and mode.
// Every favicon, launcher and PWA icon is rendered from these.
import { getPalette, type Palette } from "../src/theme/palettes";
import { LAUNCHER_ICONS, type LauncherIconKey } from "../src/theme/launcherIcon";
import { styleIconSvg } from "../src/theme/styleIcons";
import type { StyleId } from "../src/theme/themeIds";

export interface IconVariant {
    id: LauncherIconKey;
    style: StyleId;
    palette: Palette;
}

/** Every launcher icon: each style's theme in each mode it has, with that mode's palette. */
export const ICON_VARIANTS: IconVariant[] = LAUNCHER_ICONS.map(({ key, style, themeId, mode }) => ({
    id: key,
    style,
    palette: getPalette(style, themeId, mode),
}));

/** An artwork masked to a rounded square, a quarter of its side in radius: favicons and legacy launcher icons. */
export const roundedSvg = (artwork: string): string => [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108">`,
    `<clipPath id="icon-shape"><rect width="108" height="108" rx="27"/></clipPath>`,
    `<g clip-path="url(#icon-shape)">`,
    artwork.trimEnd(),
    "</g>",
    "</svg>",
    "",
].join("\n");

/** A style's icon masked to a rounded square. */
export const roundedIconSvg = ({ style, palette }: IconVariant): string => roundedSvg(styleIconSvg(style, palette));
