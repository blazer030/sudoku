import { mount } from "@vue/test-utils";
import GameToast from "@/presentation/pages/game/components/GameToast.vue";

describe("GameToast", () => {
    it("should use the toast surface tokens so dark mode gets a dark toast", () => {
        const wrapper = mount(GameToast, { props: { content: { kind: "randomReveal", outcome: { cell: { row: 0, column: 2 }, value: 4 } } } });

        const toast = wrapper.get("[data-testid='game-toast']");
        expect(toast.classes()).toContain("bg-toast");
        expect(toast.classes()).toContain("text-on-toast");
    });

    it("should balance a long message over its lines", () => {
        const wrapper = mount(GameToast, { props: { content: { kind: "longPressTip" } } });

        expect(wrapper.get("[data-testid='game-toast']").classes()).toContain("text-balance");
    });
});
