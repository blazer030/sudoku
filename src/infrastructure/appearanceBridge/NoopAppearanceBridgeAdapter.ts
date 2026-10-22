import type { Appearance } from "@/application/SettingsStorage";
import type { AppearanceBridgeService, SystemBarColors } from "@/application/appearanceBridge/AppearanceBridgeService";

export class NoopAppearanceBridgeAdapter implements AppearanceBridgeService {
    async setAppearance(_mode: Appearance): Promise<void> {
        // intentional no-op on web
    }

    async setSystemBarColors(_colors: SystemBarColors): Promise<void> {
        // intentional no-op on web
    }
}
