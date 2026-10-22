import type { IconThemeId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

export class NoopIconAdapter implements IconService {
    async setIcon(_iconTheme: IconThemeId): Promise<void> {
        // intentional no-op on web
    }
}
