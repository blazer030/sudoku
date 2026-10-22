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
            probe.style.width = "calc((100% - 0.5rem) / 3)";
            expect(indicator.style.transform).toBe("translateX(200%)");
            expect(indicator.style.width).toBe(probe.style.width);
        });

        it("should move when the value changes", async () => {
            const wrapper = mountControl("large");

            await wrapper.setProps({ modelValue: "small" });

            expect(wrapper.get("[data-testid='segmented-indicator']").attributes("style")).toContain("transform: translateX(0%)");
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

        it("should not render without a matching value", () => {
            const wrapper = mountControl("huge");

            expect(wrapper.find("[data-testid='segmented-indicator']").exists()).toBe(false);
        });
    });
});
