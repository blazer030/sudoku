import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent } from "vue";
import { createMemoryHistory, createRouter } from "vue-router";
import GameCompleteModal from "@/presentation/themes/classic/components/GameCompleteModal.vue";
import { provideGameCompleteModal } from "@/presentation/themes/classic/components/useGameCompleteModal";
import type { GameCompleteParams } from "@/presentation/themes/classic/components/useGameCompleteModal";

const mountModal = (overrides: Partial<GameCompleteParams> = {}) => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div/>" } }],
    });
    const Host = defineComponent({
        components: { GameCompleteModal },
        setup() {
            const modal = provideGameCompleteModal();
            void modal.open({ elapsedSeconds: 120, difficulty: "easy", hintsUsed: 0, ...overrides });
            return {};
        },
        template: "<GameCompleteModal />",
    });
    return mount(Host, { global: { plugins: [router] } });
};

describe("GameCompleteModal", () => {
    it("should display Hints stat with recordedUsed count", () => {
        const wrapper = mountModal({ hintsUsed: 2 });

        expect(wrapper.text()).toContain("2");
        expect(wrapper.text()).toContain("Hints");
    });

    it("should display 0 hints when no hints used", () => {
        const wrapper = mountModal({ hintsUsed: 0 });

        expect(wrapper.find("[data-testid='hints-count']").text()).toBe("0");
    });
});
