import { afterEach, describe, expect, it } from "vitest";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createPinia } from "pinia";
import { createMemoryHistory, createRouter } from "vue-router";
import Game from "@/presentation/pages/game/Game.vue";
import { createKnownSudoku, fillAllButLastKnownCell, lastKnownEmptyCell } from "@/__tests__/fixtures/knownPuzzle";
import type { Sudoku } from "@/domain/game/Sudoku";
import { useGameStore } from "@/stores/gameStore";
import { ROUTER_PATH } from "@/routerPaths";

const PAD = "[data-testid='floating-digit-pad']";
const SCREEN = "[data-testid='game-screen']";
const EMPTY_CELL = "[data-testid='cell-0-2']";
const CLUE_CELL = "[data-testid='cell-0-0']";

const mountGame = async ({ floatingDigitPad = true, sudoku = createKnownSudoku() }: { floatingDigitPad?: boolean; sudoku?: Sudoku } = {}) => {
    localStorage.setItem("sudoku-settings", JSON.stringify({ floatingDigitPad, motionEffects: false }));
    const pinia = createPinia();
    const router = createRouter({
        history: createMemoryHistory(),
        routes: [{ path: ROUTER_PATH.home, component: { template: "<div/>" } }, { path: ROUTER_PATH.game, component: Game }],
    });
    const gameStore = useGameStore(pinia);
    gameStore.sudoku = sudoku;
    gameStore.setDifficulty("hard");
    await router.push("/");
    await router.push("/game");
    await router.isReady();
    const wrapper = mount({ template: "<router-view />" }, { global: { plugins: [pinia, router] } });
    await flushPromises();
    return { wrapper, gameStore };
};

const click = async (wrapper: VueWrapper, selector: string) => {
    await wrapper.get(selector).trigger("click", { clientX: 10, clientY: 10 });
};

const padKey = (digit: number) => `[data-testid='floating-number-${digit}']`;

const hasEntry = (wrapper: VueWrapper, row: number, column: number) => {
    const cell = wrapper.get(`[data-testid='cell-${row}-${column}']`);
    return cell.attributes("data-value-kind") !== undefined || cell.find("[data-value-kind]").exists();
};

afterEach(() => {
    localStorage.clear();
});

