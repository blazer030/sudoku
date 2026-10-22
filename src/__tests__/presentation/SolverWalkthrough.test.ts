import { afterEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { i18n } from "@/presentation/i18n";
import { flushPromises, mount, type VueWrapper } from "@vue/test-utils";
import { createMemoryHistory, createRouter } from "vue-router";
import SolverWalkthrough from "@/presentation/pages/solver-walkthrough/SolverWalkthrough.vue";
import { BoardState } from "@/domain/solver/BoardState";
import { buildSolvePath } from "@/domain/solver/SolvePath";
import { scopeCells } from "@/presentation/components/step-presentation/stepCellView";
import { TechniqueSolver } from "@/domain/solver/TechniqueSolver";
import { singlesPuzzle, singlesSolution } from "@/__tests__/fixtures/singlesPuzzle";
import { openNoSolutionPuzzle } from "@/__tests__/fixtures/openPuzzles";
import { SAMPLE_PUZZLES } from "@/presentation/pages/solver-walkthrough/samplePuzzles";

const samplePuzzle = (id: string): number[][] => {
    const sample = SAMPLE_PUZZLES.find((candidate) => candidate.id === id);
    if (!sample) throw new Error(`expected the ${id} sample to exist`);
    return sample.puzzle;
};
const mediumPuzzle = samplePuzzle("medium");
const hardPuzzle = samplePuzzle("hard");

const singlesStepCount = buildSolvePath(singlesPuzzle).length;

const createTestRouter = () => createRouter({
    history: createMemoryHistory(),
    routes: [
        { path: "/", component: { template: "<div>Home</div>" } },
        { path: "/solver", component: SolverWalkthrough },
    ],
});

const mountWalkthrough = (props: { initialPuzzle?: number[][] } = {}) => {
    const router = createTestRouter();
    const wrapper = mount(SolverWalkthrough, { props, global: { plugins: [router] } });
    return { wrapper, router };
};

// Closes the guide to enter a puzzle by hand
const mountEntering = async () => {
    const mounted = mountWalkthrough();
    await mounted.wrapper.find("[data-testid='walkthrough-enter-own']").trigger("click");
    return mounted;
};

const solve = async (wrapper: VueWrapper) => {
    await wrapper.find("[data-testid='solve-button']").trigger("click");
    await flushPromises();
};

const clickNext = async (wrapper: VueWrapper, times: number) => {
    for (let click = 0; click < times; click++) {
        await wrapper.find("[data-testid='walkthrough-next']").trigger("click");
    }
};

const cellAt = (wrapper: VueWrapper, row: number, column: number) =>
    wrapper.find(`[data-testid='solver-cell-${row}-${column}']`);

const firstSinglesStep = () => {
    const step = new TechniqueSolver().nextStep(BoardState.fromPuzzle(singlesPuzzle));
    if (step === null || step.assignments.length === 0) throw new Error("expected a first assignment step");
    return step;
};

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
});

