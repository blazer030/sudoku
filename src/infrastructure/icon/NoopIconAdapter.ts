import type { ColorThemeId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

export class NoopIconAdapter implements IconService {
    async setIcon(_themeId: ColorThemeId): Promise<void> {
        // intentional no-op on web
    }
}
