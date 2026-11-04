import { setPageVisibility } from "@/__tests__/fixtures/pageVisibility";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { createKnownSudoku, knownAnswer, knownPuzzle } from "@/__tests__/fixtures/knownPuzzle";
import type { Difficulty } from "@/domain/generator/SudokuGenerator";
import type { Sudoku } from "@/domain/game/Sudoku";
import { useGameStore } from "@/stores/gameStore";
import { useStatisticsStore } from "@/stores/statisticsStore";

const SCREEN = "[data-testid='game-screen']";
const TOAST = "[data-testid='game-toast']";

// (0, 2) answers 4, (0, 3) answers 6, (1, 1) answers 7, (1, 2) answers 2, (2, 0) answers 1, (2, 3) answers 3
const SIX_SINGLE_NOTES = [[0, 2, 4], [0, 3, 6], [1, 1, 7], [1, 2, 2], [2, 0, 1], [2, 3, 3]] as const;

const sudokuWithSingleNotes = (cells: readonly (readonly [number, number, number])[] = SIX_SINGLE_NOTES): Sudoku => {
    const sudoku = createKnownSudoku();
    for (const [row, column, digit] of cells) sudoku.toggleNote(row, column, digit);
    return sudoku;
};

// Every cell but the last two of row 8 is filled; those two hold their answers as single notes
const twoCellsFromSolved = (): Sudoku => {
    const sudoku = createKnownSudoku();
    for (let row = 0; row < 9; row++) {
        for (let column = 0; column < 9; column++) {
            if (knownPuzzle[row][column] !== 0) continue;
            if (row === 8 && (column === 2 || column === 3)) sudoku.toggleNote(row, column, knownAnswer[row][column]);
            else sudoku.fill(row, column, knownAnswer[row][column]);
        }
    }
    return sudoku;
};

interface MountOptions {
    difficulty?: Difficulty;
    sudoku?: Sudoku;
    doubleTapFill?: boolean;
    motionEffects?: boolean;
}

const mountGame = async ({ difficulty = "hard", sudoku = sudokuWithSingleNotes(), doubleTapFill = true, motionEffects = false }: MountOptions = {}) => {
    localStorage.setItem("sudoku-settings", JSON.stringify({ doubleTapFill, motionEffects }));
    const pinia = createPinia();
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: "/", component: { template: "<div/>" } }, { path: "/game", component: Game }],
    });
    const gameStore = useGameStore(pinia);
    gameStore.sudoku = sudoku;
    gameStore.setDifficulty(difficulty);
    await router.push("/");
    await router.push("/game");
    await router.isReady();
    const wrapper = mount({ template: "<router-view />" }, { global: { plugins: [pinia, router] } });
    await flushPromises();
    return { wrapper, router, gameStore, statistics: useStatisticsStore(pinia) };
};

const tap = async (wrapper: VueWrapper, selector: string, clientX = 10) => {
    await wrapper.get(selector).trigger("click", { clientX, clientY: 10 });
};

const doubleTapBlank = async (wrapper: VueWrapper) => {
    await tap(wrapper, SCREEN);
    await tap(wrapper, SCREEN);
};

// A cell's entry, not its notes: a note reads as the same digit in the cell's text
const entryText = (wrapper: VueWrapper, row: number, column: number) => {
    const cell = wrapper.get(`[data-testid='cell-${row}-${column}']`);
    const hasValue = cell.attributes("data-value-kind") !== undefined || cell.find("[data-value-kind]").exists();
    return hasValue ? cell.text() : "";
};

beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] });
});

afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
});

