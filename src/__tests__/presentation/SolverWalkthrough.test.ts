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
});
