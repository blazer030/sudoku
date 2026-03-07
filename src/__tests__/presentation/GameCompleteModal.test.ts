import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import GameCompleteModal from "@/presentation/components/game-complete-modal/GameCompleteModal.vue";

function mountModal(props: Record<string, unknown> = {}) {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div/>" } }],
    });
    return mount(GameCompleteModal, {
        props: { elapsedSeconds: 120, difficulty: "easy", hintsUsed: 0, ...props },
        global: { plugins: [router] },
    });
}

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

// 完成時 recordGameResult 包含 hintsUsed 的測試在 Game.test.ts 中已覆蓋

