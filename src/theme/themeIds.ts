// The vocabulary of looks: styles, their colour themes and light/dark. Relative imports only:
// scripts/ import this file through src/theme/palettes.ts.
export const STYLE_IDS = ["minimal", "tactile", "paper", "pixel"] as const;
export type StyleId = typeof STYLE_IDS[number];
/** Minimal's themes; their light launcher aliases are named by these bare ids (launcherIcon.ts). */
export const ICON_THEME_IDS = ["green", "blue", "purple", "orange", "pink", "teal"] as const;
export type IconThemeId = typeof ICON_THEME_IDS[number];
/** Each style's own colour themes, in the order the picker shows them; the first is the style's default. */
export const THEME_IDS_BY_STYLE = {
    minimal: ICON_THEME_IDS,
    // Tactile's green and blue are its own palettes; a theme is always looked up within its style
    tactile: ["green", "blue", "rust", "slate"],
    paper: ["blueInk", "greenInk", "redInk"],
    // 8-bit's colours are fixed: one theme, the handheld greens in light and the console colours in dark
    pixel: ["classic"],
} as const satisfies Record<StyleId, readonly string[]>;
export type ColorThemeId = typeof THEME_IDS_BY_STYLE[StyleId][number];
/** Every style's theme ids together, in first-seen order. */
export const COLOR_THEME_IDS: readonly ColorThemeId[] = [...new Set(STYLE_IDS.flatMap(style => THEME_IDS_BY_STYLE[style]))];
export const COLOR_MODES = ["light", "dark"] as const;
export type ColorMode = typeof COLOR_MODES[number];
/** The colour modes each style has; the first is the style's fallback when a mode is missing. */
export const STYLE_COLOR_MODES: Readonly<Record<StyleId, readonly ColorMode[]>> = {
    minimal: ["light", "dark"],
    tactile: ["light", "dark"],
    paper: ["light"],
    pixel: ["light", "dark"],
};
/** Styles that give light and dark their own names (the i18n keys settings.colorMode.styled.<style>.<mode>). */
export const STYLE_MODE_NAMES: Readonly<Partial<Record<StyleId, true>>> = { pixel: true };
/** The mode a style actually shows for the requested one: the requested mode when the style has it, else the style's first. */
export const effectiveColorMode = (style: StyleId, mode: ColorMode): ColorMode => {
    const modes = STYLE_COLOR_MODES[style];
    return modes.includes(mode) ? mode : modes[0];
};

/** The colour theme last chosen under each style, so switching styles comes back to it. */
export type RememberedThemes = Partial<Record<StyleId, ColorThemeId>>;
