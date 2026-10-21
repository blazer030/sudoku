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
});
