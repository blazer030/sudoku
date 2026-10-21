import { mount } from "@vue/test-utils";
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

describe("HintPanel", () => {
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
