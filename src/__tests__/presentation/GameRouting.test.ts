import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { knownAnswer, knownPuzzle, createKnownSudoku } from "@/__tests__/fixtures/knownPuzzle";
import { useGameStore } from "@/stores/gameStore";
import { getGameHistory } from "@/application/Statistics";
import { hasSavedGame, loadGame } from "@/application/GameStorage";

const mountWithRouterView = async () => {
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
    gameStore.setDifficulty("easy");
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
            const { wrapper, router } = await mountWithRouterView();

            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (knownPuzzle[row][column] === 0) {
                        const value = knownAnswer[row][column];
                        const numberButton = wrapper.find(`[data-testid='number-${value}']`);
                        await numberButton.trigger("click");
                        await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
                        await numberButton.trigger("click");
                    }
                }
            }
            expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(true);

            await router.push("/");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe("/");
        });
    });

    describe("Leave Game Dialog", () => {
        it("should show leave game dialog when clicking Back button", async () => {
            const { wrapper } = await mountWithRouterView();

            await wrapper.find("[data-testid='back-button']").trigger("click");

            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='leave-game-dialog']").text()).toContain("Leave Game?");
        });

        it("should save game when clicking Save & Leave", async () => {
            const { wrapper } = await mountWithRouterView();

            await wrapper.find("[data-testid='cell-0-2']").trigger("click");
            await wrapper.find("[data-testid='number-4']").trigger("click");

            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='save-and-leave-button']").trigger("click");
            await flushPromises();

            expect(hasSavedGame()).toBe(true);
            expect(loadGame()?.cells[0][2].entry).toBe(4);
        });

        it("should record gave up and delete save when clicking Give Up & Leave", async () => {
            const { wrapper } = await mountWithRouterView();

            await wrapper.find("[data-testid='back-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-leave-button']").trigger("click");
            await flushPromises();

            const history = getGameHistory();
            expect(history).toHaveLength(1);
            expect(history[0].completed).toBe(false);
            expect(history[0].difficulty).toBe("easy");
            expect(hasSavedGame()).toBe(false);
        });

        it("should close dialog when clicking Cancel", async () => {
            const { wrapper } = await mountWithRouterView();

            await wrapper.find("[data-testid='back-button']").trigger("click");
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);

            await wrapper.find("[data-testid='leave-cancel-button']").trigger("click");

            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
        });
    });
});
