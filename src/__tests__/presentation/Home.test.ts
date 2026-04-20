import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createRouter, createMemoryHistory } from "vue-router";
import Home from "@/presentation/pages/home/Home.vue";
import { ROUTER_PATH } from "@/router";
import { useGameStore } from "@/stores/gameStore";
import { hasSavedGame, saveGame } from "@/application/GameStorage";
import { getGameHistory } from "@/application/Statistics";
import type { CellState, GameState } from "@/application/GameState";
import { knownAnswer, knownPuzzle } from "@/__tests__/fixtures/knownPuzzle";

vi.mock("@/application/PuzzleGenerationService", () => ({
    generatePuzzleAsync: vi.fn(() => Promise.resolve({
        puzzle: knownPuzzle.map(row => [...row]),
        answer: knownAnswer.map(row => [...row]),
    })),
}));

vi.mock("@/presentation/components/puzzle-loader/usePuzzleLoader", async () => {
    const { ref } = await import("vue");
    return {
        usePuzzleLoader: () => ({
            visible: ref(false),
            runWithLoader: <T,>(task: () => Promise<T>) => task(),
        }),
    };
});

const createTestRouter = () => {
    return createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: Home },
            { path: "/game", component: { template: "<div>Game</div>" } },
            { path: "/solver", component: { template: "<div>Solver</div>" } },
        ],
    });
};

const mountHome = () => {
    const router = createTestRouter();
    const pinia = createPinia();
    const wrapper = mount(Home, {
        global: { plugins: [router, pinia] },
    });
    return { wrapper, router, pinia };
};

const dummySave: GameState = {
    difficulty: "easy",
    answer: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0)),
    cells: Array.from({ length: 9 }, () =>
        Array.from({ length: 9 }, (): CellState => ({ clue: 0, entry: 0, notes: [] }))
    ),
    elapsedSeconds: 204,
    completed: false,
    hintsUsed: 0,
};

afterEach(() => {
    localStorage.clear();
});

describe("Home", () => {
    it("should navigate to game page when clicking New Game button without saved game", async () => {
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should show Easy as default selected difficulty", () => {
        const { wrapper } = mountHome();
        const easyBtn = wrapper.find("[data-testid='difficulty-easy']");

        expect(easyBtn.classes()).toContain("bg-primary");
    });

    it("should select difficulty when clicking pill", async () => {
        const { wrapper } = mountHome();

        await wrapper.find("[data-testid='difficulty-medium']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-medium']").classes()).toContain("bg-primary");
        expect(wrapper.find("[data-testid='difficulty-easy']").classes()).not.toContain("bg-primary");

        await wrapper.find("[data-testid='difficulty-hard']").trigger("click");
        expect(wrapper.find("[data-testid='difficulty-hard']").classes()).toContain("bg-primary");
        expect(wrapper.find("[data-testid='difficulty-medium']").classes()).not.toContain("bg-primary");
    });

    it("should show Continue button when saved game exists", () => {
        saveGame(dummySave);
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='continue-button']").exists()).toBe(true);
    });

    it("should not show Continue button when no saved game exists", () => {
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='continue-button']").exists()).toBe(false);
    });

    it("should display saved elapsed time on Continue button", () => {
        saveGame(dummySave);
        const { wrapper } = mountHome();

        expect(wrapper.find("[data-testid='continue-button']").text()).toContain("03:24");
    });

    it("should navigate to game page when clicking Continue", async () => {
        saveGame(dummySave);
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='continue-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should set difficulty in store when starting game", async () => {
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='difficulty-medium']").trigger("click");
        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.difficulty).toBe("medium");
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should load saved game into store before navigating on Continue click", async () => {
        saveGame(dummySave);
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='continue-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.hasActiveGame).toBe(true);
        expect(gameStore.elapsedSeconds).toBe(204);
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    it("should navigate to solver walkthrough when clicking Walkthrough button", async () => {
        const { wrapper, router } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='walkthrough-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.solverWalkthrough);
    });

    it("should create game in store before navigating on New Game click", async () => {
        const { wrapper, router, pinia } = mountHome();
        await router.push("/");
        await router.isReady();

        await wrapper.find("[data-testid='new-game-button']").trigger("click");
        await flushPromises();

        const gameStore = useGameStore(pinia);
        expect(gameStore.hasActiveGame).toBe(true);
        expect(gameStore.sudoku).not.toBeNull();
        expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
    });

    describe("New Game Confirm Dialog", () => {
        it("should show confirm dialog when clicking New Game with saved game", async () => {
            saveGame(dummySave);
            const { wrapper } = mountHome();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");

            expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='new-game-confirm-dialog']").text()).toContain("Give Up Current Game?");
        });

        it("should record gave up and start new game when clicking Give Up & Start New", async () => {
            saveGame(dummySave);
            const { wrapper, router, pinia } = mountHome();
            await router.push("/");
            await router.isReady();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await wrapper.find("[data-testid='give-up-and-start-new-button']").trigger("click");
            await flushPromises();

            const gameStore = useGameStore(pinia);
            expect(gameStore.hasActiveGame).toBe(true);
            const history = getGameHistory();
            expect(history).toHaveLength(1);
            expect(history[0].completed).toBe(false);
            expect(history[0].difficulty).toBe("easy");
            expect(hasSavedGame()).toBe(false);
            expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
        });

        it("should close dialog when clicking Cancel", async () => {
            saveGame(dummySave);
            const { wrapper } = mountHome();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(true);

            await wrapper.find("[data-testid='new-game-cancel-button']").trigger("click");

            expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(false);
        });

        it("should start game directly when no saved game exists", async () => {
            const { wrapper, router } = mountHome();
            await router.push("/");
            await router.isReady();

            await wrapper.find("[data-testid='new-game-button']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='new-game-confirm-dialog']").exists()).toBe(false);
            expect(router.currentRoute.value.path).toBe(ROUTER_PATH.game);
        });
    });
});
