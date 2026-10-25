import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { createKnownSudoku, fillAllButLastKnownCell, lastKnownEmptyCell } from "@/__tests__/fixtures/knownPuzzle";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { STYLE_MOMENTS } from "@/presentation/components/style-moments/styleMoments";

const mountWithRouterView = async ({ nearlySolved = false, fromHome = false } = {}) => {
    const pinia = createPinia();
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/game", component: Game },
            { path: "/", component: { template: "<div>Home</div>" } },
        ],
    });
    const gameStore = useGameStore(pinia);
    gameStore.sudoku = createKnownSudoku();
    if (nearlySolved) fillAllButLastKnownCell(gameStore.sudoku);
    gameStore.setDifficulty("easy");
    if (fromHome) await router.push("/");
    await router.push("/game");
    await router.isReady();
    const wrapper = mount(
        { template: "<router-view />" },
        { global: { plugins: [pinia, router] } },
    );
    await flushPromises();
    return { wrapper, router, gameStore };
};

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    localStorage.clear();
});

describe("Game Routing", () => {
    describe("Route Leave Guard", () => {
        it("should block route leave and show LeaveGameDialog when game is in progress", async () => {
            const { wrapper, router } = await mountWithRouterView();

            await router.push("/");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe("/game");
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);
        });

        it("should allow route leave when game is completed", async () => {
            localStorage.setItem("sudoku-settings", JSON.stringify({ motionEffects: false }));
            const { wrapper, router } = await mountWithRouterView({ nearlySolved: true });

            const { row, column, value } = lastKnownEmptyCell;
            const numberButton = wrapper.find(`[data-testid='number-${value}']`);
            await numberButton.trigger("click");
            await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
            await numberButton.trigger("click");
            expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);

            await router.push("/");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe("/");
        });
    });

    describe("Leaving mid-celebration", () => {
        it("should leave at once from the header Back, with no leave dialog, no second record and no late dialog", async () => {
            const { wrapper, router } = await mountWithRouterView({ nearlySolved: true, fromHome: true });
            vi.useFakeTimers();
            const { row, column, value } = lastKnownEmptyCell;
            const numberButton = wrapper.find(`[data-testid='number-${value}']`);
            await numberButton.trigger("click");
            await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
            await numberButton.trigger("click");
            expect(wrapper.find("[data-testid='game-board']").attributes("data-celebration")).toBe("playing");

            await wrapper.find("[data-testid='back-button']").trigger("click");
            await vi.advanceTimersByTimeAsync(0);
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
            await vi.waitFor(() => { expect(router.currentRoute.value.path).toBe("/"); });

            await vi.advanceTimersByTimeAsync(STYLE_MOMENTS.minimal.celebrationBoardMs * 2);
            expect(useStatisticsStore().history).toHaveLength(1);
            expect(useStatisticsStore().history[0].completed).toBe(true);
            expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(false);
        });
    });

    describe("Leave Game Dialog", () => {
        it("should save game when clicking Save & Leave", async () => {
            const { wrapper } = await mountWithRouterView();

            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");

            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();

            const saved = useGameStore().savedGame;
            expect(saved).not.toBeNull();
            expect(saved?.cells[0][2].entry).toBe(4);
        });

        it("should record gave up and delete save when clicking Give Up This Game", async () => {
            const { wrapper } = await mountWithRouterView();

            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-leave-button']").trigger("click");
            await flushPromises();

            const history = useStatisticsStore().history;
            expect(history).toHaveLength(1);
            expect(history[0].completed).toBe(false);
            expect(history[0].difficulty).toBe("easy");
            expect(useGameStore().savedGame).toBeNull();
        });
    });
});
