import { AppIcon } from "@capacitor-community/app-icon";
import type { ColorThemeId } from "@/application/SettingsStorage";
import type { IconService } from "@/application/icon/IconService";

const ALIAS_NAMES: ColorThemeId[] = ["green", "blue", "purple", "orange", "pink", "teal"];

export class DynamicIconAdapter implements IconService {
    async setIcon(themeId: ColorThemeId): Promise<void> {
        const others = ALIAS_NAMES.filter((id) => id !== themeId);
        await AppIcon.change({ name: themeId, disable: others, suppressNotification: false });
    }
}
