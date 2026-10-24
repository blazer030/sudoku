import { computed, type Component, type ComputedRef } from "vue";
import type { StyleId } from "@/theme/themeIds";
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

// One entry per style, so a style added without its moments is a type error
export const STYLE_MOMENTS: Record<StyleId, StyleMoments> = {
    minimal: DEFAULT_MOMENTS,
    tactile: DEFAULT_MOMENTS,
    paper: DEFAULT_MOMENTS,
    pixel: DEFAULT_MOMENTS,
    cyber: DEFAULT_MOMENTS,
};

export const useStyleMoments = (): ComputedRef<StyleMoments> => {
    const settings = useSettingsStore();
    return computed(() => STYLE_MOMENTS[settings.style]);
};
