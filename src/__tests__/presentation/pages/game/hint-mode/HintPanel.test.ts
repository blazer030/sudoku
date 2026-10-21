import { nextTick } from "vue";
import { mount } from "@vue/test-utils";
import { i18n } from "@/presentation/i18n";
import HintPanel from "@/presentation/pages/game/hint-mode/HintPanel.vue";
import { createMultiStepSudoku } from "@/__tests__/fixtures/multiStepPuzzle";

const firstStep = () => {
    const plan = createMultiStepSudoku().planRevealHint();
    if (plan.kind !== "steps") throw new Error(`expected a steps plan, got ${plan.kind}`);
    return plan.steps[0];
};

const mountSteps = (totalSteps: number, stepIndex: number) =>
    mount(HintPanel, {
        props: {
            phase: "steps",
            wrongCell: null,
            step: firstStep(),
            stepIndex,
            totalSteps,
            isLastStep: false,
            digit: null,
        },
    });

const mountWrongEntry = () =>
    mount(HintPanel, {
        props: {
            phase: "wrongEntry",
            wrongCell: { row: 1, column: 1 },
            step: null,
            stepIndex: 0,
            totalSteps: 0,
            isLastStep: false,
            digit: null,
        },
    });

describe("HintPanel", () => {
    it("should say that Clear removes only the wrong digit", async () => {
        const wrapper = mountWrongEntry();

        expect(wrapper.find("[data-testid='hint-wrong-entry-note']").text()).toBe("Clearing removes just this digit.");

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.find("[data-testid='hint-wrong-entry-note']").text()).toBe("清除只會移除這格的數字。");
    });

    it("should move focus into the panel, named for hint mode, when it opens", () => {
        const wrapper = mount(HintPanel, {
            attachTo: document.body,
            props: {
                phase: "wrongEntry",
                wrongCell: { row: 1, column: 1 },
                step: null,
                stepIndex: 0,
                totalSteps: 0,
                isLastStep: false,
                digit: null,
            },
        });

        const panel = wrapper.find("[data-testid='hint-panel']");
        expect(panel.element.contains(document.activeElement)).toBe(true);
        expect(panel.attributes("aria-label")).toBe("Hint mode");
        wrapper.unmount();
    });

    it("should announce the wrong entry as soon as the panel shows it", () => {
        const wrapper = mountWrongEntry();

        expect(wrapper.find("[data-testid='hint-wrong-entry']").attributes("role")).toBe("alert");
    });

    it("should announce each new explanation through a live region that stays in place", async () => {
        const wrapper = mountSteps(3, 0);
        const region = wrapper.find("[data-testid='hint-explanation-region']");
        expect(region.attributes("aria-live")).toBe("polite");
        expect(wrapper.find("[data-testid='hint-explanation']").attributes("aria-live")).toBeUndefined();

        await wrapper.setProps({ stepIndex: 1 });

        expect(wrapper.find("[data-testid='hint-explanation-region']").element).toBe(region.element);
    });

    it("should show one dot per step when the dots fit beside the longest technique name", () => {
        const wrapper = mountSteps(6, 2);

        expect(wrapper.findAll("[data-testid^='hint-dot-']")).toHaveLength(6);
        expect(wrapper.find("[data-testid='hint-step-counter']").exists()).toBe(false);
    });

    it("should show a step counter instead of dots when the dots would overflow a 360px panel", () => {
        const wrapper = mountSteps(7, 2);

        expect(wrapper.find("[data-testid='hint-step-counter']").text()).toBe("3 / 7");
        expect(wrapper.findAll("[data-testid^='hint-dot-']")).toHaveLength(0);
    });
});
