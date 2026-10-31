// The app icons: one per style's theme in each colour mode the style has. The generator scripts
// import this too, so relative imports only.
import {
    effectiveColorMode,
    STYLE_COLOR_MODES,
    STYLE_IDS,
    THEME_IDS_BY_STYLE,
    type ColorMode,
    type ColorThemeId,
    type StyleId,
} from "./themeIds";
import { STYLES } from "./palettes";

/** Names an icon: its Android launcher alias and its web asset file names. */
export type LauncherIconKey = string;

export interface LauncherIcon {
    key: LauncherIconKey;
    style: StyleId;
    themeId: ColorThemeId;
    mode: ColorMode;
}

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Minimal's light icons keep the bare theme id: their launcher aliases came first and existing
 * home-screen shortcuts point at them. Every other icon is named by style, theme and mode.
 */
export const launcherIconKey = (style: StyleId, themeId: ColorThemeId, mode: ColorMode): LauncherIconKey => {
    if (style === "minimal" && mode === "light") return themeId;
    return `${style}${capitalize(themeId)}${mode === "dark" ? "Dark" : ""}`;
};

/** The icon an installed web app uses: the style's light icon, or its only one. */
export const pwaIconKey = (style: StyleId, themeId: ColorThemeId): LauncherIconKey =>
    launcherIconKey(style, themeId, effectiveColorMode(style, "light"));

/** The PNGs an icon has on the web only: an installed web app's two sizes and iOS's home-screen icon. */
export const pwaIconFiles = (icon: LauncherIconKey): { small: string; large: string; appleTouch: string } => ({
    small: `pwa-192x192-${icon}.png`,
    large: `pwa-512x512-${icon}.png`,
    appleTouch: `apple-touch-icon-${icon}.png`,
});

export const LAUNCHER_ICONS: readonly LauncherIcon[] = STYLE_IDS.flatMap(style =>
    STYLES[style].themes.flatMap(theme => STYLE_COLOR_MODES[style].map(mode => ({
        key: launcherIconKey(style, theme.id, mode),
        style,
        themeId: theme.id,
        mode,
    }))));

/** A launcher alias kept for users already on it, drawing another icon. */
export interface LegacyLauncherAlias {
    key: string;
    icon: LauncherIconKey;
}

/**
 * Paper had dark icons before it became light only. A user who matched the icon to paper in dark
 * sits on one of these aliases, and removing an enabled alias would leave no launcher entry, so
 * they stay in the manifest drawing the light twin. While matching is on, the app moves that user
 * to the light alias on its next pause.
 */
export const LEGACY_LAUNCHER_ALIASES: readonly LegacyLauncherAlias[] = THEME_IDS_BY_STYLE.paper.map(themeId => ({
    key: launcherIconKey("paper", themeId, "dark"),
    icon: launcherIconKey("paper", themeId, "light"),
}));

/** Every Android launcher alias the manifest declares: the icons' then the legacy ones. */
export const ALL_LAUNCHER_ALIASES: readonly string[] = [
    ...LAUNCHER_ICONS.map(icon => icon.key),
    ...LEGACY_LAUNCHER_ALIASES.map(alias => alias.key),
];

/** The Android resource name for an icon: "tactileRustDark" is ic_launcher_tactile_rust_dark. */
export const launcherResourceName = (key: LauncherIconKey): string =>
    `ic_launcher_${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)}`;
