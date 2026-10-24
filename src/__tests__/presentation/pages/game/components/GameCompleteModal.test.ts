import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia, type Pinia } from "pinia";
import { useSettingsStore } from "@/stores/settingsStore";
import { defineComponent, h, nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import { createMemoryHistory, createRouter } from "vue-router";
import GameCompleteModal from "@/presentation/pages/game/components/GameCompleteModal.vue";
import { provideGameCompleteModal } from "@/presentation/pages/game/components/useGameCompleteModal";
import type { GameCompleteParams } from "@/presentation/pages/game/components/useGameCompleteModal";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";
import { STYLE_IDS } from "@/theme/themeIds";

const mountModal = (overrides: Partial<GameCompleteParams> = {}, onResult: (result: unknown) => void = () => { /* ignored */ }, pinia: Pinia = createPinia()) => {
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div/>" } }],
    });
    const Host = defineComponent({
        components: { GameCompleteModal },
        setup() {
            const modal = provideGameCompleteModal();
            void modal.open({ elapsedSeconds: 120, difficulty: "easy", hintsUsed: 0, isNewRecord: false, still: false, ...overrides }).then(onResult);
            return {};
        },
        template: "<GameCompleteModal />",
    });
    return mount(Host, { global: { plugins: [router, pinia] } });
};

// Styles that draw decoration over the scene; the others leave it to their skin
const STYLES_WITH_CELEBRATION = STYLE_IDS.flatMap((style) => {
    const celebration = STYLE_MOMENTS[style].celebration;
    return celebration === null ? [] : [{ style, celebration }];
});

describe("GameCompleteModal", () => {
    it.each([2, 0])("should show %i hints used in the Hints stat", (hintsUsed) => {
        const wrapper = mountModal({ hintsUsed });

        expect(wrapper.get("[data-testid='hints-count']").text()).toBe(String(hintsUsed));
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

    it("should celebrate a new record", () => {
        const wrapper = mountModal({ isNewRecord: true });

        expect(wrapper.find("[data-testid='new-record-badge']").text()).toBe("New record!");
    });

    it("should tag the card, the trophy, the difficulty and the record badge for styles to decorate", () => {
        const wrapper = mountModal({ isNewRecord: true });

        expect(wrapper.find("[data-testid='complete-card']").attributes("data-skin")).toBe("card celebration");
        expect(wrapper.find("[data-testid='complete-trophy']").attributes("data-skin")).toBe("trophy");
        expect(wrapper.find("[data-testid='complete-difficulty']").attributes("data-skin")).toBe("tag");
        expect(wrapper.find("[data-testid='new-record-badge']").attributes("data-skin")).toBe("tag new-record");
    });

    it.each(STYLES_WITH_CELEBRATION)("should play $style's celebration decoration, or its still end state when asked", ({ style, celebration }) => {
        const pinia = createPinia();
        setActivePinia(pinia);
        useSettingsStore().setStyle(style);
        const stillOf = (still: boolean) => (mountModal({ still }, undefined, pinia).findComponent(celebration).props() as { still: boolean }).still;

        expect(stillOf(false)).toBe(false);
        expect(stillOf(true)).toBe(true);
    });

    it("should tag the title for styles to decorate", () => {
        expect(mountModal().find("[data-testid='complete-card'] h2").attributes("data-skin")).toBe("complete-title");
    });

    describe("card decoration", () => {
        const tactile = STYLE_MOMENTS.tactile;
        const CardPieces = defineComponent({
            props: { still: { type: Boolean, required: true } },
            setup: () => () => h("span", { "data-testid": "card-pieces" }),
        });

        afterEach(() => {
            STYLE_MOMENTS.tactile = tactile;
        });

        const mountAs = (still: boolean) => {
            const pinia = createPinia();
            setActivePinia(pinia);
            useSettingsStore().setStyle("tactile");
            return mountModal({ still }, undefined, pinia);
        };

        it("should draw the current style's decoration on the card itself, still when asked", () => {
            STYLE_MOMENTS.tactile = { ...tactile, cardDecoration: CardPieces };

            const card = mountAs(true).get("[data-testid='complete-card']");

            expect(card.find("[data-testid='card-pieces']").exists()).toBe(true);
            expect(card.findComponent(CardPieces).props("still")).toBe(true);
        });

        it("should draw nothing on the card for a style without decoration", () => {
            STYLE_MOMENTS.tactile = { ...tactile, cardDecoration: null };

            expect(mountAs(false).find("[data-testid='card-pieces']").exists()).toBe(false);
        });
    });

    it("should mark the card still for any style, so it appears without motion", () => {
        const pinia = createPinia();
        setActivePinia(pinia);
        useSettingsStore().setStyle("tactile");

        const card = (still: boolean) => mountModal({ still }, undefined, pinia).find("[data-testid='complete-card']");

        expect(card(true).attributes("data-still")).toBe("");
        expect(card(false).attributes("data-still")).toBeUndefined();
    });

    it("should not show the record badge otherwise", () => {
        const wrapper = mountModal({ isNewRecord: false });

        expect(wrapper.find("[data-testid='new-record-badge']").exists()).toBe(false);
    });

    it("should offer Play Again first, then this game's review and home", () => {
        const wrapper = mountModal();

        expect(wrapper.find("[data-testid='play-again-button']").text()).toBe("Play Again");
        expect(wrapper.find("[data-testid='play-again-button']").classes()).toContain("bg-primary");
        expect(wrapper.find("[data-testid='review-game-button']").text()).toBe("Review This Game");
        expect(wrapper.find("[data-testid='back-to-home-button']").text()).toBe("Back to Home");
    });

    it.each([
        ["play-again-button", "playAgain"],
        ["review-game-button", "review"],
        ["back-to-home-button", "home"],
    ])("should resolve with the action of %s", async (testId, action) => {
        let result: unknown = null;
        const wrapper = mountModal({}, (resolved) => { result = resolved; });

        await wrapper.find(`[data-testid='${testId}']`).trigger("click");
        await flushPromises();

        expect(result).toBe(action);
        expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(false);
    });
});
