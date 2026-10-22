import { createDialog } from "@/presentation/composables/createDialog";

export type WalkthroughDialogKind = "reset" | "noSolution" | "multipleSolutions";

export const { provideDialog: provideWalkthroughDialog, useDialog: useWalkthroughDialog } =
    createDialog<WalkthroughDialogKind, "confirm" | "cancel">();
