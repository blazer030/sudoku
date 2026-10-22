import { registerPlugin } from "@capacitor/core";
import type { Appearance } from "@/application/SettingsStorage";
import type { AppearanceBridgeService, SystemBarColors } from "@/application/appearanceBridge/AppearanceBridgeService";

// The app's own plugin: android/app/src/main/java/io/github/blazer030/sudoku/AppearanceBridgePlugin.java
interface AppearanceBridgePlugin {
    setAppearance(options: { mode: Appearance }): Promise<void>;
    setSystemBarColors(options: SystemBarColors): Promise<void>;
}

const AppearanceBridge = registerPlugin<AppearanceBridgePlugin>("AppearanceBridge");

export class CapacitorAppearanceBridgeAdapter implements AppearanceBridgeService {
    async setAppearance(mode: Appearance): Promise<void> {
        try {
            await AppearanceBridge.setAppearance({ mode });
        } catch (error: unknown) {
            console.error("Failed to pass the appearance to Android", error);
        }
    }

    async setSystemBarColors(colors: SystemBarColors): Promise<void> {
        try {
            await AppearanceBridge.setSystemBarColors(colors);
        } catch (error: unknown) {
            console.error("Failed to set the system bar colours", error);
        }
    }
}
