import type { InjectionKey } from "vue";
import type { LauncherIconKey } from "@/theme/launcherIcon";

export interface IconService {
    setIcon(icon: LauncherIconKey): Promise<void>;
    /** Back to the app's own icon, the one it has when no theme icon is chosen. */
    resetIcon(): Promise<void>;
}

export const ICON_KEY: InjectionKey<IconService> = Symbol("IconService");
