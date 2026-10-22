import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { createDialog } from "@/presentation/composables/createDialog";
import { handleBackButton } from "@/presentation/composables/backDismissal";

const mountDialog = <TResult>(dismissResult?: TResult) => {
    const { provideDialog } = createDialog<undefined, TResult>({ dismissResult });
    let dialog!: ReturnType<typeof provideDialog>;
    const wrapper = mount(defineComponent({
        setup: () => {
            dialog = provideDialog();
            return () => null;
        },
    }));
    return { dialog, wrapper };
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("backDismissal", () => {
    it("should close an open dialog with its dismiss result on Back", async () => {
        const { dialog } = mountDialog<"confirm" | "cancel">("cancel");
        const result = dialog.open();

        handleBackButton(false);

        await expect(result).resolves.toBe("cancel");
        expect(dialog.visible.value).toBe(false);
    });

    it("should go back a page when no dialog is open and there is a page to go back to", () => {
        const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);

        handleBackButton(true);

        expect(back).toHaveBeenCalledTimes(1);
    });

    it("should do nothing on the first page when no dialog is open", () => {
        const back = vi.spyOn(window.history, "back").mockImplementation(() => undefined);

        handleBackButton(false);

        expect(back).not.toHaveBeenCalled();
    });
});
