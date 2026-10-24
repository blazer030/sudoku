import { computed, type Component, type ComputedRef } from "vue";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";
import { useSettingsStore } from "@/stores/settingsStore";
import DefaultLoader from "@/presentation/components/style-moments/default/DefaultLoader.vue";
import DefaultCelebration from "@/presentation/components/style-moments/default/DefaultCelebration.vue";

export interface StyleMoments {
    loader: Component;
    celebration: Component;
    /** How long a group effect runs before its completion callback, in milliseconds. */
    groupEffectMs: number;
    /** How long the board phase of the celebration runs before the dialog opens, in milliseconds. */
    celebrationBoardMs: number;
}

const DEFAULT_MOMENTS: StyleMoments = {
    loader: DefaultLoader,
    celebration: DefaultCelebration,
    groupEffectMs: 500,
    celebrationBoardMs: 1460,
};

export const STYLE_MOMENTS: Record<StyleId, StyleMoments> = Object.fromEntries(
    STYLE_IDS.map(style => [style, DEFAULT_MOMENTS]),
) as Record<StyleId, StyleMoments>;

export const useStyleMoments = (): ComputedRef<StyleMoments> => {
    const settings = useSettingsStore();
    return computed(() => STYLE_MOMENTS[settings.style]);
};
