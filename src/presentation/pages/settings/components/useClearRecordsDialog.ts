import { createDialog } from "@/presentation/composables/createDialog";

export const { provideDialog: provideClearRecordsDialog, useDialog: useClearRecordsDialog } =
    createDialog<undefined, "confirm" | "cancel">();
