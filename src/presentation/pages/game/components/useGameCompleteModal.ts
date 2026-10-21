import { createDialog } from "@/presentation/composables/createDialog";
import type { Difficulty } from "@/domain";

export interface GameCompleteParams {
    elapsedSeconds: number;
    difficulty: Difficulty;
    hintsUsed: number;
    isNewRecord: boolean;
}

export const { provideDialog: provideGameCompleteModal, useDialog: useGameCompleteModal } =
    createDialog<GameCompleteParams>();
