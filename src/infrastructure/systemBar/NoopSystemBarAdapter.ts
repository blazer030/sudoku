import type { ColorMode } from "@/application/SettingsStorage";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";

export class NoopSystemBarAdapter implements SystemBarService {
    async apply(_mode: ColorMode): Promise<void> {
        // intentional no-op on web
    }
}
