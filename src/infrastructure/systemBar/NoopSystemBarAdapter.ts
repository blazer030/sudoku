import type { ColorMode } from "@/theme/themeIds";
import type { SystemBarService } from "@/application/systemBar/SystemBarService";

export class NoopSystemBarAdapter implements SystemBarService {
    async apply(_mode: ColorMode): Promise<void> {
        // intentional no-op on web
    }
}
