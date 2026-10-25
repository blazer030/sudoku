import type { ColorMode } from "@/theme/themeIds";
import type { AppearanceBridgeService, SystemBarColors } from "@/application/appearanceBridge/AppearanceBridgeService";

export class NoopAppearanceBridgeAdapter implements AppearanceBridgeService {
    async setAppearance(_mode: ColorMode): Promise<void> {
        // intentional no-op on web
    }

    async setSystemBarColors(_colors: SystemBarColors): Promise<void> {
        // intentional no-op on web
    }
}
