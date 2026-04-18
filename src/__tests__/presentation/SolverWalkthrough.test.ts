import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SolverWalkthrough from "@/presentation/pages/solver-walkthrough/SolverWalkthrough.vue";

describe("SolverWalkthrough", () => {
    it("should render an empty 9x9 board on mount", () => {
        const wrapper = mount(SolverWalkthrough);

        for (let row = 0; row < 9; row++) {
            for (let column = 0; column < 9; column++) {
                const cell = wrapper.find(`[data-testid='solver-cell-${row}-${column}']`);
                expect(cell.exists()).toBe(true);
                expect(cell.text()).toBe("");
            }
        }
    });

    it("should fill selected cell when a digit is picked", async () => {
        const wrapper = mount(SolverWalkthrough);

        await wrapper.find("[data-testid='solver-cell-3-4']").trigger("click");
        await wrapper.find("[data-testid='number-7']").trigger("click");

        expect(wrapper.find("[data-testid='solver-cell-3-4']").text()).toBe("7");
    });
});
