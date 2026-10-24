import { mount } from "@vue/test-utils";
import SegmentedControl from "@/presentation/components/segmented-control/SegmentedControl.vue";

const OPTIONS = [
    { value: "small", label: "Small" },
    { value: "medium", label: "Medium" },
    { value: "large", label: "Large" },
] as const;

const mountControl = (modelValue: string) => mount(SegmentedControl, {
    props: { options: OPTIONS, modelValue, testIdPrefix: "size" },
    attrs: { "data-testid": "size-switcher" },
});

describe("SegmentedControl", () => {
    it("should add the skin tokens it is given to its own", () => {
        expect(mountControl("small").attributes("data-skin")).toBe("segmented");

        const marked = mount(SegmentedControl, { props: { options: OPTIONS, modelValue: "small", testIdPrefix: "size", skin: "menu" } });

        expect(marked.attributes("data-skin")).toBe("segmented menu");
    });

    it("should use the raised card track by default", () => {
        const wrapper = mountControl("small");

        expect(wrapper.classes()).toContain("bg-card");
        expect(wrapper.classes()).toContain("shadow-card");
    });

    it("should render a recessed track without shadow when inset", () => {
        const wrapper = mount(SegmentedControl, {
            props: { options: OPTIONS, modelValue: "small", testIdPrefix: "size", inset: true },
        });

        expect(wrapper.classes()).toContain("bg-background");
        expect(wrapper.classes()).not.toContain("bg-card");
        expect(wrapper.classes()).not.toContain("shadow-card");
    });

    it("should render a labelled button per option", () => {
        const wrapper = mountControl("small");

        expect(wrapper.attributes("data-testid")).toBe("size-switcher");
        expect(OPTIONS.map(option => wrapper.get(`[data-testid='size-${option.value}']`).text()))
            .toEqual(["Small", "Medium", "Large"]);
    });

    it("should let every option fill the track's full 48px height as its tap target", () => {
        const wrapper = mountControl("small");

        // Only horizontal track padding: vertical padding would leave each option 40px tall and a dead strip above and below
        expect(wrapper.classes()).toContain("h-12");
        expect(wrapper.attributes("style")).toContain("padding-inline");
        expect(wrapper.classes()).not.toContain("p-1");
        for (const option of OPTIONS) {
            expect(wrapper.get(`[data-testid='size-${option.value}']`).classes()).toContain("h-full");
        }
    });

    it("should not paint a hover fill taller than the selected pill", () => {
        const wrapper = mountControl("small");

        for (const button of wrapper.findAll("button")) {
            expect(button.classes().some(name => name.startsWith("hover:bg-"))).toBe(false);
        }
    });

    it("should keep its layered options inside its own stacking context", () => {
        const wrapper = mountControl("small");

        // The options sit above the indicator with z-10; without isolation they also rise above a page's sticky z-10 header
        expect(wrapper.classes()).toContain("isolate");
    });

    it("should space the options by the skin's gap and pad the strip by the skin's padding", () => {
        const wrapper = mountControl("small");

        const style = wrapper.attributes("style");
        expect(style).toContain("gap: var(--segmented-gap, 0px)");
        expect(style).toContain("padding-inline: var(--segmented-padding, 0.25rem)");
        expect(wrapper.classes()).not.toContain("px-1");
    });

    it("should mark every option as a segment for a skin to draw", () => {
        const wrapper = mountControl("small");

        for (const option of OPTIONS) {
            expect(wrapper.get(`[data-testid='size-${option.value}']`).attributes("data-skin")).toBe("segment");
        }
    });

    it("should mark only the selected option as pressed", () => {
        const wrapper = mountControl("medium");

        expect(wrapper.get("[data-testid='size-medium']").attributes("aria-pressed")).toBe("true");
        expect(wrapper.get("[data-testid='size-small']").attributes("aria-pressed")).toBe("false");
    });

    it("should emit the clicked value", async () => {
        const wrapper = mountControl("small");

        await wrapper.get("[data-testid='size-large']").trigger("click");

        expect(wrapper.emitted("update:modelValue")).toEqual([["large"]]);
    });

    describe("indicator", () => {
        afterEach(() => {
            vi.unstubAllGlobals();
        });

        it("should sit under the selected option", () => {
            const wrapper = mountControl("large");

            const indicator = wrapper.get<HTMLElement>("[data-testid='segmented-indicator']").element;
            // jsdom normalises calc(), so compare against the same expression set on a probe
            const probe = document.createElement("div");
            probe.style.width = "calc((100% - 2 * var(--segmented-padding, 0.25rem) - 2 * var(--segmented-gap, 0px)) / 3)";
            probe.style.transform = "translateX(calc(2 * (100% + var(--segmented-gap, 0px))))";
            expect(indicator.style.transform).toBe(probe.style.transform);
            expect(indicator.style.width).toBe(probe.style.width);
        });

        it("should move when the value changes", async () => {
            const wrapper = mountControl("large");

            await wrapper.setProps({ modelValue: "small" });

            expect(wrapper.get("[data-testid='segmented-indicator']").attributes("style")).toContain("translateX(calc(0 * ");
        });

        it("should slide unless reduced motion is on", () => {
            expect(mountControl("small").get("[data-testid='segmented-indicator']").classes())
                .toContain("segmented-indicator-motion");

            vi.stubGlobal("matchMedia", (query: string) => ({
                matches: query === "(prefers-reduced-motion: reduce)",
                media: query,
            }));

            expect(mountControl("small").get("[data-testid='segmented-indicator']").classes())
                .not.toContain("segmented-indicator-motion");
        });

        it("should land on the chosen option whatever the gap and padding, for any option count", () => {
            for (const count of [2, 3, 4]) {
                const options = Array.from({ length: count }, (_unused, position) => ({ value: `option${position}`, label: `Option ${position}` }));
                const wrapper = mount(SegmentedControl, { props: { options, modelValue: `option${count - 1}`, testIdPrefix: "size" } });

                const style = wrapper.get<HTMLElement>("[data-testid='segmented-indicator']").element.style;
                const probe = document.createElement("div");
                // One option is (inner width - gaps) / count wide; the next starts one gap further on
                probe.style.width = `calc((100% - 2 * var(--segmented-padding, 0.25rem) - ${count - 1} * var(--segmented-gap, 0px)) / ${count})`;
                probe.style.transform = `translateX(calc(${count - 1} * (100% + var(--segmented-gap, 0px))))`;
                expect(style.width).toContain(`/ ${count})`);
                expect(style.transform).toContain(`${count - 1} *`);
                expect(style.width).toBe(probe.style.width);
                expect(style.transform).toBe(probe.style.transform);
            }
        });

        it("should be placed from the padding variable, leaving today's inset by default", () => {
            const indicator = mountControl("small").get("[data-testid='segmented-indicator']");

            expect(indicator.attributes("style")).toContain("left: var(--segmented-padding, 0.25rem)");
            expect(indicator.attributes("style")).toContain("top: var(--segmented-padding, 0.25rem)");
        });

        it("should not render without a matching value", () => {
            const wrapper = mountControl("huge");

            expect(wrapper.find("[data-testid='segmented-indicator']").exists()).toBe(false);
        });
    });
});
