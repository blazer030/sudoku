import { mount } from "@vue/test-utils";
import StepLinkOverlay from "@/presentation/components/step-presentation/StepLinkOverlay.vue";
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

describe("StepLinkOverlay", () => {
    it("should render one SVG line per link", () => {
        const links: ChainLink[] = [
            makeLink(0, 0, 0, 5, 1, "strong"),
            makeLink(0, 5, 2, 5, 1, "weak"),
            makeLink(2, 5, 2, 1, 1, "strong"),
        ];

        const wrapper = mount(StepLinkOverlay, { props: { links } });

        expect(wrapper.findAll("line")).toHaveLength(3);
    });

    it("should not render the overlay when there are no links", () => {
        const wrapper = mount(StepLinkOverlay, { props: { links: [] } });

        expect(wrapper.find("[data-testid='step-link-overlay']").exists()).toBe(false);
    });

    it("should stretch to the full board height rather than its square viewBox", () => {
        // An absolutely positioned SVG ignores `bottom` and sizes itself from the viewBox ratio,
        // so on narrow screens (cells taller than wide) the lines drift off their anchors.
        const wrapper = mount(StepLinkOverlay, { props: { links: [makeLink(0, 0, 8, 0, 1, "strong")] } });
        const overlay = wrapper.find("[data-testid='step-link-overlay']");

        expect(overlay.attributes("preserveAspectRatio")).toBe("none");
        expect(overlay.classes()).toEqual(expect.arrayContaining(["w-full", "h-full"]));
    });

    it("should dash only the weak links", () => {
        const links: ChainLink[] = [
            makeLink(0, 0, 0, 5, 1, "strong"),
            makeLink(0, 5, 2, 5, 1, "weak"),
        ];

        const wrapper = mount(StepLinkOverlay, { props: { links } });
        const lines = wrapper.findAll("line");

        expect(lines[0].attributes("stroke-dasharray")).toBeUndefined();
        expect(lines[1].attributes("stroke-dasharray")).toBeDefined();
    });
});
