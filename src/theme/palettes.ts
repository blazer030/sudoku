// Every style's colours, gathered from src/style/styles/<id>/palette.ts. src/style/themes.generated.css
// is rendered from them by `npm run generate:theme-css`. Relative imports only: scripts/ import this file.
import { effectiveColorMode, type ColorMode, type ColorThemeId, type RememberedThemes, type StyleId } from "./themeIds";
import { CHALKBOARD_STYLE } from "../style/styles/chalkboard/palette";
import { CYBER_STYLE } from "../style/styles/cyber/palette";
import { INK_STYLE } from "../style/styles/ink/palette";
import { MINIMAL_STYLE } from "../style/styles/minimal/palette";
import { PAPER_STYLE } from "../style/styles/paper/palette";
import { PIXEL_STYLE } from "../style/styles/pixel/palette";
import { TACTILE_STYLE } from "../style/styles/tactile/palette";
import type { Palette, StyleDefinition, ThemePalette } from "./paletteBuilder";

export { PALETTE_TOKENS, STYLE_OWN_TOKENS, type Palette, type PaletteToken, type StyleOwnToken } from "./paletteBuilder";

export const STYLES: Record<StyleId, StyleDefinition> = {
    minimal: MINIMAL_STYLE,
    tactile: TACTILE_STYLE,
    paper: PAPER_STYLE,
    pixel: PIXEL_STYLE,
    cyber: CYBER_STYLE,
    ink: INK_STYLE,
    chalkboard: CHALKBOARD_STYLE,
};

export const DEFAULT_STYLE_ID: StyleId = "minimal";

const findTheme = (style: StyleId, themeId: ColorThemeId): ThemePalette => {
    const themes = (STYLES[style] as StyleDefinition | undefined ?? STYLES[DEFAULT_STYLE_ID]).themes;
    return themes.find(theme => theme.id === themeId) ?? themes[0];
};

/** The theme a style comes back to: the one remembered for it, or the style's first theme. */
export const rememberedThemeFor = (style: StyleId, remembered: RememberedThemes): ColorThemeId => {
    const themes = STYLES[style].themes;
    return themes.find(theme => theme.id === remembered[style])?.id ?? themes[0].id;
};

/** The palette the style shows for a mode; a style with one mode answers with that mode's palette. */
export const getPalette = (style: StyleId, themeId: ColorThemeId, mode: ColorMode): Palette => {
    const theme = findTheme(style, themeId);
    const palette = theme[effectiveColorMode(style, mode)];
    if (palette === undefined) throw new Error(`${style}/${themeId} has no palette for ${mode}`);
    return palette;
};

/**
 * The browser theme-color: the primary in light mode, the page background in dark mode.
 * The Android app's own system bars take the page background instead (see appearanceSync).
 */
export const systemBarColor = (style: StyleId, themeId: ColorThemeId, mode: ColorMode): string => {
    const palette = getPalette(style, themeId, mode);
    return effectiveColorMode(style, mode) === "light" ? palette.primary : palette.background;
};
