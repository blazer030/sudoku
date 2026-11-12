import { useRouter } from "vue-router";
import { createDialog } from "@/presentation/composables/createDialog";
import { ROUTER_PATH } from "@/routerPaths";
import { useSettingsStore } from "@/stores/settingsStore";

export const { provideDialog: provideLessonNoticeDialog, useDialog: useLessonNoticeDialog } =
    createDialog<undefined, "switch" | "styles" | "carryOn" | "back">({ dismissResult: "back" });

/**
 * 8-bit's light mode marks a board with little more than close greens, so entering lessons in it asks first.
 * Resolves to what the caller does next: open the lessons, or stop because the player went elsewhere or backed out.
 */
export const useLessonNotice = () => {
    const dialog = provideLessonNoticeDialog();
    const settings = useSettingsStore();
    const router = useRouter();

    const check = async (): Promise<"open" | "left" | "cancelled"> => {
        const isHandheld = settings.style === "pixel" && settings.appearance === "light";
        if (!isHandheld || settings.handheldLessonNoticeDismissed) return "open";

        switch (await dialog.open()) {
            case "switch":
                settings.setAppearance("dark");
                return "open";
            case "carryOn":
                settings.dismissHandheldLessonNotice();
                return "open";
            case "styles":
                void router.push(ROUTER_PATH.appearance);
                return "left";
            case "back":
                return "cancelled";
        }
    };

    return { check };
};
