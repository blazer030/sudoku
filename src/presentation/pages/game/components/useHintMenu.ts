import { createDialog } from "@/presentation/composables/createDialog";

export interface HintParams { remaining: number; firstHintFree: boolean }
export type HintAction = "autoNotes" | "checkConflicts" | "revealCell" | "close";

export const { provideDialog: provideHintMenu, useDialog: useHintMenu } =
    createDialog<HintParams, HintAction>();
