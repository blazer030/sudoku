import { describe, it, expect } from "vitest";
import { defineComponent } from "vue";
import { mount } from "@vue/test-utils";
import { StepRecorder } from "@/domain/game/StepRecorder";
import { createKnownSudoku } from "@/__tests__/fixtures/knownPuzzle";
import { useHintActions } from "@/presentation/pages/game/useHintActions";
import { useHintMenu } from "@/presentation/pages/game/components/useHintMenu";

type HintApi = ReturnType<typeof useHintActions>;

const mountHarness = () => {
    const captured: { api?: HintApi; menu?: ReturnType<typeof useHintMenu> } = {};
    const Child = defineComponent({
        setup() {
            captured.menu = useHintMenu();
            return () => null;
        },
    });
    const Harness = defineComponent({
        components: { Child },
        setup() {
            captured.api = useHintActions({
                sudoku: createKnownSudoku(),
                stepRecorder: new StepRecorder(),
                autoRemoveNotes: () => false,
                onRevealComplete: () => undefined,
            });
            return () => null;
        },
        template: "<Child />",
    });
    mount(Harness);
    if (!captured.api) throw new Error("not initialised");
    return captured.api;
};

describe("useHintActions — dismissOverlay", () => {
    it("closes the open hint menu and settles it as a close", async () => {
        const api = mountHarness();
        const menuClosed = api.openHintMenu();

        expect(api.dismissOverlay()).toBe(true);
        await menuClosed;

        expect(api.dismissOverlay()).toBe(false);
    });

    it("reports nothing to dismiss when no overlay is open", () => {
        expect(mountHarness().dismissOverlay()).toBe(false);
    });
});
