import { createDialog } from "@/presentation/composables/createDialog";

export type HintAction = "checkConflicts" | "revealCell" | "close";

export const { provideDialog: provideHintMenu, useDialog: useHintMenu } =
    createDialog<undefined, HintAction>();
