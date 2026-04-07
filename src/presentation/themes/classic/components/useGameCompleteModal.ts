import { createDialog } from "@/presentation/composables/createDialog";
import type { Difficulty } from "@/domain";

export interface GameCompleteParams {
    elapsedSeconds: number;
    difficulty: Difficulty;
    hintsUsed: number;
}

export const { provideDialog: provideGameCompleteModal, useDialog: useGameCompleteModal } =
    createDialog<GameCompleteParams>();
