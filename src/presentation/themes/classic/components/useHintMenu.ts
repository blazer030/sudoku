import { createDialog } from "@/presentation/composables/createDialog";

export interface HintParams { recordedUsed: number; canUseHint: boolean }
export type HintAction = "autoNotes" | "checkConflicts" | "checkErrors" | "revealCell" | "close";

export const { provideDialog: provideHintMenu, useDialog: useHintMenu } =
    createDialog<HintParams, HintAction>();
