import type { Appearance } from "@/application/SettingsStorage";

export interface SystemBarColors {
    background: string;
    /** Dark icons for a light background, light icons for a dark one */
    darkIcons: boolean;
}

/** Tells the Android shell how the app looks, so the parts it draws before or around the page match. */
export interface AppearanceBridgeService {
    /** Remembered natively, so the next cold start's splash screen already uses this mode. */
    setAppearance(mode: Appearance): Promise<void>;
    /** Colours the system bars on Android versions that do not draw the page under them. */
    setSystemBarColors(colors: SystemBarColors): Promise<void>;
}
