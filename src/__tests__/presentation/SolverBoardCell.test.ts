import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SolverBoardCell from "@/presentation/pages/solver-walkthrough/components/SolverBoardCell.vue";

describe("SolverBoardCell", () => {
    it("should apply focus background when highlight is 'focus'", () => {
        const wrapper = mount(SolverBoardCell, {
            props: { value: 0, row: 0, column: 0, highlight: "focus" },
        });

        expect(wrapper.classes()).toContain("bg-primary-light");
    });

    it("should apply card background by default", () => {
        const wrapper = mount(SolverBoardCell, {
            props: { value: 0, row: 0, column: 0 },
        });

        expect(wrapper.classes()).toContain("bg-card");
    });
});
