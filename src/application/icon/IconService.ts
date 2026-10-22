import type { InjectionKey } from "vue";
import type { IconThemeId } from "@/application/SettingsStorage";

export interface IconService {
    setIcon(iconTheme: IconThemeId): Promise<void>;
}

export const ICON_KEY: InjectionKey<IconService> = Symbol("IconService");
