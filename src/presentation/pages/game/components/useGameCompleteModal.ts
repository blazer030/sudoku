import { createDialog } from "@/presentation/composables/createDialog";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";

export interface GameCompleteParams {
    elapsedSeconds: number;
    difficulty: Difficulty;
    hintsUsed: number;
    isNewRecord: boolean;
}

export type GameCompleteAction = "playAgain" | "review" | "home";

export const { provideDialog: provideGameCompleteModal, useDialog: useGameCompleteModal } =
    createDialog<GameCompleteParams, GameCompleteAction>();
