import { computed, type Component, type ComputedRef } from "vue";
import type { StyleId } from "@/theme/themeIds";
import type { CellReference } from "@/domain/solver/SolveStep";
import type { CelebrationPhase, GroupEffect } from "@/presentation/components/style-moments/styleMoments";
import { useSettingsStore } from "@/stores/settingsStore";
import BlueprintBoardFrame from "@/presentation/components/board-frame/blueprint/BlueprintBoardFrame.vue";

/**
 * What a style's board frame is given, the same on the game, Game Review and Walkthrough boards. A frame
 * draws round the board it wraps (its default slot) and sets `--board-frame-block` on its own element to the
 * height it adds, so `max-w-board-fit` gives the square board up that much and the digit keys stay on screen.
 */
export interface BoardFrameProps {
    /**
     * The cell the board points at: the selected cell, the hint's answer cell in hint mode, the cell a
     * review step changed, or a walkthrough step's first assigned cell; null when there is none, and while
     * the solved board celebrates.
     */
    target: CellReference | null;
    /** The game's running group effect; always null on the review and walkthrough boards. */
    effect: GroupEffect | null;
    /** The game's celebration phase; always null on the review and walkthrough boards. */
    celebration: CelebrationPhase | null;
}

// One entry per style, so a style added without its frame is a type error; null draws no frame and no element
export const STYLE_BOARD_FRAMES: Record<StyleId, Component | null> = {
    minimal: null,
    tactile: null,
    paper: null,
    pixel: null,
    cyber: null,
    ink: null,
    chalkboard: null,
    blueprint: BlueprintBoardFrame,
    aurora: null,
};

export const useBoardFrame = (): ComputedRef<Component | null> => {
    const settings = useSettingsStore();
    return computed(() => STYLE_BOARD_FRAMES[settings.style]);
};
