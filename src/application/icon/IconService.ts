import type { InjectionKey } from "vue";
import type { LauncherIconKey } from "@/theme/launcherIcon";

export interface IconService {
    setIcon(icon: LauncherIconKey): Promise<void>;
}

export const ICON_KEY: InjectionKey<IconService> = Symbol("IconService");
