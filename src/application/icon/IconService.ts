import type { InjectionKey } from "vue";
import type { ColorThemeId } from "@/application/SettingsStorage";

export interface IconService {
    setIcon(themeId: ColorThemeId): Promise<void>;
}

export const ICON_KEY: InjectionKey<IconService> = Symbol("IconService");
