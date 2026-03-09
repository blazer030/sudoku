import { createDialog } from "@/presentation/composables/createDialog";

export const { provideDialog: provideNewGameDialog, useDialog: useNewGameDialog } =
    createDialog<undefined, "giveUp" | "cancel">();
