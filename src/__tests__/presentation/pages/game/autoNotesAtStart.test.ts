import { afterEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { knownAnswer, knownPuzzle } from "@/__tests__/fixtures/knownPuzzle";
import { summarizeReplay } from "@/application/analytics/summarizeReplay";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";

vi.mock("@/application/puzzleGeneration/PuzzleGenerationService", () => ({
    generatePuzzleAsync: vi.fn(() => Promise.resolve({
        puzzle: knownPuzzle.map(row => [...row]),
        answer: knownAnswer.map(row => [...row]),
    })),
}));

const CELL_WITH_NOTES = "[data-testid='cell-0-2']";

const startGameWithAutoNotes = async () => {
    localStorage.setItem("sudoku-settings", JSON.stringify({ autoNotesAtStart: true, motionEffects: false }));
    const pinia = createPinia();
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div/>" } }, { path: "/game", component: Game }],
    });
    const gameStore = useGameStore(pinia);
    await gameStore.startNewGame("hard");
    await router.push("/");
    await router.push("/game");
    await router.isReady();
    const wrapper = mount({ template: "<router-view />" }, { global: { plugins: [pinia, router] } });
    await flushPromises();
    return { wrapper, statistics: useStatisticsStore(pinia) };
};

afterEach(() => {
    localStorage.clear();
});

describe("a game started with auto notes", () => {
    it("should show the notes when the game opens", async () => {
        const { wrapper } = await startGameWithAutoNotes();

        expect(wrapper.get(CELL_WITH_NOTES).text()).toContain("4");
    });

    it("should keep the notes when Undo is pressed before any move", async () => {
        const { wrapper } = await startGameWithAutoNotes();

        await wrapper.get("[data-testid='undo-button']").trigger("click");

        expect(wrapper.get(CELL_WITH_NOTES).text()).toContain("4");
    });

    it("should hold the notes in the replay's first board and list no auto notes step", async () => {
        const { wrapper, statistics } = await startGameWithAutoNotes();

        await wrapper.get("[data-testid='back-button']").trigger("click");
        await wrapper.get("[data-testid='give-up-and-leave-button']").trigger("click");
        await flushPromises();

        const replay = statistics.history[0].replay;
        expect([...(replay?.initialBoard[0][2].notes ?? [])].sort()).toEqual([1, 2, 4]);
        expect(replay?.steps.map(step => step.action)).toEqual([]);
        expect(statistics.history[0].hintsUsed).toBe(0);
    });

    it("should leave a replay that still gives its undo and wrong-entry counts, and no notes use", async () => {
        const { wrapper, statistics } = await startGameWithAutoNotes();

        await wrapper.get("[data-testid='back-button']").trigger("click");
        await wrapper.get("[data-testid='give-up-and-leave-button']").trigger("click");
        await flushPromises();

        const replay = statistics.history[0].replay;
        if (replay === undefined) throw new Error("the game left no replay");
        expect(summarizeReplay(replay, knownAnswer)).toEqual({ undoCount: 0, wrongEntries: 0, usedNotes: null });
    });
});
