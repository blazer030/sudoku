import { App } from "@capacitor/app";
import { AppIcon } from "@capacitor-community/app-icon";
import type { ColorThemeId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

const ALIAS_NAMES: ColorThemeId[] = ["green", "blue", "purple", "orange", "pink", "teal"];

// Switching launcher aliases makes Android remove the running task, so the
// change is deferred until the app is backgrounded, where the close is invisible.
export class DynamicIconAdapter implements IconService {
    private pendingThemeId: ColorThemeId | null = null;

    constructor() {
        App.addListener("pause", () => {
            this.applyPending();
        }).catch((error: unknown) => {
            console.error("Failed to register the pause listener", error);
        });
    }

    setIcon(themeId: ColorThemeId): Promise<void> {
        this.pendingThemeId = themeId;
        return Promise.resolve();
    }

    private applyPending(): void {
        const themeId = this.pendingThemeId;
        if (themeId === null) return;
        this.pendingThemeId = null;
        const others = ALIAS_NAMES.filter((id) => id !== themeId);
        AppIcon.change({ name: themeId, disable: others, suppressNotification: false }).catch((error: unknown) => {
            console.error("Failed to change the launcher icon", error);
        });
    }
}
