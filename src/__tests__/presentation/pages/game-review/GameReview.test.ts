import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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
        await wrapper.find("[data-testid='review-next']").trigger("click");
    }
    return wrapper;
};

beforeEach(() => {
    localStorage.clear();
});

afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
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

    it("should tag each position with its stage or action", async () => {
        const initial = await mountReview({ nextClicks: 0 });
        expect(initial.find("[data-testid='review-action']").text()).toBe("Initial Board");
        expect(initial.find("[data-testid='review-explanation']").text()).toBe("The board when the game began");

        const fill = await mountReview({ nextClicks: 1 });
        expect(fill.find("[data-testid='review-action']").text()).toBe("Fill");
        i18n.global.locale.value = "zh-Hant";
        await nextTick();
        expect(fill.find("[data-testid='review-action']").text()).toBe("填入");
        i18n.global.locale.value = "en";
        await nextTick();

        const completed = await mountReview({ completed: true, nextClicks: 2 });
        expect(completed.find("[data-testid='review-action']").text()).toBe("Completed");

        const gaveUp = await mountReview({ completed: false, nextClicks: 2 });
        expect(gaveUp.find("[data-testid='review-action']").text()).toBe("Gave Up");
    });

    it("should outline the cell the step changed", async () => {
        const wrapper = await mountReview({ nextClicks: 1 });

        expect(wrapper.find("[data-testid='review-cell-0-1']").classes()).toContain("ring-primary");
        expect(wrapper.find("[data-testid='review-cell-0-0']").classes()).not.toContain("ring-primary");
    });

    it.each(["autoNotes", "undo"] as const)("should not outline any cell for auto notes or undo (%s)", async (action) => {
        const wrapper = await mountReview({ action, nextClicks: 1 });

        const cells = wrapper.findAll("[data-testid^='review-cell-']");
        expect(cells).toHaveLength(81);
        expect(cells.filter((cell) => cell.classes().includes("ring-primary"))).toHaveLength(0);
    });

    it("should count positions with dots for a short game", async () => {
        const wrapper = await mountReview({ nextClicks: 1 });

        for (let index = 0; index < 3; index++) {
            expect(wrapper.find(`[data-testid='review-dot-${index}']`).exists()).toBe(true);
        }
        expect(wrapper.find("[data-testid='review-dot-3']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='review-dot-1']").attributes("aria-current")).toBe("step");
    });

    it("should auto-play to the end and stop", async () => {
        vi.useFakeTimers({ shouldAdvanceTime: true });
        const wrapper = await mountReview({ nextClicks: 0 });

        await wrapper.find("[data-testid='review-play']").trigger("click");

        await vi.advanceTimersByTimeAsync(800);
        expect(wrapper.find("[data-testid='review-action']").text()).toBe("Fill");

        await vi.advanceTimersByTimeAsync(800);
        expect(wrapper.find("[data-testid='review-action']").text()).toBe("Gave Up");
        expect(wrapper.find("[data-testid='review-play']").attributes("aria-label")).toBe("Play");
    });

    it("should keep the seek bar and play button inside the panel", async () => {
        const wrapper = await mountReview({ nextClicks: 0 });

        const panel = wrapper.find("[data-testid='review-panel']");
        expect(panel.find("[data-testid='review-progress-bar']").exists()).toBe(true);
        expect(panel.find("[data-testid='review-play']").exists()).toBe(true);
    });

    it("should show a board of cells that are not buttons", async () => {
        const wrapper = await mountReview({ nextClicks: 0 });

        expect(wrapper.findAll("[data-testid^='review-cell-'][role='button']")).toHaveLength(0);
    });
});
