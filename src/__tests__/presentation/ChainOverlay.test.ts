import { mount } from "@vue/test-utils";
import ChainOverlay from "@/presentation/pages/solver-walkthrough/components/ChainOverlay.vue";
import type { ChainLink } from "@/domain/solver/SolveStep";

const makeLink = (
    fromRow: number,
    fromColumn: number,
    toRow: number,
    toColumn: number,
    digit: number,
    type: ChainLink["type"],
): ChainLink => ({
    from: { row: fromRow, column: fromColumn },
    to: { row: toRow, column: toColumn },
    digit,
    type,
});

describe("ChainOverlay", () => {
    it("should render one SVG line per chain link", () => {
        const chainLinks: ChainLink[] = [
            makeLink(0, 0, 0, 5, 1, "strong"),
            makeLink(0, 5, 2, 5, 1, "weak"),
            makeLink(2, 5, 2, 1, 1, "strong"),
        ];

        const wrapper = mount(ChainOverlay, { props: { chainLinks } });

        expect(wrapper.findAll("line")).toHaveLength(3);
    });

    it("should not render the overlay when there are no chain links", () => {
        const wrapper = mount(ChainOverlay, { props: { chainLinks: [] } });

        expect(wrapper.find("[data-testid='chain-overlay']").exists()).toBe(false);
    });

    it("should apply dashed stroke only to weak links", () => {
        const chainLinks: ChainLink[] = [
            makeLink(0, 0, 0, 5, 1, "strong"),
            makeLink(0, 5, 2, 5, 1, "weak"),
        ];

        const wrapper = mount(ChainOverlay, { props: { chainLinks } });
        const lines = wrapper.findAll("line");

        expect(lines[0].attributes("stroke-dasharray")).toBeUndefined();
        expect(lines[1].attributes("stroke-dasharray")).toBe("0.18 0.12");
    });
});
