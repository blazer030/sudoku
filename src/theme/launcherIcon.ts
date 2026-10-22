// The app icons: one per style's theme in light and in dark. The generator scripts import this
// too, so relative imports only.
import { STYLE_IDS, type ColorMode, type ColorThemeId, type StyleId } from "../application/SettingsStorage";
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

const MODES: readonly ColorMode[] = ["light", "dark"];

export const LAUNCHER_ICONS: readonly LauncherIcon[] = STYLE_IDS.flatMap(style =>
    STYLES[style].themes.flatMap(theme => MODES.map(mode => ({
        key: launcherIconKey(style, theme.id, mode),
        style,
        themeId: theme.id,
        mode,
    }))));

/** The Android resource name for an icon: "paperBlueInkDark" is ic_launcher_paper_blue_ink_dark. */
export const launcherResourceName = (key: LauncherIconKey): string =>
    `ic_launcher_${key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)}`;
