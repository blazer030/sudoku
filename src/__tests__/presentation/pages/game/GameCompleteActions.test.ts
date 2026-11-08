import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { fillAllButLastKnownCell, knownAnswer, knownPuzzle, lastKnownEmptyCell } from "@/__tests__/fixtures/knownPuzzle";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";
import { useSettingsStore } from "@/stores/settingsStore";

vi.mock("@/application/puzzleGeneration/PuzzleGenerationService", () => ({
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

const mountGameRoute = async (difficulty: Difficulty = "easy", visited: readonly string[] = ["/"]) => {
    localStorage.setItem("sudoku-settings", JSON.stringify({ motionEffects: false, autoNotesAtStart: false }));
    const pinia = createPinia();
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [
            { path: "/", component: { template: "<div>Home</div>" } },
            { path: "/lessons", component: { template: "<div>Lessons</div>" } },
            { path: "/lessons/:lessonId", component: { template: "<div>Lesson</div>" } },
            { path: "/game", component: Game },
            { path: "/game-review/:index", component: { template: "<div>Review</div>" } },
        ],
    });
    const gameStore = useGameStore(pinia);
    await gameStore.startNewGame(difficulty);
    // Every test finishes the game, so it starts one move from the end
    if (gameStore.sudoku !== null) fillAllButLastKnownCell(gameStore.sudoku);
    for (const path of visited) await router.push(path);
    await router.push("/game");
    await router.isReady();
    const wrapper = mount({ template: "<router-view />" }, { global: { plugins: [pinia, router] } });
    await flushPromises();
    return { wrapper, router, gameStore, statisticsStore: useStatisticsStore(pinia) };
};

type GameWrapper = Awaited<ReturnType<typeof mountGameRoute>>["wrapper"];

// Plays the finishing move through the digit pad, digit first
const completeKnownGame = async (wrapper: GameWrapper) => {
    const { row, column, value } = lastKnownEmptyCell;
    const numberButton = wrapper.find(`[data-testid='number-${value}']`);
    await numberButton.trigger("click");
    await wrapper.find(`[data-testid='cell-${row}-${column}']`).trigger("click");
    await numberButton.trigger("click");
    await flushPromises();
};

afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
});

describe("completion actions", () => {
    it("should start Play Again with notes when the auto notes setting is on", async () => {
        const { wrapper, gameStore } = await mountGameRoute("medium");
        useSettingsStore().setAutoNotesAtStart(true);

        await completeKnownGame(wrapper);
        await wrapper.get("[data-testid='play-again-button']").trigger("click");
        await flushPromises();

        expect([...(gameStore.sudoku?.puzzle[0][2].notes ?? [])].sort()).toEqual([1, 2, 4]);
    });

    it("should start a fresh game at the same difficulty on Play Again", async () => {
        const { wrapper, router, gameStore } = await mountGameRoute("medium");
        await wrapper.find("[data-testid='hint-button']").trigger("click");
        await wrapper.find("[data-testid='hint-check-conflicts']").trigger("click");
        await completeKnownGame(wrapper);

        await wrapper.find("[data-testid='play-again-button']").trigger("click");
        await flushPromises();

        expect(wrapper.find("[data-testid='game-complete-modal']").exists()).toBe(false);
        expect(wrapper.find("[data-testid='timer']").text()).toBe("00:00");
        expect(wrapper.find("[data-testid='cell-0-2']").text()).toBe("");
        expect(gameStore.difficulty).toBe("medium");
        expect(router.currentRoute.value.path).toBe("/game");
        await wrapper.find("[data-testid='back-button']").trigger("click");
        await wrapper.find("[data-testid='give-up-and-leave-button']").trigger("click");
        await flushPromises();
        const { history } = useStatisticsStore();
        expect(history[history.length - 1].hintsUsed).toBe(0);
    });

    it("should guard leaving the new game after Play Again", async () => {
        const { wrapper, router } = await mountGameRoute();
        await completeKnownGame(wrapper);
        await wrapper.find("[data-testid='play-again-button']").trigger("click");
        await flushPromises();

        await router.push("/");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/game");
        expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);
    });

    it("should state one hint on the completion screen and in the recorded game", async () => {
        const { wrapper, statisticsStore } = await mountGameRoute();
        await wrapper.get("[data-testid='hint-button']").trigger("click");
        await wrapper.get("[data-testid='hint-check-conflicts']").trigger("click");
        await flushPromises();

        await completeKnownGame(wrapper);

        expect(wrapper.get("[data-testid='hints-count']").text()).toBe("1");
        expect(statisticsStore.history[statisticsStore.history.length - 1].hintsUsed).toBe(1);
    });

    it("should open the review of the game just finished", async () => {
        const { wrapper, router, statisticsStore } = await mountGameRoute();
        statisticsStore.recordGame({ difficulty: "easy", elapsedSeconds: 100, completed: true });
        statisticsStore.recordGame({ difficulty: "easy", elapsedSeconds: 200, completed: false });
        await completeKnownGame(wrapper);

        await wrapper.find("[data-testid='review-game-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/game-review/2");
    });

    it("should go back home", async () => {
        const { wrapper, router } = await mountGameRoute();
        await completeKnownGame(wrapper);

        await wrapper.find("[data-testid='back-to-home-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/");
    });

    it.each([
        ["a lesson", ["/", "/lessons", "/lessons/nakedSingle"]],
        ["the lesson list", ["/", "/lessons"]],
    ])("should go home from a game started from %s, not back to it", async (_, visited) => {
        const { wrapper, router } = await mountGameRoute("easy", visited);
        await completeKnownGame(wrapper);

        await wrapper.find("[data-testid='back-to-home-button']").trigger("click");
        await flushPromises();

        expect(router.currentRoute.value.path).toBe("/");
    });

    it("should go back in the history when Home is the page before, leaving no extra entry", async () => {
        const { wrapper, router } = await mountGameRoute();
        await completeKnownGame(wrapper);
        router.options.history.state.back = "/";
        const back = vi.spyOn(router, "back");

        await wrapper.find("[data-testid='back-to-home-button']").trigger("click");

        expect(back).toHaveBeenCalledOnce();
    });
});
