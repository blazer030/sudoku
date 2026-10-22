import { App } from "@capacitor/app";
import { AppIcon } from "@capacitor-community/app-icon";
import { ICON_THEME_IDS, type IconThemeId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

// Switching launcher aliases makes Android remove the running task, so the
// change is deferred until the app is backgrounded, where the close is invisible.
export class DynamicIconAdapter implements IconService {
    private pendingIconTheme: IconThemeId | null = null;

    constructor() {
        App.addListener("pause", () => {
            this.applyPending();
        }).catch((error: unknown) => {
            console.error("Failed to register the pause listener", error);
        });
    }

    setIcon(iconTheme: IconThemeId): Promise<void> {
        this.pendingIconTheme = iconTheme;
        return Promise.resolve();
    }

    private applyPending(): void {
        const iconTheme = this.pendingIconTheme;
        if (iconTheme === null) return;
        this.pendingIconTheme = null;
        // The launcher aliases are named after the icon themes
        const others = ICON_THEME_IDS.filter((id) => id !== iconTheme);
        AppIcon.change({ name: iconTheme, disable: others, suppressNotification: false }).catch((error: unknown) => {
            console.error("Failed to change the launcher icon", error);
        });
    }
}
