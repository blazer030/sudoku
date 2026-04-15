import { createDialog } from "@/presentation/composables/createDialog";

export const { provideDialog: provideLeaveDialog, useDialog: useLeaveDialog } =
    createDialog<undefined, "save" | "giveUp" | "cancel">();
