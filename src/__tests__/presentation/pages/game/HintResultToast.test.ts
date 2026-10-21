import { mount } from "@vue/test-utils";
import HintResultToast from "@/presentation/pages/game/components/HintResultToast.vue";

describe("HintResultToast", () => {
    it("should use the toast surface tokens so dark mode gets a dark toast", () => {
        const wrapper = mount(HintResultToast, { props: { outcome: { cell: { row: 0, column: 2 }, value: 4 } } });

        const toast = wrapper.get("[data-testid='hint-result-toast']");
        expect(toast.classes()).toContain("bg-toast");
        expect(toast.classes()).toContain("text-on-toast");
    });
});
