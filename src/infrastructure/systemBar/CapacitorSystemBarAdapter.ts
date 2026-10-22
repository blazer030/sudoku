import { SystemBars, SystemBarsStyle } from "@capacitor/core";
import type { ColorMode } from "@/theme/themeIds";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";

// Under Capacitor 8's edge-to-edge layout the bars show the page background,
// so only the icon contrast needs setting. Dark style means light icons.
export class CapacitorSystemBarAdapter implements SystemBarService {
    async apply(mode: ColorMode): Promise<void> {
        try {
            await SystemBars.setStyle({ style: mode === "dark" ? SystemBarsStyle.Dark : SystemBarsStyle.Light });
        } catch (error: unknown) {
            console.error("Failed to set the system bar style", error);
        }
    }
}
