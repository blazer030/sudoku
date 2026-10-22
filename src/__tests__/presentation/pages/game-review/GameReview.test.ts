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

    it("should describe an erase step in Traditional Chinese with the same verb as its label", async () => {
        const wrapper = await mountReview({ action: "erase" });

        i18n.global.locale.value = "zh-Hant";
        await nextTick();

        expect(wrapper.find("[data-testid='review-action']").text()).toBe("擦除");
        expect(wrapper.find("[data-testid='review-explanation']").text()).toBe("擦除第 1 列第 2 欄");
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

    it("should pin the step panel below the area that scrolls the header, summary and board", async () => {
        const wrapper = await mountReview({ nextClicks: 0 });

        // The page clips at its own height; only the area above the panel scrolls
        const page = wrapper.element as HTMLElement;
        expect(page.classList).toContain("h-full");
        expect(page.classList).toContain("flex-col");
        expect(page.classList).not.toContain("overflow-y-auto");

        const scrollArea = wrapper.get("[data-testid='review-scroll-area']");
        expect(scrollArea.element.parentElement).toBe(page);
        expect(scrollArea.classes()).toEqual(expect.arrayContaining(["flex-1", "min-h-0", "overflow-y-auto"]));
        expect(scrollArea.find("[data-testid='review-back-button']").exists()).toBe(true);
        expect(scrollArea.find("[data-testid='review-board']").exists()).toBe(true);
        expect(scrollArea.find("[data-testid='review-panel']").exists()).toBe(false);

        // The panel follows the scroll area as a sibling that never shrinks
        const panelDock = wrapper.get("[data-testid='review-panel-dock']");
        expect(panelDock.element.parentElement).toBe(page);
        expect(panelDock.element.previousElementSibling).toBe(scrollArea.element);
        expect(panelDock.classes()).toContain("shrink-0");
        expect(panelDock.find("[data-testid='review-panel']").exists()).toBe(true);
    });

    describe("keeping the changed cell in view", () => {
        // The scroll area shows y 0–400 and its sticky header covers y 0–68
        const SCROLL_AREA = { top: 0, bottom: 400 };
        const HEADER = { top: 0, bottom: 68 };
        let scrollBy: ReturnType<typeof vi.fn>;

        const placeChangedCell = (cell: { top: number; bottom: number }) => {
            const rects: Record<string, { top: number; bottom: number }> = {
                "review-scroll-area": SCROLL_AREA,
                "review-header": HEADER,
                "review-cell-0-1": cell,
            };
            // Every other cell sits far below the fold, so only the changed one may be chased
            vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
                const rect = rects[this.dataset.testid ?? ""] ?? { top: 900, bottom: 930 };
                return { ...rect, left: 0, right: 0, width: 0, height: rect.bottom - rect.top, x: 0, y: rect.top } as DOMRect;
            });
        };

        const stubReducedMotion = (reduce: boolean) => {
            vi.stubGlobal("matchMedia", (query: string) => ({
                matches: reduce && query === "(prefers-reduced-motion: reduce)",
                media: query,
            }));
        };

        beforeEach(() => {
            scrollBy = vi.fn();
            Object.defineProperty(HTMLElement.prototype, "scrollBy", { value: scrollBy, configurable: true, writable: true });
            stubReducedMotion(false);
        });

        afterEach(() => {
            Reflect.deleteProperty(HTMLElement.prototype, "scrollBy");
            vi.unstubAllGlobals();
            vi.restoreAllMocks();
        });

        it("should scroll a changed cell hidden below the scroll area up into view, clear of the edge", async () => {
            placeChangedCell({ top: 420, bottom: 450 });

            const wrapper = await mountReview({ nextClicks: 1 });

            expect(wrapper.find("[data-testid='review-action']").text()).toBe("Fill");
            // 50px to bring its bottom edge in, and 8px of room past the edge
            expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ top: 58, behavior: "smooth" });
        });

        it("should scroll a changed cell hidden behind the sticky header down into view", async () => {
            placeChangedCell({ top: 40, bottom: 70 });

            await mountReview({ nextClicks: 1 });

            expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ top: -36, behavior: "smooth" });
        });

        it("should not scroll when the changed cell is already in view", async () => {
            placeChangedCell({ top: 200, bottom: 230 });

            await mountReview({ nextClicks: 1 });

            expect(scrollBy).not.toHaveBeenCalled();
        });

        it.each(["autoNotes", "undo"] as const)("should not scroll for a step that changed no single cell (%s)", async (action) => {
            placeChangedCell({ top: 420, bottom: 450 });

            await mountReview({ action, nextClicks: 1 });

            expect(scrollBy).not.toHaveBeenCalled();
        });

        it("should not scroll for the initial or final board", async () => {
            placeChangedCell({ top: 420, bottom: 450 });

            const wrapper = await mountReview({ nextClicks: 0 });
            await wrapper.find("[data-testid='review-dot-2']").trigger("click");

            expect(wrapper.find("[data-testid='review-action']").text()).toBe("Gave Up");
            expect(scrollBy).not.toHaveBeenCalled();
        });

        it("should jump instead of gliding when the user asks for reduced motion", async () => {
            stubReducedMotion(true);
            placeChangedCell({ top: 420, bottom: 450 });

            await mountReview({ nextClicks: 1 });

            expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ top: 58, behavior: "instant" });
        });
    });

    it("should show a board of cells that are not buttons", async () => {
        const wrapper = await mountReview({ nextClicks: 0 });

        expect(wrapper.findAll("[data-testid^='review-cell-'][role='button']")).toHaveLength(0);
    });
});
