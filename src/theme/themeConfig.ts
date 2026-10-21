import type { ColorThemeId } from "../application/SettingsStorage";
import { STYLES } from "./palettes";

export interface ThemeDefinition {
    id: ColorThemeId;
    primary: string;
    accent: string;
}

// The settings swatches show the minimal style's light primary and accent
export const THEMES: ThemeDefinition[] = STYLES.minimal.themes.map(theme => ({
    id: theme.id,
    primary: theme.light.primary,
    accent: theme.light.accent,
}));
