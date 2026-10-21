import { createDialog } from "@/presentation/composables/createDialog";
import type { Difficulty } from "@/domain";

/** The unfinished game that starting a new one would give up. */
export interface SavedGameSummary {
    difficulty: Difficulty;
    elapsedSeconds: number;
}

export const { provideDialog: provideNewGameDialog, useDialog: useNewGameDialog } =
    createDialog<SavedGameSummary, "continue" | "giveUp" | "stay">();