describe("double-tap fill", () => {
    describe("what counts as a double tap", () => {
        it("should fill on two blank taps 200ms and 10px apart", async () => {
            const { wrapper } = await mountGame();

            await tap(wrapper, SCREEN, 10);
            vi.advanceTimersByTime(200);
            await tap(wrapper, SCREEN, 20);

            expect(entryText(wrapper, 0, 2)).toBe("4");
        });

        it("should fill nothing on two blank taps 400ms apart", async () => {
            const { wrapper } = await mountGame();

            await tap(wrapper, SCREEN, 10);
            vi.advanceTimersByTime(400);
            await tap(wrapper, SCREEN, 10);

            expect(entryText(wrapper, 0, 2)).toBe("");
        });

        it("should fill nothing on two blank taps 60px apart", async () => {
            const { wrapper } = await mountGame();

            await tap(wrapper, SCREEN, 10);
            vi.advanceTimersByTime(200);
            await tap(wrapper, SCREEN, 70);

            expect(entryText(wrapper, 0, 2)).toBe("");
        });

        it("should fill nothing when the first tap lands on the board", async () => {
            const { wrapper } = await mountGame();

            await tap(wrapper, "[data-testid='game-board']");
            vi.advanceTimersByTime(200);
            await tap(wrapper, SCREEN);

            expect(entryText(wrapper, 0, 2)).toBe("");
        });

        it("should let a digit key act as usual when the second tap lands on it", async () => {
            const { wrapper } = await mountGame();

            await tap(wrapper, SCREEN);
            vi.advanceTimersByTime(200);
            await tap(wrapper, "[data-testid='number-5']");

            expect(entryText(wrapper, 0, 2)).toBe("");
            expect(wrapper.get("[data-testid='number-5']").attributes("aria-pressed")).toBe("true");
        });

        it("should fill nothing when both taps land in the input area's gaps", async () => {
            const { wrapper } = await mountGame();

            await tap(wrapper, "[data-testid='game-inputs']");
            await tap(wrapper, "[data-testid='game-inputs']");

            expect(entryText(wrapper, 0, 2)).toBe("");
        });

        it("should not take a third quick tap for another double tap", async () => {
            const sudoku = sudokuWithSingleNotes([[0, 2, 4], [0, 3, 4], [0, 3, 6]]);
            const { wrapper } = await mountGame({ sudoku });

            await doubleTapBlank(wrapper);
            await tap(wrapper, SCREEN);

            expect(entryText(wrapper, 0, 2)).toBe("4");
            expect(entryText(wrapper, 0, 3)).toBe("");
        });

        it("should mark the screen so a double tap never zooms it", async () => {
            const { wrapper } = await mountGame();

            expect(wrapper.get(SCREEN).classes()).toContain("touch-manipulation");
        });
    });

    describe("when it does nothing", () => {
        it("should do nothing with the setting off", async () => {
            const { wrapper } = await mountGame({ doubleTapFill: false });

            await doubleTapBlank(wrapper);

            expect(entryText(wrapper, 0, 2)).toBe("");
            expect(wrapper.find(TOAST).exists()).toBe(false);
        });

        it("should do nothing and say nothing on an easy game", async () => {
            const { wrapper } = await mountGame({ difficulty: "easy" });

            await doubleTapBlank(wrapper);

            expect(entryText(wrapper, 0, 2)).toBe("");
            expect(wrapper.find(TOAST).exists()).toBe(false);
        });

        it.each(["medium", "hard"] as const)("should fill on a %s game", async (difficulty) => {
            const { wrapper } = await mountGame({ difficulty });

            await doubleTapBlank(wrapper);

            expect(entryText(wrapper, 0, 2)).toBe("4");
        });

        it("should do nothing during hint mode", async () => {
            const { wrapper } = await mountGame();
            await tap(wrapper, "[data-testid='hint-button']");
            await tap(wrapper, "[data-testid='hint-reveal-cell']");
            await flushPromises();

            await doubleTapBlank(wrapper);

            expect(entryText(wrapper, 0, 3)).toBe("");
        });

        it("should not take taps on the hint menu's scrim for a double tap", async () => {
            const { wrapper } = await mountGame();
            await tap(wrapper, "[data-testid='hint-button']");

            await tap(wrapper, "[data-testid='hint-overlay']");
            await tap(wrapper, SCREEN);

            expect(entryText(wrapper, 0, 2)).toBe("");
        });
    });

    describe("feedback", () => {
        it("should say how many cells were filled", async () => {
            const { wrapper } = await mountGame();

            await doubleTapBlank(wrapper);

            expect(wrapper.get(TOAST).text()).toContain("6");
        });

        it("should say when there is nothing to fill, leaving the board alone", async () => {
            const { wrapper } = await mountGame({ difficulty: "medium", sudoku: createKnownSudoku() });

            await doubleTapBlank(wrapper);

            expect(wrapper.get(TOAST).text()).not.toBe("");
            expect(entryText(wrapper, 0, 2)).toBe("");
        });
    });

    describe("during a run", () => {
        it("should ignore the board and the controls until the run ends", async () => {
            const { wrapper } = await mountGame({ motionEffects: true });
            await doubleTapBlank(wrapper);

            await tap(wrapper, "[data-testid='number-9']");
            await tap(wrapper, "[data-testid='cell-8-8']");
            await tap(wrapper, "[data-testid='undo-button']");
            await tap(wrapper, "[data-testid='hint-button']");

            expect(entryText(wrapper, 0, 2)).toBe("4");
            expect(wrapper.get("[data-testid='number-9']").attributes("aria-pressed")).toBe("false");
            expect(wrapper.find("[data-testid='hint-menu']").exists()).toBe(false);
        });

        it("should clear the selection when the run starts", async () => {
            const { wrapper } = await mountGame();
            await tap(wrapper, "[data-testid='cell-0-2']");

            await doubleTapBlank(wrapper);

            expect(wrapper.get("[data-testid='game-board']").attributes("data-selected-cell")).toBeUndefined();
        });
    });

    describe("undo", () => {
        it("should restore the whole run with one press", async () => {
            const { wrapper } = await mountGame();
            await doubleTapBlank(wrapper);

            await tap(wrapper, "[data-testid='undo-button']");

            for (const [row, column, digit] of SIX_SINGLE_NOTES) {
                expect(entryText(wrapper, row, column)).toBe("");
                expect(wrapper.get(`[data-testid='cell-${row}-${column}']`).text()).toBe(String(digit));
            }
        });
    });

    describe("a 6-cell run interrupted after 2 cells", () => {
        const interruptedRun = async (options: MountOptions = {}) => {
            const mounted = await mountGame({ motionEffects: true, ...options });
            await doubleTapBlank(mounted.wrapper);
            vi.advanceTimersByTime(60);
            await flushPromises();
            expect(entryText(mounted.wrapper, 0, 3)).toBe("6");
            expect(entryText(mounted.wrapper, 1, 1)).toBe("");
            return mounted;
        };

        const allSixFilled = (wrapper: VueWrapper) => SIX_SINGLE_NOTES.every(([row, column, digit]) => entryText(wrapper, row, column) === String(digit));

        it("should have all 6 in place when the leave dialog opens on Back", async () => {
            const { wrapper } = await interruptedRun();

            await tap(wrapper, "[data-testid='back-button']");

            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(true);
            expect(allSixFilled(wrapper)).toBe(true);
        });

        it("should go on with all 6 filled after Cancel, and undo them in one press", async () => {
            const { wrapper } = await interruptedRun();
            await tap(wrapper, "[data-testid='back-button']");

            await tap(wrapper, "[data-testid='leave-cancel-button']");
            await flushPromises();
            expect(allSixFilled(wrapper)).toBe(true);

            await tap(wrapper, "[data-testid='undo-button']");
            expect(entryText(wrapper, 0, 2)).toBe("");
            expect(entryText(wrapper, 1, 1)).toBe("");
        });

        it("should save all 6 entries and 6 fill steps on Back then Save", async () => {
            const { wrapper, gameStore } = await interruptedRun();

            await tap(wrapper, "[data-testid='back-button']");
            await tap(wrapper, "[data-testid='save-and-leave-button']");
            await flushPromises();

            const saved = gameStore.savedGame;
            for (const [row, column, digit] of SIX_SINGLE_NOTES) expect(saved?.cells[row][column].entry).toBe(digit);
            expect(saved?.replay?.steps.map(step => step.action)).toEqual(["fill", "fill", "fill", "fill", "fill", "fill"]);
        });

        it("should save all 6 entries when the page is hidden", async () => {
            const { gameStore } = await interruptedRun();

            setPageVisibility("hidden");
            await flushPromises();
            setPageVisibility("visible");

            const saved = gameStore.savedGame;
            for (const [row, column, digit] of SIX_SINGLE_NOTES) expect(saved?.cells[row][column].entry).toBe(digit);
            expect(saved?.replay?.steps).toHaveLength(6);
        });

        it("should keep the notes as a whole run leaves them in the save", async () => {
            const sudoku = sudokuWithSingleNotes([[0, 2, 4], [0, 3, 6], [1, 1, 7], [2, 4, 6], [2, 4, 2]]);
            const { wrapper, gameStore } = await mountGame({ sudoku, motionEffects: true });
            await doubleTapBlank(wrapper);

            await tap(wrapper, "[data-testid='back-button']");
            await tap(wrapper, "[data-testid='save-and-leave-button']");
            await flushPromises();

            // (0, 3)'s 6 removes the same digit from (2, 4), in its box
            expect(gameStore.savedGame?.cells[2][4].notes).toEqual([2]);
        });

        it("should celebrate with no leave dialog when the rest of the run solves the board on Back", async () => {
            const { wrapper, statistics } = await mountGame({ sudoku: twoCellsFromSolved(), motionEffects: true });
            await doubleTapBlank(wrapper);

            await tap(wrapper, "[data-testid='back-button']");

            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
            expect(statistics.history.filter(game => game.completed)).toHaveLength(1);
            expect(wrapper.get("[data-testid='game-board']").attributes("data-celebration")).toBeDefined();
        });

        it("should stay on the game when the system Back's finish solves the board", async () => {
            const { wrapper, router, statistics } = await mountGame({ sudoku: twoCellsFromSolved(), motionEffects: true });
            await doubleTapBlank(wrapper);

            await router.push("/");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe("/game");
            expect(wrapper.find("[data-testid='leave-game-dialog']").exists()).toBe(false);
            expect(statistics.history).toHaveLength(1);
        });
    });

    describe("a run that solves the board", () => {
        it("should record one completed game", async () => {
            const { wrapper, statistics } = await mountGame({ sudoku: twoCellsFromSolved() });

            await doubleTapBlank(wrapper);

            expect(statistics.history).toHaveLength(1);
            expect(statistics.history[0].completed).toBe(true);
        });
    });
});
