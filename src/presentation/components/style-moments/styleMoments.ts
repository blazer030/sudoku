import { computed, type Component, type ComputedRef } from "vue";
import { STYLE_IDS, type StyleId } from "@/theme/themeIds";
import { useSettingsStore } from "@/stores/settingsStore";
import DefaultLoader from "@/presentation/components/style-moments/default/DefaultLoader.vue";
import DefaultCelebration from "@/presentation/components/style-moments/default/DefaultCelebration.vue";
import type { CompletedGroup } from "@/domain/game/Sudoku";

/** A group effect on the board: a new one gets a new id, which starts its drawings afresh. */
export interface GroupEffect {
    id: number;
    groups: CompletedGroup[];
    origin: { row: number; column: number };
}

export interface StyleMoments {
    loader: Component;
    celebration: Component;
    /**
     * How long one cell's group effect runs, in milliseconds. Each cell starts a ripple step later
     * for each row and column it lies from the origin; the effect ends when the farthest cell's has run.
     */
    groupEffectMs: number;
    /** Pieces drawn over the board for a group effect, given `{ effect }`; none when the cells carry it all. */
    groupOverlay?: Component | null;
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