describe("the floating digit pad in a game", () => {
    describe("opening", () => {
        it("should open on an empty cell", async () => {
            const { wrapper } = await mountGame();

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.find(PAD).exists()).toBe(true);
        });

        it("should stay away with the setting off", async () => {
            const { wrapper } = await mountGame({ floatingDigitPad: false });

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.find(PAD).exists()).toBe(false);
            expect(wrapper.get("[data-testid='game-board']").attributes("data-selected-cell")).toBe("R1C3");
        });

        it("should open on a cell holding notes", async () => {
            const sudoku = createKnownSudoku();
            sudoku.toggleNote(0, 2, 4);
            const { wrapper } = await mountGame({ sudoku });

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.find(PAD).exists()).toBe(true);
        });

        it("should open on a cell the player filled", async () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 5);
            const { wrapper } = await mountGame({ sudoku });

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.find(PAD).exists()).toBe(true);
        });

        it("should not open on a given clue", async () => {
            const { wrapper } = await mountGame();

            await click(wrapper, CLUE_CELL);

            expect(wrapper.find(PAD).exists()).toBe(false);
        });

        it("should not open while a digit is picked, and enter it as today", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, "[data-testid='number-4']");

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.find(PAD).exists()).toBe(false);
            expect(wrapper.get(EMPTY_CELL).text()).toBe("4");
        });

        it("should not open in Erase mode, and erase the cell as today", async () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 5);
            const { wrapper } = await mountGame({ sudoku });
            await click(wrapper, "[data-testid='erase-button']");

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.find(PAD).exists()).toBe(false);
            expect(hasEntry(wrapper, 0, 2)).toBe(false);
        });

        it("should not open in hint mode", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);
            await click(wrapper, "[data-testid='hint-button']");
            await click(wrapper, "[data-testid='hint-reveal-cell']");
            await flushPromises();

            expect(wrapper.find(PAD).exists()).toBe(false);
            await click(wrapper, "[data-testid='cell-0-3']");
            expect(wrapper.find(PAD).exists()).toBe(false);
        });
    });

    it("should not come back on its cell when a hint solves the board", async () => {
        const sudoku = createKnownSudoku();
        fillAllButLastKnownCell(sudoku);
        const { wrapper } = await mountGame({ sudoku });
        await click(wrapper, `[data-testid='cell-${lastKnownEmptyCell.row}-${lastKnownEmptyCell.column}']`);
        expect(wrapper.find(PAD).exists()).toBe(true);

        await click(wrapper, "[data-testid='hint-button']");
        await click(wrapper, "[data-testid='hint-reveal-cell']");
        await flushPromises();
        while (wrapper.find("[data-testid='hint-primary']").exists()) await click(wrapper, "[data-testid='hint-primary']");
        await flushPromises();

        expect(wrapper.get("[data-testid='game-board']").attributes("data-celebration")).toBeDefined();
        expect(wrapper.find(PAD).exists()).toBe(false);
    });

    describe("after a hint", () => {
        const pressHintThrough = async (wrapper: VueWrapper) => {
            await click(wrapper, "[data-testid='hint-button']");
            await click(wrapper, "[data-testid='hint-reveal-cell']");
            await flushPromises();
            while (wrapper.find("[data-testid='hint-primary']").exists()) await click(wrapper, "[data-testid='hint-primary']");
            await flushPromises();
        };

        it("should clear the selection when the hint fills a cell, and open again on the next tap", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);

            await pressHintThrough(wrapper);

            expect(wrapper.get("[data-testid='game-board']").attributes("data-selected-cell")).toBeUndefined();
            expect(wrapper.find(PAD).exists()).toBe(false);
            await click(wrapper, "[data-testid='cell-1-1']");
            expect(wrapper.find(PAD).exists()).toBe(true);
        });

        it("should come back when a wrong-entry hint closes with nothing filled", async () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 3, 1);
            const { wrapper } = await mountGame({ sudoku });
            await click(wrapper, EMPTY_CELL);
            await click(wrapper, "[data-testid='hint-button']");
            await click(wrapper, "[data-testid='hint-reveal-cell']");
            await flushPromises();
            expect(wrapper.find(PAD).exists()).toBe(false);

            await click(wrapper, "[data-testid='hint-close']");
            await flushPromises();

            expect(wrapper.find(PAD).exists()).toBe(true);
            expect(hasEntry(wrapper, 0, 3)).toBe(true);
        });

        it("should keep the selection with the setting off", async () => {
            const { wrapper } = await mountGame({ floatingDigitPad: false });
            await click(wrapper, EMPTY_CELL);

            await pressHintThrough(wrapper);

            expect(wrapper.get("[data-testid='game-board']").attributes("data-selected-cell")).toBe("R1C3");
        });
    });

    it("should lift the board above the controls only while the pad is open", async () => {
        const { wrapper } = await mountGame();
        const board = () => wrapper.get("[data-testid='game-board']").classes();
        expect(board()).not.toContain("z-20");

        await click(wrapper, EMPTY_CELL);
        expect(board()).toContain("z-20");

        await click(wrapper, EMPTY_CELL);
        expect(board()).not.toContain("z-20");
    });

    describe("input", () => {
        it("should fill the cell, remove peer notes and close", async () => {
            const sudoku = createKnownSudoku();
            sudoku.toggleNote(0, 3, 4);
            sudoku.toggleNote(0, 3, 6);
            const { wrapper } = await mountGame({ sudoku });
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, padKey(4));

            expect(wrapper.get(EMPTY_CELL).text()).toBe("4");
            expect(hasEntry(wrapper, 0, 2)).toBe(true);
            expect(wrapper.get("[data-testid='cell-0-3']").text()).toBe("6");
            expect(wrapper.find(PAD).exists()).toBe(false);
        });

        it("should change a filled cell", async () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 5);
            const { wrapper } = await mountGame({ sudoku });
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, padKey(3));

            expect(wrapper.get(EMPTY_CELL).text()).toBe("3");
        });

        it("should mark the digit a filled cell holds, and clear the cell when it is pressed", async () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 5);
            const { wrapper } = await mountGame({ sudoku });
            await click(wrapper, EMPTY_CELL);
            expect(wrapper.get(padKey(5)).attributes("aria-pressed")).toBe("true");

            await click(wrapper, padKey(5));

            expect(hasEntry(wrapper, 0, 2)).toBe(false);
        });

        it("should toggle notes and stay open in note mode, showing what the cell holds", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, "[data-testid='note-button']");
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, padKey(1));
            await click(wrapper, padKey(4));
            await click(wrapper, padKey(1));

            expect(wrapper.get(EMPTY_CELL).text()).toBe("4");
            expect(wrapper.get(padKey(4)).attributes("aria-pressed")).toBe("true");
            expect(wrapper.get(padKey(1)).attributes("aria-pressed")).toBe("false");
            expect(wrapper.find(PAD).exists()).toBe(true);
        });

        it("should change nothing and record no step for a note on a filled cell", async () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 5);
            const { wrapper, gameStore } = await mountGame({ sudoku });
            await click(wrapper, "[data-testid='note-button']");
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, padKey(1));
            await click(wrapper, "[data-testid='back-button']");
            await click(wrapper, "[data-testid='save-and-leave-button']");
            await flushPromises();

            expect(gameStore.savedGame?.cells[0][2].entry).toBe(5);
            expect(gameStore.savedGame?.replay?.steps).toEqual([]);
        });

        it("should erase the cell and close", async () => {
            const sudoku = createKnownSudoku();
            sudoku.fill(0, 2, 5);
            const { wrapper } = await mountGame({ sudoku });
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, "[data-testid='floating-erase']");

            expect(hasEntry(wrapper, 0, 2)).toBe(false);
            expect(wrapper.find(PAD).exists()).toBe(false);
        });

        it("should disable the erase key on a cell holding nothing", async () => {
            const { wrapper } = await mountGame();

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.get("[data-testid='floating-erase']").attributes("disabled")).toBeDefined();
        });

        it("should leave the digit pad below the board working", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, "[data-testid='number-4']");

            expect(wrapper.get(EMPTY_CELL).text()).toBe("4");
            expect(wrapper.find(PAD).exists()).toBe(false);
        });
    });

    describe("closing", () => {
        it("should close when its cell is tapped again", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, EMPTY_CELL);

            expect(wrapper.find(PAD).exists()).toBe(false);
        });

        it("should move when another cell is tapped", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);
            const before = wrapper.get(PAD).attributes("style");

            await click(wrapper, "[data-testid='cell-0-3']");

            expect(wrapper.get(PAD).attributes("style")).not.toBe(before);
        });

        it("should clear the selection on a tap of the blank", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, SCREEN);

            expect(wrapper.find(PAD).exists()).toBe(false);
            expect(wrapper.get("[data-testid='game-board']").attributes("data-selected-cell")).toBeUndefined();
        });

        it("should keep the selection on a tap of the blank with the setting off", async () => {
            const { wrapper } = await mountGame({ floatingDigitPad: false });
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, SCREEN);

            expect(wrapper.get("[data-testid='game-board']").attributes("data-selected-cell")).toBe("R1C3");
        });

        it.each(["game-controls", "digit-pad"])("should keep the selection on a tap in the gaps of %s", async (testid) => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, `[data-testid='${testid}']`);

            expect(wrapper.find(PAD).exists()).toBe(true);
        });

        it("should clear the selection on a tap beside the undo, notes and hint row", async () => {
            const { wrapper } = await mountGame();
            await click(wrapper, EMPTY_CELL);

            await click(wrapper, "[data-testid='game-inputs']");

            expect(wrapper.find(PAD).exists()).toBe(false);
        });
    });
});
