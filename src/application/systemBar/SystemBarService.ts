import type { ColorMode } from "@/theme/themeIds";

/** Keeps the Android status and navigation bar icons readable in the current mode. */
export interface SystemBarService {
    apply(mode: ColorMode): Promise<void>;
}
