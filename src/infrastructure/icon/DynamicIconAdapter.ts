import { App } from "@capacitor/app";
import { AppIcon } from "@capacitor-community/app-icon";
import { LAUNCHER_ICONS, type LauncherIconKey } from "@/theme/launcherIcon";
import type { IconService } from "@/application/icon/IconService";

// Switching launcher aliases makes Android remove the running task, so the
// change is deferred until the app is backgrounded, where the close is invisible.
export class DynamicIconAdapter implements IconService {
    private pendingIcon: LauncherIconKey | null = null;

    constructor() {
        App.addListener("pause", () => {
            this.applyPending();
        }).catch((error: unknown) => {
            console.error("Failed to register the pause listener", error);
        });
    }

    setIcon(icon: LauncherIconKey): Promise<void> {
        this.pendingIcon = icon;
        return Promise.resolve();
    }

    private applyPending(): void {
        const icon = this.pendingIcon;
        if (icon === null) return;
        this.pendingIcon = null;
        // The launcher aliases are named by the icon keys
        const others = LAUNCHER_ICONS.map(({ key }) => key).filter(key => key !== icon);
        AppIcon.change({ name: icon, disable: others, suppressNotification: false }).catch((error: unknown) => {
            console.error("Failed to change the launcher icon", error);
        });
    }
}