describe("SolverWalkthrough", () => {
    describe("guide", () => {
        it("should open with the guide", async () => {
            const { wrapper } = mountWalkthrough();

            const intro = wrapper.find("[data-testid='walkthrough-intro']");
            expect(intro.text()).toContain("Enter any Sudoku and see which techniques the solver uses to crack it, step by step.");
            expect(intro.find("[data-testid='walkthrough-intro-caveat']").text()).toBe(
                "It may not finish: the puzzle may need a more advanced technique, the input may have a mistake, or the puzzle may have no solution or more than one.",
            );
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeDefined();

            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            expect(wrapper.find("[data-testid='walkthrough-intro']").text()).toContain("輸入任何一題數獨");
            expect(wrapper.find("[data-testid='walkthrough-intro']").text()).toContain("不一定能解完");
        });

        it("should offer the samples in production", async () => {
            vi.stubEnv("VITE_APP_ENV", "production");
            const { wrapper } = mountWalkthrough();
            const labels = () => ["easy", "medium", "hard"].map((id) => wrapper.find(`[data-testid='load-sample-${id}']`).text());

            expect(labels()).toEqual(["Easy", "Medium", "Hard"]);

            i18n.global.locale.value = "zh-Hant";
            await nextTick();

            expect(labels()).toEqual(["簡單", "中等", "困難"]);
        });

        it("should load a sample and close the guide", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='load-sample-hard']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-intro']").exists()).toBe(false);
            expect(cellAt(wrapper, 0, 0).text()).toBe("2");
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeUndefined();
        });

        it("should keep the board cells inert while the guide is open", async () => {
            const { wrapper } = mountWalkthrough();

            expect(wrapper.findAll("[data-testid^='solver-cell-'][role='button']")).toHaveLength(0);
            await cellAt(wrapper, 0, 0).trigger("click");
            await wrapper.find("[data-testid='walkthrough-enter-own']").trigger("click");

            expect(cellAt(wrapper, 0, 0).classes()).not.toContain("bg-cell-selected");
            expect(wrapper.findAll("[data-testid^='solver-cell-'][role='button']")).toHaveLength(81);
        });

        it("should close the guide to enter a puzzle", async () => {
            const { wrapper } = mountWalkthrough();

            await wrapper.find("[data-testid='walkthrough-enter-own']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-intro']").exists()).toBe(false);
            expect(wrapper.findAll("[data-testid^='solver-cell-']").every((cell) => cell.text() === "")).toBe(true);
        });

        it("should bring the guide back after a confirmed reset", async () => {
            const { wrapper } = mountWalkthrough();
            await wrapper.find("[data-testid='load-sample-easy']").trigger("click");

            await wrapper.find("[data-testid='reset-button']").trigger("click");
            await wrapper.find("[data-testid='walkthrough-dialog-confirm']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-intro']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeDefined();
        });

        it("should lift the guide over the board when it would not fit below", async () => {
            // The input area starts 120px above the bottom edge, leaving 96px under the 24px gap,
            // and the guide is 300px tall
            vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ top: window.innerHeight - 120 } as DOMRect);
            Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
                configurable: true,
                get(this: HTMLElement) { return this.dataset.testid === "walkthrough-intro" ? 300 : 0; },
            });
            try {
                const { wrapper } = mountWalkthrough();
                await flushPromises();

                const intro = wrapper.find<HTMLElement>("[data-testid='walkthrough-intro']");
                expect(intro.element.style.maxHeight).toBe("300px");
                expect(wrapper.find<HTMLElement>("[data-testid='walkthrough-intro-position']").element.style.top).toBe("-204px");
            } finally {
                Reflect.deleteProperty(HTMLElement.prototype, "scrollHeight");
                vi.restoreAllMocks();
            }
        });

        it("should start from a puzzle passed in", () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            expect(wrapper.find("[data-testid='walkthrough-intro']").exists()).toBe(false);
            expect(cellAt(wrapper, 0, 3).text()).toBe("2");
        });
    });

    describe("entering a puzzle", () => {
        it("should render a 9x9 board on mount", () => {
            const { wrapper } = mountWalkthrough();

            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    expect(cellAt(wrapper, row, column).exists()).toBe(true);
                }
            }
        });

        it("should lay the board out as flex rows like the game board so cells in a row share one height", () => {
            const { wrapper } = mountWalkthrough();

            for (let row = 0; row < 9; row++) {
                const rowElement = wrapper.find(`[data-testid='solver-row-${row}']`);
                expect(rowElement.classes()).toContain("flex");
                for (let column = 0; column < 9; column++) {
                    expect(rowElement.find(`[data-testid='solver-cell-${row}-${column}']`).exists()).toBe(true);
                }
            }
        });

        it("should leave empty cells blank while entering a puzzle", async () => {
            const { wrapper } = await mountEntering();

            expect(cellAt(wrapper, 0, 0).text()).toBe("");

            await wrapper.find("[data-testid='number-9']").trigger("click");
            await cellAt(wrapper, 0, 0).trigger("click");

            expect(cellAt(wrapper, 0, 1).text()).toBe("");
        });

        it("should show entered digits as givens", async () => {
            const { wrapper } = await mountEntering();

            await cellAt(wrapper, 3, 4).trigger("click");
            await wrapper.find("[data-testid='number-7']").trigger("click");

            expect(cellAt(wrapper, 3, 4).find("[data-testid='cell-value']").classes()).toContain("font-bold");
        });

        it("should reject filling a digit that clashes with a peer", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='number-9']").trigger("click");
            await cellAt(wrapper, 0, 0).trigger("click");
            await cellAt(wrapper, 0, 1).trigger("click");

            expect(cellAt(wrapper, 0, 1).text()).toBe("");
        });

        it("should fill selected cell when a digit is picked", async () => {
            const { wrapper } = await mountEntering();

            await cellAt(wrapper, 3, 4).trigger("click");
            await wrapper.find("[data-testid='number-7']").trigger("click");

            expect(cellAt(wrapper, 3, 4).text()).toBe("7");
        });

        it("should navigate back to Home when clicking Back button", async () => {
            const { wrapper, router } = mountWalkthrough();
            await router.push("/solver");
            await router.isReady();

            await wrapper.find("[data-testid='back-button']").trigger("click");
            await flushPromises();

            expect(router.currentRoute.value.path).toBe("/");
        });

        it("should select a digit when clicked without a selected cell", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='number-5']").trigger("click");

            expect(wrapper.find("[data-testid='number-5']").classes()).toContain("bg-primary");
        });

        it("should fill clicked cell when a digit is already selected", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='number-8']").trigger("click");
            await cellAt(wrapper, 2, 6).trigger("click");

            expect(cellAt(wrapper, 2, 6).text()).toBe("8");
        });

        it("should keep digit selected and fill subsequent clicked cells", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='number-3']").trigger("click");
            await cellAt(wrapper, 0, 0).trigger("click");
            await cellAt(wrapper, 4, 4).trigger("click");

            expect(cellAt(wrapper, 0, 0).text()).toBe("3");
            expect(cellAt(wrapper, 4, 4).text()).toBe("3");
        });

        it("should deselect the digit when clicking the same digit again", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='number-5']").trigger("click");
            expect(wrapper.find("[data-testid='number-5']").classes()).toContain("bg-primary");

            await wrapper.find("[data-testid='number-5']").trigger("click");
            expect(wrapper.find("[data-testid='number-5']").classes()).not.toContain("bg-primary");
        });

        it("should enter erase mode when clicking Erase button", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='erase-button']").trigger("click");

            expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");
        });

        it("should deselect the digit when entering erase mode", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='number-5']").trigger("click");
            await wrapper.find("[data-testid='erase-button']").trigger("click");

            expect(wrapper.find("[data-testid='number-5']").classes()).not.toContain("bg-primary");
            expect(wrapper.find("[data-testid='erase-button']").classes()).toContain("bg-primary");
        });

        it("should exit erase mode when selecting a digit", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='erase-button']").trigger("click");
            await wrapper.find("[data-testid='number-3']").trigger("click");

            expect(wrapper.find("[data-testid='erase-button']").classes()).not.toContain("bg-primary");
            expect(wrapper.find("[data-testid='number-3']").classes()).toContain("bg-primary");
        });

        it("should clear a filled cell when clicked in erase mode", async () => {
            const { wrapper } = await mountEntering();

            await wrapper.find("[data-testid='number-6']").trigger("click");
            await cellAt(wrapper, 5, 2).trigger("click");
            expect(cellAt(wrapper, 5, 2).text()).toBe("6");

            await wrapper.find("[data-testid='erase-button']").trigger("click");
            await cellAt(wrapper, 5, 2).trigger("click");

            expect(cellAt(wrapper, 5, 2).text()).toBe("");
        });

        it("should render a Solve button", async () => {
            const { wrapper } = await mountEntering();

            expect(wrapper.find("[data-testid='solve-button']").exists()).toBe(true);
        });
    });

    describe("playback", () => {
        it("should keep the inputs in place under the panel", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });
            const board = wrapper.find("[data-testid='walkthrough-board']").element;
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeUndefined();

            await solve(wrapper);

            const inputs = wrapper.find("[data-testid='walkthrough-inputs']");
            expect(inputs.exists()).toBe(true);
            expect(inputs.attributes("inert")).toBeDefined();
            expect(inputs.classes()).toContain("opacity-0");
            const panel = wrapper.find("[data-testid='walkthrough-panel']");
            expect(panel.element.parentElement?.classList.contains("absolute")).toBe(true);
            expect(wrapper.find("[data-testid='walkthrough-board']").element).toBe(board);
        });

        it("should ignore cell clicks after entering solve mode", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            await solve(wrapper);
            await cellAt(wrapper, 0, 0).trigger("click");

            expect(cellAt(wrapper, 0, 0).classes()).not.toContain("bg-cell-selected");
        });

        it("should not present the cells as buttons during playback", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });
            expect(cellAt(wrapper, 0, 0).attributes("role")).toBe("button");

            await solve(wrapper);

            expect(wrapper.findAll("[data-testid^='solver-cell-'][role='button']")).toHaveLength(0);
        });

        it("should return to edit mode and preserve puzzle when clicking Back during solve mode", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            await solve(wrapper);
            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(true);

            await wrapper.find("[data-testid='back-button']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeUndefined();
            expect(wrapper.find("[data-testid='solve-button']").exists()).toBe(true);
            expect(cellAt(wrapper, 0, 3).find("[data-testid='cell-value']").text()).toBe("2");
        });

        it("should open on the first step", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });
            const { cell, digit } = firstSinglesStep().assignments[0];

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-technique']").text()).toBe("Naked Single");
            const explanation = wrapper.find("[data-testid='walkthrough-explanation']").text();
            expect(explanation).toContain(`Row ${cell.row + 1}, Col ${cell.column + 1}`);
            expect(explanation).toContain(String(digit));
            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`1 / ${singlesStepCount}`);
        });

        it("should mark the first step's answer cell like hint mode", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });
            const { cell, digit } = firstSinglesStep().assignments[0];

            await solve(wrapper);

            const answerCell = () => cellAt(wrapper, cell.row, cell.column);
            expect(answerCell().classes()).toContain("bg-primary-light");
            expect(answerCell().classes()).toContain("ring-primary");
            expect(answerCell().find("[data-testid='cell-value']").exists()).toBe(false);

            await clickNext(wrapper, 1);
            const value = answerCell().find("[data-testid='cell-value']");
            expect(value.text()).toBe(String(digit));
            expect(value.classes()).toContain("text-primary");

            await wrapper.find("[data-testid='walkthrough-previous']").trigger("click");
            expect(answerCell().find("[data-testid='cell-value']").exists()).toBe(false);
        });

        it("should show every empty cell's candidates before the step", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });
            const step = firstSinglesStep();
            const marked = new Set([
                ...step.scopes.flatMap(scopeCells),
                ...step.focus,
                ...step.assignments.map((assignment) => assignment.cell),
            ].map((cell) => `${cell.row}-${cell.column}`));

            await solve(wrapper);

            const state = BoardState.fromPuzzle(singlesPuzzle);
            let checked = 0;
            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    if (singlesPuzzle[row][column] !== 0 || marked.has(`${row}-${column}`)) continue;
                    expect(cellAt(wrapper, row, column).text()).toBe(state.candidatesOf(row, column).join(""));
                    checked++;
                }
            }
            expect(checked).toBeGreaterThan(0);
        });

        it("should strike the candidates an elimination step removes", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: hardPuzzle });
            const path = buildSolvePath(hardPuzzle);
            const index = path.findIndex((entry) => entry.step.assignments.length === 0);
            if (index === -1) throw new Error("expected an elimination step");

            await solve(wrapper);
            await clickNext(wrapper, index);

            const { eliminations } = path[index].step;
            expect(eliminations.length).toBeGreaterThan(0);
            for (const { cell, digit } of eliminations) {
                expect(cellAt(wrapper, cell.row, cell.column).find(`[data-testid='eliminated-note-${digit}']`).exists()).toBe(true);
            }
        });

        it("should apply scope variant to non-focus cells in the current step's scope", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: mediumPuzzle });
            const path = buildSolvePath(mediumPuzzle);
            const index = path.findIndex((entry) => entry.step.scopes.length > 0);
            if (index === -1) throw new Error("expected at least one step with scope");
            const { step } = path[index];

            await solve(wrapper);
            await clickNext(wrapper, index);

            const markedKeys = new Set([
                ...step.focus,
                ...(step.supporters ?? []),
                ...step.assignments.map((assignment) => assignment.cell),
            ].map((cell) => `${cell.row}-${cell.column}`));
            let checkedScopeCells = 0;
            for (const cell of step.scopes.flatMap(scopeCells)) {
                if (markedKeys.has(`${cell.row}-${cell.column}`)) continue;
                expect(cellAt(wrapper, cell.row, cell.column).classes()).toContain("bg-cell-scope");
                checkedScopeCells++;
            }
            expect(checkedScopeCells).toBeGreaterThan(0);
        });

        it("should stop on the last step the solver found", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });
            const path = buildSolvePath(singlesPuzzle);
            const lastCell = path[path.length - 1].step.assignments[0].cell;

            await solve(wrapper);
            for (let guard = 0; guard < 200; guard++) {
                const next = wrapper.find("[data-testid='walkthrough-next']");
                if (next.attributes("disabled") !== undefined) break;
                await next.trigger("click");
            }

            for (let row = 0; row < 9; row++) {
                for (let column = 0; column < 9; column++) {
                    const value = cellAt(wrapper, row, column).find("[data-testid='cell-value']");
                    if (row === lastCell.row && column === lastCell.column) {
                        expect(value.exists()).toBe(false);
                    } else {
                        expect(value.text()).toBe(String(singlesSolution[row][column]));
                    }
                }
            }
            expect(wrapper.find("[data-testid='walkthrough-progress-fill']").attributes("style")).toContain("width: 100%");
        });

        it("should auto-advance steps every 800ms when Play is active", async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            await solve(wrapper);
            const counter = () => wrapper.find("[data-testid='walkthrough-step-counter']").text();
            expect(counter()).toBe(`1 / ${singlesStepCount}`);

            await wrapper.find("[data-testid='walkthrough-play']").trigger("click");

            await vi.advanceTimersByTimeAsync(800);
            expect(counter()).toBe(`2 / ${singlesStepCount}`);

            await vi.advanceTimersByTimeAsync(800);
            expect(counter()).toBe(`3 / ${singlesStepCount}`);
        });

        it("should stop auto-play when going back to edit", async () => {
            vi.useFakeTimers({ shouldAdvanceTime: true });
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            await solve(wrapper);
            await wrapper.find("[data-testid='walkthrough-play']").trigger("click");
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await vi.advanceTimersByTimeAsync(2000);

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(false);

            await solve(wrapper);
            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`1 / ${singlesStepCount}`);
        });

        it("should start from the first step after solving again", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            await solve(wrapper);
            await clickNext(wrapper, 4);
            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`5 / ${singlesStepCount}`);
            await wrapper.find("[data-testid='back-button']").trigger("click");
            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-step-counter']").text()).toBe(`1 / ${singlesStepCount}`);
        });
    });

    describe("reset", () => {
        const enterSeven = async (wrapper: VueWrapper) => {
            await cellAt(wrapper, 3, 4).trigger("click");
            await wrapper.find("[data-testid='number-7']").trigger("click");
        };

        it("should make reset a quiet text button", async () => {
            const { wrapper } = await mountEntering();
            const reset = () => wrapper.find("[data-testid='reset-button']");

            expect(reset().classes()).toContain("text-foreground-secondary");
            expect(reset().classes()).not.toContain("bg-danger");
            expect(reset().attributes("disabled")).toBeDefined();

            await enterSeven(wrapper);

            expect(reset().attributes("disabled")).toBeUndefined();
        });

        it("should ask before clearing the board", async () => {
            const { wrapper } = await mountEntering();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe("Every digit you entered will be removed.");
            expect(cellAt(wrapper, 3, 4).text()).toBe("7");
        });

        it("should keep the puzzle when reset is cancelled", async () => {
            const { wrapper } = await mountEntering();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");
            await wrapper.find("[data-testid='walkthrough-dialog-cancel']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-dialog']").exists()).toBe(false);
            expect(cellAt(wrapper, 3, 4).text()).toBe("7");
        });

        it("should clear the board when reset is confirmed", async () => {
            const { wrapper } = await mountEntering();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");
            await wrapper.find("[data-testid='walkthrough-dialog-confirm']").trigger("click");
            await flushPromises();

            expect(cellAt(wrapper, 3, 4).text()).toBe("");
            expect(wrapper.find("[data-testid='reset-button']").attributes("disabled")).toBeDefined();
        });

        it("should ask in Traditional Chinese", async () => {
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            const { wrapper } = await mountEntering();
            await enterSeven(wrapper);

            await wrapper.find("[data-testid='reset-button']").trigger("click");

            expect(wrapper.find("[data-testid='walkthrough-dialog-title']").text()).toBe("清空盤面？");
        });
    });

    describe("checking the solution count", () => {
        const emptyBoard = () => Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => 0));

        // Column 9 holds 1–8 and row 1 already has a 9, so the top-right cell has no candidate.
        const noSolutionPuzzle = () => {
            const board = emptyBoard();
            for (let row = 1; row <= 8; row++) board[row][8] = row;
            board[0][0] = 9;
            return board;
        };

        // Blanks an unavoidable rectangle of the singles solution, plus one cell a naked single fills.
        const twoSolutionPuzzle = () => {
            const board = singlesSolution.map((rowValues) => [...rowValues]);
            for (let rowOne = 0; rowOne < 9; rowOne++) {
                for (let rowTwo = rowOne + 1; rowTwo < 9; rowTwo++) {
                    if (Math.floor(rowOne / 3) !== Math.floor(rowTwo / 3)) continue;
                    for (let columnOne = 0; columnOne < 9; columnOne++) {
                        for (let columnTwo = columnOne + 1; columnTwo < 9; columnTwo++) {
                            if (Math.floor(columnOne / 3) === Math.floor(columnTwo / 3)) continue;
                            const first = board[rowOne][columnOne];
                            const second = board[rowOne][columnTwo];
                            if (board[rowTwo][columnTwo] !== first || board[rowTwo][columnOne] !== second) continue;
                            for (const [row, column] of [[rowOne, columnOne], [rowOne, columnTwo], [rowTwo, columnOne], [rowTwo, columnTwo]]) {
                                board[row][column] = 0;
                            }
                            const otherRow = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((row) => row !== rowOne && row !== rowTwo) ?? 0;
                            const otherColumn = [0, 1, 2, 3, 4, 5, 6, 7, 8].find((column) => column !== columnOne && column !== columnTwo) ?? 0;
                            board[otherRow][otherColumn] = 0;
                            return board;
                        }
                    }
                }
            }
            throw new Error("expected an unavoidable rectangle in the singles solution");
        };

        it("should block solving a puzzle with no solution", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: noSolutionPuzzle() });

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe("This puzzle has no solution. Check what you entered.");
            expect(wrapper.find("[data-testid='walkthrough-dialog-cancel']").exists()).toBe(false);

            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe("這題無解，請檢查輸入");

            await wrapper.find("[data-testid='walkthrough-dialog-confirm']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-dialog']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='solve-button']").exists()).toBe(true);
        });

        it("should block a passed-in puzzle whose givens already conflict", async () => {
            const board = emptyBoard();
            board[0][0] = 5;
            board[0][4] = 5;
            const { wrapper } = mountWalkthrough({ initialPuzzle: board });

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe("This puzzle has no solution. Check what you entered.");
        });

        it("should warn about more than one solution and still allow solving", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: twoSolutionPuzzle() });

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe(
                "This puzzle has more than one solution, so the steps may not be complete.",
            );
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe("這題不只一個解，解題結果可能不完整");

            await wrapper.find("[data-testid='walkthrough-dialog-confirm']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='walkthrough-dot-0']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='walkthrough-dot-1']").exists()).toBe(false);
        });

        it("should keep editing when the warning is declined", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: twoSolutionPuzzle() });

            await solve(wrapper);
            await wrapper.find("[data-testid='walkthrough-dialog-cancel']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeUndefined();
        });

        it("should answer promptly and warn when the count can't be checked, still allowing solving", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: openNoSolutionPuzzle });

            const started = performance.now();
            await solve(wrapper);

            expect(performance.now() - started).toBeLessThan(2000);
            expect(wrapper.find("[data-testid='walkthrough-dialog-title']").text()).toBe("Couldn't Check This Puzzle");
            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe(
                "This puzzle is too open to confirm it has exactly one solution, so the steps may not be complete.",
            );
            expect(wrapper.find("[data-testid='walkthrough-dialog-confirm']").text()).toBe("Solve Anyway");
            expect(wrapper.find("[data-testid='walkthrough-dialog-cancel']").text()).toBe("Keep Editing");

            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            expect(wrapper.find("[data-testid='walkthrough-dialog-title']").text()).toBe("無法確認題目");
            expect(wrapper.find("[data-testid='walkthrough-dialog-message']").text()).toBe("這題空格太多，無法確認是否只有一個解，解題結果可能不完整");
            expect(wrapper.find("[data-testid='walkthrough-dialog-confirm']").text()).toBe("仍要解題");
            expect(wrapper.find("[data-testid='walkthrough-dialog-cancel']").text()).toBe("返回修改");

            await wrapper.find("[data-testid='walkthrough-dialog-confirm']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(true);
        });

        it("should keep editing when the unchecked-count warning is declined", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: openNoSolutionPuzzle });

            await solve(wrapper);
            await wrapper.find("[data-testid='walkthrough-dialog-cancel']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='walkthrough-inputs']").attributes("inert")).toBeUndefined();
        });

        it("should enter playback with nothing to step through on an empty board", async () => {
            const { wrapper } = await mountEntering();

            await solve(wrapper);
            await wrapper.find("[data-testid='walkthrough-dialog-confirm']").trigger("click");
            await flushPromises();

            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(true);
            expect(wrapper.find("[data-testid='walkthrough-next']").attributes("disabled")).toBeDefined();
            expect(wrapper.find("[data-testid='walkthrough-previous']").attributes("disabled")).toBeDefined();
            expect(wrapper.find("[data-testid='walkthrough-play']").attributes("disabled")).toBeDefined();
            expect(wrapper.find("[data-testid='walkthrough-technique']").exists()).toBe(false);
            expect(wrapper.findAll("[data-testid^='solver-cell-']").every((cell) => cell.text() === "")).toBe(true);
        });

        it("should solve a unique puzzle without asking", async () => {
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-dialog']").exists()).toBe(false);
            expect(wrapper.find("[data-testid='walkthrough-panel']").exists()).toBe(true);
        });
    });

    describe("in Traditional Chinese", () => {
        it("should name the technique and the cell, and keep the button labels", async () => {
            i18n.global.locale.value = "zh-Hant";
            await nextTick();
            const { wrapper } = mountWalkthrough({ initialPuzzle: singlesPuzzle });

            expect(wrapper.find("[data-testid='reset-button']").text()).toBe("重設");
            expect(wrapper.find("[data-testid='solve-button']").text()).toBe("解題");

            await solve(wrapper);

            expect(wrapper.find("[data-testid='walkthrough-technique']").text()).toBe("唯一候選數");
            const explanation = wrapper.find("[data-testid='walkthrough-explanation']").text();
            expect(explanation).toContain("第");
            expect(explanation).toContain("列");
        });
    });
});
