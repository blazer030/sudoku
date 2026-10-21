import type { ColorThemeId } from "../application/SettingsStorage";
import { STYLES } from "./palettes";

export interface ThemeDefinition {
    id: ColorThemeId;
    primary: string;
    accent: string;
    onPrimary: string;
}

// The settings swatches show the minimal style's light colours in every mode, so their
// check mark uses the light on-primary rather than the page's current one
export const THEMES: ThemeDefinition[] = STYLES.minimal.themes.map(theme => ({
    id: theme.id,
    primary: theme.light.primary,
    accent: theme.light.accent,
    onPrimary: theme.light["on-primary"],
}));
