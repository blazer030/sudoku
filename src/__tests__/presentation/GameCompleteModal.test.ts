import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import GameCompleteModal from "@/presentation/pages/game/components/GameCompleteModal.vue";
import { provideGameCompleteModal } from "@/presentation/pages/game/components/useGameCompleteModal";
import type { GameCompleteParams } from "@/presentation/pages/game/components/useGameCompleteModal";

const mountModal = (overrides: Partial<GameCompleteParams> = {}) => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div/>" } }],
    });
    const Host = defineComponent({
        components: { GameCompleteModal },
        setup() {
            const modal = provideGameCompleteModal();
            void modal.open({ elapsedSeconds: 120, difficulty: "easy", hintsUsed: 0, isNewRecord: false, ...overrides });
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

    it("should render the stat labels in Traditional Chinese", async () => {
        const wrapper = mountModal();
        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).toContain("時間");
        expect(wrapper.find("[data-testid='complete-difficulty']").text()).toBe("簡單");
        expect(wrapper.text()).toContain("提示");
        expect(wrapper.text()).not.toContain("Congratulations!");
    });

    it("should show the difficulty as a tag under the title, not as a stat", () => {
        const wrapper = mountModal({ difficulty: "medium" });

        expect(wrapper.find("[data-testid='complete-difficulty']").text()).toBe("Medium");
        const stats = wrapper.find("[data-testid='complete-stats']");
        expect(stats.classes()).toContain("grid-cols-2");
        expect(stats.text()).not.toContain("Medium");
        expect(stats.text()).not.toContain("Difficulty");
    });

    it("should celebrate a new record", async () => {
        const wrapper = mountModal({ isNewRecord: true });

        expect(wrapper.find("[data-testid='new-record-badge']").text()).toBe("New record!");
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        expect(wrapper.find("[data-testid='new-record-badge']").text()).toBe("新紀錄！");
    });

    it("should not show the record badge otherwise", () => {
        const wrapper = mountModal({ isNewRecord: false });

        expect(wrapper.find("[data-testid='new-record-badge']").exists()).toBe(false);
    });

    it("should display 0 hints when no hints used", () => {
        const wrapper = mountModal({ hintsUsed: 0 });

        expect(wrapper.find("[data-testid='hints-count']").text()).toBe("0");
    });
});
