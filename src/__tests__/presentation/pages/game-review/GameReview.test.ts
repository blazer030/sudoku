import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { nextTick } from "vue";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, getActivePinia, setActivePinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import GameReview from "@/presentation/pages/game-review/GameReview.vue";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { i18n } from "@/presentation/i18n";
import type { GameStep } from "@/domain/game/GameStep";

const emptyBoard = () => Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => ({ clue: 0, entry: 0, notes: [] as number[] }))
);

const fillStep: GameStep = {
    board: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, () => ({ entry: 0, notes: [] as number[] }))
    ),
    action: "fill",
    row: 0,
    column: 1,
    value: 5,
};

const mountReview = async (options: { action?: GameStep["action"]; completed?: boolean; nextClicks?: number } = {}) => {
    const { action = "fill", completed = false, nextClicks = 1 } = options;
    setActivePinia(createPinia());
    useStatisticsStore().recordGame({
        difficulty: "hard",
        elapsedSeconds: 100,
        completed,
        replay: { initialBoard: emptyBoard(), steps: [{ ...fillStep, action }] },
    });
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div />" } }],
    });
    const pinia = getActivePinia();
    if (pinia === undefined) throw new Error("pinia not active");
    const wrapper = mount(GameReview, {
        props: { index: "0" },
        global: { plugins: [router, pinia] },
    });
    await flushPromises();
    for (let click = 0; click < nextClicks; click++) {
        await wrapper.find("[data-testid='review-next-step-button']").trigger("click");
    }
    return wrapper;
};

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
});

const boldTexts = (wrapper: Awaited<ReturnType<typeof mountReview>>) =>
    wrapper.findAll(".font-semibold").map((element) => element.text());

describe("GameReview", () => {
    it("should describe a fill step in English with bold numbers", async () => {
        const wrapper = await mountReview();

        expect(wrapper.text()).toContain("Filled 5 in Row 1, Col 2");
        expect(boldTexts(wrapper)).toEqual(expect.arrayContaining(["5", "1", "2"]));
    });

    it("should describe a fill step in Traditional Chinese with bold numbers", async () => {
        const wrapper = await mountReview();

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).toContain("在第 1 列第 2 欄填入 5");
        expect(wrapper.text()).toContain("遊戲回顧");
        expect(boldTexts(wrapper)).toEqual(expect.arrayContaining(["5", "1", "2"]));
    });

    it("should describe a hint step in Traditional Chinese", async () => {
        const wrapper = await mountReview({ action: "hint" });

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).toContain("在第 1 列第 2 欄揭示 5");
    });

    it("should label the final step of a completed game in Traditional Chinese", async () => {
        const wrapper = await mountReview({ completed: true, nextClicks: 2 });

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.text()).toContain("已完成");
    });
});
