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
});
