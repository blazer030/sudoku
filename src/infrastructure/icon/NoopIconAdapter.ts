import type { LauncherIconKey } from "@/theme/launcherIcon";
import type { IconService } from "@/application/icon/IconService";

export class NoopIconAdapter implements IconService {
    async setIcon(_icon: LauncherIconKey): Promise<void> {
        // intentional no-op on web
    }
}
